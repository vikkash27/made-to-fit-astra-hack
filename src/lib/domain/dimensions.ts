import type { DimField, Part, Vec3, EnclosureParams } from "./types";

/** Parse user input. Blank/invalid is unknown (null), never zero. */
export function parseDimensionInput(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function knownSize(part: Part): Vec3 | null {
  const { x, y, z } = part.size;
  if (x.value == null || y.value == null || z.value == null) return null;
  return [x.value, y.value, z.value];
}

export function isAccepted(d: DimField) {
  return d.status === "accepted" && d.value != null;
}

export function partFullyConfirmed(p: Part) {
  return p.status === "accepted" && isAccepted(p.size.x) && isAccepted(p.size.y) && isAccepted(p.size.z);
}

export function formatDim(d: DimField) {
  return d.value == null ? "—" : `${d.value}`;
}

/** Preview enclosure bounds around visible known parts (display only, not CAD). */
export function previewEnclosureBounds(parts: Part[], p: EnclosureParams) {
  const known = parts.map((pt) => ({ pt, s: knownSize(pt) })).filter((k) => k.s);
  if (known.length === 0) return null;
  let min: Vec3 = [Infinity, Infinity, Infinity];
  let max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const { pt, s } of known) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], pt.pose[i]);
      max[i] = Math.max(max[i], pt.pose[i] + s![i]);
    }
  }
  const pad = p.wall + p.clearance;
  min = [min[0] - pad, min[1] - pad, 0];
  max = [max[0] + pad, max[1] + pad, max[2] + p.clearance + p.lidThickness];
  return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] as Vec3 };
}
