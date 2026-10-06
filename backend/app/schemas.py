from __future__ import annotations
import math
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

Number = Annotated[float, Field(allow_inf_nan=False, ge=-10000, le=10000)]
Positive = Annotated[float, Field(allow_inf_nan=False, gt=0, le=10000)]
Vec3 = tuple[Number, Number, Number]
Size3 = tuple[Positive, Positive, Positive]
PartID = Annotated[str, Field(pattern=r"^[a-zA-Z0-9_-]{1,64}$")]
OperationID = Annotated[str, Field(min_length=1, max_length=128)]


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Pose(Model):
    translation_mm: Vec3 = (0, 0, 0)
    rotation_quaternion_xyzw: tuple[Number, Number, Number, Number] = (0, 0, 0, 1)

    @model_validator(mode="after")
    def normalized(self):
        norm = math.sqrt(sum(x * x for x in self.rotation_quaternion_xyzw))
        if abs(norm - 1) > 1e-6:
            raise ValueError("quaternion must be normalized")
        return self


class Crop(Model):
    photo_id: str
    box_xyxy: tuple[Number, Number, Number, Number]
    coordinates: Literal["normalized"] = "normalized"

    @model_validator(mode="after")
    def valid_box(self):
        x0, y0, x1, y1 = self.box_xyxy
        if not (0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1):
            raise ValueError("crop must be a nonempty normalized box in [0,1]")
        return self


class Component(Model):
    part_id: PartID
    component_version: int = Field(default=1, ge=1)
    name: str = Field(min_length=1, max_length=200)
    role: Literal["hardware_reference"] = "hardware_reference"
    identity: str | None = None
    identity_confirmed: bool = False
    size_mm: tuple[Positive | None, Positive | None, Positive | None] = (None, None, None)
    pose: Pose = Field(default_factory=Pose)
    dimensions_confirmed: bool = False
    dimensions_source: str = "unknown"
    evidence_ids: list[str] = Field(default_factory=list)
    capabilities: list[str] = Field(default_factory=list)
    keepout_mm: tuple[
        Annotated[float, Field(ge=0, le=1000, allow_inf_nan=False)],
        Annotated[float, Field(ge=0, le=1000, allow_inf_nan=False)],
        Annotated[float, Field(ge=0, le=1000, allow_inf_nan=False)],
    ] = (0, 0, 0)
    mounting_points_mm: list[Vec3] = Field(default_factory=list, max_length=32)
    interfaces: list[str] = Field(default_factory=list)
    visual_asset_id: str | None = None
    crop: Crop | None = None
    engineering_geometry: Literal["dimensioned_box"] = "dimensioned_box"
    printable_output: Literal[False] = False
    locked_fields: list[Literal["pose", "size_mm"]] = Field(default_factory=list)

    @model_validator(mode="after")
    def known_dimensions(self):
        if self.dimensions_confirmed and any(x is None for x in self.size_mm):
            raise ValueError("confirmed dimensions require all three finite positive fields")
        return self


class Preferences(Model):
    experience: Literal["first_project", "some_projects", "experienced"] | None = None
    interests: list[str] = Field(default_factory=list, max_length=20)
    tools: list[str] | None = None
    skills: list[str] | None = None
    use_setting: str | None = None
    form_factor: str | None = None
    maximum_size_mm: Size3 | None = None
    must_use_part_ids: list[PartID] = Field(default_factory=list)
    allow_additional_parts: bool = True
    time_budget: str | None = None
    monetary_budget: str | None = None


class Enclosure(Model):
    width_mm: Positive
    depth_mm: Positive
    height_mm: Positive
    wall_mm: Positive = 2
    base_mm: Positive = 2
    lid_mm: Positive = 2
    lid_register_mm: Annotated[float, Field(ge=0, le=20, allow_inf_nan=False)] = 0
    lid_fit_clearance_mm: Annotated[float, Field(gt=0, le=2, allow_inf_nan=False)] = 0.25
    required_clearance_mm: Annotated[float, Field(ge=0, le=1000, allow_inf_nan=False)] = 2
    minimum_wall_mm: Positive = 1
    locked_fields: list[
        Literal[
            "width_mm",
            "depth_mm",
            "height_mm",
            "wall_mm",
            "base_mm",
            "lid_mm",
            "lid_register_mm",
            "lid_fit_clearance_mm",
        ]
    ] = Field(default_factory=list)

    @model_validator(mode="after")
    def cavity_exists(self):
        if self.width_mm <= 2 * self.wall_mm or self.depth_mm <= 2 * self.wall_mm:
            raise ValueError("wall thickness leaves no cavity")
        if self.height_mm <= self.base_mm + self.lid_mm:
            raise ValueError("base and lid leave no cavity")
        if self.lid_register_mm:
            if self.lid_register_mm >= self.height_mm - self.base_mm - self.lid_mm:
                raise ValueError("lid register leaves no cavity height")
            if (
                min(self.width_mm, self.depth_mm)
                <= 4 * self.wall_mm + 2 * self.lid_fit_clearance_mm
            ):
                raise ValueError("lid register leaves no inner opening")
        return self


class Node(Model):
    id: PartID
    op: Literal["box", "cylinder", "translate", "rotate", "union", "subtract"]
    size_mm: Size3 | None = None
    lower_corner_mm: Vec3 | None = None
    radius_mm: Positive | None = None
    height_mm: Positive | None = None
    origin_mm: Vec3 | None = None
    axis: Vec3 | None = None
    child: PartID | None = None
    translation_mm: Vec3 | None = None
    quaternion_xyzw: tuple[Number, Number, Number, Number] | None = None
    pivot_mm: Vec3 | None = None
    children: list[PartID] | None = Field(default=None, max_length=100)
    base: PartID | None = None
    tools: list[PartID] | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def parameters(self):
        allowed = {
            "box": {"size_mm", "lower_corner_mm"},
            "cylinder": {"radius_mm", "height_mm", "origin_mm", "axis"},
            "translate": {"child", "translation_mm"},
            "rotate": {"child", "quaternion_xyzw", "pivot_mm"},
            "union": {"children"},
            "subtract": {"base", "tools"},
        }[self.op]
        present = {k for k, v in self.model_dump().items() if v is not None} - {"id", "op"}
        if present != allowed:
            raise ValueError(f"{self.op} requires exactly {sorted(allowed)}")
        if self.axis is not None and abs(sum(x * x for x in self.axis) - 1) > 1e-6:
            raise ValueError("cylinder axis must be normalized")
        if self.quaternion_xyzw is not None:
            Pose(rotation_quaternion_xyzw=self.quaternion_xyzw)
        if self.children is not None and len(self.children) < 2:
            raise ValueError("union needs at least two children")
        if self.tools is not None and not self.tools:
            raise ValueError("subtract needs cutting tools")
        return self

    def references(self):
        return (
            ([self.child] if self.child else [])
            + ([self.base] if self.base else [])
            + (self.children or [])
            + (self.tools or [])
        )


class RecipePart(Model):
    id: PartID
    node_id: PartID
    role: Literal["printable_cad", "hardware_reference"] = "printable_cad"
    pose: Pose = Field(default_factory=Pose)


class Constraint(Model):
    id: PartID
    kind: Literal["non_intersection", "minimum_distance"]
    part_ids: tuple[PartID, PartID]
    required_mm: Annotated[float, Field(ge=0, le=1000, allow_inf_nan=False)] = 0


class Recipe(Model):
    schema_version: Literal[1] = 1
    units: Literal["mm"] = "mm"
    nodes: list[Node] = Field(min_length=1, max_length=100)
    parts: list[RecipePart] = Field(min_length=1, max_length=12)
    constraints: list[Constraint] = Field(default_factory=list, max_length=50)

    @model_validator(mode="after")
    def dag(self):
        nodes = {n.id: n for n in self.nodes}
        ids = [p.id for p in self.parts]
        if len(nodes) != len(self.nodes) or len(set(ids)) != len(ids):
            raise ValueError("node and part IDs must be unique")

        depths = {}
        visiting = set()

        def visit(key):
            if key not in nodes:
                raise ValueError(f"unknown node {key}")
            if key in visiting:
                raise ValueError("recipe cycle")
            if key in depths:
                return depths[key]
            visiting.add(key)
            depth = 1 + max((visit(ref) for ref in nodes[key].references()), default=0)
            visiting.remove(key)
            if depth > 12:
                raise ValueError("recipe depth >12")
            depths[key] = depth
            return depth

        for node in nodes:
            visit(node)
        for part in self.parts:
            visit(part.node_id)
        for c in self.constraints:
            if any(x not in ids for x in c.part_ids) or c.part_ids[0] == c.part_ids[1]:
                raise ValueError("constraint references distinct known parts")
        return self


class DesignSpec(Model):
    schema_version: Literal[1] = 1
    units: Literal["mm"] = "mm"
    components: list[Component] = Field(default_factory=list, max_length=10)
    enclosure: Enclosure | None = None
    recipe: Recipe | None = None
    printer_model: Literal["bambu_p2s"] | None = None
    printer_volume_mm: Size3 | None = None
    requested_analyses: list[str] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def buildable(self):
        if (self.enclosure is None) == (self.recipe is None):
            raise ValueError("supply exactly one enclosure helper or recipe")
        if self.printer_model == "bambu_p2s" and self.printer_volume_mm != (256, 256, 256):
            raise ValueError("Bambu P2S requires a 256 x 256 x 256 mm volume")
        ids = [x.part_id for x in self.components]
        if len(ids) != len(set(ids)) or any(x in ("base", "lid") for x in ids):
            raise ValueError("component IDs unique; base/lid reserved for enclosure")
        if self.enclosure is not None:
            if not self.components:
                raise ValueError("enclosure requires reviewed components")
            if any(not c.dimensions_confirmed for c in self.components):
                raise ValueError("enclosure requires confirmed dimensions")
        return self


class ProjectCreate(Model):
    initial_text: str | None = Field(default=None, max_length=12000)
    name: str = Field(min_length=1, max_length=200)
    intent_mode: Literal["idea", "discover"]
    goal: str | None = Field(default=None, max_length=4000)
    preferences: Preferences = Field(default_factory=Preferences)
    components: list[Component] = Field(default_factory=list, max_length=10)
    spec: DesignSpec | None = None

    @model_validator(mode="after")
    def intent(self):
        if self.intent_mode == "idea" and not (self.goal and self.goal.strip()):
            raise ValueError("idea mode requires a goal")
        components = self.spec.components if self.spec else self.components
        if len(set(c.part_id for c in components)) != len(components):
            raise ValueError("duplicate part IDs")
        if self.spec and self.components:
            raise ValueError("supply components in spec or components, not both")
        if any(c.visual_asset_id for c in components):
            raise ValueError("visual assets must be attached through the asset workflow")
        return self


class ProjectEdit(Model):
    expected_draft_version: int
    name: str | None = Field(default=None, min_length=1, max_length=200)
    intent_mode: Literal["idea", "discover"] | None = None
    goal: str | None = Field(default=None, max_length=4000)
    preferences: Preferences | None = None


class EvidenceDecision(Model):
    evidence_id: str
    acceptance: Literal["accepted", "user_override", "rejected", "disputed"]


class ConfirmRequest(Model):
    expected_draft_version: int
    components: list[Component] = Field(default_factory=list, max_length=10)
    remove_part_ids: list[PartID] = Field(default_factory=list, max_length=10)
    evidence_decisions: list[EvidenceDecision] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def not_empty(self):
        if not self.components and not self.remove_part_ids and not self.evidence_decisions:
            raise ValueError("confirmation must include components, removals or evidence decisions")
        return self


class Operation(Model):
    client_operation_id: OperationID


class CandidateRequest(Operation):
    expected_draft_version: int
    parent_revision_id: str | None
    spec: DesignSpec
    request: str = Field(default="", max_length=4000)


class AcceptRequest(Operation):
    expected_active_parent: str | None


class PhotoAnalyzeRequest(Operation):
    photo_ids: list[str] = Field(min_length=1, max_length=5)
    expected_draft_version: int


class LookupRequest(Operation):
    identifiers: str = Field(min_length=1, max_length=1000)
    source_url: str | None = None


class ConceptGenerateRequest(Operation):
    expected_draft_version: int
    inventory_hash: str
    preference_prompt: str = Field(default="", max_length=4000)


class ConceptSelectRequest(Model):
    expected_draft_version: int
    inventory_hash: str


class AgentRequest(Operation):
    message: str = Field(min_length=1, max_length=12000)
    expected_draft_version: int
    parent_revision_id: str | None
    selected_part_id: PartID | None = None
    current_stage: Literal["parts", "discover", "confirm", "engineer", "export"] | None = None


class AssetRequest(Operation):
    part_id: PartID
    photo_ids: list[str] = Field(min_length=1, max_length=5)
    prompt: str = Field(
        default="Faithful independent hardware component reference; neutral illumination, no invented wires or labels.",
        max_length=1000,
    )
    tier: Literal["Gen-2.5-Low", "Gen-2.5-Medium"] = "Gen-2.5-Low"
    quality_override: int = Field(default=10000, ge=500, le=20000)


class FieldEvidence(Model):
    id: str
    part_id: PartID
    field: Literal["length", "width", "assembled_height", "identity", "capability", "interface"]
    proposed_value_mm: Positive | None = None
    text: str
    source_id: str
    source_location: str | None = None
    applicability_reason: str | None = None
    identity_candidate: str
    applicability: Literal["exact_variant", "likely_variant", "ambiguous", "chip_only"]
    acceptance: Literal["proposed", "accepted", "user_override", "rejected", "disputed"] = (
        "proposed"
    )


class Concept(Model):
    title: str
    purpose: str
    goal: str
    used_part_ids: list[PartID]
    unused_part_ids: list[PartID]
    additional_hardware: list[str]
    software_firmware_dependencies: list[str]
    why_this_fits_you: str
    skills_tools: list[str]
    difficulty_reasons: list[str]
    form_factor_rationale: str
    layout_rationale: str
    evidence_ids: list[str]
    assumptions: list[str]
    required_measurements: list[str]
    supported_family: Literal["rectangular_enclosure", "bounded_recipe", "requires_extension"]
    supported_operations: list[
        Literal["box", "cylinder", "translate", "rotate", "union", "subtract", "assembly"]
    ]
    next_steps: list[str]
    geometry_status: Literal["schematic", "estimated"]


class LockReviewRequest(Model):
    expected_draft_version: int
    expected_active_parent: str | None
    enclosure_locked_fields: list[
        Literal[
            "width_mm",
            "depth_mm",
            "height_mm",
            "wall_mm",
            "base_mm",
            "lid_mm",
            "lid_register_mm",
            "lid_fit_clearance_mm",
        ]
    ]
    component_locked_fields: dict[PartID, list[Literal["pose", "size_mm"]]] = Field(
        default_factory=dict
    )


class CalibrationReviewRequest(Model):
    aligned_size_mm: Size3 | None = None
    uniform_scale: Annotated[float, Field(gt=0, le=1000, allow_inf_nan=False)]
    translation_m: Vec3
    rotation_quaternion_xyzw: tuple[Number, Number, Number, Number]
    confirmed_illustrative_reference: Literal[True]

    @model_validator(mode="after")
    def rotation_valid(self):
        Pose(rotation_quaternion_xyzw=self.rotation_quaternion_xyzw)
        return self
