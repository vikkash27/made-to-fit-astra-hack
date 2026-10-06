"""Small authorized live checks. No provider keys printed. Rodin requires a supplied photo."""

import argparse
import json
import time
from pathlib import Path
import httpx
from app.cad.fixture import fixture


def wait(client, job, deadline_seconds=240):
    deadline = time.monotonic() + deadline_seconds
    while job["stage"] not in ("ready", "failed", "unknown_submission"):
        if time.monotonic() > deadline:
            return job
        time.sleep(1)
        job = client.get(f"/jobs/{job['job_id']}").json()
    return job


def run(photo_path=None):
    with httpx.Client(base_url="http://127.0.0.1:8000", timeout=30) as client:

        def post(url, body):
            response = client.post(url, json=body)
            response.raise_for_status()
            return response.json()

        spec = fixture().model_dump(mode="json")
        p = post(
            "/projects",
            dict(
                name="Live API verification · synthetic inventory",
                intent_mode="discover",
                spec=spec,
            ),
        )
        key = p["id"]
        proof = dict(project_id=key)
        job = post(
            f"/projects/{key}/agent",
            dict(
                client_operation_id="live-function-loop",
                expected_draft_version=1,
                parent_revision_id=None,
                message="This is a labeled synthetic regression inventory, not real commercial hardware. Call get_design to read the canonical design and get_component_evidence for battery. Then summarize its confirmed size and state that you used real tools. Do not create CAD or spend money on visual assets.",
            ),
        )
        outcome = wait(client, job)
        proof["agent"] = outcome
        print(
            "Live function loop",
            dict(
                job_id=job["job_id"],
                stage=outcome["stage"],
                error=outcome["error"],
                tools=[e.get("tool") for e in outcome["events"] if e.get("tool")],
            ),
        )
        job = post(
            f"/projects/{key}/concepts/generate",
            dict(
                client_operation_id="live-concepts",
                expected_draft_version=1,
                inventory_hash=p["inventory_hash"],
                preference_prompt="This inventory is synthetic. Propose at most two useful mechanical organization/enclosure concepts around these actual envelope IDs; do not claim working electronics or identify a commercial module.",
            ),
        )
        outcome = wait(client, job)
        proof["concepts"] = outcome
        print(
            "Live discovery",
            dict(
                job_id=job["job_id"],
                stage=outcome["stage"],
                error=outcome["error"],
                count=len((outcome.get("result") or {}).get("concepts", [])),
            ),
        )
        if outcome["stage"] == "ready" and outcome["result"]["concepts"]:
            c = outcome["result"]["concepts"][0]
            selected = post(
                f"/projects/{key}/concepts/{c['id']}/select",
                dict(expected_draft_version=1, inventory_hash=p["inventory_hash"]),
            )
            proof["selection"] = dict(
                selected_concept_id=selected["selected_concept_id"],
                goal=selected["goal"],
                active_accepted_revision_id=selected["active_accepted_revision_id"],
            )
        Path(".data/live-smoke.json").write_text(json.dumps(proof, indent=2))
        if photo_path:
            path = Path(photo_path)
            mime = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".webp": "image/webp",
            }[path.suffix.lower()]
            with path.open("rb") as file:
                response = client.post(
                    f"/projects/{key}/photos", files={"file": (path.name, file, mime)}
                )
            response.raise_for_status()
            photo = response.json()
            current = client.get(f"/projects/{key}").json()
            job = post(
                f"/projects/{key}/photos/analyze",
                dict(
                    client_operation_id="live-photo",
                    expected_draft_version=current["draft_version"],
                    photo_ids=[photo["id"]],
                ),
            )
            outcome = wait(client, job)
            proof["photo"] = outcome
            Path(".data/live-smoke.json").write_text(json.dumps(proof, indent=2))
            print(
                "Live photo",
                dict(job_id=job["job_id"], stage=outcome["stage"], error=outcome["error"]),
            )
        return proof


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--photo")
    args = parser.parse_args()
    run(args.photo)
