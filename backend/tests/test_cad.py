import math
import numpy as np
import pytest
import cadquery as cq
from app.cad.fixture import fixture
from app.cad.engine import build, bounds, locks_preserved
from app.cad.checks import run_checks
from app.cad.coordinates import render_points, render_transform, cad_transform, C
from app.schemas import DesignSpec, Recipe, Node, RecipePart, Pose, Component, Enclosure
from app.store import digest


@pytest.mark.parametrize(
    "height,battery_height,gap,shortfall,status",
    [
        (24, 10, 8, 0, "pass"),
        (24, 20, -2, 4, "fail"),
        (28, 20, 2, 0, "pass"),
        (27.999, 20, 1.999, 0.001, "fail"),
    ],
)
def test_actual_fixture_solids(height, battery_height, gap, shortfall, status):
    s = fixture(height, battery_height)
    parts, recipe = build(s)
    checks = run_checks(s, parts, "revision", digest(s.model_dump(mode="json")))
    check = next(x for x in checks if x["check_id"] == "battery_lid_clearance")
    assert check["measured_gap_mm"] == pytest.approx(gap)
    assert check["shortfall_mm"] == pytest.approx(shortfall)
    assert check["status"] == status
    assert set(parts) == {"base", "lid", "controller", "battery"}
    assert all(p["world"].isValid() for p in parts.values())
    assert bounds(parts["lid"]["world"])["max_mm"][2] == pytest.approx(height)
    assert bounds(parts["base"]["world"])["size_mm"] == pytest.approx([88, 62, height - 2])
    overlap = next(x for x in checks if x["check_id"] == "battery_shell_intersection")
    assert (overlap["overlap_mm3"] > 0) == (status == "fail" and gap < 0)


def test_scale_axis_and_asymmetric_orientation():
    assert render_points([100, 100, 100]) == pytest.approx([0.1, 0.1, -0.1])
    assert render_points([0, 0, 100]) == pytest.approx([0, 0.1, 0])
    assert np.linalg.det(C) == pytest.approx(1)
    pose = Pose(
        translation_mm=[10, -20, 30],
        rotation_quaternion_xyzw=[0, 0, math.sin(math.pi / 4), math.cos(math.pi / 4)],
    )
    local = np.array([40, 10, 5, 1.0])
    engineering = cad_transform(pose) @ local
    renderer = render_transform(pose) @ np.r_[render_points(local[:3]), 1]
    assert renderer[:3] == pytest.approx(render_points(engineering[:3]))
    assert renderer[:3] == pytest.approx([0, 0.035, -0.02])


def test_fresh_inputs_three_parts_auto_geometry():
    parts = [
        Component(
            part_id=f"part_{i}",
            name="Measured part",
            size_mm=size,
            pose=Pose(translation_mm=pose),
            dimensions_confirmed=True,
            dimensions_source="user_measurement",
        )
        for i, (size, pose) in enumerate(
            [([12, 8, 4], [-30, -20, 3]), ([15, 12, 7], [0, -20, 3]), ([20, 10, 9], [-10, 5, 3])]
        )
    ]
    spec = DesignSpec(components=parts, enclosure=Enclosure(width_mm=90, depth_mm=60, height_mm=30))
    solids, _ = build(spec)
    assert len(solids) == 5
    checks = run_checks(spec, solids, "fresh", digest(spec.model_dump(mode="json")))
    assert all(x["status"] != "fail" for x in checks)
    assert bounds(solids["base"]["world"])["size_mm"] == pytest.approx([90, 60, 28])


def test_rotation_aware_exact_containment():
    s = fixture()
    s.components[1].pose = Pose(
        translation_mm=[-20, -24, 4],
        rotation_quaternion_xyzw=[0, 0, math.sin(math.pi / 4), math.cos(math.pi / 4)],
    )
    parts, _ = build(s)
    checks = run_checks(s, parts, "r", digest(s.model_dump(mode="json")))
    check = next(x for x in checks if x["check_id"] == "battery_containment")
    assert check["status"] == "pass"
    assert bounds(parts["battery"]["world"])["size_mm"] == pytest.approx([18, 40, 10])


def test_generic_bracket_holes_and_volume(tmp_path):
    recipe = Recipe(
        nodes=[
            Node(id="horizontal", op="box", size_mm=[80, 30, 4], lower_corner_mm=[0, 0, 0]),
            Node(id="vertical", op="box", size_mm=[4, 30, 60], lower_corner_mm=[0, 0, 0]),
            Node(id="joined", op="union", children=["horizontal", "vertical"]),
            Node(
                id="hole1",
                op="cylinder",
                radius_mm=2.5,
                height_mm=8,
                origin_mm=[20, 15, -2],
                axis=[0, 0, 1],
            ),
            Node(
                id="hole2",
                op="cylinder",
                radius_mm=2.5,
                height_mm=8,
                origin_mm=[60, 15, -2],
                axis=[0, 0, 1],
            ),
            Node(id="bracket", op="subtract", base="joined", tools=["hole1", "hole2"]),
        ],
        parts=[RecipePart(id="fresh_bracket", node_id="bracket")],
    )
    spec = DesignSpec(recipe=recipe)
    solids, _ = build(spec)
    s = solids["fresh_bracket"]["world"]
    assert bounds(s)["size_mm"] == pytest.approx([80, 30, 60])
    assert s.Volume() == pytest.approx(
        80 * 30 * 4 + 4 * 30 * 60 - 4 * 30 * 4 - 2 * math.pi * 2.5**2 * 4
    )
    assert not s.isInside(cq.Vector(20, 15, 2))
    assert s.isInside(cq.Vector(40, 15, 2))
    out = tmp_path / "bracket.step"
    cq.exporters.export(s, str(out))
    imported = cq.importers.importStep(str(out)).val()
    assert imported.Volume() == pytest.approx(s.Volume(), rel=1e-8)


def test_locked_height_reports_conflict():
    parent = fixture()
    parent.enclosure.locked_fields.append("height_mm")
    changed = fixture(28, 20)
    changed.enclosure.locked_fields = parent.enclosure.locked_fields[:]
    assert "enclosure.height_mm" in locks_preserved(changed, parent)


@pytest.mark.parametrize(
    "value",
    [
        dict(
            nodes=[dict(id="a", op="translate", child="a", translation_mm=[0, 0, 1])],
            parts=[dict(id="p", node_id="a")],
        ),
        dict(
            nodes=[dict(id="a", op="box", size_mm=[1, -1, 1], lower_corner_mm=[0, 0, 0])],
            parts=[dict(id="p", node_id="a")],
        ),
        dict(
            nodes=[
                dict(
                    id="a",
                    op="cylinder",
                    radius_mm=1,
                    height_mm=2,
                    axis=[0, 0, 2],
                    origin_mm=[0, 0, 0],
                )
            ],
            parts=[dict(id="p", node_id="a")],
        ),
        dict(
            nodes=[
                dict(id="a", op="box", size_mm=[1, 1, 1], lower_corner_mm=[0, 0, 0], shell="rm")
            ],
            parts=[dict(id="p", node_id="a")],
        ),
    ],
)
def test_invalid_bounded_recipes(value):
    with pytest.raises(ValueError):
        Recipe.model_validate(value)
