import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, ScanLine } from "lucide-react";
import { getAdapter } from "@/lib/api";
import { useViewer } from "@/lib/store/viewer-store";
import type { Project, Revision } from "@/lib/domain/types";
import { Btn, ErrorNote } from "./ui";
import { AssemblyDiagram } from "./AssemblyDiagram";
import { WiringPanel } from "./WiringPanel";
import { referencePresentation } from "@/lib/domain/reference-presentation";

export function BuildGuide({
  revision,
  project,
  onShowParts,
}: {
  revision: Revision;
  project?: Project;
  onShowParts?: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [section, setSection] = useState<"prepare" | "assemble" | "wire">("assemble");
  const qc = useQueryClient(),
    ad = getAdapter();
  const guide = useQuery({
    queryKey: ["build-guide", revision.id],
    enabled: !revision.sample,
    retry: false,
    queryFn: async () => {
      const g = await ad.getBuildGuide(revision.id);
      if (g.revision_id !== revision.id || g.spec_hash !== revision.specHash)
        throw new Error(
          "This guide does not match the accepted design. Refresh before continuing.",
        );
      return g;
    },
  });
  const progress = useQuery({
    queryKey: ["guide-progress", revision.id],
    enabled: !revision.sample,
    retry: false,
    queryFn: async () => {
      const p = await ad.getGuideProgress(revision.id);
      if (p.revision_id !== revision.id || p.spec_hash !== revision.specHash)
        throw new Error("Assembly progress does not match the accepted design.");
      return p;
    },
  });
  const save = useMutation({
    mutationFn: ({ ids, planId }: { ids: string[]; planId: string | null }) =>
      ad.saveGuideProgress(revision.id, ids, planId),
    onSuccess: (p) => qc.setQueryData(["guide-progress", revision.id], p),
    onError: () => qc.invalidateQueries({ queryKey: ["guide-progress", revision.id] }),
  });
  const hardware = revision.assembly?.parts.filter((p) => p.role === "hardware_reference") ?? [];
  const modeled = hardware.filter((p) =>
    project?.visualAssets?.some((a) => {
      const bounds = a.calibration.bounds;
      return (
        a.part_id === p.part_id &&
        bounds?.[1].every(
          (n, i) => Number.isFinite(n) && Number.isFinite(bounds[0][i]) && n > bounds[0][i]!,
        )
      );
    }),
  );
  const reviewed = hardware.filter((p) =>
    project?.visualAssets?.some(
      (a) =>
        a.part_id === p.part_id &&
        a.calibration.status === "reviewed" &&
        a.calibration.aligned_size_mm?.every((n, i) => Math.abs(n - p.size_mm[i]!) < 1e-6),
    ),
  );
  useEffect(() => {
    if (!revision.sample && modeled.length) useViewer.getState().set({ mode: "rendered" });
  }, [revision.id, revision.sample, modeled.length]);
  if (revision.sample)
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        This is a sample preview. An accepted CAD revision creates your interactive guide.
      </p>
    );
  if (guide.isPending)
    return (
      <p role="status" className="mt-4 text-sm">
        Loading your assembly guide…
      </p>
    );
  if (guide.error)
    return (
      <div className="mt-4">
        <ErrorNote error={guide.error} onRetry={() => guide.refetch()} />
      </div>
    );
  const g = guide.data,
    step = g.steps.find((s) => s.id === activeId) ?? g.steps[0],
    index = step ? g.steps.indexOf(step) : 0;
  const ids = progress.data?.completed_step_ids ?? [];
  const done = step && ids.includes(step.id);
  const completed = g.steps.filter((s) => ids.includes(s.id)).length;
  const focus = (partIds: string[], scroll = false) => {
    useViewer.getState().set({
      selectedId: partIds.find((id) => id !== "base" && id !== "lid") ?? partIds[0] ?? null,
      isolatedId: null,
      hidden: {},
      explode: 0.6,
      cameraPreset: "iso",
      mode: modeled.length ? "rendered" : "cad",
    });
    useViewer.getState().fit();
    if (scroll) onShowParts?.();
  };
  const selectStep = (id: string) => {
    setActiveId(id);
    const s = g.steps.find((s) => s.id === id);
    if (s) focus(s.part_ids);
  };
  return (
    <div className="mt-5 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-medium">{g.title}</h3>
        <span className="text-xs text-muted-foreground">
          {completed} of {g.steps.length} assembly checks complete
        </span>
      </div>
      {g.purpose && <p className="mt-2 text-sm text-muted-foreground">{g.purpose}</p>}
      <div className="mt-4 rounded-lg bg-secondary/70 px-4 py-3 text-sm">
        {modeled.length
          ? `${modeled.length} of ${hardware.length} component models available. Rendered view shows their appearance inside the enclosure; automatic alignment remains a visual preview.`
          : "These boxes are measured component envelopes. Generated models appear automatically as they become available."}
      </div>
      <nav aria-label="Assembly guide sections" className="my-5 flex flex-wrap gap-2">
        {[
          { id: "prepare", label: "Parts & preparation" },
          { id: "assemble", label: "Assembly steps" },
          { id: "wire", label: "Wiring" },
        ].map((s) => (
          <Btn
            key={s.id}
            variant={section === s.id ? "primary" : "outline"}
            aria-pressed={section === s.id}
            onClick={() => setSection(s.id as typeof section)}
          >
            {s.label}
          </Btn>
        ))}
      </nav>
      <ErrorNote error={progress.error ?? save.error} onRetry={() => progress.refetch()} />
      {section === "prepare" && (
        <div>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { title: "Print these", parts: g.parts.filter((p) => p.role === "printable_cad") },
              {
                title: "Your electronics",
                parts: g.parts.filter((p) => p.role === "hardware_reference"),
              },
            ].map(({ title, parts }) => (
              <section key={title}>
                <h4 className="text-base font-medium">{title}</h4>
                <ul className="mt-3 space-y-3">
                  {parts.map((p) => (
                    <li key={p.part_id}>
                      <button
                        className="text-left text-sm underline underline-offset-4"
                        onClick={() => focus([p.part_id], true)}
                      >
                        {p.name}
                      </button>
                      <span className="mt-1 block font-mono text-xs text-muted-foreground">
                        {p.size_mm.map((n) => Number(n.toFixed(2))).join(" × ")} mm
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {(g.additional_hardware.length > 0 || g.software_dependencies.length > 0) && (
            <section className="mt-6 border-t border-border pt-4">
              <h4 className="font-medium">Have these ready, too</h4>
              {g.additional_hardware.length > 0 && (
                <p className="mt-2 text-sm">Hardware: {g.additional_hardware.join(" · ")}</p>
              )}
              {g.software_dependencies.length > 0 && (
                <p className="mt-2 text-sm">
                  Software / firmware: {g.software_dependencies.join(" · ")}
                </p>
              )}
            </section>
          )}
          <details open className="mt-6 border-y border-border py-4">
            <summary className="cursor-pointer text-sm font-medium">
              Decisions to review before building
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {g.unresolved.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </details>
          <Btn className="mt-5" variant="primary" onClick={() => setSection("assemble")}>
            Start assembly
            <ArrowRight className="size-4" />
          </Btn>
        </div>
      )}
      {section === "assemble" && step && (
        <section aria-label="Assembly steps">
          <ol className="flex flex-wrap gap-2" aria-label="Choose assembly step">
            {g.steps.map((s, i) => (
              <li key={s.id}>
                <button
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  aria-current={s.id === step.id ? "step" : undefined}
                  onClick={() => selectStep(s.id)}
                  className={`inline-flex size-10 items-center justify-center rounded-full border text-sm ${s.id === step.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                >
                  {ids.includes(s.id) ? <Check className="size-4" /> : i + 1}
                </button>
              </li>
            ))}
          </ol>
          <div aria-live="polite" className="mt-5">
            <h4 className="text-2xl font-medium">{step.title}</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Step {index + 1} of {g.steps.length}
              {step.requires_review ? " · needs your review" : ""}
            </p>
          </div>
          <AssemblyDiagram
            revision={revision}
            partIds={step.part_ids}
            onSelect={(id) => focus([id], true)}
          />
          <p className="text-sm leading-relaxed">{step.instruction}</p>
          {step.id === "bench" || step.id === "close" ? (
            <Btn className="mt-4" variant="outline" onClick={() => setSection("wire")}>
              Open wiring plan
              <ArrowRight className="size-4" />
            </Btn>
          ) : null}
          <div className="mt-5 rounded-lg bg-secondary p-4 text-sm">
            <p className="font-medium">Check before continuing</p>
            <p className="mt-2 leading-relaxed">{step.completion_check}</p>
            <label className="mt-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={!!done}
                disabled={!progress.data || save.isPending}
                onChange={(e) =>
                  save.mutate({
                    ids: e.target.checked ? [...ids, step.id] : ids.filter((id) => id !== step.id),
                    planId: progress.data?.wiring_plan_id ?? null,
                  })
                }
              />
              I completed this step and its check
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Btn
              variant="outline"
              onClick={() => focus(step.part_ids, true)}
              disabled={!step.part_ids.length}
            >
              <ScanLine className="size-4" />
              Show step in 3D
            </Btn>
            <Btn disabled={index === 0} onClick={() => selectStep(g.steps[index - 1]!.id)}>
              <ArrowLeft className="size-4" />
              Previous
            </Btn>
            <Btn
              disabled={index === g.steps.length - 1}
              onClick={() => selectStep(g.steps[index + 1]!.id)}
            >
              Next
              <ArrowRight className="size-4" />
            </Btn>
          </div>
          {save.isPending && (
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              Saving your check…
            </p>
          )}
        </section>
      )}
      {section === "wire" && (
        <WiringPanel
          revision={revision}
          project={project}
          progress={progress.data}
          savingProgress={save.isPending}
          saveProgress={(ids, planId) => save.mutate({ ids, planId })}
          onShowParts={onShowParts}
        />
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Checks record your progress on {revision.label}; they do not change the accepted design or
        certify the build.
      </p>
    </div>
  );
}
