# Continuity — 6 October 2026

Canonical working checkout: `/Users/vikkash/dev/made-to-fit-astra-hack`, branch `main`, fast-forwarded to `eaba3a3` (latest recovered Lovable dimensions flow). Original backend and second clone at `/Users/vikkash/dev/made-to-fit-backend` remain preserved.

Recovered Python backend source into `backend/` without nested Git metadata or environments. Original service on port 8000 is untouched. A SQLite online backup and registered artifacts were copied into ignored `backend/.data/`; local server configuration stays ignored. Integration service uses port 8001 and frontend port 5173. Keys, provider outputs, local databases and virtual environments are excluded from Git.

## Completed and verified

- BackendAdapter now maps the Python wire contract for project intake, photo analysis, inventory, identity/crop/dimension confirmation, research, concepts, chat, candidates, CAD checks, explicit acceptance, references and artifacts. Server state remains authoritative and failed HTTP calls never fall back to fixtures.
- Native CadQuery meshes and frozen assembly placements drive the engineering viewer. CAD/Rendered/Overlay, selection, hide/isolate, camera, X-ray and explode operate on the real assembly. Display changes do not affect checks or exports.
- Failed CAD candidates remain separate from accepted revisions. Live synthetic regression: a taller battery fails clearance, then increased enclosure height passes with 2 mm clearance while preserving locks. Artifact downloads were checked against registered hashes.
- New candidates target Bambu P2S 256 × 256 × 256 mm. Printable base/lid are watertight CAD tessellations; geometry-only combined and individual 3MF plates have millimetre units and independent bed placements. Oversized combined layouts retain separate plates where possible. Hardware and Rodin meshes are excluded from print geometry.
- Added configurable lid locating register and fit clearance. Legacy register defaults to zero; the new frontend enclosure defaults to a 2 mm register. Lid print orientation places the full slab on the bed with the register facing up. Interference and printer bounds checks are covered.
- Native Bambu Studio imported the latest 3MF successfully: two separate objects, manifold=yes, correct dimensions. The OPC relationships and core model use default XML namespaces, required by Bambu's importer. This is import verification, not slicing or printing.
- A real detailed Rodin job generated the blue component from its reviewed photo crop: 19,630 triangles, valid 2.16 MB original GLB, approximately 35 seconds. The older green reference also exists. Both remain appearance references; unknown physical dimensions are not inferred from generated geometry.
- Original-reference viewer and guided uniform alignment/axis rotation preview work through BackendAdapter. Calibration requires confirmed current dimensions and records aligned_size_mm. A stale alignment cannot replace the frozen measured envelope. Rendered mode uses reviewed references; CAD/Overlay preserve engineering envelopes.
- Fixed the misleading red failure overlay: the photo analysis succeeded; the historical failed job was specification lookup, followed by a successful lookup. Only the latest photo-analysis failure appears over the photo. Historical jobs remain in task history.
- Persistent elapsed timers use server timestamps. ETA ranges use same-kind successful job history, matching Rodin tier/detail; insufficient history explicitly shows no reliable ETA. No invented percentages. Timers appear for photo analysis, research, concepts, Astra, Rodin and CAD builds.
- Live Astra inventory test returned two structured proposals with unknown dimensions retained. Live chat correctly summarized check coverage. Both gpt-6-astra and gpt-6.1-sol are available; the backend remains configured for Astra. No comparative model evaluation has been completed.
- Preserved the concurrent parts-to-project implementation: purpose/preferences, grounded concept selection, used-part filtering, frozen project goal/concept and native build-guide snapshots. New revisions contain build-guide.md; the current accepted revision guide endpoint is available. Older revisions honestly require rebuilding for a guide. See PRODUCT.md and docs/PARTS-TO-PROJECT.md.
- Replaced viewer label DOM roots with isolated, deferred-cleanup SceneLabel to prevent React 19 removeChild errors when navigating away from CAD.

Validation: 24 frontend tests, TypeScript and production build pass. All 37 backend tests and Ruff pass; native 3MF tests additionally cover Bambu XML namespace compatibility. One existing Starlette test-client deprecation warning and build chunk-size warnings remain.

## Live proof and local services

- Integration API: `cd backend && DATA_DIR=.data .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001`.
- Frontend: `bun run dev --host 127.0.0.1 --port 5173`; ignored .env.local selects that API.
- P2S synthetic dimensions project: `project_d757f4974eaa45948e133bfc07395355`; accepted revision `revision_9b17bc360b3c42eb8fdffd4ecd7a48ec`. This proof predates build-guide registration. Files are in ignored `backend/.data/print-proof/`, including enclosure.3mf, individual plates, STEP and print-layout.json.
- User photo project: `project_a7f7debbbdcd4ae48baf6a4d52e0748c`; measurements still need user confirmation. Do not insert synthetic dimensions into it.
- Detailed reference proof: `backend/.data/rodin-proof.json`; intake proof: `backend/.data/intake-proof.json`; CAD proof: `backend/.data/p2s-proof.json`.
- Another user-owned chat verified discovery using independent ports 8002/5174 and temporary data. Preserve its files and do not stop its services.

## Remaining work and user preferences

The user wants a full UI/UX redesign by another agent because the left workflow is compressed, document-like and lacks differentiation. The ready prompt is **docs/UI-UX-HANDOFF.md**. Keep the actual photos/CAD/reference outputs central and make required actions, optional tools, statuses and history easy to distinguish.

The implementation is locally integrated, not deployed to a hosted HTTPS backend. Production deployment, authentication/tenant isolation and wider provider reliability evaluation remain. Geometry checks do not establish physical closure tolerance, thermal/electrical safety, strength, nozzle/filament settings or slicing. User measurements, required mounts/fasteners/connectors, slicer review and a physical test print are still needed for a real device. Do not describe the synthetic regression enclosure as their final measured enclosure.

User explicitly authorizes Rodin credit use, P2S targeting and frontend changes. They also request regular **commit and push** checkpoints to GitHub. Remote is `https://github.com/vikkash27/made-to-fit-astra-hack.git`; preserve published Lovable history, never force push or rewrite pushed commits. Review staged files for credentials/runtime data, run applicable checks, and push normal commits. Read the actual current status before committing because another chat shares this checkout.

Do not resubmit completed or uncertain paid jobs merely to recover the UI. Existing operation IDs and unknown-submission handling protect retries.
