import type { Project, Stage } from "./types";
import { buildParts } from "./build-parts";

export const STAGE_LABELS: Record<Stage, string> = {
  parts: "Review parts",
  discover: "Choose a project",
  confirm: "Measure parts",
  engineer: "Build & check",
  export: "Print & assemble",
};
export function stageAccess(
  project: Project,
  stage: Stage,
): { allowed: boolean; reason?: string; resolve?: Stage } {
  const identitiesReviewed =
    project.parts.length > 0 && project.parts.every((p) => !!p.identityAccepted);
  if (stage === "parts") return { allowed: true };
  if (!project.parts.length)
    return { allowed: false, reason: "Add a photo or a part to get started.", resolve: "parts" };
  if (stage === "discover" && !identitiesReviewed)
    return {
      allowed: false,
      reason: "Confirm the identity of each part before choosing a project.",
      resolve: "parts",
    };
  if (stage === "confirm") {
    if (!project.goal)
      return {
        allowed: false,
        reason: "Choose a project or describe your idea before measuring.",
        resolve: identitiesReviewed ? "discover" : "parts",
      };
    if (!buildParts(project).every((p) => !!p.identityAccepted))
      return {
        allowed: false,
        reason: "Review the identities of the parts used in this project.",
        resolve: "parts",
      };
  }
  if (stage === "engineer" && !project.revisions.length)
    return {
      allowed: false,
      reason: "Confirm measurements and create an enclosure draft first.",
      resolve: project.goal ? "confirm" : "parts",
    };
  if (stage === "export" && !project.acceptedRevisionId)
    return {
      allowed: false,
      reason: "Build, check and explicitly accept a revision to unlock its print files.",
      resolve: project.revisions.length ? "engineer" : project.goal ? "confirm" : "parts",
    };
  return { allowed: true };
}
