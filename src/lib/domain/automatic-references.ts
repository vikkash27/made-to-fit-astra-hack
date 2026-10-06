import type { Project } from "./types";

export function referenceToGenerate(project: Project, attempted: ReadonlySet<string> = new Set()) {
  return project.parts.find(
    (part) =>
      !attempted.has(part.id) &&
      !!part.identityAccepted &&
      !!part.photoId &&
      !!part.anchor &&
      !part.visualAssetId &&
      !project.jobs.some((job) => job.kind === "reference" && job.partId === part.id),
  );
}
