import { useEffect, useMemo, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import type { Part, Project, Vec3 } from "@/lib/domain/types";
import { knownSize, partFullyConfirmed } from "@/lib/domain/dimensions";
import { referencePresentation } from "@/lib/domain/reference-presentation";
import { useViewer } from "@/lib/store/viewer-store";
import { AppearanceMesh } from "./AppearanceMesh";
import { SceneLabel } from "./SceneLabel";

/** Pre-build inspection gallery. Its layout/scale never writes assembly placements or sizes. */
export function ComponentGallery({
  parts,
  visualAssets,
}: {
  parts: Part[];
  visualAssets: Project["visualAssets"];
}) {
  const v = useViewer();
  const controls = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const columns = Math.min(3, Math.max(1, parts.length));
  const rows = Math.ceil(parts.length / columns);
  const items = useMemo(
    () =>
      parts.map((part) => {
        const assets = visualAssets?.filter((a) => a.part_id === part.id) ?? [];
        const asset = assets.find((a) => a.id === part.visualAssetId) ?? assets.at(-1);
        // The gallery is intentionally normalized for inspection, even after measurements arrive.
        return { part, asset, presentation: asset ? referencePresentation(asset, null) : null };
      }),
    [parts, visualAssets],
  );
  useEffect(() => {
    const distance = Math.max(columns, rows) * 0.075;
    const positions: Record<string, Vec3> = {
      iso: [distance * 0.8, distance * 0.8, distance],
      top: [0, distance * 1.6, 0.0001],
      front: [0, 0.035, distance * 1.6],
      side: [distance * 1.6, 0.035, 0],
    };
    const pos = positions[v.cameraPreset]!;
    void controls.current?.setLookAt(...pos, 0, 0.02, 0, true);
  }, [v.cameraNonce, columns, rows, v.cameraPreset]);
  return (
    <>
      <CameraControls ref={controls} makeDefault minDistance={0.03} maxDistance={2} />
      {items.map(({ part, asset, presentation }, i) => {
        if (v.hidden[part.id] || (v.isolatedId && v.isolatedId !== part.id)) return null;
        const measured = partFullyConfirmed(part) ? knownSize(part) : null;
        return (
          <group
            key={part.id}
            position={[
              ((i % columns) - (columns - 1) / 2) * 0.065,
              0,
              (Math.floor(i / columns) - (rows - 1) / 2) * 0.075,
            ]}
          >
            {asset && presentation ? (
              <AppearanceMesh
                asset={asset}
                alignment={presentation.alignment}
                partId={part.id}
                selected={v.selectedId === part.id}
              />
            ) : (
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  v.select(part.id);
                }}
                position={[0, 0.002, 0]}
              >
                <sphereGeometry args={[0.002, 16, 12]} />
                <meshBasicMaterial color="#a4a9aa" />
              </mesh>
            )}
            <SceneLabel position={[0, 0, 0.027]} center>
              <span className="block max-w-36 rounded-sm bg-white/90 px-2 py-1 text-center text-xs text-foreground">
                {part.label}
                <span className="block text-[10px] text-muted-foreground">
                  {measured ? `${measured.join(" × ")} mm · confirmed` : "Size unconfirmed"}
                  {!asset && <span className="block">3D model pending</span>}
                </span>
              </span>
            </SceneLabel>
          </group>
        );
      })}
    </>
  );
}
