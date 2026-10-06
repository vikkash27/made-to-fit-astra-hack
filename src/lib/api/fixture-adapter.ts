/**
 * UI PREVIEW ONLY. A labelled sample backend so the interface is explorable
 * without the Python service. Everything it produces carries `sample: true`
 * and the UI shows a persistent "backend disconnected" label. It never calls
 * Astra, Rodin or CAD, and it never produces downloadable artifacts.
 */
import type { BackendAdapter, Evidence, JobStatus, PartPatch } from "./adapter";
import { ApiError } from "./adapter";
import type {
  Check,
  Concept,
  EnclosureParams,
  Job,
  Message,
  Part,
  Project,
  Revision,
  SourceDoc,
} from "@/lib/domain/types";
import samplePhoto from "@/assets/sample-parts-photo.jpg";
import conceptDesk from "@/assets/concept-desk.jpg";
import conceptWall from "@/assets/concept-wall.jpg";
import conceptPortable from "@/assets/concept-portable.jpg";

const KEY = "mtf.fixture.v1";
const JOB_MS = 1400;

interface Db {
  projects: Record<string, Project>;
  jobs: Record<string, JobStatus & { startedAt: number; apply?: string; payload?: unknown }>;
}

let mem: Db | null = null;
function db(): Db {
  if (mem) return mem;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    mem = raw ? (JSON.parse(raw) as Db) : { projects: {}, jobs: {} };
  } catch {
    mem = { projects: {}, jobs: {} };
  }
  return mem;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db()));
  } catch {
    /* quota — preview only */
  }
}
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => Date.now();
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function get(id: string): Project {
  const p = db().projects[id];
  if (!p)
    throw new ApiError(
      "not_found",
      "Project not found in this browser's preview data.",
      404,
      false,
    );
  return p;
}

export const SAMPLE_SOURCES: SourceDoc[] = [
  {
    id: "src-pico",
    title: "Sample datasheet — RP2040 dev board",
    url: "https://example.com/sample-datasheet",
    publisher: "Sample",
  },
  {
    id: "src-oled",
    title: "Sample listing — 0.96in OLED module",
    url: "https://example.com/sample-listing",
    publisher: "Sample",
  },
  {
    id: "src-bme",
    title: "Sample listing — BME280 breakout",
    url: "https://example.com/sample-listing",
    publisher: "Sample",
  },
];

const DEFAULT_PARAMS: EnclosureParams = {
  wall: 2,
  clearance: 1.5,
  lidThickness: 2,
  cornerRadius: 4,
};

function unknown() {
  return { value: null, status: "unknown" as const };
}

function sampleParts(photoId: string): Part[] {
  return [
    {
      id: "part-controller",
      label: "Controller",
      category: "controller",
      identityProposed: "RP2040 dev board (Pico-class)",
      identityAccepted: null,
      status: "proposed",
      photoId,
      anchor: { x: 0.145, y: 0.14, w: 0.145, h: 0.43 },
      size: unknown3(),
      pose: [0, 0, 4],
      visible: true,
      sample: true,
    },
    {
      id: "part-display",
      label: "Display",
      category: "display",
      identityProposed: "0.96in OLED 128×64, I²C",
      identityAccepted: null,
      status: "proposed",
      photoId,
      anchor: { x: 0.36, y: 0.17, w: 0.2, h: 0.31 },
      size: unknown3(),
      pose: [27, 0, 4],
      visible: true,
      sample: true,
    },
    {
      id: "part-sensor",
      label: "Temperature sensor",
      category: "sensor",
      identityProposed: "BME280 breakout",
      identityAccepted: null,
      status: "proposed",
      photoId,
      anchor: { x: 0.28, y: 0.6, w: 0.11, h: 0.18 },
      size: unknown3(),
      pose: [27, 31, 4],
      visible: true,
      sample: true,
    },
    {
      id: "part-battery",
      label: "Battery",
      category: "battery",
      identityProposed: "LiPo pouch, 503450-class (unverified)",
      identityAccepted: null,
      status: "proposed",
      photoId,
      anchor: { x: 0.63, y: 0.27, w: 0.17, h: 0.45 },
      size: unknown3(),
      pose: [0, 54, 4],
      visible: true,
      sample: true,
      needsAttention: "Identity needs confirmation",
    },
  ];
}
function unknown3() {
  return { x: unknown(), y: unknown(), z: unknown() };
}

const SAMPLE_EVIDENCE: Record<string, Omit<Evidence, "partId">> = {
  "part-controller": {
    candidates: [{ identity: "RP2040 dev board (Pico-class)", confidence: 0.7 }],
    proposals: [
      { field: "x", value: 21, sourceId: "src-pico" },
      { field: "y", value: 51, sourceId: "src-pico" },
      { field: "z", value: 3.9, sourceId: "src-pico" },
    ],
    sources: [SAMPLE_SOURCES[0]!],
    missing: [],
    sample: true,
  },
  "part-display": {
    candidates: [{ identity: "0.96in OLED 128×64, I²C", confidence: 0.6 }],
    proposals: [
      { field: "x", value: 27.3, sourceId: "src-oled" },
      { field: "y", value: 27.8, sourceId: "src-oled" },
    ],
    sources: [SAMPLE_SOURCES[1]!],
    missing: ["z"],
    sample: true,
  },
  "part-sensor": {
    candidates: [{ identity: "BME280 breakout", confidence: 0.65 }],
    proposals: [
      { field: "x", value: 15, sourceId: "src-bme" },
      { field: "y", value: 12, sourceId: "src-bme" },
    ],
    sources: [SAMPLE_SOURCES[2]!],
    missing: ["z"],
    sample: true,
  },
  "part-battery": {
    candidates: [{ identity: "LiPo pouch, 503450-class", confidence: 0.4 }],
    proposals: [],
    sources: [],
    missing: ["x", "y", "z"],
    sample: true,
  },
};

function sampleConcepts(p: Project, refinement?: string): Concept[] {
  const used = p.parts.map((x) => x.label);
  const base = {
    partsUsed: used,
    partsUnused: [] as string[],
    sample: true,
    skills: ["Soldering headers", "Flashing firmware", "Basic wiring"],
  };
  const forYou =
    p.experience === "experienced"
      ? "Skips beginner steps; leaves room for your own firmware."
      : "A contained first build: one board, one bus, a single enclosure.";
  const list: Concept[] = [
    {
      ...base,
      id: "concept-desk",
      title: "Desk temperature station",
      formFactor: "Angled desk station",
      purpose: "Shows room temperature, humidity and pressure at a glance on your desk.",
      additionalNeeded: [
        "Jumper wires",
        "USB-C cable",
        "LiPo charger if battery is used",
        "Firmware (MicroPython or Arduino)",
      ],
      whyForYou: forYou,
      difficulty: "beginner",
      uncertainties: [
        "Battery identity unconfirmed",
        "Display module height unknown",
        "Sensor self-heating near controller",
      ],
      nextMeasurements: [
        "Display module thickness incl. header",
        "Battery length × width × thickness",
        "Sensor board thickness",
      ],
      buildPath: ["Verify parts", "Breadboard prototype", "CAD enclosure", "Assemble"],
      previewImage: conceptDesk,
    },
    {
      ...base,
      id: "concept-wall",
      title: "Wall climate monitor",
      formFactor: "Low-profile wall mount",
      purpose: "A flat monitor for any room, mounted with screws or adhesive.",
      additionalNeeded: ["Wall fixings", "Jumper wires", "Firmware"],
      whyForYou: forYou,
      difficulty: "beginner",
      uncertainties: ["Wall mounting method", "Airflow to sensor in a flat case"],
      nextMeasurements: ["Display module thickness", "Battery thickness"],
      buildPath: ["Verify parts", "Prototype", "CAD", "Mount"],
      previewImage: conceptWall,
    },
    {
      ...base,
      id: "concept-portable",
      title: "Portable climate tag",
      formFactor: "Handheld with strap",
      purpose: "Carry it between rooms or outdoors; battery powered.",
      additionalNeeded: [
        "LiPo charger module",
        "Power switch",
        "Strap",
        "Firmware with sleep mode",
      ],
      whyForYou: forYou,
      difficulty: "intermediate",
      uncertainties: ["Battery identity and protection circuit", "Runtime unknown"],
      nextMeasurements: ["Battery dimensions", "Switch footprint"],
      buildPath: ["Verify battery", "Prototype", "CAD", "Assemble"],
      previewImage: conceptPortable,
    },
  ];
  if (refinement && /portable|carry/i.test(refinement)) return [list[2]!, list[0]!, list[1]!];
  if (refinement && /wall/i.test(refinement)) return [list[1]!, list[0]!, list[2]!];
  return list;
}

function msg(role: Message["role"], text: string, extra: Partial<Message> = {}): Message {
  return { id: uid("m"), role, text, createdAt: now(), sample: role !== "user", ...extra };
}

function computeSampleChecks(params: EnclosureParams): Check[] {
  return [
    {
      id: "chk-clear",
      name: "Envelope clearance ≥ 1.0 mm",
      scope: "fit",
      status: params.clearance >= 1 ? "pass" : "fail",
      detail: `Preview clearance ${params.clearance} mm (computed on preview envelopes, not CAD solids).`,
      sample: true,
    },
    {
      id: "chk-wall",
      name: "Wall thickness ≥ 1.2 mm (FDM)",
      scope: "printability",
      status: params.wall >= 1.2 ? "pass" : "fail",
      detail: `Preview wall ${params.wall} mm.`,
      sample: true,
    },
    {
      id: "chk-lid",
      name: "Lid seating / fastener fit",
      scope: "mechanical",
      status: "unverified",
      detail: "Requires CAD solids from the backend.",
      sample: true,
    },
  ];
}

function newJob(
  p: Project,
  kind: Job["kind"],
  apply: string,
  payload?: unknown,
  revisionId?: string,
) {
  const id = uid("job");
  db().jobs[id] = {
    job_id: id,
    kind,
    stage: "queued",
    project_id: p.id,
    revision_id: revisionId ?? null,
    startedAt: now(),
    apply,
    payload,
    error: null,
  };
  p.jobs = [
    { id, kind, stage: "queued" as const, label: jobLabel(kind), startedAt: now(), revisionId },
    ...p.jobs,
  ].slice(0, 20);
  save();
  return { job_id: id };
}
function jobLabel(k: Job["kind"]) {
  return {
    photo_analysis: "Sample photo analysis",
    evidence: "Sample spec lookup",
    concepts: "Sample concepts",
    agent: "Sample Astra reply",
    cad_build: "Preview build (not CAD)",
    checks: "Preview checks",
    wiring: "Wiring plan",
    dimensions: "Photo dimension estimates",
    reference: "Reference model",
  }[k];
}

function findRev(id: string): { p: Project; r: Revision } {
  for (const p of Object.values(db().projects)) {
    const r = p.revisions.find((x) => x.id === id);
    if (r) return { p, r };
  }
  throw new ApiError("not_found", "Unknown revision.", 404, false);
}

function applyJob(j: Db["jobs"][string]) {
  const p = db().projects[j.project_id];
  if (!p) return;
  switch (j.apply) {
    case "analyze": {
      const photoId = (j.payload as { photoId: string }).photoId;
      if (!p.parts.some((x) => x.sample)) p.parts.push(...sampleParts(photoId));
      p.messages.push(
        msg(
          "astra",
          "Sample identification — the backend is disconnected, so these four parts are illustrative and were not recognized from your photo. Correct or replace them, or connect the backend for real analysis.",
        ),
      );
      break;
    }
    case "evidence": {
      const partId = (j.payload as { partId: string }).partId;
      const part = p.parts.find((x) => x.id === partId);
      const ev = SAMPLE_EVIDENCE[partId];
      if (part && ev) {
        for (const pr of ev.proposals) {
          if (part.size[pr.field].status !== "accepted")
            part.size[pr.field] = { value: pr.value, status: "proposed", sourceId: pr.sourceId };
        }
      }
      break;
    }
    case "concepts":
      p.concepts = sampleConcepts(p, (j.payload as { refinement?: string })?.refinement);
      if (p.stage === "parts") p.stage = "discover";
      break;
    case "agent": {
      const { text, parentRevisionId } = j.payload as {
        text: string;
        parentRevisionId: string | null;
      };
      const parent =
        p.revisions.find((r) => r.id === parentRevisionId) ?? p.revisions[p.revisions.length - 1];
      const t = text.toLowerCase();
      const diff: { field: keyof EnclosureParams; from: number; to: number }[] = [];
      if (parent) {
        if (/tall|height|room|clearance/.test(t))
          diff.push({
            field: "clearance",
            from: parent.params.clearance,
            to: +(parent.params.clearance + 2).toFixed(1),
          });
        if (/thick|wall|strong|sturd/.test(t))
          diff.push({
            field: "wall",
            from: parent.params.wall,
            to: +(parent.params.wall + 0.6).toFixed(1),
          });
        if (/round|soft|corner/.test(t))
          diff.push({
            field: "cornerRadius",
            from: parent.params.cornerRadius,
            to: parent.params.cornerRadius + 2,
          });
        if (/thin|slim|small/.test(t))
          diff.push({
            field: "wall",
            from: parent.params.wall,
            to: Math.max(1, +(parent.params.wall - 0.4).toFixed(1)),
          });
      }
      if (diff.length && parent) {
        const params = { ...parent.params };
        for (const d of diff) params[d.field] = d.to;
        const cand: Revision = {
          id: uid("rev"),
          label: `Candidate ${p.revisions.length}`,
          kind: "candidate",
          parentId: parent.id,
          params,
          locks: parent.locks,
          checks: [],
          artifacts: [],
          createdAt: now(),
          sample: true,
          note: text,
        };
        p.revisions.push(cand);
        p.candidateRevisionId = cand.id;
        p.messages.push(
          msg(
            "astra",
            "Sample reply (not live Astra). Here is a proposed parameter change. It is not applied until it is built, checked and you accept it.",
            {
              cards: [
                {
                  type: "change",
                  summary: text,
                  diff,
                  preservedLocks: parent.locks,
                  candidateId: cand.id,
                },
              ],
            },
          ),
        );
      } else {
        const missing = p.parts.find((x) => x.size.z.value == null);
        p.messages.push(
          msg(
            "astra",
            parent
              ? "Sample reply (not live Astra). In preview mode I can only demonstrate wall, clearance and corner changes — try “make it taller” or “thicker walls”."
              : "Sample reply (not live Astra). Confirm part dimensions first so a draft layout can be created.",
            missing
              ? {
                  cards: [
                    {
                      type: "measurement",
                      partId: missing.id,
                      field: "z",
                      prompt: `What is the ${missing.label.toLowerCase()} thickness in mm?`,
                    },
                  ],
                }
              : {},
          ),
        );
      }
      break;
    }
    case "build": {
      const { r } = findRev(j.revision_id!);
      r.note = (r.note ? r.note + " · " : "") + "Preview geometry only";
      break;
    }
    case "checks": {
      const { r } = findRev(j.revision_id!);
      r.checks = computeSampleChecks(r.params);
      if (r.checks.some((c) => c.status === "fail")) r.kind = "failed";
      break;
    }
  }
  p.draftVersion++;
}

export function createFixtureAdapter(): BackendAdapter {
  return {
    mode: "fixture",
    async health() {
      return {
        ok: false,
        cad: false,
        astraConfigured: false,
        rodinConfigured: false,
        mode: "fixture",
      };
    },
    async listProjects() {
      return Object.values(db().projects)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(({ id, name, goal, stage, createdAt }) => ({ id, name, goal, stage, createdAt }));
    },
    async createProject(input) {
      await wait();
      const p: Project = {
        id: uid("proj"),
        name: input.name,
        intentMode: input.intentMode,
        goal: input.goal,
        experience: null,
        tools: null,
        constraints: [],
        stage: "parts",
        photos: [],
        parts: [],
        concepts: [],
        selectedConceptId: null,
        revisions: [],
        acceptedRevisionId: null,
        candidateRevisionId: null,
        jobs: [],
        messages: [],
        draftVersion: 1,
        createdAt: now(),
      };
      if (input.initialText) p.messages.push(msg("user", input.initialText));
      db().projects[p.id] = p;
      save();
      return structuredClone(p);
    },
    async getProject(id) {
      // Advance any sample jobs by elapsed time.
      const p = get(id);
      for (const j of Object.values(db().jobs)) {
        if (j.project_id !== id || j.stage === "succeeded" || j.stage === "failed") continue;
        const el = now() - j.startedAt;
        const next = el > JOB_MS ? "succeeded" : el > 300 ? "running" : "queued";
        if (next !== j.stage) {
          j.stage = next;
          if (next === "succeeded") applyJob(j);
          const pj = p.jobs.find((x) => x.id === j.job_id);
          if (pj) pj.stage = next;
        }
      }
      save();
      return structuredClone(p);
    },
    async updatePreferences(id, prefs) {
      const p = get(id);
      Object.assign(
        p,
        Object.fromEntries(Object.entries(prefs).filter(([, v]) => v !== undefined)),
      );
      p.draftVersion++;
      p.concepts.forEach((c) => {
        c.stale = true;
      });
      save();
      return structuredClone(p);
    },
    async uploadPhoto(projectId, file) {
      const p = get(projectId);
      const url = await downscale(file);
      const ph = { id: uid("photo"), url };
      p.photos.push(ph);
      save();
      return ph;
    },
    async analyzePhotos(projectId, photoIds) {
      return newJob(get(projectId), "photo_analysis", "analyze", { photoId: photoIds[0] });
    },
    async lookupEvidence(projectId, partId) {
      return newJob(get(projectId), "evidence", "evidence", { partId });
    },
    async getEvidence(_projectId, partId) {
      const ev = SAMPLE_EVIDENCE[partId];
      return ev
        ? { partId, ...ev }
        : {
            partId,
            candidates: [],
            proposals: [],
            sources: [],
            missing: ["x", "y", "z"],
            sample: true,
          };
    },
    async confirmComponents(projectId, draftVersion, patches) {
      const p = get(projectId);
      if (draftVersion !== p.draftVersion)
        throw new ApiError(
          "stale_draft",
          "Project changed elsewhere — reloaded latest.",
          409,
          true,
        );
      for (const pt of patches) applyPartPatch(p, pt);
      p.draftVersion++;
      p.concepts.forEach((c) => {
        c.stale = true;
      });
      save();
      return structuredClone(p);
    },
    async generateConcepts(projectId, _v, refinement) {
      const p = get(projectId);
      if (p.parts.length === 0)
        throw new ApiError(
          "no_inventory",
          "Add at least one part before exploring concepts.",
          422,
          false,
        );
      return newJob(p, "concepts", "concepts", { refinement });
    },
    async listConcepts(projectId) {
      return structuredClone(get(projectId).concepts);
    },
    async selectConcept(projectId, conceptId) {
      const p = get(projectId);
      const c = p.concepts.find((x) => x.id === conceptId);
      if (!c) throw new ApiError("not_found", "Unknown concept.", 404, false);
      if (c.stale)
        throw new ApiError(
          "stale_draft",
          "Your parts or brief changed. Find projects again.",
          409,
          false,
        );
      p.selectedConceptId = conceptId;
      p.goal = c.title;
      p.stage = "confirm";
      p.draftVersion++;
      save();
      return structuredClone(p);
    },
    async agent(projectId, input) {
      const p = get(projectId);
      p.messages.push(msg("user", input.text, { refs: input.context }));
      return newJob(p, "agent", "agent", input);
    },
    async createCandidate(projectId, parentId, params, locks) {
      const p = get(projectId);
      const kind = p.revisions.length === 0 ? "draft" : "candidate";
      const r: Revision = {
        id: uid("rev"),
        label: kind === "draft" ? "Draft" : `Candidate ${p.revisions.length}`,
        kind,
        parentId,
        params,
        locks,
        checks: [],
        artifacts: [],
        createdAt: now(),
        sample: true,
      };
      p.revisions.push(r);
      if (kind === "candidate") p.candidateRevisionId = r.id;
      if (p.stage === "confirm") p.stage = "engineer";
      save();
      return structuredClone(r);
    },
    async buildRevision(revisionId) {
      const { p } = findRev(revisionId);
      return newJob(p, "cad_build", "build", undefined, revisionId);
    },
    async runChecks(revisionId) {
      const { p } = findRev(revisionId);
      return newJob(p, "checks", "checks", undefined, revisionId);
    },
    async acceptRevision(revisionId, expectedParentId) {
      const { p, r } = findRev(revisionId);
      if (p.acceptedRevisionId !== expectedParentId && r.parentId !== expectedParentId)
        throw new ApiError("stale_parent", "A newer revision was accepted.", 409, false);
      if (r.checks.length === 0 || r.checks.some((c) => c.status === "fail"))
        throw new ApiError("checks_required", "Required checks have not passed.", 422, false);
      r.kind = "accepted";
      p.acceptedRevisionId = r.id;
      if (p.candidateRevisionId === r.id) p.candidateRevisionId = null;
      for (const m of p.messages)
        for (const c of m.cards ?? [])
          if (c.type === "change" && c.candidateId === r.id) c.resolved = "applied";
      save();
      return structuredClone(r);
    },
    async estimateDimensions() {
      throw new ApiError(
        "backend_disconnected",
        "Photo estimates require the live backend.",
        503,
        false,
      );
    },
    async generateReference() {
      throw new ApiError(
        "backend_disconnected",
        "Reference models need the live backend (Rodin). Nothing was generated or charged.",
        503,
        false,
      );
    },
    async getJob(jobId) {
      const j = db().jobs[jobId];
      if (!j) throw new ApiError("not_found", "Unknown job.", 404, false);
      await this.getProject(j.project_id);
      const { job_id, kind, stage, project_id, revision_id, error } = db().jobs[jobId]!;
      return { job_id, kind, stage, project_id, revision_id, error };
    },
    async getExports() {
      return [];
    },
    async getWiringPlan() {
      throw new ApiError("sample_only", "Connect the backend for a real wiring plan.", 422, false);
    },
    async generateWiringPlan() {
      throw new ApiError("sample_only", "Connect the backend for pinout research.", 422, false);
    },
    async reviewWiringPlan() {
      throw new ApiError("sample_only", "Sample wiring cannot be reviewed.", 422, false);
    },
    async getGuideProgress() {
      throw new ApiError(
        "sample_only",
        "Connect the backend to save assembly progress.",
        422,
        false,
      );
    },
    async saveGuideProgress() {
      throw new ApiError(
        "sample_only",
        "Connect the backend to save assembly progress.",
        422,
        false,
      );
    },
    async getBuildGuide() {
      throw new ApiError(
        "sample_only",
        "Assembly guides require a real accepted CAD revision.",
        409,
        false,
      );
    },
    resolveArtifactUrl: (u) => u,
  };
}

function applyPartPatch(p: Project, pt: PartPatch) {
  if (pt.remove && pt.id) {
    p.parts = p.parts.filter((x) => x.id !== pt.id);
    return;
  }
  let part = pt.id ? p.parts.find((x) => x.id === pt.id) : undefined;
  if (!part) {
    const maxX = p.parts.reduce((m, x) => Math.max(m, x.pose[0] + (x.size.x.value ?? 20)), -4);
    part = {
      id: uid("part"),
      label: pt.label ?? "New part",
      category: pt.category ?? "other",
      identityProposed: null,
      identityAccepted: null,
      status: "proposed",
      size: unknown3(),
      pose: [maxX + 4, 0, 4],
      visible: true,
    };
    p.parts.push(part);
  }
  if (pt.label !== undefined) part.label = pt.label;
  if (pt.category) part.category = pt.category;
  if (pt.identityAccepted !== undefined) part.identityAccepted = pt.identityAccepted;
  if (pt.accept) {
    part.status = "accepted";
    part.needsAttention = undefined;
    if (!part.identityAccepted) part.identityAccepted = part.identityProposed ?? part.label;
  }
  if (pt.visible !== undefined) part.visible = pt.visible;
  if (pt.size) {
    for (const [k, v] of Object.entries(pt.size) as [
      "x" | "y" | "z",
      { value: number | null; accept: boolean },
    ][]) {
      part.size[k] =
        v.value == null
          ? unknown()
          : {
              value: v.value,
              status: v.accept ? "accepted" : "proposed",
              sourceId: part.size[k].sourceId,
            };
    }
  }
}

async function downscale(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type))
    throw new ApiError("invalid_mime", "Use a JPG, PNG or WEBP photo.", 400, false);
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const s = Math.min(1, 1024 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } catch {
    return dataUrl;
  }
}

export const SAMPLE_PHOTO_URL = samplePhoto;
