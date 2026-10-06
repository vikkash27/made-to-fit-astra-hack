import json
from types import SimpleNamespace
import pytest
from conftest import post, candidate, built, project, wait
from app.cad.fixture import fixture
from app.errors import DomainError
from app.services.wiring import WiringProposal


def accepted(client):
    spec = fixture().model_dump(mode="json")
    for c in spec["components"]:
        c.update(identity=c["name"], identity_confirmed=True)
    p = project(client, spec)
    r = built(client, candidate(client, p, spec))
    post(
        client,
        f"/revisions/{r['id']}/accept",
        dict(client_operation_id="accept", expected_active_parent=None),
    )
    return p, r


def proposal():
    return dict(
        overview="Documented module connection",
        power_plan="Controller supply and compatible logic reviewed separately",
        unresolved=[],
        connections=[
            dict(
                id="ground",
                start=dict(part_id="controller", pin="GND"),
                end=dict(part_id="battery", pin="GND"),
                signal="Common ground",
                kind="ground",
                color="black",
                voltage_v=0,
                instruction="Disconnect power. Join the labelled ground pins.",
                completion_check="Ground connection checked against module documentation.",
                evidence=[
                    dict(
                        part_id="controller",
                        source_id="doc",
                        location="pinout",
                        quote="GND is the ground pin.",
                    ),
                    dict(
                        part_id="battery",
                        source_id="doc",
                        location="pinout",
                        quote="GND is the ground pin.",
                    ),
                ],
            )
        ],
    )


def mock_research(app, monkeypatch):
    source = dict(
        id="doc",
        title="Exact module pinout",
        url="https://example.org/pinout",
        publisher="example.org",
        sha256="123",
        pages=[dict(text="GND is the ground pin.")],
    )
    monkeypatch.setattr(app.state.ai, "require_configured", lambda: None)
    monkeypatch.setattr(app.state.ai.research, "fetch", lambda *a, **kw: source)
    monkeypatch.setattr(
        app.state.ai.astra,
        "call",
        lambda *a, **kw: SimpleNamespace(output_parsed=WiringProposal.model_validate(proposal())),
    )
    return source


def test_wiring_review_progress_and_revision_gates(api, monkeypatch):
    client, app = api
    p, r = accepted(client)
    mock_research(app, monkeypatch)
    assert client.get(f"/revisions/{r['id']}/wiring-plan").json()["plan"] is None
    job = post(
        client,
        f"/revisions/{r['id']}/wiring-plan",
        dict(client_operation_id="wire", source_urls=["https://example.org/pinout"]),
        202,
    )
    job = wait(client, job)
    assert job["stage"] == "ready", job
    plan = client.get(f"/revisions/{r['id']}/wiring-plan").json()["plan"]
    assert plan["status"] == "needs_review" and not plan["artifacts"]
    request = dict(
        plan_id=plan["id"],
        plan_hash=plan["plan_hash"],
        reviewed_connection_ids=["ground"],
        confirm_exact_modules_and_pinouts=True,
        confirm_power_and_logic_levels=False,
    )
    assert client.post(f"/revisions/{r['id']}/wiring-plan/review", json=request).status_code == 422
    request["confirm_power_and_logic_levels"] = True
    reviewed = post(client, f"/revisions/{r['id']}/wiring-plan/review", request)["plan"]
    assert reviewed["status"] == "reviewed"
    a = reviewed["artifacts"][0]
    assert a["revision_id"] == r["id"] and a["spec_hash"] == r["spec_hash"]
    assert "GND is the ground pin." in client.get(a["url"]).text
    ids = ["prepare", f"wire:{plan['id']}:ground"]
    response = client.patch(
        f"/revisions/{r['id']}/guide-progress",
        json=dict(completed_step_ids=ids, wiring_plan_id=plan["id"]),
    )
    assert response.status_code == 200, response.text
    assert client.get(f"/revisions/{r['id']}/guide-progress").json()["completed_step_ids"] == ids
    assert (
        client.patch(
            f"/revisions/{r['id']}/guide-progress",
            json=dict(completed_step_ids=["invented"], wiring_plan_id=plan["id"]),
        ).status_code
        == 409
    )
    replacement = post(
        client,
        f"/revisions/{r['id']}/wiring-plan",
        dict(client_operation_id="wire-2", source_urls=["https://example.org/pinout"]),
        202,
    )
    assert wait(client, replacement)["stage"] == "ready"
    assert client.post(f"/revisions/{r['id']}/wiring-plan/review", json=request).status_code == 409
    assert client.get(f"/revisions/{r['id']}/guide-progress").json()["completed_step_ids"] == [
        "prepare"
    ]
    # Frozen mechanical instructions are never rewritten by the supplemental plan.
    assert (
        client.get(f"/revisions/{r['id']}/build-guide").json()["steps"] == r["build_guide"]["steps"]
    )
    next_r = built(
        client,
        candidate(
            client,
            client.get(f"/projects/{p['id']}").json(),
            r["spec"],
            parent=r["id"],
            operation="new",
        ),
    )
    post(
        client,
        f"/revisions/{next_r['id']}/accept",
        dict(client_operation_id="accept-next", expected_active_parent=r["id"]),
    )
    assert client.get(f"/revisions/{r['id']}/wiring-plan").status_code == 409
    assert client.get(f"/revisions/{r['id']}/guide-progress").status_code == 409


def test_rejects_invented_pin_evidence_and_unresolved_review(api, monkeypatch):
    client, app = api
    _, r = accepted(client)
    source = mock_research(app, monkeypatch)
    bad = proposal()
    bad["connections"][0]["start"]["pin"] = "GPIO99"
    with pytest.raises(DomainError):
        app.state.wiring.validate(bad, r["spec"]["components"], [source])
    bad = proposal()
    bad["connections"][0]["evidence"][0]["quote"] = "This fabricated pinout is unsupported"
    with pytest.raises(DomainError):
        app.state.wiring.validate(bad, r["spec"]["components"], [source])
    bad = proposal()
    bad["connections"][0]["end"]["part_id"] = "unavailable"
    with pytest.raises(DomainError):
        app.state.wiring.validate(bad, r["spec"]["components"], [source])
    with pytest.raises(ValueError):
        WiringProposal.model_validate(
            {**proposal(), "connections": [{**proposal()["connections"][0], "voltage_v": 230}]}
        )
    job = post(
        client,
        f"/revisions/{r['id']}/wiring-plan",
        dict(client_operation_id="wire", source_urls=["https://example.org/pinout"]),
        202,
    )
    assert wait(client, job)["stage"] == "ready"
    plan = client.get(f"/revisions/{r['id']}/wiring-plan").json()["plan"]
    plan["unresolved"] = ["Module variant is unknown"]
    with app.state.store.transaction():
        app.state.store.put("wiring", plan)
    request = dict(
        plan_id=plan["id"],
        plan_hash=plan["plan_hash"],
        reviewed_connection_ids=["ground"],
        confirm_exact_modules_and_pinouts=True,
        confirm_power_and_logic_levels=True,
    )
    assert client.post(f"/revisions/{r['id']}/wiring-plan/review", json=request).status_code == 422


def test_astra_receives_stage_and_current_accepted_assembly(api, monkeypatch):
    from test_providers import record_job

    client, app = api
    p, r = accepted(client)
    assert (
        client.patch(
            f"/revisions/{r['id']}/guide-progress",
            json=dict(completed_step_ids=["prepare"], wiring_plan_id=None),
        ).status_code
        == 200
    )
    current = client.get(f"/projects/{p['id']}").json()
    app.state.ai.settings.openai_api_key = "unit-test-only"
    job = record_job(
        app.state.store,
        "agent",
        p["id"],
        dict(
            message="What should I do next?",
            expected_draft_version=current["draft_version"],
            parent_revision_id=r["id"],
            selected_part_id=None,
            current_stage="export",
        ),
    )
    captured = []

    def answer(key, **kwargs):
        captured.append(kwargs)
        return SimpleNamespace(
            id="guide-context", output=[], output_text="**Next:** follow your accepted guide."
        )

    monkeypatch.setattr(app.state.ai.astra, "call", answer)
    result = app.state.ai.agent(job)
    context = json.loads(captured[0]["input"][0]["content"])
    assert context["current_stage"] == "export"
    accepted_design = context["accepted_design"]
    assert accepted_design["revision_id"] == r["id"]
    assert accepted_design["spec_hash"] == r["spec_hash"]
    assert accepted_design["assembly_guide"]["steps"] == r["build_guide"]["steps"]
    assert accepted_design["assembly_progress"]["completed_step_ids"] == ["prepare"]
    assert accepted_design["wiring_plan"] is None
    assert result["text"].startswith("**Next:")
