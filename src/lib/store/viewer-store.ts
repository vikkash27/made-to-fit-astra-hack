import { create } from "zustand";

export type ViewMode = "cad" | "rendered" | "overlay";
export type CameraPreset = "iso" | "top" | "front" | "side";

interface ViewerState {
  selectedId: string | null;
  hidden: Record<string, boolean>;
  isolatedId: string | null;
  mode: ViewMode;
  explode: number;
  xray: boolean;
  showDims: boolean;
  showEnvelopes: boolean;
  cameraPreset: CameraPreset;
  cameraNonce: number;
  previewRevisionId: string | null;
  select: (id: string | null) => void;
  toggleHidden: (id: string) => void;
  isolate: (id: string | null) => void;
  set: (p: Partial<ViewerState>) => void;
  setCamera: (c: CameraPreset) => void;
  fit: () => void;
}

export const useViewer = create<ViewerState>((set) => ({
  selectedId: null,
  hidden: {},
  isolatedId: null,
  mode: "cad",
  explode: 0,
  xray: false,
  showDims: true,
  showEnvelopes: true,
  cameraPreset: "iso",
  cameraNonce: 0,
  previewRevisionId: null,
  select: (id) => set({ selectedId: id }),
  toggleHidden: (id) => set((s) => ({ hidden: { ...s.hidden, [id]: !s.hidden[id] } })),
  isolate: (id) => set({ isolatedId: id }),
  set: (p) => set(p),
  setCamera: (c) => set((s) => ({ cameraPreset: c, cameraNonce: s.cameraNonce + 1 })),
  fit: () => set((s) => ({ cameraNonce: s.cameraNonce + 1 })),
}));
