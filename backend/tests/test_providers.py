"""Provider protocol/error tests use doubles; live evidence is recorded separately."""

import io
import json
from types import SimpleNamespace
import httpx
import pytest
import trimesh
from PIL import Image
from app.cad.fixture import fixture
from app.schemas import AssetRequest
from app.store import uid, now
from app.errors import DomainError
from conftest import project


def record_job(store, kind, project_id, payload, part_id=None, stage="queued", private=None):
    key = uid("job")
    value = dict(
        id=key,
        job_id=key,
        kind=kind,
        project_id=project_id,
        revision_id=None,
        part_id=part_id,
        payload=payload,
        private=private or {},
        stage=stage,
        result=None,
        error=None,
        events=[],
        client_operation_id=key,
        created_at=now(),
        updated_at=now(),
    )
    with store.transaction():
        store.put("job", value)
    return value


def test_function_outputs_preserve_original_call_ids_and_continuity(api, monkeypatch):
    client, app = api
    p = project(client, fixture().model_dump(mode="json"))
    ai = app.state.ai
    ai.settings.openai_api_key = "unit-test-only"
    job = record_job(
        app.state.store,
        "agent",
        p["id"],
        dict(
            message="Inspect only",
            expected_draft_version=1,
            parent_revision_id=None,
            selected_part_id=None,
        ),
    )
    calls = []
    first = SimpleNamespace(
        id="response-original",
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_design",
                arguments='{"revision_id":null}',
                call_id="original-call-id",
            )
        ],
        output_text="",
    )
    second = SimpleNamespace(id="response-second", output=[], output_text="Read the actual design.")

    def fake_call(key, **kwargs):
        calls.append(kwargs)
        return first if len(calls) == 1 else second

    monkeypatch.setattr(ai.astra, "call", fake_call)
    result = ai.agent(job)
    assert result["text"] == "Read the actual design."
    assert calls[1]["previous_response_id"] == "response-original"
    assert calls[1]["input"][0]["call_id"] == "original-call-id"
    assert calls[1]["input"][0]["type"] == "function_call_output"
    assert json.loads(calls[1]["input"][0]["output"])["id"] == p["id"]
    names = {t["name"] for t in calls[0]["tools"]}
    assert "accept_revision" not in names and "request_visual_asset" not in names
    assert not app.state.store.all("revision")


def photo_setup(client, app):
    p = project(client, fixture().model_dump(mode="json"))
    data = io.BytesIO()
    Image.new("RGB", (20, 30), "white").save(data, format="PNG")
    response = client.post(
        f"/projects/{p['id']}/photos", files={"file": ("photo.png", data.getvalue(), "image/png")}
    )
    assert response.status_code == 201
    return p, response.json()


def test_rodin_201_status_ids_download_and_calibration(api, monkeypatch):
    client, app = api
    p, photo = photo_setup(client, app)
    service = app.state.rodin
    service.settings.hyper3d_api_key = "unit-test-only"
    request = AssetRequest(client_operation_id="visual", part_id="battery", photo_ids=[photo["id"]])
    job = record_job(
        app.state.store, "visual_asset", p["id"], request.model_dump(mode="json"), part_id="battery"
    )
    requests = []

    def transport(req):
        requests.append(req)
        if req.url.path.endswith("/rodin"):
            assert b"Gen-2.5-Low" in req.content and b"10000" in req.content
            assert app.state.store.get("job", job["id"])["stage"] == "submitting"
            return httpx.Response(
                201,
                json={
                    "uuid": "vendor-task",
                    "jobs": {"subscription_key": "private-status-token"},
                    "consumed": 0.5,
                },
            )
        if req.url.path.endswith("/status"):
            assert json.loads(req.content) == {"subscription_key": "private-status-token"}
            assert app.state.store.get("job", job["id"])["private"]["task_uuid"] == "vendor-task"
            return httpx.Response(201, json={"jobs": [{"status": "Done"}, {"status": "Done"}]})
        if req.url.path.endswith("/download"):
            assert json.loads(req.content) == {"task_uuid": "vendor-task"}
            return httpx.Response(
                201,
                json={
                    "list": [
                        {"name": "model.glb", "url": "https://cdn.example/model.glb?signed=secret"}
                    ]
                },
            )
        raise AssertionError(req.url)

    monkeypatch.setattr(
        service,
        "client",
        lambda: httpx.Client(
            base_url="https://api.hyper3d.com/api/v2", transport=httpx.MockTransport(transport)
        ),
    )
    monkeypatch.setattr(service.jobs.stop, "wait", lambda delay: False)
    mesh = trimesh.Scene(trimesh.creation.box(extents=[4, 1, 2])).export(file_type="glb")
    monkeypatch.setattr(
        "app.providers.rodin.download_public", lambda *args: (mesh, "model/gltf-binary", args[0])
    )
    result = service.run(job)
    assert result["part_id"] == "battery"
    assert result["calibration"]["status"] == "needs_review"
    assert result["calibration"]["dimensional_authority"] is False
    original = client.get(result["original"]["url"])
    assert original.content.startswith(b"glTF")
    after = client.get(f"/projects/{p['id']}").json()
    assert after["inventory_hash"] == p["inventory_hash"]
    assert after["draft_version"] == p["draft_version"]
    assert after["components"][1]["visual_asset_id"] == result["id"]
    public = service.jobs.get(job["id"])
    assert "private-status-token" not in json.dumps(public)
    assert "signed=secret" not in json.dumps(result)
    assert len(requests) == 3
    # Dimension edits reuse the stored independent asset, with no second paid submit.
    assert service.run(job)["id"] == result["id"]
    assert len(requests) == 3


def test_ambiguous_paid_submission_is_not_replayed_after_restart(api, monkeypatch):
    client, app = api
    p, photo = photo_setup(client, app)
    service = app.state.rodin
    service.settings.hyper3d_api_key = "unit-test-only"
    payload = AssetRequest(
        client_operation_id="ambiguous", part_id="battery", photo_ids=[photo["id"]]
    ).model_dump(mode="json")
    job = record_job(app.state.store, "visual_asset", p["id"], payload, part_id="battery")
    submits = []

    def transport(request):
        submits.append(request)
        raise httpx.ReadTimeout("ambiguous network timeout", request=request)

    monkeypatch.setattr(
        service,
        "client",
        lambda: httpx.Client(
            base_url="https://api.hyper3d.com/api/v2", transport=httpx.MockTransport(transport)
        ),
    )
    with pytest.raises(DomainError, match="outcome unknown"):
        service.run(job)
    assert app.state.store.get("job", job["id"])["stage"] == "submitting"
    # Recovery sees committed submitting intent, not a safe-to-submit queued operation.
    service.jobs.recover()
    latest = service.jobs.get(job["id"])
    assert latest["stage"] == "unknown_submission"
    service.jobs.dispatch(job["id"])
    assert len(submits) == 1


def test_restart_reconciles_saved_vendor_ids_without_submit(api, monkeypatch):
    client, app = api
    p = project(client)
    job = record_job(
        app.state.store,
        "visual_asset",
        p["id"],
        {},
        stage="generating",
        private={"task_uuid": "task", "subscription_key": "token"},
    )
    seen = []
    monkeypatch.setattr(app.state.jobs, "dispatch", lambda key: seen.append(key))
    app.state.jobs.recover()
    assert seen == [job["id"]]


def test_operation_deduplication_for_paid_jobs(api, monkeypatch):
    client, app = api
    p = project(client)
    monkeypatch.setattr(app.state.jobs, "dispatch", lambda key: None)
    payload = dict(part_id="battery", photo_ids=["photo"])
    first = app.state.jobs.create("visual_asset", p["id"], payload, "same", part_id="battery")
    second = app.state.jobs.create("visual_asset", p["id"], payload, "same", part_id="battery")
    assert first["job_id"] == second["job_id"]
    with pytest.raises(DomainError, match="different input"):
        app.state.jobs.create(
            "visual_asset", p["id"], dict(payload, prompt="different"), "same", part_id="battery"
        )
    assert len(app.state.store.all("job")) == 1
