"""Authorized Gen-2.5 lifecycle; paid submit is persisted before any network call."""

import io
import hashlib
import base64
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import httpx
import numpy as np
import trimesh
from app.errors import DomainError
from app.schemas import AssetRequest
from app.services.research import download_public
from app.store import uid, now, digest

BASE = "https://api.hyper3d.com/api/v2"


def retry_after(header):
    try:
        return min(60, max(1, float(header)))
    except (ValueError, TypeError):
        try:
            return min(
                60,
                max(
                    1, (parsedate_to_datetime(header) - datetime.now(timezone.utc)).total_seconds()
                ),
            )
        except (ValueError, TypeError):
            return 5


class RodinService:
    def __init__(self, store, settings, artifacts, photos, jobs):
        self.store, self.settings, self.artifacts, self.photos, self.jobs = (
            store,
            settings,
            artifacts,
            photos,
            jobs,
        )

    def require_configured(self):
        if not self.settings.hyper3d_api_key:
            raise DomainError("provider_not_configured", "Set HYPER3D_API_KEY in backend .env", 503)

    def client(self):
        return httpx.Client(
            base_url=BASE,
            headers={"Authorization": f"Bearer {self.settings.hyper3d_api_key}"},
            timeout=60,
            trust_env=False,
        )

    def submit(self, client, job, request, images):
        # Stage committed before submitting. A process crash now cannot trigger another paid request.
        self.jobs.update(job["id"], "submitting")
        try:
            response = client.post(
                "/rodin",
                files=[
                    ("images", (f"component-{i}.jpg", data, "image/jpeg"))
                    for i, data in enumerate(images)
                ],
                data=dict(
                    tier=request.tier,
                    mesh_mode="Raw",
                    geometry_file_format="glb",
                    quality_override=str(request.quality_override),
                    material="PBR",
                    prompt=request.prompt,
                ),
            )
        except httpx.TransportError:
            raise DomainError(
                "unknown_submission",
                "Rodin submission outcome unknown; no automatic resubmission",
                503,
                retryable=False,
            )
        if response.status_code >= 500:
            raise DomainError(
                "unknown_submission",
                "Rodin returned a server error after submit; outcome unknown",
                502,
                retryable=False,
            )
        if not response.is_success:
            raise DomainError(
                "rodin_rejected",
                "Rodin rejected submission",
                502,
                details={"http_status": response.status_code},
                retryable=response.status_code == 429,
            )
        try:
            data = response.json()
        except ValueError:
            raise DomainError(
                "unknown_submission",
                "Unreadable Rodin submission response; reconcile before retry",
                502,
            )
        private = dict(job["private"])
        if data.get("uuid"):
            private["task_uuid"] = data["uuid"]
        if isinstance(data.get("jobs"), dict) and data["jobs"].get("subscription_key"):
            private["subscription_key"] = data["jobs"]["subscription_key"]
        private["consumed"] = data.get("consumed")
        self.jobs.update(job["id"], private=private)
        if data.get("error"):
            raise DomainError(
                "rodin_rejected",
                "Rodin reports generation rejection",
                502,
                details={"vendor_error": str(data["error"])[:100]},
            )
        if not private.get("task_uuid") or not private.get("subscription_key"):
            raise DomainError(
                "unknown_submission",
                "Rodin response missing identifiers; no automatic resubmission",
                502,
            )
        with self.store.transaction():
            self.store.put(
                "usage",
                dict(
                    id=uid("usage"),
                    job_id=job["id"],
                    provider="hyper3d",
                    consumed=private["consumed"],
                    created_at=now(),
                ),
            )
        self.jobs.update(job["id"], "waiting")
        return private

    def query(self, client, path, payload, deadline):
        while time.monotonic() < deadline and not self.jobs.stop.is_set():
            try:
                response = client.post(path, json=payload)
            except httpx.TransportError:
                # No generation submission here; safe reconciliation next poll/restart.
                if self.jobs.stop.wait(5):
                    return None
                continue
            if response.status_code == 429:
                if self.jobs.stop.wait(retry_after(response.headers.get("Retry-After"))):
                    return None
                continue
            if response.status_code >= 500:
                if self.jobs.stop.wait(5):
                    return None
                continue
            if not response.is_success:
                raise DomainError(
                    "rodin_query_failed",
                    "Rodin status/result query failed; known identifiers preserved",
                    502,
                    details={"http_status": response.status_code},
                    retryable=True,
                )
            data = response.json()
            if data.get("error"):
                raise DomainError(
                    "rodin_query_failed",
                    "Rodin status/result query reports an error",
                    502,
                    details={"vendor_error": str(data["error"])[:100]},
                    retryable=True,
                )
            return data
        return None

    def run(self, job):
        self.require_configured()
        request = AssetRequest.model_validate(
            {k: v for k, v in job["payload"].items() if k != "reference_hashes"}
        )
        p = self.store.get("project", job["project_id"])
        component = next((c for c in p["components"] if c["part_id"] == request.part_id), None)
        if not component:
            raise DomainError("not_found", "Originating component no longer exists", 404)
        images = (
            [base64.b64decode(data) for data in job["private"]["frozen_reference_images"]]
            if job["private"].get("frozen_reference_images")
            else self.photos.images(p["id"], request.photo_ids, request.part_id)
        )
        asset_hash = digest(
            dict(
                part_id=request.part_id,
                photos=[hashlib.sha256(data).hexdigest() for data in images],
                prompt=request.prompt,
                tier=request.tier,
                quality=request.quality_override,
            )
        )
        ready = self.store.all("asset", project_id=p["id"], input_hash=asset_hash)
        if ready:
            return ready[-1]
        deadline = time.monotonic() + self.settings.rodin_wait_deadline_seconds
        with self.client() as client:
            private = job["private"]
            if not private.get("task_uuid") or not private.get("subscription_key"):
                if job["stage"] != "queued":
                    raise DomainError(
                        "unknown_submission",
                        "Paid submission has no saved identifiers; reconcile manually",
                        409,
                    )
                private = self.submit(client, job, request, images)
            delay = 5
            while time.monotonic() < deadline and not self.jobs.stop.is_set():
                if self.jobs.stop.wait(delay):
                    return None
                status = self.query(
                    client, "/status", {"subscription_key": private["subscription_key"]}, deadline
                )
                if status is None:
                    return None
                states = [j.get("status") for j in status.get("jobs", [])]
                if "Failed" in states:
                    raise DomainError("rodin_failed", "Rodin generation failed", 502)
                if states and all(state == "Done" for state in states):
                    break
                self.jobs.update(job["id"], "generating" if "Generating" in states else "waiting")
                delay = min(delay + 5, 30)
            else:
                self.jobs.update(
                    job["id"],
                    "waiting",
                    result={
                        "message": "Local wait deadline reached; vendor job remains pending. Status polling resumes reconciliation."
                    },
                )
                return None
            self.jobs.update(job["id"], "downloading")
            results = self.query(client, "/download", {"task_uuid": private["task_uuid"]}, deadline)
            if results is None:
                return None
            entries = [
                entry
                for entry in results.get("list", [])
                if entry.get("name", "").lower().endswith(".glb")
            ]
            if not entries:
                raise DomainError(
                    "rodin_result_missing", "Rodin completed without a GLB result", 502
                )
            data, _, _ = download_public(entries[0]["url"], 64 * 1024 * 1024)
            if not data.startswith(b"glTF"):
                raise DomainError("invalid_visual_asset", "Downloaded result is not a GLB", 502)
            self.jobs.update(job["id"], "validating")
            scene = trimesh.load(io.BytesIO(data), file_type="glb", force="scene")
            if (
                not scene.geometry
                or any(len(g.vertices) == 0 for g in scene.geometry.values())
                or not np.isfinite(scene.bounds).all()
            ):
                raise DomainError("invalid_visual_asset", "GLB contains no finite geometry", 502)
            extents = scene.extents
            if min(extents) <= 0:
                raise DomainError("invalid_visual_asset", "GLB bounds have zero extent", 502)
            original = self.artifacts.save_bytes(
                data,
                "original.glb",
                role="visual_reference_original",
                mime_type="model/gltf-binary",
                project_id=p["id"],
                part_id=request.part_id,
            )
            preview = self.artifacts.save_bytes(
                scene.export(file_type="glb"),
                "preview.glb",
                role="visual_reference_preview",
                mime_type="model/gltf-binary",
                project_id=p["id"],
                part_id=request.part_id,
            )
            calibration = dict(
                status="needs_review",
                source_units="model_coordinates",
                source_frame="glTF_y_up",
                bounds=scene.bounds.tolist(),
                uniform_scale=None,
                translation_m=None,
                rotation_quaternion_xyzw=[0, 0, 0, 1],
                method="unreviewed",
                dimensional_authority=False,
            )
            if component["dimensions_confirmed"]:
                w, d, h = component["size_mm"]
                target = np.array([w, h, d]) / 1000
                scale = float(min(target / extents))
                calibration.update(
                    uniform_scale=scale,
                    translation_m=(
                        np.array([w, h, -d]) / 2000 - scene.bounds.mean(axis=0) * scale
                    ).tolist(),
                    method="uniform envelope alignment; illustrative reference",
                    proportions_match=bool(
                        np.max(np.abs(extents * scale - target) / target) < 0.05
                    ),
                )
            asset = dict(
                id=uid("asset"),
                project_id=p["id"],
                part_id=request.part_id,
                input_hash=asset_hash,
                status="ready",
                original=original,
                preview=preview,
                calibration=calibration,
                job_id=job["id"],
                created_at=now(),
                source_type="rodin_reference",
            )
            with self.store.transaction():
                self.store.put("asset", asset)
                current = self.store.get("project", p["id"])
                for c in current["components"]:
                    if c["part_id"] == request.part_id:
                        c["visual_asset_id"] = asset["id"]
                # Visual completion does not change engineering dimensions/version/hash.
                self.store.put("project", current)
            return asset
