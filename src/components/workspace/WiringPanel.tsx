import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Download, ScanLine } from "lucide-react";
import { getAdapter } from "@/lib/api";
import { useViewer } from "@/lib/store/viewer-store";
import type { Project, Revision } from "@/lib/domain/types";
import type { GuideProgressRecord, WiringState } from "@/lib/api/backend-types";
import { JobProgress } from "./JobProgress";
import { WiringDiagram } from "./WiringDiagram";
import { Btn, ErrorNote } from "./ui";

export function WiringPanel({
  revision,
  project,
  progress,
  saveProgress,
  savingProgress = false,
  onShowParts,
}: {
  revision: Revision;
  project?: Project;
  progress?: GuideProgressRecord;
  savingProgress?: boolean;
  saveProgress: (ids: string[], planId: string | null) => void;
  onShowParts?: () => void;
}) {
  const ad = getAdapter(),
    qc = useQueryClient();
  const [urls, setUrls] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [pinouts, setPinouts] = useState(false),
    [power, setPower] = useState(false);
  const [active, setActive] = useState(0);
  const job = useQuery({
    queryKey: ["wiring-job", jobId],
    enabled: !!jobId,
    queryFn: () => ad.getJob(jobId!),
    refetchInterval: (q) =>
      ["succeeded", "failed"].includes(q.state.data?.stage ?? "") ? false : 1500,
  });
  const running = !!jobId && (!job.data || ["queued", "running"].includes(job.data.stage));
  const state = useQuery({
    queryKey: ["wiring-plan", revision.id],
    queryFn: async () => {
      const s = await ad.getWiringPlan(revision.id);
      if (
        s.revision_id !== revision.id ||
        s.spec_hash !== revision.specHash ||
        (s.plan && (s.plan.revision_id !== revision.id || s.plan.spec_hash !== revision.specHash))
      )
        throw new Error("Wiring plan does not match the accepted design.");
      return s;
    },
    retry: false,
    refetchInterval: running ? 1500 : false,
  });
  useEffect(() => {
    if (job.data?.stage === "succeeded")
      qc.invalidateQueries({ queryKey: ["wiring-plan", revision.id] });
  }, [job.data?.stage, qc, revision.id]);
  const generate = useMutation({
    mutationFn: () => ad.generateWiringPlan(revision.id, urls.split(/\s+/).filter(Boolean)),
    onSuccess: (j) => {
      setChecked([]);
      setPinouts(false);
      setPower(false);
      setActive(0);
      setJobId(j.job_id);
      qc.invalidateQueries({ queryKey: ["project", project?.id] });
    },
  });
  const review = useMutation({
    mutationFn: () =>
      ad.reviewWiringPlan(revision.id, {
        plan_id: state.data!.plan!.id,
        plan_hash: state.data!.plan!.plan_hash,
        reviewed_connection_ids: checked,
        confirm_exact_modules_and_pinouts: pinouts,
        confirm_power_and_logic_levels: power,
      }),
    onSuccess: (s: WiringState) => {
      qc.setQueryData(["wiring-plan", revision.id], s);
      qc.invalidateQueries({ queryKey: ["guide-progress", revision.id] });
    },
  });
  const p = state.data?.plan;
  const names = Object.fromEntries((revision.parts ?? []).map((p) => [p.id, p.label]));
  const readable = (text: string) =>
    (p?.sources ?? []).reduce(
      (value, source, index) =>
        value.replace(
          new RegExp(
            `(?<![A-Za-z0-9_])${source.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_])`,
            "g",
          ),
          `document ${index + 1}`,
        ),
      text,
    );
  const c = p?.connections[Math.min(active, (p?.connections.length ?? 1) - 1)];
  const fullJob = project?.jobs.find((j) => j.id === jobId);
  const canReview =
    p?.status === "needs_review" &&
    p.connections.length > 0 &&
    !p.unresolved.length &&
    p.power_plan.trim() &&
    checked.length === p.connections.length &&
    pinouts &&
    power;
  const show = () => {
    if (c) {
      useViewer
        .getState()
        .set({ selectedId: c.start.part_id, isolatedId: null, hidden: {}, explode: 0.6 });
      useViewer.getState().fit();
      onShowParts?.();
    }
  };
  const stepId = p && c ? `wire:${p.id}:${c.id}` : null;
  const done = !!stepId && progress?.completed_step_ids.includes(stepId);
  return (
    <section aria-label="Wiring guide" className="mt-6 min-w-0">
      <h3 className="text-2xl font-medium">Connect the electronics</h3>
      <p className="mt-3 text-sm text-muted-foreground">
        Astra reads pinout documents for the exact modules in this design. Review its proposed
        connections and power levels before following the wire steps. Supported scope: low-voltage
        DC up to 24 V.
      </p>
      <details open={!p} className="mt-5 border-y border-border py-4">
        <summary className="cursor-pointer text-sm font-medium">
          {p ? "Research a replacement wiring plan" : "Find pinouts and plan connections"}
        </summary>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            generate.mutate();
          }}
        >
          <label className="block text-sm">
            Manufacturer documentation URLs{" "}
            <span className="text-muted-foreground">(optional)</span>
            <textarea
              className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={2}
              placeholder="One HTTPS pinout or module documentation URL per line. Leave blank to search."
            />
          </label>
          <Btn
            type="submit"
            variant="primary"
            disabled={running || generate.isPending || state.isPending}
          >
            {" "}
            {running ? "Researching connections…" : "Create wiring proposal"}{" "}
          </Btn>
          <p className="text-xs text-muted-foreground">
            Reads documentation for this design. Appearance models do not establish pinouts.
          </p>
        </form>
      </details>
      {running &&
        (fullJob ? (
          <JobProgress job={fullJob} />
        ) : (
          <p role="status" className="mt-4 text-sm">
            Researching pinouts and compatible connections…
          </p>
        ))}
      <ErrorNote
        error={
          generate.error ??
          review.error ??
          state.error ??
          (job.data?.error ? new Error(job.data.error.message) : null)
        }
      />
      {!p && !running && (
        <p className="mt-4 text-sm text-muted-foreground">
          No wiring plan is attached yet. If an exact identity or pinout is missing, the proposal
          will ask for it.
        </p>
      )}
      {p && (
        <div className="mt-5">
          <p className="text-sm font-medium">
            {p.status === "reviewed"
              ? "Source-backed plan · reviewed by you"
              : "Proposed plan · review required"}
          </p>
          <p className="mt-2 text-sm leading-relaxed">{readable(p.overview)}</p>
          {p.power_plan && (
            <p className="mt-3 text-sm">
              <strong>Power plan: </strong>
              {readable(p.power_plan)}
            </p>
          )}
          {p.unresolved.length > 0 && (
            <div className="my-4 rounded-lg bg-secondary p-4 text-sm">
              <p className="font-medium">Resolve before connecting</p>
              <ul className="mt-2 list-disc space-y-2 pl-4">
                {p.unresolved.map((u, i) => (
                  <li key={i}>{readable(u)}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 space-y-1" aria-label="Connections">
            {p.connections.map((wire, i) => (
              <div key={wire.id} className="flex items-center gap-3 border-b border-border py-3">
                {p.status === "needs_review" && (
                  <input
                    type="checkbox"
                    aria-label={`Reviewed ${wire.signal} connection`}
                    checked={checked.includes(wire.id)}
                    onChange={(e) =>
                      setChecked((ids) =>
                        e.target.checked ? [...ids, wire.id] : ids.filter((id) => id !== wire.id),
                      )
                    }
                  />
                )}
                <button
                  className={`min-w-0 flex-1 rounded-lg px-2 py-1 text-left text-sm ${i === active ? "bg-secondary" : "hover:bg-secondary/60"}`}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                >
                  <span className="font-medium">
                    {i + 1}. {wire.signal}
                  </span>
                  <span className="mt-1 block break-words text-xs text-muted-foreground">
                    {names[wire.start.part_id]} {wire.start.pin} → {names[wire.end.part_id]}{" "}
                    {wire.end.pin}
                  </span>
                </button>
              </div>
            ))}
          </div>
          {c && (
            <div aria-live="polite" className="mt-5">
              <WiringDiagram connection={c} names={names} />
              <p className="text-sm leading-relaxed">
                {p.status === "reviewed"
                  ? c.instruction
                  : "Review these pin labels and voltage levels against the sources below. Wire-by-wire directions unlock after review."}
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm">
                  Pinout evidence for this connection
                </summary>
                <ul className="mt-3 space-y-3 text-sm">
                  {c.evidence.map((e, i) => {
                    const s = p.sources.find((s) => s.id === e.source_id);
                    return (
                      <li key={i}>
                        <span className="font-medium">
                          {names[e.part_id]} · {e.location}
                        </span>
                        <blockquote className="my-2 border-l border-border pl-3 text-muted-foreground">
                          {e.quote}
                        </blockquote>
                        {s && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="break-words underline"
                          >
                            {s.title}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
              {p.status === "reviewed" && (
                <>
                  <p className="mt-4 text-sm">
                    <strong>Check: </strong>
                    {c.completion_check}
                  </p>
                  <label className="mt-4 flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={!!done}
                      disabled={!progress || savingProgress}
                      onChange={(e) => {
                        if (progress && stepId)
                          saveProgress(
                            e.target.checked
                              ? [...progress.completed_step_ids, stepId]
                              : progress.completed_step_ids.filter((i) => i !== stepId),
                            p.id,
                          );
                      }}
                    />
                    I completed this wire and its check
                  </label>
                </>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn onClick={show}>
                  <ScanLine className="size-4" />
                  Show component in 3D
                </Btn>
                <Btn disabled={active === 0} onClick={() => setActive((i) => i - 1)}>
                  <ArrowLeft className="size-4" />
                  Previous wire
                </Btn>
                <Btn
                  disabled={active === p.connections.length - 1}
                  onClick={() => setActive((i) => i + 1)}
                >
                  Next wire
                  <ArrowRight className="size-4" />
                </Btn>
              </div>
            </div>
          )}
          {p.status === "needs_review" && p.connections.length > 0 && (
            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={pinouts}
                  onChange={(e) => setPinouts(e.target.checked)}
                />
                I checked the exact module variants and each pin against their documentation.
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={power}
                  onChange={(e) => setPower(e.target.checked)}
                />
                I checked supply voltage, polarity and compatible logic levels.
              </label>
              <Btn
                variant="primary"
                disabled={!canReview || review.isPending}
                onClick={() => review.mutate()}
              >
                Use the reviewed wiring steps
              </Btn>
            </div>
          )}
          {savingProgress && (
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              Saving your wire check…
            </p>
          )}
          {p.status === "reviewed" &&
            p.artifacts
              .filter((a) => a.revision_id === revision.id && a.spec_hash === revision.specHash)
              .map((a) => (
                <a
                  key={a.id}
                  download={a.filename}
                  href={`${ad.resolveArtifactUrl(a.url)}?download=true`}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm"
                >
                  <Download className="size-4" />
                  Download wiring guide
                </a>
              ))}
          <details className="mt-5 border-t border-border pt-4">
            <summary className="cursor-pointer text-sm">Source documents</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {p.sources.map((source) => (
                <li key={source.id}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-words underline"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
          <p className="mt-4 text-xs text-muted-foreground">
            Pinout evidence and your review accompany this CAD revision. Circuit behavior, heat and
            physical assembly still need a bench test. Disconnect power while making connections.
          </p>
        </div>
      )}
    </section>
  );
}
