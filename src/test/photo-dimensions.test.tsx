import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConfirmStage } from "@/components/workspace/ConfirmStage";
import type { Project } from "@/lib/domain/types";

const adapter = vi.hoisted(() => ({
  mode: "fixture",
  getEvidence: vi.fn().mockResolvedValue({ sources: [], proposals: [], missing: [] }),
  confirmComponents: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/api", async () => ({
  getAdapter: () => adapter,
  ApiError: (await import("@/lib/api/adapter")).ApiError,
}));
vi.mock("@/components/viewer/ViewerPanel", () => ({ ViewerPanel: () => null }));
vi.mock("@/components/workspace/WorkspaceAssistant", () => ({ AskAstra: () => null }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("fills only empty fields from real estimates and requires explicit confirmation", async () => {
  const unknown = { value: null, status: "unknown" };
  const project = {
    id: "p",
    draftVersion: 1,
    parts: [
      {
        id: "display",
        label: "Display",
        status: "accepted",
        identityAccepted: "Display module",
        size: { x: { value: 10, status: "accepted" }, y: unknown, z: unknown },
        pose: [0, 0, 0],
        visible: true,
      },
    ],
    photos: [],
    jobs: [],
    concepts: [],
    revisions: [],
    selectedConceptId: null,
  } as unknown as Project;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { rerender } = render(<ConfirmStage project={project} go={vi.fn()} />, { wrapper });
  fireEvent.change(screen.getByLabelText("Display Depth in mm"), { target: { value: "22" } });
  const axis = (value_mm: number) => ({
    value_mm,
    range_mm: [value_mm - 1, value_mm + 1],
    confidence: "low" as const,
    basis: "Common module size assumption",
  });
  const updated = {
    ...project,
    parts: [
      {
        ...project.parts[0],
        dimensionEstimate: {
          width: axis(40),
          depth: axis(30),
          height: axis(6),
        },
      },
    ],
  } as Project;
  rerender(<ConfirmStage project={updated} go={vi.fn()} />);
  await waitFor(() => expect(screen.getByLabelText("Display Height in mm")).toHaveValue("6"));
  expect(screen.getByLabelText("Display Width in mm")).toHaveValue("10");
  expect(screen.getByLabelText("Display Depth in mm")).toHaveValue("22");
  expect(adapter.confirmComponents).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /Create enclosure draft/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /Confirm identity & measurements/ }));
  await waitFor(() =>
    expect(adapter.confirmComponents).toHaveBeenCalledWith("p", 1, [
      expect.objectContaining({
        dimensionsSource: "user_confirmed_photo_estimate",
        size: {
          x: { value: 10, accept: true },
          y: { value: 22, accept: true },
          z: { value: 6, accept: true },
        },
      }),
    ]),
  );
});
