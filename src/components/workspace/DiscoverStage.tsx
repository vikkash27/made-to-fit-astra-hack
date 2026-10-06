import { useState } from "react";
import { ArrowLeft, ArrowRight, Columns3, MessageSquare } from "lucide-react";
import type { Project, Stage } from "@/lib/domain/types";
import { useProjectAction } from "@/lib/api/hooks";
import { Composer } from "@/components/studio/Composer";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Btn, ErrorNote, SampleTag } from "./ui";
import { JobProgress } from "./JobProgress";
import { PurposeBrief } from "./PurposeBrief";
import { PartThumbnail } from "./PartsStage";
import { AskAstra } from "./WorkspaceAssistant";

export function DiscoverStage({ project, go }: { project: Project; go: (s: Stage) => void }) {
  const [activeId, setActiveId] = useState<string | null>(
    project.selectedConceptId ?? project.concepts[0]?.id ?? null,
  );
  const [compare, setCompare] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const job = [...project.jobs]
    .sort((a, b) => b.startedAt - a.startedAt)
    .find((j) => j.kind === "concepts");
  const running = job?.stage === "queued" || job?.stage === "running";
  const generate = useProjectAction(project.id, (ad, refinement?: string) =>
    ad.generateConcepts(project.id, project.draftVersion, refinement),
  );
  const choose = useProjectAction(project.id, (ad, id: string) =>
    ad.selectConcept(project.id, id, project.draftVersion),
  );
  const fresh = project.concepts.filter((c) => !c.stale);
  const concepts = (fresh.length ? fresh : project.concepts).slice(-3);
  const c = concepts.find((x) => x.id === activeId) ?? concepts[0];
  const labels = (ids: string[]) =>
    ids.map((id) => project.parts.find((p) => p.id === id)?.label ?? "Component").join(" · ");
  const supported = !c?.supportedFamily || c.supportedFamily === "rectangular_enclosure";
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="stage-heading">
            {c ? "Choose a project that suits you." : "What would you like to make?"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {c
              ? "Compare the parts, skills and extra hardware each option needs. Then measure the parts for your chosen project."
              : "Tell Astra what would be useful. It will propose projects grounded in the parts you own."}
          </p>
        </div>
        <AskAstra prompt="Which project would be easiest for my experience and hardware?" />
      </div>
      {!c ? (
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <PurposeBrief project={project} busy={running} />
          <aside>
            <h2 className="text-lg font-semibold">Your starting point</h2>
            <div className="mt-4 space-y-3">
              {project.parts.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <PartThumbnail project={project} part={p} />
                  <span className="text-sm">{p.label}</span>
                </div>
              ))}
            </div>
            <Btn className="mt-4" onClick={() => go("parts")}>
              <ArrowLeft className="size-4" />
              Review parts
            </Btn>
          </aside>
        </div>
      ) : (
        <>
          <div className="mb-7 grid gap-3 md:grid-cols-3" aria-label="Project options">
            {concepts.map((x) => (
              <button
                key={x.id}
                onClick={() => setActiveId(x.id)}
                aria-pressed={x.id === c.id}
                className={`rounded-lg border p-5 text-left ${x.id === c.id ? "border-primary bg-accent" : "border-border hover:bg-muted"}`}
              >
                <span className="block text-base font-semibold">{x.title}</span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {x.difficulty} · {x.partsUsed.length} of your parts
                </span>
                {x.id === c.id && (
                  <span className="mt-3 block text-xs font-medium text-primary">
                    Viewing this project
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="grid gap-8 xl:grid-cols-2">
            <section className="min-w-0">
              <h2 className="text-3xl font-semibold tracking-tight">
                {c.title} {c.sample && <SampleTag />}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed">{c.purpose}</p>
              {c.whyForYou && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.whyForYou}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Btn
                  variant="primary"
                  disabled={
                    choose.isPending || generate.isPending || (!supported && !c.stale) || running
                  }
                  onClick={() =>
                    c.stale
                      ? generate.mutate([])
                      : choose.mutate([c.id], { onSuccess: () => go("confirm") })
                  }
                >
                  {running || generate.isPending
                    ? "Updating projects…"
                    : choose.isPending
                      ? "Choosing project…"
                      : c.stale
                        ? "Update project options"
                        : "Choose project & measure parts"}
                  <ArrowRight className="size-4" />
                </Btn>
                <Btn variant="outline" onClick={() => setCompare(true)}>
                  <Columns3 className="size-4" />
                  Compare
                </Btn>
              </div>
              {!supported && (
                <p className="mt-3 text-sm text-warning">
                  This option needs custom CAD. Refine it into a rectangular enclosure project to
                  use the guided build.
                </p>
              )}
              {c.stale && (
                <p role="status" className="mt-3 text-sm text-warning">
                  Your parts or brief changed. Generate updated options before choosing.
                </p>
              )}
              <div className="mt-7 divide-y divide-border text-sm">
                {[
                  ["Uses your parts", labels(c.partsUsed) || "No parts listed"],
                  [
                    "Also needed",
                    (c.hardwareNeeded ?? c.additionalNeeded).join(" · ") || "None listed",
                  ],
                  ["Skills", `${c.difficulty} · ${c.skills.join(", ")}`],
                  [
                    "Software & firmware",
                    c.softwareNeeded?.join(" · ") || "Compatibility needs review",
                  ],
                ].map(([name, value]) => (
                  <div key={name} className="py-4">
                    <h3 className="font-medium">{name}</h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <details className="mt-4 border-t border-border pt-4">
                <summary className="text-sm font-medium">
                  Measurements, uncertainties & leftover parts
                </summary>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <p>
                    Measure next:{" "}
                    {c.nextMeasurements.join(" · ") ||
                      "Width, depth and assembled height of every used part."}
                  </p>
                  <p>
                    Uncertain:{" "}
                    {c.uncertainties.join(" · ") ||
                      "Review mounting, connectors and firmware compatibility."}
                  </p>
                  <p>Left over: {labels(c.partsUnused) || "None listed"}</p>
                </div>
              </details>
            </section>
            <section className="min-w-0 rounded-lg bg-muted/50 p-5 sm:p-7">
              {c.previewImage && (
                <>
                  <img
                    src={c.previewImage}
                    alt={`${c.title} concept preview`}
                    className="mb-5 max-h-64 w-full rounded-md object-cover"
                  />
                  <p className="mb-5 text-xs text-muted-foreground">
                    Concept preview · dimensions pending{c.sample ? " · sample image" : ""}
                  </p>
                </>
              )}
              <h2 className="text-xl font-semibold">The plan for your build</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {c.layoutRationale || c.formFactor}
              </p>
              <div className="mt-5 space-y-3">
                {project.parts
                  .filter((p) => c.partsUsed.includes(p.id))
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <PartThumbnail project={project} part={p} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{p.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[p.size.x, p.size.y, p.size.z].map((d) => d.value ?? "?").join(" × ")} mm
                          ·{" "}
                          {Object.values(p.size).every((d) => d.status === "accepted")
                            ? "confirmed measurements"
                            : "measure next"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              <h3 className="mt-7 text-sm font-medium">How you’ll get there</h3>
              <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
                {c.buildPath.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <p className="mt-6 text-xs text-muted-foreground">
                Your CAD enclosure appears after you confirm measurements and build a draft.
              </p>
            </section>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            <Btn variant="outline" onClick={() => setRefineOpen((x) => !x)}>
              <MessageSquare className="size-4" />
              Refine project options
            </Btn>
            <Btn onClick={() => go("parts")}>
              <ArrowLeft className="size-4" />
              Back to parts
            </Btn>
          </div>
          {refineOpen && (
            <div className="mt-4 max-w-3xl">
              <Composer
                allowFiles={false}
                autoFocus
                placeholder="Make it portable, use fewer extra parts…"
                busy={generate.isPending || running}
                onSubmit={(v) => generate.mutateAsync([v.text]).then(() => {})}
              />
            </div>
          )}
          <details className="mt-6 border-t border-border pt-4">
            <summary className="text-sm font-medium">Edit purpose & preferences</summary>
            <div className="mt-5 max-w-3xl">
              <PurposeBrief project={project} busy={running} />
            </div>
          </details>
        </>
      )}
      {running && job && (
        <div className="mt-5" role="status">
          <JobProgress job={job} />
        </div>
      )}
      {job?.stage === "failed" && (
        <div className="mt-4">
          <JobProgress job={job} />
          <Btn variant="outline" onClick={() => generate.mutate([])} disabled={generate.isPending}>
            Retry project suggestions
          </Btn>
        </div>
      )}
      <ErrorNote error={choose.error ?? generate.error} />
      <Dialog open={compare} onOpenChange={setCompare}>
        <DialogContent className="theme-studio-light max-h-[90dvh] max-w-5xl overflow-y-auto bg-white text-foreground">
          <DialogTitle>Compare project options</DialogTitle>
          <DialogDescription>Review the hardware and effort before choosing.</DialogDescription>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-left">What to compare</th>
                  {concepts.map((x) => (
                    <th key={x.id} className="p-3 text-left">
                      {x.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Purpose", (x) => x.purpose],
                    ["Difficulty", (x) => x.difficultyReason ?? x.difficulty],
                    ["Also needed", (x) => x.additionalNeeded.join(", ") || "None listed"],
                    ["Uncertainties", (x) => x.uncertainties.join(", ")],
                    [
                      "Measure next",
                      (x) => x.nextMeasurements.join(", ") || "Width, depth and assembled height",
                    ],
                  ] as [string, (x: (typeof concepts)[number]) => string][]
                ).map(([label, read]) => (
                  <tr key={label} className="border-t border-border align-top">
                    <th className="p-3 text-left font-medium">{label}</th>
                    {concepts.map((x) => (
                      <td key={x.id} className="p-3">
                        {read(x)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
