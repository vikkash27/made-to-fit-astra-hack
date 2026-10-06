import { Box3, Euler, Quaternion, Vector3 } from "three";
import type { Vec3 } from "./types";
import { cadSizeToScene, cadToScene } from "./units";
export type ReferenceAlignment = {
  scale: number;
  position: Vec3;
  rotation: [number, number, number, number];
};

/** Uniform visual fit only. Engineering dimensions never come from the generated mesh. */
export function fitReference(
  bounds: [Vec3, Vec3],
  size: Vec3,
  rotation: ReferenceAlignment["rotation"],
): ReferenceAlignment {
  const q = new Quaternion(...rotation);
  const transformed = new Box3();
  for (const x of [bounds[0][0], bounds[1][0]])
    for (const y of [bounds[0][1], bounds[1][1]])
      for (const z of [bounds[0][2], bounds[1][2]])
        transformed.expandByPoint(new Vector3(x, y, z).applyQuaternion(q));
  const extent = transformed.getSize(new Vector3()).toArray();
  if (extent.some((n) => !Number.isFinite(n) || n <= 0))
    throw new Error("Invalid reference bounds.");
  const target = cadSizeToScene(size);
  const scale = Math.min(...target.map((n, i) => n / extent[i]!));
  const center = transformed.getCenter(new Vector3()).multiplyScalar(scale);
  const targetCenter = cadToScene(size.map((n) => n / 2) as Vec3);
  return {
    scale,
    position: targetCenter.map((n, i) => n - center.toArray()[i]!) as Vec3,
    rotation,
  };
}
export function suggestReferenceAlignment(bounds: [Vec3, Vec3], size: Vec3): ReferenceAlignment {
  const target = cadSizeToScene(size);
  let best: ReferenceAlignment | null = null;
  let score = Infinity;
  const extents = bounds[1].map((n, i) => n - bounds[0][i]!);
  for (let x = 0; x < 4; x++)
    for (let y = 0; y < 4; y++)
      for (let z = 0; z < 4; z++) {
        const q = new Quaternion().setFromEuler(
          new Euler((x * Math.PI) / 2, (y * Math.PI) / 2, (z * Math.PI) / 2),
        );
        const rotation = q.toArray() as ReferenceAlignment["rotation"];
        const a = fitReference(bounds, size, rotation);
        // A rotated box extent is the sum of absolute rotated basis projections.
        const vectors = [
          new Vector3(extents[0], 0, 0),
          new Vector3(0, extents[1], 0),
          new Vector3(0, 0, extents[2]),
        ].map((v) => v.applyQuaternion(q).toArray().map(Math.abs));
        const loss =
          target.reduce(
            (sum, n, i) => sum + Math.abs(n - vectors.reduce((s, v) => s + v[i]!, 0) * a.scale) / n,
            0,
          ) +
          (1 - Math.abs(q.w)) * 1e-6;
        if (loss < score) {
          best = a;
          score = loss;
        }
      }
  if (!best) throw new Error("Could not align this reference.");
  return best;
}
