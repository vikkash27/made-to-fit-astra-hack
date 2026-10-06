import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { stageAccess } from "@/lib/domain/stage-access";
import { referenceToGenerate } from "@/lib/domain/automatic-references";
import { Composer } from "@/components/studio/Composer";
import { AstraMarkdown } from "@/components/workspace/AstraMarkdown";
import { AutomaticDimensions } from "@/components/workspace/AutomaticDimensions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { BackendAdapter } from "@/lib/api/adapter";
import type { Project } from "@/lib/domain/types";

const project = {
  parts: [
    {
      id: "board",
      label: "Board",
      identityAccepted: null,
      photoId: "photo",
      anchor: { x: 0, y: 0, w: 1, h: 1 },
    },
  ],
  goal: null,
  revisions: [],
  acceptedRevisionId: null,
  jobs: [],
  concepts: [],
  selectedConceptId: null,
} as unknown as Project;
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("does not estimate spare parts or show an old failure after all used dimensions are confirmed", () => {
  const estimateDimensions = vi.fn();
  vi.spyOn(api, "getAdapter").mockReturnValue({
    mode: "http",
    estimateDimensions,
  } as unknown as BackendAdapter);
  const confirmed = { value: 10, status: "accepted" };
  const p = {
    ...project,
    id: "confirmed-build",
    selectedConceptId: "chosen",
    concepts: [{ id: "chosen", partsUsed: ["board"] }],
    parts: [
      {
        ...project.parts[0],
        status: "accepted",
        identityAccepted: "Board",
        size: { x: confirmed, y: confirmed, z: confirmed },
      },
      {
        ...project.parts[0],
        id: "spare",
        identityAccepted: "Spare",
        status: "proposed",
        size: {
          x: { value: null, status: "unknown" },
          y: { value: null, status: "unknown" },
          z: { value: null, status: "unknown" },
        },
      },
    ],
    jobs: [
      {
        id: "old-failure",
        kind: "dimensions",
        stage: "failed",
        startedAt: 1,
        error: "Provider unavailable",
      },
    ],
  } as unknown as Project;
  const { container } = render(
    <QueryClientProvider client={new QueryClient()}>
      <AutomaticDimensions project={p} />
    </QueryClientProvider>,
  );
  expect(container).toBeEmptyDOMElement();
  expect(estimateDimensions).not.toHaveBeenCalled();
});
describe("workspace dependencies", () => {
  it("explains part review and links to the step that resolves it", () => {
    expect(stageAccess(project, "discover")).toMatchObject({ allowed: false, resolve: "parts" });
    expect(stageAccess(project, "discover").reason).toMatch(/identity/);
    expect(
      stageAccess(
        { ...project, parts: [{ ...project.parts[0], identityAccepted: "Board" }] } as Project,
        "discover",
      ).allowed,
    ).toBe(true);
  });
  it("keeps print files locked until explicit acceptance, even after a candidate exists", () => {
    const candidate = {
      ...project,
      revisions: [{ id: "candidate", kind: "candidate" }],
    } as unknown as Project;
    expect(stageAccess(candidate, "export")).toMatchObject({ allowed: false, resolve: "engineer" });
    expect(stageAccess({ ...candidate, acceptedRevisionId: "accepted" }, "export").allowed).toBe(
      true,
    );
  });
});
describe("automatic appearance files", () => {
  const reviewed = {
    ...project,
    parts: [{ ...project.parts[0], identityAccepted: "Board" }],
  } as Project;
  it("waits for identity/crop review and reuses an existing model", () => {
    expect(referenceToGenerate(project)).toBeUndefined();
    expect(referenceToGenerate(reviewed)?.id).toBe("board");
    expect(
      referenceToGenerate({
        ...reviewed,
        parts: [{ ...reviewed.parts[0], visualAssetId: "existing" }],
      } as Project),
    ).toBeUndefined();
  });
  it.each(["queued", "running", "failed", "succeeded"])(
    "never automatically resubmits an existing %s operation",
    (stage) => {
      expect(
        referenceToGenerate({
          ...reviewed,
          jobs: [{ kind: "reference", partId: "board", stage, backendStage: "unknown_submission" }],
        } as Project),
      ).toBeUndefined();
    },
  );
});
describe("Astra interaction", () => {
  it("resolves real artifact links against the backend while preserving source links", () => {
    render(
      <AstraMarkdown
        text="[Print file](/artifacts/real-file) [Source](https://example.com)"
        resolveArtifactUrl={(url) => `http://127.0.0.1:8003${url}`}
      />,
    );
    expect(screen.getByRole("link", { name: "Print file" })).toHaveAttribute(
      "href",
      "http://127.0.0.1:8003/artifacts/real-file",
    );
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
  it("keeps a message draft after a rejected submission and clears it on success", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce(undefined);
    render(<Composer allowFiles={false} placeholder="Message Astra" onSubmit={send} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Explain this fit check" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(send).toHaveBeenCalledOnce());
    expect(screen.getByRole("textbox")).toHaveValue("Explain this fit check");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
  });
  it("formats real Markdown and rejects executable links and raw HTML", () => {
    const { container } = render(
      <AstraMarkdown
        text={
          "## Your options\n\n- **Fewer parts:** use the board\n- [Source](https://example.com)\n\n[unsafe](javascript:alert(1))\n\n<script>alert(1)</script>"
        }
      />,
    );
    expect(screen.getByRole("heading", { name: "Your options" })).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("Fewer parts:");
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });
});
