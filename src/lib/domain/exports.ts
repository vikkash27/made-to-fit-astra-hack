import type { Artifact, Project, Revision } from "./types";

export function acceptedRevision(p: Project): Revision | null {
  return p.revisions.find((r) => r.id === p.acceptedRevisionId && r.kind === "accepted") ?? null;
}

/** A download is only offered for a real artifact on the accepted revision. */
export function downloadableArtifact(p: Project, kind: Artifact["kind"]): Artifact | null {
  const rev = acceptedRevision(p);
  if (!rev || rev.sample) return null;
  return rev.artifacts.find((a) => a.kind === kind && !!a.url) ?? null;
}
