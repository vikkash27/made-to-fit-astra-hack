import { getAdapter } from "@/lib/api";
import type { IntentMode } from "@/lib/domain/types";

/** Shared intake: create project, upload photos, start analysis. */
export async function startProject(input: {
  text: string;
  files: File[];
  links: string[];
  intent: IntentMode | null;
}) {
  const ad = getAdapter();
  if (input.files.length > 5)
    throw new Error(
      "Choose up to five photos to start. You can add more after reviewing those parts.",
    );
  const intent: IntentMode =
    input.intent ?? (input.files.length > 0 || !input.text ? "discover" : "idea");
  const initialText = [input.text, ...input.links].filter(Boolean).join("\n") || undefined;
  const name = input.text
    ? input.text.slice(0, 48)
    : input.files.length
      ? "Parts from photo"
      : "Untitled project";
  if (intent === "idea" && !input.text.trim())
    throw new Error("Describe your idea, or choose Explore my components.");
  const project = await ad.createProject({
    name,
    intentMode: intent,
    goal: intent === "idea" && input.text ? input.text : null,
    initialText,
  });
  if (input.files.length) {
    const ids: string[] = [];
    for (const f of input.files) ids.push((await ad.uploadPhoto(project.id, f)).id);
    await ad.analyzePhotos(project.id, ids);
  }
  if (initialText && ad.mode === "http") {
    // The initial brief is persisted even if provider admission fails; surface the failure.
    try {
      await ad.agent(project.id, { text: initialText, parentRevisionId: null, context: [] });
    } catch (error) {
      throw new Error(
        `Project saved. Astra could not start: ${error instanceof Error ? error.message : "request failed"}. Open Projects to continue.`,
      );
    }
  }
  return project.id;
}
