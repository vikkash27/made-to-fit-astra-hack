import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ScanLine } from "lucide-react";
import { getAdapter } from "@/lib/api";
import { useViewer } from "@/lib/store/viewer-store";
import type { Revision } from "@/lib/domain/types";
import { Btn, ErrorNote } from "./ui";

export function BuildGuide({
  revision,
  onShowParts,
}: {
  revision: Revision;
  onShowParts?: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const guide = useQuery({
    queryKey: ["build-guide", revision.id],
    enabled: !revision.sample,
    retry: false,
    queryFn: async () => {
      const result = await getAdapter().getBuildGuide(revision.id);
      if (result.revision_id !== revision.id || result.spec_hash !== revision.specHash)
        throw new Error(
          "This guide does not match the accepted design. Refresh the project before continuing.",
        );
      return result;
    },
  });
  if (revision.sample)
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        This is a sample preview. A real accepted CAD revision creates your parts list and assembly
        guide.
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
  const g = guide.data;
  const step = g.steps.find((s) => s.id === activeId) ?? g.steps[0];
  const index = step ? g.steps.indexOf(step) : 0;
  const printable = g.parts.filter((p) => p.role === "printable_cad");
  const hardware = g.parts.filter((p) => p.role === "hardware_reference");
  const show = () => {
    const first = step?.part_ids.find((id) => id !== "base" && id !== "lid") ?? step?.part_ids[0];
    useViewer.getState().set({
      selectedId: first ?? null,
      isolatedId: null,
      hidden: {},
      explode: 0.6,
      cameraPreset: "iso",
    });
    useViewer.getState().fit();
    onShowParts?.();
  };
  return (
    <div className="mt-5">
      <p className="text-lg font-medium">{g.title}</p>
      {g.purpose && <p className="mt-2 text-sm text-muted-foreground">{g.purpose}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {[
          { title: "Print these", parts: printable },
          { title: "Use your hardware", parts: hardware },
        ].map(({ title, parts }) => (
          <section key={title}>
            <h3 className="text-sm font-medium">{title}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {parts.map((p) => (
                <li key={p.part_id}>
                  <button
                    onClick={() => useViewer.getState().select(p.part_id)}
                    className="text-left underline decoration-border underline-offset-4 hover:decoration-foreground"
                  >
                    {p.name}
                  </button>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {p.size_mm.map((n) => Number(n.toFixed(2))).join(" × ")} mm
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {(g.additional_hardware.length > 0 || g.software_dependencies.length > 0) && (
        <section className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-medium">Have these ready, too</h3>
          {g.additional_hardware.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Hardware: {g.additional_hardware.join(" · ")}
            </p>
          )}
          {g.software_dependencies.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Software / firmware: {g.software_dependencies.join(" · ")}
            </p>
          )}
        </section>
      )}
      <details open className="mt-5 border-y border-border py-4">
        <summary className="cursor-pointer text-sm font-medium">
          Decisions to review before building
        </summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {g.unresolved.map((u, i) => (
            <li key={i}>{u}</li>
          ))}
        </ul>
      </details>
      {step && (
        <section className="mt-6" aria-label="Assembly steps">
          <label className="block text-sm">
            Assembly step
            <select
              className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm"
              value={step.id}
              onChange={(e) => setActiveId(e.target.value)}
            >
              {g.steps.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i + 1}. {s.title}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-5" aria-live="polite">
            <p className="text-xs text-muted-foreground">
              Step {index + 1} of {g.steps.length}
              {step.requires_review ? " · needs your review" : ""}
            </p>
            <h3 className="mt-2 text-xl font-medium">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed">{step.instruction}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Check before continuing: </span>
              {step.completion_check}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="outline" onClick={show} disabled={!step.part_ids.length}>
              <ScanLine className="size-4" /> Show parts in 3D
            </Btn>
            <Btn disabled={index === 0} onClick={() => setActiveId(g.steps[index - 1]!.id)}>
              <ArrowLeft className="size-4" /> Previous
            </Btn>
            <Btn
              disabled={index === g.steps.length - 1}
              onClick={() => setActiveId(g.steps[index + 1]!.id)}
            >
              Next <ArrowRight className="size-4" />
            </Btn>
          </div>
        </section>
      )}
      <p className="mt-5 text-xs text-muted-foreground">
        Instructions follow accepted revision {revision.label}. Browsing steps does not certify
        assembly or electrical safety.
      </p>
    </div>
  );
}
