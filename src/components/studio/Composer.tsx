import { useRef, useState, type ReactNode } from "react";
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
  autoFocus?: boolean;
}

export function Composer({ placeholder, onSubmit, busy, allowFiles = true, files: ctrlFiles, onFilesChange, chips, size = "md", autoFocus }: Props) {
  const [text, setText] = useState("");
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
    await onSubmit({ text: text.trim(), files, links });
    setText("");
    setFiles([]);
    setLinks([]);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles([...files, ...Array.from(list).filter((f) => f.type.startsWith("image/"))]);
  };

  return (
    <div className={`rounded-lg border border-border bg-surface/85 backdrop-blur ${size === "lg" ? "p-3" : "p-2"}`}>
      {(files.length > 0 || links.length > 0 || chips) && (
        <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1">
          {chips}
          {files.map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-sm border border-border bg-background/60 px-2 py-1 text-xs">
              <ImageIcon className="size-3.5 text-muted-foreground" /> {f.name}
              <button aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          {links.map((l, i) => (
            <span key={l} className="flex items-center gap-1.5 rounded-sm border border-border bg-background/60 px-2 py-1 text-xs">
              <Link2 className="size-3.5 text-muted-foreground" /> {l.replace(/^https?:\/\//, "").slice(0, 40)}
              <button aria-label="Remove link" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
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
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="https://… datasheet or product page"
            className="flex-1 rounded-sm border border-border bg-background px-2 py-1.5 text-sm outline-none"
          />
          <button className="text-xs text-primary">Add</button>
          <button type="button" className="text-xs text-muted-foreground" onClick={() => setLinkDraft(null)}>
            Cancel
          </button>
        </form>
      )}
      <div className="flex items-center gap-1">
        {allowFiles && (
          <>
            <button className="rounded-md p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Attach photos" onClick={() => fileRef.current?.click()}>
              <Paperclip className="size-[18px]" />
            </button>
            <button className="rounded-md p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Add spec link" onClick={() => setLinkDraft("")}>
              <Link2 className="size-[18px]" />
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => addFiles(e.target.files)} />
            <span className="mx-2 h-7 w-px bg-border" />
          </>
        )}
        <textarea
          rows={1}
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
          aria-label={placeholder}
          className={`flex-1 resize-none bg-transparent px-2 outline-none placeholder:text-muted-foreground ${size === "lg" ? "py-3 text-[17px]" : "py-2 text-[15px]"}`}
        />
        <button
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label="Send"
          className={`grid place-items-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40 ${size === "lg" ? "size-12" : "size-10"}`}
        >
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
