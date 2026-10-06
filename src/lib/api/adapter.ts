/**
 * The ONE backend boundary for the UI (PRD §15). Two implementations:
 *  - HttpAdapter: real Python backend at VITE_API_BASE_URL.
 *  - FixtureAdapter: labelled UI preview with sample data. Never a fallback.
 */
import type {
  Artifact,
  Concept,
  EnclosureParams,
  Experience,
  IntentMode,
  Job,
  Part,
  Project,
  Revision,
  SourceDoc,
} from "@/lib/domain/types";

export interface Health {
  ok: boolean;
  cad: boolean;
  astraConfigured: boolean;
  rodinConfigured: boolean;
  mode: "http" | "fixture";
}

export interface JobRef {
  job_id: string;
}

export interface JobStatus {
  job_id: string;
  kind: Job["kind"];
  stage: Job["stage"];
  project_id: string;
  revision_id?: string | null;
  error?: { code: string; message: string; retryable: boolean } | null;
}

export interface Evidence {
  partId: string;
  candidates: { identity: string; confidence: number }[];
  proposals: {
    field: "x" | "y" | "z";
    value: number;
    sourceId: string;
    evidenceId?: string;
    applicability?: string;
    acceptance?: string;
  }[];
  sources: SourceDoc[];
  missing: ("x" | "y" | "z")[];
  sample?: boolean;
}

export interface CreateProjectInput {
  name: string;
  intentMode: IntentMode;
  goal: string | null;
  initialText?: string;
}

export interface PartPatch {
  id?: string;
  label?: string;
  category?: Part["category"];
  identityAccepted?: string | null;
  accept?: boolean;
  size?: Partial<Record<"x" | "y" | "z", { value: number | null; accept: boolean }>>;
  visible?: boolean;
  remove?: boolean;
  evidenceDecisions?: {
    evidenceId: string;
    acceptance: "accepted" | "user_override" | "rejected" | "disputed";
  }[];
  crop?: { photoId: string; box: [number, number, number, number] };
}

export interface Preferences {
  experience?: Experience;
  tools?: string[] | null;
  constraints?: string[];
  goal?: string | null;
  intentMode?: IntentMode;
  useSetting?: string | null;
  allowAdditionalParts?: boolean;
  timeBudget?: string | null;
}

export interface BackendAdapter {
  readonly mode: "http" | "fixture";
  health(): Promise<Health>;
  reviewReference?(
    assetId: string,
    alignment: {
      scale: number;
      position: [number, number, number];
      rotation?: [number, number, number, number];
      size?: [number, number, number];
    },
  ): Promise<unknown>;
  getArtifactData?(artifactId: string): Promise<ArrayBuffer>;
  listProjects(): Promise<Pick<Project, "id" | "name" | "goal" | "stage" | "createdAt">[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(id: string): Promise<Project>;
  updatePreferences(id: string, prefs: Preferences): Promise<Project>;
  uploadPhoto(projectId: string, file: File): Promise<{ id: string; url: string }>;
  analyzePhotos(projectId: string, photoIds: string[]): Promise<JobRef>;
  lookupEvidence(projectId: string, partId: string, hint?: string): Promise<JobRef>;
  getEvidence(projectId: string, partId: string): Promise<Evidence>;
  confirmComponents(projectId: string, draftVersion: number, parts: PartPatch[]): Promise<Project>;
  generateConcepts(projectId: string, draftVersion: number, refinement?: string): Promise<JobRef>;
  listConcepts(projectId: string): Promise<Concept[]>;
  selectConcept(projectId: string, conceptId: string, draftVersion: number): Promise<Project>;
  agent(
    projectId: string,
    input: { text: string; parentRevisionId: string | null; context: string[] },
  ): Promise<JobRef>;
  createCandidate(
    projectId: string,
    parentId: string | null,
    params: EnclosureParams,
    locks: string[],
  ): Promise<Revision>;
  buildRevision(revisionId: string): Promise<JobRef>;
  runChecks(revisionId: string): Promise<JobRef | void>;
  acceptRevision(
    revisionId: string,
    expectedParentId: string | null,
    operationId: string,
  ): Promise<Revision>;
  generateReference(
    projectId: string,
    partIds: string[],
    operationId: string,
    detail?: "standard" | "detailed",
  ): Promise<JobRef>;
  getJob(jobId: string): Promise<JobStatus>;
  getExports(revisionId: string): Promise<Artifact[]>;
  getBuildGuide(revisionId: string): Promise<import("./backend-types").BuildGuideRecord>;
  /** Fixture-only helper; HTTP mode resolves the stored URL. */
  resolveArtifactUrl(url: string): string;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public retryable: boolean,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
