"""Continue from persisted photo results without re-analyzing or regenerating completed jobs."""

import json
from pathlib import Path
import httpx
from scripts.live_smoke import wait


def run():
    path = Path(".data/photo-pipeline.json")
    state = json.loads(path.read_text())
    key = state["project_id"]
    with httpx.Client(base_url="http://127.0.0.1:8000", timeout=30) as client:

        def save():
            path.write_text(json.dumps(state, indent=2))

        def post(url, body):
            response = client.post(url, json=body)
            response.raise_for_status()
            return response.json()

        p = client.get(f"/projects/{key}").json()
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
        if not state.get("visual_job_id"):
            body = dict(
                client_operation_id="authorized-one-component-reference",
                part_id=controller["part_id"],
                photo_ids=[state["photo_id"]],
                prompt="Independent hardware component reference faithful to this cropped synthetic test image. Keep connectors recognizable; no invented wires or labels; neutral illumination. Appearance only, no dimensional claims.",
                tier="Gen-2.5-Low",
                quality_override=10000,
            )
            state["visual_request"] = body
            save()
            job = post(f"/projects/{key}/assets/generate", body)
            state["visual_job_id"] = job["job_id"]
            state["visual_part_id"] = controller["part_id"]
            save()
            print("Rodin job", job["job_id"], flush=True)
        if not state.get("lookup_job_id"):
            job = post(
                f"/projects/{key}/components/{controller['part_id']}/lookup",
                dict(
                    client_operation_id="manufacturer-source-lookup",
                    identifiers="Tentative Pico-style controller in a synthetic test image. Treat variant match as unresolved; do not equate chip dimensions with this board.",
                    source_url="https://datasheets.raspberrypi.com/pico/pico-product-brief.pdf",
                ),
            )
            state["lookup_job_id"] = job["job_id"]
            save()
        if not state.get("discovery_job_id"):
            job = post(
                f"/projects/{key}/concepts/generate",
                dict(
                    client_operation_id="photo-inventory-discovery",
                    expected_draft_version=p["draft_version"],
                    inventory_hash=p["inventory_hash"],
                    preference_prompt="These components come from a labeled synthetic input image. Propose up to two grounded concepts around actual part IDs. All exact identities, electrical compatibility and dimensions remain unconfirmed. Do not invent accepted measurements or user skills.",
                ),
            )
            state["discovery_job_id"] = job["job_id"]
            save()
        for name in ["lookup", "discovery", "visual"]:
            result = wait(
                client,
                client.get(f"/jobs/{state[name + '_job_id']}").json(),
                deadline_seconds=600 if name == "visual" else 240,
            )
            state[name] = result
            save()
            print(name, dict(stage=result["stage"], error=result["error"]), flush=True)
        return state


if __name__ == "__main__":
    run()
