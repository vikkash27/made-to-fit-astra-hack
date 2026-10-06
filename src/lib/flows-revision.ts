import { getAdapter } from "@/lib/api";
import { waitForJob } from "@/lib/api/hooks";

/** Build a frozen candidate, then run checks. Never accepts on its own. */
export async function buildAndCheck(revisionId: string) {
  const ad = getAdapter();
  await waitForJob((await ad.buildRevision(revisionId)).job_id);
  const checks = await ad.runChecks(revisionId);
  if (checks) await waitForJob(checks.job_id);
}

/** Apply checked change: build, check, then accept only if checks pass (server enforces). */
export async function applyCheckedChange(
  projectId: string,
  revisionId: string,
  expectedParentId: string | null,
) {
  const ad = getAdapter();
  await buildAndCheck(revisionId);
  const p = await ad.getProject(projectId);
  const rev = p.revisions.find((r) => r.id === revisionId);
  if (!rev || rev.kind === "failed" || rev.checks.some((c) => c.status === "fail")) {
    return {
      accepted: false as const,
      reason: "Checks failed — your accepted design is unchanged.",
    };
  }
  const op =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());
  await ad.acceptRevision(revisionId, expectedParentId, op);
  return { accepted: true as const };
}
