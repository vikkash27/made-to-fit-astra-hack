import { describe, expect, it } from "vitest";
import { Vector3, Quaternion } from "three";
import { fitReference, suggestReferenceAlignment } from "@/lib/domain/reference-alignment";
import { cadToScene, cadSizeToScene } from "@/lib/domain/units";
import { latestJob } from "@/lib/domain/job-timing";
import type { Job, Vec3 } from "@/lib/domain/types";
describe("Illustrative reference alignment", () => {
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
