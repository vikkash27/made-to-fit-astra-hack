import { describe, expect, it } from "vitest";
import { jobTiming, formatDuration } from "@/lib/domain/job-timing";
import type { Job } from "@/lib/domain/types";
const job: Job = {
  id: "j",
  kind: "reference",
  stage: "running",
  label: "generating",
  startedAt: 10000,
  timing: { sampleCount: 3, observedRangeSeconds: [100, 150] },
};
describe("Persistent job timers", () => {
  it("uses server start time after refresh and freezes completed duration", () => {
    expect(jobTiming(job, 60000).elapsed).toBe(50);
    expect(jobTiming({ ...job, stage: "succeeded", finishedAt: 70000 }, 200000).elapsed).toBe(60);
  });
  it("does not claim an ETA without history or count below three", () => {
    expect(jobTiming({ ...job, timing: undefined }, 60000).estimate).toContain("ETA unavailable");
    expect(
      jobTiming({ ...job, timing: { sampleCount: 1, observedRangeSeconds: [100, 100] } }, 60000)
        .estimate,
    ).toContain("more history needed");
  });
  it("shows an overrun instead of a fake zero-second countdown", () => {
    expect(jobTiming(job, 200000).estimate).toContain("still running");
    expect(jobTiming(job, 60000).estimate).toContain("50s–1m 40s");
  });
  it("handles missing timestamps and skew without negative timers", () => {
    expect(jobTiming({ ...job, startedAt: 0 }, 60000).elapsed).toBeNull();
    expect(jobTiming(job, 5000).elapsed).toBe(0);
    expect(formatDuration(3661)).toBe("1h 1m");
  });
});
