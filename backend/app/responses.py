"""Canonical public response schemas published by OpenAPI for the Lovable adapter."""

from typing import Any, Literal
from pydantic import BaseModel, ConfigDict
from app.schemas import Component, Pose, DesignSpec, Preferences


class Public(BaseModel):
    model_config = ConfigDict(extra="allow")


class ArtifactView(Public):
    id: str
    url: str
    filename: str
    sha256: str
    size_bytes: int
    role: str
    mime_type: str
    revision_id: str | None = None
    spec_hash: str | None = None
    part_id: str | None = None
    units: str | None = None
    frame: str | None = None


class CheckView(Public):
    check_id: str
    revision_id: str
    spec_hash: str
    basis: str
    status: Literal["pass", "fail", "unknown", "not_applicable"]
    part_ids: list[str]
    message: str
    measured_gap_mm: float | None = None
    required_gap_mm: float | None = None
    shortfall_mm: float | None = None
    required: bool | None = None


class AssemblyPart(Public):
    part_id: str
    name: str
    role: Literal["printable_cad", "hardware_reference"]
    printable_output: bool
    size_mm: list[float]
    pose: Pose
    renderer_transform_matrix: list[float]
    geometry_provenance: str
    dimensions_source: str
    bounds: dict[str, list[float]]
    local_bounds: dict[str, list[float]]
    preview_artifact: ArtifactView
    mesh_artifact: ArtifactView
    exports: list[ArtifactView]
    visual_asset_id: str | None = None


class PreviewInfo(Public):
    units: Literal["m"]
    frame: Literal["renderer_y_up"]
    conversion_applied: Literal[True]
    geometry_space: Literal["part_local"]
    assembly_artifact: ArtifactView
    conversion: str
    transform_order: list[str]


class AssemblyManifest(Public):
    schema_version: Literal[1]
    revision_id: str
    spec_hash: str
    units: Literal["mm"]
    frame: Literal["engineering_z_up"]
    parts: list[AssemblyPart]
    preview: PreviewInfo
    calibration: dict[str, Any]
    artifacts: list[ArtifactView]
    checks: list[CheckView]


class JobView(Public):
    id: str
    job_id: str
    kind: Literal[
        "cad_build", "photo_analysis", "lookup", "concept_generation", "agent", "visual_asset"
    ]
    project_id: str
    revision_id: str | None
    part_id: str | None
    stage: str
    result: Any | None
    error: dict[str, Any] | None
    events: list[dict[str, Any]]
    client_operation_id: str
    created_at: str
    updated_at: str


class ProjectView(Public):
    id: str
    schema_version: Literal[1]
    name: str
    goal: str | None
    intent_mode: Literal["idea", "discover"]
    preferences: Preferences
    components: list[Component]
    spec: DesignSpec | None
    draft_version: int
    inventory_hash: str
    selected_concept_id: str | None
    active_accepted_revision_id: str | None
    candidate_ids: list[str]
    revisions: list[dict[str, Any]]
    jobs: list[dict[str, Any]]
    photos: list[dict[str, Any]]
    brief: dict[str, Any]


class RevisionView(Public):
    id: str
    project_id: str
    parent_id: str | None
    state: Literal["candidate", "checked", "failed_checks", "accepted"]
    spec: DesignSpec
    spec_hash: str
    inventory_hash: str
    draft_version: int
    diff: list[dict[str, Any]]
    created_at: str
    manifest: AssemblyManifest | None
    checks: list[CheckView]
    artifacts: list[ArtifactView]
    error: dict[str, Any] | None
    eligible_for_acceptance: bool | None = None


class ChecksView(Public):
    revision_id: str
    spec_hash: str
    checks: list[CheckView]
    eligible_for_acceptance: bool


class ExportsView(Public):
    revision_id: str
    spec_hash: str
    state: str
    is_current_accepted: bool
    artifacts: list[ArtifactView]
    checks: list[CheckView]


class BuildGuidePart(Public):
    part_id: str
    name: str
    role: Literal["printable_cad", "hardware_reference"]
    size_mm: list[float]
    position_mm: list[float]


class BuildGuideStep(Public):
    id: str
    title: str
    instruction: str
    completion_check: str
    part_ids: list[str]
    requires_review: bool


class BuildGuideView(Public):
    schema_version: Literal[1]
    revision_id: str
    spec_hash: str
    title: str
    purpose: str | None
    parts: list[BuildGuidePart]
    additional_hardware: list[str]
    software_dependencies: list[str]
    unresolved: list[str]
    steps: list[BuildGuideStep]
    checks: list[dict[str, str]]
