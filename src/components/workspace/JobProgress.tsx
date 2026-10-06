import { useEffect, useState } from "react";
import { LoaderCircle, Check, AlertCircle } from "lucide-react";
import type { Job } from "@/lib/domain/types";
import { jobTiming, formatDuration } from "@/lib/domain/job-timing";

const kinds: Record<Job["kind"], string> = {
  reference: "3D model",
  cad_build: "CAD build",
  checks: "Geometry checks",
  photo_analysis: "Photo analysis",
  evidence: "Specification research",
  concepts: "Project ideas",
  agent: "Astra",
  wiring: "Wiring plan",
  dimensions: "Photo dimension estimates",
};
const stages: Record<string, string> = {
  queued: "Queued",
  submitting: "Submitting model request",
  waiting: "Waiting for model generation",
  generating: "Generating mesh",
  downloading: "Downloading model",
  planning: "Planning",
  building_cad: "Building native CAD",
  analyzing_photo: "Analyzing photo",
  researching_pinouts: "Reading pinout documentation",
  planning_connections: "Planning connections",
  researching_specifications: "Checking sources",
  extracting_specifications: "Reading dimensional evidence",
  estimating_dimensions: "Estimating likely sizes",
  proposing_concepts: "Developing ideas",
  ready: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
  unknown_submission: "Submission needs reconciliation",
};
export function JobProgress({ job, compact = false }: { job: Job; compact?: boolean }) {
  const [now, setNow] = useState(Date.now);
  const timing = jobTiming(job, now);
  useEffect(() => {
    if (!timing.active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [job.id, timing.active]);
  const Icon = timing.active ? LoaderCircle : job.stage === "succeeded" ? Check : AlertCircle;
  return (
    <div
      className={`${compact ? "text-xs" : "rounded-sm border border-border bg-background/95 p-3 text-sm"} ${job.error ? "text-destructive" : "text-muted-foreground"}`}
    >
      <div className="flex items-center gap-2" role={job.error ? "alert" : "status"}>
        <Icon
          className={`size-3.5 shrink-0 ${timing.active ? "animate-spin motion-reduce:animate-none" : ""}`}
          aria-hidden
        />
        <span>
          {kinds[job.kind]} · {stages[job.backendStage ?? ""] ?? job.label}
        </span>
      </div>
      <p className="mt-1 font-mono text-xs tabular-nums" aria-live="off">
        {timing.elapsed != null
          ? `${timing.active ? "Elapsed" : "Duration"} ${formatDuration(timing.elapsed)}`
          : "Timing unavailable"}
      </p>
      {job.error && <p className="mt-1 text-xs">{job.error}</p>}
    </div>
  );
}
