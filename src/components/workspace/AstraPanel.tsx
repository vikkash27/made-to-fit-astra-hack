import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message, MessageCard, Project } from "@/lib/domain/types";
import { errorMessage, projectKey, useProjectAction } from "@/lib/api/hooks";
import { parseDimensionInput } from "@/lib/domain/dimensions";
import { applyCheckedChange } from "@/lib/flows-revision";
import { useViewer } from "@/lib/store/viewer-store";
import { Composer } from "@/components/studio/Composer";
import { Btn, ErrorNote, SampleTag } from "./ui";

export function AstraPanel({ project, displayRevisionId }: { project: Project; displayRevisionId: string | null }) {
  const selectedId = useViewer((s) => s.selectedId);
  const end = useRef<HTMLDivElement>(null);
  const concept = project.concepts.find((c) => c.id === project.selectedConceptId);
  const rev = project.revisions.find((r) => r.id === displayRevisionId);
  const selPart = project.parts.find((p) => p.id === selectedId);
  const context = [
    selectedId && `selection:${selectedId}`,
    concept && `concept:${concept.id}`,
    rev && `revision:${rev.id}`,
    ...(rev?.locks ?? []).map((l) => `lock:${l}`),
  ].filter(Boolean) as string[];

  const send = useProjectAction(project.id, (ad, text: string) =>
    ad.agent(project.id, { text, parentRevisionId: project.acceptedRevisionId ?? rev?.id ?? null, context }),
  );
  const agentJob = project.jobs.find((j) => j.kind === "agent" && (j.stage === "queued" || j.stage === "running"));

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [project.messages.length, agentJob?.stage]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4" aria-live="polite">
        {project.messages.length === 0 && <p className="text-sm text-muted-foreground">Ask Astra to change the design. Select a part first to give it context.</p>}
        {project.messages.map((m) => (
          <MessageView key={m.id} m={m} project={project} />
        ))}
        {agentJob && (
          <div className="label-mono text-muted-foreground" role="status">
            {agentJob.label} · {agentJob.stage}
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selPart && <Chip>Selected · {selPart.label}</Chip>}
          {selectedId === "enclosure" && <Chip>Selected · Enclosure</Chip>}
          {concept && <Chip>Concept · {concept.formFactor}</Chip>}
          {rev && <Chip>{rev.label}</Chip>}
          {rev?.locks.map((l) => <Chip key={l}>Locked · {l}</Chip>)}
        </div>
        <Composer allowFiles={false} busy={send.isPending || !!agentJob} placeholder="Make it taller, thicker walls, battery accessible…" onSubmit={(v) => send.mutate([v.text])} />
        <ErrorNote error={send.error} />
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{children}</span>;
}

function MessageView({ m, project }: { m: Message; project: Project }) {
  const select = useViewer((s) => s.select);
  if (m.role === "user") {
    return (
      <div className="ml-8 rounded-md bg-foreground px-3 py-2 text-sm text-background">{m.text}</div>
    );
  }
  return (
    <div className="text-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="size-2 bg-primary" aria-hidden />
        <span className="font-mono text-xs">Astra</span>
        {m.sample && <SampleTag />}
      </div>
      <p className="leading-relaxed text-foreground/90">{m.text}</p>
      {m.refs?.filter((r) => r.startsWith("selection:")).map((r) => {
        const id = r.split(":")[1] ?? "";
        const part = project.parts.find((p) => p.id === id);
        return part ? (
          <button key={r} onClick={() => select(id)} className="mt-1 text-xs text-primary underline underline-offset-2">
            {part.label}
          </button>
        ) : null;
      })}
      {m.cards?.map((c, i) => <Card key={i} card={c} project={project} />)}
    </div>
  );
}

function Card({ card, project }: { card: MessageCard; project: Project }) {
  const select = useViewer((s) => s.select);
  const setViewer = useViewer((s) => s.set);
  const qc = useQueryClient();
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<unknown>(null);
  const measure = useProjectAction(project.id, (ad, partId: string, field: "x" | "y" | "z", v: number | null) =>
    ad.confirmComponents(project.id, project.draftVersion, [{ id: partId, size: { [field]: { value: v, accept: true } } }]),
  );

  if (card.type === "measurement") {
    const part = project.parts.find((p) => p.id === card.partId);
    const done = part && part.size[card.field].value != null;
    return (
      <form
        className="mt-2 rounded-md border border-border bg-surface p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = parseDimensionInput(val);
          if (n != null) measure.mutate([card.partId, card.field, n]);
        }}
      >
        <button type="button" onClick={() => select(card.partId)} className="text-xs text-primary">{part?.label ?? "Part"}</button>
        <p className="mt-1">{card.prompt}</p>
        {done ? (
          <p className="mt-2 text-xs text-success">Recorded: {part!.size[card.field].value} mm</p>
        ) : (
          <div className="mt-2 flex gap-2">
            <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" placeholder="mm" className="w-24 rounded-sm border border-border bg-background px-2 py-1 font-mono text-sm outline-none focus:border-primary" />
            <Btn variant="primary" className="h-8 px-3 text-xs" type="submit">Save measurement</Btn>
          </div>
        )}
        <ErrorNote error={measure.error} />
      </form>
    );
  }

  if (card.type === "identity") {
    return (
      <div className="mt-2 rounded-md border border-border bg-surface p-3">
        <p>Proposed identity: <b>{card.proposal}</b></p>
        <ul className="mt-1 text-xs text-muted-foreground">
          {card.sources.map((s) => (
            <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.title}</a></li>
          ))}
        </ul>
        <Btn variant="outline" className="mt-2 h-8 px-3 text-xs" onClick={() => select(card.partId)}>Review part</Btn>
      </div>
    );
  }

  if (card.type === "job") {
    const j = project.jobs.find((x) => x.id === card.jobId);
    return <div className="label-mono mt-2 text-muted-foreground">{j ? `${j.label} · ${j.stage}` : "Job"}</div>;
  }

  // change card
  const cand = project.revisions.find((r) => r.id === card.candidateId);
  const resolved = card.resolved ?? (cand?.kind === "accepted" ? "applied" : undefined);
  const apply = async () => {
    if (!cand) return;
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      const r = await applyCheckedChange(project.id, cand.id, project.acceptedRevisionId ?? cand.parentId);
      setNote(r.accepted ? "Checked and accepted." : r.reason);
      if (r.accepted) setViewer({ previewRevisionId: null });
    } catch (e) {
      setErr(e);
      setNote(errorMessage(e));
    } finally {
      setBusy(false);
      void qc.invalidateQueries({ queryKey: projectKey(project.id) });
    }
  };

  return (
    <div className="mt-2 rounded-md border border-border bg-surface p-3">
      <p className="text-xs text-muted-foreground">Proposed change</p>
      <table className="mt-1 w-full font-mono text-xs">
        <tbody>
          {card.diff.map((d) => (
            <tr key={d.field}>
              <td className="py-0.5 text-muted-foreground">{d.field}</td>
              <td>{d.from} mm</td>
              <td className="text-primary">→ {d.to} mm</td>
            </tr>
          ))}
        </tbody>
      </table>
      {card.preservedLocks.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Preserves locks: {card.preservedLocks.join(", ")}</p>}
      {cand?.checks.length ? (
        <p className="mt-1 text-xs">
          Checks: {cand.checks.map((c) => `${c.name} — ${c.status}`).join(" · ")}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Not yet built or checked.</p>
      )}
      {resolved ? (
        <p className="mt-2 text-xs text-success">{resolved === "applied" ? "Applied" : "Kept current design"}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn variant="outline" className="h-8 px-3 text-xs" onClick={() => setViewer({ previewRevisionId: cand?.id ?? null })} disabled={!cand}>
            Preview candidate
          </Btn>
          <Btn variant="primary" className="h-8 px-3 text-xs" onClick={apply} disabled={busy || !cand || cand.kind === "failed"}>
            {busy ? "Building & checking…" : "Apply checked change"}
          </Btn>
          <Btn className="h-8 px-3 text-xs" onClick={() => { setViewer({ previewRevisionId: null }); setNote("Kept current design."); }}>
            Keep current
          </Btn>
        </div>
      )}
      {note && !err && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
      <ErrorNote error={err} />
    </div>
  );
}
