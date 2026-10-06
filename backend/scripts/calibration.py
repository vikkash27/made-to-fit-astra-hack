"""Actual exported 100 mm cube and translated, rotated asymmetric part proof."""

import io
import json
import math
from pathlib import Path
import httpx
import numpy as np
import trimesh
from app.schemas import Recipe, Node, RecipePart, Pose, DesignSpec
from scripts.live_smoke import wait


def run():
    recipe = Recipe(
        nodes=[
            Node(id="cube_node", op="box", size_mm=[100, 100, 100], lower_corner_mm=[0, 0, 0]),
            Node(id="asymmetric_node", op="box", size_mm=[10, 20, 30], lower_corner_mm=[0, 0, 0]),
        ],
        parts=[
            RecipePart(id="cube_100mm", node_id="cube_node"),
            RecipePart(
                id="asymmetric_marker",
                node_id="asymmetric_node",
                pose=Pose(
                    translation_mm=[200, -100, 50],
                    rotation_quaternion_xyzw=[0, 0, math.sin(math.pi / 4), math.cos(math.pi / 4)],
                ),
            ),
        ],
    )
    spec = DesignSpec(recipe=recipe).model_dump(mode="json")
    with httpx.Client(base_url="http://127.0.0.1:8000", timeout=30) as client:

        def post(url, body):
            r = client.post(url, json=body)
            r.raise_for_status()
            return r.json()

        p = post(
            "/projects",
            dict(
                name="Unit and axis calibration",
                intent_mode="idea",
                goal="Verify exported scale and asymmetric placement",
                spec=spec,
            ),
        )
        r = post(
            f"/projects/{p['id']}/candidates",
            dict(
                client_operation_id="calibration",
                expected_draft_version=1,
                parent_revision_id=None,
                spec=spec,
            ),
        )
        job = wait(
            client,
            post(f"/revisions/{r['id']}/build", dict(client_operation_id="build-calibration")),
        )
        assert job["stage"] == "ready", job["error"]
        manifest = client.get(f"/revisions/{r['id']}/assembly").json()
        scene = trimesh.load(
            io.BytesIO(client.get(manifest["preview"]["assembly_artifact"]["url"]).content),
            file_type="glb",
            force="scene",
        )
        proof = []
        for part in manifest["parts"]:
            transform, name = scene.graph[part["part_id"]]
            geometry = scene.geometry[name]
            vertices = trimesh.transform_points(geometry.vertices, transform)
            size = vertices.max(axis=0) - vertices.min(axis=0)
            if part["part_id"] == "cube_100mm":
                assert np.allclose(size, [0.1, 0.1, 0.1], atol=1e-8)
                assert np.allclose(vertices.min(axis=0), [0, 0, -0.1], atol=1e-8)
            else:
                assert np.allclose(size, [0.02, 0.03, 0.01], atol=1e-8)
                assert np.allclose(vertices.min(axis=0), [0.18, 0.05, 0.09], atol=1e-8)
            proof.append(
                dict(
                    part_id=part["part_id"],
                    actual_renderer_bounds_m=[
                        vertices.min(axis=0).tolist(),
                        vertices.max(axis=0).tolist(),
                    ],
                    actual_size_m=size.tolist(),
                )
            )
        result = dict(
            revision_id=r["id"],
            spec_hash=r["spec_hash"],
            assembly_url=f"http://127.0.0.1:8000/revisions/{r['id']}/assembly",
            proof=proof,
        )
        Path(".data/calibration.json").write_text(json.dumps(result, indent=2))
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    run()
