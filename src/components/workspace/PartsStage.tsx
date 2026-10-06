import { JobProgress } from "./JobProgress";
import { latestJob } from "@/lib/domain/job-timing";
import { useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Box, Check, Expand, Plus, Trash2, Upload } from "lucide-react";
import type { Part, Project, Stage } from "@/lib/domain/types";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { SAMPLE_PHOTO_URL } from "@/lib/api/fixture-adapter";

import { useViewer } from "@/lib/store/viewer-store";
import { PartReference } from "./PartReference";
import { AskAstra } from "./WorkspaceAssistant";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Brief, ExperienceChips } from "./Brief";
import { Btn, ErrorNote, SampleTag } from "./ui";
import { ReferenceReview } from "./ReferenceReview";

const CATS: Part["category"][] = ["controller", "display", "sensor", "battery", "other"];

export function PartsStage({
  project,
  startAdding,
  go,
}: {
  project: Project;
  startAdding?: boolean;
  go: (s: Stage) => void;
}) {
  const [adding, setAdding] = useState(!!startAdding);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const selected = useViewer((s) => s.selectedId);
  const select = useViewer((s) => s.select);
  const selectedPhotoId = project.parts.find((p) => p.id === selected)?.photoId;
  const photo =
    project.photos.find((p) => p.id === (photoId ?? selectedPhotoId)) ??
    project.photos[project.photos.length - 1];
  const analysisJob = latestJob(project.jobs, "photo_analysis");
  const analyzing =
    analysisJob && (analysisJob.stage === "queued" || analysisJob.stage === "running");

  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useProjectAction(project.id, async (ad, files: File[]) => {
    if (files.length > 5)
      throw new Error(
        "Choose up to five photos at a time, then review those parts before adding more.",
      );
    const ids: string[] = [];
    for (const file of files) ids.push((await ad.uploadPhoto(project.id, file)).id);
    setPhotoId(null);
    return ad.analyzePhotos(project.id, ids);
  });
  const retryAnalysis = useProjectAction(project.id, (ad) =>
    ad.analyzePhotos(project.id, photo ? [photo.id] : []),
  );
  const useSample = async () => {
    const blob = await (await fetch(SAMPLE_PHOTO_URL)).blob();
    upload.mutate([[new File([blob], "sample-parts.jpg", { type: "image/jpeg" })]]);
  };

  const sel = project.parts.find((p) => p.id === selected);
  const hasSample = project.parts.some((p) => p.sample);

  const reviewed = project.parts.filter((p) => !!p.identityAccepted).length;
  const nextPart = project.parts.find((p) => !p.identityAccepted);
  const allReviewed = project.parts.length > 0 && !nextPart;

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="stage-heading">
            {project.parts.length ? "Let’s review your parts." : "Start with the parts you have."}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {project.parts.length
              ? "Select a part to check its name and photo crop. Measurements come next."
              : "Upload a clear photo or add a part by hand. Astra can suggest what it is."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Add photos
          </Btn>
          <AskAstra prompt="Help me review the components in this project" />
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) upload.mutate([files]);
          e.target.value = "";
        }}
      />
      <div className="parts-layout">
        <section
          className="min-w-0"
          aria-label="Parts photo"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter((f) =>
              f.type.startsWith("image/"),
            );
            if (files.length) upload.mutate([files]);
          }}
        >
          {photo ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2" aria-label="Uploaded photos">
                  {project.photos.map((p, i) => (
                    <button
                      key={p.id}
                      aria-pressed={p.id === photo.id}
                      onClick={() => {
                        select(null);
                        setPhotoId(p.id);
                      }}
                      className={`rounded-full px-3 py-2 text-xs ${p.id === photo.id ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      Photo {i + 1}
                    </button>
                  ))}
                </div>
                <Btn aria-label="Open photo" onClick={() => setPhotoOpen(true)}>
                  <Expand className="size-4" />
                  Full size
                </Btn>
              </div>
              <div className="parts-photo flex items-center justify-center overflow-hidden rounded-lg bg-muted/40 p-5 sm:p-8">
                <div className="relative w-full max-w-[860px]">
                  <img
                    src={photo.url}
                    alt="Your parts photo. Select a labelled region to review it."
                    className="w-full rounded-md"
                  />
                  {project.parts.map((p, i) =>
                    p.anchor && p.photoId === photo.id ? (
                      <button
                        key={p.id}
                        onClick={() => select(p.id)}
                        aria-pressed={selected === p.id}
                        aria-label={`Review ${p.label}`}
                        className={`absolute rounded-sm border-2 transition-colors ${selected === p.id ? "border-primary bg-primary/10" : p.identityAccepted ? "border-success/60 hover:border-success" : "border-white/80 hover:border-primary"}`}
                        style={{
                          left: `${p.anchor.x * 100}%`,
                          top: `${p.anchor.y * 100}%`,
                          width: `${p.anchor.w * 100}%`,
                          height: `${p.anchor.h * 100}%`,
                        }}
                      >
                        <span className="absolute -top-3 left-1 grid size-6 place-items-center rounded-full bg-white text-xs font-semibold text-primary shadow-sm">
                          {i + 1}
                        </span>
                      </button>
                    ) : null,
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Numbered regions match the parts list. Confirming an identity does not confirm its
                physical size.
              </p>
            </>
          ) : (
            <div className="parts-photo flex flex-col items-center justify-center rounded-lg border border-dashed border-input bg-muted/40 p-6 text-center">
              <Upload className="size-8 text-primary" />
              <h2 className="mt-4 text-xl font-medium">Bring your hardware into view</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Drop up to five photos here. Keep parts separate and show labels and connectors.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Btn variant="primary" onClick={() => fileRef.current?.click()}>
                  Choose photos
                </Btn>
                <Btn
                  variant="outline"
                  onClick={() => {
                    select(null);
                    setAdding(true);
                  }}
                >
                  Add a part manually
                </Btn>
              </div>
              {getAdapter().mode === "fixture" && (
                <button onClick={useSample} className="mt-4 text-xs text-primary underline">
                  Try the sample photo · UI preview
                </button>
              )}
            </div>
          )}
          {analyzing && (
            <div className="mt-4" role="status">
              <JobProgress job={analysisJob} />
            </div>
          )}
          {hasSample && (
            <p className="mt-3 text-xs text-warning">
              <SampleTag /> Sample parts are not recognition results from this photo.
            </p>
          )}
          <ErrorNote error={upload.error ?? retryAnalysis.error} />
          {analysisJob?.stage === "failed" && (
            <div className="mt-4 rounded-md bg-destructive/5 p-4">
              <JobProgress job={analysisJob} compact />
              <Btn
                variant="outline"
                className="mt-3"
                disabled={upload.isPending || !photo}
                onClick={() => retryAnalysis.mutate([])}
              >
                Retry photo analysis
              </Btn>
            </div>
          )}
          {(sel || adding) && (
            <section id="part-review" className="mt-6" aria-label="Review selected part">
              <PartEditor
                key={adding ? "new" : sel?.id}
                project={project}
                part={adding ? undefined : sel}
                onDone={() => {
                  setAdding(false);
                  select(null);
                }}
              />
            </section>
          )}
        </section>
        <aside className="min-w-0">
          <div className="mb-6 rounded-lg bg-accent p-4">
            <h3 className="text-sm font-semibold">
              {allReviewed ? "Your parts are ready." : "Your next step"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {allReviewed
                ? project.goal
                  ? "Review the measurements for your idea, then create an enclosure draft."
                  : "Choose what you’d like to make with this hardware."
                : nextPart
                  ? `Check ${nextPart.label.toLowerCase()} and confirm its identity.`
                  : "Add your first photo or part to start a project."}
            </p>
            <Btn
              variant="primary"
              className="mt-4 w-full"
              disabled={!!analyzing}
              onClick={() =>
                allReviewed
                  ? go(project.goal ? "confirm" : "discover")
                  : nextPart
                    ? select(nextPart.id)
                    : fileRef.current?.click()
              }
            >
              {allReviewed
                ? project.goal
                  ? "Continue to measurements"
                  : "Choose a project"
                : nextPart
                  ? "Review next part"
                  : "Choose photos"}
              <ArrowRight className="size-4" />
            </Btn>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your parts</h2>
            <span className="rounded-full bg-success/10 px-3 py-1 text-xs text-success">
              {reviewed}/{project.parts.length} reviewed
            </span>
          </div>
          <div className="mt-4 space-y-1">
            {project.parts.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setAdding(false);
                  select(p.id);
                }}
                aria-pressed={selected === p.id}
                className={`flex w-full items-center gap-3 rounded-md p-3 text-left ${selected === p.id ? "bg-accent ring-1 ring-primary/30" : "hover:bg-muted"}`}
              >
                <PartThumbnail project={project} part={p} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {i + 1}. {p.label}
                  </span>
                  {(p.identityAccepted || p.identityProposed) && (
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {p.identityAccepted ? p.identityAccepted : `Suggested: ${p.identityProposed}`}
                    </span>
                  )}
                  <span
                    className={`mt-1 flex items-center gap-1 text-xs ${p.identityAccepted ? "text-success" : "text-warning"}`}
                  >
                    {p.identityAccepted ? (
                      <Check className="size-3" />
                    ) : (
                      <AlertTriangle className="size-3" />
                    )}
                    {p.identityAccepted ? "Identity confirmed" : "Review identity & crop"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {p.visualAssetId
                      ? "3D model ready"
                      : project.jobs.some(
                            (j) =>
                              j.kind === "reference" &&
                              j.partId === p.id &&
                              (j.stage === "running" || j.stage === "queued"),
                          )
                        ? "Creating 3D model…"
                        : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Btn
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              select(null);
              setAdding(true);
            }}
          >
            <Plus className="size-4" />
            Add a part
          </Btn>
          <details className="mt-6 border-t border-border pt-4">
            <summary className="text-sm font-medium">Project brief & preferences</summary>
            <div className="mt-4">
              <Brief project={project} />
              <ExperienceChips project={project} />
            </div>
          </details>
          <details className="mt-5 border-t border-border pt-4">
            <summary className="text-sm font-medium">Photo tips</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Use clear, well-lit photos with parts separated. Include labels and side views of tall
              components. Photos help identify parts; use a ruler or calipers for measurements.
            </p>
          </details>
        </aside>
      </div>
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="theme-studio-light max-w-[95vw] bg-white text-foreground">
          <DialogTitle>Parts photo</DialogTitle>
          <DialogDescription>Review the original photo at full size.</DialogDescription>
          {photo && (
            <img
              src={photo.url}
              alt="Your uploaded parts photo, full size"
              className="max-h-[80dvh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PartThumbnail({ project, part }: { project: Project; part: Part }) {
  const photo = project.photos.find((p) => p.id === part.photoId);
  const crop = part.anchor;
  return (
    <span
      className="relative block h-14 w-16 shrink-0 overflow-hidden rounded-sm bg-muted"
      aria-hidden="true"
    >
      {photo ? (
        <img
          src={photo.url}
          alt=""
          className="absolute max-w-none"
          style={
            crop
              ? {
                  width: `${100 / crop.w}%`,
                  height: `${100 / crop.h}%`,
                  left: `${(-100 * crop.x) / crop.w}%`,
                  top: `${(-100 * crop.y) / crop.h}%`,
                }
              : { width: "100%", height: "100%", objectFit: "cover" }
          }
        />
      ) : (
        <Box className="m-auto mt-4 size-6 text-muted-foreground" />
      )}
    </span>
  );
}

function PartEditor({
  project,
  part,
  onDone,
}: {
  project: Project;
  part?: Part;
  onDone: () => void;
}) {
  const [label, setLabel] = useState(part?.label ?? "");
  const [identity, setIdentity] = useState(part?.identityAccepted ?? part?.identityProposed ?? "");
  const [crop, setCrop] = useState(() =>
    part?.anchor
      ? [
          part.anchor.x,
          part.anchor.y,
          part.anchor.x + part.anchor.w,
          part.anchor.y + part.anchor.h,
        ].map((n) => String(Math.round(n * 1000) / 10))
      : [],
  );
  const [cat, setCat] = useState<Part["category"]>(part?.category ?? "other");
  const save = useProjectAction(project.id, (ad, accept: boolean) =>
    ad.confirmComponents(project.id, project.draftVersion, [
      {
        id: part?.id,
        label: label || "Part",
        category: cat,
        identityAccepted: accept ? identity || label : (part?.identityAccepted ?? null),
        accept,
        ...(crop.length === 4 && part?.photoId
          ? {
              crop: {
                photoId: part.photoId,
                box: crop.map((n) => Number(n) / 100) as [number, number, number, number],
              },
            }
          : {}),
      },
    ]),
  );
  const remove = useProjectAction(project.id, (ad) =>
    ad.confirmComponents(project.id, project.draftVersion, [{ id: part!.id, remove: true }]),
  );

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">
        {part ? `Review ${part.label}` : "Add a part"}
      </h2>
      <label className="text-xs text-muted-foreground">
        Name
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Identity{" "}
        {part?.identityProposed && (
          <span className="text-primary">· proposed: {part.identityProposed}</span>
        )}
        <input
          aria-label="Identity"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="Model / part number"
          className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      {part?.identityProposed && !part.identityAccepted && (
        <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
          Astra prefilled this suggestion from your photo. Edit it before confirming; the exact
          model may still be unknown.
        </p>
      )}
      {part?.photoObservations && (
        <div className="space-y-3 text-sm sm:col-span-2">
          {!!part.photoObservations.markings.length && (
            <div>
              <h3 className="font-medium">Visible markings</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {part.photoObservations.markings.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          )}
          {!!part.photoObservations.connections.length && (
            <details>
              <summary className="font-medium">What Astra observed</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {part.photoObservations.connections.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </details>
          )}
          {part.photoObservations.question && !part.identityAccepted && (
            <p className="rounded-md bg-accent p-3 leading-relaxed">
              {part.photoObservations.question}
            </p>
          )}
        </div>
      )}
      <label className="text-xs text-muted-foreground">
        Type
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value as Part["category"])}
          className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        >
          {CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <Btn
          variant="primary"
          disabled={save.isPending || !label}
          onClick={() => save.mutate([true], { onSuccess: onDone })}
        >
          {part ? "Confirm identity" : "Add part"}
        </Btn>
        {part && (
          <Btn
            onClick={() => save.mutate([false], { onSuccess: onDone })}
            disabled={save.isPending}
          >
            Save
          </Btn>
        )}
        {part && (
          <Btn aria-label="Remove part" onClick={() => remove.mutate([], { onSuccess: onDone })}>
            <Trash2 className="size-4" />
          </Btn>
        )}
        <Btn onClick={onDone}>Close</Btn>
      </div>
      {crop.length === 4 && (
        <details className="sm:col-span-2">
          <summary className="text-sm">Adjust photo crop</summary>
          <fieldset className="sm:col-span-2">
            <legend className="text-xs text-muted-foreground">
              Crop box · percent of photo · left, top, right, bottom
            </legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {crop.map((value, i) => (
                <label key={i} className="text-xs text-muted-foreground">
                  {["Left", "Top", "Right", "Bottom"][i]}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={value}
                    onChange={(e) =>
                      setCrop((c) => c.map((n, j) => (j === i ? e.target.value : n)))
                    }
                    className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </details>
      )}
      {part && (
        <div className="sm:col-span-2">
          <details>
            <summary className="text-sm font-medium">3D appearance & alignment</summary>
            <PartReference project={project} part={part} />
            {project.visualAssets
              ?.filter((a) => a.part_id === part.id)
              .map((a) => (
                <ReferenceReview key={a.id} asset={a} projectId={project.id} part={part} />
              ))}
          </details>
        </div>
      )}
      <div className="sm:col-span-2">
        <ErrorNote error={save.error ?? remove.error} />
      </div>
    </div>
  );
}
