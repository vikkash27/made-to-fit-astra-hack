"""Prove runtime Astra proposes and builds the computed fixture repair."""

import json
from pathlib import Path
import httpx
from app.cad.fixture import fixture
from scripts.live_smoke import wait


def run():
    state = {}
    path = Path(".data/live-repair.json")

    def save():
        path.write_text(json.dumps(state, indent=2))

    with httpx.Client(base_url="http://127.0.0.1:8000", timeout=30) as client:

        def post(url, body):
            r = client.post(url, json=body)
            r.raise_for_status()
            return r.json()

        spec = fixture().model_dump(mode="json")
        p = post(
            "/projects",
            dict(
                name="Live Astra CAD repair · synthetic fixture",
                intent_mode="idea",
                goal="Fit the confirmed hardware envelopes",
                spec=spec,
            ),
        )
        key = p["id"]
        state["project_id"] = key
        save()
        candidate = post(
            f"/projects/{key}/candidates",
            dict(
                client_operation_id="baseline",
                expected_draft_version=1,
                parent_revision_id=None,
                spec=spec,
            ),
        )
        baseline = wait(
            client,
            post(f"/revisions/{candidate['id']}/build", dict(client_operation_id="build-baseline")),
        )
        assert baseline["stage"] == "ready", baseline["error"]
        accepted = post(
            f"/revisions/{candidate['id']}/accept",
            dict(client_operation_id="accept-baseline", expected_active_parent=None),
        )
        changed = fixture(battery_height=20).model_dump(mode="json")
        p = post(
            f"/projects/{key}/components/confirm",
            dict(expected_draft_version=1, components=[changed["components"][1]]),
        )
        changed["components"] = p["components"]
        failed = post(
            f"/projects/{key}/candidates",
            dict(
                client_operation_id="failed-height",
                expected_draft_version=p["draft_version"],
                parent_revision_id=accepted["id"],
                spec=changed,
            ),
        )
        outcome = wait(
            client,
            post(f"/revisions/{failed['id']}/build", dict(client_operation_id="build-failed")),
        )
        assert outcome["stage"] == "ready", outcome["error"]
        state["baseline_revision_id"] = accepted["id"]
        state["failed_revision_id"] = failed["id"]
        save()
        request = dict(
            client_operation_id="live-astra-checked-repair",
            expected_draft_version=p["draft_version"],
            parent_revision_id=accepted["id"],
            message=f"Read current project and failed candidate {failed['id']} with get_design. Read its actual checks. Battery is now user-confirmed 40×18×20 at (-20,-24,4). It has gap -2 mm and requires 2 mm. Propose a full corrected DesignSpec using the CURRENT project components/component versions. Preserve 88×62 footprint, wall/base/lid 2 mm, controller pose and all locks. Increase enclosure height to 28 mm, then build_candidate and run_geometry_checks. Do not accept it; return the checked candidate ID and measured gap. Use actual tools, not just a textual plan.",
        )
        job = post(f"/projects/{key}/agent", request)
        state["agent_job_id"] = job["job_id"]
        save()
        result = wait(client, job, deadline_seconds=240)
        state["agent"] = result
        save()
        print(
            dict(
                stage=result["stage"],
                error=result["error"],
                candidate_ids=(result.get("result") or {}).get("candidate_ids", []),
            ),
            flush=True,
        )
        for cid in (result.get("result") or {}).get("candidate_ids", []):
            r = client.get(f"/revisions/{cid}").json()
            state.setdefault("candidate_results", []).append(
                dict(
                    id=r["id"],
                    state=r["state"],
                    eligible=r["eligible_for_acceptance"],
                    checks=r["checks"],
                )
            )
        save()
        return state


if __name__ == "__main__":
    run()
