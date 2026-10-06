"""Core 3MF geometry packages: immutable CAD meshes, independent bed placements."""

from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile, ZIP_DEFLATED

import numpy as np
import trimesh

CORE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
RELS = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"
ET.register_namespace("", CORE)


def printable_mesh(shape):
    vertices, faces = shape.tessellate(0.1, 0.1)
    # OCCT tessellation repeats vertices on adjoining faces; weld these seams.
    mesh = trimesh.Trimesh(vertices=[v.toTuple() for v in vertices], faces=faces, process=True)
    if not mesh.is_watertight or not mesh.is_winding_consistent or mesh.volume <= 0:
        raise ValueError("Printable tessellation must be closed and consistently oriented")
    return mesh


def arrange(meshes, bed, gap=10):
    """Row packing, normalized Z=0. Assembly placements are never modified."""
    placements = []
    x = y = row_height = 0.0
    for key, mesh in meshes:
        size = mesh.extents
        if np.any(size > np.asarray(bed) + 1e-7):
            return None
        if x + size[0] > bed[0] + 1e-7:
            x, y, row_height = 0.0, y + row_height + gap, 0.0
        if y + size[1] > bed[1] + 1e-7:
            return None
        origin = np.array([x, y, 0.0]) - mesh.bounds[0]
        placements.append(dict(part_id=key, translation_mm=origin.tolist()))
        x += size[0] + gap
        row_height = max(row_height, size[1])
    if placements:
        # Center the used footprint, retaining the original orientation.
        max_xy = np.max(
            [
                m.bounds[1][:2] + np.array(p["translation_mm"][:2])
                for (_, m), p in zip(meshes, placements)
            ],
            axis=0,
        )
        center = (np.asarray(bed[:2]) - max_xy) / 2
        for p in placements:
            p["translation_mm"][:2] = (np.array(p["translation_mm"][:2]) + center).tolist()
    return placements


def write_3mf(path: Path, meshes, placements, revision_id, spec_hash):
    model = ET.Element(
        f"{{{CORE}}}model",
        unit="millimeter",
        attrib={"{http://www.w3.org/XML/1998/namespace}lang": "en-US"},
    )
    for name, value in [
        ("Title", "Made to Fit printable CAD"),
        (
            "Description",
            f"Revision {revision_id}; specification {spec_hash}; geometry only, slice before printing",
        ),
    ]:
        ET.SubElement(model, f"{{{CORE}}}metadata", name=name).text = value
    resources = ET.SubElement(model, f"{{{CORE}}}resources")
    build = ET.SubElement(model, f"{{{CORE}}}build")
    for index, ((key, mesh), placement) in enumerate(zip(meshes, placements), start=1):
        obj = ET.SubElement(resources, f"{{{CORE}}}object", id=str(index), type="model", name=key)
        node = ET.SubElement(obj, f"{{{CORE}}}mesh")
        vertices = ET.SubElement(node, f"{{{CORE}}}vertices")
        for v in mesh.vertices:
            ET.SubElement(
                vertices,
                f"{{{CORE}}}vertex",
                **dict(zip("xyz", [format(float(n), ".12g") for n in v])),
            )
        triangles = ET.SubElement(node, f"{{{CORE}}}triangles")
        for face in mesh.faces:
            ET.SubElement(
                triangles,
                f"{{{CORE}}}triangle",
                **{f"v{i + 1}": str(int(n)) for i, n in enumerate(face)},
            )
        transform = [1, 0, 0, 0, 1, 0, 0, 0, 1, *placement["translation_mm"]]
        ET.SubElement(
            build,
            f"{{{CORE}}}item",
            objectid=str(index),
            transform=" ".join(format(n, ".12g") for n in transform),
        )
    types = ET.Element(f"{{{CT}}}Types")
    ET.SubElement(
        types,
        f"{{{CT}}}Default",
        Extension="rels",
        ContentType="application/vnd.openxmlformats-package.relationships+xml",
    )
    ET.SubElement(
        types,
        f"{{{CT}}}Override",
        PartName="/3D/3dmodel.model",
        ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
    )
    relationships = ET.Element(f"{{{RELS}}}Relationships")
    ET.SubElement(
        relationships,
        f"{{{RELS}}}Relationship",
        Id="rel0",
        Target="/3D/3dmodel.model",
        Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel",
    )
    with ZipFile(path, "w", compression=ZIP_DEFLATED) as package:
        for filename, element in [
            ("[Content_Types].xml", types),
            ("_rels/.rels", relationships),
            ("3D/3dmodel.model", model),
        ]:
            # Bambu's relationship reader expects unprefixed tags with a default namespace.
            ET.register_namespace("", element.tag.split("}")[0][1:])
            package.writestr(filename, ET.tostring(element, encoding="utf-8", xml_declaration=True))
