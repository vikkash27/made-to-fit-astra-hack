"""Authorized live provider verification using the user's supplied synthetic test image."""

import json
from pathlib import Path
import httpx
from scripts.live_smoke import wait


def run():
    path = Path("test-assets/test-hardware-image.png")
    state_path = Path(".data/photo-pipeline.json")
    with httpx.Client(base_url="http://127.0.0.1:8000", timeout=30) as client:

        def post(url, body):
            response = client.post(url, json=body)
            response.raise_for_status()
            return response.json()

        p = post(
            "/projects",
            dict(name="Live pipeline · supplied synthetic test image", intent_mode="discover"),
        )
        key = p["id"]
        state = dict(
            project_id=key, input_label="User-supplied synthetic test image", photo_path=str(path)
        )

        def save():
            state_path.write_text(json.dumps(state, indent=2))

        with path.open("rb") as file:
            response = client.post(
                f"/projects/{key}/photos", files={"file": (path.name, file, "image/png")}
            )
        response.raise_for_status()
        photo = response.json()
        state["photo_id"] = photo["id"]
        save()
        job = post(
            f"/projects/{key}/photos/analyze",
            dict(
                client_operation_id="supplied-photo-analysis",
                expected_draft_version=1,
                photo_ids=[photo["id"]],
            ),
        )
        state["analysis_job_id"] = job["job_id"]
        save()
        result = wait(client, job)
        state["analysis"] = result
        save()
        print("Photo analysis", dict(stage=result["stage"], error=result["error"]), flush=True)
        if result["stage"] != "ready" or not result["result"]["proposals"]:
            return state
        components = [proposal["component"] for proposal in result["result"]["proposals"]]
        # Inventory only: all candidate identities and dimensions remain unconfirmed.
        p = post(
            f"/projects/{key}/components/confirm",
            dict(expected_draft_version=1, components=components),
        )
        state["component_ids"] = [c["part_id"] for c in p["components"]]
        save()
        controller = next(
            (
                c
                for c in p["components"]
                if any(
                    word in c["name"].lower() for word in ["controller", "pico", "micro", "board"]
                )
            ),
            p["components"][0],
        )
        asset = post(
            f"/projects/{key}/assets/generate",
            dict(
                client_operation_id="authorized-one-component-reference",
                part_id=controller["part_id"],
                photo_ids=[photo["id"]],
                prompt="Independent hardware component reference faithful to this cropped synthetic test image. Keep connectors recognizable; no invented wires or labels; neutral illumination. Appearance only, no dimensional claims.",
                tier="Gen-2.5-Low",
                quality_override=10000,
            ),
        )
        state["visual_job_id"] = asset["job_id"]
        state["visual_part_id"] = controller["part_id"]
        save()
        print("Rodin submitted local job", asset["job_id"], flush=True)
        lookup = post(
            f"/projects/{key}/components/{controller['part_id']}/lookup",
            dict(
                client_operation_id="manufacturer-source-lookup",
                identifiers="Tentative Pico-style controller in a synthetic test image. Treat variant match as unresolved; do not equate chip dimensions with this board.",
                source_url="https://datasheets.raspberrypi.com/pico/pico-product-brief.pdf",
            ),
        )
        state["lookup_job_id"] = lookup["job_id"]
        save()
        discovery = post(
            f"/projects/{key}/concepts/generate",
            dict(
                client_operation_id="photo-inventory-discovery",
                expected_draft_version=p["draft_version"],
                inventory_hash=p["inventory_hash"],
                preference_prompt="These components come from a labeled synthetic input image. Propose up to two grounded concepts around actual part IDs. All exact identities, electrical compatibility and dimensions remain unconfirmed. Do not invent accepted measurements or user skills.",
            ),
        )
        state["discovery_job_id"] = discovery["job_id"]
        save()
        for name, job in [("lookup", lookup), ("discovery", discovery)]:
            result = wait(client, job)
            state[name] = result
            save()
            print(name, dict(stage=result["stage"], error=result["error"]), flush=True)
        result = wait(client, asset, deadline_seconds=600)
        state["visual"] = result
        save()
        print("Rodin", dict(stage=result["stage"], error=result["error"]), flush=True)
        return state


if __name__ == "__main__":
    run()
