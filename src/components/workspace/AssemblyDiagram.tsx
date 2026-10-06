import type { Revision } from "@/lib/domain/types";

/** An actual engineering-bounds plan, not an illustration of inferred hardware. */
export function AssemblyDiagram({
  revision,
  partIds,
  onSelect,
}: {
  revision: Revision;
  partIds: string[];
  onSelect: (id: string) => void;
}) {
  const parts = revision.assembly?.parts ?? [];
  if (!parts.length) return null;
  const bounds = parts.flatMap((p) => [p.bounds.min_mm, p.bounds.max_mm]);
  const minX = Math.min(...bounds.map((p) => p[0])),
    maxX = Math.max(...bounds.map((p) => p[0]));
  const minY = Math.min(...bounds.map((p) => p[1])),
    maxY = Math.max(...bounds.map((p) => p[1]));
  const width = maxX - minX,
    height = maxY - minY;
  const scale = Math.min(430 / Math.max(width, 1), 210 / Math.max(height, 1));
  const x = (v: number) => 35 + (v - minX) * scale,
    y = (v: number) => 32 + (maxY - v) * scale;
  return (
    <figure className="my-5 rounded-xl bg-secondary/50 p-4">
      <svg
        viewBox="0 0 500 280"
        className="mx-auto max-h-64 w-full"
        role="group"
        aria-label="Top view of measured enclosure and component envelopes"
      >
        {parts
          .filter((p) => p.part_id !== "lid")
          .map((p, index) => {
            const [lo, hi] = [p.bounds.min_mm, p.bounds.max_mm];
            const active = partIds.includes(p.part_id),
              printable = p.role === "printable_cad";
            const rx = x(lo[0]),
              ry = y(hi[1]),
              rw = (hi[0] - lo[0]) * scale,
              rh = (hi[1] - lo[1]) * scale;
            return (
              <g
                key={p.part_id}
                role="button"
                tabIndex={0}
                aria-label={`Highlight ${p.name}`}
                onClick={() => onSelect(p.part_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(p.part_id);
                  }
                }}
                className="cursor-pointer"
              >
                <title>
                  {p.name}: {p.size_mm.join(" × ")} mm measured envelope
                </title>
                <rect
                  x={rx}
                  y={ry}
                  width={rw}
                  height={rh}
                  rx={printable ? 4 : 2}
                  fill={
                    printable ? "var(--background)" : active ? "var(--primary)" : "var(--surface-2)"
                  }
                  stroke={active ? "var(--primary)" : "var(--muted-foreground)"}
                  strokeWidth={active ? 2 : 1}
                />
                {!printable && (
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize={22}
                    fill={active ? "var(--primary-foreground)" : "var(--foreground)"}
                  >
                    {index + 1}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
      <ol aria-label="Measured layout parts" className="mb-4 space-y-2">
        {parts
          .filter((p) => p.part_id !== "lid")
          .map((p, index) => (
            <li key={p.part_id}>
              <button
                onClick={() => onSelect(p.part_id)}
                className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"
                aria-label={`Show ${p.name} in 3D`}
              >
                <span aria-hidden="true" className="font-mono">
                  {index + 1}.
                </span>
                <span className="min-w-0 break-words">
                  <span className="font-medium">{p.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {p.size_mm.map((n) => Number(n.toFixed(2))).join(" × ")} mm
                  </span>
                </span>
              </button>
            </li>
          ))}
      </ol>
      <figcaption className="text-xs text-muted-foreground">
        Measured layout · top view. Select a part to highlight it in 3D. Shapes show envelopes; pin
        locations and mounts are not represented.
      </figcaption>
    </figure>
  );
}
