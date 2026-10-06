import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdapter } from "@/lib/api";
import { TopBar } from "@/components/shell/TopBar";
import { ErrorNote, Label } from "@/components/workspace/ui";

export const Route = createFileRoute("/projects")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Projects — Made to Fit" },
      { name: "description", content: "Your Made to Fit projects: parts, concepts and enclosure revisions." },
      { property: "og:title", content: "Projects — Made to Fit" },
      { property: "og:description", content: "Pick up where you left off." },
    ],
  }),
  component: Projects,
});

function Projects() {
  const q = useQuery({ queryKey: ["projects"], queryFn: () => getAdapter().listProjects() });
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <Label>Projects</Label>
        <h1 className="display-tight mt-5 text-6xl">Work in progress.</h1>
        <div className="mt-10 border-t border-border">
          {q.isError && <ErrorNote error={q.error} onRetry={() => q.refetch()} />}
          {q.data?.length === 0 && (
            <p className="py-8 text-muted-foreground">
              No projects yet. <Link to="/" className="text-primary underline">Start in the studio</Link>.
            </p>
          )}
          {q.data?.map((p) => (
            <Link
              key={p.id}
              to="/studio/$projectId"
              params={{ projectId: p.id }}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-8 border-b border-border py-5 hover:bg-surface/50"
            >
              <div>
                <div className="text-lg">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.goal ?? "No goal yet"}</div>
              </div>
              <span className="label-mono text-muted-foreground">{p.stage}</span>
              <span className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
