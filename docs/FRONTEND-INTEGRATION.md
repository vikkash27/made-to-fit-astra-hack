# Lovable backend integration

Backend source: `/Users/vikkash/dev/made-to-fit-backend`. It can be copied as `backend/` into the canonical Lovable repository without moving the frontend. This folder contains no frontend implementation.

## Connect first

Local API base: `http://127.0.0.1:8000`. Interactive API docs: `/docs`. Source contract: `/openapi.json`; a checked-in snapshot is `docs/openapi.json`. Derive TypeScript types from OpenAPI rather than inventing parallel schemas. Frontend only receives a public API base URL; OpenAI/Hyper3D keys stay in backend `.env`.

Set `ALLOWED_ORIGINS` to a JSON array of exact scheme/host/port origins, including the actual frontend port. Current defaults are `http://localhost:5173` and `http://127.0.0.1:5173`. Restart after changes. Hosted Lovable requires an HTTPS-reachable Python service and its exact origin; a hosted preview cannot use this laptop's localhost. Keep the current service local until hosting/tunnel is deliberately configured.

## Canonical state

`GET /projects/{id}` returns `intent_mode`, nullable `goal`, `preferences`, reviewed/proposed inventory in `components`, `draft_version`, `inventory_hash`, `selected_concept_id`, `active_accepted_revision_id`, revision summaries, jobs, photos and a derived `brief`. `spec` is the saved design specification; `components` is the current editable inventory. Read the active revision for accepted geometry. Never conflate a new draft with accepted dimensions/artifacts.

`Component` uses stable `part_id`, server-versioned `component_version`, tentative `identity`, separate `identity_confirmed`, `size_mm: [X,Y,Z]` with null unknown values, `dimensions_confirmed`, `dimensions_source`, evidence IDs, `pose`, crop and locks. Crop boxes are normalized `[x0,y0,x1,y1]` after EXIF orientation. A confirmation request supplies complete reviewed component records for the parts being changed. Existing component versions increment server-side. Omitted components are preserved; `remove_part_ids` explicitly removes unlocked parts.

```json
{
  "name": "Component exploration",
  "intent_mode": "discover",
  "goal": null,
  "components": [{"part_id":"board-1","name":"Unidentified board"}],
  "preferences": {"allow_additional_parts":true,"tools":null}
}
```

Send this to `POST /projects` (201). Idea mode requires a nonempty goal. Use `PATCH /projects/{id}` with `expected_draft_version` to switch intent or edit preferences while preserving components/photos. Null dimensions are valid intake state and block checked enclosure creation until confirmed.

## Upload, evidence and concepts

- `POST /projects/{id}/photos`: multipart field `file`, JPEG/PNG/WebP, max 12 MiB by default. Let the browser set the multipart boundary. Response includes normalized photo ID/dimensions and registered artifact.
- `POST /projects/{id}/photos/analyze`: `{photo_ids, expected_draft_version, client_operation_id}` returns 202 JobView. `result.proposals` contains editable components/crops and observations. It never overwrites confirmed inventory. Proposals persist at `GET /projects/{id}/component-proposals`.
- `POST /projects/{id}/components/confirm`: `{expected_draft_version, components, remove_part_ids?}` creates reviewed component versions. Copy proposal values into review controls; explicitly confirm identity/measurements. Unknown assembled height stays null. Responses include the new project version/hash.
- `POST /projects/{id}/components/{part_id}/lookup`: `{identifiers, source_url: null or public HTTPS URL, client_operation_id}` returns an evidence job. Sources must actually be fetched/read. `GET .../evidence` returns proposals, applicability, acceptance state, source IDs/URLs/hash and missing fields. Do not silently apply chip/package values to module size; conflicts remain separate proposals.
- `POST /projects/{id}/concepts/generate`: `{expected_draft_version, inventory_hash, preference_prompt?, client_operation_id}` returns an Astra discovery job. Preferences are optional user-reported context; null tools are unknown. No fixed cards or numerical success scores.
- `GET /projects/{id}/concepts` returns persisted concepts, current snapshot and stale flags. Concept properties include used/unused part IDs, dependencies, why-this-fits-you, skills/tools, difficulty reasons, layout/form-factor reasoning, evidence, assumptions, required measurements, capabilities and next steps. Preview is a labeled schematic, not checked engineering geometry.
- `POST /projects/{id}/concepts/{concept_id}/select`: `{expected_draft_version, inventory_hash}` sets selected concept/goal, increments draft version and enters review. It does not confirm unknown dimensions or accept CAD. Stale inventory or brief returns 409.

## Agent and jobs

`POST /projects/{id}/agent` takes `{message, selected_part_id: null or stable ID, parent_revision_id: null or current accepted ID, expected_draft_version, client_operation_id}` and returns 202 JobView. Poll `/jobs/{job_id}` every 1–2 seconds. Model work can take longer than CAD. Display backend events/tool outcomes; no made-up progress percentages. Messages persist at `/projects/{id}/messages`.

A `JobView` has both `id` and `job_id`, kind, originating project/part/revision, stage, result, error, timestamped events and client operation ID. `queued`/`planning`/`analyzing_photo`/`researching_specifications`/`proposing_concepts`/`building_cad` reflect real work. Rodin also uses submitting/waiting/generating/downloading/validating. Terminal states: ready, failed, unknown_submission, cancelled. An HTTP 202 is admission, never evidence of success. CAD-build job ready can still return a revision with `failed_checks`; inspect checks/state.

Generate a fresh operation ID for a new intended action. Reuse the SAME ID and payload after an HTTP retry. Reusing an ID with changed input returns 409. Never poll a submission endpoint. Stop browser polling on project switches while backend work continues on its originating project. Browser cancellation does not cancel a vendor job. Do not retry an unknown paid submission by inventing a new key.

Errors use `{error:{code,message,details,retryable,request_id}}`. 422 validates input, 404 unknown IDs, 409 stale/conflict, 503 unconfigured/deadline. Async failures are in JobView.error, never hidden HTTP-200 success wrappers.

## Frozen candidate, checks, Apply and exports

`POST /projects/{id}/candidates` freezes `{client_operation_id,expected_draft_version,parent_revision_id,spec,request?}`. `spec` has units mm, reviewed components and exactly one `enclosure` or bounded flat `recipe`. Enclosure requires width/depth/height and wall/base/lid parameters. Generic recipes support box, cylinder, translate, quaternion rotate, union/subtract and independent parts, with 100 nodes/12 parts/depth 12 bounds.

1. `POST /revisions/{id}/build` with `{client_operation_id}` returns a real CAD job.
2. `GET /revisions/{id}` returns candidate state, matching artifacts/checks and eligibility. `POST /revisions/{id}/checks` returns the computed checks from that frozen native build.
3. `GET /revisions/{id}/assembly` returns the canonical AssemblyManifest; use it in all viewer modes.
4. `POST /revisions/{id}/accept` with `{client_operation_id,expected_active_parent}` applies an eligible candidate. Require the real UI user action. Failed checks, missing/tampered files, stale parent or changed inventory/brief return 409.
5. Refresh project and active revision together. `GET /revisions/{id}/exports` exposes actual artifact sizes/hashes/roles/URLs and whether this is current accepted geometry. Downloads use `/artifacts/{id}?download=true`.

Check status is pass/fail/unknown/not_applicable. Supported native validity, bounds, locked state, exact envelope/shell conflict, cavity containment and measured lid clearance are distinct checks. Optional unknown thermal/electrical/strength/closure/slicing/printer coverage is visible. A requested unsupported analysis prevents eligibility. A passed wall parameter is not general local wall analysis.

Locks are compared to immutable parent/reviewed state. Explicit user unlocks use `/projects/{id}/locks/review` with expected draft/parent, reviewed enclosure field names and component lock fields. Astra has no unlock or acceptance tool. To revert geometry, load the historic specification, reconcile it with the current reviewed component inventory/locks, then create/build/check a new candidate with the current active parent. History is immutable; do not repoint accepted state without the workflow.

## One assembly, one conversion

Engineering data is right-handed millimetres, Z up, and component local envelopes start at [0,0,0]. Pose has `translation_mm` and normalized `rotation_quaternion_xyzw`.

**GLB and JSON previews are ALREADY converted to renderer metres/Y up:** `(x,y,z) -> (x/1000,z/1000,-y/1000)`. Do not divide or rotate these vertices again. For per-part GLBs or mesh JSON, apply the manifest's `renderer_transform_matrix`, column-major, exactly once. It converts the engineering rotation through `C R C^-1` and scales translation. The combined `assembly.glb` ALREADY includes these part transforms; do not reapply them.

Manifest includes revision/spec/recipe hash, units/frames, stable part IDs, physical bounds, dimensions, engineering poses, renderer matrices, preview/export artifacts and calibration metadata. STEP assembly uses engineering assembled coordinates. Per-part STEP/STL uses local engineering millimetres; the same part pose maps it back to assembly. Hardware references do not appear under printable output.

For maximum selection/hide/explode control, load per-part preview under an ID-keyed wrapper. Layers from inside out: visual calibration, canonical engineering placement, temporary frontend display offset. CAD/Rendered/Overlay all use the SAME enclosure mesh. Camera, projection, selection, hidden state, explode, X-ray and materials are frontend display state; do not send them as design changes. Check the 100 mm cube = 0.1 m, +Z = renderer up, +Y = negative renderer Z, and translated/rotated asymmetric calibration fixture.

## Independent visual references

`POST /projects/{id}/assets/generate` requires a stable part ID, known photo IDs, explicit `client_operation_id`, and reviewed options (`tier` Gen-2.5-Low/Medium, quality_override 500–20000). Use a component crop, not a whole-product picture. This is the explicit paid action; generic agent retries cannot spend Rodin credits. Model/dimension/pose edits reuse existing assets.

Poll the real job, then fetch `/assets/{asset_id}` for original/derived GLB, bounds and calibration. Status tokens/vendor IDs/signed URLs are private. A reference starts `needs_review` and always has `dimensional_authority:false`. Do not render it as exact measurement evidence. Review alignment through `/assets/{asset_id}/calibration`; a uniform scale, Y-up translation and normalized quaternion sit underneath the engineering wrapper. Unknown size remains uncalibrated. Retrieve originating parts' visual IDs from project/asset state; visual completion does not mutate the immutable engineering manifest.

GLB failure or unreviewed calibration leaves the confirmed engineering envelope usable. Clone visual instances/materials for each part. Keep originals and approximate proportions honest. Do not label Rodin as enclosure generation.

## Available demo

The API-driven fixture writes `.data/demo.json` with actual project/revision URLs. It preserves the baseline and failed candidates and selects the checked H=28 repair. `.data/live-smoke.json`, `.data/photo-pipeline.json` and `.data/live-repair.json` record separate genuine provider results; the supplied image is synthetic and its detection is tentative. Runtime files stay local and are not automatically shared through Git.
