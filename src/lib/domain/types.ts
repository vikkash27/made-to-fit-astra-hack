import type { AssemblyRecord, VisualAssetRecord } from "@/lib/api/backend-types";
/**
 * Canonical frontend view of project state. Mirrors PRD §8.2 records at the
 * level the UI needs. The backend is authoritative; this is a projection.
 * All engineering lengths are millimetres, X width, Y depth, Z up.
 */

export type IntentMode = "idea" | "discover";
export type Experience = "first" | "some" | "experienced" | null;
export type Stage = "parts" | "discover" | "confirm" | "engineer" | "export";

/** A dimension value. `null` means unknown — never treat as zero. */
export interface DimField {
  value: number | null;
  status: "unknown" | "proposed" | "accepted";
  sourceId?: string;
  sourceLabel?: string;
}

export type Vec3 = [number, number, number];

export interface PartAnchor {
  /** Normalized crop rect in [0,1], origin top-left of the normalized image. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export type PartCategory = "controller" | "display" | "sensor" | "battery" | "other";

export interface Part {
  dimensionEstimate?: import("@/lib/api/backend-types").DimensionEstimateRecord;
  id: string;
  label: string;
  category: PartCategory;
  identityProposed: string | null;
  identityAccepted: string | null;
  photoObservations?: {
    markings: string[];
    connections: string[];
    question?: string;
  };
  status: "proposed" | "accepted";
  photoId?: string;
  anchor?: PartAnchor;
  size: { x: DimField; y: DimField; z: DimField };
  /** Local envelope lower corner placement in project coordinates (mm). */
  pose: Vec3;
  rotation?: [number, number, number, number];
  visualAssetId?: string | null;
  visible: boolean;
  needsAttention?: string;
  /** True when produced by the fixture adapter, never by real analysis. */
  sample?: boolean;
}

export interface SourceDoc {
  id: string;
  title: string;
  url: string;
  publisher?: string;
}

export interface Concept {
  id: string;
  title: string;
  formFactor: string;
  purpose: string;
  partsUsed: string[];
  partsUnused: string[];
  additionalNeeded: string[];
  whyForYou: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  skills: string[];
  uncertainties: string[];
  nextMeasurements: string[];
  buildPath: string[];
  previewImage?: string;
  sample?: boolean;
  stale?: boolean;
  difficultyReason?: string;
  hardwareNeeded?: string[];
  softwareNeeded?: string[];
  layoutRationale?: string;
  supportedFamily?: string;
}

export interface Check {
  id: string;
  name: string;
  scope: "mechanical" | "fit" | "printability";
  status: "pass" | "fail" | "unverified" | "not_run";
  detail: string;
  required?: boolean;
  partIds?: string[];
  sample?: boolean;
}

export interface Artifact {
  id: string;
  kind: "step" | "stl" | "glb" | "3mf" | "record";
  name: string;
  url: string;
  bytes?: number;
  role?: string;
  partId?: string;
  sha256?: string;
  revisionId?: string;
  specHash?: string;
}

export interface EnclosureParams {
  wall: number;
  clearance: number;
  lidThickness: number;
  cornerRadius: number;
  width?: number;
  depth?: number;
  height?: number;
  baseThickness?: number;
  lidRegister?: number;
  lidFitClearance?: number;
}

export interface Revision {
  id: string;
  label: string;
  kind: "draft" | "candidate" | "accepted" | "failed";
  parentId: string | null;
  params: EnclosureParams;
  locks: string[];
  checks: Check[];
  artifacts: Artifact[];
  note?: string;
  createdAt: number;
  sample?: boolean;
  eligible?: boolean;
  specHash?: string;
  assembly?: AssemblyRecord | null;
  parts?: Part[];
  enclosureSize?: Vec3;
}

export type JobStage = "queued" | "running" | "succeeded" | "failed";
export interface Job {
  id: string;
  kind:
    | "photo_analysis"
    | "evidence"
    | "concepts"
    | "agent"
    | "cad_build"
    | "checks"
    | "reference"
    | "wiring"
    | "dimensions";
  stage: JobStage;
  backendStage?: string;
  partId?: string | null;
  label: string;
  error?: string;
  revisionId?: string;
  startedAt: number;
  finishedAt?: number;
  timing?: { sampleCount: number; observedRangeSeconds: [number, number] | null };
}

export type MessageCard =
  | { type: "identity"; partId: string; proposal: string; sources: SourceDoc[] }
  | { type: "measurement"; partId: string; field: "x" | "y" | "z"; prompt: string }
  | { type: "job"; jobId: string }
  | {
      type: "change";
      summary: string;
      diff: { field: keyof EnclosureParams; from: number; to: number }[];
      preservedLocks: string[];
      candidateId?: string;
      resolved?: "applied" | "kept";
    };

export interface Message {
  id: string;
  role: "user" | "astra" | "system";
  text: string;
  cards?: MessageCard[];
  refs?: string[];
  sample?: boolean;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  intentMode: IntentMode;
  goal: string | null;
  experience: Experience;
  tools: string[] | null;
  constraints: string[];
  useSetting?: string | null;
  allowAdditionalParts?: boolean;
  timeBudget?: string | null;
  stage: Stage;
  photos: { id: string; url: string; sample?: boolean }[];
  parts: Part[];
  concepts: Concept[];
  selectedConceptId: string | null;
  revisions: Revision[];
  acceptedRevisionId: string | null;
  candidateRevisionId: string | null;
  jobs: Job[];
  messages: Message[];
  draftVersion: number;
  inventoryHash?: string;
  visualAssets?: VisualAssetRecord[];
  createdAt: number;
}
