import { useEffect, useRef } from "react";
import type { Project } from "@/lib/domain/types";
import { partFullyConfirmed } from "@/lib/domain/dimensions";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { latestJob } from "@/lib/domain/job-timing";
import { JobProgress } from "./JobProgress";
import { Btn, ErrorNote } from "./ui";

export function AutomaticDimensions({ project }: { project: Project }) {
  const attempted = useRef(false);
  const missing = project.parts.filter(
    (p) =>
      p.identityAccepted && p.photoId && p.anchor && !partFullyConfirmed(p) && !p.dimensionEstimate,
  );
  const job = latestJob(project.jobs, "dimensions");
  const generate = useProjectAction(project.id, async (ad, operation: string) => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(operation));
    const stableId =
      "dimensions-" +
      Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, "0")).join("");
    return ad.estimateDimensions(
      project.id,
      missing.map((p) => p.id),
      stableId,
    );
  });
  const { mutate, isPending } = generate;
  const signature = missing
    .map((p) => p.id)
    .sort()
    .join("-");
  useEffect(() => {
    if (getAdapter().mode !== "http" || !signature || job || attempted.current || isPending) return;
    attempted.current = true;
    mutate([`dimensions-v1-${project.id}-${signature}`]);
  }, [signature, project.id, job, mutate, isPending]);
  if (getAdapter().mode !== "http") return null;
  return (
    <div className="mt-5 space-y-3">
      {job && (job.stage === "queued" || job.stage === "running" || job.stage === "failed") && (
        <JobProgress job={job} />
      )}
      <ErrorNote error={generate.error} />
      {missing.length > 0 &&
        (job || generate.error) &&
        job?.stage !== "queued" &&
        job?.stage !== "running" && (
          <Btn variant="outline" disabled={isPending} onClick={() => mutate([crypto.randomUUID()])}>
            Estimate remaining sizes from photos
          </Btn>
        )}
    </div>
  );
}
