import type { WiringConnection } from "@/lib/api/backend-types";

const COLORS = {
  red: "#ad361a",
  black: "#262626",
  yellow: "#8b6206",
  blue: "#245a98",
  green: "#287042",
  white: "#5c6671",
};
export function WiringDiagram({
  connection: c,
  names,
}: {
  connection: WiringConnection;
  names: Record<string, string>;
}) {
  const endpoint = (e: WiringConnection["start"]) => (
    <div className="min-w-0 rounded-lg border border-border bg-secondary px-4 py-4 text-center">
      <p className="break-words text-sm font-medium">{names[e.part_id] ?? e.part_id}</p>
      <p className="mt-3 font-mono text-base [overflow-wrap:anywhere]">{e.pin}</p>
    </div>
  );
  return (
    <figure className="my-4 rounded-xl border border-border bg-surface p-4">
      <p className="text-center text-sm font-medium">{c.signal}</p>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        {c.voltage_v} V · suggested {c.color} wire label
      </p>
      <div className="my-5 grid items-center sm:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)]">
        {endpoint(c.start)}
        <div aria-hidden="true" className="flex justify-center">
          <svg viewBox="0 0 48 80" className="hidden h-20 w-12 sm:block">
            <path
              d="M 0 40 H 12 V 20 H 36 V 40 H 48"
              fill="none"
              stroke={COLORS[c.color]}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg viewBox="0 0 80 48" className="h-12 w-20 sm:hidden">
            <path
              d="M 40 0 V 12 H 60 V 36 H 40 V 48"
              fill="none"
              stroke={COLORS[c.color]}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {endpoint(c.end)}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        Connection schematic. Locate these exact labels on your module; the drawing does not show
        physical pin positions.
      </figcaption>
    </figure>
  );
}
