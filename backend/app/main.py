from contextlib import asynccontextmanager
import uuid
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from app.config import Settings
from app.errors import DomainError
from app.schemas import (
    ProjectCreate,
    ProjectEdit,
    ConfirmRequest,
    CandidateRequest,
    AcceptRequest,
    Operation,
    PhotoAnalyzeRequest,
    LookupRequest,
    ConceptGenerateRequest,
    ConceptSelectRequest,
    AgentRequest,
    AssetRequest,
    LockReviewRequest,
    CalibrationReviewRequest,
)
from app.responses import (
    ProjectView,
    RevisionView,
    AssemblyManifest,
    JobView,
    ChecksView,
    ExportsView,
    BuildGuideView,
)
from app.store import Store
from app.jobs import Jobs
from app.services.projects import Projects, assert_draft
from app.services.artifacts import Artifacts
from app.services.photos import Photos


def create_app(settings=None):
    settings = settings or Settings()
    store = Store(settings.data_dir)
    projects = Projects(store)
    artifacts = Artifacts(store, settings)
    photos = Photos(store, artifacts, settings)
    jobs = Jobs(store, settings)

    def cad_job(job):
        with jobs.cad_lock:
            jobs.update(job["id"], "building")
            return artifacts.build(job["revision_id"])

    jobs.handlers["cad_build"] = cad_job

    @asynccontextmanager
    async def lifespan(application):
        jobs.recover()
        yield
        jobs.close()
        store.db.close()

    api = FastAPI(title="Made to Fit backend", version="0.1.0", lifespan=lifespan)
    api.state.store, api.state.projects, api.state.artifacts, api.state.jobs = (
        store,
        projects,
        artifacts,
        jobs,
    )
    api.state.photos, api.state.settings = photos, settings
    api.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
        expose_headers=["Content-Disposition", "X-Request-ID"],
        allow_credentials=False,
    )

    @api.middleware("http")
    async def request_id(request, call_next):
        request.state.request_id = str(uuid.uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response

    @api.exception_handler(DomainError)
    async def domain_error(request: Request, error: DomainError):
        return JSONResponse(
            status_code=error.status,
            content={"error": dict(**error.public(), request_id=request.state.request_id)},
        )

    @api.exception_handler(RequestValidationError)
    async def validation_error(request: Request, error):
        # Do not echo raw input (it could contain secrets, invalid NaN, or huge image fields).
        details = [
            {"location": list(e["loc"]), "message": e["msg"], "type": e["type"]}
            for e in error.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "error": dict(
                    code="validation_error",
                    message="Request validation failed",
                    details=details,
                    retryable=False,
                    request_id=request.state.request_id,
                )
            },
        )

    @api.get("/health")
    def health():
        import cadquery as cq

        ready = cq.Solid.makeBox(1, 1, 1).isValid()
        return dict(
            status="ok",
            schema_version=1,
            cad=dict(ready=ready, version=cq.__version__, worker="serialized subprocess"),
            providers=dict(
                openai="configured" if settings.openai_api_key else "not_configured",
                openai_model=settings.openai_model,
                hyper3d="configured" if settings.hyper3d_api_key else "not_configured",
            ),
        )

    @api.post("/projects", status_code=201, response_model=ProjectView)
    def create_project(request: ProjectCreate):
        return projects.create(request)

    @api.get("/projects", response_model=list[ProjectView])
    def list_projects():
        return [projects.get(p["id"]) for p in reversed(store.all("project"))]

    @api.get("/projects/{project_id}", response_model=ProjectView)
    def get_project(project_id: str):
        return projects.get(project_id)

    @api.patch("/projects/{project_id}", response_model=ProjectView)
    def edit_project(project_id: str, request: ProjectEdit):
        return projects.edit(project_id, request)

    @api.post("/projects/{project_id}/locks/review", response_model=ProjectView)
    def review_locks(project_id: str, request: LockReviewRequest):
        return projects.review_locks(project_id, request)

    @api.post("/projects/{project_id}/components/confirm", response_model=ProjectView)
    def confirm(project_id: str, request: ConfirmRequest):
        return projects.confirm(project_id, request)

    @api.post("/projects/{project_id}/photos", status_code=201)
    async def upload(project_id: str, file: UploadFile = File(...)):
        import asyncio

        data = await file.read(settings.max_upload_bytes + 1)
        return await asyncio.to_thread(photos.upload, project_id, data, file.content_type)

    @api.post("/projects/{project_id}/candidates", status_code=201, response_model=RevisionView)
    def candidate(project_id: str, request: CandidateRequest):
        return projects.candidate(project_id, request)

    @api.get("/revisions/{revision_id}", response_model=RevisionView)
    def revision(revision_id: str):
        r = store.get("revision", revision_id)
        r["eligible_for_acceptance"] = artifacts.eligible(r)
        return r

    @api.post("/revisions/{revision_id}/build", status_code=202, response_model=JobView)
    def build(revision_id: str, request: Operation):
        r = store.get("revision", revision_id)
        return jobs.create(
            "cad_build",
            r["project_id"],
            request.model_dump(mode="json"),
            request.client_operation_id,
            revision_id,
        )

    @api.post("/revisions/{revision_id}/checks", response_model=ChecksView)
    def checks(revision_id: str):
        r = store.get("revision", revision_id)
        if not r["manifest"]:
            raise DomainError("build_required", "Build the frozen candidate before geometry checks")
        return dict(
            revision_id=revision_id,
            spec_hash=r["spec_hash"],
            checks=r["checks"],
            eligible_for_acceptance=artifacts.eligible(r),
        )

    @api.post("/revisions/{revision_id}/accept", response_model=RevisionView)
    def accept(revision_id: str, request: AcceptRequest):
        return artifacts.accept(revision_id, request)

    @api.get("/revisions/{revision_id}/assembly", response_model=AssemblyManifest)
    def assembly(revision_id: str):
        r = store.get("revision", revision_id)
        if not r["manifest"]:
            raise DomainError("build_required", "CAD assembly not built")
        return r["manifest"]

    @api.get("/revisions/{revision_id}/exports", response_model=ExportsView)
    def exports(revision_id: str):
        r = store.get("revision", revision_id)
        if not r["manifest"]:
            raise DomainError("build_required", "No artifacts for this revision")
        return dict(
            revision_id=revision_id,
            spec_hash=r["spec_hash"],
            state=r["state"],
            is_current_accepted=store.get("project", r["project_id"])["active_accepted_revision_id"]
            == revision_id,
            artifacts=r["artifacts"],
            checks=r["checks"],
        )

    @api.get("/artifacts/{artifact_id}")
    def artifact(artifact_id: str, download: bool = False):
        a, path = artifacts.path(artifact_id)
        return FileResponse(
            path,
            media_type=a["mime_type"],
            filename=a["filename"],
            content_disposition_type="attachment" if download else "inline",
            headers={"ETag": f'"{a["sha256"]}"', "Cache-Control": "private, max-age=3600"},
        )

    @api.get("/revisions/{revision_id}/build-guide", response_model=BuildGuideView)
    def guide(revision_id: str):
        r = store.get("revision", revision_id)
        p = store.get("project", r["project_id"])
        if r["state"] != "accepted" or p["active_accepted_revision_id"] != revision_id:
            raise DomainError(
                "acceptance_required", "Accept this design before opening its build guide"
            )
        if not r.get("build_guide"):
            raise DomainError(
                "guide_unavailable",
                "Build and accept a new revision to create its assembly guide",
                404,
            )
        return r["build_guide"]

    @api.get("/projects/{project_id}/messages")
    def messages(project_id: str):
        store.get("project", project_id)
        return dict(messages=store.all("message", project_id=project_id))

    @api.get("/projects/{project_id}/component-proposals")
    def proposals(project_id: str):
        p = store.get("project", project_id)
        values = store.all("component_proposal", project_id=project_id)
        for value in values:
            value["stale"] = value["draft_version"] != p["draft_version"]
        return dict(proposals=values)

    @api.get("/assets/{asset_id}")
    def visual_asset(asset_id: str):
        return store.get("asset", asset_id)

    @api.post("/assets/{asset_id}/calibration")
    def review_calibration(asset_id: str, request: CalibrationReviewRequest):
        with store.transaction():
            asset = store.get("asset", asset_id)
            component = next(
                (
                    c
                    for c in store.get("project", asset["project_id"])["components"]
                    if c["part_id"] == asset["part_id"]
                ),
                None,
            )
            if not component or not component["dimensions_confirmed"]:
                raise DomainError(
                    "measurements_required",
                    "Confirm this component's dimensions before aligning the reference",
                    422,
                )
            if request.aligned_size_mm and list(request.aligned_size_mm) != component["size_mm"]:
                raise DomainError(
                    "stale_dimensions",
                    "Component dimensions changed; review the alignment again",
                    409,
                )
            asset["calibration"].update(
                aligned_size_mm=component["size_mm"],
                uniform_scale=request.uniform_scale,
                translation_m=list(request.translation_m),
                rotation_quaternion_xyzw=list(request.rotation_quaternion_xyzw),
                status="reviewed",
                method="user-reviewed illustrative alignment",
            )
            store.put("asset", asset)
        return asset

    @api.post("/jobs/{job_id}/reconcile", response_model=JobView, status_code=202)
    def reconcile(job_id: str):
        with store.transaction():
            j = store.get("job", job_id)
            if (
                j["kind"] != "visual_asset"
                or not j["private"].get("task_uuid")
                or not j["private"].get("subscription_key")
            ):
                raise DomainError(
                    "reconciliation_unavailable",
                    "Reconciliation requires known saved vendor identifiers",
                )
            if j["stage"] == "ready":
                return jobs.public(j)
            if j.get("error") and j["error"]["code"] == "rodin_failed":
                raise DomainError("vendor_failed", "Vendor reported terminal generation failure")
            j["stage"] = "waiting"
            j["error"] = None
            store.put("job", j)
        jobs.dispatch(job_id)
        return jobs.get(job_id)

    @api.get("/jobs/{job_id}", response_model=JobView)
    def job(job_id: str):
        j = store.get("job", job_id)
        if j["kind"] == "visual_asset" and j["stage"] not in (
            "ready",
            "failed",
            "unknown_submission",
            "cancelled",
        ):
            jobs.dispatch(job_id)
        return jobs.get(job_id)

    # Provider services are imported lazily so native CAD remains usable with no API keys.
    from app.services.ai import AIService
    from app.providers.rodin import RodinService

    ai = AIService(store, settings, projects, artifacts, photos, jobs)
    rodin = RodinService(store, settings, artifacts, photos, jobs)
    jobs.handlers.update(
        photo_analysis=ai.analyze,
        lookup=ai.lookup,
        concept_generation=ai.concepts,
        agent=ai.agent,
        visual_asset=rodin.run,
    )
    api.state.ai, api.state.rodin = ai, rodin

    @api.post("/projects/{project_id}/photos/analyze", status_code=202, response_model=JobView)
    def analyze(project_id: str, request: PhotoAnalyzeRequest):
        ai.require_configured()
        p = store.get("project", project_id)
        assert_draft(p, request.expected_draft_version)
        photos.images(project_id, request.photo_ids)
        return jobs.create(
            "photo_analysis",
            project_id,
            request.model_dump(mode="json"),
            request.client_operation_id,
        )

    @api.post(
        "/projects/{project_id}/components/{part_id}/lookup",
        status_code=202,
        response_model=JobView,
    )
    def lookup(project_id: str, part_id: str, request: LookupRequest):
        ai.require_configured()
        ai.component(project_id, part_id)
        return jobs.create(
            "lookup",
            project_id,
            request.model_dump(mode="json"),
            request.client_operation_id,
            part_id=part_id,
        )

    @api.get("/projects/{project_id}/components/{part_id}/evidence")
    def evidence(project_id: str, part_id: str):
        return ai.evidence(project_id, part_id)

    @api.post("/projects/{project_id}/concepts/generate", status_code=202, response_model=JobView)
    def concepts_generate(project_id: str, request: ConceptGenerateRequest):
        ai.require_configured()
        p = store.get("project", project_id)
        assert_draft(p, request.expected_draft_version)
        if request.inventory_hash != p["inventory_hash"]:
            raise DomainError("stale_inventory", "Inventory hash does not match current draft")
        if not p["components"]:
            raise DomainError(
                "inventory_required", "Add components before discovering concepts", 422
            )
        return jobs.create(
            "concept_generation",
            project_id,
            request.model_dump(mode="json"),
            request.client_operation_id,
        )

    @api.get("/projects/{project_id}/concepts")
    def concepts_list(project_id: str):
        p = store.get("project", project_id)
        values = store.all("concept", project_id=project_id)
        for c in values:
            c["stale"] = c["inventory_hash"] != p["inventory_hash"] or (
                c["draft_version"] != p["draft_version"] and c["id"] != p["selected_concept_id"]
            )
        return dict(
            inventory_hash=p["inventory_hash"], draft_version=p["draft_version"], concepts=values
        )

    @api.post("/projects/{project_id}/concepts/{concept_id}/select", response_model=ProjectView)
    def select(project_id: str, concept_id: str, request: ConceptSelectRequest):
        return projects.select_concept(project_id, concept_id, request)

    @api.post("/projects/{project_id}/agent", status_code=202, response_model=JobView)
    def agent(project_id: str, request: AgentRequest):
        ai.require_configured()
        p = store.get("project", project_id)
        assert_draft(p, request.expected_draft_version)
        if request.parent_revision_id != p["active_accepted_revision_id"]:
            raise DomainError("stale_parent", "Active accepted parent changed")
        if request.selected_part_id:
            ai.component(project_id, request.selected_part_id)
        return jobs.create(
            "agent", project_id, request.model_dump(mode="json"), request.client_operation_id
        )

    @api.post("/projects/{project_id}/assets/generate", status_code=202, response_model=JobView)
    def asset_generate(project_id: str, request: AssetRequest):
        rodin.require_configured()
        ai.component(project_id, request.part_id)
        # A part reference must use its reviewed crop or an explicit single-part photograph.
        import base64
        import hashlib

        images = photos.images(project_id, request.photo_ids, request.part_id)
        snapshot = request.model_dump(mode="json")
        snapshot["reference_hashes"] = [hashlib.sha256(data).hexdigest() for data in images]
        return jobs.create(
            "visual_asset",
            project_id,
            snapshot,
            request.client_operation_id,
            part_id=request.part_id,
            private={
                "frozen_reference_images": [base64.b64encode(data).decode() for data in images]
            },
        )

    return api


app = create_app()
