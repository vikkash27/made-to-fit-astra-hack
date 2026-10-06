import { describe, expect, it } from "vitest";
import { Vector3, Quaternion } from "three";
import { fitReference, suggestReferenceAlignment } from "@/lib/domain/reference-alignment";
import { cadToScene, cadSizeToScene } from "@/lib/domain/units";
import { latestJob } from "@/lib/domain/job-timing";
import type { Job, Vec3 } from "@/lib/domain/types";
import type { VisualAssetRecord } from "@/lib/api/backend-types";
import { referencePresentation } from "@/lib/domain/reference-presentation";
describe("Illustrative reference alignment", () => {
  const asset = {
    id: "model",
    part_id: "board",
    calibration: {
      status: "needs_review",
      bounds: [
        [1, 2, 3],
        [9, 3, 7],
      ],
    },
  } as VisualAssetRecord;
  it("shows an unmeasured model at gallery scale without creating dimensions or accepting calibration", () => {
    const original = structuredClone(asset);
    const p = referencePresentation(asset, null)!;
    expect(p.alignment.scale).toBeCloseTo(0.005);
    expect(p.reviewed).toBe(false);
    expect(asset).toEqual(original);
  });
  it("automatically previews a visual fit and discards stale reviewed sizes", () => {
    const stale = {
      ...asset,
      calibration: {
        ...asset.calibration,
        status: "reviewed",
        aligned_size_mm: [1, 1, 1] as Vec3,
        uniform_scale: 99,
        translation_m: [0, 0, 0] as Vec3,
      },
    };
    const p = referencePresentation(stale, [40, 20, 5])!;
    expect(p.reviewed).toBe(false);
    expect(p.alignment.scale).toBeLessThan(1);
    expect(stale.calibration.uniform_scale).toBe(99);
  });
  it("retains a reviewed alignment only for the current measured envelope", () => {
    const reviewed = {
      ...asset,
      calibration: {
        ...asset.calibration,
        status: "reviewed",
        aligned_size_mm: [40, 20, 5] as Vec3,
        uniform_scale: 0.005,
        translation_m: [0.02, 0.01, -0.02] as Vec3,
      },
    };
    expect(referencePresentation(reviewed, [40, 20, 5])).toMatchObject({
      reviewed: true,
      alignment: { scale: 0.005, position: [0.02, 0.01, -0.02] },
    });
    expect(
      referencePresentation({ ...asset, calibration: { status: "needs_review" } }, null),
    ).toBeNull();
  });
  it("fits uniformly and centers in the existing renderer frame, never changes CAD dimensions", () => {
    const size: Vec3 = [40, 20, 5];
    const a = fitReference(
      [
        [1, 2, 3],
        [9, 3, 7],
      ],
      size,
      [0, 0, 0, 1],
    );
    expect(a.scale).toBeCloseTo(0.005);
    const center = new Vector3(5, 2.5, 5)
      .multiplyScalar(a.scale)
      .add(new Vector3(...a.position))
      .toArray();
    cadToScene([20, 10, 2.5]).forEach((n, i) => expect(center[i]).toBeCloseTo(n));
    expect(size).toEqual([40, 20, 5]);
  });
  it("suggests a rigid rotation when Rodin axes differ from the measured envelope", () => {
    const a = suggestReferenceAlignment(
      [
        [0, 0, 0],
        [1, 8, 4],
      ],
      [40, 20, 5],
    );
    const q = new Quaternion(...a.rotation);
    const vectors = [new Vector3(1, 0, 0), new Vector3(0, 8, 0), new Vector3(0, 0, 4)].map((v) =>
      v.applyQuaternion(q).multiplyScalar(a.scale).toArray().map(Math.abs),
    );
    const target = cadSizeToScene([40, 20, 5]);
    target.forEach((n, i) => expect(vectors.reduce((s, v) => s + v[i]!, 0)).toBeCloseTo(n));
  });
  it("keeps recovered lookup failures from outranking a later successful lookup for that part", () => {
    const old: Job = {
      id: "old",
      kind: "evidence",
      stage: "failed",
      partId: "a",
      label: "failed",
      startedAt: 100,
    };
    const ready: Job = { ...old, id: "new", stage: "succeeded", startedAt: 200 };
    expect(latestJob([ready, old], "evidence", "a")?.stage).toBe("succeeded");
    expect(latestJob([ready, old], "evidence", "different")).toBeUndefined();
  });
});
