import type React from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, ContactShadows, Edges, Environment, Html, Lightformer, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type { EnclosureParams, Part, Vec3 } from "@/lib/domain/types";
import { knownSize, previewEnclosureBounds } from "@/lib/domain/dimensions";
import { CAD_GROUP_ROTATION_X, CAD_GROUP_SCALE } from "@/lib/domain/units";
import { useViewer } from "@/lib/store/viewer-store";

const CAT_COLOR: Record<Part["category"], string> = {
  controller: "#2f6b45",
  display: "#1b1e22",
  sensor: "#2a4f8f",
  battery: "#b9bcbf",
  other: "#6f6a60",
};
const IVORY = "#e9e4d8";
const CAD_GREY = "#9aa1a6";
const ACCENT = "#e98254";

interface Props {
  parts: Part[];
  params: EnclosureParams | null;
  /** Shown in the canvas corner so the viewer never overstates what it is. */
  provenance: string;
}

export default function Viewer({ parts, params, provenance }: Props) {
  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0.22, 0.18, 0.22], fov: 32, near: 0.001, far: 10 }} gl={{ antialias: true }}>
        <color attach="background" args={["#141618"]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[0.4, 0.8, 0.3]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <Environment resolution={128}>
          <Lightformer intensity={1.6} position={[0, 2, 0]} scale={[4, 4, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={0.6} color="#f2d6c4" position={[-2, 0.5, 1]} rotation-y={Math.PI / 2} scale={[4, 1, 1]} />
        </Environment>
        <Scene parts={parts} params={params} />
        <ContactShadows position={[0, -0.0005, 0]} opacity={0.55} scale={0.6} blur={2.4} far={0.2} />
        <gridHelper args={[0.6, 30, "#2c3135", "#202427"]} position={[0, -0.001, 0]} />
      </Canvas>
      <div className="label-mono pointer-events-none absolute bottom-3 right-4 text-[9.5px] text-muted-foreground">{provenance}</div>
    </div>
  );
}

function Scene({ parts, params }: { parts: Part[]; params: EnclosureParams | null }) {
  const v = useViewer();
  const controls = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const bounds = useMemo(() => (params ? previewEnclosureBounds(parts, params) : null), [parts, params]);
  const center: Vec3 = bounds
    ? [(bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2, 0]
    : [30, 30, 0];
  const extent = bounds ? Math.max(...bounds.size) : 80;

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const d = (extent / 1000) * 2.6;
    const ty = (bounds ? bounds.size[2] : 20) / 2000;
    const pos: Record<string, Vec3> = {
      iso: [d * 0.8, d * 0.75, d * 0.8],
      top: [0, d * 1.5, 0.0001],
      front: [0, ty, d * 1.5],
      side: [d * 1.5, ty, 0],
    };
    const p = pos[v.cameraPreset]!;
    void c.setLookAt(p[0], p[1], p[2], 0, ty, 0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.cameraNonce, extent]);

  const visible = (p: Part) => p.visible && !v.hidden[p.id] && (!v.isolatedId || v.isolatedId === p.id);
  const encVisible = !v.isolatedId && !v.hidden["enclosure"];
  const explodeMm = v.explode * 40;

  return (
    <>
      <CameraControls ref={controls} makeDefault minDistance={0.03} maxDistance={2} />
      {/* Single CAD → renderer boundary: mm Z-up children, metres Y-up scene. */}
      <group rotation-x={CAD_GROUP_ROTATION_X} scale={CAD_GROUP_SCALE} onPointerMissed={() => v.select(null)}>
        <group position={[-center[0], -center[1], 0]}>
          {bounds && params && encVisible && (
            <Enclosure bounds={bounds} params={params} explodeMm={explodeMm} />
          )}
          {parts.map((p, i) =>
            visible(p) ? <PartMesh key={p.id} part={p} lift={v.explode * (12 + i * 9)} /> : null,
          )}
          {bounds && v.showDims && encVisible && (
            <Html position={[bounds.max[0] + 4, bounds.min[1], bounds.size[2] / 2]} center={false} zIndexRange={[10, 0]}>
              <div className="label-mono whitespace-nowrap text-[9.5px] text-muted-foreground">
                {bounds.size.map((n) => n.toFixed(1)).join(" × ")} mm
              </div>
            </Html>
          )}
        </group>
      </group>
    </>
  );
}

function Enclosure({ bounds, params, explodeMm }: { bounds: NonNullable<ReturnType<typeof previewEnclosureBounds>>; params: EnclosureParams; explodeMm: number }) {
  const v = useViewer();
  const [w, d, h] = bounds.size;
  const [x0, y0] = bounds.min;
  const t = params.wall;
  const baseH = h - params.lidThickness;
  const r = Math.min(params.cornerRadius, w / 2 - 0.5, d / 2 - 0.5);
  const selected = v.selectedId === "enclosure";
  const cx = x0 + w / 2;
  const cy = y0 + d / 2;

  const mat = (
    <meshStandardMaterial
      color={v.mode === "rendered" ? IVORY : CAD_GREY}
      roughness={v.mode === "rendered" ? 0.75 : 0.9}
      transparent={v.xray || v.mode === "overlay"}
      opacity={v.xray ? 0.14 : v.mode === "overlay" ? 0.35 : 1}
      depthWrite={!v.xray}
    />
  );
  const edgeColor = selected ? ACCENT : v.mode === "rendered" ? "#8f8a7f" : "#d7dadc";
  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    v.select("enclosure");
  };
  const walls: [Vec3, Vec3][] = [
    [[cx, y0 + t / 2, baseH / 2], [w, t, baseH]],
    [[cx, y0 + d - t / 2, baseH / 2], [w, t, baseH]],
    [[x0 + t / 2, cy, baseH / 2], [t, d - 2 * t, baseH]],
    [[x0 + w - t / 2, cy, baseH / 2], [t, d - 2 * t, baseH]],
    [[cx, cy, t / 2], [w - 2 * t, d - 2 * t, t]],
  ];
  return (
    <group onClick={onClick}>
      {walls.map(([pos, size], i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={size} />
          {mat}
          {(v.mode !== "rendered" || selected) && <Edges color={edgeColor} threshold={20} />}
        </mesh>
      ))}
      <RoundedBox
        args={[w, d, params.lidThickness]}
        radius={Math.max(0.2, Math.min(r, params.lidThickness / 2 - 0.01))}
        smoothness={3}
        position={[cx, cy, baseH + params.lidThickness / 2 + explodeMm]}
        castShadow
      >
        {mat}
        {(v.mode !== "rendered" || selected) && <Edges color={edgeColor} threshold={20} />}
      </RoundedBox>
    </group>
  );
}

function PartMesh({ part, lift }: { part: Part; lift: number }) {
  const v = useViewer();
  const size = knownSize(part);
  const selected = v.selectedId === part.id;
  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    v.select(part.id);
  };

  if (!size) {
    // Unknown dimensions: marker only. Never draw a guessed envelope.
    return (
      <group position={[part.pose[0], part.pose[1], part.pose[2] + lift]}>
        <mesh onClick={onClick}>
          <sphereGeometry args={[1.6, 16, 12]} />
          <meshBasicMaterial color={selected ? ACCENT : "#a4a9aa"} />
        </mesh>
        <Html position={[0, 0, 4]} zIndexRange={[10, 0]}>
          <div className="label-mono whitespace-nowrap text-[9px] text-warning">{part.label} · size unknown</div>
        </Html>
      </group>
    );
  }
  const [sx, sy, sz] = size;
  const pos: Vec3 = [part.pose[0] + sx / 2, part.pose[1] + sy / 2, part.pose[2] + sz / 2 + lift];
  const showRef = v.mode !== "cad";
  const engColor = selected ? ACCENT : v.mode === "rendered" ? CAT_COLOR[part.category] : "#5b6267";

  return (
    <group position={pos}>
      {(
        <mesh onClick={onClick} castShadow>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial
            color={engColor}
            metalness={v.mode === "rendered" && part.category === "battery" ? 0.6 : 0.1}
            roughness={0.55}
            transparent={v.mode === "overlay"}
            opacity={v.mode === "overlay" ? 0.55 : 1}
          />
          {(v.showEnvelopes || selected) && <Edges color={selected ? ACCENT : "#e2e4e5"} />}
        </mesh>
      )}
      {v.mode === "overlay" && showRef && (
        // Reference appearance stand-in (no calibrated Rodin mesh loaded): wireframe, slightly inset.
        <mesh scale={0.97}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshBasicMaterial color={CAT_COLOR[part.category]} wireframe />
        </mesh>
      )}
      {v.showDims && selected && (
        <Html position={[sx / 2 + 2, 0, sz / 2]} zIndexRange={[10, 0]}>
          <div className="label-mono whitespace-nowrap rounded-sm bg-background/80 px-1.5 py-0.5 text-[9.5px] text-foreground">
            {part.label} · {sx}×{sy}×{sz} mm
          </div>
        </Html>
      )}
    </group>
  );
}
