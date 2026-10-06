import { lazy, Suspense, useState } from "react";
import { Quaternion, Vector3 } from "three";
import type { VisualAssetRecord } from "@/lib/api/backend-types";
import type { Part, Vec3 } from "@/lib/domain/types";
import { knownSize, partFullyConfirmed } from "@/lib/domain/dimensions";
import {
  fitReference,
  suggestReferenceAlignment,
  type ReferenceAlignment,
} from "@/lib/domain/reference-alignment";
import { useProjectAction } from "@/lib/api/hooks";
import { getAdapter } from "@/lib/api";
import { Btn, ErrorNote } from "./ui";
const ReferenceViewer = lazy(() => import("@/components/viewer/ReferenceViewer"));

export function ReferenceReview({
  asset,
  projectId,
  part,
}: {
  asset: VisualAssetRecord;
  projectId: string;
  part?: Part;
}) {
  const [alignment, setAlignment] = useState<ReferenceAlignment | null>(null);
  const size = part && partFullyConfirmed(part) ? knownSize(part) : null;
  const bounds = asset.calibration.bounds;
  const review = useProjectAction(projectId, (ad) =>
    ad.reviewReference && alignment && size
      ? ad.reviewReference(asset.id, { ...alignment, size })
      : Promise.reject(new Error("Confirm dimensions and preview an alignment first.")),
  );
  const file = asset.preview ?? asset.original;
  const rotate = (axis: Vec3) => {
    if (!alignment || !bounds || !size) return;
    const q = new Quaternion()
      .setFromAxisAngle(new Vector3(...axis), Math.PI / 2)
      .multiply(new Quaternion(...alignment.rotation));
    setAlignment(fitReference(bounds, size, q.toArray() as ReferenceAlignment["rotation"]));
  };
  return (
    <div className="mt-4 border-t border-border pt-3 text-sm">
      <p>
        {part?.label ?? asset.part_id} ·{" "}
        {asset.calibration.status === "reviewed" ? "Appearance aligned" : "Alignment needed"}
      </p>
      <p className="my-2 text-xs text-muted-foreground">
        Rendered mode uses this model after you review its alignment. CAD and checks use the
        measured envelope; Rodin supplies appearance only.
      </p>
      {file && (
        <a
          className="text-primary underline"
          href={`${getAdapter().resolveArtifactUrl(file.url)}?download=true`}
          download={file.filename}
        >
          Download original reference
        </a>
      )}
      {!size ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Confirm this part’s three physical dimensions before aligning it inside the enclosure.
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs">Confirmed envelope: {size.join(" × ")} mm</p>
          <Btn
            className="my-3"
            variant="outline"
            disabled={!bounds}
            onClick={() => bounds && setAlignment(suggestReferenceAlignment(bounds, size))}
          >
            Preview alignment to measurements
          </Btn>
          {alignment && (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <Btn variant="outline" onClick={() => rotate([1, 0, 0])}>
                  Rotate X 90°
                </Btn>
                <Btn variant="outline" onClick={() => rotate([0, 1, 0])}>
                  Rotate Y 90°
                </Btn>
                <Btn variant="outline" onClick={() => rotate([0, 0, 1])}>
                  Rotate Z 90°
                </Btn>
              </div>
              <Suspense fallback={<p>Loading alignment preview…</p>}>
                <ReferenceViewer asset={asset} alignment={alignment} size={size} />
              </Suspense>
              <p className="my-3 text-xs text-muted-foreground">
                Orange outline is the measured envelope. Check the model orientation before
                applying. Uniform scaling preserves the generated shape; it may not fill every
                dimension.
              </p>
              <Btn variant="primary" disabled={review.isPending} onClick={() => review.mutate([])}>
                Use this appearance in Rendered mode
              </Btn>
              <ErrorNote error={review.error} />
            </>
          )}
        </>
      )}
    </div>
  );
}
