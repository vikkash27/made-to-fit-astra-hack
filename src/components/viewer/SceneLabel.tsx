import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3 } from "three";

/** Labels live outside the Canvas DOM tree, so scene cleanup cannot race its removal. */
export function SceneLabel({
  children,
  position,
  center = false,
  zIndexRange = [10, 0],
}: {
  children: ReactNode;
  position: [number, number, number];
  center?: boolean;
  zIndexRange?: [number, number];
}) {
  const { gl } = useThree();
  const group = useRef<Group>(null);
  const root = useRef<Root | null>(null);
  const element = useRef<HTMLDivElement | null>(null);
  const [point] = useState(() => new Vector3());

  useEffect(() => {
    const host = gl.domElement.closest("[data-viewer-root]")?.querySelector("[data-viewer-labels]");
    if (!host) return;
    const currentElement = document.createElement("div");
    currentElement.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;";
    host.appendChild(currentElement);
    const currentRoot = createRoot(currentElement);
    element.current = currentElement;
    root.current = currentRoot;
    return () => {
      if (root.current === currentRoot) root.current = null;
      if (element.current === currentElement) element.current = null;
      // React 19 forbids synchronously unmounting a second root during another commit.
      queueMicrotask(() => {
        currentRoot.unmount();
        currentElement.remove();
      });
    };
  }, [gl]);

  useEffect(() => {
    root.current?.render(
      <div style={{ transform: center ? "translate(-50%, -50%)" : undefined }}>{children}</div>,
    );
  }, [children, center]);

  useFrame(({ camera, size }) => {
    if (!group.current || !root.current || !element.current) return;
    group.current.getWorldPosition(point);
    point.project(camera);
    element.current.style.display = point.z < -1 || point.z > 1 ? "none" : "block";
    element.current.style.transform = `translate(${((point.x + 1) * size.width) / 2}px, ${((1 - point.y) * size.height) / 2}px)`;
    element.current.style.zIndex = String(
      Math.round(zIndexRange[0] - ((point.z + 1) / 2) * (zIndexRange[0] - zIndexRange[1])),
    );
  });

  // Keep DOM-only development source annotations off this Three.js object.
  return createElement("group", { ref: group, position });
}
