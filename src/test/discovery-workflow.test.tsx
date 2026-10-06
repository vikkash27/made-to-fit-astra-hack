import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PurposeBrief } from "@/components/workspace/PurposeBrief";
import { buildParts } from "@/lib/domain/build-parts";
import type { Project } from "@/lib/domain/types";

const adapter = vi.hoisted(() => ({ updatePreferences: vi.fn(), generateConcepts: vi.fn() }));
vi.mock("@/lib/api", async () => ({
  getAdapter: () => adapter,
  ApiError: (await import("@/lib/api/adapter")).ApiError,
}));
const project = {
  id: "p",
  draftVersion: 4,
  constraints: [],
  tools: null,
  experience: null,
  parts: [
    { id: "board", label: "Controller" },
    { id: "spare", label: "Unused sensor" },
  ],
  concepts: [{ id: "c", partsUsed: ["board"] }],
  selectedConceptId: "c",
} as unknown as Project;
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Explore my components", () => {
  it("saves the brief before generating using the new server version", async () => {
    adapter.updatePreferences.mockResolvedValue({ ...project, draftVersion: 5 });
    adapter.generateConcepts.mockResolvedValue({ job_id: "job" });
    const onStarted = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PurposeBrief project={project} onStarted={onStarted} />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText("What would make this build useful to you?"), {
      target: { value: "A room monitor" },
    });
    fireEvent.click(screen.getByLabelText(/I’m open to a few extra parts/));
    fireEvent.click(screen.getByRole("button", { name: /Find projects with this brief/ }));
    await waitFor(() => expect(onStarted).toHaveBeenCalledOnce());
    expect(adapter.updatePreferences).toHaveBeenCalledWith(
      "p",
      expect.objectContaining({
        constraints: ["A room monitor"],
        allowAdditionalParts: false,
        tools: null,
      }),
    );
    expect(adapter.generateConcepts).toHaveBeenCalledWith("p", 5);
  });
  it("surfaces a failed save without starting concept generation", async () => {
    adapter.updatePreferences.mockRejectedValue(new Error("Brief changed elsewhere"));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PurposeBrief project={project} />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Find projects with this brief/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Brief changed elsewhere");
    expect(adapter.generateConcepts).not.toHaveBeenCalled();
  });
  it("keeps unused components in inventory and out of the chosen enclosure", () => {
    expect(buildParts(project).map((p) => p.id)).toEqual(["board"]);
    expect(project.parts).toHaveLength(2);
    expect(buildParts({ ...project, selectedConceptId: null })).toEqual(project.parts);
  });
});
