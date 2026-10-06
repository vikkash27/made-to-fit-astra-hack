import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdapter } from "@/lib/api";
import { ArrowRight, Plus } from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { ErrorNote, Label } from "@/components/workspace/ui";

export const Route = createFileRoute("/projects")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Projects — Made to Fit" },
      {
        name: "description",
        content: "Your Made to Fit projects: parts, concepts and enclosure revisions.",
      },
      { property: "og:title", content: "Projects — Made to Fit" },
      { property: "og:description", content: "Pick up where you left off." },
    ],
  }),
  component: Projects,
});

function Projects() {
  const q = useQuery({ queryKey: ["projects"], queryFn: () => getAdapter().listProjects() });
  return (
    <div className="theme-studio-light min-h-screen bg-white text-foreground">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="stage-heading">Your projects</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Pick up your parts review, enclosure design or assembly.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white"
          >
            <Plus className="size-4" />
            New project
          </Link>
        </div>
        {q.isPending && (
          <p role="status" className="mt-8 text-sm text-muted-foreground">
            Loading your projects…
          </p>
        )}
        <div className="mt-10 border-t border-border">
          {q.isError && <ErrorNote error={q.error} onRetry={() => q.refetch()} />}
          {q.data?.length === 0 && (
            <p className="py-8 text-muted-foreground">
              No projects yet.{" "}
              <Link to="/" className="text-primary underline">
                Start in the studio
              </Link>
              .
            </p>
          )}
          {q.data?.map((p) => (
            <Link
              key={p.id}
              to="/studio/$projectId"
              params={{ projectId: p.id }}
              className="flex flex-wrap items-center gap-4 border-b border-border px-3 py-5 hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <div className="text-lg">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.goal ?? "No goal yet"}</div>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs text-primary">
                {p.stage === "parts"
                  ? "Review parts"
                  : p.stage === "engineer"
                    ? "Build & check"
                    : p.stage === "export"
                      ? "Print & assemble"
                      : p.stage === "confirm"
                        ? "Measure parts"
                        : "Choose a project"}
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {new Date(p.createdAt).toLocaleDateString()}
                <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
