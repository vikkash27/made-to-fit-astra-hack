import { JobProgress } from "./JobProgress";
import { latestJob } from "@/lib/domain/job-timing";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Search } from "lucide-react";
import type { EnclosureParams, Part, Project, Stage } from "@/lib/domain/types";
import { getAdapter } from "@/lib/api";
import { useProjectAction } from "@/lib/api/hooks";
import { parseDimensionInput, partFullyConfirmed } from "@/lib/domain/dimensions";
import { ViewerPanel } from "@/components/viewer/ViewerPanel";
import { Btn, ErrorNote, Label, SampleTag, StatusPill } from "./ui";
import { PartThumbnail } from "./PartsStage";
import { AskAstra } from "./WorkspaceAssistant";
import { buildParts } from "@/lib/domain/build-parts";
import { AutomaticDimensions } from "./AutomaticDimensions";

export const DEFAULT_PARAMS: EnclosureParams = {
  wall: 2,
  clearance: 1.5,
  lidThickness: 2,
  cornerRadius: 4,
};
const AXES = [
  { k: "x", l: "Width" },
  { k: "y", l: "Depth" },
  { k: "z", l: "Height" },
] as const;

export function ConfirmStage({ project, go }: { project: Project; go: (s: Stage) => void }) {
  const parts = buildParts(project);
  const allOk = parts.length > 0 && parts.every(partFullyConfirmed);
  const draft = useProjectAction(project.id, (ad) =>
    ad.createCandidate(project.id, project.acceptedRevisionId, DEFAULT_PARAMS, []),
  );

  return (
    <div className="grid grid-cols-1 gap-8 p-4 sm:p-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="min-w-0">
        <h1 className="stage-heading">Measure what goes inside.</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Measure each part in millimetres, including connectors and tall components. Review
          proposed values before confirming. Blank dimensions stay unknown.
        </p>
        <div className="mt-4">
          <AskAstra prompt="Explain how to measure the parts used in my project" />
        </div>
        <AutomaticDimensions project={project} />
        <div className="mt-6 space-y-5">
          {parts.map((p) => (
            <PartDims key={p.id} project={project} part={p} />
          ))}
          {parts.length === 0 && (
            <Btn variant="outline" onClick={() => go("parts")}>
              Add parts first
            </Btn>
          )}
        </div>
        {project.selectedConceptId && project.parts.length > parts.length && (
          <p className="mt-4 text-sm text-muted-foreground">
            {project.parts.length - parts.length} leftover parts stay in your inventory. This
            enclosure is sized for the parts used by your chosen project.
          </p>
        )}
        {project.intentMode === "discover" && (
          <p className="mt-4 text-sm text-muted-foreground">
            The first draft lays out measured component envelopes inside a base and lid. Review
            mounting, wire space and connector or display openings with Astra before accepting the
            final design.
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border bg-white py-4">
          <Btn
            variant="primary"
            className="h-11"
            disabled={!allOk || draft.isPending}
            onClick={() => draft.mutate([], { onSuccess: () => go("engineer") })}
          >
            Create enclosure draft <ArrowRight className="size-4" />
          </Btn>
          {!allOk && (
            <span className="text-sm text-muted-foreground">
              Confirm every part’s identity, width, depth and height to continue.
            </span>
          )}
        </div>
        <div className="mt-3">
          <ErrorNote error={draft.error} />
        </div>
      </aside>
      <div className="viewer-frame overflow-hidden rounded-lg">
        <ViewerPanel
          parts={parts}
          visualAssets={project.visualAssets}
          params={allOk ? DEFAULT_PARAMS : null}
          provenance={
            allOk
              ? "Measured envelope preview · not built CAD"
              : "Dimensions pending · no measured fit yet"
          }
          compact
        />
      </div>
    </div>
  );
}

function PartDims({ project, part }: { project: Project; part: Part }) {
  const estimate = part.dimensionEstimate;
  const estimated = { x: estimate?.width, y: estimate?.depth, z: estimate?.height };
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      AXES.map((a) => [a.k, String(part.size[a.k].value ?? estimated[a.k]?.value_mm ?? "")]),
    ),
  );
  // When a spec lookup brings in new proposed values, fill any still-blank boxes.
  const sizeKey = AXES.map((a) => part.size[a.k].value ?? estimated[a.k]?.value_mm ?? "").join("|");
  useEffect(() => {
    setDraft((d) => {
      const next = { ...d };
      for (const a of AXES)
        if (!next[a.k]) next[a.k] = String(part.size[a.k].value ?? estimated[a.k]?.value_mm ?? "");
      return next;
    });
  }, [sizeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [chosenEvidence, setChosenEvidence] = useState<Record<string, string>>({});
  const evidenceJob = latestJob(project.jobs, "evidence", part.id);
  const job =
    evidenceJob && (evidenceJob.stage === "queued" || evidenceJob.stage === "running")
      ? evidenceJob
      : undefined;
  const evidence = useQuery({
    queryKey: ["evidence", project.id, part.id, project.draftVersion],
    queryFn: () => getAdapter().getEvidence(project.id, part.id),
  });
  const lookup = useProjectAction(project.id, (ad) =>
    ad.lookupEvidence(
      project.id,
      part.id,
      part.identityAccepted ?? part.identityProposed ?? undefined,
    ),
  );
  const confirm = useProjectAction(project.id, (ad, acceptAll: boolean) =>
    ad.confirmComponents(project.id, project.draftVersion, [
      {
        id: part.id,
        dimensionsSource: AXES.some(
          (a) =>
            estimated[a.k]?.value_mm != null &&
            parseDimensionInput(draft[a.k] ?? "") === estimated[a.k]?.value_mm,
        )
          ? "user_confirmed_photo_estimate"
          : "user_measurement",
        accept: acceptAll || undefined,
        evidenceDecisions: (evidence.data?.proposals ?? [])
          .filter((v) => v.evidenceId && chosenEvidence[v.field] === v.evidenceId)
          .map((v) => ({
            evidenceId: v.evidenceId!,
            acceptance:
              parseDimensionInput(draft[v.field] ?? "") === v.value
                ? ("accepted" as const)
                : ("user_override" as const),
          })),
        size: Object.fromEntries(
          AXES.map((a) => [a.k, { value: parseDimensionInput(draft[a.k] ?? ""), accept: true }]),
        ),
      },
    ]),
  );

  const src = evidence.data?.sources[0];
  const [sourcesOpen, setSourcesOpen] = useState(false);
  return (
    <div className="border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-[15px]">
            <PartThumbnail project={project} part={part} />
            <span>
              {part.label} {part.sample && <SampleTag />}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {part.identityAccepted ? (
              <span className="text-success">Identity: {part.identityAccepted}</span>
            ) : (
              <>
                Proposed: {part.identityProposed ?? "unknown"} · <StatusPill status="proposed" />
              </>
            )}
          </div>
        </div>
        <Btn
          variant="outline"
          className="h-8 px-3 text-xs"
          onClick={() => {
            setSourcesOpen(true);
            lookup.mutate([]);
          }}
          disabled={!!job || lookup.isPending}
        >
          <Search className="size-3.5" /> Look up specs
        </Btn>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {AXES.map((a) => {
          const f = part.size[a.k];
          return (
            <label key={a.k} className="text-xs text-muted-foreground">
              {a.l} ·{" "}
              {f.status !== "accepted" && f.value == null && estimated[a.k]?.value_mm != null ? (
                <span className="text-warning">
                  Photo estimate · {estimated[a.k]?.confidence} confidence
                </span>
              ) : (
                <StatusPill status={f.status} />
              )}
              <div className="mt-1 flex items-center rounded-sm border border-border bg-background focus-within:border-primary">
                <input
                  inputMode="decimal"
                  value={draft[a.k]}
                  onChange={(e) => setDraft({ ...draft, [a.k]: e.target.value })}
                  placeholder={
                    f.status === "proposed" && f.value != null ? String(f.value) : "unknown"
                  }
                  className="w-full bg-transparent px-2 py-1.5 font-mono text-sm text-foreground outline-none"
                  aria-label={`${part.label} ${a.l} in mm`}
                />
                <span className="pr-2 text-[10px]">mm</span>
              </div>
              {f.status === "proposed" && f.value != null && draft[a.k] !== String(f.value) && (
                <button
                  className="mt-1 text-[11px] text-primary"
                  onClick={() => setDraft({ ...draft, [a.k]: String(f.value) })}
                >
                  Use proposed {f.value}
                </button>
              )}
            </label>
          );
        })}
      </div>
      {estimate && !partFullyConfirmed(part) && (
        <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            Prefilled from photo proportions and common sizes. These are estimates; check with a
            ruler or calipers before confirming.
          </p>
          <details className="mt-2">
            <summary>How Astra estimated these sizes</summary>
            <ul className="mt-2 space-y-2">
              {AXES.map((a) => (
                <li key={a.k}>
                  <b>{a.l}:</b>{" "}
                  {estimated[a.k]?.range_mm ? `${estimated[a.k]!.range_mm!.join("–")} mm · ` : ""}
                  {estimated[a.k]?.basis}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      {src && (
        <details
          open={sourcesOpen}
          onToggle={(e) => setSourcesOpen(e.currentTarget.open)}
          className="mt-4"
        >
          <summary className="text-xs font-medium text-muted-foreground">
            Specification evidence · review before use
          </summary>
          {src && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Source:{" "}
              <a href={src.url} target="_blank" rel="noreferrer" className="underline">
                {src.title}
              </a>
              {evidence.data?.sample && " (sample)"}
              {evidence.data?.missing.length
                ? ` · Missing: ${evidence.data.missing.join(", ").toUpperCase()}`
                : ""}
            </p>
          )}
          {evidence.data?.proposals.length ? (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Source proposals · review the hardware variant before accepting
              </p>
              {evidence.data.proposals.map((proposal, i) => {
                const source = evidence.data.sources.find((s) => s.id === proposal.sourceId);
                return (
                  <div
                    key={proposal.evidenceId ?? i}
                    className="flex flex-wrap items-center gap-2 text-xs"
                  >
                    <span>
                      {proposal.field.toUpperCase()} · {proposal.value} mm ·{" "}
                      {proposal.applicability ?? "sample"} · {proposal.acceptance ?? "proposed"}
                    </span>
                    {source && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        {source.title}
                      </a>
                    )}
                    <Btn
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={proposal.applicability === "chip_only"}
                      onClick={() => {
                        setDraft((d) => ({ ...d, [proposal.field]: String(proposal.value) }));
                        if (proposal.evidenceId)
                          setChosenEvidence((d) => ({
                            ...d,
                            [proposal.field]: proposal.evidenceId!,
                          }));
                      }}
                    >
                      Use proposal
                    </Btn>
                    {proposal.applicability === "chip_only" && (
                      <span>Chip size cannot establish this module’s envelope.</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </details>
      )}
      <div className="mt-3 flex gap-2">
        <Btn
          variant="primary"
          className="h-8 px-3 text-xs"
          disabled={
            confirm.isPending ||
            AXES.some((a) => {
              const n = parseDimensionInput(draft[a.k] ?? "");
              return n == null || n <= 0;
            })
          }
          onClick={() => confirm.mutate([true])}
        >
          <Check className="size-3.5" /> Confirm identity & measurements
        </Btn>
      </div>
      {evidenceJob?.stage === "failed" && <JobProgress job={evidenceJob} />}
      <div className="mt-2">
        {job && <JobProgress job={job} />}
        <ErrorNote error={confirm.error ?? lookup.error} />
      </div>
    </div>
  );
}
