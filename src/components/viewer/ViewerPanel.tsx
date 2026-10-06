import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Box, Eye, Maximize2, Ruler, ScanLine } from "lucide-react";
import type { EnclosureParams, Part, Revision, Project } from "@/lib/domain/types";
import { useViewer, type CameraPreset, type ViewMode } from "@/lib/store/viewer-store";

const Viewer = lazy(() => import("./Viewer"));

export function ViewerPanel({
  parts,
  params,
  provenance,
  compact,
  revision,
  visualAssets,
}: {
  parts: Part[];
  params: EnclosureParams | null;
  provenance: string;
  compact?: boolean;
  revision?: Revision | null;
  visualAssets?: Project["visualAssets"];
}) {
  const fallback = (
    <div className="grid h-full place-items-center label-mono text-muted-foreground">
      Loading viewer…
    </div>
  );
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      <ViewerToolbar compact={compact} position="top" revision={revision} />
      <div className="relative min-h-0 flex-1">
        <ClientOnly fallback={fallback}>
          <Suspense fallback={fallback}>
            <Viewer
              parts={parts}
              params={params}
              provenance={provenance}
              revision={revision}
              visualAssets={visualAssets}
            />
          </Suspense>
        </ClientOnly>
      </div>
      <ViewerToolbar compact={compact} position="bottom" revision={revision} />
    </div>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-muted p-1 ">
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`min-h-8 rounded-full px-3 py-1 text-xs ${value === o.v ? "bg-white font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
  label,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex items-center gap-1.5 min-h-9 rounded-full border px-3 py-2 text-xs  ${on ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-background/80 text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function ViewerToolbar({
  compact,
  position,
  revision,
}: {
  compact?: boolean;
  position: "top" | "bottom";
  revision?: Revision | null;
  visualAssets?: Project["visualAssets"];
}) {
  const v = useViewer();
  return (
    <>
      {position === "top" && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <Seg<ViewMode>
            label="View mode"
            value={v.mode}
            onChange={(mode) => v.set({ mode })}
            options={[
              { v: "cad", l: "CAD" },
              { v: "rendered", l: "Rendered" },
              { v: "overlay", l: "Overlay" },
            ]}
          />
          {!compact && (
            <Seg<CameraPreset>
              label="Camera"
              value={v.cameraPreset}
              onChange={(c) => v.setCamera(c)}
              options={[
                { v: "iso", l: "Iso" },
                { v: "top", l: "Top" },
                { v: "front", l: "Front" },
                { v: "side", l: "Side" },
              ]}
            />
          )}
          <Toggle label="Fit to view" on={false} onClick={v.fit}>
            <Maximize2 className="size-3.5" /> Fit
          </Toggle>
        </div>
      )}
      {position === "bottom" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
          <Toggle label="X-ray enclosure" on={v.xray} onClick={() => v.set({ xray: !v.xray })}>
            <ScanLine className="size-3.5" /> X-ray
          </Toggle>
          <Toggle
            label="Show dimensions"
            on={v.showDims}
            onClick={() => v.set({ showDims: !v.showDims })}
          >
            <Ruler className="size-3.5" /> Dims
          </Toggle>
          <Toggle
            label="Show envelopes"
            on={v.showEnvelopes}
            onClick={() => v.set({ showEnvelopes: !v.showEnvelopes })}
          >
            <Box className="size-3.5" /> Envelopes
          </Toggle>
          {v.isolatedId && (
            <Toggle label="Exit isolate" on onClick={() => v.isolate(null)}>
              <Eye className="size-3.5" /> Show all
            </Toggle>
          )}
          <label className="flex items-center gap-2 min-h-9 rounded-full border border-border bg-white px-3 py-2 text-xs text-muted-foreground ">
            Explode
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={v.explode}
              onChange={(e) => v.set({ explode: Number(e.target.value) })}
              className="w-24 accent-[var(--color-primary)]"
              aria-label="Explode amount (display only)"
            />
          </label>
        </div>
      )}
      {position === "bottom" && (
        <p className="px-3 pb-3 text-xs leading-relaxed text-muted-foreground">
          {v.mode === "rendered"
            ? revision?.assembly
              ? "Generated appearances follow the measured layout. Alignment previews show appearance; fit checks use confirmed dimensions."
              : "Generated models are arranged for inspection, not at physical scale. Confirm measurements to check fit."
            : v.mode === "overlay"
              ? "Generated appearance previews; built CAD also shows measured envelopes. The envelope governs fit."
              : "Measured geometry. Drag to orbit; scroll or pinch to zoom."}
        </p>
      )}
    </>
  );
}
