import type { Job } from "./types";

export function formatDuration(seconds: number): string {
  const rounded = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : minutes
      ? `${minutes}m ${remainder}s`
      : `${remainder}s`;
}
export function jobTiming(job: Job, now: number) {
  const active = job.stage === "queued" || job.stage === "running";
  const end = active ? now : job.finishedAt;
  const elapsed =
    job.startedAt > 0 && end && Number.isFinite(end)
      ? Math.max(0, (end - job.startedAt) / 1000)
      : null;
  const range = job.timing?.observedRangeSeconds;
  const count = job.timing?.sampleCount ?? 0;
  let estimate = "ETA unavailable · gathering completed job timings";
  if (active && range && elapsed != null) {
    if (count < 3) {
      estimate = `Recent run: ${formatDuration(range[1])} · more history needed for an ETA`;
    } else if (elapsed >= range[1]) {
      estimate = "Taking longer than recent jobs · still running";
    } else {
      estimate = `Estimated remaining: ${formatDuration(Math.max(0, range[0] - elapsed))}–${formatDuration(range[1] - elapsed)} · based on ${count} recent jobs`;
    }
  }
  return { active, elapsed, estimate };
}

/** Creation time determines recency; SQLite row order changes whenever a job updates. */
export function latestJob(jobs: Job[], kind: Job["kind"], partId?: string): Job | undefined {
  return jobs
    .filter((j) => j.kind === kind && (partId === undefined || j.partId === partId))
    .sort((a, b) => b.startedAt - a.startedAt)[0];
}
