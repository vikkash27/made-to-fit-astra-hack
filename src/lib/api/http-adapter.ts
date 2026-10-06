import { ApiError, type BackendAdapter } from "./adapter";

/**
 * Real backend client. Routes follow PRD §15.1. Failures always surface as
 * ApiError — there is no silent fallback to sample data.
 */
export function createHttpAdapter(baseUrl: string, fetchImpl: typeof fetch = (...a) => fetch(...a)): BackendAdapter {
  const base = baseUrl.replace(/\/+$/, "");
  const url = (p: string) => `${base}${p}`;

  async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      const isForm = typeof FormData !== "undefined" && body instanceof FormData;
      res = await fetchImpl(url(path), {
        method,
        headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
        body: body == null ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      });
    } catch (e) {
      throw new ApiError("network_error", `Can't reach the backend at ${base}.`, 0, true, String(e));
    }
    if (!res.ok) {
      let payload: { code?: string; message?: string; retryable?: boolean; details?: unknown } = {};
      try {
        payload = await res.json();
      } catch {
        /* non-JSON error */
      }
      throw new ApiError(
        payload.code ?? `http_${res.status}`,
        payload.message ?? `Request failed (${res.status})`,
        res.status,
        payload.retryable ?? (res.status === 429 || res.status >= 500),
        payload.details,
      );
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  const op = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

  return {
    mode: "http",
    health: async () => ({ ...(await req<Record<string, boolean>>("GET", "/health")), mode: "http" }) as never,
    listProjects: () => req("GET", "/projects"),
    createProject: (input) =>
      req("POST", "/projects", { name: input.name, intent_mode: input.intentMode, goal: input.goal, initial_text: input.initialText }),
    getProject: (id) => req("GET", `/projects/${id}`),
    updatePreferences: (id, prefs) => req("PATCH", `/projects/${id}`, prefs),
    uploadPhoto: (projectId, file) => {
      const fd = new FormData();
      fd.append("file", file);
      return req("POST", `/projects/${projectId}/photos`, fd);
    },
    analyzePhotos: (projectId, photoIds) => req("POST", `/projects/${projectId}/photos/analyze`, { photo_ids: photoIds }),
    lookupEvidence: (projectId, partId, hint) => req("POST", `/projects/${projectId}/components/${partId}/lookup`, { hint }),
    getEvidence: (projectId, partId) => req("GET", `/projects/${projectId}/components/${partId}/evidence`),
    confirmComponents: (projectId, draftVersion, parts) =>
      req("POST", `/projects/${projectId}/components/confirm`, { draft_version: draftVersion, parts }),
    generateConcepts: (projectId, draftVersion, refinement) =>
      req("POST", `/projects/${projectId}/concepts/generate`, { draft_version: draftVersion, refinement, client_operation_id: op() }),
    listConcepts: (projectId) => req("GET", `/projects/${projectId}/concepts`),
    selectConcept: (projectId, conceptId, draftVersion) =>
      req("POST", `/projects/${projectId}/concepts/${conceptId}/select`, { draft_version: draftVersion }),
    agent: (projectId, input) =>
      req("POST", `/projects/${projectId}/agent`, {
        intent: input.text,
        parent_revision_id: input.parentRevisionId,
        context: input.context,
        client_operation_id: op(),
      }),
    createCandidate: (projectId, parentId, params, locks) =>
      req("POST", `/projects/${projectId}/candidates`, { parent_id: parentId, params, locks }),
    buildRevision: (id) => req("POST", `/revisions/${id}/build`),
    runChecks: (id) => req("POST", `/revisions/${id}/checks`),
    acceptRevision: (id, expectedParentId, operationId) =>
      req("POST", `/revisions/${id}/accept`, { expected_parent_id: expectedParentId, client_operation_id: operationId }),
    generateReference: (projectId, partIds, operationId) =>
      req("POST", `/projects/${projectId}/assets/generate`, { part_ids: partIds, client_operation_id: operationId }),
    getJob: (id) => req("GET", `/jobs/${id}`),
    getExports: (id) => req("GET", `/revisions/${id}/exports`),
    resolveArtifactUrl: (u) => (/^https?:/.test(u) ? u : url(u.startsWith("/") ? u : `/artifacts/${u}`)),
  };
}
