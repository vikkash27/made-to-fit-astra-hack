import type { VisualAssetRecord } from "@/lib/api/backend-types";
import type { Vec3 } from "./types";
import { suggestReferenceAlignment, type ReferenceAlignment } from "./reference-alignment";

/** Display transforms only: no component dimensions or stored calibration are changed. */
export function referencePresentation(asset: VisualAssetRecord, size: Vec3 | null) {
  const cal = asset.calibration;
  const reviewed =
    !!size &&
    cal.status === "reviewed" &&
    cal.aligned_size_mm?.every((n, i) => Math.abs(n - size[i]!) < 1e-6) === true;
  if (reviewed && cal.uniform_scale && cal.translation_m)
    return {
      alignment: {
        scale: cal.uniform_scale,
        position: cal.translation_m,
        rotation: cal.rotation_quaternion_xyzw ?? [0, 0, 0, 1],
      } as ReferenceAlignment,
      reviewed: true,
    };
  if (!cal.bounds) return null;
  try {
    if (size) return { alignment: suggestReferenceAlignment(cal.bounds, size), reviewed: false };
    const [min, max] = cal.bounds;
    const extent = max.map((n, i) => n - min[i]!);
    if (extent.some((n) => !Number.isFinite(n) || n <= 0)) return null;
    // Gallery normalization has no physical scale; labels explicitly say size is unknown.
    const scale = 0.04 / Math.max(...extent);
    return {
      alignment: {
        scale,
        rotation: [0, 0, 0, 1],
        position: [
          (-(min[0] + max[0]) / 2) * scale,
          -min[1] * scale,
          (-(min[2] + max[2]) / 2) * scale,
        ],
      } as ReferenceAlignment,
      reviewed: false,
    };
  } catch {
    return null;
  }
}
