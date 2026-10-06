import { useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { VisualAssetRecord } from "@/lib/api/backend-types";
import type { ReferenceAlignment } from "@/lib/domain/reference-alignment";
import { getAdapter } from "@/lib/api";
import { useViewer } from "@/lib/store/viewer-store";
import { SceneLabel } from "./SceneLabel";

export function AppearanceMesh({
  asset,
  alignment,
  partId,
  selected,
  fallback,
}: {
  asset: VisualAssetRecord;
  alignment: ReferenceAlignment;
  partId: string;
  selected: boolean;
  fallback?: ReactNode;
}) {
  const v = useViewer();
  const loaded = useQuery({
    queryKey: ["visual-scene", asset.id],
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const file = asset.preview ?? asset.original,
        read = getAdapter().getArtifactData;
      if (!file || !read) throw new Error("Component model unavailable.");
      return (await new GLTFLoader().parseAsync(await read(file.id), "")).scene;
    },
  });
  const scene = useMemo(() => {
    if (!loaded.data) return null;
    const copy = loaded.data.clone(true);
    copy.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const materials = (Array.isArray(o.material) ? o.material : [o.material]).map((m) => {
        const clone = m.clone();
        clone.transparent = v.mode === "overlay";
        clone.opacity = v.mode === "overlay" ? 0.65 : 1;
        clone.depthWrite = v.mode !== "overlay";
        if (selected && clone instanceof MeshStandardMaterial) {
          clone.emissive.set("#e98254");
          clone.emissiveIntensity = 0.15;
        }
        return clone;
      });
      o.material = Array.isArray(o.material) ? materials : materials[0]!;
      o.castShadow = true;
      o.receiveShadow = true;
    });
    return copy;
  }, [loaded.data, selected, v.mode]);
  useEffect(
    () => () => {
      scene?.traverse((o) => {
        if (o instanceof Mesh)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
    },
    [scene],
  );
  if (!scene)
    return (
      <>
        {fallback}
        <SceneLabel position={[0, 0.045, 0]} center>
          <span className="rounded-sm bg-white/90 px-2 py-1 text-xs text-muted-foreground">
            {loaded.error ? "Model could not load · refresh to retry" : "Loading component model…"}
          </span>
        </SceneLabel>
      </>
    );
  return (
    <group
      scale={alignment.scale}
      position={alignment.position}
      quaternion={alignment.rotation}
      onClick={(e) => {
        e.stopPropagation();
        v.select(partId);
      }}
    >
      <primitive object={scene} />
    </group>
  );
}
