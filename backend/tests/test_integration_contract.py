from conftest import project, post


def test_project_listing_and_initial_brief_persistence(api):
    client, _ = api
    p = project(client, initial_text="I have an ESP32 and a display")
    listed = client.get("/projects").json()
    assert listed[0]["id"] == p["id"]
    assert (
        client.get(f"/projects/{p['id']}").json()["initial_text"] == "I have an ESP32 and a display"
    )


def test_dimension_changes_invalidate_visual_alignment_without_losing_asset(api):
    client, app = api
    from app.schemas import Component
    from app.store import uid

    asset_id = uid("asset")
    component = Component(
        part_id="part", name="Board", size_mm=(10, 20, 5), dimensions_confirmed=True
    )
    p = project(client, components=[component.model_dump(mode="json")])
    with app.state.store.transaction():
        raw = app.state.store.get("project", p["id"])
        raw["components"][0]["visual_asset_id"] = asset_id
        app.state.store.put("project", raw)
        app.state.store.put(
            "asset",
            {
                "id": asset_id,
                "part_id": "part",
                "project_id": p["id"],
                "calibration": {"status": "reviewed"},
            },
        )
    component.size_mm = (10, 20, 8)
    changed = post(
        client,
        f"/projects/{p['id']}/components/confirm",
        {
            "expected_draft_version": p["draft_version"],
            "components": [component.model_dump(mode="json")],
        },
    )
    assert changed["components"][0]["visual_asset_id"] == asset_id
    assert app.state.store.get("asset", asset_id)["calibration"]["status"] == "needs_review"


def test_reference_alignment_requires_current_confirmed_dimensions(api):
    from app.cad.fixture import fixture
    from conftest import project, post

    client, app = api
    s = fixture().model_dump(mode="json")
    p = project(client, s)
    asset = {
        "id": "asset_alignment",
        "project_id": p["id"],
        "part_id": "controller",
        "calibration": {"status": "needs_review"},
    }
    with app.state.store.transaction():
        app.state.store.put("asset", asset)
    request = dict(
        uniform_scale=0.01,
        translation_m=[0, 0, 0],
        rotation_quaternion_xyzw=[0, 0, 0, 1],
        confirmed_illustrative_reference=True,
        aligned_size_mm=[44, 24, 6],
    )
    accepted = post(client, "/assets/asset_alignment/calibration", request)
    assert accepted["calibration"]["aligned_size_mm"] == [44, 24, 6]
    request["aligned_size_mm"] = [44, 24, 7]
    post(client, "/assets/asset_alignment/calibration", request, 409)
    part = s["components"][0]
    part["dimensions_confirmed"] = False
    p = post(
        client,
        f"/projects/{p['id']}/components/confirm",
        dict(expected_draft_version=p["draft_version"], components=[part]),
    )
    post(client, "/assets/asset_alignment/calibration", request, 422)
