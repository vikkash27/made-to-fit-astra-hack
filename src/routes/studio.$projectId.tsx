import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Project, Stage } from "@/lib/domain/types";
import { useProject } from "@/lib/api/hooks";
import { buildParts } from "@/lib/domain/build-parts";
import { partFullyConfirmed } from "@/lib/domain/dimensions";
import { stageAccess, STAGE_LABELS } from "@/lib/domain/stage-access";
import { AutomaticReferences } from "@/components/workspace/AutomaticReferences";
import { WorkspaceAssistant } from "@/components/workspace/WorkspaceAssistant";
import { JobProgress } from "@/components/workspace/JobProgress";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { useViewer } from "@/lib/store/viewer-store";
import { TopBar } from "@/components/shell/TopBar";
import { PartsStage } from "@/components/workspace/PartsStage";
import { DiscoverStage } from "@/components/workspace/DiscoverStage";
import { ConfirmStage } from "@/components/workspace/ConfirmStage";
import { EngineerStage } from "@/components/workspace/EngineerStage";
import { ExportStage } from "@/components/workspace/ExportStage";
import { Btn, ErrorNote } from "@/components/workspace/ui";

const STAGES: Stage[] = ["parts", "discover", "confirm", "engineer", "export"];

export const Route = createFileRoute("/studio/$projectId")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { stage?: Stage; add?: number } => ({
    stage: STAGES.includes(s["stage"] as Stage) ? (s["stage"] as Stage) : undefined,
    add: s["add"] ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Studio — Made to Fit" },
      {
        name: "description",
        content: "Review parts, explore concepts, confirm dimensions and develop your enclosure.",
      },
      { property: "og:title", content: "Studio — Made to Fit" },
      { property: "og:description", content: "Your Made to Fit project workspace." },
    ],
  }),
  component: Studio,
});

function inferStage(p: Project): Stage {
  if (p.acceptedRevisionId) return "engineer";
  if (p.revisions.length) return "engineer";
  if (p.goal && p.parts.length && (p.selectedConceptId || p.intentMode === "idea"))
    return p.selectedConceptId ? "confirm" : "parts";
  if (p.concepts.length) return "discover";
  return "parts";
}

function Studio() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const q = useProject(projectId);
  const [blocked, setBlocked] = useState<{ reason: string; resolve: Stage } | null>(null);
  const resetViewer = useViewer((s) => s.set);

  useEffect(() => {
    resetViewer({ selectedId: null, isolatedId: null, previewRevisionId: null, hidden: {} });
  }, [projectId, resetViewer]);

  const go = (stage: Stage) => {
    setBlocked(null);
    void navigate({ to: "/studio/$projectId", params: { projectId }, search: { stage } });
  };

  if (q.isPending)
    return (
      <Shell>
        <div className="label-mono grid flex-1 place-items-center text-muted-foreground">
          Loading project…
        </div>
      </Shell>
    );
  if (q.isError)
    return (
      <Shell>
        <div className="mx-auto mt-20 max-w-md space-y-4">
          <ErrorNote error={q.error} onRetry={() => q.refetch()} />
          <Link to="/" className="text-sm underline">
            Back to studio
          </Link>
        </div>
      </Shell>
    );

  const p = q.data;
  const stage = search.stage && stageAccess(p, search.stage).allowed ? search.stage : inferStage(p);
  const done: Record<Stage, boolean> = {
    parts: p.parts.length > 0 && p.parts.every((part) => !!part.identityAccepted),
    discover: !!p.goal,
    confirm:
      p.parts.length > 0 &&
      p.parts
        .filter(
          (part) =>
            !p.selectedConceptId ||
            p.concepts.find((c) => c.id === p.selectedConceptId)?.partsUsed.includes(part.id),
        )
        .every(partFullyConfirmed),
    engineer: !!p.acceptedRevisionId,
    export: false,
  };
  const usedParts = buildParts(p);
  const confirmedCount = usedParts.filter(partFullyConfirmed).length;

  return (
    <Shell>
      <div className="shrink-0 px-4 pt-3 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-full truncate text-sm font-semibold">{p.name}</p>
          <span className="text-xs text-muted-foreground">
            {confirmedCount}/{usedParts.length} {p.selectedConceptId ? "used " : ""}parts measured ·
            draft {p.draftVersion}
          </span>
        </div>
        <nav aria-label="Project stages" className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {STAGES.map((s, i) => {
            const access = stageAccess(p, s);
            const active = stage === s;
            return (
              <button
                key={s}
                onClick={() => {
                  if (!access.allowed)
                    setBlocked({ reason: access.reason!, resolve: access.resolve! });
                  else go(s);
                }}
                aria-current={active ? "step" : undefined}
                title={access.reason}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors ${active ? "bg-accent font-semibold text-primary" : access.allowed ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted"}`}
              >
                <span
                  className={`grid size-6 place-items-center rounded-full text-xs ${active ? "bg-primary text-white" : "bg-muted"}`}
                >
                  {!access.allowed ? (
                    <LockKeyhole className="size-3" />
                  ) : done[s] && !active ? (
                    <Check className="size-3" />
                  ) : (
                    i + 1
                  )}
                </span>
                {STAGE_LABELS[s]}
              </button>
            );
          })}
        </nav>
      </div>
      <WorkspaceAssistant key={p.id} project={p} stage={stage}>
        {(blocked || (search.stage && !stageAccess(p, search.stage).allowed)) && (
          <div
            role="status"
            className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-warning/10 p-4 sm:mx-8"
          >
            <p className="text-sm">{blocked?.reason ?? stageAccess(p, search.stage!).reason}</p>
            <Btn
              variant="outline"
              onClick={() => go(blocked?.resolve ?? stageAccess(p, search.stage!).resolve!)}
            >
              {STAGE_LABELS[blocked?.resolve ?? stageAccess(p, search.stage!).resolve!]}
              <ArrowRight className="size-4" />
            </Btn>
          </div>
        )}
        <AutomaticReferences project={p} />
        <StageContent project={p} stage={stage} startAdding={!!search.add} go={go} />
        {p.jobs.length > 0 && (
          <details className="mx-4 mb-6 border-t border-border pt-4 sm:mx-8">
            <summary className="text-sm text-muted-foreground">
              Task history · {p.jobs.length} operations
            </summary>
            <div className="mt-4 space-y-4">
              {[...p.jobs]
                .sort((a, b) => b.startedAt - a.startedAt)
                .map((j) => (
                  <JobProgress key={j.id} job={j} compact />
                ))}
            </div>
          </details>
        )}
      </WorkspaceAssistant>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-studio-light flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Keep visited steps mounted so unsaved inputs and assistant context survive navigation. */
function StageContent({
  project,
  stage,
  startAdding,
  go,
}: {
  project: Project;
  stage: Stage;
  startAdding: boolean;
  go: (s: Stage) => void;
}) {
  const [visited, setVisited] = useState<Stage[]>([stage]);
  useEffect(() => {
    setVisited((previous) => (previous.includes(stage) ? previous : [...previous, stage]));
  }, [stage]);
  return [...new Set([...visited, stage])].map((s) => (
    <div key={s} hidden={s !== stage}>
      {s === "parts" && <PartsStage project={project} startAdding={startAdding} go={go} />}
      {s === "discover" && <DiscoverStage project={project} go={go} />}
      {s === "confirm" && <ConfirmStage project={project} go={go} />}
      {s === "engineer" && <EngineerStage project={project} go={go} />}
      {s === "export" && <ExportStage project={project} />}
    </div>
  ));
}
