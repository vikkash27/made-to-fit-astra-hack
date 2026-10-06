import { checkLabel } from "./check-label";
import { JobProgress } from "./JobProgress";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Focus, Lock, Wrench } from "lucide-react";
import type { EnclosureParams, Project, Revision } from "@/lib/domain/types";
import { projectKey, useProjectAction } from "@/lib/api/hooks";
import { getAdapter } from "@/lib/api";
import { buildAndCheck } from "@/lib/flows-revision";
import { formatDim } from "@/lib/domain/dimensions";
import { useViewer } from "@/lib/store/viewer-store";
import { ViewerPanel } from "@/components/viewer/ViewerPanel";
import { AskAstra } from "./WorkspaceAssistant";
import { Btn, ErrorNote, Label, SampleTag, StatusPill } from "./ui";

export function displayRevision(p: Project, previewId: string | null): Revision | null {
  return (
    p.revisions.find((r) => r.id === previewId) ??
    p.revisions.find((r) => r.id === p.acceptedRevisionId) ??
    p.revisions[0] ??
    null
  );
}

export function EngineerStage({
  project,
  go,
}: {
  project: Project;
  go: (stage: "export") => void;
}) {
  const v = useViewer();
  const [tab, setTab] = useState<"inspect" | "checks">("checks");
  const rev = displayRevision(project, v.previewRevisionId);

  const provenance = rev
    ? `${rev.label} · ${rev.kind}${rev.sample ? " · preview geometry, not CAD" : !rev.assembly ? " · CAD not built yet" : " · native CAD"}${v.previewRevisionId ? " · previewing candidate" : ""}`
    : "No revision";

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="stage-heading">Build it. Check the fit.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inspect the actual CAD, review its checks, then accept the revision you want to print.
          </p>
        </div>
        <AskAstra prompt="Help me review this enclosure before accepting it" />
      </div>
      <RevisionStrip project={project} rev={rev} go={go} />
      <div className="design-layout mt-5 gap-6">
        <div className="viewer-frame overflow-hidden rounded-lg">
          <ViewerPanel
            parts={rev?.parts ?? project.parts}
            params={rev?.sample ? rev.params : null}
            revision={rev}
            visualAssets={project.visualAssets}
            provenance={provenance}
          />
        </div>
        <aside className="min-w-0">
          <div className="flex rounded-full bg-muted p-1" aria-label="Design information">
            {(["checks", "inspect"] as const).map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-10 flex-1 rounded-full text-sm font-medium ${tab === t ? "bg-white text-primary" : "text-muted-foreground"}`}
              >
                {t === "checks" ? "Fit checks" : "Part details"}
              </button>
            ))}
          </div>
          {tab === "checks" ? <Checks rev={rev} /> : <Inspect project={project} rev={rev} />}
          <Btn
            variant="outline"
            className="mt-3 w-full"
            onClick={() => {
              v.select("enclosure");
              setTab("inspect");
            }}
          >
            <Wrench className="size-4" />
            Adjust enclosure
          </Btn>
          <details className="mt-5 border-t border-border pt-4" open>
            <summary className="text-sm font-medium">Assembly & parts</summary>
            <PartsTree project={project} rev={rev} />
          </details>
        </aside>
      </div>
    </div>
  );
}

function PartsTree({ project, rev }: { project: Project; rev: Revision | null }) {
  const v = useViewer();
  const row = (id: string, label: string, sub?: string) => (
    <div
      key={id}
      className={`group flex items-center gap-1 rounded-sm px-2 py-1.5 ${v.selectedId === id ? "bg-accent" : "hover:bg-accent/60"}`}
    >
      <button onClick={() => v.select(id)} className="flex-1 truncate text-left text-sm">
        {label}
        {sub && <span className="ml-1.5 text-[11px] text-muted-foreground">{sub}</span>}
      </button>
      <button
        aria-label={`Isolate ${label}`}
        onClick={() => v.isolate(v.isolatedId === id ? null : id)}
        className="p-1 text-muted-foreground hover:text-foreground"
      >
        <Focus className="size-3.5" />
      </button>
      <button
        aria-label={`${v.hidden[id] ? "Show" : "Hide"} ${label}`}
        onClick={() => v.toggleHidden(id)}
        className="p-1 text-muted-foreground hover:text-foreground"
      >
        {v.hidden[id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
  return (
    <aside className="px-1 py-4">
      <Label className="mb-2 px-2">Assembly</Label>
      {rev?.assembly
        ? rev.assembly.parts
            .filter((p) => p.printable_output)
            .map((p) => row(p.part_id, p.name, "CAD"))
        : row("enclosure", "Enclosure", "not built")}
      <Label className="mb-2 mt-4 px-2">Parts</Label>
      {(rev?.parts ?? project.parts).map((p) =>
        row(p.id, p.label, p.status === "accepted" ? undefined : "proposed"),
      )}
    </aside>
  );
}

function Inspect({ project, rev }: { project: Project; rev: Revision | null }) {
  const sel = useViewer((s) => s.selectedId);
  const part = (rev?.parts ?? project.parts).find((p) => p.id === sel);
  const lock = useProjectAction(project.id, (ad, id: string) =>
    rev
      ? ad.createCandidate(
          project.id,
          rev.id,
          rev.params,
          Array.from(new Set([...rev.locks, `${id}:placement`])),
        )
      : Promise.reject(new Error("No revision")),
  );
  if (!sel)
    return (
      <p className="p-4 text-sm text-muted-foreground">Select a part in the canvas or tree.</p>
    );
  if (
    (sel === "enclosure" ||
      rev?.assembly?.parts.some((p) => p.part_id === sel && p.printable_output)) &&
    rev
  ) {
    return (
      <div className="space-y-2 p-4 text-sm">
        <h3 className="font-display text-lg font-semibold">Enclosure · {rev.label}</h3>
        {Object.entries(rev.params).map(([k, val]) => (
          <div key={k} className="flex justify-between border-t border-border py-1.5">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono">{val} mm</span>
          </div>
        ))}
        {rev.enclosureSize && <p className="font-mono">{rev.enclosureSize.join(" × ")} mm</p>}
        {!rev.sample && <EnclosureEditor key={rev.id} project={project} rev={rev} />}
        <p className="pt-2 text-xs text-muted-foreground">
          {rev.sample
            ? "Preview envelope computed in the browser — not the CAD solid."
            : "From backend revision."}
        </p>
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
      <p className="text-muted-foreground">
        {part.identityAccepted ?? `Proposed: ${part.identityProposed ?? "unknown"}`}
      </p>
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
      <Btn
        variant="outline"
        className="mt-2 h-8 px-3 text-xs"
        disabled={locked || lock.isPending || !rev || rev.id !== project.acceptedRevisionId}
        onClick={() => lock.mutate([part.id])}
      >
        <Lock className="size-3.5" />{" "}
        {locked ? "Placement locked" : "Lock placement (new candidate)"}
      </Btn>
      <ErrorNote error={lock.error} />
    </div>
  );
}

function Checks({ rev }: { rev: Revision | null }) {
  const passed = rev?.checks.filter((c) => c.status === "pass") ?? [];
  const outstanding = rev?.checks.filter((c) => c.status !== "pass") ?? [];
  const rows = (checks: Revision["checks"]) =>
    checks.map((c) => {
      const label = checkLabel(c);
      const parts = (c.partIds ?? [])
        .map(
          (id) =>
            rev?.parts?.find((p) => p.id === id)?.label ??
            ({ base: "Base", lid: "Lid" } as Record<string, string>)[id],
        )
        .filter(Boolean);
      return (
        <div key={c.id} className="border-t border-border pt-3">
          <div className="flex items-start justify-between gap-3">
            <button
              className="min-w-0 text-left font-medium hover:text-primary"
              onClick={() => useViewer.getState().select(c.partIds?.[0] ?? null)}
            >
              {label}
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {parts.join(" · ")}
              </span>
            </button>
            <StatusPill status={c.status} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {c.detail} {c.sample && "(sample)"}
          </p>
        </div>
      );
    });
  return (
    <div className="space-y-3 p-4 text-sm">
      {!rev || rev.checks.length === 0 ? (
        <p className="text-muted-foreground">No checks have run for this revision yet.</p>
      ) : (
        <>
          <p className="font-medium">
            {passed.length} geometry checks passed
            {outstanding.some((c) => c.status === "fail") ? " · changes needed" : ""}
          </p>
          {outstanding.length > 0 && <div className="space-y-3">{rows(outstanding)}</div>}
          {passed.length > 0 && (
            <details className="border-t border-border pt-3">
              <summary className="font-medium">View {passed.length} passed checks</summary>
              <div className="mt-3 space-y-3">{rows(passed)}</div>
            </details>
          )}
        </>
      )}
      <p className="rounded-sm border border-border p-2 text-xs text-muted-foreground">
        Coverage: the supported geometry checks listed above. General printability and printer
        settings remain unverified. Electrical, thermal, structural and firmware behaviour are not
        validated.
      </p>
    </div>
  );
}

function RevisionStrip({
  project,
  rev,
  go,
}: {
  project: Project;
  rev: Revision | null;
  go: (stage: "export") => void;
}) {
  const v = useViewer();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const activeJobs = project.jobs.filter(
    (j) =>
      (j.kind === "cad_build" || j.kind === "checks") &&
      (j.stage === "queued" || j.stage === "running"),
  );

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

  const canAccept =
    rev &&
    rev.kind === "candidate" &&
    rev.parentId === project.acceptedRevisionId &&
    (rev.sample
      ? rev.checks.length > 0 && !rev.checks.some((c) => c.status === "fail")
      : rev.eligible === true);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 p-4">
      <span className="text-sm font-medium">
        {rev?.kind === "accepted"
          ? "Accepted · ready for print files"
          : rev?.kind === "failed"
            ? "Checks failed · adjust the enclosure and try again"
            : rev?.checks.length
              ? "Review checks, then accept your design"
              : "Next: build the CAD and run fit checks"}
      </span>
      <details className="max-w-full">
        <summary className="text-xs text-muted-foreground">Revision history</summary>
        <div className="mt-3 flex max-w-full flex-wrap gap-2">
          {project.revisions.map((r) => (
            <button
              key={r.id}
              onClick={() =>
                v.set({ previewRevisionId: r.id === project.acceptedRevisionId ? null : r.id })
              }
              className={`shrink-0 rounded-sm border px-2.5 py-1 text-xs ${rev?.id === r.id ? "border-primary" : "border-border hover:border-muted-foreground"}`}
            >
              {r.label} · <StatusPill status={r.kind} />
            </button>
          ))}
        </div>
      </details>
      {rev?.id === project.acceptedRevisionId && rev?.kind === "accepted" && (
        <Btn variant="primary" onClick={() => go("export")}>
          Print & assemble →
        </Btn>
      )}
      {rev && rev.kind !== "accepted" && rev.kind !== "failed" && (
        <Btn
          variant="primary"
          disabled={busy || activeJobs.length > 0}
          onClick={() => run(() => buildAndCheck(rev.id))}
        >
          {busy ? "Working…" : rev.checks.length ? "Rebuild & check" : "Build & check"}
        </Btn>
      )}
      {canAccept && (
        <Btn
          variant="primary"
          className="min-h-11"
          disabled={busy || activeJobs.length > 0}
          onClick={() =>
            run(() =>
              getAdapter()
                .acceptRevision(
                  rev.id,
                  project.acceptedRevisionId ?? rev.parentId,
                  crypto.randomUUID(),
                )
                .then(() => v.set({ previewRevisionId: null })),
            )
          }
        >
          Accept {rev.label}
        </Btn>
      )}
      <div className="ml-auto flex items-center gap-3">
        {activeJobs.map((j) => (
          <JobProgress key={j.id} job={j} compact />
        ))}
      </div>
      {err != null && (
        <div className="w-full">
          <ErrorNote error={err} />
        </div>
      )}
    </div>
  );
}

function EnclosureEditor({ project, rev }: { project: Project; rev: Revision }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      Object.entries(rev.params)
        .filter(([k]) => k !== "cornerRadius")
        .map(([k, n]) => [k, String(n)]),
    ),
  );
  const create = useProjectAction(project.id, (ad) =>
    ad.createCandidate(
      project.id,
      project.acceptedRevisionId,
      {
        ...rev.params,
        ...Object.fromEntries(Object.entries(values).map(([k, n]) => [k, Number(n)])),
      } as EnclosureParams,
      rev.locks,
    ),
  );
  const locked: Record<string, string> = {
    width: "width_mm",
    depth: "depth_mm",
    height: "height_mm",
    wall: "wall_mm",
    baseThickness: "base_mm",
    lidThickness: "lid_mm",
    lidRegister: "lid_register_mm",
    lidFitClearance: "lid_fit_clearance_mm",
  };
  return (
    <form
      className="mt-6 border-t border-border pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate([], {
          onSuccess: (r) => useViewer.getState().set({ previewRevisionId: r.id }),
        });
      }}
    >
      <p className="mb-3 text-sm">Propose enclosure dimensions</p>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(values).map(([key, value]) => (
          <label key={key} className="text-xs text-muted-foreground">
            {key} · mm{rev.locks.includes(`enclosure:${locked[key]}`) ? " · locked" : ""}
            <input
              aria-label={`Enclosure ${key}`}
              type="number"
              min={key === "clearance" || key === "lidRegister" ? 0 : 0.01}
              step="any"
              value={value}
              disabled={rev.locks.includes(`enclosure:${locked[key]}`)}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 font-mono text-sm text-foreground disabled:opacity-60"
            />
          </label>
        ))}
      </div>
      <p className="my-3 text-xs text-muted-foreground">
        Target: Bambu P2S · 256 × 256 × 256 mm. Lid register sets locating lip depth; lid fit
        clearance sets its side gap. Test print the fit before use.
      </p>
      <p className="my-3 text-xs text-muted-foreground">
        Freezes a new candidate. Build and check it, then explicitly accept; your current design
        remains available.
      </p>
      <Btn
        variant="primary"
        type="submit"
        disabled={
          create.isPending ||
          Object.values(values).some((n) => n.trim() === "" || !Number.isFinite(Number(n)))
        }
      >
        Preview new candidate
      </Btn>
      <ErrorNote error={create.error} />
    </form>
  );
}
