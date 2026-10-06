import type { Project } from "./types";

/** Inventory stays intact; a selected project uses only its declared parts. */
export function buildParts(project: Project) {
  const concept = project.concepts.find((c) => c.id === project.selectedConceptId);
  return concept ? project.parts.filter((p) => concept.partsUsed.includes(p.id)) : project.parts;
}
