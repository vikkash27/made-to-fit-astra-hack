import { describe, expect, it } from "vitest";
import { createHttpAdapter } from "@/lib/api/http-adapter";
import { jobStage, projectPart, projectRevision } from "@/lib/api/backend-projection";
import type { ComponentRecord, RevisionRecord } from "@/lib/api/backend-types";
const component: ComponentRecord = {
  part_id: "battery",
  component_version: 1,
  name: "Battery",
  role: "hardware_reference",
  identity: null,
  identity_confirmed: false,
  size_mm: [40, 18, null],
  pose: { translation_mm: [0, 0, 0], rotation_quaternion_xyzw: [0, 0, 0, 1] },
  dimensions_confirmed: false,
  dimensions_source: "unknown",
  evidence_ids: [],
  capabilities: [],
  keepout_mm: [0, 0, 0],
  mounting_points_mm: [],
  interfaces: [],
  visual_asset_id: null,
  crop: null,
  engineering_geometry: "dimensioned_box",
  printable_output: false,
  locked_fields: [],
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
describe("Python HTTP boundary", () => {
  it("maps readiness flags and real provider configuration", async () => {
    const ad = createHttpAdapter("http://api", async () =>
      json({
        status: "ok",
        cad: { ready: true },
        providers: { openai: "not_configured", hyper3d: "configured" },
      }),
    );
    expect(await ad.health()).toEqual({
      ok: true,
      cad: true,
      astraConfigured: false,
      rodinConfigured: true,
      mode: "http",
    });
  });
  it("preserves unknown dimensions and tentative identity", () => {
    const part = projectPart(component);
    expect(part.size.z).toMatchObject({ value: null, status: "unknown" });
    expect(part.identityAccepted).toBeNull();
    expect(part.status).toBe("proposed");
  });
  it("understands terminal vendor states without polling forever", () => {
    expect(jobStage("ready")).toBe("succeeded");
    expect(jobStage("unknown_submission")).toBe("failed");
    expect(jobStage("cancelled")).toBe("failed");
    expect(jobStage("building_cad")).toBe("running");
  });
  it("retains operation ID after an uncertain paid submission", async () => {
    const calls: { client_operation_id: string }[] = [];
    let uncertain = true;
    const ad = createHttpAdapter("http://api", async (url, init) => {
      const path = String(url);
      if (path.endsWith("/projects/p"))
        return json({
          components: [{ ...component, crop: { photo_id: "photo", box_xyxy: [0, 0, 1, 1] } }],
        });
      if (path.endsWith("/assets/generate")) {
        calls.push(JSON.parse(String(init?.body)));
        if (uncertain) {
          uncertain = false;
          throw new Error("connection lost after submission");
        }
        return json({ job_id: "saved-job" }, 202);
      }
      throw new Error(`Unexpected request ${path}`);
    });
    await expect(ad.generateReference("p", ["battery"], "first-key")).rejects.toMatchObject({
      code: "network_error",
    });
    expect(await ad.generateReference("p", ["battery"], "new-key")).toEqual({
      job_id: "saved-job",
    });
    expect(calls.map((v) => v.client_operation_id)).toEqual(["first-key", "first-key"]);
  });
  it("does not expose exports for historic accepted revisions", async () => {
    const ad = createHttpAdapter("http://api", async () =>
      json({ state: "accepted", is_current_accepted: false, artifacts: [{ id: "old" }] }),
    );
    expect(await ad.getExports("old")).toEqual([]);
  });
  it("reads checks synchronously instead of pretending a check job exists", async () => {
    const ad = createHttpAdapter("http://api", async () =>
      json({ checks: [], eligible_for_acceptance: false }),
    );
    expect(await ad.runChecks("r")).toBeUndefined();
  });
  it("keeps frozen geometry separate from the mutable inventory", () => {
    const revision = projectRevision({
      id: "r",
      state: "accepted",
      parent_id: null,
      spec: {
        components: [{ ...component, size_mm: [40, 18, 10], dimensions_confirmed: true }],
        enclosure: null,
      },
      checks: [],
      artifacts: [],
      manifest: null,
      created_at: "2026-10-06T18:00:00Z",
      spec_hash: "frozen",
      eligible_for_acceptance: true,
    } as unknown as RevisionRecord);
    expect(revision.parts?.[0]?.size.z.value).toBe(10);
    expect(projectPart({ ...component, size_mm: [40, 18, 20] }).size.z.value).toBe(20);
  });
});
