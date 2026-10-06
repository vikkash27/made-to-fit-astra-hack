/**
 * THE single CAD → renderer boundary (PRD §8.1).
 * CAD: millimetres, right-handed, X width, Y depth, Z up.
 * Renderer: metres, Y up. (x, y, z)mm → (x/1000, z/1000, -y/1000)m.
 * Do not convert anywhere else.
 */
import type { Vec3 } from "./types";

export const MM_PER_M = 1000;

export function cadToScene([x, y, z]: Vec3): Vec3 {
  return [x / MM_PER_M, z / MM_PER_M, -y / MM_PER_M];
}

/** Size (extent) conversion: axis swap without sign, since extents are positive. */
export function cadSizeToScene([x, y, z]: Vec3): Vec3 {
  return [x / MM_PER_M, z / MM_PER_M, y / MM_PER_M];
}

export function sceneToCad([x, y, z]: Vec3): Vec3 {
  return [x * MM_PER_M, -z * MM_PER_M, y * MM_PER_M];
}

/**
 * Equivalent group transform for rendering CAD-frame (mm, Z-up) children:
 * rotate -90° about X and scale by 1/1000. Use ONLY at the viewer root group.
 */
export const CAD_GROUP_ROTATION_X = -Math.PI / 2;
export const CAD_GROUP_SCALE = 1 / MM_PER_M;
