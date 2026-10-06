import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CameraControls, Edges } from "@react-three/drei";
import { SceneLabel as Html } from "./SceneLabel";
import { Box3, BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from "three";
import { AppearanceMesh } from "./AppearanceMesh";
import { referencePresentation } from "@/lib/domain/reference-presentation";
import type {
  AssemblyPartRecord,
  AssemblyRecord,
  VisualAssetRecord,
} from "@/lib/api/backend-types";
import { getAdapter, ApiError } from "@/lib/api";
import { cadToScene, cadSizeToScene } from "@/lib/domain/units";
import { useViewer } from "@/lib/store/viewer-store";

interface MeshData {
  positions: number[];
  indices: number[];
  units: string;
  frame: string;
  geometry_space: string;
  part_id: string;
  revision_id: string;
  spec_hash: string;
}
async function artifactData(id: string) {
  const read = getAdapter().getArtifactData;
  if (!read) throw new Error("CAD artifacts require the live backend.");
  return read(id);
}

/** Backend vertices are already metres/Y-up; only the encoded placement matrix is applied. */
export function CadScene({
  manifest,
  visualAssets,
}: {
  manifest: AssemblyRecord;
  visualAssets?: VisualAssetRecord[];
}) {
  const v = useViewer();
  const controls = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const meshes = useQuery({
    queryKey: ["cad-mesh", manifest.revision_id, manifest.spec_hash],
    staleTime: Infinity,
    retry: false,
    queryFn: () =>
      Promise.all(
        manifest.parts.map(async (p) => {
          const data = JSON.parse(
            new TextDecoder().decode(await artifactData(p.mesh_artifact.id)),
          ) as MeshData;
          if (
            data.units !== "m" ||
            data.frame !== "renderer_y_up" ||
            data.geometry_space !== "part_local" ||
            data.part_id !== p.part_id ||
            data.revision_id !== manifest.revision_id ||
            data.spec_hash !== manifest.spec_hash ||
            p.mesh_artifact.spec_hash !== manifest.spec_hash
          )
            throw new ApiError(
              "preview_identity",
              "CAD preview does not match this frozen revision.",
              409,
              false,
            );
          return data;
        }),
      ),
  });
  const box = useMemo(() => {
    const result = new Box3();
    for (const part of manifest.parts) {
      // CAD bounds are millimetres; coordinate conversion stays in units.ts.
      result.expandByPoint(new Vector3(...cadToScene(part.bounds.min_mm)));
      result.expandByPoint(new Vector3(...cadToScene(part.bounds.max_mm)));
    }
    return result;
  }, [manifest]);
  const center = box.getCenter(new Vector3());
  const dimensions = box.getSize(new Vector3());
  const extent = Math.max(dimensions.x, dimensions.y, dimensions.z);
  const centerX = center.x,
    centerY = center.y,
    centerZ = center.z;
  // Mode/material/selection changes never reset the camera. Bounds changes require an explicit fit.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const distance = extent * 2.8;
    const poses: Record<string, [number, number, number]> = {
      iso: [distance * 0.8, distance * 0.75, distance * 0.8],
      top: [0, distance * 1.5, 0.00001],
      front: [0, 0, distance * 1.5],
      side: [distance * 1.5, 0, 0],
    };
    const p = poses[v.cameraPreset]!;
    void c.setLookAt(p[0], p[1] + dimensions.y / 2, p[2], 0, dimensions.y / 2, 0, true);
    // Camera is user-owned after initial fit, even when a different revision changes bounds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.cameraNonce]);
  return (
    <>
      <CameraControls
        ref={controls}
        makeDefault
        minDistance={Math.max(0.005, extent * 0.15)}
        maxDistance={Math.max(2, extent * 12)}
      />
      <group position={[-centerX, -centerY + dimensions.y / 2, -centerZ]}>
        {meshes.data?.map((data, i) => {
          const part = manifest.parts[i]!;
          const isEnclosure = part.role === "printable_cad";
          const hidden = v.hidden[part.part_id] || (isEnclosure && v.hidden["enclosure"]);
          const isolated =
            v.isolatedId &&
            v.isolatedId !== part.part_id &&
            !(v.isolatedId === "enclosure" && isEnclosure);
          const candidates = visualAssets?.filter((a) => a.part_id === part.part_id) ?? [];
          const asset = candidates.find((a) => a.id === part.visual_asset_id) ?? candidates.at(-1);
          return hidden || isolated ? null : (
            <CadPart key={part.part_id} part={part} data={data} index={i} asset={asset} />
          );
        })}
      </group>
      {(meshes.isLoading || meshes.error) && (
        <Html center position={[0, dimensions.y / 2, 0]}>
          <div
            role={meshes.error ? "alert" : "status"}
            className="max-w-xs rounded-sm border border-border bg-background p-3 text-sm text-foreground"
          >
            {meshes.error?.message ?? "Loading CAD tessellation…"}
          </div>
        </Html>
      )}
    </>
  );
}

function CadPart({
  part,
  data,
  index,
  asset,
}: {
  part: AssemblyPartRecord;
  data: MeshData;
  index: number;
  asset?: VisualAssetRecord;
}) {
  const v = useViewer();
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(data.positions, 3));
    g.setIndex(data.indices);
    g.computeVertexNormals();
    g.computeBoundingBox();
    return g;
  }, [data]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const matrix = useMemo(
    () => new Matrix4().fromArray(part.renderer_transform_matrix),
    [part.renderer_transform_matrix],
  );
  const enclosure = part.role === "printable_cad";
  const selected = v.selectedId === part.part_id || (enclosure && v.selectedId === "enclosure");
  const lift = v.explode * (part.part_id === "lid" ? 0.055 : enclosure ? 0 : 0.012 + index * 0.009);
  const presentation = useMemo(
    () => (asset ? referencePresentation(asset, part.size_mm) : null),
    [asset, part.size_mm],
  );
  const showVisual = !enclosure && !!presentation && v.mode !== "cad";
  const showEnvelope =
    enclosure || (v.mode === "cad" ? v.showEnvelopes : !showVisual || v.mode === "overlay");
  return (
    <group position={[0, lift, 0]}>
      <group matrix={matrix} matrixAutoUpdate={false}>
        {showEnvelope && (
          <mesh
            geometry={geometry}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              v.select(part.part_id);
            }}
          >
            <meshStandardMaterial
              color={
                selected
                  ? "#e98254"
                  : enclosure
                    ? v.mode === "rendered"
                      ? "#e9e4d8"
                      : "#9aa1a6"
                    : "#a38b70"
              }
              roughness={0.75}
              transparent={(enclosure && v.xray) || v.mode === "overlay"}
              opacity={enclosure && v.xray ? 0.14 : v.mode === "overlay" ? 0.35 : 1}
              depthWrite={!(enclosure && v.xray) && v.mode !== "overlay"}
            />
            {(v.mode !== "rendered" || selected) && (
              <Edges color={selected ? "#e98254" : "#4a5055"} threshold={20} />
            )}
          </mesh>
        )}
        {showVisual && asset && (
          <AppearanceMesh
            asset={asset}
            alignment={presentation!.alignment}
            selected={selected}
            partId={part.part_id}
            fallback={
              <mesh geometry={geometry}>
                <meshStandardMaterial color="#a38b70" wireframe />
              </mesh>
            }
          />
        )}
        {v.showDims && (selected || (!v.selectedId && part.part_id === "base")) && (
          <Html position={[0, cadSizeToScene(part.size_mm)[1] + 0.004, 0]} zIndexRange={[10, 0]}>
            <span className="whitespace-nowrap rounded-sm bg-background/80 px-1.5 py-0.5 text-[10px] text-foreground">
              {part.name} · {part.size_mm.map((n) => n.toFixed(1)).join(" × ")} mm
            </span>
          </Html>
        )}
        {!enclosure && showVisual && !presentation?.reviewed && selected && (
          <Html position={[0, 0, 0]} zIndexRange={[10, 0]}>
            <span className="whitespace-nowrap bg-background/85 px-2 py-1 text-[10px] text-warning">
              Automatic appearance fit · alignment unreviewed
            </span>
          </Html>
        )}
      </group>
    </group>
  );
}
