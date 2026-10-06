import type { Artifact, Check, Concept, Job, Part, Revision } from "@/lib/domain/types";
import type {
  ArtifactRecord,
  CheckRecord,
  ComponentRecord,
  ConceptRecord,
  JobRecord,
  RevisionRecord,
} from "./backend-types";

export const time = (value?: string) => (value ? Date.parse(value) : 0);
export function projectPart(c: ComponentRecord): Part {
  const category = /battery|lipo/i.test(c.name)
    ? "battery"
    : /display|screen|oled/i.test(c.name)
      ? "display"
      : /sensor/i.test(c.name)
        ? "sensor"
        : /board|controller|esp|arduino/i.test(c.name)
          ? "controller"
          : "other";
  return {
    id: c.part_id,
    label: c.name,
    category,
    identityProposed: c.identity,
    identityAccepted: c.identity_confirmed ? (c.identity ?? c.name) : null,
    status: c.identity_confirmed ? "accepted" : "proposed",
    size: Object.fromEntries(
      ["x", "y", "z"].map((k, i) => [
        k,
        {
          value: c.size_mm[i],
          status:
            c.size_mm[i] == null ? "unknown" : c.dimensions_confirmed ? "accepted" : "proposed",
          sourceLabel: c.dimensions_source,
        },
      ]),
    ) as Part["size"],
    pose: c.pose.translation_mm,
    rotation: c.pose.rotation_quaternion_xyzw,
    visible: true,
    visualAssetId: c.visual_asset_id,
    photoId: c.crop?.photo_id,
    anchor: c.crop
      ? {
          x: c.crop.box_xyxy[0],
          y: c.crop.box_xyxy[1],
          w: c.crop.box_xyxy[2] - c.crop.box_xyxy[0],
          h: c.crop.box_xyxy[3] - c.crop.box_xyxy[1],
        }
      : undefined,
  };
}
export function projectArtifact(a: ArtifactRecord): Artifact {
  const ext = a.filename.split(".").pop()?.toLowerCase();
  return {
    id: a.id,
    name: a.filename,
    kind: ext === "step" || ext === "stl" || ext === "glb" || ext === "3mf" ? ext : "record",
    url: a.url,
    bytes: a.size_bytes,
    role: a.role,
    partId: a.part_id,
    sha256: a.sha256,
    revisionId: a.revision_id,
    specHash: a.spec_hash,
  };
}
export function projectCheck(c: CheckRecord): Check {
  return {
    id: c.check_id,
    name: c.check_id.replaceAll("_", " "),
    scope: /clearance|containment|intersection|clash/.test(c.check_id)
      ? "fit"
      : /wall|printer/.test(c.check_id)
        ? "printability"
        : "mechanical",
    status: c.status === "unknown" || c.status === "not_applicable" ? "unverified" : c.status,
    detail:
      c.message +
      (c.measured_gap_mm == null
        ? ""
        : ` · gap ${c.measured_gap_mm} mm / required ${c.required_gap_mm} mm / shortfall ${c.shortfall_mm} mm`),
    required: c.required,
    partIds: c.part_ids,
  };
}
export function projectRevision(r: RevisionRecord, index = 0): Revision {
  const e = r.spec.enclosure;
  return {
    id: r.id,
    label: `R${index + 1}`,
    kind:
      r.state === "accepted" ? "accepted" : r.state === "failed_checks" ? "failed" : "candidate",
    parentId: r.parent_id,
    params: {
      wall: e?.wall_mm ?? 2,
      clearance: e?.required_clearance_mm ?? 2,
      lidThickness: e?.lid_mm ?? 2,
      cornerRadius: 0,
      width: e?.width_mm,
      depth: e?.depth_mm,
      height: e?.height_mm,
      baseThickness: e?.base_mm,
      lidRegister: e?.lid_register_mm ?? 0,
      lidFitClearance: e?.lid_fit_clearance_mm ?? 0.25,
    },
    locks: [
      ...(e?.locked_fields ?? []).map((k) => `enclosure:${k}`),
      ...r.spec.components.flatMap((c) =>
        c.locked_fields.map((k) => `${c.part_id}:${k === "pose" ? "placement" : "size"}`),
      ),
    ],
    checks: r.checks.map(projectCheck),
    artifacts: r.artifacts.map(projectArtifact),
    note: r.request,
    createdAt: time(r.created_at),
    eligible: r.eligible_for_acceptance ?? false,
    specHash: r.spec_hash,
    assembly: r.manifest,
    parts: r.spec.components.map(projectPart),
    enclosureSize: e ? [e.width_mm, e.depth_mm, e.height_mm] : undefined,
  };
}
export const jobKind: Record<JobRecord["kind"], Job["kind"]> = {
  cad_build: "cad_build",
  photo_analysis: "photo_analysis",
  lookup: "evidence",
  concept_generation: "concepts",
  agent: "agent",
  visual_asset: "reference",
};
export function jobStage(s: string): Job["stage"] {
  return s === "ready"
    ? "succeeded"
    : ["failed", "unknown_submission", "cancelled"].includes(s)
      ? "failed"
      : s === "queued"
        ? "queued"
        : "running";
}
export function projectJob(j: JobRecord): Job {
  return {
    id: j.id,
    kind: jobKind[j.kind],
    stage: jobStage(j.stage),
    backendStage: j.stage,
    label: j.stage.replaceAll("_", " "),
    revisionId: j.revision_id ?? undefined,
    partId: j.part_id,
    error: j.error?.message,
    timing: j.timing
      ? {
          sampleCount: j.timing.sample_count,
          observedRangeSeconds: j.timing.observed_range_seconds,
        }
      : undefined,
    startedAt: time(j.created_at),
    finishedAt: ["ready", "failed", "cancelled", "unknown_submission"].includes(j.stage)
      ? time(j.updated_at)
      : undefined,
  };
}
export function projectConcept(c: ConceptRecord): Concept {
  return {
    id: c.id,
    title: c.title,
    purpose: c.purpose,
    formFactor: c.form_factor_rationale,
    partsUsed: c.used_part_ids,
    partsUnused: c.unused_part_ids,
    additionalNeeded: [...c.additional_hardware, ...c.software_firmware_dependencies],
    hardwareNeeded: c.additional_hardware,
    softwareNeeded: c.software_firmware_dependencies,
    layoutRationale: c.layout_rationale,
    supportedFamily: c.supported_family,
    whyForYou: c.why_this_fits_you,
    difficulty: "intermediate",
    difficultyReason: c.difficulty_reasons.join(" · "),
    skills: c.skills_tools,
    uncertainties: c.assumptions,
    nextMeasurements: c.required_measurements,
    buildPath: c.next_steps,
    stale: c.stale,
  };
}
