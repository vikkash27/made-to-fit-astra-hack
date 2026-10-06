import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Experience, Project } from "@/lib/domain/types";
import { useProjectAction } from "@/lib/api/hooks";
import { Btn, ErrorNote } from "./ui";

const PURPOSES = [
  "Something useful for my desk",
  "Monitor my home",
  "A portable gadget",
  "Learn electronics",
];
const INPUT =
  "mt-2 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground";

/** Persist the brief before generating; use the returned version after the edit. */
export function PurposeBrief({
  project,
  onStarted,
  busy = false,
}: {
  project: Project;
  onStarted?: () => void;
  busy?: boolean;
}) {
  const [purpose, setPurpose] = useState(project.constraints.join(", "));
  const [setting, setSetting] = useState(project.useSetting ?? "");
  const [experience, setExperience] = useState<Experience>(project.experience);
  const [tools, setTools] = useState(project.tools?.join(", ") ?? "");
  const [time, setTime] = useState(project.timeBudget ?? "");
  const [additional, setAdditional] = useState(project.allowAdditionalParts ?? true);
  const action = useProjectAction(project.id, async (ad) => {
    const saved = await ad.updatePreferences(project.id, {
      constraints: purpose.trim() ? [purpose.trim()] : [],
      useSetting: setting.trim() || null,
      experience,
      tools: tools.trim()
        ? tools
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
      timeBudget: time.trim() || null,
      allowAdditionalParts: additional,
    });
    return ad.generateConcepts(project.id, saved.draftVersion);
  });
  const disabled = busy || action.isPending;
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        action.mutate([], { onSuccess: onStarted });
      }}
    >
      <fieldset disabled={disabled} className="space-y-6 disabled:opacity-60">
        <div>
          <label htmlFor="build-purpose" className="text-sm font-medium">
            What would make this build useful to you?
          </label>
          <textarea
            id="build-purpose"
            rows={3}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="A display for my desk, a room monitor, something to learn with…"
            className={INPUT}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {PURPOSES.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={purpose === p}
                onClick={() => setPurpose(p)}
                className={`rounded-full border px-3 py-1.5 text-xs ${purpose === p ? "border-primary text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Still deciding? Leave this blank and explore what your parts could do.
          </p>
        </div>
        <details>
          <summary className="text-sm font-medium">Personalise the suggestions · optional</summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="text-sm">
              Where will it live?
              <input
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                placeholder="Desk, wall, outdoors…"
                className={INPUT}
              />
            </label>
            <label className="text-sm">
              Your experience
              <select
                value={experience ?? ""}
                onChange={(e) => setExperience((e.target.value || null) as Experience)}
                className={INPUT}
              >
                <option value="">Not sure / skip</option>
                <option value="first">My first build</option>
                <option value="some">A few projects</option>
                <option value="experienced">Experienced</option>
              </select>
            </label>
            <label className="text-sm">
              Tools you have
              <input
                value={tools}
                onChange={(e) => setTools(e.target.value)}
                placeholder="3D printer, soldering iron, calipers…"
                className={INPUT}
              />
            </label>
            <label className="text-sm">
              Time you want to spend
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="An afternoon, a weekend…"
                className={INPUT}
              />
            </label>
          </div>
        </details>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={additional}
            onChange={(e) => setAdditional(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            I’m open to a few extra parts
            <span className="mt-1 block text-xs text-muted-foreground">
              Turn off to keep project suggestions within your hardware inventory. Firmware and
              tools may still be needed.
            </span>
          </span>
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Btn variant="primary" type="submit" disabled={disabled || !project.parts.length}>
          {disabled
            ? "Finding projects…"
            : project.concepts.length
              ? "Find projects with this brief"
              : "Find projects for my parts"}
          <ArrowRight className="size-4" />
        </Btn>
        <span className="text-xs text-muted-foreground">
          Uses your reviewed parts and preferences.
        </span>
      </div>
      <ErrorNote error={action.error} />
    </form>
  );
}
