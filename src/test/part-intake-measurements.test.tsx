import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PartEditor } from "@/components/workspace/PartsStage";
import { startProject } from "@/lib/flows";
import type { Part, Project } from "@/lib/domain/types";

const adapter = vi.hoisted(() => ({
  mode: "http",
  confirmComponents: vi.fn(),
  createProject: vi.fn(),
  uploadPhoto: vi.fn(),
  analyzePhotos: vi.fn(),
  agent: vi.fn(),
}));
vi.mock("@/lib/api", async () => ({
  getAdapter: () => adapter,
  ApiError: (await import("@/lib/api/adapter")).ApiError,
}));
vi.mock("@/components/workspace/WorkspaceAssistant", () => ({ AskAstra: () => null }));

beforeEach(() => {
  adapter.confirmComponents.mockResolvedValue(undefined);
  adapter.createProject.mockResolvedValue({ id: "p" });
  adapter.uploadPhoto.mockResolvedValue({ id: "photo" });
  adapter.analyzePhotos.mockResolvedValue({ job_id: "analysis" });
  adapter.agent.mockResolvedValue({ job_id: "agent" });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const unknown = { value: null, status: "unknown" as const };
const part = {
  id: "controller",
  label: "Controller",
  category: "controller",
  identityProposed: "Pico-style controller",
  identityAccepted: null,
  size: { x: unknown, y: unknown, z: unknown },
} as Part;
const project = {
  id: "p",
  draftVersion: 7,
  photos: [],
  parts: [part],
  jobs: [],
  visualAssets: [],
} as unknown as Project;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("manual measurements during part review", () => {
  it("saves explicit dimensions and identity together without waiting for analysis", async () => {
    render(<PartEditor project={project} part={part} onDone={vi.fn()} />, { wrapper });
    for (const [axis, value] of [
      ["Width", "21"],
      ["Depth", "51"],
      ["Height", "4"],
    ])
      fireEvent.change(screen.getByLabelText(`Controller ${axis} in mm`), { target: { value } });
    expect(adapter.confirmComponents).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm identity & measurements" }));
    await waitFor(() =>
      expect(adapter.confirmComponents).toHaveBeenCalledWith("p", 7, [
        expect.objectContaining({
          id: "controller",
          dimensionsSource: "user_measurement",
          identityAccepted: "Pico-style controller",
          size: {
            x: { value: 21, accept: true },
            y: { value: 51, accept: true },
            z: { value: 4, accept: true },
          },
        }),
      ]),
    );
  });
  it("keeps blanks unknown and does not accept incomplete dimensions", async () => {
    render(<PartEditor project={project} part={part} onDone={vi.fn()} />, { wrapper });
    fireEvent.change(screen.getByLabelText("Controller Width in mm"), { target: { value: "21" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm identity" }));
    await waitFor(() =>
      expect(adapter.confirmComponents).toHaveBeenCalledWith("p", 7, [
        expect.objectContaining({
          size: {
            x: { value: 21, accept: false },
            y: { value: null, accept: false },
            z: { value: null, accept: false },
          },
        }),
      ]),
    );
  });
  it("rejects non-positive measurements without submitting", () => {
    render(<PartEditor project={project} part={part} onDone={vi.fn()} />, { wrapper });
    fireEvent.change(screen.getByLabelText("Controller Width in mm"), { target: { value: "0" } });
    expect(screen.getByRole("button", { name: "Confirm identity" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("positive number");
    expect(adapter.confirmComponents).not.toHaveBeenCalled();
  });
});

describe("photo and text intake", () => {
  it("keeps the text brief but does not import a duplicate text inventory alongside photos", async () => {
    const file = new File(["image"], "parts.png", { type: "image/png" });
    await startProject({
      text: "Controller, sensor and display",
      files: [file],
      links: [],
      intent: "discover",
    });
    expect(adapter.createProject).toHaveBeenCalledWith(
      expect.objectContaining({ initialText: "Controller, sensor and display" }),
    );
    expect(adapter.analyzePhotos).toHaveBeenCalledWith("p", ["photo"]);
    expect(adapter.agent).not.toHaveBeenCalled();
  });
  it("still imports a text-only inventory", async () => {
    await startProject({
      text: "Controller, sensor and display",
      files: [],
      links: [],
      intent: "discover",
    });
    expect(adapter.agent).toHaveBeenCalledWith(
      "p",
      expect.objectContaining({ text: "Controller, sensor and display" }),
    );
  });
});
