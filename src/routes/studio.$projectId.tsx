import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import type { Project, Stage } from "@/lib/domain/types";
import { useProject } from "@/lib/api/hooks";
import { partFullyConfirmed } from "@/lib/domain/dimensions";
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

function available(p: Project, s: Stage) {
  switch (s) {
    case "parts":
      return true;
    case "discover":
      return p.parts.length > 0;
    case "confirm":
      return p.parts.length > 0 && !!p.goal;
    case "engineer":
      return p.revisions.length > 0;
    case "export":
      return p.revisions.length > 0;
  }
}

const LABEL: Record<Stage, string> = {
  parts: "Parts",
  discover: "Explore",
  confirm: "Dimensions",
  engineer: "Design",
  export: "Print & assemble",
};

function Studio() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const q = useProject(projectId);
  const resetViewer = useViewer((s) => s.set);

  useEffect(() => {
    resetViewer({ selectedId: null, isolatedId: null, previewRevisionId: null, hidden: {} });
  }, [projectId, resetViewer]);

  const go = (stage: Stage) =>
    navigate({ to: "/studio/$projectId", params: { projectId }, search: { stage } });

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
  const stage = search.stage && available(p, search.stage) ? search.stage : inferStage(p);
  const confirmedCount = p.parts.filter(partFullyConfirmed).length;

  return (
    <Shell>
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border/60 px-6 py-2.5 lg:px-9">
        <span className="max-w-[240px] truncate text-sm text-muted-foreground">{p.name}</span>
        <nav aria-label="Project stages" className="flex max-w-full gap-1 overflow-x-auto">
          {STAGES.map((s, i) => {
            const ok = available(p, s);
            return (
              <button
                key={s}
                disabled={!ok}
                onClick={() => go(s)}
                aria-current={stage === s ? "step" : undefined}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-[13px] transition-colors disabled:opacity-35 ${stage === s ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className={`font-mono text-[11px] ${stage === s ? "text-primary" : ""}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {LABEL[s]}
              </button>
            );
          })}
        </nav>
        <span className="ml-auto hidden text-xs text-muted-foreground md:block">
          {confirmedCount}/{p.parts.length} parts confirmed · draft v{p.draftVersion}
        </span>
        {stage === "engineer" && (
          <Btn variant="outline" className="h-8 px-3 text-xs" onClick={() => go("export")}>
            Print & assemble
          </Btn>
        )}
      </div>
      {stage === "parts" && <PartsStage project={p} startAdding={!!search.add} go={go} />}
      {stage === "discover" && <DiscoverStage project={p} go={go} />}
      {stage === "confirm" && <ConfirmStage project={p} go={go} />}
      {stage === "engineer" && <EngineerStage project={p} />}
      {stage === "export" && <ExportStage project={p} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-studio-light flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  );
}
