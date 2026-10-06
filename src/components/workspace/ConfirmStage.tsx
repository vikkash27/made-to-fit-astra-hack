import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Search } from "lucide-react";
import type { EnclosureParams, Part, Project, Stage } from "@/lib/domain/types";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { parseDimensionInput, partFullyConfirmed } from "@/lib/domain/dimensions";
import { ViewerPanel } from "@/components/viewer/ViewerPanel";
import { Btn, ErrorNote, Label, SampleTag, StatusPill } from "./ui";

export const DEFAULT_PARAMS: EnclosureParams = { wall: 2, clearance: 1.5, lidThickness: 2, cornerRadius: 4 };
const AXES = [
  { k: "x", l: "Width X" },
  { k: "y", l: "Depth Y" },
  { k: "z", l: "Height Z" },
] as const;

export function ConfirmStage({ project, go }: { project: Project; go: (s: Stage) => void }) {
  const allOk = project.parts.length > 0 && project.parts.every(partFullyConfirmed);
  const draft = useProjectAction(project.id, (ad) => ad.createCandidate(project.id, null, DEFAULT_PARAMS, []));

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(520px,640px)_1fr]">
      <aside className="min-h-0 overflow-y-auto border-r border-border/60 px-6 py-8 lg:px-10">
        <Label>{project.goal ?? "Your project"} / Dimensions</Label>
        <h1 className="display-tight mt-5 text-[clamp(40px,4.2vw,64px)]">Confirm what fits.</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Source values are proposals until you accept them. Blank means unknown — never zero. Millimetres, X width · Y depth · Z height.
        </p>
        <div className="mt-8 space-y-4">
          {project.parts.map((p) => (
            <PartDims key={p.id} project={project} part={p} />
          ))}
          {project.parts.length === 0 && (
            <Btn variant="outline" onClick={() => go("parts")}>Add parts first</Btn>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3">
          <Btn variant="primary" className="h-11" disabled={!allOk || draft.isPending} onClick={() => draft.mutate([], { onSuccess: () => go("engineer") })}>
            Create enclosure draft <ArrowRight className="size-4" />
          </Btn>
          {!allOk && <span className="text-sm text-muted-foreground">Confirm every identity and dimension first.</span>}
        </div>
        <div className="mt-3">
          <ErrorNote error={draft.error} />
        </div>
      </aside>
      <div className="relative min-h-[420px]">
        <ViewerPanel parts={project.parts} params={allOk ? DEFAULT_PARAMS : null} provenance="Layout preview · dimensions pending · not CAD" compact />
      </div>
    </div>
  );
}

function PartDims({ project, part }: { project: Project; part: Part }) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(AXES.map((a) => [a.k, part.size[a.k].value == null ? "" : String(part.size[a.k].value)])),
  );
  const job = project.jobs.find((j) => j.kind === "evidence" && (j.stage === "queued" || j.stage === "running"));
  const evidence = useQuery({
    queryKey: ["evidence", project.id, part.id, project.draftVersion],
    queryFn: () => getAdapter().getEvidence(project.id, part.id),
  });
  const lookup = useProjectAction(project.id, (ad) => ad.lookupEvidence(project.id, part.id, part.identityAccepted ?? part.identityProposed ?? undefined));
  const confirm = useProjectAction(project.id, (ad, acceptAll: boolean) =>
    ad.confirmComponents(project.id, project.draftVersion, [
      {
        id: part.id,
        accept: acceptAll || undefined,
        size: Object.fromEntries(AXES.map((a) => [a.k, { value: parseDimensionInput(draft[a.k] ?? ""), accept: true }])),
      },
    ]),
  );

  const src = evidence.data?.sources[0];
  return (
    <div className="rounded-md border border-border bg-surface/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-[15px]">
            {part.label} {part.sample && <SampleTag />}
          </div>
          <div className="text-xs text-muted-foreground">
            {part.identityAccepted ? (
              <span className="text-success">Identity: {part.identityAccepted}</span>
            ) : (
              <>Proposed: {part.identityProposed ?? "unknown"} · <StatusPill status="proposed" /></>
            )}
          </div>
        </div>
        <Btn variant="outline" className="h-8 px-3 text-xs" onClick={() => lookup.mutate([])} disabled={!!job || lookup.isPending}>
          <Search className="size-3.5" /> {job ? `${job.label} · ${job.stage}` : "Look up specs"}
        </Btn>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {AXES.map((a) => {
          const f = part.size[a.k];
          return (
            <label key={a.k} className="text-xs text-muted-foreground">
              {a.l} · <StatusPill status={f.status} />
              <div className="mt-1 flex items-center rounded-sm border border-border bg-background focus-within:border-primary">
                <input
                  inputMode="decimal"
                  value={draft[a.k]}
                  onChange={(e) => setDraft({ ...draft, [a.k]: e.target.value })}
                  placeholder={f.status === "proposed" && f.value != null ? String(f.value) : "unknown"}
                  className="w-full bg-transparent px-2 py-1.5 font-mono text-sm text-foreground outline-none"
                  aria-label={`${part.label} ${a.l} in mm`}
                />
                <span className="pr-2 text-[10px]">mm</span>
              </div>
              {f.status === "proposed" && f.value != null && draft[a.k] !== String(f.value) && (
                <button className="mt-1 text-[11px] text-primary" onClick={() => setDraft({ ...draft, [a.k]: String(f.value) })}>
                  Use proposed {f.value}
                </button>
              )}
            </label>
          );
        })}
      </div>
      {src && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Source: <a href={src.url} target="_blank" rel="noreferrer" className="underline">{src.title}</a>
          {evidence.data?.sample && " (sample)"}
          {evidence.data?.missing.length ? ` · Missing: ${evidence.data.missing.join(", ").toUpperCase()}` : ""}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Btn variant="primary" className="h-8 px-3 text-xs" disabled={confirm.isPending} onClick={() => confirm.mutate([true])}>
          <Check className="size-3.5" /> Accept identity & values
        </Btn>
      </div>
      <div className="mt-2">
        <ErrorNote error={confirm.error ?? lookup.error} />
      </div>
    </div>
  );
}
