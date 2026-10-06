import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import type { Artifact, Project } from "@/lib/domain/types";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { acceptedRevision } from "@/lib/domain/exports";
import { Btn, ErrorNote, Label, SampleTag } from "./ui";

const ROWS: { kind: Artifact["kind"]; title: string; desc: string }[] = [
  { kind: "step", title: "Printable CAD · STEP", desc: "Parametric geometry for CAD tools." },
  { kind: "stl", title: "Printable CAD · STL", desc: "Mesh for slicers. Units: mm." },
  { kind: "record", title: "Design record", desc: "Specifications, recipe, checks and sources." },
  { kind: "glb", title: "Visual references · GLB", desc: "Separate appearance models. Not fit geometry." },
];

export function ExportStage({ project }: { project: Project }) {
  const rev = acceptedRevision(project);
  const ad = getAdapter();
  const exports = useQuery({
    queryKey: ["exports", rev?.id],
    queryFn: () => ad.getExports(rev!.id),
    enabled: !!rev && !rev.sample,
  });
  const ref = useProjectAction(project.id, (a) => a.generateReference(project.id, project.parts.map((p) => p.id), crypto.randomUUID()));
  const artifacts = exports.data ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Label>Export</Label>
      <h1 className="display-tight mt-5 text-6xl">Take it to the printer.</h1>
      <p className="mt-4 text-muted-foreground">
        {rev ? (
          <>
            Exports correspond to the accepted revision <b className="text-foreground">{rev.label}</b>. {rev.sample && <><SampleTag /> This revision is preview-only — no CAD files exist.</>}
          </>
        ) : (
          "No accepted revision yet. Build, check and accept a design first."
        )}
      </p>
      <div className="mt-8 divide-y divide-border border-y border-border">
        {ROWS.map((r) => {
          const a = artifacts.find((x) => x.kind === r.kind);
          return (
            <div key={r.kind} className="flex items-center justify-between gap-4 py-4">
              <div>
                <div className="text-[15px]">{r.title}</div>
                <div className="text-sm text-muted-foreground">{r.desc}</div>
              </div>
              {a ? (
                <a href={ad.resolveArtifactUrl(a.url)} download={a.name} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
                  <Download className="size-4" /> {a.name}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">{exports.isLoading ? "Checking…" : "Not available"}</span>
              )}
            </div>
          );
        })}
      </div>
      <ErrorNote error={exports.error} onRetry={() => exports.refetch()} />
      <div className="mt-10">
        <Label className="mb-2">Reference models (paid, optional)</Label>
        <p className="mb-3 text-sm text-muted-foreground">Generates appearance meshes for your parts. Calibrated to confirmed dimensions; never used as fit geometry.</p>
        <Btn variant="outline" onClick={() => ref.mutate([])} disabled={ref.isPending}>Generate references</Btn>
        <div className="mt-3">
          <ErrorNote error={ref.error} />
        </div>
      </div>
    </div>
  );
}
