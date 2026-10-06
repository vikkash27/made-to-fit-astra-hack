import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuildGuide } from "@/components/workspace/BuildGuide";
import { WiringPanel } from "@/components/workspace/WiringPanel";
import { useViewer } from "@/lib/store/viewer-store";
import type { Revision } from "@/lib/domain/types";
const ad = vi.hoisted(() => ({
  getBuildGuide: vi.fn(),
  getGuideProgress: vi.fn(),
  saveGuideProgress: vi.fn(),
  getWiringPlan: vi.fn(),
  reviewWiringPlan: vi.fn(),
  getJob: vi.fn(),
  generateWiringPlan: vi.fn(),
  resolveArtifactUrl: (s: string) => s,
}));
vi.mock("@/lib/api", async () => ({
  getAdapter: () => ad,
  ApiError: (await import("@/lib/api/adapter")).ApiError,
}));
const revision = {
  id: "r",
  label: "R1",
  specHash: "hash",
  parts: [
    { id: "board", label: "Controller" },
    { id: "display", label: "Display" },
  ],
} as Revision;
const guide = {
  revision_id: "r",
  spec_hash: "hash",
  title: "Desk monitor",
  purpose: "Read the room",
  parts: [],
  additional_hardware: [],
  software_dependencies: [],
  unresolved: [],
  steps: [
    {
      id: "prepare",
      title: "Gather the parts",
      instruction: "Review the inventory",
      completion_check: "Inventory checked",
      part_ids: ["board"],
      requires_review: true,
    },
    {
      id: "fit-board",
      title: "Fit controller",
      instruction: "Keep power disconnected",
      completion_check: "No mechanical stress",
      part_ids: ["board"],
      requires_review: true,
    },
  ],
};
const progress = {
  revision_id: "r",
  spec_hash: "hash",
  completed_step_ids: [],
  wiring_plan_id: null,
};
const plan = {
  id: "wp",
  plan_hash: "ph",
  revision_id: "r",
  spec_hash: "hash",
  status: "needs_review",
  overview: "Source-backed proposal",
  power_plan: "Use documented 3.3 V logic",
  unresolved: [],
  artifacts: [],
  sources: [{ id: "s", title: "Module pinout", url: "https://example.org/pinout" }],
  connections: [
    {
      id: "data",
      start: { part_id: "board", pin: "SDA" },
      end: { part_id: "display", pin: "SDA" },
      signal: "I2C data",
      kind: "signal",
      color: "blue",
      voltage_v: 3.3,
      instruction: "Join the documented SDA pins with power disconnected",
      completion_check: "Pin labels checked",
      evidence: [
        { part_id: "board", source_id: "s", location: "pinout", quote: "SDA is the I2C data pin" },
      ],
    },
  ],
};
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
beforeEach(() => {
  ad.getBuildGuide.mockResolvedValue(guide);
  ad.getGuideProgress.mockResolvedValue(progress);
  ad.saveGuideProgress.mockImplementation(async (_r, ids, planId) => ({
    ...progress,
    completed_step_ids: ids,
    wiring_plan_id: planId,
  }));
  ad.getWiringPlan.mockResolvedValue({ revision_id: "r", spec_hash: "hash", plan });
});
describe("Interactive assembly guide", () => {
  it("saves a check against the accepted revision and changes only viewer state", async () => {
    render(<BuildGuide revision={revision} />, { wrapper });
    const check = await screen.findByLabelText("I completed this step and its check");
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(ad.saveGuideProgress).toHaveBeenCalledWith("r", ["prepare"], null));
    fireEvent.click(screen.getByRole("button", { name: /^Next$/ }));
    expect(screen.getByRole("heading", { name: "Fit controller" })).toBeInTheDocument();
    expect(useViewer.getState().selectedId).toBe("board");
    expect(revision.parts?.[0]?.id).toBe("board");
  });
  it("rejects a guide from another specification", async () => {
    ad.getBuildGuide.mockResolvedValue({ ...guide, spec_hash: "other" });
    render(<BuildGuide revision={revision} />, { wrapper });
    expect(await screen.findByRole("alert")).toHaveTextContent("does not match");
    expect(screen.queryByLabelText("I completed this step and its check")).not.toBeInTheDocument();
  });
  it("keeps proposed pin connections out of instructions until explicit review", async () => {
    ad.reviewWiringPlan.mockResolvedValue({
      revision_id: "r",
      spec_hash: "hash",
      plan: { ...plan, status: "reviewed" },
    });
    render(<WiringPanel revision={revision} progress={progress} saveProgress={vi.fn()} />, {
      wrapper,
    });
    const use = await screen.findByRole("button", { name: "Use the reviewed wiring steps" });
    expect(use).toBeDisabled();
    expect(screen.queryByText(plan.connections[0]!.instruction)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Reviewed I2C data connection"));
    fireEvent.click(screen.getByLabelText(/exact module variants/));
    fireEvent.click(screen.getByLabelText(/supply voltage, polarity/));
    expect(use).toBeEnabled();
    fireEvent.click(use);
    expect(await screen.findByText(plan.connections[0]!.instruction)).toBeInTheDocument();
    expect(ad.reviewWiringPlan).toHaveBeenCalledWith(
      "r",
      expect.objectContaining({
        plan_id: "wp",
        plan_hash: "ph",
        reviewed_connection_ids: ["data"],
      }),
    );
  });
  it("does not unlock wiring with unresolved compatibility", async () => {
    ad.getWiringPlan.mockResolvedValue({
      revision_id: "r",
      spec_hash: "hash",
      plan: { ...plan, unresolved: ["Unknown display variant"] },
    });
    render(<WiringPanel revision={revision} saveProgress={vi.fn()} />, { wrapper });
    expect(await screen.findByText("Unknown display variant")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Reviewed I2C data connection"));
    fireEvent.click(screen.getByLabelText(/exact module variants/));
    fireEvent.click(screen.getByLabelText(/supply voltage, polarity/));
    expect(screen.getByRole("button", { name: "Use the reviewed wiring steps" })).toBeDisabled();
  });
});
