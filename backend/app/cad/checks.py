from itertools import combinations
from app.cad.engine import bounds, box, locks_preserved

TOLERANCE_MM = 1e-7
VOLUME_TOLERANCE_MM3 = 1e-6


def run_checks(spec, parts, revision_id, spec_hash, parent=None):
    checks = []

    def add(check_id, status, part_ids, basis, message, **values):
        checks.append(
            dict(
                check_id=check_id,
                revision_id=revision_id,
                spec_hash=spec_hash,
                status=status,
                part_ids=part_ids,
                basis=basis,
                message=message,
                tolerance_mm=TOLERANCE_MM,
                **values,
            )
        )

    all_valid = all(
        p["world"].isValid() and p["world"].Volume() > VOLUME_TOLERANCE_MM3 for p in parts.values()
    )
    add(
        "cad_validity",
        "pass" if all_valid else "fail",
        list(parts),
        "OCCT solid validity and positive volume",
        "Kernel validity",
    )
    sane = all(max(bounds(p["world"])["size_mm"]) <= 20000 for p in parts.values())
    add(
        "unit_bounds_sanity",
        "pass" if sane else "fail",
        list(parts),
        "kernel bounds in mm",
        "Finite bounded engineering geometry",
    )
    violations = locks_preserved(spec, parent)
    add(
        "locked_constraints",
        "fail" if violations else "pass",
        list(parts),
        "immutable parent comparison",
        "Locks preserved" if not violations else "Locked values changed",
        violations=violations,
    )
    hardware = (
        [c.part_id for c in spec.components]
        if spec.enclosure
        else [k for k, p in parts.items() if p["part"].role == "hardware_reference"]
    )
    for a, b in combinations(hardware, 2):
        volume = parts[a]["world"].intersect(parts[b]["world"]).Volume()
        add(
            f"{a}_{b}_overlap",
            "pass" if volume <= VOLUME_TOLERANCE_MM3 else "fail",
            [a, b],
            "exact transformed envelope intersection",
            "Hardware envelope conflict",
            overlap_mm3=volume,
        )
    if spec.enclosure:
        e = spec.enclosure
        # Measured slab underside; lip intrusion is checked with exact solid intersections.
        lid = bounds(parts["lid"]["world"])["max_mm"][2] - e.lid_mm
        base_bounds = bounds(parts["base"]["world"])
        # Cavity bounds are authored helper parameters; top plane is measured on the built lid.
        floor = base_bounds["min_mm"][2] + e.base_mm
        cavity = box(
            (e.width_mm - 2 * e.wall_mm, e.depth_mm - 2 * e.wall_mm, lid - floor),
            (-e.width_mm / 2 + e.wall_mm, -e.depth_mm / 2 + e.wall_mm, floor),
        )
        for c in spec.components:
            p = parts[c.part_id]["world"]
            b = bounds(p)
            gap = lid - b["max_mm"][2] - c.keepout_mm[2]
            shortfall = max(0, e.required_clearance_mm - gap)
            add(
                f"{c.part_id}_lid_clearance",
                "pass" if gap + TOLERANCE_MM >= e.required_clearance_mm else "fail",
                [c.part_id, "lid"],
                "transformed envelope bounds versus actual lid underside",
                "Required clearance to lid",
                measured_gap_mm=gap,
                required_gap_mm=e.required_clearance_mm,
                shortfall_mm=shortfall,
            )
            outside = p.cut(cavity).Volume()
            add(
                f"{c.part_id}_containment",
                "pass" if outside <= VOLUME_TOLERANCE_MM3 else "fail",
                [c.part_id, "base", "lid"],
                "exact envelope minus modeled cavity",
                "Envelope containment",
                outside_volume_mm3=outside,
            )
            shell_overlap = (
                p.intersect(parts["base"]["world"]).Volume()
                + p.intersect(parts["lid"]["world"]).Volume()
            )
            add(
                f"{c.part_id}_shell_intersection",
                "pass" if shell_overlap <= VOLUME_TOLERANCE_MM3 else "fail",
                [c.part_id, "base", "lid"],
                "exact envelope intersection with cavity shell and lid",
                "Hardware/shell interference",
                overlap_mm3=shell_overlap,
            )
            k = c.keepout_mm
            if any(k):
                # Conservative world-axis keepout proxy, explicitly identified.
                keepout = box(
                    tuple(b["size_mm"][i] + 2 * k[i] for i in range(3)),
                    tuple(b["min_mm"][i] - k[i] for i in range(3)),
                )
                outside_k = keepout.cut(cavity).Volume()
                add(
                    f"{c.part_id}_keepout",
                    "pass" if outside_k <= VOLUME_TOLERANCE_MM3 else "fail",
                    [c.part_id, "base", "lid"],
                    "conservative world-axis expanded AABB",
                    "Declared keepout containment",
                    outside_volume_mm3=outside_k,
                )
        closure_overlap = parts["base"]["world"].intersect(parts["lid"]["world"]).Volume()
        add(
            "base_lid_intersection",
            "pass" if closure_overlap <= VOLUME_TOLERANCE_MM3 else "fail",
            ["base", "lid"],
            "exact assembled printable solid intersection",
            "Base/lid interference",
            overlap_mm3=closure_overlap,
        )
        add(
            "wall_parameter",
            "pass" if e.wall_mm + TOLERANCE_MM >= e.minimum_wall_mm else "fail",
            ["base"],
            "authored helper parameter; not local wall analysis",
            "Minimum configured wall",
            wall_mm=e.wall_mm,
            minimum_wall_mm=e.minimum_wall_mm,
        )
    else:
        for c in spec.recipe.constraints:
            a, b = (parts[k]["world"] for k in c.part_ids)
            volume = a.intersect(b).Volume()
            distance = a.distance(b)
            ok = volume <= VOLUME_TOLERANCE_MM3 and (
                c.kind == "non_intersection" or distance + TOLERANCE_MM >= c.required_mm
            )
            add(
                c.id,
                "pass" if ok else "fail",
                list(c.part_ids),
                "OCCT exact intersection/minimum distance",
                "Declared recipe constraint",
                overlap_mm3=volume,
                measured_gap_mm=distance,
                required_gap_mm=c.required_mm,
            )
    if spec.printer_volume_mm:
        for key, p in parts.items():
            if p["part"].role != "printable_cad":
                continue
            b = bounds(p["local"])
            ok = all(x <= y + TOLERANCE_MM for x, y in zip(b["size_mm"], spec.printer_volume_mm))
            add(
                f"{key}_printer_bounds",
                "pass" if ok else "fail",
                [key],
                "local export bounds; no slicer analysis",
                "Supplied printer volume",
                size_mm=b["size_mm"],
            )
    else:
        add(
            "printer_volume",
            "unknown",
            [],
            "not supplied",
            "Printer volume not supplied",
            required=False,
        )
    for name in ["closure_fit", "thermal", "electrical", "strength", "slicing"]:
        add(
            name,
            "unknown",
            [],
            "not implemented",
            f"{name} unverified",
            required=name in spec.requested_analyses,
        )
    supported = {c["check_id"] for c in checks}
    for name in spec.requested_analyses:
        if name not in supported:
            add(
                name,
                "unknown",
                [],
                "not implemented",
                "Requested analysis unsupported",
                required=True,
            )
    return checks
