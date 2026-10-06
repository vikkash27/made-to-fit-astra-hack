"""Revision-bound mechanical instructions. No model-generated pinouts or slicer claims."""


def build_guide(revision, manifest):
    concept = revision.get("concept_snapshot") or {}
    parts = [
        dict(
            part_id=p["part_id"],
            name=p["name"],
            role=p["role"],
            size_mm=p["size_mm"],
            position_mm=p["pose"]["translation_mm"],
        )
        for p in manifest["parts"]
    ]
    printed = [p for p in parts if p["role"] == "printable_cad"]
    hardware = [p for p in parts if p["role"] == "hardware_reference"]
    enclosure = revision["spec"].get("enclosure")
    unresolved = list(concept.get("assumptions", []))
    unresolved += [
        "Confirm each module's exact pinout, supply voltage, polarity and interface compatibility from its manufacturer documentation before connecting power.",
        "Component envelopes establish space only. Mounting, cable paths, connector access and any screen or sensor openings need review before a final print.",
        "Choose filament, nozzle, orientation, supports and layer settings in your slicer; these files contain geometry, not a verified print profile.",
    ]
    if enclosure and not enclosure.get("lid_register_mm"):
        unresolved.append(
            "This lid has no locating register. Decide and validate how it will be retained before final assembly."
        )
    elif enclosure:
        unresolved.append(
            "The lid register locates the lid; retention and printed fit still require a physical test."
        )
    steps = []

    def step(key, title, instruction, check, ids=(), review=False):
        steps.append(
            dict(
                id=key,
                title=title,
                instruction=instruction,
                completion_check=check,
                part_ids=list(ids),
                requires_review=review,
            )
        )

    step(
        "prepare",
        "Gather the parts and resolve the open decisions",
        "Match each physical module to the hardware list below. Gather the additional hardware and firmware listed for the chosen concept. Review the unresolved decisions before printing or powering the circuit.",
        "Each module matches the reviewed identity and measured size; outstanding dependencies are understood.",
        [p["part_id"] for p in hardware],
        True,
    )
    step(
        "bench",
        "Prove the electronics outside the enclosure",
        "Use the exact module documentation to plan wiring and load the listed firmware. Confirm the intended function on the bench before enclosing the parts. No pin-to-pin wiring diagram has been verified by this platform.",
        "The circuit's intended function works on the bench using a separately verified wiring and power plan.",
        [p["part_id"] for p in hardware],
        True,
    )
    step(
        "slice",
        "Open the printable parts in your slicer",
        "Use the 3MF print plates when available, or import the individual STL files in millimetres at 100% scale. Print only the enclosure parts listed below. Select your actual printer, nozzle and filament; inspect every layer, bed fit, supports and openings before starting.",
        "The slicer contains only printable CAD, at the listed dimensions, with a reviewed toolpath.",
        [p["part_id"] for p in printed],
        True,
    )
    step(
        "print",
        "Print and test the empty enclosure",
        "Print the enclosure parts. Remove any supports, let the parts cool, and test their fit without electronics or power. If the lid or any part needs force, return to the design and create a new checked revision.",
        "The printed parts fit without force, and the dimensions match the intended hardware space.",
        [p["part_id"] for p in printed],
    )
    for p in hardware:
        size = " × ".join(f"{v:g}" for v in p["size_mm"])
        position = ", ".join(f"{v:g}" for v in p["position_mm"])
        step(
            f"fit-{p['part_id']}",
            f"Dry-fit {p['name']}",
            f"With power disconnected, compare this module with its {size} mm envelope in the assembly view. The model's local origin is at X, Y, Z = ({position}) mm in the assembly frame. Use the viewer to check its orientation. Check connector access and wire space, and choose a verified retention method; the envelope is not a mounting fixture.",
            "The module fits without stress, can be retained, and leaves access for its connectors and wires.",
            [p["part_id"], *(["base"] if enclosure else [])],
            True,
        )
    step(
        "close",
        "Route the wiring and test the closure",
        "Disconnect power. Follow your verified wiring plan, keep wires clear of the lid and moving interfaces, and check that no conductive surface can short against another part. Test the closure without trapping wires or loading the components.",
        "Parts are retained, connectors remain accessible, and the closure does not pinch wires or press on modules.",
        [p["part_id"] for p in parts],
        True,
    )
    step(
        "test",
        "Test the finished build against its purpose",
        "After separately verifying power and wiring, test the project against its intended purpose. If fit, access or closure needs a change, revise the design and repeat the build and acceptance checks before printing a replacement.",
        "The intended function works in the enclosure, and any electrical, heat or retention concerns have been resolved separately.",
        [p["part_id"] for p in parts],
        True,
    )
    return dict(
        schema_version=1,
        revision_id=revision["id"],
        spec_hash=revision["spec_hash"],
        title=concept.get("title") or "Your electronics build",
        purpose=revision.get("goal_snapshot"),
        parts=parts,
        additional_hardware=concept.get("additional_hardware", []),
        software_dependencies=concept.get("software_firmware_dependencies", []),
        unresolved=unresolved,
        steps=steps,
        checks=[
            dict(name=c["check_id"].replace("_", " "), status=c["status"], detail=c["message"])
            for c in manifest["checks"]
        ],
    )


def guide_markdown(guide):
    lines = [
        f"# {guide['title']} — print and assembly guide",
        "",
        f"Revision: {guide['revision_id']}",
        f"Specification: {guide['spec_hash']}",
        "",
        guide["purpose"] or "Purpose not recorded.",
        "",
        "## Parts",
    ]
    for p in guide["parts"]:
        size = " × ".join(f"{v:g}" for v in p["size_mm"])
        lines.append(f"- {p['name']} ({p['part_id']}) — {p['role']}, {size} mm")
    for title, values in [
        ("Additional hardware", guide["additional_hardware"]),
        ("Software and firmware", guide["software_dependencies"]),
        ("Decisions to review", guide["unresolved"]),
    ]:
        lines += ["", f"## {title}", "", *[f"- {v}" for v in values]]
        if not values:
            lines.append("None listed. This does not verify completeness.")
    lines += ["", "## Assembly"]
    for i, s in enumerate(guide["steps"], 1):
        lines += [
            "",
            f"### {i}. {s['title']}",
            "",
            s["instruction"],
            "",
            f"Check before continuing: {s['completion_check']}",
        ]
    lines += ["", "## Geometry check coverage", ""]
    lines += [f"- {c['name']}: {c['status']} — {c['detail']}" for c in guide["checks"]]
    lines += [
        "",
        "Wiring, firmware, thermal performance, retention and slicer settings require separate validation.",
        "",
    ]
    return "\n".join(lines)
