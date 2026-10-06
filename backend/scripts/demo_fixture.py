"""Exercise the actual HTTP workflow; keeps a local accepted demo for integration."""

import json
import os
import time
from pathlib import Path
import httpx
from app.cad.fixture import fixture

BASE = os.environ.get("API_BASE_URL", "http://127.0.0.1:8001")


def run(base=BASE):
    client = httpx.Client(base_url=base, timeout=10)

    def post(path, value):
        r = client.post(path, json=value)
        r.raise_for_status()
        return r.json()

    def build(project, spec, parent, label):
        candidate = post(
            f"/projects/{project['id']}/candidates",
            dict(
                client_operation_id=f"demo-{label}",
                expected_draft_version=project["draft_version"],
                parent_revision_id=parent,
                spec=spec,
                request=f"Synthetic regression: {label}",
            ),
        )
        job = post(
            f"/revisions/{candidate['id']}/build", dict(client_operation_id=f"demo-build-{label}")
        )
        deadline = time.monotonic() + 120
        while job["stage"] not in ("ready", "failed"):
            if time.monotonic() > deadline:
                raise RuntimeError("CAD demo deadline exceeded")
            time.sleep(0.2)
            job = client.get(f"/jobs/{job['job_id']}").json()
        if job["stage"] != "ready":
            raise RuntimeError(job)
        return client.get(f"/revisions/{candidate['id']}").json()

    spec = fixture().model_dump(mode="json")
    project = post(
        "/projects",
        dict(
            name="Synthetic CAD clearance proof",
            intent_mode="idea",
            goal="Review a two-component enclosure",
            spec=spec,
        ),
    )
    baseline = build(project, spec, None, "baseline")
    post(
        f"/revisions/{baseline['id']}/accept",
        dict(client_operation_id="demo-accept-baseline", expected_active_parent=None),
    )
    changed = fixture(battery_height=20).model_dump(mode="json")
    battery = changed["components"][1]
    project = post(
        f"/projects/{project['id']}/components/confirm",
        dict(expected_draft_version=project["draft_version"], components=[battery]),
    )
    changed["components"] = project["components"]
    failed = build(project, changed, baseline["id"], "failed")
    repaired = json.loads(json.dumps(changed))
    repaired["enclosure"]["height_mm"] = 28
    repaired_revision = build(project, repaired, baseline["id"], "repaired")
    accepted = post(
        f"/revisions/{repaired_revision['id']}/accept",
        dict(client_operation_id="demo-accept-repaired", expected_active_parent=baseline["id"]),
    )
    evidence = []
    for label, r in [("baseline", baseline), ("failed", failed), ("repaired", repaired_revision)]:
        check = next(c for c in r["checks"] if c["check_id"] == "battery_lid_clearance")
        evidence.append(
            dict(
                state=label,
                revision_id=r["id"],
                spec_hash=r["spec_hash"],
                gap_mm=check["measured_gap_mm"],
                shortfall_mm=check["shortfall_mm"],
                status=check["status"],
            )
        )
    result = dict(
        project_id=project["id"],
        accepted_revision_id=accepted["id"],
        assembly_url=f"{base}/revisions/{accepted['id']}/assembly",
        exports_url=f"{base}/revisions/{accepted['id']}/exports",
        proof=evidence,
    )
    Path(".data/demo.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    run()
