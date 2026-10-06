import { describe, expect, it, vi } from "vitest";
import { parseDimensionInput } from "@/lib/domain/dimensions";
import { cadToScene } from "@/lib/domain/units";
import { downloadableArtifact } from "@/lib/domain/exports";
import { createHttpAdapter } from "@/lib/api/http-adapter";
import { ApiError } from "@/lib/api/adapter";
import type { Project } from "@/lib/domain/types";

describe("dimension input", () => {
  it("blank stays unknown, never zero", () => {
    expect(parseDimensionInput("")).toBeNull();
    expect(parseDimensionInput("   ")).toBeNull();
    expect(parseDimensionInput("0")).toBeNull();
    expect(parseDimensionInput("27.3")).toBe(27.3);
  });
});

describe("CAD → renderer conversion", () => {
  it("100 mm on +Z maps to 0.1 m up; +Y maps to -Z", () => {
    expect(cadToScene([0, 0, 100])).toEqual([0, 0.1, -0]);
    expect(cadToScene([10, 20, 0])).toEqual([0.01, 0, -0.02]);
  });
});

describe("exports", () => {
  const base = { revisions: [], acceptedRevisionId: null } as unknown as Project;
  it("disabled without an accepted revision", () => {
    expect(downloadableArtifact(base, "stl")).toBeNull();
  });
  it("disabled for sample revisions even with artifacts", () => {
    const p = {
      acceptedRevisionId: "r1",
      revisions: [
        {
          id: "r1",
          kind: "accepted",
          sample: true,
          artifacts: [{ id: "a", kind: "stl", name: "x.stl", url: "/a" }],
        },
      ],
    } as unknown as Project;
    expect(downloadableArtifact(p, "stl")).toBeNull();
  });
  it("enabled for a real accepted artifact", () => {
    const p = {
      acceptedRevisionId: "r1",
      revisions: [
        {
          id: "r1",
          kind: "accepted",
          artifacts: [{ id: "a", kind: "stl", name: "x.stl", url: "/a" }],
        },
      ],
    } as unknown as Project;
    expect(downloadableArtifact(p, "stl")?.name).toBe("x.stl");
  });
});

describe("http adapter", () => {
  it("surfaces failures as ApiError, no fixture fallback", async () => {
    const f = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: { code: "cad_down", message: "CAD offline", retryable: true } }),
          { status: 503 },
        ),
    );
    const ad = createHttpAdapter("http://x", f as unknown as typeof fetch);
    await expect(ad.getProject("p1")).rejects.toBeInstanceOf(ApiError);
    await expect(ad.getProject("p1")).rejects.toMatchObject({ code: "cad_down", retryable: true });
  });
});
