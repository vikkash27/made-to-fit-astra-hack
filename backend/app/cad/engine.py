"""Authored bounded CAD handlers. Never executes model-generated code."""

import math
import cadquery as cq
from app.schemas import DesignSpec, Pose


def place(shape, pose):
    # Quaternion location is a rigid kernel transform, preserving circles and cylinders.
    from OCP.gp import gp_Quaternion, gp_Trsf, gp_Vec

    t = gp_Trsf()
    t.SetRotation(gp_Quaternion(*pose.rotation_quaternion_xyzw))
    t.SetTranslationPart(gp_Vec(*pose.translation_mm))
    return shape.moved(cq.Location(t))


def box(size, origin):
    return cq.Solid.makeBox(*size, cq.Vector(*origin))


def lower_enclosure(spec):
    """Lower helper to the same flat operation recipe used for custom geometry."""
    from app.schemas import Recipe, Node, RecipePart

    e = spec.enclosure
    nodes = [
        Node(
            id="outside",
            op="box",
            size_mm=(e.width_mm, e.depth_mm, e.height_mm - e.lid_mm),
            lower_corner_mm=(-e.width_mm / 2, -e.depth_mm / 2, 0),
        ),
        Node(
            id="cavity",
            op="box",
            size_mm=(e.width_mm - 2 * e.wall_mm, e.depth_mm - 2 * e.wall_mm, e.height_mm),
            lower_corner_mm=(-e.width_mm / 2 + e.wall_mm, -e.depth_mm / 2 + e.wall_mm, e.base_mm),
        ),
        Node(id="base_solid", op="subtract", base="outside", tools=["cavity"]),
        Node(
            id="lid_solid",
            op="box",
            size_mm=(e.width_mm, e.depth_mm, e.lid_mm),
            lower_corner_mm=(0, 0, 0),
        ),
    ]
    if e.lid_register_mm:
        inset = e.wall_mm + e.lid_fit_clearance_mm
        # Hollow removable locating lip, joined to the lid slab. No screw pattern is inferred.
        nodes[3].id = "lid_plate"
        nodes.extend(
            [
                Node(
                    id="lip_outer",
                    op="box",
                    size_mm=(e.width_mm - 2 * inset, e.depth_mm - 2 * inset, e.lid_register_mm),
                    lower_corner_mm=(inset, inset, -e.lid_register_mm),
                ),
                Node(
                    id="lip_inner",
                    op="box",
                    size_mm=(
                        e.width_mm - 2 * (inset + e.wall_mm),
                        e.depth_mm - 2 * (inset + e.wall_mm),
                        e.lid_register_mm,
                    ),
                    lower_corner_mm=(inset + e.wall_mm, inset + e.wall_mm, -e.lid_register_mm),
                ),
                Node(id="lid_lip", op="subtract", base="lip_outer", tools=["lip_inner"]),
                Node(id="lid_solid", op="union", children=["lid_plate", "lid_lip"]),
            ]
        )
    parts = [
        RecipePart(id="base", node_id="base_solid"),
        RecipePart(
            id="lid",
            node_id="lid_solid",
            pose=Pose(translation_mm=(-e.width_mm / 2, -e.depth_mm / 2, e.height_mm - e.lid_mm)),
        ),
    ]
    for i, c in enumerate(spec.components):
        n = f"component_{i}"
        nodes.append(Node(id=n, op="box", size_mm=c.size_mm, lower_corner_mm=(0, 0, 0)))
        parts.append(RecipePart(id=c.part_id, node_id=n, role="hardware_reference", pose=c.pose))
    return Recipe(nodes=nodes, parts=parts)


def build(spec: DesignSpec):
    recipe = spec.recipe or lower_enclosure(spec)
    nodes = {n.id: n for n in recipe.nodes}
    memo = {}

    def evaluate(key):
        if key in memo:
            return memo[key]
        n = nodes[key]
        if n.op == "box":
            s = box(n.size_mm, n.lower_corner_mm)
        elif n.op == "cylinder":
            s = cq.Solid.makeCylinder(
                n.radius_mm, n.height_mm, cq.Vector(*n.origin_mm), cq.Vector(*n.axis)
            )
        elif n.op == "translate":
            s = evaluate(n.child).translate(n.translation_mm)
        elif n.op == "rotate":
            p = n.pivot_mm
            s = evaluate(n.child).translate(tuple(-x for x in p))
            s = place(s, Pose(rotation_quaternion_xyzw=n.quaternion_xyzw)).translate(p)
        elif n.op == "union":
            children = [evaluate(x) for x in n.children]
            s = children[0].fuse(*children[1:]).clean()
            if len(s.Solids()) != 1:
                raise ValueError(
                    f"Node {key}: union produces disconnected solids; use assembly parts"
                )
        elif n.op == "subtract":
            s = evaluate(n.base).cut(*(evaluate(x) for x in n.tools)).clean()
        else:
            raise ValueError("Unsupported CAD operation")
        if not s.isValid() or not s.Solids() or s.Volume() <= 1e-9:
            raise ValueError(f"Node {key}: invalid or empty solid")
        memo[key] = s
        return s

    parts = {
        p.id: dict(local=evaluate(p.node_id), world=place(evaluate(p.node_id), p.pose), part=p)
        for p in recipe.parts
    }
    return parts, recipe


def bounds(shape):
    b = shape.BoundingBox()
    return dict(
        min_mm=[b.xmin, b.ymin, b.zmin],
        max_mm=[b.xmax, b.ymax, b.zmax],
        size_mm=[b.xlen, b.ylen, b.zlen],
    )


def locks_preserved(spec, parent):
    failures = []
    if not parent:
        return failures

    def equal(a, b):
        if isinstance(a, (list, tuple)):
            return len(a) == len(b) and all(equal(x, y) for x, y in zip(a, b))
        if isinstance(a, dict):
            return a.keys() == b.keys() and all(equal(a[k], b[k]) for k in a)
        if isinstance(a, (int, float)):
            return math.isclose(a, b, abs_tol=1e-7, rel_tol=0)
        return a == b

    if parent.enclosure:
        if not spec.enclosure:
            failures.append("enclosure helper removed")
        else:
            for field in parent.enclosure.locked_fields:
                if not equal(getattr(parent.enclosure, field), getattr(spec.enclosure, field)):
                    failures.append(f"enclosure.{field}")
            if not set(parent.enclosure.locked_fields).issubset(spec.enclosure.locked_fields):
                failures.append("enclosure.locked_fields removed without review")
    current = {c.part_id: c for c in spec.components}
    for old in parent.components:
        for field in old.locked_fields:
            new = current.get(old.part_id)
            if not new or not equal(
                getattr(old, field).model_dump() if field == "pose" else getattr(old, field),
                getattr(new, field).model_dump() if field == "pose" else getattr(new, field),
            ):
                failures.append(f"{old.part_id}.{field}")
        if old.locked_fields and (
            old.part_id not in current
            or not set(old.locked_fields).issubset(current[old.part_id].locked_fields)
        ):
            failures.append(f"{old.part_id}.locked_fields removed without review")
    return failures
