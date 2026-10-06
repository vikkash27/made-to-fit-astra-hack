import { useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ImageIcon, Link2, Paperclip, X } from "lucide-react";

export interface ComposerValue {
  text: string;
  files: File[];
  links: string[];
}

interface Props {
  placeholder: string;
  onSubmit: (v: ComposerValue) => void | Promise<void>;
  busy?: boolean;
  allowFiles?: boolean;
  files?: File[];
  onFilesChange?: (f: File[]) => void;
  chips?: ReactNode;
  size?: "lg" | "md";
  initialText?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  value?: string;
  onTextChange?: (text: string) => void;
  inputLabel?: string;
}

export function Composer({
  placeholder,
  onSubmit,
  busy,
  allowFiles = true,
  files: ctrlFiles,
  onFilesChange,
  chips,
  size = "md",
  autoFocus,
  initialText = "",
  value,
  onTextChange,
  submitLabel,
  inputLabel,
}: Props) {
  const inputId = useId();
  const [localText, setLocalText] = useState(initialText);
  const text = value ?? localText;
  const setText = onTextChange ?? setLocalText;
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const files = ctrlFiles ?? localFiles;
  const setFiles = onFilesChange ?? setLocalFiles;
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const canSend = !busy && (text.trim() || files.length || links.length);
  const submit = async () => {
    if (!canSend) return;
    try {
      await onSubmit({ text: text.trim(), files, links });
    } catch {
      return;
    }
    setText("");
    setFiles([]);
    setLinks([]);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles([...files, ...Array.from(list).filter((f) => f.type.startsWith("image/"))]);
  };

  return (
    <div className={`rounded-lg border border-border bg-surface ${size === "lg" ? "p-3" : "p-2"}`}>
      {(files.length > 0 || links.length > 0 || chips) && (
        <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1">
          {chips}
          {files.map((f, i) => (
            <span
              key={i}
              className="flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-background/60 px-2 py-1 text-xs"
            >
              <ImageIcon className="size-3.5 text-muted-foreground" /> {f.name}
              <button
                disabled={busy}
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {links.map((l, i) => (
            <span
              key={l}
              className="flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-background/60 px-2 py-1 text-xs"
            >
              <Link2 className="size-3.5 text-muted-foreground" />{" "}
              {l.replace(/^https?:\/\//, "").slice(0, 40)}
              <button
                disabled={busy}
                aria-label="Remove link"
                onClick={() => setLinks(links.filter((_, j) => j !== i))}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {linkDraft !== null && (
        <form
          className="flex gap-2 px-2 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (/^https?:\/\/\S+$/.test(linkDraft)) {
              setLinks([...links, linkDraft]);
              setLinkDraft(null);
            }
          }}
        >
          <input
            autoFocus
            disabled={busy}
            aria-label="Datasheet or product page URL"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="https://… datasheet or product page"
            className="min-w-0 flex-1 rounded-sm border border-border bg-background px-2 py-1.5 text-sm outline-none"
          />
          <button disabled={busy} className="text-xs text-primary">
            Add
          </button>
          <button
            disabled={busy}
            type="button"
            className="text-xs text-muted-foreground"
            onClick={() => setLinkDraft(null)}
          >
            Cancel
          </button>
        </form>
      )}
      {inputLabel && (
        <label htmlFor={inputId} className="block px-2 pb-1 pt-1 text-sm font-medium">
          {inputLabel}
        </label>
      )}
      <div
        className={size === "lg" ? "flex flex-wrap items-center gap-1" : "flex items-center gap-1"}
      >
        {allowFiles && (
          <>
            <button
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
              aria-label={size === "lg" ? "Choose parts photos" : "Attach photos"}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="size-[18px]" />
              {size === "lg" && <span className="text-sm">Choose parts photos</span>}
            </button>
            <button
              disabled={busy}
              className="rounded-md p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
              aria-label="Add spec link"
              onClick={() => setLinkDraft("")}
            >
              <Link2 className="size-[18px]" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
            {size !== "lg" && <span className="mx-2 h-7 w-px bg-border" />}
          </>
        )}
        <textarea
          id={inputId}
          rows={size === "lg" ? 2 : 1}
          disabled={busy}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={placeholder}
          aria-label={inputLabel ?? placeholder}
          className={`min-w-0 resize-none bg-transparent px-2 outline-none placeholder:text-muted-foreground ${size === "lg" ? "order-first w-full py-3 text-base leading-relaxed" : "flex-1 py-2 text-[15px]"}`}
        />
        <button
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label={submitLabel ?? "Send"}
          className={`inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40 ${size === "lg" ? "ml-auto max-sm:mt-2 max-sm:w-full" : ""} ${submitLabel ? "min-h-11 gap-2 px-4 text-sm font-medium" : size === "lg" ? "size-12" : "size-10"}`}
        >
          {submitLabel && <span>{submitLabel}</span>}
          <ArrowRight className="size-5 shrink-0" />
        </button>
      </div>
    </div>
  );
}
