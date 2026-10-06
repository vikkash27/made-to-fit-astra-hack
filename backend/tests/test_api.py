import io
import json
import pytest
import trimesh
from PIL import Image
from app.cad.fixture import fixture
from app.schemas import Component, Concept
from app.store import uid
from conftest import project, candidate, built, post


def test_end_to_end_clearance_acceptance_export_and_stale_parent(api):
    client, app = api
    spec = fixture().model_dump(mode="json")
    p = project(client, spec)
    r = built(client, candidate(client, p, spec))
    assert r["eligible_for_acceptance"]
    accepted = post(
        client,
        f"/revisions/{r['id']}/accept",
        dict(client_operation_id="accept", expected_active_parent=None),
    )
    assert accepted["state"] == "accepted"
    repeat = post(
        client,
        f"/revisions/{r['id']}/accept",
        dict(client_operation_id="accept", expected_active_parent=None),
    )
    assert repeat["id"] == r["id"]
    changed = fixture(battery_height=20).model_dump(mode="json")
    p = post(
        client,
        f"/projects/{p['id']}/components/confirm",
        dict(expected_draft_version=p["draft_version"], components=[changed["components"][1]]),
    )
    changed["components"] = p["components"]
    failed = built(client, candidate(client, p, changed, parent=r["id"], operation="failed"))
    assert not failed["eligible_for_acceptance"]
    post(
        client,
        f"/revisions/{failed['id']}/accept",
        dict(client_operation_id="fail", expected_active_parent=r["id"]),
        409,
    )
    assert client.get(f"/projects/{p['id']}").json()["active_accepted_revision_id"] == r["id"]
    changed["enclosure"]["height_mm"] = 28
    repaired = built(client, candidate(client, p, changed, parent=r["id"], operation="repaired"))
    sibling = candidate(client, p, changed, parent=r["id"], operation="sibling")
    applied = post(
        client,
        f"/revisions/{repaired['id']}/accept",
        dict(client_operation_id="apply", expected_active_parent=r["id"]),
    )
    post(
        client,
        f"/revisions/{sibling['id']}/accept",
        dict(client_operation_id="stale", expected_active_parent=r["id"]),
        409,
    )
    assert applied["spec"]["components"][0]["pose"] == spec["components"][0]["pose"]
    manifest = client.get(f"/revisions/{applied['id']}/assembly").json()
    assert {x["part_id"] for x in manifest["parts"]} == {"base", "lid", "battery", "controller"}
    for a in manifest["artifacts"]:
        import hashlib

        response = client.get(a["url"])
        assert response.status_code == 200
        assert hashlib.sha256(response.content).hexdigest() == a["sha256"]
        assert a["revision_id"] == applied["id"] and a["spec_hash"] == applied["spec_hash"]
        if a["role"] == "printable_cad":
            assert a["part_id"] in ("base", "lid")
    glb = client.get(manifest["preview"]["assembly_artifact"]["url"]).content
    scene = trimesh.load(io.BytesIO(glb), file_type="glb", force="scene")
    assert set(scene.graph.nodes_geometry) == {"base", "lid", "controller", "battery"}
    assert scene.extents == pytest.approx([0.088, 0.028, 0.062], abs=1e-7)
    design = next(a for a in manifest["artifacts"] if a["role"] == "design_record")
    assert client.get(design["url"]).json() == applied["spec"]
    assert client.get("/artifacts/not-real").status_code == 404


def test_deduplication_and_unknown_component_confirmation(api):
    client, app = api
    spec = fixture().model_dump(mode="json")
    p = project(client, spec)
    r = candidate(client, p, spec)
    assert candidate(client, p, spec)["id"] == r["id"]
    changed = json.loads(json.dumps(spec))
    changed["enclosure"]["height_mm"] = 30
    post(
        client,
        f"/projects/{p['id']}/candidates",
        dict(
            client_operation_id="candidate",
            expected_draft_version=1,
            parent_revision_id=None,
            spec=changed,
        ),
        409,
    )
    assert len(app.state.store.all("revision")) == 1
    changed["components"][1]["size_mm"][2] = 15
    post(
        client,
        f"/projects/{p['id']}/candidates",
        dict(
            client_operation_id="unreviewed",
            expected_draft_version=1,
            parent_revision_id=None,
            spec=changed,
        ),
        409,
    )
    unknown = Component(part_id="unknown", name="Unidentified board").model_dump(mode="json")
    p = post(
        client,
        f"/projects/{p['id']}/components/confirm",
        dict(expected_draft_version=1, components=[unknown]),
    )
    assert p["brief"]["missing_questions"]
    assert p["components"][-1]["size_mm"] == [None, None, None]
    post(
        client,
        f"/projects/{p['id']}/components/confirm",
        dict(expected_draft_version=1, components=[unknown]),
        409,
    )


def test_dual_intent_and_stale_concept(api):
    client, app = api
    post(client, "/projects", dict(name="No goal", intent_mode="idea"), 422)
    p = post(
        client,
        "/projects",
        dict(
            name="Discover",
            intent_mode="discover",
            components=[dict(part_id="sensor", name="Unknown sensor")],
        ),
        201,
    )
    assert p["goal"] is None
    value = Concept(
        title="Sensor carrier",
        purpose="Organize an identified sensor prototype",
        goal="Make a carrier",
        used_part_ids=["sensor"],
        unused_part_ids=[],
        additional_hardware=[],
        software_firmware_dependencies=["Verify firmware and interfaces"],
        why_this_fits_you="Simple first mechanical task",
        skills_tools=["Print service"],
        difficulty_reasons=["Unknown interface"],
        form_factor_rationale="Desk carrier",
        layout_rationale="Envelope review first",
        evidence_ids=[],
        assumptions=["Sensor unidentified"],
        required_measurements=["All dimensions"],
        supported_family="rectangular_enclosure",
        supported_operations=["box", "subtract", "assembly"],
        next_steps=["Identify", "Measure"],
        geometry_status="schematic",
    ).model_dump(mode="json")
    value.update(
        id=uid("concept"),
        project_id=p["id"],
        draft_version=p["draft_version"],
        inventory_hash=p["inventory_hash"],
    )
    with app.state.store.transaction():
        app.state.store.put("concept", value)
    selected = post(
        client,
        f"/projects/{p['id']}/concepts/{value['id']}/select",
        dict(expected_draft_version=1, inventory_hash=p["inventory_hash"]),
    )
    assert selected["goal"] == "Make a carrier"
    assert selected["active_accepted_revision_id"] is None
    assert not selected["components"][0]["dimensions_confirmed"]
    changed = post(
        client,
        f"/projects/{p['id']}/components/confirm",
        dict(expected_draft_version=2, components=[dict(part_id="sensor", name="Changed sensor")]),
    )
    post(
        client,
        f"/projects/{p['id']}/concepts/{value['id']}/select",
        dict(expected_draft_version=3, inventory_hash=changed["inventory_hash"]),
        409,
    )
    edit = client.patch(
        f"/projects/{p['id']}",
        json=dict(expected_draft_version=3, intent_mode="idea", goal="Updated idea"),
    ).json()
    assert edit["components"][0]["part_id"] == "sensor"


def test_provider_configuration_and_secrets(api):
    client, app = api
    p = project(client)
    health = client.get("/health").json()
    assert health["cad"]["ready"] and health["providers"]["openai"] == "not_configured"
    result = post(
        client,
        f"/projects/{p['id']}/agent",
        dict(
            client_operation_id="agent",
            message="Hello",
            expected_draft_version=1,
            parent_revision_id=None,
        ),
        503,
    )
    assert result["error"]["code"] == "provider_not_configured"
    response = post(
        client,
        f"/projects/{p['id']}/assets/generate",
        dict(client_operation_id="visual", part_id="missing", photo_ids=["missing"]),
        503,
    )
    assert "HYPER3D_API_KEY" in response["error"]["message"]
    assert not app.state.store.all("job")


def test_photo_normalization_crop_and_invalid_upload(api):
    client, app = api
    p = project(client)
    data = io.BytesIO()
    Image.new("RGB", (120, 80), "red").save(data, format="PNG")
    response = client.post(
        f"/projects/{p['id']}/photos", files={"file": ("photo.png", data.getvalue(), "image/png")}
    )
    assert response.status_code == 201, response.text
    photo = response.json()
    assert [photo["width"], photo["height"]] == [120, 80]
    assert client.get(photo["artifact"]["url"]).content.startswith(b"\xff\xd8")
    c = dict(
        part_id="manual",
        name="Manual component",
        crop=dict(photo_id=photo["id"], box_xyxy=[0, 0, 0.5, 1]),
    )
    post(
        client,
        f"/projects/{p['id']}/components/confirm",
        dict(expected_draft_version=1, components=[c]),
    )
    cropped = app.state.photos.images(p["id"], [photo["id"]], "manual")[0]
    assert Image.open(io.BytesIO(cropped)).size == (60, 80)
    assert (
        client.post(
            f"/projects/{p['id']}/photos", files={"file": ("x.png", b"invalid", "image/png")}
        ).status_code
        == 422
    )
    assert (
        client.post(
            f"/projects/{p['id']}/photos", files={"file": ("x.svg", b"<svg/>", "image/svg+xml")}
        ).status_code
        == 415
    )


def test_cross_project_and_numeric_boundaries(api):
    client, app = api
    spec = fixture().model_dump(mode="json")
    p = project(client, spec)
    bad = json.loads(json.dumps(spec))
    bad["components"][0]["pose"]["rotation_quaternion_xyzw"] = [0, 0, 0, 2]
    post(
        client,
        f"/projects/{p['id']}/candidates",
        dict(
            client_operation_id="bad", expected_draft_version=1, parent_revision_id=None, spec=bad
        ),
        422,
    )
    bad = json.loads(json.dumps(spec))
    bad["components"][0]["size_mm"][2] = 0
    post(
        client,
        f"/projects/{p['id']}/components/confirm",
        dict(expected_draft_version=1, components=bad["components"]),
        422,
    )
    post(
        client,
        "/projects",
        dict(
            name="Bad preferences",
            intent_mode="discover",
            preferences={"experience": "invented-score"},
        ),
        422,
    )


def test_artifact_integrity_rejects_tampering(api):
    client, app = api
    spec = fixture().model_dump(mode="json")
    p = project(client, spec)
    r = built(client, candidate(client, p, spec))
    _, path = app.state.artifacts.path(r["artifacts"][0]["id"])
    path.write_bytes(b"tampered")
    result = post(
        client,
        f"/revisions/{r['id']}/accept",
        dict(client_operation_id="accept", expected_active_parent=None),
        409,
    )
    assert result["error"]["code"] == "artifact_integrity"
    assert client.get(f"/projects/{p['id']}").json()["active_accepted_revision_id"] is None


def test_explicit_reviewed_unlock_preserves_parent_snapshot(api):
    client, app = api
    spec = fixture().model_dump(mode="json")
    spec["enclosure"]["locked_fields"].append("height_mm")
    p = project(client, spec)
    r = built(client, candidate(client, p, spec))
    post(
        client,
        f"/revisions/{r['id']}/accept",
        dict(client_operation_id="accept", expected_active_parent=None),
    )
    changed = json.loads(json.dumps(spec))
    changed["enclosure"]["height_mm"] = 28
    post(
        client,
        f"/projects/{p['id']}/candidates",
        dict(
            client_operation_id="locked",
            expected_draft_version=1,
            parent_revision_id=r["id"],
            spec=changed,
        ),
        409,
    )
    fields = [f for f in spec["enclosure"]["locked_fields"] if f != "height_mm"]
    p = post(
        client,
        f"/projects/{p['id']}/locks/review",
        dict(
            expected_draft_version=1, expected_active_parent=r["id"], enclosure_locked_fields=fields
        ),
    )
    changed["enclosure"]["locked_fields"] = fields
    updated = built(client, candidate(client, p, changed, parent=r["id"], operation="unlocked"))
    assert updated["eligible_for_acceptance"]
    assert (
        client.get(f"/revisions/{r['id']}").json()["spec"]["enclosure"]["locked_fields"]
        == spec["enclosure"]["locked_fields"]
    )
    assert (
        next(c for c in updated["checks"] if c["check_id"] == "locked_constraints")["status"]
        == "pass"
    )


def test_requested_unknown_analysis_blocks_acceptance(api):
    client, app = api
    spec = fixture().model_dump(mode="json")
    spec["requested_analyses"] = ["thermal"]
    p = project(client, spec)
    r = built(client, candidate(client, p, spec))
    assert not r["eligible_for_acceptance"]
    assert next(c for c in r["checks"] if c["check_id"] == "thermal")["required"]
