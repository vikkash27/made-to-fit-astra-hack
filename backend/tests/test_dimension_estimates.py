import io
import threading
from types import SimpleNamespace
from PIL import Image
from conftest import project
from app.cad.fixture import fixture
from app.services.dimensions import EstimateResult, DimensionEstimateRequest
from app.services.ai import BatchExtractionResult
from app.store import now, uid


def job_record(store, kind, project_id, payload, part_id=None):
    value = dict(
        id=uid("job"),
        kind=kind,
        project_id=project_id,
        payload=payload,
        part_id=part_id,
        stage="queued",
        events=[],
        created_at=now(),
        updated_at=now(),
    )
    with store.transaction():
        store.put("job", value)
    return value


def test_photo_estimates_are_separate_from_measurements_and_stale_identity(api, monkeypatch):
    client, app = api
    p = project(client, fixture().model_dump(mode="json"))
    data = io.BytesIO()
    Image.new("RGB", (20, 30), "white").save(data, format="PNG")
    photo = client.post(
        f"/projects/{p['id']}/photos", files={"file": ("photo.png", data.getvalue(), "image/png")}
    ).json()
    component = p["components"][0]
    component["crop"] = dict(photo_id=photo["id"], box_xyxy=[0, 0, 1, 1], coordinates="normalized")
    p = client.post(
        f"/projects/{p['id']}/components/confirm",
        json=dict(expected_draft_version=p["draft_version"], components=[component]),
    ).json()
    before = p["components"]
    axis = dict(
        value_mm=45,
        range_mm=[35, 60],
        confidence="low",
        basis="Assumes a common development-board variant; check with a ruler",
    )
    result = EstimateResult(
        parts=[
            dict(
                part_id=component["part_id"],
                width=axis,
                depth=axis,
                height={**axis, "value_mm": None, "range_mm": None},
            )
        ]
    )
    app.state.ai.settings.openai_api_key = "unit-test-only"
    monkeypatch.setattr(
        app.state.ai.astra, "call", lambda *args, **kwargs: SimpleNamespace(output_parsed=result)
    )
    request = DimensionEstimateRequest(
        client_operation_id="estimate", part_ids=[component["part_id"]]
    )
    job = job_record(app.state.store, "dimension_estimation", p["id"], request.model_dump())
    app.state.dimensions.generate(job)
    after = client.get(f"/projects/{p['id']}").json()
    assert after["components"] == before
    assert after["inventory_hash"] == p["inventory_hash"]
    assert after["draft_version"] == p["draft_version"]
    assert after["dimension_estimates"][0]["width"]["value_mm"] == 45
    assert after["dimension_estimates"][0]["height"]["value_mm"] is None
    component["identity"] = "Different board"
    client.post(
        f"/projects/{p['id']}/components/confirm",
        json=dict(expected_draft_version=p["draft_version"], components=[component]),
    )
    assert client.get(f"/projects/{p['id']}/dimension-estimates").json()["estimates"] == []


def test_lookup_extracts_all_read_sources_in_one_model_call(api, monkeypatch):
    client, app = api
    p = project(client, fixture().model_dump(mode="json"))
    app.state.ai.settings.openai_api_key = "unit-test-only"
    source = dict(
        id="read-source",
        title="Module dimensions",
        url="https://example.com/spec",
        pages=[dict(page=1, text="Board 40 by 20 mm")],
    )
    monkeypatch.setattr(app.state.ai.research, "fetch", lambda *args, **kwargs: source)
    calls = []

    def extract(*args, **kwargs):
        calls.append(kwargs)
        return SimpleNamespace(
            output_parsed=BatchExtractionResult(
                sources=[
                    dict(
                        source_id="read-source",
                        proposals=[],
                        unresolved_fields=["assembled_height"],
                    )
                ]
            )
        )

    monkeypatch.setattr(app.state.ai.astra, "call", extract)
    job = job_record(
        app.state.store,
        "lookup",
        p["id"],
        dict(
            client_operation_id="lookup", identifiers="board", source_url="https://example.com/spec"
        ),
        part_id=p["components"][0]["part_id"],
    )
    app.state.ai.lookup(job)
    assert len(calls) == 1
    assert calls[0]["parse"] is BatchExtractionResult
    assert app.state.store.get("project", p["id"])["components"] == p["components"]


def test_visual_generation_does_not_block_ai_queue(api):
    client, app = api
    p = project(client, fixture().model_dump(mode="json"))
    release, done = threading.Event(), threading.Event()
    app.state.jobs.handlers["visual_asset"] = lambda job: release.wait(5)
    app.state.jobs.handlers["dimension_estimation"] = lambda job: done.set()
    try:
        for i in range(3):
            app.state.jobs.create("visual_asset", p["id"], {}, str(i))
        app.state.jobs.create("dimension_estimation", p["id"], {}, "estimate")
        assert done.wait(2), "AI work must run while all visual workers are occupied"
    finally:
        release.set()
