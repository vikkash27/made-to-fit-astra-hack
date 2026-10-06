/** Reviewed public Python contract; keep aligned with backend/app/{schemas,responses}.py. */
import type { Vec3 } from "@/lib/domain/types";
export interface ComponentRecord {
  part_id: string;
  component_version: number;
  name: string;
  role: "hardware_reference";
  identity: string | null;
  identity_confirmed: boolean;
  size_mm: [number | null, number | null, number | null];
  pose: { translation_mm: Vec3; rotation_quaternion_xyzw: [number, number, number, number] };
  dimensions_confirmed: boolean;
  dimensions_source: string;
  evidence_ids: string[];
  capabilities: string[];
  keepout_mm: Vec3;
  mounting_points_mm: Vec3[];
  interfaces: string[];
  visual_asset_id: string | null;
  crop: {
    photo_id: string;
    box_xyxy: [number, number, number, number];
    coordinates: "normalized";
  } | null;
  engineering_geometry: "dimensioned_box";
  printable_output: false;
  locked_fields: ("pose" | "size_mm")[];
}
export interface ComponentProposalRecord {
  component: ComponentRecord;
  stale: boolean;
  visible_markings?: string[];
  observed_connections?: string[];
  question?: string;
}
export interface DimensionEstimateRecord {
  id: string;
  part_id: string;
  width: EstimatedAxis;
  depth: EstimatedAxis;
  height: EstimatedAxis;
}
export interface EstimatedAxis {
  value_mm: number | null;
  range_mm: [number, number] | null;
  confidence: "low" | "medium";
  basis: string;
}
export interface EnclosureRecord {
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  wall_mm: number;
  base_mm: number;
  lid_mm: number;
  lid_register_mm?: number;
  lid_fit_clearance_mm?: number;
  required_clearance_mm: number;
  minimum_wall_mm: number;
  locked_fields: string[];
}
export interface SpecRecord {
  schema_version: 1;
  units: "mm";
  components: ComponentRecord[];
  enclosure: EnclosureRecord | null;
  recipe: Record<string, unknown> | null;
  printer_model?: "bambu_p2s" | null;
  printer_volume_mm: Vec3 | null;
  requested_analyses: string[];
}
export interface ArtifactRecord {
  id: string;
  url: string;
  filename: string;
  sha256: string;
  size_bytes: number;
  role: string;
  mime_type: string;
  revision_id?: string;
  spec_hash?: string;
  part_id?: string;
  units?: string;
  frame?: string;
}
export interface CheckRecord {
  check_id: string;
  revision_id: string;
  spec_hash: string;
  basis: string;
  status: "pass" | "fail" | "unknown" | "not_applicable";
  part_ids: string[];
  message: string;
  required?: boolean;
  measured_gap_mm?: number;
  required_gap_mm?: number;
  shortfall_mm?: number;
}
export interface AssemblyPartRecord {
  part_id: string;
  name: string;
  role: "printable_cad" | "hardware_reference";
  printable_output: boolean;
  size_mm: Vec3;
  pose: ComponentRecord["pose"];
  renderer_transform_matrix: number[];
  geometry_provenance: string;
  dimensions_source: string;
  bounds: { min_mm: Vec3; max_mm: Vec3 };
  local_bounds: { min_mm: Vec3; max_mm: Vec3 };
  preview_artifact: ArtifactRecord;
  mesh_artifact: ArtifactRecord;
  exports: ArtifactRecord[];
  visual_asset_id: string | null;
}
export interface AssemblyRecord {
  schema_version: 1;
  revision_id: string;
  spec_hash: string;
  units: "mm";
  frame: "engineering_z_up";
  parts: AssemblyPartRecord[];
  preview: {
    units: "m";
    frame: "renderer_y_up";
    conversion_applied: true;
    geometry_space: "part_local";
    assembly_artifact: ArtifactRecord;
  };
  artifacts: ArtifactRecord[];
  checks: CheckRecord[];
}
export interface RevisionRecord {
  id: string;
  project_id: string;
  parent_id: string | null;
  state: "candidate" | "checked" | "failed_checks" | "accepted";
  spec: SpecRecord;
  spec_hash: string;
  inventory_hash: string;
  draft_version: number;
  created_at: string;
  manifest: AssemblyRecord | null;
  checks: CheckRecord[];
  artifacts: ArtifactRecord[];
  eligible_for_acceptance?: boolean;
  request?: string;
  error: { code: string; message: string } | null;
}
export interface JobRecord {
  id: string;
  job_id?: string;
  project_id: string;
  revision_id: string | null;
  part_id?: string | null;
  kind:
    | "cad_build"
    | "photo_analysis"
    | "lookup"
    | "concept_generation"
    | "agent"
    | "visual_asset"
    | "wiring_plan"
    | "dimension_estimation";
  stage: string;
  result?: unknown;
  error: { code: string; message: string; retryable: boolean } | null;
  timing?: { sample_count: number; observed_range_seconds: [number, number] | null; basis: string };
  updated_at?: string;
  created_at?: string;
  events?: { stage: string; message?: string; timestamp?: string }[];
}
export interface ConceptRecord {
  id: string;
  title: string;
  purpose: string;
  goal: string;
  used_part_ids: string[];
  unused_part_ids: string[];
  additional_hardware: string[];
  software_firmware_dependencies: string[];
  why_this_fits_you: string;
  skills_tools: string[];
  difficulty_reasons: string[];
  form_factor_rationale: string;
  layout_rationale: string;
  assumptions: string[];
  required_measurements: string[];
  next_steps: string[];
  stale?: boolean;
  supported_family: string;
  geometry_status: string;
}
export interface ProjectRecord {
  dimension_estimates?: DimensionEstimateRecord[];
  id: string;
  name: string;
  goal: string | null;
  intent_mode: "idea" | "discover";
  preferences: {
    experience: "first_project" | "some_projects" | "experienced" | null;
    tools: string[] | null;
    interests: string[];
    form_factor: string | null;
    use_setting?: string | null;
    allow_additional_parts?: boolean;
    time_budget?: string | null;
    [key: string]: unknown;
  };
  components: ComponentRecord[];
  spec: SpecRecord | null;
  draft_version: number;
  inventory_hash: string;
  selected_concept_id: string | null;
  active_accepted_revision_id: string | null;
  revisions: { id: string }[];
  jobs: JobRecord[];
  photos: { id: string; artifact: ArtifactRecord }[];
  created_at: string;
}
export interface VisualAssetRecord {
  id: string;
  part_id: string;
  original?: ArtifactRecord;
  preview?: ArtifactRecord;
  calibration: {
    status: string;
    uniform_scale?: number;
    translation_m?: Vec3;
    rotation_quaternion_xyzw?: [number, number, number, number];
    dimensional_authority?: boolean;
    bounds?: [Vec3, Vec3];
    aligned_size_mm?: Vec3;
  };
  [key: string]: unknown;
}

export interface BuildGuideRecord {
  schema_version: 1;
  revision_id: string;
  spec_hash: string;
  title: string;
  purpose: string | null;
  parts: {
    part_id: string;
    name: string;
    role: "printable_cad" | "hardware_reference";
    size_mm: Vec3;
    position_mm: Vec3;
  }[];
  additional_hardware: string[];
  software_dependencies: string[];
  unresolved: string[];
  steps: {
    id: string;
    title: string;
    instruction: string;
    completion_check: string;
    part_ids: string[];
    requires_review: boolean;
  }[];
  checks: { name: string; status: string; detail: string }[];
}

export interface WiringEndpoint {
  part_id: string;
  pin: string;
}
export interface WiringConnection {
  id: string;
  start: WiringEndpoint;
  end: WiringEndpoint;
  signal: string;
  kind: "power" | "ground" | "signal";
  color: "red" | "black" | "yellow" | "blue" | "green" | "white";
  voltage_v: number;
  instruction: string;
  completion_check: string;
  evidence: { part_id: string; source_id: string; location: string; quote: string }[];
}
export interface WiringPlanRecord {
  id: string;
  revision_id: string;
  spec_hash: string;
  plan_hash: string;
  status: "needs_review" | "reviewed";
  overview: string;
  power_plan: string;
  connections: WiringConnection[];
  unresolved: string[];
  sources: { id: string; title: string; url: string; publisher: string; sha256: string }[];
  artifacts: ArtifactRecord[];
}
export interface WiringState {
  revision_id: string;
  spec_hash: string;
  plan: WiringPlanRecord | null;
}
export interface GuideProgressRecord {
  revision_id: string;
  spec_hash: string;
  completed_step_ids: string[];
  wiring_plan_id?: string | null;
}
