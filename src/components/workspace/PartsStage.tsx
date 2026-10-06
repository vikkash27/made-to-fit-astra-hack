import { useRef, useState } from "react";
import { AlertTriangle, Check, Expand, Plus, Trash2, Upload } from "lucide-react";
import type { Part, Project, Stage } from "@/lib/domain/types";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { SAMPLE_PHOTO_URL } from "@/lib/api/fixture-adapter";
import { nextQuestion } from "@/lib/domain/next-question";
import { useViewer } from "@/lib/store/viewer-store";
import { Brief, ExperienceChips } from "./Brief";
import { Btn, ErrorNote, Label, SampleTag } from "./ui";

const CATS: Part["category"][] = ["controller", "display", "sensor", "battery", "other"];

export function PartsStage({ project, startAdding, go }: { project: Project; startAdding?: boolean; go: (s: Stage) => void }) {
  const [adding, setAdding] = useState(!!startAdding);
  const [photoOpen, setPhotoOpen] = useState(false);
  const selected = useViewer((s) => s.selectedId);
  const select = useViewer((s) => s.select);
  const photo = project.photos[project.photos.length - 1];
  const analysisJob = project.jobs.find((j) => j.kind === "photo_analysis");
  const analyzing = analysisJob && (analysisJob.stage === "queued" || analysisJob.stage === "running");
  const q = nextQuestion(project);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useProjectAction(project.id, async (ad, file: File) => {
    const ph = await ad.uploadPhoto(project.id, file);
    return ad.analyzePhotos(project.id, [ph.id]);
  });
  const concepts = useProjectAction(project.id, (ad) => ad.generateConcepts(project.id, project.draftVersion));

  const useSample = async () => {
    const blob = await (await fetch(SAMPLE_PHOTO_URL)).blob();
    upload.mutate([new File([blob], "sample-parts.jpg", { type: "image/jpeg" })]);
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
            <Btn variant={q.kind === "explore" ? "primary" : "ghost"} className="mt-3" onClick={() => concepts.mutate([], { onSuccess: () => go("discover") })} disabled={concepts.isPending}>
              Find projects for these parts
            </Btn>
          )}
          {project.goal && project.parts.length > 0 && (
            <Btn variant="primary" className="mt-3" onClick={() => go("confirm")}>
              Continue with “{project.goal.slice(0, 32)}”
            </Btn>
          )}
          <ErrorNote error={concepts.error} />
        </section>

        {photo && (
          <section className="mt-10">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your photo</span>
              <button aria-label="Open photo" onClick={() => setPhotoOpen(true)}>
                <Expand className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <img src={photo.url} alt="Your uploaded parts photo" className="w-full rounded-sm border border-border" />
          </section>
        )}
      </aside>

      <section className="relative flex min-h-[520px] flex-col">
        {/* Stage */}
        <div className="relative flex-1 overflow-hidden">
          {photo ? (
            <div className="absolute inset-6 flex items-center justify-center">
              <div className="relative max-h-full">
                <img src={photo.url} alt="Parts photo with proposed part anchors" className="max-h-[calc(100vh-320px)] w-auto rounded-sm object-contain" />
                {project.parts.map((p, i) =>
                  p.anchor && p.photoId === photo.id ? (
                    <button
                      key={p.id}
                      onClick={() => select(p.id)}
                      className={`absolute border transition-colors ${selected === p.id ? "border-primary" : "border-foreground/30 hover:border-foreground/70"}`}
                      style={{ left: `${p.anchor.x * 100}%`, top: `${p.anchor.y * 100}%`, width: `${p.anchor.w * 100}%`, height: `${p.anchor.h * 100}%` }}
                      aria-label={`${p.label}, ${p.status}`}
                    >
                      <span className="absolute -top-6 left-0 whitespace-nowrap rounded-sm bg-background/80 px-1.5 py-0.5 text-[11px] text-foreground">
                        <span className="font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span> {p.label} ·{" "}
                        <span className={p.status === "accepted" ? "text-success" : "text-muted-foreground"}>{p.status}</span>
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
                <p className="mt-4 text-lg">Drop a photo of your parts here</p>
                <p className="mt-1 text-sm text-muted-foreground">Lay them flat on a contrasting surface. A ruler or cutting mat helps.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Btn variant="primary" onClick={() => fileRef.current?.click()}>
                    Choose photo
                  </Btn>
                  <Btn variant="outline" onClick={() => setAdding(true)}>
                    <Plus className="size-4" /> Add parts manually
                  </Btn>
                </div>
                {getAdapter().mode === "fixture" && (
                  <button onClick={useSample} className="mt-4 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
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
            hidden
            onChange={(e) => e.target.files?.[0] && upload.mutate([e.target.files[0]])}
          />
          {analyzing && (
            <div className="label-mono absolute left-6 top-6 rounded-sm bg-background/80 px-2 py-1 text-foreground" role="status">
              {analysisJob.label} · {analysisJob.stage}
            </div>
          )}
          {hasSample && (
            <div className="absolute right-6 top-6 flex max-w-xs items-start gap-2 rounded-sm bg-background/85 px-3 py-2 text-xs text-warning">
              <SampleTag /> Parts shown are sample data, not recognized from this photo.
            </div>
          )}
          <div className="absolute bottom-4 left-6 right-6">
            <ErrorNote error={upload.error} onRetry={() => upload.reset()} />
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
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {p.label}
                {p.status === "accepted" ? <Check className="size-3.5 text-success" /> : <span className="size-1.5 rounded-full bg-primary" />}
              </button>
            ))}
            <button onClick={() => setAdding(true)} className="flex shrink-0 items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <Plus className="size-4" /> Add part
            </button>
          </div>
          {(sel || adding) && <PartEditor key={sel?.id ?? "new"} project={project} part={adding ? undefined : sel} onDone={() => { setAdding(false); select(null); }} />}
        </div>
      </section>

      {photoOpen && photo && (
        <div role="dialog" aria-label="Your photo" className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-10" onClick={() => setPhotoOpen(false)}>
          <img src={photo.url} alt="Your uploaded parts photo, full size" className="max-h-full max-w-full" />
        </div>
      )}
    </div>
  );
}

function PartEditor({ project, part, onDone }: { project: Project; part?: Part; onDone: () => void }) {
  const [label, setLabel] = useState(part?.label ?? "");
  const [identity, setIdentity] = useState(part?.identityAccepted ?? part?.identityProposed ?? "");
  const [cat, setCat] = useState<Part["category"]>(part?.category ?? "other");
  const save = useProjectAction(project.id, (ad, accept: boolean) =>
    ad.confirmComponents(project.id, project.draftVersion, [
      { id: part?.id, label: label || "Part", category: cat, identityAccepted: accept ? identity || label : part?.identityAccepted ?? null, accept },
    ]),
  );
  const remove = useProjectAction(project.id, (ad) => ad.confirmComponents(project.id, project.draftVersion, [{ id: part!.id, remove: true }]));

  return (
    <div className="mt-3 grid gap-3 rounded-md border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_160px_auto]">
      <label className="text-xs text-muted-foreground">
        Name
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary" />
      </label>
      <label className="text-xs text-muted-foreground">
        Identity {part?.identityProposed && <span className="text-primary">· proposed: {part.identityProposed}</span>}
        <input value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Model / part number" className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary" />
      </label>
      <label className="text-xs text-muted-foreground">
        Type
        <select value={cat} onChange={(e) => setCat(e.target.value as Part["category"])} className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground">
          {CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <Btn variant="primary" disabled={save.isPending || !label} onClick={() => save.mutate([true], { onSuccess: onDone })}>
          {part ? "Confirm identity" : "Add part"}
        </Btn>
        {part && (
          <Btn onClick={() => save.mutate([false], { onSuccess: onDone })} disabled={save.isPending}>
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
      <div className="md:col-span-4">
        <ErrorNote error={save.error ?? remove.error} />
      </div>
    </div>
  );
}
