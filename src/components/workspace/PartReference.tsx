import { JobProgress } from "./JobProgress";
import { latestJob } from "@/lib/domain/job-timing";
import { lazy, Suspense, useState } from "react";
import type { Part, Project } from "@/lib/domain/types";
import { useProjectAction } from "@/lib/api/hooks";
import { getAdapter } from "@/lib/api";
import { Btn, ErrorNote } from "./ui";
const ReferenceViewer = lazy(() => import("@/components/viewer/ReferenceViewer"));

export function PartReference({ project, part }: { project: Project; part: Part }) {
  const [detail, setDetail] = useState<"standard" | "detailed">("detailed");
  const generate = useProjectAction(project.id, (ad) =>
    ad.generateReference(project.id, [part.id], crypto.randomUUID(), detail),
  );
  const asset = project.visualAssets?.find((a) => a.id === part.visualAssetId);
  const job = latestJob(project.jobs, "reference", part.id);
  const blocked =
    job &&
    (job.stage === "running" ||
      job.stage === "queued" ||
      job.backendStage === "unknown_submission");
  if (getAdapter().mode !== "http" || !part.photoId) return null;
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-sm">Component appearance · Rodin</p>
      <p className="my-2 text-xs text-muted-foreground">
        Uses this part’s photo crop. This paid mesh does not supply dimensions or certify fit.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          aria-label="Reference detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value as typeof detail)}
          className="rounded-sm border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="standard">Standard · 10,000 faces</option>
          <option value="detailed">Detailed · 20,000 faces</option>
        </select>
        <Btn
          variant="outline"
          disabled={generate.isPending || !!blocked || part.status !== "accepted"}
          onClick={() => generate.mutate([])}
        >
          {asset ? "Generate a new reference" : "Generate component reference"}
        </Btn>
      </div>
      {part.status !== "accepted" && (
        <p className="my-2 text-xs text-muted-foreground">
          Confirm this part and crop before generating.
        </p>
      )}
      <ErrorNote error={generate.error} />
      {job && <JobProgress job={job} />}
      {asset && (
        <Suspense fallback={<p className="text-sm">Loading reference viewer…</p>}>
          <ReferenceViewer asset={asset} />
        </Suspense>
      )}
    </div>
  );
}
