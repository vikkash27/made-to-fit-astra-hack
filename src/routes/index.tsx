import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Lightbulb, ArrowRight } from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Composer, type ComposerValue } from "@/components/studio/Composer";
import { startProject } from "@/lib/flows";
import { errorMessage } from "@/lib/api/hooks";
import type { IntentMode } from "@/lib/domain/types";
import exampleScene from "@/assets/example-scene.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Made to Fit — Make more of the parts you have." },
      {
        name: "description",
        content:
          "Turn your electronics into a useful project, or refine a build already in progress. Review parts, confirm measurements, iterate on an enclosure, then print and assemble.",
      },
      { property: "og:title", content: "Made to Fit — Make more of the parts you have." },
      {
        property: "og:description",
        content:
          "Discover projects from your electronics, develop an existing idea and iterate on a measured, 3D-printable enclosure with Astra.",
      },
    ],
  }),
  component: Landing,
});

const WORKFLOW = [
  {
    title: "Review your parts",
    detail:
      "Photograph your electronics or add them by hand. Review identities and specs before designing around them.",
  },
  {
    title: "Find a direction",
    detail:
      "Explore projects from your inventory, or develop the build you already have. See extra hardware and open decisions.",
  },
  {
    title: "Measure and iterate",
    detail:
      "Confirm dimensions, inspect the 3D layout and ask Astra for changes. Build and check each enclosure revision.",
  },
  {
    title: "Print and assemble",
    detail:
      "Accept your design, download its STEP, STL or 3MF files, and follow the matching assembly guide.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [intent, setIntent] = useState<IntentMode | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const over = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
        setDragging(true);
      }
    };
    const leave = (e: DragEvent) => {
      if (!e.relatedTarget) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const list = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (list.length) setFiles((f) => [...f, ...list]);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, []);

  const submit = async (v: ComposerValue) => {
    setBusy(true);
    setErr(null);
    try {
      const id = await startProject({ ...v, intent });
      await navigate({ to: "/studio/$projectId", params: { projectId: id } });
    } catch (e) {
      setErr(errorMessage(e));
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const manual = async () => {
    setBusy(true);
    setErr(null);
    try {
      const id = await startProject({
        text: "",
        files: [],
        links: [],
        intent: "discover",
      });
      await navigate({ to: "/studio/$projectId", params: { projectId: id }, search: { add: 1 } });
    } catch (e) {
      setErr(errorMessage(e));
      setBusy(false);
    }
  };

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors disabled:opacity-40 ${active ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground/90 hover:border-muted-foreground hover:bg-surface"}`;

  return (
    <div className="landing-page min-h-screen">
      <TopBar />
      <main>
        <section
          aria-labelledby="landing-title"
          className="relative mx-auto grid max-w-[1600px] gap-8 px-6 pb-10 pt-12 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-16 lg:pb-14 lg:pt-16 xl:px-[88px]"
        >
          <div className="relative z-10 min-w-0">
            <h1
              id="landing-title"
              className="display-tight max-w-2xl text-[clamp(44px,5.4vw,80px)] [text-wrap:balance]"
            >
              Make more of
              <br />
              the parts you have.
            </h1>
            <p className="mt-6 max-w-[530px] text-lg leading-relaxed text-foreground/80">
              Turn your electronics into a useful project, or take an existing build further. Plan
              it with Astra, refine a custom enclosure, then print and put it together.
            </p>

            <div className="mt-9 max-w-[620px]">
              <div
                className="mb-4 flex flex-wrap gap-2"
                role="group"
                aria-label="How would you like to start?"
              >
                <button
                  className={chip(intent === "discover")}
                  disabled={busy}
                  aria-pressed={intent === "discover"}
                  onClick={() => setIntent(intent === "discover" ? null : "discover")}
                >
                  <Boxes className="size-4" aria-hidden /> Explore my components
                </button>
                <button
                  className={chip(intent === "idea")}
                  disabled={busy}
                  aria-pressed={intent === "idea"}
                  onClick={() => setIntent(intent === "idea" ? null : "idea")}
                >
                  <Lightbulb className="size-4" aria-hidden /> I have an idea or project
                </button>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-relaxed text-muted-foreground">
                {intent === "idea"
                  ? "Tell us what you’re building and what you want to improve. You can add your parts along the way."
                  : intent === "discover"
                    ? "Show us what’s in your parts drawer. We’ll help you find a project worth building."
                    : "Start with the parts you own, an idea, or a project you’re already working on."}
              </p>
              <Composer
                submitLabel={busy ? "Starting…" : "Start project"}
                inputLabel={
                  intent === "idea" ? "Your idea or existing project" : "Your parts or project idea"
                }
                size="lg"
                busy={busy}
                files={files}
                onFilesChange={setFiles}
                placeholder={
                  intent === "idea"
                    ? "I’m building a desk sensor and need an enclosure…"
                    : "I have a controller, a small display and a battery…"
                }
                onSubmit={submit}
              />
              {err && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {err}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span>Up to 5 photos · JPG, PNG or WebP</span>
                <button
                  disabled={busy}
                  onClick={manual}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-foreground hover:bg-accent disabled:opacity-40"
                >
                  Add parts by hand <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <figure className="relative min-w-0 self-stretch overflow-hidden rounded-xl bg-surface lg:-mr-8 xl:-mr-10">
            <img
              src={exampleScene}
              alt="Illustrative exploded enclosure with a display, circuit board and battery between the lid and base"
              width={1600}
              height={1008}
              fetchPriority="high"
              className="h-[340px] w-full object-cover object-[72%_center] sm:h-[440px] lg:absolute lg:inset-0 lg:h-full lg:object-[73%_center]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 px-6 pb-6">
              <p className="text-sm font-medium text-foreground">A place for every part.</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                Example enclosure · illustrative assembly
              </p>
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="workflow-title" className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-[1600px] px-6 py-12 sm:px-10 lg:px-16 xl:px-[88px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2
                id="workflow-title"
                className="font-display text-[clamp(28px,3vw,40px)] font-semibold leading-tight tracking-[-0.025em]"
              >
                From loose parts to a build you can hold.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                One workspace to discover, develop and keep refining your project.
              </p>
            </div>
            <ol className="mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
              {WORKFLOW.map((step, index) => (
                <li key={step.title} className="border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-primary" aria-hidden>
                      {index + 1}
                    </span>
                    <h3 className="text-base font-medium">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-9 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              Your measurements drive fit. Geometry checks help you review the enclosure; wiring,
              firmware and slicer settings still need your review before use.
            </p>
          </div>
        </section>
      </main>
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center border-2 border-dashed border-primary bg-background/90 p-6">
          <p className="display-tight text-center text-4xl">Drop your parts photos</p>
        </div>
      )}
    </div>
  );
}
