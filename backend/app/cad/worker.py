"""One subprocess per CAD task: bounded runtime, native crash isolation, frozen inputs."""

import hashlib
import json
import sys
from pathlib import Path
import cadquery as cq
import numpy as np
import trimesh
from app.cad.engine import build, bounds
from app.cad.checks import run_checks
from app.cad.coordinates import render_points, render_transform
from app.cad.print_export import printable_mesh, arrange, write_3mf
from app.schemas import DesignSpec
from app.store import digest


def execute(input_path, output_dir):
    request = json.loads(Path(input_path).read_text())
    spec = DesignSpec.model_validate(request["spec"])
    parent = (
        DesignSpec.model_validate(request["parent_spec"]) if request.get("parent_spec") else None
    )
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    parts, recipe = build(spec)
    checks = run_checks(spec, parts, request["revision_id"], request["spec_hash"], parent)
    files = []

    def register(filename, role, mime, part_id=None, units=None, frame=None):
        p = output / filename
        files.append(
            dict(
                filename=filename,
                role=role,
                mime_type=mime,
                part_id=part_id,
                units=units,
                frame=frame,
                sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
                size_bytes=p.stat().st_size,
            )
        )
        return filename

    scene = trimesh.Scene()
    manifest_parts = []
    printable = []
    print_meshes = []
    component_map = {c.part_id: c for c in spec.components}
    for key, p in parts.items():
        part = p["part"]
        local, world = p["local"], p["world"]
        vertices, triangles = local.tessellate(0.1, 0.1)
        v = render_points([x.toTuple() for x in vertices])
        mesh = trimesh.Trimesh(vertices=v, faces=np.asarray(triangles), process=False)
        mesh.visual.face_colors = (
            [180, 187, 190, 255] if part.role == "printable_cad" else [208, 154, 105, 255]
        )
        preview_file = f"{key}.glb"
        trimesh.Scene(mesh).export(output / preview_file, file_type="glb")
        register(
            preview_file,
            "cad_preview" if part.role == "printable_cad" else "envelope_preview",
            "model/gltf-binary",
            key,
            "m",
            "renderer_y_up",
        )
        json_mesh = f"{key}.mesh.json"
        (output / json_mesh).write_text(
            json.dumps(
                {
                    "positions": v.reshape(-1).tolist(),
                    "indices": np.asarray(triangles).reshape(-1).tolist(),
                    "units": "m",
                    "frame": "renderer_y_up",
                    "geometry_space": "part_local",
                    "part_id": key,
                    "revision_id": request["revision_id"],
                    "spec_hash": request["spec_hash"],
                }
            )
        )
        register(json_mesh, "preview_mesh", "application/json", key, "m", "renderer_y_up")
        scene.add_geometry(
            mesh, node_name=key, geom_name=key, transform=render_transform(part.pose)
        )
        exports = []
        if part.role == "printable_cad":
            for extension, mime in [("stl", "model/stl"), ("step", "model/step")]:
                filename = f"{key}.{extension}"
                cq.exporters.export(
                    local, str(output / filename), tolerance=0.1, angularTolerance=0.1
                )
                register(filename, "printable_cad", mime, key, "mm", "engineering_z_up_part_local")
                exports.append(filename)
            printable.append(world)
            print_mesh = printable_mesh(local)
            # Lid slab faces the bed; the locating lip prints upward without changing assembled CAD.
            if spec.enclosure and key == "lid" and spec.enclosure.lid_register_mm:
                print_mesh.apply_transform(
                    trimesh.transformations.rotation_matrix(np.pi, [1, 0, 0])
                )
            print_meshes.append((key, print_mesh))
        c = component_map.get(key)
        manifest_parts.append(
            dict(
                part_id=key,
                name=c.name if c else key.title(),
                role=part.role,
                printable_output=part.role == "printable_cad",
                size_mm=list(c.size_mm) if c else bounds(local)["size_mm"],
                pose=part.pose.model_dump(mode="json"),
                renderer_transform_matrix=render_transform(part.pose).T.reshape(-1).tolist(),
                geometry_provenance="cadquery"
                if part.role == "printable_cad"
                else "confirmed_dimensioned_envelope",
                dimensions_source=c.dimensions_source if c else "frozen_recipe",
                bounds=bounds(world),
                local_bounds=bounds(local),
                preview_filename=preview_file,
                mesh_filename=json_mesh,
                export_filenames=exports,
                visual_asset_id=c.visual_asset_id if c else None,
                volume_mm3=world.Volume(),
            )
        )
    scene.export(output / "assembly.glb", file_type="glb")
    register(
        "assembly.glb", "assembly_preview", "model/gltf-binary", units="m", frame="renderer_y_up"
    )
    if printable:
        cq.exporters.export(cq.Compound.makeCompound(printable), str(output / "enclosure.step"))
        register(
            "enclosure.step",
            "cad_assembly",
            "model/step",
            units="mm",
            frame="engineering_z_up_assembly",
        )
    print_layout = dict(
        revision_id=request["revision_id"],
        spec_hash=request["spec_hash"],
        printer_model=spec.printer_model,
        build_volume_mm=spec.printer_volume_mm,
        units="mm",
        frame="engineering_z_up",
        geometry_only=True,
        nozzle_mm=None,
        filament=None,
        slicing_verified=False,
        lid_flipped_for_print=bool(spec.enclosure and spec.enclosure.lid_register_mm),
        note="Import as geometry in Bambu Studio; select printer, nozzle, filament and slice. Bed exclusions, brim and support space require slicer review.",
        plates=[],
    )
    if spec.printer_volume_mm and print_meshes:
        bed = spec.printer_volume_mm
        # Individual plates allow printing parts separately when one combined plate is too large.
        for key, mesh in print_meshes:
            placements = arrange([(key, mesh)], bed)
            if placements:
                filename = f"{key}.3mf"
                write_3mf(
                    output / filename,
                    [(key, mesh)],
                    placements,
                    request["revision_id"],
                    request["spec_hash"],
                )
                register(
                    filename, "print_plate", "model/3mf", key, "mm", "engineering_z_up_print_bed"
                )
                print_layout["plates"].append(dict(filename=filename, placements=placements))
        placements = arrange(print_meshes, bed)
        if placements:
            filename = "enclosure.3mf"
            write_3mf(
                output / filename,
                print_meshes,
                placements,
                request["revision_id"],
                request["spec_hash"],
            )
            register(
                filename, "print_plate", "model/3mf", units="mm", frame="engineering_z_up_print_bed"
            )
            print_layout["plates"].insert(0, dict(filename=filename, placements=placements))
    for filename, value, role in [
        ("design.json", spec.model_dump(mode="json"), "design_record"),
        ("recipe.json", recipe.model_dump(mode="json"), "recipe"),
        ("checks.json", checks, "checks"),
        ("sources.json", request.get("sources", []), "sources"),
        ("print-layout.json", print_layout, "design_record"),
    ]:
        (output / filename).write_text(json.dumps(value, indent=2, allow_nan=False))
        register(filename, role, "application/json")
    manifest = dict(
        schema_version=1,
        revision_id=request["revision_id"],
        spec_hash=request["spec_hash"],
        recipe_hash=digest(recipe.model_dump(mode="json")),
        units="mm",
        frame="engineering_z_up",
        parts=manifest_parts,
        preview=dict(
            units="m",
            frame="renderer_y_up",
            conversion_applied=True,
            geometry_space="part_local",
            assembly_filename="assembly.glb",
            conversion="(x,y,z) -> (x/1000,z/1000,-y/1000)",
            transform_order=[
                "appearance_calibration",
                "engineering_placement",
                "frontend_display_offset",
            ],
        ),
        calibration=dict(
            cube_100mm_renderer_size_m=[0.1, 0.1, 0.1],
            engineering_positive_z_renderer=[0, 0.1, 0],
            engineering_positive_y_renderer=[0, 0, -0.1],
        ),
        artifact_files=files,
        checks=checks,
    )
    (output / "result.json").write_text(json.dumps(manifest, indent=2, allow_nan=False))
    return manifest


if __name__ == "__main__":
    execute(sys.argv[1], sys.argv[2])
