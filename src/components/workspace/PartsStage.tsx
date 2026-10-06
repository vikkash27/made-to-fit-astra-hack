import { JobProgress } from "./JobProgress";
import { latestJob } from "@/lib/domain/job-timing";
import { useRef, useState } from "react";
import { AlertTriangle, Check, Expand, Plus, Trash2, Upload } from "lucide-react";
import type { Part, Project, Stage } from "@/lib/domain/types";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { SAMPLE_PHOTO_URL } from "@/lib/api/fixture-adapter";
import { nextQuestion } from "@/lib/domain/next-question";
import { useViewer } from "@/lib/store/viewer-store";
import { PartReference } from "./PartReference";
import { AstraPanel } from "./AstraPanel";
import { Brief, ExperienceChips } from "./Brief";
import { Btn, ErrorNote, Label, SampleTag } from "./ui";
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
  const q = nextQuestion(project);
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
  const concepts = useProjectAction(project.id, (ad) =>
    ad.generateConcepts(project.id, project.draftVersion),
  );

  const useSample = async () => {
    const blob = await (await fetch(SAMPLE_PHOTO_URL)).blob();
    upload.mutate([[new File([blob], "sample-parts.jpg", { type: "image/jpeg" })]]);
  };

  const sel = project.parts.find((p) => p.id === selected);
  const hasSample = project.parts.some((p) => p.sample);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(380px,520px)_1fr]">
      <aside className="min-h-0 overflow-y-auto border-r border-border/60 px-6 py-8 lg:px-12">
        <Label>Astra / Parts review</Label>
        <h1 className="display-tight mt-5 text-[clamp(44px,5vw,72px)]">
          {project.parts.length ? (
            <>
              A useful
              <br />
              starting point.
            </>
          ) : (
            <>
              Show me
              <br />
              your parts.
            </>
          )}
        </h1>
        <p className="mt-6 max-w-md text-lg leading-snug text-foreground/85">
          {project.parts.length
            ? `These look like ${project.parts.map((p) => p.label.toLowerCase()).join(", ")}. Let’s confirm the parts, then ${project.goal ? "develop your idea" : "find a project that suits you"}.`
            : "A photo works best. You can also add parts by hand."}
        </p>

        <div className="mt-8">
          <Brief project={project} />
        </div>

        <section className="mt-8" aria-live="polite">
          <p className="mb-3 text-[15px]">{q.text}</p>
          {q.kind === "experience" && <ExperienceChips project={project} />}
          {q.kind === "identity" && (
            <Btn variant="outline" onClick={() => select(q.partId)}>
              Review this part
            </Btn>
          )}
          {(q.kind === "explore" || (q.kind === "experience" && project.parts.length > 0)) && (
            <Btn
              variant={q.kind === "explore" ? "primary" : "ghost"}
              className="mt-3"
              onClick={() =>
                project.intentMode === "discover"
                  ? go("discover")
                  : concepts.mutate([], { onSuccess: () => go("discover") })
              }
              disabled={concepts.isPending || !!analyzing}
            >
              {project.intentMode === "discover"
                ? "Choose what you’d like to build"
                : "Find projects for these parts"}
            </Btn>
          )}
          {project.goal && project.parts.length > 0 && (
            <Btn variant="primary" className="mt-3" onClick={() => go("confirm")}>
              Continue with “{project.goal.slice(0, 32)}”
            </Btn>
          )}
          <ErrorNote error={concepts.error} />
        </section>

        {project.intentMode === "discover" && (
          <section className="mt-8 border-t border-border pt-5">
            <h2 className="text-lg font-medium">From photos to a working build</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Review each part and its photo crop.</li>
              <li>Create optional 3D appearance references below.</li>
              <li>Choose a purpose and a project that uses your parts.</li>
              <li>Measure, design, check, then print and assemble.</li>
            </ol>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm">Tips for useful part photos</summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep parts separated and in focus. Include labels, connectors and a side view of
                tall components. Add several photos together; review proposals for duplicate parts
                before confirming. A ruler helps you measure, but photos alone cannot establish a
                checked fit.
              </p>
            </details>
            {project.parts
              .filter((p) => p.photoId)
              .map((p) => (
                <details key={p.id} className="mt-4 border-t border-border pt-3">
                  <summary className="cursor-pointer text-sm">
                    {p.label} ·{" "}
                    {p.visualAssetId ? "3D reference available" : "Create a 3D reference"}
                  </summary>
                  <PartReference project={project} part={p} />
                  {project.visualAssets
                    ?.filter((a) => a.part_id === p.id)
                    .map((a) => (
                      <ReferenceReview key={a.id} asset={a} projectId={project.id} part={p} />
                    ))}
                </details>
              ))}
          </section>
        )}

        {project.jobs.length > 0 && (
          <details className="mt-8 border-t border-border pt-4">
            <summary className="cursor-pointer text-sm">
              Task history · {project.jobs.length} operations
            </summary>
            <div className="mt-3 space-y-3">
              {[...project.jobs]
                .sort((a, b) => b.startedAt - a.startedAt)
                .map((j) => (
                  <JobProgress key={j.id} job={j} compact />
                ))}
            </div>
          </details>
        )}

        <details className="mt-8 border-t border-border pt-4" open={getAdapter().mode === "http"}>
          <summary className="cursor-pointer text-sm">Astra · inventory and design brief</summary>
          <div className="mt-3 h-[420px]">
            <AstraPanel project={project} displayRevisionId={project.acceptedRevisionId} />
          </div>
        </details>

        {photo && (
          <section className="mt-10">
            {project.photos.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2" aria-label="Uploaded photos">
                {project.photos.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      select(null);
                      setPhotoId(p.id);
                    }}
                    aria-pressed={p.id === photo.id}
                    className={`rounded-sm border px-3 py-1.5 text-xs ${p.id === photo.id ? "border-primary" : "border-border"}`}
                  >
                    Photo {i + 1}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your photo</span>
              <button aria-label="Open photo" onClick={() => setPhotoOpen(true)}>
                <Expand className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <img
              src={photo.url}
              alt="Your uploaded parts photo"
              className="w-full rounded-sm border border-border"
            />
          </section>
        )}
      </aside>

      <section
        className="relative flex min-h-[520px] flex-col"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
          if (files.length) upload.mutate([files]);
        }}
      >
        {/* Stage */}
        <div className="relative flex-1 overflow-hidden">
          {photo ? (
            <div className="absolute inset-6 flex items-center justify-center">
              <div className="relative max-h-full">
                <img
                  src={photo.url}
                  alt="Parts photo with proposed part anchors"
                  className="max-h-[calc(100vh-320px)] w-auto rounded-sm object-contain"
                />
                {project.parts.map((p, i) =>
                  p.anchor && p.photoId === photo.id ? (
                    <button
                      key={p.id}
                      onClick={() => select(p.id)}
                      className={`absolute border transition-colors ${selected === p.id ? "border-primary" : "border-foreground/30 hover:border-foreground/70"}`}
                      style={{
                        left: `${p.anchor.x * 100}%`,
                        top: `${p.anchor.y * 100}%`,
                        width: `${p.anchor.w * 100}%`,
                        height: `${p.anchor.h * 100}%`,
                      }}
                      aria-label={`${p.label}, ${p.status}`}
                    >
                      <span className="absolute -top-6 left-0 whitespace-nowrap rounded-sm bg-background/80 px-1.5 py-0.5 text-[11px] text-foreground">
                        <span className="font-mono text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>{" "}
                        {p.label} ·{" "}
                        <span
                          className={
                            p.status === "accepted" ? "text-success" : "text-muted-foreground"
                          }
                        >
                          {p.status}
                        </span>
                      </span>
                      {p.needsAttention && (
                        <span className="absolute -bottom-6 right-0 flex items-center gap-1 whitespace-nowrap text-[11px] text-primary">
                          <AlertTriangle className="size-3" /> {p.needsAttention}
                        </span>
                      )}
                    </button>
                  ) : null,
                )}
              </div>
            </div>
          ) : (
            <div className="absolute inset-6 grid place-items-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <Upload className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-4 text-lg">Drop up to five part photos here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lay them flat on a contrasting surface. A ruler or cutting mat helps.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Btn variant="primary" onClick={() => fileRef.current?.click()}>
                    Choose photo
                  </Btn>
                  <Btn variant="outline" onClick={() => setAdding(true)}>
                    <Plus className="size-4" /> Add parts manually
                  </Btn>
                </div>
                {getAdapter().mode === "fixture" && (
                  <button
                    onClick={useSample}
                    className="mt-4 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Use the sample parts photo (UI preview)
                  </button>
                )}
              </div>
            </div>
          )}
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
          {analyzing && (
            <div
              className="label-mono absolute left-6 top-6 rounded-sm bg-background/80 px-2 py-1 text-foreground"
              role="status"
            >
              <JobProgress job={analysisJob} />
            </div>
          )}
          {hasSample && (
            <div className="absolute right-6 top-6 flex max-w-xs items-start gap-2 rounded-sm bg-background/85 px-3 py-2 text-xs text-warning">
              <SampleTag /> Parts shown are sample data, not recognized from this photo.
            </div>
          )}
          <div className="absolute bottom-4 left-6 right-6">
            <ErrorNote error={upload.error ?? retryAnalysis.error} />
            {analysisJob?.stage === "failed" && (
              <div className="rounded-sm bg-background/95 p-3">
                <JobProgress job={analysisJob} compact />
                <Btn
                  variant="outline"
                  className="mt-2"
                  disabled={upload.isPending || !photo}
                  onClick={() => retryAnalysis.mutate([])}
                >
                  Retry photo analysis
                </Btn>
              </div>
            )}
          </div>
        </div>

        {/* Parts rail */}
        <div className="border-t border-border/60 px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {project.parts.map((p, i) => (
              <button
                key={p.id}
                onClick={() => select(p.id)}
                className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm ${selected === p.id ? "border-primary" : "border-border hover:border-muted-foreground"}`}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.label}
                {p.status === "accepted" ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
            <button
              onClick={() => setAdding(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" /> Add part
            </button>
          </div>
          {(sel || adding) && (
            <PartEditor
              key={sel?.id ?? "new"}
              project={project}
              part={adding ? undefined : sel}
              onDone={() => {
                setAdding(false);
                select(null);
              }}
            />
          )}
        </div>
      </section>

      {photoOpen && photo && (
        <div
          role="dialog"
          aria-label="Your photo"
          className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-10"
          onClick={() => setPhotoOpen(false)}
        >
          <img
            src={photo.url}
            alt="Your uploaded parts photo, full size"
            className="max-h-full max-w-full"
          />
        </div>
      )}
    </div>
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
    <div className="mt-3 grid gap-3 rounded-md border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_160px_auto]">
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
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="Model / part number"
          className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
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
      <div className="flex items-end gap-2">
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
        <fieldset className="md:col-span-4">
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
                  onChange={(e) => setCrop((c) => c.map((n, j) => (j === i ? e.target.value : n)))}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {part && (
        <div className="md:col-span-4">
          <PartReference project={project} part={part} />
        </div>
      )}
      <div className="md:col-span-4">
        <ErrorNote error={save.error ?? remove.error} />
      </div>
    </div>
  );
}
