import type { BackendAdapter } from "./adapter";
import { createHttpAdapter } from "./http-adapter";
import { createFixtureAdapter } from "./fixture-adapter";

let instance: BackendAdapter | null = null;

/** VITE_API_BASE_URL set → real backend. Unset → labelled fixture preview. */
export function getAdapter(): BackendAdapter {
  if (instance) return instance;
  const base = import.meta.env['VITE_API_BASE_URL'] as string | undefined;
  instance = base ? createHttpAdapter(base) : createFixtureAdapter();
  return instance;
}

export { ApiError } from "./adapter";
export type * from "./adapter";
