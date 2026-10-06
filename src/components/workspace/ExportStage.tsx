import { JobProgress } from "./JobProgress";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import type { Artifact, Project } from "@/lib/domain/types";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { AskAstra } from "./WorkspaceAssistant";
import { checkLabel } from "./check-label";
import { acceptedRevision } from "@/lib/domain/exports";
import { ReferenceReview } from "./ReferenceReview";
import { ViewerPanel } from "@/components/viewer/ViewerPanel";
import { Btn, ErrorNote, Label, SampleTag } from "./ui";
import { BuildGuide } from "./BuildGuide";

export function ExportStage({ project }: { project: Project }) {
  const rev = acceptedRevision(project),
    ad = getAdapter();
  const [selected, setSelected] = useState(project.parts.find((p) => p.photoId)?.id ?? "");
  const [resource, setResource] = useState<"print" | "assemble">("print");
  const viewerRef = useRef<HTMLDivElement>(null);
  const exports = useQuery({
    queryKey: ["exports", rev?.id],
    queryFn: () => ad.getExports(rev!.id),
    enabled: !!rev && !rev.sample,
  });
  const reference = useProjectAction(project.id, (a) =>
    a.generateReference(project.id, [selected], crypto.randomUUID()),
  );
  const artifacts = exports.data ?? [];
  const safe = artifacts.filter(
    (a) => !rev?.sample && a.revisionId === rev?.id && a.specHash === rev?.specHash,
  );
  const plates = safe.filter((a) => a.kind === "3mf");
  const printable = safe.filter((a) => a.kind === "step" || a.kind === "stl");
  const records = safe.filter((a) => a.kind === "record" && a.role !== "build_guide");
  const guides = safe.filter((a) => a.role === "build_guide");
  const visual = safe.filter((a) => a.kind === "glb");
  const rows = (files: Artifact[]) =>
    files.length ? (
      files.map((a) => (
        <div
          key={a.id}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"
        >
          <div>
            <p>{a.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {a.bytes ? `${(a.bytes / 1024).toFixed(1)} KiB` : ""} · {a.sha256?.slice(0, 12)}
            </p>
          </div>
          <a
            href={`${ad.resolveArtifactUrl(a.url)}?download=true`}
            download={a.name}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <Download className="size-4" /> Download {a.name}
          </a>
        </div>
      ))
    ) : (
      <p className="py-3 text-sm text-muted-foreground">
        {exports.isLoading ? "Checking artifacts…" : "No files available."}
      </p>
    );
  return (
    <div
      className={`grid grid-cols-1 gap-8 p-4 sm:p-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] `}
    >
      <div ref={viewerRef} className="viewer-frame overflow-hidden rounded-lg">
        <ViewerPanel
          parts={rev?.parts ?? project.parts}
          params={rev?.sample ? rev.params : null}
          revision={rev}
          visualAssets={project.visualAssets}
          provenance={
            rev
              ? `${rev.label} · accepted${rev.sample ? " · sample" : " · native CAD"}`
              : "No accepted revision"
          }
        />
      </div>
      <div className="min-w-0">
        <h1 className="stage-heading">
          {resource === "assemble" ? "Bring it to life." : "Take it to the printer."}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {rev ? (
            <>
              Files belong to accepted revision <b>{rev.label}</b>.{" "}
              {rev.sample && (
                <>
                  <SampleTag /> No CAD files exist for this preview.
                </>
              )}
            </>
          ) : (
            "Build, check and accept a design to unlock its exports."
          )}
        </p>
        {
          <nav aria-label="Build resources" className="mt-5 flex flex-wrap gap-2">
            <Btn
              variant={resource === "print" ? "primary" : "outline"}
              aria-pressed={resource === "print"}
              onClick={() => setResource("print")}
            >
              Print files
            </Btn>
            <Btn
              variant={resource === "assemble" ? "primary" : "outline"}
              aria-pressed={resource === "assemble"}
              onClick={() => setResource("assemble")}
            >
              Assembly guide
            </Btn>
          </nav>
        }
        <div className="mt-4">
          <AskAstra prompt="Explain how to print and assemble this accepted enclosure" />
        </div>
        {resource === "print" && (
          <>
            <section className="mt-8">
              <Label>Bambu P2S · print plates</Label>
              <p className="my-3 text-sm text-muted-foreground">
                Open a 3MF in Bambu Studio as geometry. Choose P2S, your nozzle and filament, then
                slice. The base and lid are separate objects placed flat on the bed. Individual
                plates are available when you want to print them separately.
              </p>
              {rows(plates)}
              {!plates.length && rev && !rev.sample && (
                <p className="text-xs text-muted-foreground">
                  Build and accept a new P2S revision to generate print plates.
                </p>
              )}
            </section>
            <section className="mt-8">
              <Label>Printable CAD · millimetres</Label>
              {rows(printable)}
            </section>
            <details className="mt-6">
              <summary className="text-sm font-medium">Design records & checks</summary>
              <div className="mt-3">{rows(records)}</div>
            </details>
          </>
        )}
        {resource === "assemble" && (
          <section className="mt-8 border-t border-border pt-5">
            <h2 className="text-2xl font-medium">Put it together.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your parts list, print preparation and mechanical assembly steps travel with the
              accepted design. Wiring and firmware need their own verified plan.
            </p>
            {guides.length > 0 && rows(guides)}
            {rev ? (
              <BuildGuide
                key={rev.id}
                revision={rev}
                project={project}
                onShowParts={() => {
                  if (window.matchMedia("(max-width: 1023px)").matches)
                    viewerRef.current?.scrollIntoView({ block: "start" });
                }}
              />
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Accept a checked design to open its assembly guide.
              </p>
            )}
          </section>
        )}
        <details className="mt-6">
          <summary className="text-sm font-medium">Visual references · optional</summary>
          <div className="mt-3">
            <Label>Visual references · appearance only</Label>
            {rows(visual)}
          </div>
        </details>
        <ErrorNote error={exports.error} onRetry={() => exports.refetch()} />
        {rev && (
          <details className="mt-8 border-t border-border pt-4">
            <summary className="text-sm font-medium">
              Check coverage · {rev.checks.filter((c) => c.status === "pass").length} passed
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {rev.checks.map((c) => (
                <li key={c.id}>
                  {checkLabel(c)} · {c.status}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Electrical, thermal, strength, closure and slicer validation remain outside these
              geometry checks.
            </p>
          </details>
        )}
        <details className="mt-8 border-t border-border pt-4">
          <summary className="text-sm font-medium">3D appearance & alignment</summary>
          <div className="mt-4">
            <Label>Create component 3D models</Label>
            <p className="my-3 text-sm text-muted-foreground">
              Choose one reviewed photo crop. Existing jobs and references stay attached to the
              component.
            </p>
            <select
              aria-label="Reference component"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="mb-3 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a photographed part</option>
              {project.parts
                .filter((p) => p.photoId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
            </select>
            <Btn
              variant="outline"
              disabled={
                !selected ||
                reference.isPending ||
                project.jobs.some(
                  (j) =>
                    j.kind === "reference" &&
                    j.partId === selected &&
                    (j.stage === "running" ||
                      j.stage === "queued" ||
                      j.backendStage === "unknown_submission"),
                )
              }
              onClick={() => reference.mutate([])}
            >
              Generate this component reference
            </Btn>
            <ErrorNote error={reference.error} />
            {project.jobs
              .filter((j) => j.kind === "reference")
              .map((j) => (
                <div key={j.id} className="mt-2">
                  <JobProgress job={j} />
                </div>
              ))}
            {project.visualAssets?.map((a) => (
              <ReferenceReview
                key={a.id}
                asset={a}
                projectId={project.id}
                part={project.parts.find((p) => p.id === a.part_id)}
              />
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
