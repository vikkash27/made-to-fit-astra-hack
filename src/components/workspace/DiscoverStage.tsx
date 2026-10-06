import { JobProgress } from "./JobProgress";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Columns3, MessageSquare } from "lucide-react";
import type { Project, Stage } from "@/lib/domain/types";
import { useProjectAction } from "@/lib/api/hooks";
import { Composer } from "@/components/studio/Composer";
import { Btn, ErrorNote, Label, SampleTag } from "./ui";
import { PurposeBrief } from "./PurposeBrief";

export function DiscoverStage({ project, go }: { project: Project; go: (s: Stage) => void }) {
  const [activeId, setActiveId] = useState<string | null>(
    project.selectedConceptId ?? project.concepts[0]?.id ?? null,
  );
  const [compare, setCompare] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const job = [...project.jobs].reverse().find((j) => j.kind === "concepts");
  const running = job && (job.stage === "queued" || job.stage === "running");

  const generate = useProjectAction(project.id, (ad, refinement?: string) =>
    ad.generateConcepts(project.id, project.draftVersion, refinement),
  );
  const choose = useProjectAction(project.id, (ad, id: string) =>
    ad.selectConcept(project.id, id, project.draftVersion),
  );

  const fresh = project.concepts.filter((c) => !c.stale);
  const concepts = (fresh.length ? fresh : project.concepts).slice(-3);
  const c = concepts.find((x) => x.id === activeId) ?? concepts[0];

  if (!c) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-10 lg:px-12 [--primary-foreground:var(--foreground)]">
        <div className="mx-auto max-w-3xl">
          <h1 className="display-tight text-[clamp(40px,6vw,64px)]">What could these become?</h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Start with a purpose. Astra will suggest up to three electronics projects using your
            parts, with the extra hardware, skills and measurements each one needs.
          </p>
          <div className="my-7 border-y border-border py-4">
            <p className="text-sm">Your starting point</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {project.parts.map((p) => p.label).join(" · ") || "Add parts to start exploring."}
            </p>
            <Btn className="mt-2" onClick={() => go("parts")}>
              <ArrowLeft className="size-4" /> Review parts and 3D references
            </Btn>
          </div>
          <PurposeBrief project={project} busy={!!running} />
          {job && (
            <div className="mt-5">
              <JobProgress job={job} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const idx = concepts.indexOf(c);
  const labels = (ids: string[]) =>
    ids.map((id) => project.parts.find((p) => p.id === id)?.label ?? id).join(" · ");
  const supported = !c.supportedFamily || c.supportedFamily === "rectangular_enclosure";

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1 [--primary-foreground:var(--foreground)]">
      <div className="relative grid grid-cols-1 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(420px,560px)_1fr]">
        <aside className="relative z-10 px-6 py-8 lg:overflow-y-auto lg:px-12">
          <div className="flex items-center gap-2 font-mono text-[13px] text-muted-foreground">
            <button onClick={() => go("parts")} className="hover:text-foreground">
              Your parts
            </button>{" "}
            / <span className="text-foreground">Explore</span>
            {c.sample && <SampleTag />}
          </div>
          <div className="mt-8 font-mono text-[13px] uppercase tracking-wider">
            {String(idx + 1).padStart(2, "0")} / {c.title}
          </div>
          <h1 className="display-tight mt-4 text-[clamp(44px,5vw,76px)]">{c.title}.</h1>
          <div className="mt-6 grid grid-cols-[80px_1fr] gap-4 text-[15px]">
            <span className="text-muted-foreground">Astra</span>
            <p className="leading-snug">{c.purpose}</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Btn
              variant="primary"
              className="h-12 px-6 text-[15px]"
              disabled={choose.isPending || c.stale || !supported}
              onClick={() => choose.mutate([c.id], { onSuccess: () => go("confirm") })}
            >
              Build this project <ArrowRight className="size-4" />
            </Btn>
            <Btn onClick={() => setRefineOpen((o) => !o)}>
              <MessageSquare className="size-4" /> Refine with Astra
            </Btn>
            <Btn onClick={() => setCompare(true)}>
              <Columns3 className="size-4" /> Compare
            </Btn>
            <Btn onClick={() => go("parts")}>
              <ArrowLeft className="size-4" /> Back to parts
            </Btn>
          </div>
          {!supported && (
            <p className="mt-3 text-sm text-warning">
              This concept needs a custom CAD recipe. Refine it into a rectangular enclosure project
              to use the guided build.
            </p>
          )}
          <div className="mt-6 text-sm">
            {[
              ["For you", c.whyForYou],
              ["Uses", labels(c.partsUsed) || "None listed"],
              ["Left over", labels(c.partsUnused) || "None"],
              [
                "Extra hardware",
                (c.hardwareNeeded ?? c.additionalNeeded).join(" · ") || "None listed",
              ],
              [
                "Firmware",
                c.softwareNeeded?.join(" · ") || "None listed; compatibility still needs review",
              ],
              ["Difficulty", `${c.difficulty} · ${c.skills.join(", ")}`],
              ["Uncertain", c.uncertainties.join(" · ")],
              [
                "Measure next",
                c.nextMeasurements.join(" · ") ||
                  "Review the width, depth and assembled height of the parts used in this project.",
              ],
              [
                "Enclosure",
                c.layoutRationale || "Confirm the layout and measurements before building.",
              ],
            ].map(([k, v]) => (
              <div
                key={k}
                className="grid grid-cols-[110px_1fr] gap-4 border-t border-border py-2.5"
              >
                <span className="text-muted-foreground">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[13px] text-foreground/85">
            {c.buildPath.map((s, i) => (
              <span key={s} className="flex items-center gap-3">
                {i > 0 && <ArrowRight className="size-3.5 text-muted-foreground" />}
                {s}
              </span>
            ))}
          </div>
          <details className="mt-6 border-t border-border pt-4">
            <summary className="cursor-pointer text-sm">
              Change the purpose, tools or parts budget
            </summary>
            <div className="mt-5">
              <PurposeBrief project={project} busy={!!running} />
            </div>
          </details>
          <p className="mt-3 text-xs text-muted-foreground">
            Choosing sets your goal. It doesn’t confirm dimensions, accept a design or approve
            purchases.
          </p>
          <ErrorNote error={choose.error ?? generate.error} />
        </aside>

        <div className="relative min-h-[360px] overflow-hidden">
          {!c.previewImage && (
            <section className="h-full bg-surface px-6 py-8 lg:overflow-y-auto lg:px-12 lg:py-12">
              <h2 className="text-2xl font-medium">Your project plan</h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {c.layoutRationale ?? c.formFactor}
              </p>
              <div className="mt-8 border-t border-border">
                {project.parts
                  .filter((p) => c.partsUsed.includes(p.id))
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-4 text-sm"
                    >
                      <span>{p.label}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {[p.size.x, p.size.y, p.size.z].map((d) => d.value ?? "?").join(" × ")} mm ·{" "}
                        {Object.values(p.size).every((d) => d.status === "accepted")
                          ? "measured envelope"
                          : "measurements to review"}
                      </span>
                    </div>
                  ))}
              </div>
              <h3 className="mt-8 text-sm font-medium">How you’ll get there</h3>
              <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-muted-foreground">
                {c.buildPath.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <p className="mt-8 text-xs text-muted-foreground">
                Project proposal. A 3D enclosure appears after you review measurements and build the
                CAD draft.
              </p>
            </section>
          )}
          {c.previewImage && (
            <img
              key={c.id}
              src={c.previewImage}
              alt={`${c.title} concept preview`}
              className="absolute inset-0 h-full w-full object-cover animate-in fade-in duration-500"
            />
          )}
          {c.previewImage && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/10 to-transparent" />
              <div className="label-mono absolute bottom-5 right-6 text-[10px] text-foreground/70">
                Concept preview · dimensions pending{c.sample ? " · sample image" : ""}
              </div>
            </>
          )}
          {running && (
            <div
              className="label-mono absolute right-6 top-5 rounded-sm bg-background/80 px-2 py-1"
              role="status"
            >
              <JobProgress job={job} compact />
            </div>
          )}
        </div>
      </div>

      {c.stale && (
        <p role="status" className="px-6 py-3 text-sm text-warning">
          Your inventory or brief changed. Refine with Astra to generate current concepts before
          selecting.
        </p>
      )}
      {job?.stage === "failed" && (
        <p role="alert" className="px-6 py-3 text-sm text-destructive">
          {job.error}
        </p>
      )}
      <div className="border-t border-border/70 px-6 pb-4 pt-3 lg:px-12">
        <Label className="mb-3">Alternative forms using your parts</Label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {concepts.map((x, i) => (
            <button
              key={x.id}
              onClick={() => setActiveId(x.id)}
              aria-pressed={x.id === c.id}
              className={`group relative flex h-28 items-stretch overflow-hidden rounded-sm border text-left transition-colors ${x.id === c.id ? "border-primary" : "border-border hover:border-muted-foreground"}`}
            >
              <div className="z-10 flex flex-col justify-center gap-1 bg-gradient-to-r from-surface via-surface/90 to-transparent py-3 pl-5 pr-12">
                <span
                  className={`font-mono text-xs ${x.id === c.id ? "text-primary" : "text-muted-foreground"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px]">{x.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {x.difficultyReason ?? x.difficulty}
                </span>
              </div>
              {x.previewImage && (
                <img
                  src={x.previewImage}
                  alt=""
                  loading="lazy"
                  className="absolute inset-y-0 right-0 h-full w-3/5 object-cover"
                />
              )}
            </button>
          ))}
        </div>
        {refineOpen && (
          <div className="mt-3">
            <Composer
              allowFiles={false}
              autoFocus
              placeholder="Make it portable, use only these parts, keep the display face up…"
              busy={generate.isPending || running}
              onSubmit={(v) => generate.mutate([v.text])}
            />
          </div>
        )}
      </div>

      {compare && (
        <div
          role="dialog"
          aria-label="Compare concepts"
          className="fixed inset-0 z-50 overflow-auto bg-background/95 p-10"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <h2 className="display-tight text-4xl">Compare</h2>
              <Btn variant="outline" onClick={() => setCompare(false)}>
                Close
              </Btn>
            </div>
            <table className="mt-8 w-full text-sm">
              <thead>
                <tr>
                  <th />
                  {concepts.map((x) => (
                    <th key={x.id} className="p-3 text-left font-display text-lg font-semibold">
                      {x.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Form factor", (x) => x.formFactor],
                    ["Purpose", (x) => x.purpose],
                    ["Difficulty", (x) => x.difficultyReason ?? x.difficulty],
                    ["Also needed", (x) => x.additionalNeeded.join(", ")],
                    ["Uncertain", (x) => x.uncertainties.join(", ")],
                    [
                      "Measure next",
                      (x) =>
                        x.nextMeasurements.join(", ") ||
                        "Review the width, depth and assembled height of the parts used in this project.",
                    ],
                  ] as [string, (x: (typeof concepts)[number]) => string][]
                ).map(([k, f]) => (
                  <tr key={k} className="border-t border-border align-top">
                    <td className="p-3 text-muted-foreground">{k}</td>
                    {concepts.map((x) => (
                      <td key={x.id} className="p-3">
                        {f(x)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
