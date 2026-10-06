# Made to Fit — frontend build plan

Build the real studio frontend from the brief, PRD rev 11 and kickoff doc. The mockups set the look; the written contracts set the logic. No live Astra, Rodin or CAD calls are faked. Everything runs in a clearly labelled preview mode until the Python backend is connected.

## Visual system
- Graphite #111315, surface #1A1D20, ivory #F1EFE8, secondary #A4A9AA, accent #E98254, hairline #34393D. Mapped to oklch semantic tokens, dark only.
- Type: a tight editorial grotesk for headings (Inter Tight/Geist-style, weight 600, negative tracking), a clean UI sans, and a small uppercase monospace for technical labels.
- Sharp-to-small radii, hairline dividers, label leader lines like the mockups, no gradient blobs or card grids. Supports reduced motion and keyboard focus.
- Generated photographic hero art for the "Example scene" (exploded enclosure) and concept stills, all labelled as examples.

## Routes
```text
/                 Studio entry: hero, composer, intent shortcuts, Example scene
/studio/$projectId  Workspace that moves through stages:
                    parts review -> discovery -> confirm -> engineering -> export
/projects         Project list (local, from the adapter)
```
Persistent top bar: logo, Studio/Projects, Astra status, and a "UI preview · sample data · backend disconnected" badge.

## Stages in the workspace
1. **Parts review** (mockup 2): editable brief (have / want / experience and tools / constraints / still to confirm), photo with editable part anchors, parts rail, one next question at a time, experience chips. Proposed vs accepted kept visually separate.
2. **Discovery** (mockup 3): up to three concepts. Large selected concept on stage, filmstrip of alternatives. Purpose, parts used/unused, extra hardware, fit for user, difficulty, uncertainties, next measurements. Buttons: Develop this concept, Refine with Astra, Compare, Back to parts. "Concept preview · dimensions pending" label.
3. **Confirm dimensions**: structured inputs per part. Blank is unknown, never zero. Each source proposal needs explicit review.
4. **Engineering workspace**: parts tree (visibility, isolate), 3D canvas, a side panel with Astra / Inspect / Checks tabs, a strip for revisions and job status. Chat cards for identity proposals, missing measurements, job activity and proposed changes (Preview candidate / Apply checked change / Keep current). Context chips. Clicking a part selects it in chat, tree and canvas.
5. **Export**: STEP/STL, design record, GLB references. These are enabled only when the adapter reports real artifacts. In preview mode they stay disabled, with an explanation.

## 3D viewer (React Three Fiber + Drei)
- Procedural enclosure (rounded shell, lid, bosses) and boxes for each part, built from canonical mm dimensions.
- Orbit, pan, zoom, fit; top/front/side/iso presets; select, hide, isolate; dimension and envelope toggles; explode slider; X-ray; CAD / Rendered / Overlay modes, all sharing one assembly state and camera.
- Unit and axis conversion from mm Z-up to scene Y-up happens once, in one documented module.
- Explode and X-ray only change the display, never placements.

## Data and backend adapter
- A `BackendAdapter` interface typed from the PRD contracts: health, photo upload/analysis, evidence lookup/review, concepts, confirmations, Astra orchestration, reference jobs, candidate build/check/accept, artifacts.
- `HttpAdapter` uses a configurable `VITE_API_BASE_URL`. `FixtureAdapter` is a separate, labelled preview mode. If a real request fails, the user sees an error with a retry option; the app never falls back to sample data silently.
- Shared polling, loading, error and retry handling through TanStack Query. Project state lives in a single store (zustand); the brief is derived from canonical state, never from chat text.
- Draft, candidate and accepted revisions stay separate; a failed candidate keeps the last accepted revision.

## Technical notes
- Packages: three, @react-three/fiber, @react-three/drei, zustand, zod.
- The canvas is client-only and loaded lazily behind `ClientOnly` so server rendering stays safe.
- Each route gets its own head metadata, and the placeholder index is replaced.
- Add `AGENTS.md` rules for the adapter boundary, the units module and the fixture labelling. Save the palette and copy to memory.
- Tests: blank dimension stays unknown (not 0), exports are disabled without artifacts, the mm to scene conversion, and a failed HTTP call doesn't fall back to fixture data.

## Handover report
At the end I'll report what works, what is preview-only, the adapter methods the backend needs, and the run/build commands.
