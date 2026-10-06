import hashlib
from app.cad.fixture import fixture
from app.schemas import Concept
from app.store import uid
from conftest import post, candidate, built


def selected_project(client, app):
    spec = fixture().model_dump(mode="json")
    p = post(
        client,
        "/projects",
        dict(
            name="My parts",
            intent_mode="discover",
            components=[*spec["components"], dict(part_id="spare", name="Unused sensor")],
        ),
        201,
    )
    c = Concept(
        title="Desk monitor",
        purpose="A useful desk build",
        goal="Monitor my desk",
        used_part_ids=[x["part_id"] for x in spec["components"]],
        unused_part_ids=["spare"],
        additional_hardware=["Verify power cable"],
        software_firmware_dependencies=["Module firmware"],
        why_this_fits_you="Uses your reviewed hardware",
        skills_tools=["FDM printer"],
        difficulty_reasons=["Power compatibility needs review"],
        form_factor_rationale="Desk",
        layout_rationale="Controller and battery inside a shell",
        evidence_ids=[],
        assumptions=["Verify connector access"],
        required_measurements=[],
        supported_family="rectangular_enclosure",
        supported_operations=["box", "subtract"],
        next_steps=["Measure", "Print"],
        geometry_status="schematic",
    ).model_dump(mode="json")
    c.update(
        id=uid("concept"),
        project_id=p["id"],
        draft_version=p["draft_version"],
        inventory_hash=p["inventory_hash"],
    )
    with app.state.store.transaction():
        app.state.store.put("concept", c)
    p = post(
        client,
        f"/projects/{p['id']}/concepts/{c['id']}/select",
        dict(expected_draft_version=p["draft_version"], inventory_hash=p["inventory_hash"]),
    )
    return p, spec, c


def test_selected_parts_and_revision_bound_build_guide(api):
    client, app = api
    p, spec, c = selected_project(client, app)
    assert p["brief"]["selected_concept"]["used_part_ids"] == ["controller", "battery"]
    assert not any(q["part_id"] == "spare" for q in p["brief"]["missing_questions"])
    r = candidate(client, p, spec)
    assert client.get(f"/revisions/{r['id']}/build-guide").status_code == 409
    # A later concept edit must not alter the frozen build's instructions.
    c["title"] = "A later proposal"
    c["additional_hardware"] = ["A later dependency"]
    with app.state.store.transaction():
        app.state.store.put("concept", c)
    r = built(client, r)
    post(
        client,
        f"/revisions/{r['id']}/accept",
        dict(client_operation_id="accept-guide", expected_active_parent=None),
    )
    response = client.get(f"/revisions/{r['id']}/build-guide")
    assert response.status_code == 200, response.text
    guide = response.json()
    assert guide["title"] == "Desk monitor"
    assert guide["additional_hardware"] == ["Verify power cable"]
    assert guide["purpose"] == "Monitor my desk"
    assert guide["spec_hash"] == r["spec_hash"]
    assert {part["part_id"] for part in guide["parts"]} == {"base", "lid", "controller", "battery"}
    assert "spare" in {
        part["part_id"] for part in client.get(f"/projects/{p['id']}").json()["components"]
    }
    assert any("pinout" in text for text in guide["unresolved"])
    assert any("not a mounting fixture" in step["instruction"] for step in guide["steps"])
    a = next(a for a in r["artifacts"] if a["role"] == "build_guide")
    download = client.get(a["url"])
    assert hashlib.sha256(download.content).hexdigest() == a["sha256"]
    assert r["id"] in download.text and r["spec_hash"] in download.text
    p = client.patch(
        f"/projects/{p['id']}",
        json=dict(expected_draft_version=p["draft_version"], goal="Changed purpose"),
    ).json()
    assert client.get(f"/revisions/{r['id']}/build-guide").json() == guide
    newer = built(client, candidate(client, p, spec, parent=r["id"], operation="new-guide"))
    post(
        client,
        f"/revisions/{newer['id']}/accept",
        dict(client_operation_id="accept-new-guide", expected_active_parent=r["id"]),
    )
    assert client.get(f"/revisions/{r['id']}/build-guide").status_code == 409


def test_selected_project_cannot_silently_include_unused_parts(api):
    client, app = api
    p, spec, _ = selected_project(client, app)
    spec["components"] = [spec["components"][0]]
    result = post(
        client,
        f"/projects/{p['id']}/candidates",
        dict(
            client_operation_id="wrong-inventory",
            expected_draft_version=p["draft_version"],
            parent_revision_id=None,
            spec=spec,
        ),
        409,
    )
    assert result["error"]["code"] == "inventory_mismatch"
