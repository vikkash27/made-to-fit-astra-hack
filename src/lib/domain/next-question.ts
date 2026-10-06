import type { Project } from "./types";
import { partFullyConfirmed } from "./dimensions";

export type NextQuestion =
  | { kind: "need_parts"; text: string }
  | { kind: "identity"; partId: string; text: string }
  | { kind: "experience"; text: string }
  | { kind: "explore"; text: string }
  | { kind: "form_factor"; text: string }
  | { kind: "confirm_dims"; partId: string; text: string }
  | { kind: "build"; text: string }
  | { kind: "iterate"; text: string };

/** One valuable next question at a time, derived from canonical state. */
export function nextQuestion(p: Project): NextQuestion {
  if (p.parts.length === 0) return { kind: "need_parts", text: "Add a photo of your parts, or list them." };
  const unclear = p.parts.find((x) => x.status === "proposed" && x.needsAttention);
  if (unclear) return { kind: "identity", partId: unclear.id, text: `Is this ${unclear.identityProposed ?? unclear.label}? ${unclear.needsAttention}.` };
  if (!p.goal) {
    if (p.intentMode === "discover" && p.experience == null) return { kind: "experience", text: "Is this your first hardware project?" };
    return { kind: "explore", text: "Want to see what these parts could become?" };
  }
  if (p.revisions.length === 0) {
    if (p.constraints.length === 0 && p.intentMode === "idea") return { kind: "form_factor", text: "Where will it live — desk, wall, or carried around?" };
    const pending = p.parts.find((x) => !partFullyConfirmed(x));
    if (pending) return { kind: "confirm_dims", partId: pending.id, text: `Confirm the ${pending.label.toLowerCase()} identity and size before CAD.` };
    return { kind: "build", text: "Everything needed is confirmed. Create the first enclosure draft?" };
  }
  return { kind: "iterate", text: "Ask for a change — “make it taller”, “thicker walls”." };
}
