import { createContext, useContext, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Project, Stage } from "@/lib/domain/types";
import { useViewer } from "@/lib/store/viewer-store";
import { AstraPanel } from "./AstraPanel";
import { Btn } from "./ui";

const AssistantContext = createContext<(prompt?: string) => void>(() => {});
export const AssistantProvider = AssistantContext.Provider;
export function AskAstra({
  prompt,
  children = "Ask Astra",
}: {
  prompt?: string;
  children?: React.ReactNode;
}) {
  const open = useContext(AssistantContext);
  return (
    <Btn variant="outline" onClick={() => open(prompt)}>
      <MessageCircle className="size-4" />
      {children}
    </Btn>
  );
}
export function WorkspaceAssistant({
  project,
  stage,
  children,
}: {
  project: Project;
  stage: Stage;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [lastRead, setLastRead] = useState(project.messages.length);
  const [draft, setDraft] = useState("");
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const preview = useViewer((s) => s.previewRevisionId);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1440px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (wide && open) closeButton.current?.focus();
  }, [wide, open]);
  const show = (prompt?: string) => {
    if (prompt) setDraft(prompt);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };
  const content = (
    <AstraPanel
      project={project}
      stage={stage}
      displayRevisionId={preview ?? project.acceptedRevisionId ?? project.revisions[0]?.id ?? null}
      draft={draft}
      onDraftChange={setDraft}
    />
  );
  useEffect(() => {
    if (open) setLastRead(project.messages.length);
  }, [open, project.messages.length]);
  const working = project.jobs.some(
    (j) => j.kind === "agent" && (j.stage === "queued" || j.stage === "running"),
  );
  const unread = project.messages.length > lastRead;
  const description =
    "Help for your current step. Proposals need your review; designs need checks and explicit acceptance.";
  return (
    <AssistantProvider value={show}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-8">
        <p className="text-xs text-muted-foreground">Confirmed changes are saved automatically.</p>
        <button
          ref={launcher}
          onClick={() => (open ? close() : show())}
          aria-expanded={open}
          aria-controls="workspace-astra"
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-primary hover:bg-primary/15"
        >
          <MessageCircle className="size-4" />{" "}
          {open
            ? "Close Astra"
            : working
              ? "Astra is working…"
              : unread
                ? "Astra has an update"
                : "Ask Astra"}
        </button>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1">
        <main id="workspace-main" className="workspace-page min-w-0 flex-1">
          {children}
        </main>
        {wide && (
          <aside
            id="workspace-astra"
            hidden={!open}
            aria-label="Astra assistant"
            className="assistant-surface sticky top-0 h-[calc(100dvh-64px)] w-[360px] shrink-0 border-l border-border bg-white"
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
            }}
          >
            <div className="flex items-center justify-between p-5">
              <h2 className="text-lg font-semibold">Astra</h2>
              <button
                ref={closeButton}
                aria-label="Close Astra"
                onClick={close}
                className="grid size-10 place-items-center rounded-full hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="px-5 pb-3 text-xs text-muted-foreground">{description}</p>
            <div className="h-[calc(100%-132px)]">{content}</div>
          </aside>
        )}
      </div>
      {!wide && (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/25" />
            <Dialog.Content
              id="workspace-astra"
              className="theme-studio-light assistant-surface fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[440px] flex-col bg-white text-foreground shadow-[-12px_0_40px_-20px_rgba(0,0,0,.25)] sm:rounded-l-xl"
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                launcher.current?.focus();
              }}
            >
              <div className="flex items-center justify-between px-5 pt-5">
                <Dialog.Title className="text-lg font-semibold">
                  Astra · your project assistant
                </Dialog.Title>
                <Dialog.Close
                  aria-label="Close Astra"
                  className="grid size-10 place-items-center rounded-full hover:bg-accent"
                >
                  <X className="size-5" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="px-5 pb-3 pt-2 text-xs text-muted-foreground">
                {description}
              </Dialog.Description>
              <div className="min-h-0 flex-1">{content}</div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AssistantProvider>
  );
}
