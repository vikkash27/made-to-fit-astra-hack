import { useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { useQuery } from "@tanstack/react-query";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { VisualAssetRecord } from "@/lib/api/backend-types";
import { getAdapter } from "@/lib/api";
import type { ReferenceAlignment } from "@/lib/domain/reference-alignment";
import type { Vec3 } from "@/lib/domain/types";
import { cadToScene, cadSizeToScene } from "@/lib/domain/units";
import { ErrorNote } from "@/components/workspace/ui";

/** Inspect the original appearance in its own frame; never imply millimetres or checked fit. */
export default function ReferenceViewer({
  asset,
  alignment,
  size,
}: {
  asset: VisualAssetRecord;
  alignment?: ReferenceAlignment;
  size?: Vec3;
}) {
  const q = useQuery({
    queryKey: ["reference-inspection", asset.id],
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const file = asset.preview ?? asset.original,
        read = getAdapter().getArtifactData;
      if (!file || !read) throw new Error("Reference artifact unavailable.");
      return (await new GLTFLoader().parseAsync(await read(file.id), "")).scene;
    },
  });
  const scene = useMemo(() => q.data?.clone(true), [q.data]);
  return (
    <div className="relative h-[300px] overflow-hidden rounded-sm border border-border">
      {scene && (
        <Canvas camera={{ position: [3, 2, 3], fov: 40 }} dpr={[1, 1.5]}>
          <color attach="background" args={["#ffffff"]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[3, 5, 2]} intensity={3} />
          <Suspense fallback={null}>
            <Bounds
              key={alignment ? JSON.stringify(alignment) : "original"}
              fit
              clip
              observe
              margin={1.3}
            >
              <group
                scale={alignment?.scale ?? 1}
                position={alignment?.position}
                quaternion={alignment?.rotation}
              >
                <primitive object={scene} />
              </group>
              {size && (
                <mesh position={cadToScene(size.map((n) => n / 2) as Vec3)}>
                  <boxGeometry args={cadSizeToScene(size)} />
                  <meshBasicMaterial wireframe color="#e98254" />
                </mesh>
              )}
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      )}
      {q.isPending && (
        <p role="status" className="p-4 text-sm">
          Loading 3D model…
        </p>
      )}
      {q.error && (
        <div className="p-4">
          <ErrorNote error={q.error} />
        </div>
      )}
      <p className="pointer-events-none absolute bottom-3 left-3 bg-background/85 px-2 py-1 text-[11px] text-foreground">
        {alignment
          ? "Illustrative appearance · orange measured envelope"
          : "3D appearance model · measurements unverified"}
      </p>
    </div>
  );
}
