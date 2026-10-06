# Made to Fit — Lovable kickoff and synchronized viewer handoff

**Date:** 6 October 2026 · **Name:** provisional · **Companion:** FITFORGE-PRD.md revision 11 — final hackathon handoff  
**Status:** Product direction and concept UI. No implementation is claimed.

## What each system makes

| System | Role | Authority |
|---|---|---|
| Astra | Understand photos and requests; research specifications; coordinate component generation, layouts, CAD and checked revisions | Proposes decisions through bounded tools; does not invent measurements/check results |
| CAD / CadQuery | Parametric enclosures and other supported mechanical parts; engineering previews; STEP and STL | Geometry and manufacturing dimensions |
| Rodin / Hyper3D | Independent visual component references and optional cosmetic concepts | Appearance, subject to explicit calibration; not verified fit geometry |
| Lovable | Actual React/TypeScript interface, including workspace, chat and interactive viewer | User experience; consumes authoritative backend state |

There is one enclosure, built in CAD. Rendered mode applies materials to a preview of that same CAD geometry. It does not ask Rodin to reconstruct the enclosure again. Component appearance models are separate from measured engineering envelopes, but share part identity and assembly placement. Exact visual agreement requires actual dimensional geometry; texture-rich image reconstruction alone cannot guarantee it.

## Your workflow when the build window opens

1. Start a new project in Lovable. Attach the current master PRD and concept UI images, including the shared landing/input/discovery concepts and the three chat concepts. Paste the complete prompt below. Explain that images guide styling and layout; written contracts govern logic and dimensions.
2. Let Lovable create the real frontend with a working procedural 3D viewer, interactive UI states and a typed backend adapter. Ask it to fix broken controls/build errors. The preview fixture must be labelled; it cannot pretend to have called Astra, Rodin or CAD.
3. Connect the Lovable project to GitHub, verify synchronization, and use a public repository for submission. Clone that repository into Cursor/Codex. Keep this one frontend; do not rebuild it as a second app. Add the master PRD and this file under docs/ if they are not included.
4. In Cursor/Codex, use the engineering-agent prompt in the master PRD, followed by the supplemental handoff at the end of this file. Start with backend health, canonical assembly schema, genuine CAD build and exports; connect the existing viewer to these artifacts. Then integrate live photo/spec review, Astra orchestration and Rodin jobs. Follow the full master milestones; backend work need not wait for every UI polish item.
5. Run the frontend and native Python CAD backend locally first. Test millimetres/axes, revision identity, component reference calibration, camera persistence, explode isolation and real downloads before deployment. Hosted Lovable previews require a backend reachable over HTTPS; a remote browser cannot call your laptop's localhost. Configure backend URL/CORS or use an appropriately secured temporary deployment. Keep provider keys server-side.
6. Exercise a fresh photo/component set and an unexpected edit. Record the narrated one-minute demo early, using an already loaded local session and cached accepted artifacts as the network fallback. Make public repo/video links accessible before the 20:30 BST deadline.

The supplied guide states build time is 18:30–20:30 BST. Create the submitted code and functionality during the event. These planning documents and mockups are preparation, not evidence of event implementation. Solo is permitted and does not change the agreed product scope.

---

## Copy this complete prompt into Lovable

Build the actual frontend for **Made to Fit**, a browser hardware-design workspace for makers, engineers and 3D printing. The name is provisional and must be easy to change. This is the working application interface, not a marketing website. Read the attached master PRD as the engineering specification. Treat the supplied images as concept references; never copy incidental numbers or apparent engineering results from image pixels.

### Product and core journey

Narrative: **You bought a hardware kit, or have components lying around. Made to Fit helps you find a useful project that matches your experience, tools and interests—and develop its physical design. Already have a prototype? Bring it in to iterate its layout, supports and printable parts.** These are two user needs in one product, not two separate apps. Do not make novice onboarding mandatory for experienced users.

Users start in the same place with a photo of laid-out or connected prototype components, manual component entries or specification links. They either choose **“I have an idea”** and describe what to build, or **“Explore my components”** and ask what useful products they could make. GPT-6 Astra proposes component identities, researches specifications, generates grounded product concepts when needed, asks for relevant missing measurements, coordinates independent visual references, arranges components and creates dimensioned CAD through the backend. Users inspect, request changes, review checked candidates, accept a revision and export files.

Support fresh user inputs and different component counts/dimensions. Enclosures are the first design family; keep goal entry and design schemas extensible for display housings, stands, docks, brackets, fixtures and future designs. Do not build a collection of predetermined successful demos.

The workflow is: **shared parts/photo/intent intake → review identities and online evidence → develop existing idea OR discover and choose a concept → confirm relevant dimensions/interfaces → independent references/envelopes → layout and CAD → inspect/check → request change → checked candidate → accept → export.** Both intents converge; no second unchecked design pipeline.

### Functional landing and initial input — build this first

The opening is a premium **Astra-guided design studio**, not a promotional website or a generic intake form. The user explicitly rejected the earlier white cards/forms as too basic. Follow the new premium studio mockups for visual direction; retain written contracts for behavior. Use a compact header, strong editorial headline **“Your parts. Their next life.”**, a large spatial working canvas and a single prominent composer **“Show me your parts, or tell me what you want to make.”** Let users drop a photo directly into the scene, attach it in the composer or enter a goal/list. A sample assembly before upload must be labelled **Example scene**, separate from actual project evidence.

Use small intent shortcuts **I have an idea** and **Explore my components** near the composer, not giant obligatory option cards. Astra can interpret intent from the user's request, showing an editable brief and asking if ambiguity matters. Keep photo/manual parts/spec links available under both paths. Preserve all inputs when changing intent; do not create duplicate projects. Use progressive disclosure rather than display a complete form by default. Structured fields/confirmations still exist when needed and through an obvious manual edit route.

Idea mode: user tells Astra what to build, for example “A small desk assistant with an angled display and removable battery”. An editable goal field is available in the brief/manual view. The relevant next action is **Develop my idea**. A useful goal is required for this mode, but the initial conversation can begin before all components have been entered.

Discovery mode: user can simply upload/list their parts or optionally say “Something useful for my desk”. Astra asks an optional targeted preference and suggests grounded directions. The relevant next action is **Explore what I can build**. A predefined product idea is not required. Do not ask users to invent a goal before receiving ideas.

Both modes offer compact optional constraints: desk/wall/portable context, preferred orientation, maximum size if known, must-use components, existing connections to preserve, and **Allow additional parts**. Default suggestions should prioritize the supplied parts. Additional dependencies must be explicitly listed. Avoid fabricated budgets/print-bed dimensions and compulsory lengthy onboarding.

Discovery also adapts to user-reported experience and tools. Ask progressively with three simple responses when relevant: **First hardware project / A few projects / Experienced**. Interests, available tools (printer/print service, breadboard, soldering equipment if relevant), existing software/electronics skills and optional time/budget may tune suggestions. Each is optional, editable and distinct from dimensional confirmation. No demographic inference or invented skill score. A beginner should see achievable steps and explicit dependencies; experienced users can request more demanding or modular directions. Unknown tool availability stays unknown.

After actual shared photo analysis, show editable part anchors on the spatial canvas and a compact parts rail with proposed identities/evidence state. Keep the source photo accessible. Users correct/add/delete parts. Photographed wiring is not proof of functional compatibility. Astra asks focused identity/function clarifications; not every mechanical dimension is needed to brainstorm. Unknown dimensions stay provisional.

### Astra on the front screen — adaptive understanding, not decoration

The onboarding assistant is a real use of Astra through the existing backend agent/photo/spec/concept adapters. A validated, versioned draft brief shows **What you have / What you want / Constraints / Still to confirm**, with observed/proposed/accepted provenance. It is a projection of canonical project state, not a separate state system derived from transcript text.

Examples of adaptive next steps: no inventory → ask for photo/list; unclear part → ask which module it is; known parts/no goal → offer grounded product directions; clear goal → ask its most relevant constraint; sufficient confirmed geometry → propose CAD build. Ask one useful question at a time. Structured chip/numeric responses update actual state. A conversational summary cannot silently confirm measurements or accept a CAD revision. Do not pretend to know hidden parts, use an invented confidence meter or start paid Rodin generation because a user merely uploaded a photo.

For a user entering hardware, one useful question is “Is this your first hardware project?” The reply updates the evolving brief and adapts the next suggestions. Astra should explain “Why this fits you” from supplied experience/tools/preferences, not produce decorative personalization. Include concise skills/tools required, practical difficulty reasons and a staged next-step path. Missing firmware, drivers, power/storage modules and assembly work must be explicit rather than imply the photorealistic concept is a working device.

Turn user evidence into the evolving scene: uploaded image → editable part anchors/envelopes → provisional form-factor arrangement → genuine CAD preview. Animate only actual state transitions, not a fake scanner or timer. Contextual highlights show which part Astra refers to, and its concise public explanations make decisions legible without displaying private reasoning. Provide Edit brief, Undo and manual entry. Preserve work through failed services and expose specific recovery steps.

Design the opening as an intelligent studio rather than a website with a chatbot bolted onto the corner. Compact Astra dialogue can sit along the scene edge or emerge beside the relevant object; the persistent composer and brief create continuity. Later engineering screens retain the same typography/material tone and reveal denser inspector/check controls when needed.

### Components-to-concepts discovery screen

Add an exploration state/page titled **“Ideas from your components”**. Use the actual uploaded inventory and preferences. Runtime Astra should propose up to three genuinely useful directions, with fewer results or a clarification if evidence is insufficient. Do not use a fixed catalogue of cards in live mode. A fixture preview is acceptable only with the permanent sample/disconnected label.

Each concept has a title/use case, concise benefit, components used/unused, additional hardware/firmware/software dependencies, form-factor/layout rationale, unresolved compatibility assumptions, relevant real evidence links, CAD capability support and next measurements needed. Use qualitative comparison such as compactness, accessibility, inventory coverage and supported geometry; no invented probability/confidence scores.

Also show **Why this fits you**, required skills/tools, difficulty with reasons and a concise project path: verify parts/interfaces → establish the needed functional prototype/firmware task → confirm mechanical requirements → develop CAD → fabricate/assemble/test. Actual completed platform tasks alone receive completion status. Retrieved build resources may be linked; never invent wiring diagrams, pin mappings, firmware downloads or finished functionality. Keep this guidance compact and contextual rather than a wall of instructions.

Example illustrative inventory: controller, display, temperature sensor, battery. Possible directions include a desk temperature station with readable screen angle, a wall monitor with mounting features, and a portable monitor with battery access. These are concepts, not proof of functioning wiring or firmware. Do not claim sensor capabilities the actual inventory lacks.

Use a large selected concept on the spatial stage and an understated alternative filmstrip/rail, not three equal generic white cards. Alternatives have provisional 3D layouts or labelled schematic thumbnails. The selected concept shows layout/details and contextual Astra dialogue. Provide **Develop this concept**, **Refine with Astra**, **Compare** and **Back to parts**. Label previews **“Concept preview · dimensions pending”** when appropriate. Refinements: “Make it portable”, “Use only these parts”, “Keep the display face up”, “Combine these two ideas”.

Provisional layouts are lightweight envelopes/procedural shapes or explicitly estimated CAD previews derived from concept parameters. Do not generate whole-product Rodin meshes as a substitute for CAD. Reuse independent component appearances when available; do not automatically run paid jobs for every proposed concept. The chosen design uses the same explicit Rodin reference flow as any other project.

Choosing a concept records its inventory snapshot and updates the goal/constraints, then enters the existing dimension-confirmation/CAD journey. Selection is not engineering acceptance, dimensional confirmation or approval to purchase additional parts. Inventory edits must mark affected concepts stale or trigger explicit refresh; never build an old concept against silently changed inputs. Preserve photos/parts/evidence when navigating back.

Show readiness accurately: concept proposal, needs measurement, available CAD family or unsupported geometry, and relevant functional compatibility unknowns. A generated concept and a checked CAD assembly are different states. Unsupported design families may be explored, but cannot claim working printable outputs until their CAD operations/checks exist.

### Non-negotiable technical boundaries

- **CAD makes the enclosure. Rodin does not make the engineering enclosure.** Astra coordinates both through backend tools.
- Render the enclosure from CAD-derived preview geometry in every model mode. Changing materials cannot change its shape. Backend CAD also creates STEP/STL exports from that revision.
- Rodin generates independent appearance references for components. Keep stable IDs and calibration metadata; reference meshes are not the basis of fit checks. Unknown dimensions remain unknown until resolved.
- The frontend never contains OpenAI/Hyper3D API keys. It calls a typed backend adapter. Native CadQuery runs in a separate Python backend, not a browser bundle or assumed Lovable edge function.
- Backend accepted/candidate states, artifact availability, source evidence and checks govern UI labels. Never fake generation, retrieval, progress percentages, downloads, checks or a successful engineering result.
- Keep the generated React/TypeScript scaffold, package scripts and paths. Use compatible Three.js / React Three Fiber / Drei where sensible. Do not create a second frontend or impose a conflicting monorepo structure.

### Visual direction

Make a distinctive premium contemporary hardware studio. Use graphite #111315 app background, tonal #1A1D20 surfaces, warm ivory #F1EFE8 type, secondary #A4A9AA, oxidized orange #E98254 sparingly for primary actions/selection, borders #34393D and spatial viewport #15191C. Warning #E6B86A and error #F09086 need readable dark treatments and text/icons. Avoid random neon gradients, frosted glass panels, boilerplate SaaS dashboards and excessive rounded cards. An optional light inspection view is fine; the new default onboarding is the dark studio.

Use an editorial grotesk for large opening phrases, clear UI sans for controls, small monospace technical labels and tabular measurement numerals. Use deliberate asymmetry, excellent negative space, precise rules and predominantly 4–8 px corners. The product/parts provide the imagery. Materials/contact shadows should help read physical form; avoid cartoon graphics, excessive bloom and empty visual effects. Transitions around 150–250 ms follow real state; respect reduced motion and preserve camera. Do not constantly spin models during inspection. Design details must remain fast on normal laptop GPUs; no heavy decorative shader required.

At approximately 1440×900: onboarding is an open spatial composition with compact header, focal scene, narrative/brief and persistent composer. It need not show every engineering panel yet. As design progresses, reveal a 220–250 px parts rail, flexible canvas, resizable 360–420 px context/inspector and compact revision strip. Collapse panels at smaller widths. Maintain contrast, readable fields, keyboard focus and accessible names.

### Main workspace and navigation

Top bar: brand, editable project name, Design / Inspect / Export navigation, save state, compact real backend status. Start in the functional shared intake; progress through Explore when selected, then the common creation workspace. Do not add authentication, billing, a marketing homepage or unrelated analytics.

Left panel: intake stages during photo review; parts tree during assembly. Parts have stable IDs, names, visibility controls, selection and badges such as CAD, confirmed envelope, Rodin reference or needs measurement. Include add part, photo upload and a compact source/evidence entry point. Tree selection and canvas selection must identify the same part.

Central area: photo/crop review initially, then actual interactive 3D. Provide a toolbar that is legible against the model area. Bottom strip: accepted revision, current candidate when present, comparison/revert navigation and real compact job status. A failed candidate must leave the accepted design available.

Right sidebar: Astra / Inspect / Checks tabs. Astra chat stays beside the active photo or model. Inspect shows structured dimensions, transform, evidence and locks for the selected part. Checks shows results and coverage with affected-part links. Export is a dedicated focused page/workspace state retaining assembly context.

### Photo and evidence review

Allow image upload/drag-and-drop, reasonable file-size/type validation and one or more photos. Show numbered editable crop boxes and component cards. Candidate identity is tentative until confirmed. Users can rename, split/merge/correct detection, upload another view, add a part manually or choose another match.

For each relevant dimension show its value, mm, source/provenance and acceptance state. Keep identity confidence separate from dimension evidence. A manufacturer document is not a confirmed match simply because a similar chip was found. Unknown board assembly height, connector position or mounting-hole details stay visibly unresolved. Source conflicts show alternatives instead of averaging them.

Provide focused measurement questions and numeric fields. Blank is unknown, not zero. Confirm identity and dimensions through structured controls. Allow estimated previews only if clearly labelled and backed by an explicit preview mode; do not enable accepted checked-fit creation while required fields are unknown.

### Contextual Astra chat — implement carefully

Header: “Astra” and a short descriptor such as “Design assistant”, with collapse/resize controls. Pin compact context chips for active revision, selected part and active locks. Offer contextual suggestions such as “Create an enclosure”, “Explain this clearance”, “Move the battery” and “Add ventilation”; do not limit input to a single scenario.

Keep a persistent thread per project. User messages are compact, lightly tinted bubbles; assistant content is clean text with structured cards. Messages may reference parts: clicking the reference selects/focuses the actual part in the canvas/tree. The composer says “Describe what to build or change…” and supports text plus optional photo/document attachment. Show pending state and specific retryable failures. Do not add simulated live voice or a decorative microphone pretending to work.

Implement these chat states:

1. **Initial design:** user describes their product. Astra displays a concise plan covering part review, confirmed layout constraints and CAD creation. Show a separate optional “Visual component references · Rodin” action/status. Never label enclosure generation as Rodin.
   **Discovery variant:** Astra explains concepts based on the actual inventory, highlights missing dependencies and compares form factors. Selecting/refining a concept remains separate from confirming engineering dimensions. Context chips include the selected concept and inventory version.
2. **Missing measurement:** an actionable part-specific card shows found dimensions/source and the unresolved field. Example: board length/width from a proposed datasheet, assembled height still unknown. A numeric input and Confirm button update structured state, not merely append chat text. Unknown/default values cannot silently become accepted.
3. **Running tools:** display actual stages such as Researching specifications, Generating reference, Building CAD and Checking clearance. Use statuses/timestamps only from backend events. Show short decision summaries, not internal chain-of-thought. Put verbose diagnostics in an optional activity drawer.
4. **Checked repair:** show failed constraint, measured gap, required gap, shortfall, proposed geometry change, preserved locks and candidate check results. Buttons: Preview candidate, Apply checked change, Keep current. Apply is enabled only for the actual eligible candidate and uses its ID/parent revision. A new request must not overwrite the accepted design automatically.
5. **Applied change:** identify the accepted revision and actual changed fields. Model, dimension values, check results and export availability all update from that same snapshot. Provide Undo/revert through revision operations, not invented history.

Handle offline/error/cancelled/stale states visibly. A paid Rodin retry cannot be triggered by a generic chat retry without checking the existing job. Selecting another project must not let an old response mutate the new project.

### Synchronized 3D views

Provide **CAD / Rendered / Overlay** as three presentation modes of one assembly:

- **CAD:** CAD enclosure preview, measured component envelopes/confirmed feature geometry, optional edges and dimension labels. This is a browser engineering preview, not a claim to offer a complete native CAD editor.
- **Rendered:** exactly the same enclosure preview with visual materials; independent calibrated Rodin component references when available. Fall back to envelopes when references are pending, failed or unreviewed.
- **Overlay:** CAD/envelopes with translucent or wireframe appearance references to reveal alignment and approximation.

All views share revision ID, stable part IDs, canonical dimensions and assembly placements. Switching views preserves camera, target, projection, selection and hidden parts. Optional split-screen comparison uses linked cameras. Never generate a new enclosure mesh independently for Rendered mode.

Implement real orbit, pan, zoom, fit view, top/front/side/isometric presets, part selection, hide/show/isolate, dimension/envelope toggles, **explode slider** and **X-ray toggle**. Orbit/pan/zoom must operate on an actual canvas with geometry, not a static image. Use clear navigation hints and ensure controls work when a text field is focused.

Explode applies only temporary display offsets to wrapper groups. Reset restores canonical assembled positions. It must not change the design state sent to the backend, checks, part dimensions, exports or accepted pose. X-ray makes the enclosure translucent while keeping internal parts readable; it is a material/rendering mode, not a scan or hidden-component reconstruction. Ensure cloned materials, depth/render order and restored opacity are handled. Optional section-plane clipping is a separate additional feature.

Engineering coordinates are CAD millimetres with Z up. Use one tested conversion boundary to Three.js metres with Y up: (x, y, z) becomes (x/1000, z/1000, -y/1000), with corresponding rotation conversion. Camera, labels and grids must use this same convention. Fit to real bounds; use a known 100 mm cube to verify scale and axes. Keep mesh calibration beneath the engineering placement and display explode layers above it. Source units and conversions must be explicit.

Do not mutate a cached GLTF scene or materials shared by different components. Clone instances, isolate selection effects and dispose replaced resources. Each reference keeps original asset and calibration metadata. Uniform scale from a trusted reference is preferable; a nonuniform bounding-box match is approximate and must be labelled. Rendered fit does not certify the connectors/holes of a generated mesh. Exact geometry requires a manufacturer CAD model or confirmed authored features.

### Design, inspection and iteration

Use structured numeric fields for dimensions and clear mm labels. Users can change component size, enclosure dimensions and constraints; backend responses drive the new candidate. Include placement/footprint/thickness locks and show what a request would preserve. Direct transform gizmos are an additional refinement; form/chat editing must already work.

Show check coverage. Actual CAD validity, containment, proxy clashes and clearance are distinct from unimplemented thermal/electrical/strength/printing analyses. Highlight affected parts/regions and link them to the corresponding check. A green badge means the supported checks passed for that revision, not that the product is universally safe or mechanically certified.

Use the master's deterministic fixture for development: external 88×62×24 mm, 2 mm base/lid/wall, two independent component envelopes. Increasing battery height from 10 to 20 mm creates a -2 mm lid gap, with 2 mm required clearance and 4 mm shortfall. The checked repair increases enclosure height to 28 mm, giving 2 mm gap while preserving footprint and locked controller placement. The full fixture coordinates are in the master PRD. This is a labelled synthetic regression fixture, not the only supported design.

### Export

Export page shows the accepted revision, assembly preview, actual applicable checks and unresolved coverage. Group files into Printable CAD (STL/STEP), Design record (specification/recipe/check/source manifests), and Visual references (GLB etc.). Download buttons only appear enabled when the corresponding files exist. Do not fabricate file sizes, slicer output or estimated print time. Clearly separate reference meshes from printable CAD parts. Export from assembled engineering coordinates even when the displayed model is exploded.

### Integration structure and preview behavior

Create reusable components for StartIntake, IntentSelector, PartInputs, DiscoveryPreferences, ConceptGallery, ConceptCard, ConceptDetail, WorkspaceShell, PhotoReview, PartsTree, AssemblyViewer, ViewToolbar, AstraPanel, MeasurementCard, CandidateChangeCard, Inspector, ChecksPanel, RevisionStrip, JobStatus and ExportPanel; adapt names to the scaffold. Keep one typed API adapter and one canonical assembly/revision type. Use an explicit view-state store for camera/mode/selection/visibility/explode/X-ray separate from engineering state.

Use the master PRD's HTTP contracts as authoritative rather than inventing a second incompatible API. Keep API base URL configurable and polling/error/retry handling centralized. Build adapter functions for health, upload/analyze, source review, concept generation/listing/selection, confirming fields, reference jobs, chat/orchestration, building/checking candidates, accepting/reverting and artifact download. Concept routes: POST /projects/{id}/concepts/generate, GET /projects/{id}/concepts, POST /projects/{id}/concepts/{concept_id}/select, with inventory version/hash and client operation ID where required. Project intent_mode is idea/discover; goal may be null in discovery. Follow full schemas in the master PRD. Implement live connections when a backend is available. Until then, route explicit preview fixtures through a separate adapter with a permanent “UI preview · sample data · backend disconnected” indicator. Do not silently fall back to sample success when real API requests fail.

For preview, procedural shapes are acceptable in the interactive canvas with a visible sample label. They are not a real CAD build or paid Rodin result. With live state, use actual artifact URLs/part IDs and no sample thread masquerading as runtime Astra. Preserve the accepted snapshot if a subsequent request fails.

### Finish and hand over

Make the current frontend run cleanly, with functional camera/UI controls and coherent states. Provide a short handoff listing implemented interactions, preview-only behavior, required backend adapter methods and remaining integration tasks. Confirm build/type errors are resolved. Do not claim provider or CAD integration was tested without a live result. Preserve agent freedom to improve layout/library choices within these contracts; do not drop the full agreed scope or add unrelated features.

---

## Supplemental prompt for Cursor/Codex after cloning

Read docs/FITFORGE-PRD.md revision 11 and docs/LOVABLE-KICKOFF.md plus the actual generated repository before changing architecture. Preserve and integrate the Lovable frontend. Use the engineering-agent prompt in PRD section 23.2 as the main backend direction.

First establish a genuine CAD build and shared assembly manifest, and render it in CAD/Rendered/Overlay modes using the same enclosure tessellation. Artifact revision/hash, part IDs, engineering transforms, units and calibration must be consistent. Add the Python backend in this repo; do not attempt native CadQuery inside the browser. Confirm preview and STEP/STL files originate from the same frozen revision. Enforce locks, candidate/accepted states and immutable snapshots server-side.

Test axes/scale, camera preservation across modes, selection identity, calibration warnings, X-ray material restore, display-only explode, dimension-change invalidation and matching downloads. Then complete the full live photo/evidence/Astra/Rodin pipeline and variable-input workflow in the master milestones. Separate API/CAD failures from UI preview mode; never invent successful checks. Report real completion and evidence, and keep secrets out of the public repository and browser.

Implement the shared idea/discovery intake and real adaptive Astra onboarding, experience/tool/interest preferences, structured concept tools/routes, inventory snapshots, grounded dependencies/capabilities and stale selection checks from PRD sections 4.1/5.9. Allow discovery without a goal; selection sets it and enters the same confirmed CAD pipeline. The live brief is a canonical-state projection. Concept previews remain schematic/estimated where needed. Do not spend credits reconstructing every proposed complete product. Prove both intents, fresh inputs and T21–T27 alongside existing checks.

## What the three new chat mockups illustrate

1. **Review + measurement:** contextual chat beside a photo; source-backed proposed dimensions, one targeted height question, structured confirmation.
2. **Assembly + planning:** CAD/Rendered/Overlay selector, X-ray/explode controls, real model workspace and Astra's CAD plan with Rodin references as a separate track.
3. **Conflict + checked repair:** shared camera/model context, diagnostic values, preserved locks and an explicit checked-candidate Apply action.

Mockup text and incidental geometry are illustrative. Implement computed data from the written specification rather than generated pixels. Upload the images directly as visual references; do not use them as the 3D viewport itself.

## Additional landing/input/discovery mockups

1. **Shared start:** photo/manual/spec inputs, “I have an idea” vs “Explore my components”, relevant goal/preference input and one primary action.
2. **Populated exploration input:** four proposed component cards from a photo, optional desk/wall/portable constraints and explicit additional-parts preference.
3. **Concept results:** grounded alternative form factors with provisional previews, dependencies/readiness, contextual refinement and a clear “Develop this concept” handoff to CAD.

Earlier basic light/form/card mockups are superseded for styling by the premium studio concepts: (1) spatial studio start with one composer, (2) Astra understands the actual uploaded inventory and asks a contextual question, (3) large selected form-factor concept with understated alternatives. Functional measurement/review/repair/export requirements remain. Hardware details and apparent geometry in all concept images are illustrative, not evidence of compatibility or verified CAD.

## Documentation references

- Lovable GitHub sync: https://docs.lovable.dev/integrations/github
- Lovable external APIs: https://docs.lovable.dev/integrations/any-api
- CadQuery export and preview formats: https://cadquery.readthedocs.io/en/latest/importexport.html
- OpenAI model guidance: https://developers.openai.com/api/docs/guides/latest-model
- Hyper3D vendor documentation: https://docs.hyper3d.ai/en

These links supplement the exact integration contracts and verification details in the master PRD. Verify current vendor capability/access during implementation.
