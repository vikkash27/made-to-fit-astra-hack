import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Lightbulb } from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { Composer, type ComposerValue } from "@/components/studio/Composer";
import { startProject } from "@/lib/flows";
import { errorMessage } from "@/lib/api/hooks";
import type { IntentMode } from "@/lib/domain/types";
import exampleScene from "@/assets/example-scene.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Made to Fit — Your parts. Their next life." },
      { name: "description", content: "Find a project in the hardware you have, or bring the one you're already building. Astra helps you design a part that fits." },
      { property: "og:title", content: "Made to Fit — Your parts. Their next life." },
      { property: "og:description", content: "Photograph your components, discover grounded projects and develop a printable enclosure." },
    ],
  }),
  component: Landing,
});

const LABELS = [
  { top: "13%", left: "84%", title: "Example scene", sub: "", main: true },
  { top: "27%", left: "86%", title: "Custom enclosure", sub: "3D printed" },
  { top: "34%", left: "48%", title: "Display", sub: "Square IPS" },
  { top: "46%", left: "49%", title: "Main board", sub: "USB-C" },
  { top: "60%", left: "84%", title: "Battery", sub: "LiPo" },
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
      const list = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
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
    } finally {
      setBusy(false);
    }
  };

  const manual = async () => {
    setBusy(true);
    try {
      const id = await startProject({ text: "", files: [], links: [], intent: intent ?? "discover" });
      await navigate({ to: "/studio/$projectId", params: { projectId: id }, search: { add: 1 } });
    } catch (e) {
      setErr(errorMessage(e));
      setBusy(false);
    }
  };

  const chip = (active: boolean) =>
    `flex items-center gap-3 rounded-full border px-6 py-2.5 text-[13px] transition-colors ${active ? "border-primary text-foreground" : "border-border text-foreground/90 hover:border-muted-foreground"}`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img
        src={exampleScene}
        alt="Example scene: an exploded custom enclosure with display, main board and battery"
        width={1600}
        height={1008}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-90"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        {LABELS.map((l) => (
          <div key={l.title} className="absolute" style={{ top: l.top, left: l.left }}>
            <div className={`label-mono ${l.main ? "border-b border-foreground/40 pb-2 text-foreground" : "text-foreground/80"}`}>{l.title}</div>
            {l.sub && <div className="label-mono mt-1 text-[9px] text-muted-foreground">{l.sub}</div>}
          </div>
        ))}
      </div>

      <div className="relative flex min-h-screen flex-col">
        <TopBar />
        <main className="flex flex-1 flex-col px-6 lg:px-[88px]">
          <div className="pt-[9vh]">
            <div className="flex items-center gap-3">
              <span className="size-3 bg-primary" aria-hidden />
              <span className="font-mono text-sm font-medium">Astra is ready</span>
            </div>
            <p className="mt-2 text-[15px] text-muted-foreground">Start with a photo, a parts list or an idea.</p>
            <h1 className="display-tight mt-12 text-[clamp(56px,8.4vw,128px)]">
              Your parts.
              <br />
              Their next life.
            </h1>
            <p className="mt-8 max-w-md text-xl font-light leading-snug text-foreground/80">
              Find a project in the hardware you have. Or bring the one you’re already building.
            </p>
          </div>

          <div className="mx-auto mt-auto w-full max-w-[960px] pb-8 pt-12">
            <div className="mb-6 flex items-center justify-center gap-8">
              <button className={chip(intent === "idea")} aria-pressed={intent === "idea"} onClick={() => setIntent(intent === "idea" ? null : "idea")}>
                <Lightbulb className="size-[18px]" /> I have an idea
              </button>
              <span className="h-8 w-px bg-border" />
              <button className={chip(intent === "discover")} aria-pressed={intent === "discover"} onClick={() => setIntent(intent === "discover" ? null : "discover")}>
                <Boxes className="size-[18px]" /> Explore my components
              </button>
            </div>
            <Composer
              size="lg"
              busy={busy}
              files={files}
              onFilesChange={setFiles}
              placeholder={
                intent === "idea" ? "Describe what you want to make, or the prototype you have…" : intent === "discover" ? "Add a photo or list the parts you have…" : "Show me your parts, or tell me what you want to make…"
              }
              onSubmit={submit}
            />
            {err && (
              <p role="alert" className="mt-3 text-center text-sm text-destructive">
                {err}
              </p>
            )}
            <div className="label-mono mt-5 flex justify-center gap-4 text-[10px] text-muted-foreground">
              <span>Drop a photo anywhere</span>·
              <button className="hover:text-foreground" onClick={manual}>
                Add parts manually
              </button>
              ·<span>Add spec link with the link icon</span>
            </div>
          </div>
        </main>
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center border-2 border-dashed border-primary bg-background/70">
          <p className="display-tight text-5xl">Drop your parts photo</p>
        </div>
      )}
    </div>
  );
}
