import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Focus, Lock } from "lucide-react";
import type { Project, Revision } from "@/lib/domain/types";
import { projectKey, useProjectAction } from "@/lib/api/hooks";
import { getAdapter } from "@/lib/api";
import { buildAndCheck } from "@/lib/flows-revision";
import { formatDim } from "@/lib/domain/dimensions";
import { useViewer } from "@/lib/store/viewer-store";
import { ViewerPanel } from "@/components/viewer/ViewerPanel";
import { AstraPanel } from "./AstraPanel";
import { Btn, ErrorNote, Label, SampleTag, StatusPill } from "./ui";

export function displayRevision(p: Project, previewId: string | null): Revision | null {
  return (
    p.revisions.find((r) => r.id === previewId) ??
    p.revisions.find((r) => r.id === p.acceptedRevisionId) ??
    p.revisions[0] ??
    null
  );
}

export function EngineerStage({ project }: { project: Project }) {
  const v = useViewer();
  const [tab, setTab] = useState<"astra" | "inspect" | "checks">("astra");
  const rev = displayRevision(project, v.previewRevisionId);

  const provenance = rev
    ? `${rev.label} · ${rev.kind}${rev.sample ? " · preview geometry, not CAD" : ""}${v.previewRevisionId ? " · previewing candidate" : ""}`
    : "No revision";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_1fr_380px]">
        <PartsTree project={project} />
        <div className="relative min-h-[460px] border-x border-border/60">
          <ViewerPanel parts={project.parts} params={rev?.params ?? null} provenance={provenance} />
        </div>
        <aside className="flex min-h-[460px] flex-col">
          <div role="tablist" className="flex border-b border-border">
            {(["astra", "inspect", "checks"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm capitalize ${tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "astra" ? "Astra" : t}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {tab === "astra" && <AstraPanel project={project} displayRevisionId={rev?.id ?? null} />}
            {tab === "inspect" && <Inspect project={project} rev={rev} />}
            {tab === "checks" && <Checks rev={rev} />}
          </div>
        </aside>
      </div>
      <RevisionStrip project={project} rev={rev} />
    </div>
  );
}

function PartsTree({ project }: { project: Project }) {
  const v = useViewer();
  const row = (id: string, label: string, sub?: string) => (
    <div key={id} className={`group flex items-center gap-1 rounded-sm px-2 py-1.5 ${v.selectedId === id ? "bg-accent" : "hover:bg-accent/60"}`}>
      <button onClick={() => v.select(id)} className="flex-1 truncate text-left text-sm">
        {label}
        {sub && <span className="ml-1.5 text-[11px] text-muted-foreground">{sub}</span>}
      </button>
      <button aria-label={`Isolate ${label}`} onClick={() => v.isolate(v.isolatedId === id ? null : id)} className="p-1 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 focus:opacity-100">
        <Focus className="size-3.5" />
      </button>
      <button aria-label={`${v.hidden[id] ? "Show" : "Hide"} ${label}`} onClick={() => v.toggleHidden(id)} className="p-1 text-muted-foreground hover:text-foreground">
        {v.hidden[id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
  return (
    <aside className="min-h-0 overflow-y-auto px-3 py-4">
      <Label className="mb-2 px-2">Assembly</Label>
      {row("enclosure", "Enclosure", "preview")}
      <Label className="mb-2 mt-4 px-2">Parts</Label>
      {project.parts.map((p) => row(p.id, p.label, p.status === "accepted" ? undefined : "proposed"))}
    </aside>
  );
}

function Inspect({ project, rev }: { project: Project; rev: Revision | null }) {
  const sel = useViewer((s) => s.selectedId);
  const part = project.parts.find((p) => p.id === sel);
  const lock = useProjectAction(project.id, (ad, id: string) =>
    rev ? ad.createCandidate(project.id, rev.id, rev.params, Array.from(new Set([...rev.locks, `${id}:placement`]))) : Promise.reject(new Error("No revision")),
  );
  if (!sel) return <p className="p-4 text-sm text-muted-foreground">Select a part in the canvas or tree.</p>;
  if (sel === "enclosure" && rev) {
    return (
      <div className="space-y-2 p-4 text-sm">
        <h3 className="font-display text-lg font-semibold">Enclosure · {rev.label}</h3>
        {Object.entries(rev.params).map(([k, val]) => (
          <div key={k} className="flex justify-between border-t border-border py-1.5">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono">{val} mm</span>
          </div>
        ))}
        <p className="pt-2 text-xs text-muted-foreground">{rev.sample ? "Preview envelope computed in the browser — not the CAD solid." : "From backend revision."}</p>
      </div>
    );
  }
  if (!part) return null;
  const locked = rev?.locks.includes(`${part.id}:placement`);
  return (
    <div className="space-y-2 p-4 text-sm">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
        {part.label} {part.sample && <SampleTag />}
      </h3>
      <p className="text-muted-foreground">{part.identityAccepted ?? `Proposed: ${part.identityProposed ?? "unknown"}`}</p>
      {(["x", "y", "z"] as const).map((k) => (
        <div key={k} className="flex justify-between border-t border-border py-1.5">
          <span className="text-muted-foreground">Size {k.toUpperCase()}</span>
          <span className="font-mono">
            {formatDim(part.size[k])} mm <StatusPill status={part.size[k].status} />
          </span>
        </div>
      ))}
      <div className="flex justify-between border-t border-border py-1.5">
        <span className="text-muted-foreground">Placement</span>
        <span className="font-mono">{part.pose.join(", ")} mm</span>
      </div>
      <Btn variant="outline" className="mt-2 h-8 px-3 text-xs" disabled={locked || lock.isPending || !rev} onClick={() => lock.mutate([part.id])}>
        <Lock className="size-3.5" /> {locked ? "Placement locked" : "Lock placement (new candidate)"}
      </Btn>
      <ErrorNote error={lock.error} />
    </div>
  );
}

function Checks({ rev }: { rev: Revision | null }) {
  return (
    <div className="space-y-3 p-4 text-sm">
      {!rev || rev.checks.length === 0 ? (
        <p className="text-muted-foreground">No checks have run for this revision yet.</p>
      ) : (
        rev.checks.map((c) => (
          <div key={c.id} className="border-t border-border pt-2">
            <div className="flex items-center justify-between">
              <span>{c.name}</span>
              <StatusPill status={c.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {c.scope} · {c.detail} {c.sample && "(sample)"}
            </p>
          </div>
        ))
      )}
      <p className="rounded-sm border border-border p-2 text-xs text-muted-foreground">
        Coverage: mechanical fit and printability only. Electrical, thermal, structural and firmware behaviour are not validated.
      </p>
    </div>
  );
}

function RevisionStrip({ project, rev }: { project: Project; rev: Revision | null }) {
  const v = useViewer();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const activeJobs = project.jobs.filter((j) => j.stage === "queued" || j.stage === "running");

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
      void qc.invalidateQueries({ queryKey: projectKey(project.id) });
    }
  };

  const canAccept = rev && rev.kind !== "accepted" && rev.kind !== "failed" && rev.checks.length > 0 && !rev.checks.some((c) => c.status === "fail");

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border/70 px-4 py-2.5">
      <Label>Revisions</Label>
      <div className="flex gap-1.5 overflow-x-auto">
        {project.revisions.map((r) => (
          <button
            key={r.id}
            onClick={() => v.set({ previewRevisionId: r.id === project.acceptedRevisionId ? null : r.id })}
            className={`shrink-0 rounded-sm border px-2.5 py-1 text-xs ${rev?.id === r.id ? "border-primary" : "border-border hover:border-muted-foreground"}`}
          >
            {r.label} · <StatusPill status={r.kind} />
          </button>
        ))}
      </div>
      {rev && rev.kind !== "accepted" && rev.kind !== "failed" && (
        <Btn variant="outline" className="h-8 px-3 text-xs" disabled={busy} onClick={() => run(() => buildAndCheck(rev.id))}>
          {busy ? "Working…" : rev.checks.length ? "Rebuild & check" : "Build & check"}
        </Btn>
      )}
      {canAccept && (
        <Btn
          variant="primary"
          className="h-8 px-3 text-xs"
          disabled={busy}
          onClick={() => run(() => getAdapter().acceptRevision(rev.id, project.acceptedRevisionId ?? rev.parentId, crypto.randomUUID()).then(() => v.set({ previewRevisionId: null })))}
        >
          Accept {rev.label}
        </Btn>
      )}
      <div className="ml-auto flex items-center gap-3">
        {activeJobs.map((j) => (
          <span key={j.id} className="label-mono text-muted-foreground" role="status">
            {j.label} · {j.stage}
          </span>
        ))}
        {project.jobs.find((j) => j.stage === "failed") && <span className="text-xs text-destructive">A job failed</span>}
      </div>
      {err != null && (
        <div className="w-full">
          <ErrorNote error={err} />
        </div>
      )}
    </div>
  );
}
