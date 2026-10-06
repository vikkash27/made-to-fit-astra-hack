import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Experience, Project } from "@/lib/domain/types";
import { partFullyConfirmed } from "@/lib/domain/dimensions";
import { useProjectAction } from "@/lib/api/hooks";
import { Btn, ErrorNote, Row } from "./ui";

const EXP: { v: Experience; l: string }[] = [
  { v: "first", l: "First build" },
  { v: "some", l: "A few projects" },
  { v: "experienced", l: "Experienced" },
];

/** Projection of canonical project state. Edits go through the adapter. */
export function Brief({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState(project.goal ?? "");
  const [constraints, setConstraints] = useState(project.constraints.join(", "));
  const [tools, setTools] = useState(project.tools?.join(", ") ?? "");
  const update = useProjectAction(project.id, (ad, prefs: Parameters<typeof ad.updatePreferences>[1]) => ad.updatePreferences(project.id, prefs));

  const accepted = project.parts.filter((p) => p.status === "accepted").length;
  const proposed = project.parts.length - accepted;
  const unconfirmed = project.parts.filter((p) => !partFullyConfirmed(p));

  return (
    <div>
      <Row k="What you have">
        {project.parts.length === 0 ? (
          <span className="text-muted-foreground">Nothing yet</span>
        ) : (
          <>
            {accepted > 0 && <span>{accepted} confirmed</span>}
            {accepted > 0 && proposed > 0 && " · "}
            {proposed > 0 && <span className="text-primary">{proposed} proposed</span>}
          </>
        )}
      </Row>
      <Row k="What you want">{project.goal ?? <span className="text-muted-foreground">Not decided — explore options</span>}</Row>
      <Row k="Experience · tools">
        {project.experience ? EXP.find((e) => e.v === project.experience)?.l : <span className="text-muted-foreground">Unknown</span>}
        {" · "}
        {project.tools == null ? <span className="text-muted-foreground">tools unknown</span> : project.tools.join(", ") || "none listed"}
      </Row>
      <Row k="Constraints">{project.constraints.length ? project.constraints.join(" · ") : <span className="text-muted-foreground">None stated</span>}</Row>
      <Row k="Still to confirm">
        {unconfirmed.length ? (
          <span className="text-muted-foreground">{unconfirmed.map((p) => p.label).join(", ")} — identity / size</span>
        ) : project.parts.length ? (
          <span className="text-success">Parts confirmed</span>
        ) : (
          <span className="text-muted-foreground">Parts</span>
        )}
      </Row>

      {editing ? (
        <form
          className="mt-3 space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate(
              [
                {
                  goal: goal.trim() || null,
                  constraints: constraints.split(",").map((s) => s.trim()).filter(Boolean),
                  tools: tools.trim() === "" ? null : tools.split(",").map((s) => s.trim()).filter(Boolean),
                },
              ],
              { onSuccess: () => setEditing(false) },
            );
          }}
        >
          {[
            ["Goal", goal, setGoal, "e.g. a desk climate display"],
            ["Constraints", constraints, setConstraints, "portable, display face up…"],
            ["Tools (blank = unknown)", tools, setTools, "soldering iron, FDM printer…"],
          ].map(([l, val, set, ph]) => (
            <label key={l as string} className="block text-xs text-muted-foreground">
              {l as string}
              <input
                value={val as string}
                onChange={(e) => (set as (s: string) => void)(e.target.value)}
                placeholder={ph as string}
                className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          ))}
          <ErrorNote error={update.error} />
          <div className="flex gap-2">
            <Btn variant="primary" type="submit" disabled={update.isPending}>Save brief</Btn>
            <Btn type="button" onClick={() => setEditing(false)}>Cancel</Btn>
          </div>
        </form>
      ) : (
        <button onClick={() => setEditing(true)} className="mt-3 flex items-center gap-2 text-sm text-foreground/80 underline-offset-4 hover:underline">
          <Pencil className="size-3.5" /> Edit brief
        </button>
      )}
    </div>
  );
}

export function ExperienceChips({ project }: { project: Project }) {
  const update = useProjectAction(project.id, (ad, e: Experience) => ad.updatePreferences(project.id, { experience: e }));
  return (
    <div className="flex flex-wrap gap-2">
      {EXP.map((e) => (
        <button
          key={e.v}
          aria-pressed={project.experience === e.v}
          onClick={() => update.mutate([e.v])}
          className={`rounded-full border px-5 py-2.5 text-sm ${project.experience === e.v ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground"}`}
        >
          {e.l}
        </button>
      ))}
    </div>
  );
}
