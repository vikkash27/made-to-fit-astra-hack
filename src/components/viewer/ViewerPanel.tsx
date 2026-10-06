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
    <div className="relative h-full w-full">
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
      <ViewerToolbar compact={compact} />
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
    <div
      role="radiogroup"
      aria-label={label}
      className="flex rounded-md border border-border bg-background/80 p-0.5 backdrop-blur"
    >
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-sm px-2.5 py-1 text-xs ${value === o.v ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs backdrop-blur ${on ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-background/80 text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function ViewerToolbar({
  compact,
}: {
  compact?: boolean;
  revision?: Revision | null;
  visualAssets?: Project["visualAssets"];
}) {
  const v = useViewer();
  return (
    <>
      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
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
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
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
        <label className="flex items-center gap-2 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
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
    </>
  );
}
