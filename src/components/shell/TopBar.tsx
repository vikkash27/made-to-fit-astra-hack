import { Link } from "@tanstack/react-router";
import { getAdapter } from "@/lib/api";
import { useHealth } from "@/lib/api/hooks";
import { useHydrated } from "@tanstack/react-router";

export function Logo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      className="text-foreground"
    >
      <path d="M2 9V20H13" stroke="currentColor" strokeWidth="2.4" />
      <path d="M9 2H20V13" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export function PreviewBadge() {
  const hydrated = useHydrated();
  if (!hydrated || getAdapter().mode !== "fixture") return null;
  return (
    <div
      role="status"
      className="label-mono rounded-sm border border-warning/40 bg-warning/10 px-2 py-1 text-[9.5px] text-warning"
      title="No backend is configured. Data is sample data; Astra, CAD and Rodin are not called."
    >
      UI preview · sample data · backend disconnected
    </div>
  );
}

export function AstraStatus() {
  const hydrated = useHydrated();
  const { data, isError } = useHealth();
  const live = hydrated && data?.mode === "http" && data.ok && data.astraConfigured;
  const label = !hydrated
    ? "…"
    : data?.mode === "fixture"
      ? "Not connected"
      : isError
        ? "Unreachable"
        : !data
          ? "Checking"
          : !data.ok
            ? "Unavailable"
            : !data.astraConfigured
              ? "Not configured"
              : live
                ? "Configured"
                : "Checking";
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`size-2 rounded-full ${live ? "bg-primary" : "bg-muted-foreground/50"}`}
        aria-hidden
      />
      <div className="leading-tight">
        <div className="text-sm">Astra</div>
        <div className="text-[11px] text-muted-foreground">
          {label}
          {data?.mode === "http" && data.ok ? ` · CAD ${data.cad ? "ready" : "unavailable"}` : ""}
        </div>
      </div>
    </div>
  );
}

export function TopBar() {
  const nav = "relative py-5 text-sm text-muted-foreground transition-colors hover:text-foreground";
  return (
    <header className="relative z-20 flex min-h-16 shrink-0 flex-wrap items-center gap-3 py-2 justify-between border-b border-border/70 px-3 sm:px-6 lg:px-9">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3" aria-label="Made to Fit home">
          <Logo />
          <span className="font-display text-[19px] font-semibold tracking-tight">made to fit</span>
        </Link>
        <span className="hidden h-5 w-px bg-border sm:block" />
        <span className="label-mono hidden text-muted-foreground sm:block">Studio</span>
      </div>
      <nav
        className="static flex gap-4 md:absolute md:left-1/2 md:-translate-x-1/2 md:gap-10"
        aria-label="Main"
      >
        <Link
          to="/"
          className={nav}
          activeOptions={{ exact: true }}
          activeProps={{
            className:
              "!text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary",
          }}
        >
          Studio
        </Link>
        <Link
          to="/projects"
          className={nav}
          activeProps={{
            className:
              "!text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary",
          }}
        >
          Projects
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <PreviewBadge />
        <AstraStatus />
      </div>
    </header>
  );
}
