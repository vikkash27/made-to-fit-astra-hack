import { ApiError, type BackendAdapter, type Evidence } from "./adapter";
import type { Message, Project, Vec3 } from "@/lib/domain/types";
import type {
  ArtifactRecord,
  ComponentRecord,
  ConceptRecord,
  JobRecord,
  ProjectRecord,
  RevisionRecord,
  SpecRecord,
  VisualAssetRecord,
} from "./backend-types";
import {
  jobKind,
  jobStage,
  projectArtifact,
  projectConcept,
  projectJob,
  projectPart,
  projectRevision,
  time,
} from "./backend-projection";

export function createHttpAdapter(
  baseUrl: string,
  fetchImpl: typeof fetch = (...a) => fetch(...a),
): BackendAdapter {
  const base = baseUrl.replace(/\/+$/, "");
  const resolve = (u: string) =>
    /^https?:/.test(u) ? u : `${base}${u.startsWith("/") ? u : `/artifacts/${u}`}`;
  async function req<T>(method: string, path: string, body?: unknown, binary = false): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const form = typeof FormData !== "undefined" && body instanceof FormData;
      const response = await fetchImpl(`${base}${path}`, {
        method,
        signal: controller.signal,
        headers: body && !form ? { "Content-Type": "application/json" } : undefined,
        body: body == null ? undefined : form ? (body as FormData) : JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: { code?: string; message?: string; details?: unknown; retryable?: boolean };
        };
        const e = payload.error;
        throw new ApiError(
          e?.code ?? `http_${response.status}`,
          e?.message ?? `Request failed (${response.status}).`,
          response.status,
          e?.retryable ?? (response.status === 429 || response.status >= 500),
          e?.details,
        );
      }
      return response.status === 204
        ? (undefined as T)
        : binary
          ? ((await response.arrayBuffer()) as T)
          : ((await response.json()) as T);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(
        controller.signal.aborted ? "request_timeout" : "network_error",
        controller.signal.aborted
          ? "Backend request timed out. Refresh to check whether the operation was received."
          : `Can't reach the backend at ${base}.`,
        0,
        true,
      );
    } finally {
      clearTimeout(timer);
    }
  }
  const newOp = () => crypto.randomUUID();
  // Retain the same operation ID after an uncertain network response. A retry cannot duplicate a paid submission.
  const pending = new Map<string, string>();
  async function operation<T>(
    path: string,
    body: Record<string, unknown>,
    explicitId?: string,
  ): Promise<T> {
    const signature = path + JSON.stringify(body);
    const id = pending.get(signature) ?? explicitId ?? newOp();
    pending.set(signature, id);
    try {
      const value = await req<T>("POST", path, { ...body, client_operation_id: id });
      pending.delete(signature);
      return value;
    } catch (e) {
      if (e instanceof ApiError && e.status > 0 && !e.retryable) pending.delete(signature);
      throw e;
    }
  }
  const rawProject = (id: string) => req<ProjectRecord>("GET", `/projects/${id}`);
  const rawRevision = (id: string) => req<RevisionRecord>("GET", `/revisions/${id}`);
  const concepts = async (id: string) =>
    (await req<{ concepts: ConceptRecord[] }>("GET", `/projects/${id}/concepts`)).concepts;
  async function getProject(id: string): Promise<Project> {
    const p = await rawProject(id);
    const [records, cs, thread, proposals] = await Promise.all([
      Promise.all(p.revisions.map((r) => rawRevision(r.id))),
      concepts(id),
      req<{
        messages: { id: string; role: string; text: string; created_at: string; job_id?: string }[];
      }>("GET", `/projects/${id}/messages`),
      req<{ proposals: { component: ComponentRecord; stale: boolean; question?: string }[] }>(
        "GET",
        `/projects/${id}/component-proposals`,
      ),
    ]);
    const revisions = records.map(projectRevision);
    const components = [...p.components];
    for (const proposal of proposals.proposals)
      if (!components.some((c) => c.part_id === proposal.component.part_id))
        components.push(proposal.component);
    const assetIds = [
      ...new Set(p.components.map((c) => c.visual_asset_id).filter((s): s is string => !!s)),
    ];
    const assets = await Promise.all(
      assetIds.map((assetId) => req<VisualAssetRecord>("GET", `/assets/${assetId}`)),
    );
    const messages: Message[] = thread.messages.map((m) => ({
      id: m.id,
      role: m.role === "assistant" ? "astra" : m.role === "user" ? "user" : "system",
      text: m.text,
      createdAt: time(m.created_at),
      cards:
        m.role === "assistant"
          ? (
              (p.jobs.find((j) => j.id === m.job_id)?.result as { candidate_ids?: string[] } | null)
                ?.candidate_ids ?? []
            ).map((candidateId) => ({
              type: "change" as const,
              summary: "Astra candidate",
              diff: [],
              preservedLocks: revisions.find((r) => r.id === candidateId)?.locks ?? [],
              candidateId,
            }))
          : undefined,
    }));
    const stage =
      p.active_accepted_revision_id || revisions.length
        ? "engineer"
        : p.selected_concept_id || (p.intent_mode === "idea" && components.length)
          ? "confirm"
          : cs.length
            ? "discover"
            : "parts";
    return {
      id: p.id,
      name: p.name,
      goal: p.goal,
      intentMode: p.intent_mode,
      experience:
        p.preferences.experience === "first_project"
          ? "first"
          : p.preferences.experience === "some_projects"
            ? "some"
            : p.preferences.experience,
      tools: p.preferences.tools,
      constraints: p.preferences.interests ?? [],
      useSetting: p.preferences.use_setting as string | null,
      allowAdditionalParts: p.preferences.allow_additional_parts as boolean,
      timeBudget: p.preferences.time_budget as string | null,
      stage,
      parts: components.map(projectPart),
      photos: p.photos.map((ph) => ({ id: ph.id, url: resolve(ph.artifact.url) })),
      concepts: cs.map(projectConcept),
      selectedConceptId: p.selected_concept_id,
      revisions,
      acceptedRevisionId: p.active_accepted_revision_id,
      candidateRevisionId: [...revisions].reverse().find((r) => r.kind !== "accepted")?.id ?? null,
      jobs: p.jobs.map(projectJob),
      messages,
      draftVersion: p.draft_version,
      inventoryHash: p.inventory_hash,
      visualAssets: assets,
      createdAt: time(p.created_at),
    };
  }
  function blankComponent(id: string, name: string): ComponentRecord {
    return {
      part_id: id,
      component_version: 1,
      name,
      role: "hardware_reference",
      identity: null,
      identity_confirmed: false,
      size_mm: [null, null, null],
      pose: { translation_mm: [0, 0, 0], rotation_quaternion_xyzw: [0, 0, 0, 1] },
      dimensions_confirmed: false,
      dimensions_source: "unknown",
      evidence_ids: [],
      capabilities: [],
      keepout_mm: [0, 0, 0],
      mounting_points_mm: [],
      interfaces: [],
      visual_asset_id: null,
      crop: null,
      engineering_geometry: "dimensioned_box",
      printable_output: false,
      locked_fields: [],
    };
  }
  const adapter: BackendAdapter = {
    mode: "http",
    resolveArtifactUrl: resolve,
    reviewReference: (assetId, alignment) =>
      req("POST", `/assets/${assetId}/calibration`, {
        uniform_scale: alignment.scale,
        translation_m: alignment.position,
        rotation_quaternion_xyzw: alignment.rotation ?? [0, 0, 0, 1],
        aligned_size_mm: alignment.size,
        confirmed_illustrative_reference: true,
      }),
    getArtifactData: (artifactId) =>
      req<ArrayBuffer>("GET", `/artifacts/${artifactId}`, undefined, true),
    health: async () => {
      const h = await req<{
        status: string;
        cad: { ready: boolean };
        providers: { openai: string; hyper3d: string };
      }>("GET", "/health");
      return {
        ok: h.status === "ok",
        cad: h.cad.ready,
        astraConfigured: h.providers.openai === "configured",
        rodinConfigured: h.providers.hyper3d === "configured",
        mode: "http",
      };
    },
    listProjects: async () =>
      (await req<ProjectRecord[]>("GET", "/projects")).map((p) => ({
        id: p.id,
        name: p.name,
        goal: p.goal,
        stage:
          p.active_accepted_revision_id || p.revisions.length
            ? "engineer"
            : p.selected_concept_id
              ? "confirm"
              : "parts",
        createdAt: time(p.created_at),
      })),
    createProject: async (input) => {
      const p = await req<ProjectRecord>("POST", "/projects", {
        name: input.name,
        intent_mode: input.intentMode,
        goal: input.goal,
        initial_text: input.initialText,
      });
      return getProject(p.id);
    },
    getProject,
    updatePreferences: async (id, prefs) => {
      const p = await rawProject(id);
      await req("PATCH", `/projects/${id}`, {
        expected_draft_version: p.draft_version,
        ...(prefs.goal !== undefined ? { goal: prefs.goal } : {}),
        ...(prefs.intentMode ? { intent_mode: prefs.intentMode } : {}),
        preferences: {
          ...p.preferences,
          ...(prefs.experience !== undefined
            ? {
                experience:
                  prefs.experience === "first"
                    ? "first_project"
                    : prefs.experience === "some"
                      ? "some_projects"
                      : prefs.experience,
              }
            : {}),
          ...(prefs.tools !== undefined ? { tools: prefs.tools } : {}),
          ...(prefs.constraints ? { interests: prefs.constraints } : {}),
          ...(prefs.useSetting !== undefined ? { use_setting: prefs.useSetting } : {}),
          ...(prefs.allowAdditionalParts !== undefined
            ? { allow_additional_parts: prefs.allowAdditionalParts }
            : {}),
          ...(prefs.timeBudget !== undefined ? { time_budget: prefs.timeBudget } : {}),
        },
      });
      return getProject(id);
    },
    uploadPhoto: async (id, file) => {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 12 * 1024 * 1024
      )
        throw new ApiError("invalid_photo", "Use JPEG, PNG or WebP up to 12 MiB.", 422, false);
      const fd = new FormData();
      fd.append("file", file);
      const p = await req<{ id: string; artifact: ArtifactRecord }>(
        "POST",
        `/projects/${id}/photos`,
        fd,
      );
      return { id: p.id, url: resolve(p.artifact.url) };
    },
    analyzePhotos: async (id, photoIds) => {
      const p = await rawProject(id);
      return operation(`/projects/${id}/photos/analyze`, {
        photo_ids: photoIds,
        expected_draft_version: p.draft_version,
      });
    },
    lookupEvidence: async (id, partId, hint) =>
      operation(`/projects/${id}/components/${partId}/lookup`, {
        identifiers: hint || partId,
        source_url: hint?.startsWith("https://") ? hint : null,
      }),
    getEvidence: async (id, partId) => {
      const p = await rawProject(id);
      if (!p.components.some((c) => c.part_id === partId))
        return { partId, candidates: [], proposals: [], sources: [], missing: ["x", "y", "z"] };
      const e = await req<{
        component: ComponentRecord;
        evidence: {
          id: string;
          field: string;
          proposed_value_mm: number | null;
          source_id: string;
          identity_candidate: string;
          applicability: string;
          acceptance: string;
        }[];
        sources: { id: string; title: string; url: string; publisher?: string }[];
        missing_fields: string[];
      }>("GET", `/projects/${id}/components/${partId}/evidence`);
      const axis: Record<string, "x" | "y" | "z"> = {
        length: "x",
        width: "y",
        assembled_height: "z",
      };
      return {
        partId,
        candidates: e.component.identity ? [{ identity: e.component.identity, confidence: 0 }] : [],
        proposals: e.evidence
          .filter((v) => v.proposed_value_mm != null && axis[v.field])
          .map((v) => ({
            field: axis[v.field]!,
            value: v.proposed_value_mm!,
            sourceId: v.source_id,
            evidenceId: v.id,
            applicability: v.applicability,
            acceptance: v.acceptance,
          })),
        sources: e.sources,
        missing: e.missing_fields.map((v) => axis[v]).filter((v): v is "x" | "y" | "z" => !!v),
      } satisfies Evidence;
    },
    confirmComponents: async (id, version, patches) => {
      const p = await rawProject(id);
      const { proposals } = await req<{
        proposals: { component: ComponentRecord; stale: boolean }[];
      }>("GET", `/projects/${id}/component-proposals`);
      const components: ComponentRecord[] = [];
      for (const patch of patches.filter((x) => !x.remove)) {
        const existing =
          p.components.find((c) => c.part_id === patch.id) ??
          proposals.find((v) => v.component.part_id === patch.id)?.component;
        const c = structuredClone(
          existing ??
            blankComponent(
              patch.id ?? `part_${newOp().replaceAll("-", "")}`,
              patch.label || "Part",
            ),
        );
        if (patch.label !== undefined) c.name = patch.label;
        if (patch.crop)
          c.crop = {
            photo_id: patch.crop.photoId,
            box_xyxy: patch.crop.box,
            coordinates: "normalized",
          };
        if (patch.identityAccepted !== undefined) {
          c.identity = patch.identityAccepted;
          c.identity_confirmed = !!patch.identityAccepted;
        }
        if (patch.accept) {
          c.identity = c.identity ?? c.name;
          c.identity_confirmed = true;
        }
        if (patch.size) {
          for (const [i, axis] of (["x", "y", "z"] as const).entries())
            if (patch.size[axis]) c.size_mm[i] = patch.size[axis]!.value;
          c.dimensions_confirmed =
            c.size_mm.every((n) => n != null) &&
            (["x", "y", "z"] as const).every(
              (axis, i) => patch.size?.[axis]?.accept ?? existing?.dimensions_confirmed ?? false,
            );
          c.dimensions_source = "user_measurement";
        }
        components.push(c);
      }
      await req("POST", `/projects/${id}/components/confirm`, {
        expected_draft_version: version,
        components,
        remove_part_ids: patches.filter((v) => v.remove && v.id).map((v) => v.id),
        evidence_decisions: patches.flatMap((p) =>
          (p.evidenceDecisions ?? []).map((d) => ({
            evidence_id: d.evidenceId,
            acceptance: d.acceptance,
          })),
        ),
      });
      return getProject(id);
    },
    generateConcepts: async (id, version, refinement) => {
      const p = await rawProject(id);
      return operation(`/projects/${id}/concepts/generate`, {
        expected_draft_version: version,
        inventory_hash: p.inventory_hash,
        preference_prompt: refinement ?? "",
      });
    },
    listConcepts: async (id) => (await concepts(id)).map(projectConcept),
    selectConcept: async (id, conceptId, version) => {
      const p = await rawProject(id);
      await req("POST", `/projects/${id}/concepts/${conceptId}/select`, {
        expected_draft_version: version,
        inventory_hash: p.inventory_hash,
      });
      return getProject(id);
    },
    agent: async (id, input) => {
      const p = await rawProject(id);
      const selected = input.context.find((c) => c.startsWith("selection:"))?.slice(10);
      return operation(`/projects/${id}/agent`, {
        message: input.text,
        parent_revision_id: input.parentRevisionId,
        expected_draft_version: p.draft_version,
        selected_part_id: p.components.some((c) => c.part_id === selected) ? selected : null,
      });
    },
    createCandidate: async (id, parentId, params, locks) => {
      const p = await rawProject(id);
      const parent = parentId ? await rawRevision(parentId) : null;
      if (parentId !== p.active_accepted_revision_id)
        throw new ApiError(
          "stale_parent",
          "Create changes from the current accepted revision.",
          409,
          false,
        );
      const spec: SpecRecord = parent
        ? structuredClone(parent.spec)
        : {
            schema_version: 1,
            units: "mm",
            components: [],
            enclosure: null,
            recipe: null,
            printer_volume_mm: null,
            requested_analyses: [],
          };
      spec.printer_model = "bambu_p2s";
      spec.printer_volume_mm = [256, 256, 256];
      const selected = p.selected_concept_id
        ? (await concepts(id)).find((c) => c.id === p.selected_concept_id)
        : null;
      if (selected?.supported_family === "requires_extension")
        throw new ApiError(
          "unsupported_concept",
          "This project needs CAD features that are not available yet. Choose another concept.",
          422,
          false,
        );
      spec.components = structuredClone(p.components)
        .filter((c) => !selected || selected.used_part_ids.includes(c.part_id))
        .map((c) => {
          const prior = parent?.spec.components.find((v) => v.part_id === c.part_id);
          return prior
            ? {
                ...c,
                pose: prior.pose,
                locked_fields: [...new Set([...c.locked_fields, ...prior.locked_fields])],
              }
            : c;
        });
      if (!spec.components.length || spec.components.some((c) => !c.dimensions_confirmed))
        throw new ApiError(
          "measurements_required",
          "Confirm all component dimensions before building CAD.",
          422,
          false,
        );
      if (!parent) {
        // Pack reviewed envelopes into an explicit candidate layout. No dimensions are inferred.
        const pad = params.wall + params.clearance;
        const width = Math.max(...spec.components.map((c) => c.size_mm[0]!)) + 2 * pad;
        const depth =
          spec.components.reduce((n, c) => n + c.size_mm[1]!, 0) +
          (spec.components.length - 1) * params.clearance +
          2 * pad;
        const height =
          Math.max(...spec.components.map((c) => c.size_mm[2]!)) +
          params.wall +
          params.clearance +
          params.lidThickness +
          (params.lidRegister ?? 2);
        let y = -depth / 2 + pad;
        for (const c of spec.components) {
          if (!c.locked_fields.includes("pose"))
            c.pose.translation_mm = [-c.size_mm[0]! / 2, y, params.wall];
          y += c.size_mm[1]! + params.clearance;
        }
        spec.enclosure = {
          width_mm: width,
          depth_mm: depth,
          height_mm: height,
          wall_mm: params.wall,
          base_mm: params.wall,
          lid_mm: params.lidThickness,
          lid_register_mm: params.lidRegister ?? 2,
          lid_fit_clearance_mm: params.lidFitClearance ?? 0.25,
          required_clearance_mm: params.clearance,
          minimum_wall_mm: 1,
          locked_fields: [],
        };
      }
      if (spec.enclosure) {
        spec.enclosure.wall_mm = params.wall;
        if (params.width !== undefined) spec.enclosure.width_mm = params.width;
        if (params.depth !== undefined) spec.enclosure.depth_mm = params.depth;
        if (params.height !== undefined) spec.enclosure.height_mm = params.height;
        if (params.baseThickness !== undefined) spec.enclosure.base_mm = params.baseThickness;
        spec.enclosure.lid_mm = params.lidThickness;
        if (params.lidRegister !== undefined) spec.enclosure.lid_register_mm = params.lidRegister;
        if (params.lidFitClearance !== undefined)
          spec.enclosure.lid_fit_clearance_mm = params.lidFitClearance;
        spec.enclosure.required_clearance_mm = params.clearance;
      }
      for (const c of spec.components)
        if (locks.includes(`${c.part_id}:placement`) && !c.locked_fields.includes("pose"))
          c.locked_fields.push("pose");
      const r = await operation<RevisionRecord>(`/projects/${id}/candidates`, {
        expected_draft_version: p.draft_version,
        parent_revision_id: parentId,
        spec,
        request: "Reviewed frontend enclosure candidate",
      });
      return projectRevision(r, p.revisions.length);
    },
    buildRevision: (id) => operation(`/revisions/${id}/build`, {}),
    runChecks: async (id) => {
      await req("POST", `/revisions/${id}/checks`);
    },
    acceptRevision: async (id, parent, operationId) =>
      projectRevision(
        await operation<RevisionRecord>(
          `/revisions/${id}/accept`,
          { expected_active_parent: parent },
          operationId,
        ),
      ),
    generateReference: async (id, partIds, operationId, detail = "standard") => {
      if (partIds.length !== 1)
        throw new ApiError(
          "single_reference_required",
          "Choose one photographed component for this paid reference job.",
          422,
          false,
        );
      const p = await rawProject(id),
        c = p.components.find((c) => c.part_id === partIds[0]);
      if (!c?.crop)
        throw new ApiError(
          "photo_required",
          "Confirm a crop for this component before generating its reference.",
          422,
          false,
        );
      return operation(
        `/projects/${id}/assets/generate`,
        {
          part_id: c.part_id,
          photo_ids: [c.crop.photo_id],
          tier: detail === "detailed" ? "Gen-2.5-Medium" : "Gen-2.5-Low",
          quality_override: detail === "detailed" ? 20000 : 10000,
        },
        operationId,
      );
    },
    getJob: async (id) => {
      const j = await req<JobRecord>("GET", `/jobs/${id}`);
      return {
        job_id: j.id,
        kind: jobKind[j.kind],
        stage: jobStage(j.stage),
        project_id: j.project_id,
        revision_id: j.revision_id,
        error: j.error,
      };
    },
    getExports: async (id) => {
      const r = await req<{
        state: string;
        is_current_accepted: boolean;
        artifacts: ArtifactRecord[];
      }>("GET", `/revisions/${id}/exports`);
      return r.state === "accepted" && r.is_current_accepted
        ? r.artifacts
            .filter((a) =>
              [
                "printable_cad",
                "print_plate",
                "cad_assembly",
                "design_record",
                "recipe",
                "checks",
                "sources",
                "build_guide",
                "visual_reference_original",
                "visual_reference_preview",
              ].includes(a.role),
            )
            .map(projectArtifact)
        : [];
    },
    getBuildGuide: (id) => req("GET", `/revisions/${id}/build-guide`),
  };
  return adapter;
}
