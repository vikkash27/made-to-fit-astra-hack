import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdapter, ApiError } from "./index";
import type { BackendAdapter, JobStatus } from "./adapter";
import type { Project } from "@/lib/domain/types";

export const projectKey = (id: string) => ["project", id] as const;

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKey(id),
    queryFn: () => getAdapter().getProject(id),
    refetchInterval: (q) => {
      const p = q.state.data as Project | undefined;
      return p?.jobs.some((j) => j.stage === "queued" || j.stage === "running") ? 1200 : false;
    },
    retry: (n, e) => e instanceof ApiError && e.retryable && n < 2,
  });
}

export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: () => getAdapter().health(), retry: false, refetchInterval: 30000 });
}

/** Wraps an adapter call; invalidates the project afterward. Errors surface to the caller. */
export function useProjectAction<A extends unknown[], R>(projectId: string, fn: (ad: BackendAdapter, ...a: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: A) => fn(getAdapter(), ...args),
    onSettled: () => qc.invalidateQueries({ queryKey: projectKey(projectId) }),
  });
}

export async function waitForJob(jobId: string, signal?: AbortSignal, intervalMs = 1000): Promise<JobStatus> {
  const ad = getAdapter();
  for (let i = 0; i < 600; i++) {
    if (signal?.aborted) throw new ApiError("aborted", "Stopped waiting (the backend job continues).", 0, false);
    const s = await ad.getJob(jobId);
    if (s.stage === "succeeded") return s;
    if (s.stage === "failed")
      throw new ApiError(s.error?.code ?? "job_failed", s.error?.message ?? "Job failed.", 0, s.error?.retryable ?? false);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new ApiError("timeout", "Job is still running; check back shortly.", 0, true);
}

export function errorMessage(e: unknown) {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}
