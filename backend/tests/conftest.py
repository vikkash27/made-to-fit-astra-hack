import time
import pytest
from fastapi.testclient import TestClient
from app.config import Settings
from app.main import create_app


@pytest.fixture
def api(tmp_path):
    app = create_app(Settings(data_dir=tmp_path, openai_api_key="", hyper3d_api_key=""))
    with TestClient(app) as client:
        yield client, app


def wait(client, job):
    deadline = time.monotonic() + 40
    while job["stage"] not in ("ready", "failed", "unknown_submission"):
        assert time.monotonic() < deadline, job
        time.sleep(0.05)
        response = client.get(f"/jobs/{job['job_id']}")
        assert response.status_code == 200, response.text
        job = response.json()
    return job


def post(client, path, payload, status=200):
    response = client.post(path, json=payload)
    assert response.status_code == status, response.text
    return response.json()


def project(client, spec=None, **values):
    return post(
        client,
        "/projects",
        dict(
            name="Test project",
            intent_mode="idea",
            goal="Enclosure",
            **({"spec": spec} if spec else {}),
            **values,
        ),
        201,
    )


def candidate(client, p, spec, parent=None, operation="candidate"):
    return post(
        client,
        f"/projects/{p['id']}/candidates",
        dict(
            client_operation_id=operation,
            expected_draft_version=p["draft_version"],
            parent_revision_id=parent,
            spec=spec,
        ),
        201,
    )


def built(client, r):
    job = post(client, f"/revisions/{r['id']}/build", dict(client_operation_id="build"), 202)
    job = wait(client, job)
    assert job["stage"] == "ready", job
    return client.get(f"/revisions/{r['id']}").json()
