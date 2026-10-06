import io
from xml.etree import ElementTree as ET
from zipfile import ZipFile

import numpy as np
import pytest
import trimesh
from app.cad.fixture import fixture
from app.cad.engine import build, bounds
from app.cad.checks import run_checks
from app.cad.print_export import arrange, printable_mesh, CORE
from app.schemas import DesignSpec
from conftest import project, candidate, built, post


def read_meshes(data):
    with ZipFile(io.BytesIO(data)) as package:
        assert set(package.namelist()) == {"[Content_Types].xml", "_rels/.rels", "3D/3dmodel.model"}
        # Bambu's native relationship reader requires default, unprefixed namespaces.
        for filename, root_tag in (
            ("[Content_Types].xml", "Types"),
            ("_rels/.rels", "Relationships"),
            ("3D/3dmodel.model", "model"),
        ):
            assert f'<{root_tag} xmlns="'.encode() in package.read(filename)
        model = ET.fromstring(package.read("3D/3dmodel.model"))
    assert model.attrib["unit"] == "millimeter"
    meshes = {}
    for obj in model.findall(f"{{{CORE}}}resources/{{{CORE}}}object"):
        vertices = [
            [float(v.attrib[k]) for k in "xyz"]
            for v in obj.findall(f"{{{CORE}}}mesh/{{{CORE}}}vertices/{{{CORE}}}vertex")
        ]
        faces = [
            [int(v.attrib[k]) for k in ("v1", "v2", "v3")]
            for v in obj.findall(f"{{{CORE}}}mesh/{{{CORE}}}triangles/{{{CORE}}}triangle")
        ]
        meshes[obj.attrib["id"]] = (
            obj.attrib["name"],
            trimesh.Trimesh(vertices=vertices, faces=faces, process=False),
        )
    for item in model.findall(f"{{{CORE}}}build/{{{CORE}}}item"):
        values = np.array([float(n) for n in item.attrib["transform"].split()])
        assert len(values) == 12
        meshes[item.attrib["objectid"]][1].apply_translation(values[-3:])
    return dict(meshes.values())


def test_p2s_accepted_export_contains_only_closed_printable_geometry(api):
    client, _ = api
    s = fixture(30, 10)
    s.enclosure.lid_register_mm = 2
    p = project(client, s.model_dump(mode="json"))
    r = built(client, candidate(client, p, s.model_dump(mode="json")))
    assert r["eligible_for_acceptance"]
    assert r["spec"]["printer_model"] == "bambu_p2s"
    assert r["spec"]["printer_volume_mm"] == [256, 256, 256]
    post(
        client,
        f"/revisions/{r['id']}/accept",
        dict(client_operation_id="accept-p2s", expected_active_parent=None),
    )
    a = next(a for a in r["artifacts"] if a["filename"] == "enclosure.3mf")
    assert a["revision_id"] == r["id"] and a["spec_hash"] == r["spec_hash"]
    meshes = read_meshes(client.get(a["url"]).content)
    assert set(meshes) == {"base", "lid"}  # Hardware and Rodin meshes never become print parts.
    solids, _ = build(s)
    for key, mesh in meshes.items():
        assert mesh.is_watertight and mesh.is_winding_consistent
        assert mesh.volume == pytest.approx(solids[key]["local"].Volume(), rel=1e-5)
        assert mesh.bounds[0][2] == pytest.approx(0, abs=1e-7)
        assert np.all(mesh.bounds[0] >= -1e-7) and np.all(mesh.bounds[1] <= 256 + 1e-7)
    assert meshes["lid"].extents == pytest.approx([88, 62, 4])
    # Flip places the full lid slab at z=0; the ring rises above it.
    assert meshes["lid"].section([0, 0, 1], [0, 0, 1]).bounds[1] - meshes["lid"].section(
        [0, 0, 1], [0, 0, 1]
    ).bounds[0] == pytest.approx([88, 62, 0])
    assert meshes["base"].bounds[1][0] + 10 <= meshes["lid"].bounds[0][0] + 1e-7


def test_lid_register_clearance_and_interference():
    s = fixture(30, 10)
    s.enclosure.lid_register_mm = 2
    parts, recipe = build(s)
    lip = parts["lid"]["world"]
    assert lip.isValid() and len(lip.Solids()) == 1
    assert bounds(lip)["size_mm"][2] == pytest.approx(4)
    assert parts["base"]["world"].intersect(lip).Volume() == pytest.approx(0)
    assert (
        next(
            c for c in run_checks(s, parts, "r", "hash") if c["check_id"] == "base_lid_intersection"
        )["status"]
        == "pass"
    )
    # A tall envelope near the cavity edge intrudes into the register ring.
    s.components[1].size_mm = (40, 18, 23)
    s.components[1].pose.translation_mm = (-41.5, -27.5, 4)
    parts, _ = build(s)
    check = next(
        c
        for c in run_checks(s, parts, "r", "hash")
        if c["check_id"] == "battery_shell_intersection"
    )
    assert check["status"] == "fail" and check["overlap_mm3"] > 0


def test_oversized_part_fails_and_separate_plates_remain_possible():
    s = fixture()
    s.printer_volume_mm = (256, 256, 256)
    s.enclosure.width_mm = 257
    parts, _ = build(s)
    assert (
        next(c for c in run_checks(s, parts, "r", "h") if c["check_id"] == "base_printer_bounds")[
            "status"
        ]
        == "fail"
    )
    s.enclosure.width_mm = 200
    s.enclosure.depth_mm = 180
    parts, _ = build(s)
    meshes = [(key, printable_mesh(parts[key]["local"])) for key in ("base", "lid")]
    assert arrange(meshes, [256, 256, 256]) is None
    assert all(arrange([m], [256, 256, 256]) for m in meshes)
    assert (
        bounds(parts["base"]["world"])["min_mm"][0] == pytest.approx(-100, abs=1e-6)
    )  # Packing does not move engineering CAD.


def test_invalid_register_and_inconsistent_p2s_volume_rejected():
    s = fixture().model_dump(mode="json")
    s["enclosure"]["lid_register_mm"] = 21
    with pytest.raises(ValueError):
        DesignSpec.model_validate(s)
    s = fixture().model_dump(mode="json")
    s["printer_model"] = "bambu_p2s"
    s["printer_volume_mm"] = [300, 300, 300]
    with pytest.raises(ValueError):
        DesignSpec.model_validate(s)
