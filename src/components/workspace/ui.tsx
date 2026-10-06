import type { ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { errorMessage } from "@/lib/api/hooks";
import { ApiError } from "@/lib/api";

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-xs font-medium text-muted-foreground ${className}`}>{children}</div>;
}

export function Btn({
  children,
  variant = "ghost",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  const v =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : variant === "outline"
        ? "border border-border hover:border-muted-foreground"
        : "text-foreground/90 hover:bg-accent";
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function SampleTag() {
  return (
    <span className="label-mono rounded-sm border border-warning/40 px-1.5 py-0.5 text-[9px] text-warning">
      Sample
    </span>
  );
}

export function StatusPill({ status }: { status: "proposed" | "accepted" | "unknown" | string }) {
  const c =
    status === "accepted"
      ? "text-success"
      : status === "proposed"
        ? "text-primary"
        : status === "failed" || status === "fail"
          ? "text-destructive"
          : "text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full bg-current/5 px-2 py-1 text-xs ${c}`}>
      {status === "accepted" ? "Confirmed" : status === "proposed" ? "Needs review" : status}
    </span>
  );
}

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) return null;
  const retryable = error instanceof ApiError ? error.retryable : true;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <span className="flex-1">{errorMessage(error)}</span>
      {onRetry && retryable && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs text-foreground/80 hover:text-foreground"
        >
          <RotateCw className="size-3" /> Retry
        </button>
      )}
    </div>
  );
}

export function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 border-t border-border py-2.5 text-sm">
      <div className="text-muted-foreground">{k}</div>
      <div>{children}</div>
    </div>
  );
}
