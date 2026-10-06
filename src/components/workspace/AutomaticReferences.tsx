import { useEffect, useRef } from "react";
import type { Project } from "@/lib/domain/types";
import { referenceToGenerate } from "@/lib/domain/automatic-references";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { ErrorNote } from "./ui";

/** One stable operation per reviewed crop; uncertain submissions and failures require explicit recovery. */
export function AutomaticReferences({ project }: { project: Project }) {
  const attempted = useRef(new Set<string>());
  const generate = useProjectAction(project.id, async (ad, partId: string, signature: string) => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature));
    const operation =
      "appearance-" +
      Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return ad.generateReference(project.id, [partId], operation, "detailed");
  });
  const next = referenceToGenerate(project, attempted.current);
  const nextId = next?.id;
  const { mutate, isPending, error } = generate;
  const signature = next
    ? `appearance-v1-${project.id}-${next.id}-${next.photoId}-${JSON.stringify(next.anchor)}`
    : "";
  useEffect(() => {
    if (getAdapter().mode !== "http" || !nextId || isPending || attempted.current.has(nextId))
      return;
    attempted.current.add(nextId);
    mutate([nextId, signature]);
  }, [signature, nextId, isPending, mutate]); // Backend job state prevents duplicate submissions after remount.
  if (!error) return null;
  return (
    <div className="mx-4 mt-4 sm:mx-8">
      <ErrorNote error={error} />
      <p className="mt-2 text-xs text-muted-foreground">
        Your part review is saved. Open the part’s 3D appearance tools to check or retry model
        creation.
      </p>
    </div>
  );
}
