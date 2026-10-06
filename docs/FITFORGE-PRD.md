# Made to Fit — master product and engineering handoff

**Revision:** 11, final hackathon handoff: parts-to-projects discovery, guided studio and checked CAD iteration — 6 October 2026  
**Display name:** Made to Fit (provisional; user has not made a final naming decision)  
**Previous working name:** FitForge; the document filename remains stable  
**Owner/team:** Vikkash Sureshkumar, solo participant  
**Event:** GPT-6 Astra Hackathon London, OpenAI × Lovable  
**State:** Planning and concept UI only. This document does not establish that any application, integration or manufactured part has been built.

## Read this first

Build a browser workspace that turns photographed hardware components into useful product concepts, reviewed assemblies and dimensioned CAD parts. Users either have a product idea already or want to discover what they can make from their available parts. Astra interprets the input, looks up specifications, proposes grounded concepts/layouts/designs and revises them using computed checks. Rodin generates independent visual references. CAD creates the geometry that supports dimensional claims and exports.

**Core journey:** shared photo/parts/intent intake → editable identification and specification lookup → develop an existing idea OR explore grounded concepts and choose one → confirm relevant dimensions/interfaces → component models/envelopes → layout and CAD → inspect/check → request changes → checked revision → export.

Vikkash will create the actual interface in **Lovable**, connect it to GitHub, then clone that repository into **Cursor/Codex** for Python backend and frontend integration. Preserve the Lovable scaffold. Use one canonical repository. Solo participation does **not** reduce the agreed scope. P0 requirements below remain targets; enclosure creation comes first, with additional design families following on the same general CAD foundation.

The coding agent may choose effective libraries, module boundaries, preview techniques and UX refinements within these contracts. It must not hardcode finished responses, invent engineering evidence, silently replace Astra, or reduce the product to a fixed demo. Milestones establish implementation order, not permission to skip requirements. Report actual completion honestly.

This handoff cannot eliminate every dependency or vendor failure. It supplies contracts, live verification gates and diagnostics so the developer can discover failures early and resolve them locally rather than debug the entire stack at once.

### Hackathon start: exact working order

1. Before the build window, prepare accounts/access, development tools and photos/spec links for actual components. Keep secrets in local backend environment variables. Download this PRD, LOVABLE-KICKOFF.md and the premium studio mockups. Earlier basic light/card mockups are superseded for style.
2. At build time, create the actual Lovable project using the full kickoff prompt and references. Ask for the adaptive studio entry, both intents and working viewer/UI. Explicit preview-only fixtures are labelled; they are not evidence of live integrations.
3. Link GitHub, verify synchronization, make the submission repository public and clone that canonical repo into Cursor/Codex. Put these two documents in docs/; use section 23.2 plus the supplemental kickoff handoff. Preserve the generated frontend.
4. Prove native CAD build/export, API readiness, canonical units/part/revision contracts and a genuine viewer-loaded artifact. Integrate Astra photo/spec/discovery/iteration tools and Rodin independent assets through those contracts. Use the section 19 milestones; UI polish and backend tasks can proceed concurrently without conflicting edits.
5. Exercise both user paths, a fresh inventory/idea and the canonical checked repair; preserve the last good local accepted design. Check live vs preview labels, matching downloads and errors before capture.
6. Record a narrated minute early, then publish the repository/video and submit before 20:30 BST. Follow section 22. Do not wait for venue Wi-Fi to record the only take.

The final submitted app is a new event implementation. No existing product code is assumed. This is the consolidated direction; later agent decisions should implement it, not restart product planning.

### Document map

| Layer | Sections | Use |
|---|---|---|
| Product and visual requirements | 1–5 | Understand the value, full scope, journey and UI |
| Engineering contracts | 6–16 | Architecture, data, geometry, vendors, jobs, APIs and exports |
| Delivery and verification | 17–22 | Lovable handover, prerequisites, milestones, tests, debugging and submission |
| Coding-agent prompts and references | 23–24 | Start development, exercise judgment and verify vendor documentation |

## 1. Product narrative, users and competition

**Positioning:** Help makers turn the components they already have into a product, and keep the surrounding design consistent when those components change.

Suggested opening: “You bought a hardware kit. You have components on your desk. What should you actually build?” Suggested tagline: **From loose parts to your next prototype.** Narrative: Made to Fit turns the hardware you have into project directions that match your experience, tools and interests, then helps develop the physical design. If you already have a project, bring it in and iterate its layout, supports and enclosure through checked CAD. Opening studio phrase “Your parts. Their next life.” supports both audiences. Treat branding as editable configuration, not a reason to restructure the repo.

The problem is practical: a working board, battery and display still need packaging, mounting points, accessible connectors and room to assemble. Users repeatedly look up dimensions, rebuild parts and discover conflicts. A visually convincing 3D reconstruction alone does not establish fit.

Initial users: electronics makers, students, hardware teams and robotics developers printing housings, brackets or fixtures. The first task is enclosure creation; the reusable concepts are components, evidence, interfaces, geometry, constraints and revisions.

Two linked entry narratives: **New to hardware:** a kit/unused components and no clear idea; discover achievable, useful projects with a concise path to the next step. **Already building:** a connected prototype or explicit product goal; improve form factor, access, mounts and fit as parts change. Do not limit discovery to novices or make experienced users complete beginner onboarding. Experience preferences tune explanation and project demands, not the accuracy standard or the size of the implemented platform scope.

### Competitive context

Public vendor documentation checked on 6 October 2026 establishes substantial overlap. These are vendor-described capabilities, not independently benchmarked performance:

| Product | Relevant overlap | Positioning implication |
|---|---|---|
| Zoo / Zookeeper | Conversational creation/editing of parametric CAD and model-derived information | Natural-language CAD alone is not a unique claim |
| Adam | Hardware CAD, research, sourcing, BOMs and engineering documentation | “AI assistant for hardware” alone is too broad |
| Backflip | Photo/drawing/scan-to-parametric CAD workflows | Reconstruction alone does not distinguish this project |
| SpeakCAD | Enclosure generation, dimension edits and printer-fit workflows | A generated box with a lid alone has close competition |
| Autodesk Fusion | Established electronics/mechanical workflows and packaging tools | Do not attempt to claim parity with a complete engineering suite |

The proposed distinction is the connected workflow: photographed components, exact-variant evidence, explicit uncertainty, independent assembly elements and a tool-checked revision. This is a positioning hypothesis, not proof that nobody else offers a similar workflow. Do not claim “first ever,” a guaranteed perfect fit or a replacement for all CAD.

Astra should drive the engineering decisions visible in the demo. Rodin makes the assembly legible and enriches cosmetic designs. Lovable creates the actual product interface. The CAD kernel and deterministic checks supply geometry evidence.

## 2. Event context and judgment of success

The participant guide supplied by the user governs the event:

| Item | Requirement |
|---|---|
| Date/place | Tuesday 6 October 2026, London |
| Arrival/kickoff | 17:30 / 18:00 BST |
| Build window | 18:30–20:30 BST |
| Team | Up to four; solo expressly permitted |
| Originality | Submitted work must be created during this hackathon; previous product code does not qualify |
| Submission | Team details, short description, public GitHub repo, public one-minute screen/audio video, OpenAI/Lovable use |
| Judging | Four equal 25% criteria: tools in development; tools in product; demo; technical execution |
| Event resources | 100 Lovable Pro credits, $100 OpenAI API credits, $100 Codex credits at check-in |

Hyper3D API access is user-confirmed. Historical credit screenshots are not live balances. Verify account access during development without exposing keys. Planning, dependency preparation and these concept mockups are pre-event materials; do not present them as original event implementation or as screenshots of a finished app. Create the submitted product and its demonstration contribution during the event and attribute dependencies/assets.

### What demonstrates the four criteria

| Criterion | Concrete evidence |
|---|---|
| Development use | Lovable-generated UI commits; concise Astra/Codex implementation and debugging examples |
| Runtime/product use | Real Astra image/spec interpretation, bounded tool execution and checked revision; shipped Lovable-created interface |
| Demo | Clear input → useful output → unexpected edit → checked repair → real export |
| Execution | Consistent units, identity/evidence separation, independent parts, preserved locks, truthful jobs and matching artifacts |

No tool badge or feature count guarantees points. No prediction of placing is part of this PRD. Useful, original working behavior and a readable video are the evidence.

## 3. Scope: full agreed targets and extension path

### P0: implement the complete platform foundation

| Capability | Required behavior |
|---|---|
| Photo-first creation | Upload one/more views, propose editable component crops/list and visible observations |
| Shared intake and discovery | One starting screen: develop an existing idea or explore products from supplied parts; preserve uploads/context across both paths |
| Astra-guided onboarding | Front-screen conversation and editable evolving brief; actual image/spec observations drive the next useful question and concept/layout proposals; manual controls remain available |
| Grounded product concepts | Runtime Astra proposes useful concepts with parts used, layout/form-factor rationale, missing parts, uncertainties and capability support; selected concept enters the same CAD workflow |
| Experience-aware project direction | Optional user-reported experience, tools/time/interests influence concepts and explanations; show skills/dependencies and a brief practical build path, with manual editing and no invented proficiency score |
| Online part enrichment | Real search/retrieval from identifiers or links; candidate identities and cited dimensions before measurement questions |
| Confirmation | Accept exact variants and relevant fields; request unknown height/ports/mounting details specifically |
| Independent component assets | Stable component IDs and transforms; per-component Rodin jobs where useful, separately calibrated appearance |
| General CAD recipe engine | Box/cylinder, rigid transforms, union/subtraction, separate assembly parts; fresh compositions rather than response lookup |
| Flexible enclosure workflow | New component counts, sizes and supported layouts generate new real geometry through the same engine/helper |
| Runtime Astra orchestration | Fresh creation and revision using validated tools, useful explanations and deterministic results |
| Assembly workspace | Orbit/select/hide, transparent lid/envelopes, display-only explode, editable dimensions and provenance |
| Supported checks | CAD validity, bounds/containment, proxy conflicts and declared clearance/lock checks; coverage visible |
| Checked iteration | Candidate vs accepted state; failed checks preserve last good revision; locks enforced server-side |
| Persistence/export | Saved assets, sources, revisions and actual CAD/spec/check downloads corresponding to accepted revision |
| Variable-input verification | Fresh component sets/layouts and audience requests work; fixture is a regression case |
| Submission/demo | Public repo, locally captured narrated minute, public links and truthful original contribution |

A component represented by a known licensed manufacturer model or a simple measured envelope need not trigger a paid Rodin job. Still prove at least one genuine Rodin generation, with multiple independent jobs supported when requested. Dimension edits or asset movement must not pay for regeneration.

### P1: refinement and additional designs

Connector cutouts and mounting bosses with confirmed coordinates, revision ghost overlays, package ZIP, assembly instructions, direct transform gizmos, polygon extrusion, patterns, fillets/chamfers, additional asset generation and fresh bracket/stand/adapter cases. Keep these priorities from the agreed enclosure-first strategy; do not downgrade P0 because the team is solo.

### Later: broader validation and mechanisms

Arbitrary STEP import, freeform shell reconstruction/repair, BANG splitting, organic mesh/CAD interfaces, slicer/printer calibration, moving joint analysis, thermal/acoustic/structural validation and general mechanisms. Splitting a mesh does not create valid joints. Generating robot links does not establish a load-bearing robot arm.

| Design family | Outputs | Extra required information |
|---|---|---|
| Displays | Bezels, rear covers, stands, wall mounts | Active area, module envelope, connector/mounting datums |
| Docks | Cradles, alignment guides, cable channels | Device envelope, connector mating direction, clearance |
| Charging stands | Packaging for existing charging modules | Module envelope and separate electrical/thermal validation |
| Smart assistants | Housings, microphone/speaker mounts, faceplates | Real module interfaces; acoustic/electrical validation separate |
| Robotics | Servo brackets, sensor trays, gripper fingers | Known interfaces and motion envelopes |
| Robot arms | Links, joint housings, motor/end-effector mounts | Kinematics, loads, axes/limits and collision sweeps |
| Workshop/repair | Drill jigs, fixtures, spacers, adapters, replacement knobs | Exact mating/workpiece dimensions and physical testing |
| Cameras/sensors | Adjustable brackets, protective hoods, adapter plates and cable guides | Device interfaces, sight lines, mounting surface and cable access |
| Modular test rigs | Shared base, removable board carriers, cable routing and labels | Board envelopes, connector access and desired swapping procedure |
| Wearables | Module carriers, strap attachments and removable housings | Fit/curvature, strap interface and measured component envelope |
| Small robot chassis | Chassis plates, motor mounts, battery trays and sensor supports | Motor/wheel interfaces, clearance and later load/motion validation |
| Control panels | Front plates, encoder/button mounts, display bezels and rear support | Panel components, interface coordinates and desired angle |

### Components-to-products examples

Examples describe possible product directions, not a catalogue of implemented/verified products. Astra must ground new proposals in the actual inventory and mark required firmware, external parts and unresolved interfaces.

| Available inventory | Possible useful direction | Mechanical work the platform can coordinate |
|---|---|---|
| Controller, temperature sensor, display, battery | Desk temperature station, wall monitor or portable monitor | Alternative orientations, display bezel, sensor exposure, battery access and base/mount |
| Controller, camera module, battery | Portable inspection camera or fixed camera station; recording needs verified storage support | Lens opening, grip/base, camera carrier, module mounting and access |
| Controller, speaker, microphone, display | Desktop assistant concept; software/network/power requirements explicit | Display angle, speaker/microphone supports and serviceable shell |
| Motors, wheels, controller, battery | Small rover chassis concept; drivers/interfaces must be verified | Plate layout, motor brackets, battery tray and sensor mounting provision |
| Device, cable/connector, existing charging module | Desk dock or charging stand concept | Cradle, cable guide and connector carrier; supplied power electronics remain separate |
| Several boards, switches and display | Modular prototype station or control panel | Swappable mounts, front panel, shared base and accessible connectors |

Concept discovery is a full foundation requirement. Manufacture-ready support for each additional family still follows the previously agreed enclosure-first operation/check implementation path. Do not equate a concept suggestion with support for arbitrary mechanisms.

## 4. User journey and authoritative state transitions

1. Open the functional start screen, upload components or enter them manually, and choose “I have an idea” or “Explore my components”. A specific goal is required for the idea path; discovery permits no predefined product goal. Optional preferences include use setting, size, form factor, parts to use and whether extras are allowed. Specification/document links remain available.
2. Astra proposes crops, names, visible markings, tentative connection observations and candidate identity questions. The user can correct everything.
3. Run online lookup before asking for every dimension. Prefill values from actually retrieved specifications and explain variant uncertainty.
4. For discovery, Astra generates grounded concept proposals before requiring every mechanical measurement; resolve identity/function ambiguity when necessary and label provisional scale. The user compares, refines or selects a concept. For an existing idea, continue directly with that goal. Both paths converge on confirming the relevant match/dimensions, mounting/port data and constraints. Ask only for remaining measurements. Unknown values stay unknown.
5. Create dimensioned envelopes immediately. Submit independent cropped images to Rodin for requested references; editing can continue while assets generate.
6. Astra proposes a layout and CAD recipe. Preserve user-locked placements/connections; show which assumptions remain.
7. Build real CAD/preview artifacts, inspect the assembly, select parts and reveal internals with transparent lid/explode.
8. Run implemented checks for the exact immutable input snapshot. Display check basis, units and unimplemented coverage.
9. User changes a component or asks for a design change. Create a new candidate and identify differences from the accepted revision.
10. Astra can propose a repair using computed diagnostics. Build and check that candidate; user accepts it after review.
11. Export accepted CAD and its evidence/spec/check manifest. Appearance references are separate from printable parts.

### State rules

- **Draft inputs:** editable, may contain proposals or unknown dimensions; not a claim of checked fit.
- **Candidate revision:** frozen specification/recipe hash, parent ID and artifacts/checks; cannot silently mutate after build.
- **Accepted revision:** selected by user, complete artifacts and required applicable checks pass. Unknown optional checks remain explicitly unverified.
- **Failed candidate:** retained diagnostic record; leaves accepted revision untouched.
- **Visual asset job:** independent lifecycle; completion attaches a visual asset by ID without changing accepted engineering dimensions.
- **Identity/evidence:** proposals become accepted component-version values only through review. Changing identity invalidates dependent sourced proposals; previous revisions remain immutable.

The UI may show an invalid draft/candidate for debugging. Do not label it accepted or offer its files as the current accepted design. A local accepted revision is the reliable capture fallback; saved views are labeled saved/cached when live services are unavailable.

### 4.1 Shared intake and concept discovery contract

The application landing page is a functional creation screen, not a promotional homepage. Use a shared upload/parts form with two adjacent intent choices. Preserve photos, manual parts, links and preferences when switching intent. A connected prototype is helpful input, but an unconnected group of parts is also supported. Observed wires from a photo are tentative connections, not proof of pinout, protocol or electrical compatibility.

For “I have an idea”, ask “What do you want to build?” and offer free text plus optional form-factor constraints. For “Explore my components”, ask “What would you like these parts to help you do?” as an optional preference; allow a blank answer. Provide optional desk/wall/portable/use-case chips, maximum dimensions, must-use parts, orientation requirements, fixed existing connections and an “Allow additional parts” control. Default exploration prioritizes the supplied inventory, with extras clearly listed rather than silently assumed. Budget and print-bed limits are optional user-supplied constraints, not fabricated data.

Experience-aware preferences are optional and progressively requested, not a mandatory profile: **First hardware project / A few projects / Experienced**, useful interests/outcomes, available tools (printer, breadboard, soldering equipment or print service when relevant), known software/electronics skills and optional time/budget. Treat these as user-reported context; never infer proficiency from age or invent a skill score. Unknown tool availability stays unknown. A single context question can gather the relevant next fact; experienced users can skip it. Do not stall ideation behind an exhaustive questionnaire.

Project demands are explained concretely: “breadboard wiring and uploading existing firmware”, “soldering required”, “printed parts needed”, or “custom mechanism/firmware work” only when supported by that concept's actual dependencies. A beginner-oriented suggestion prioritizes available parts, understandable interfaces and achievable next steps; an experienced user may prefer modularity or more demanding designs. If a required driver, power module, firmware/storage feature or tool is absent, list it. No claim of plug-and-play functionality from a photo alone. Do not silently add extra parts when the user disallows them.

Generate up to three distinct useful concepts initially, using bounded runtime Astra calls and actual component capability/evidence records. If inventory information is too ambiguous, ask a focused clarification or return fewer grounded concepts instead of inventing three. Distinct concepts may vary purpose, placement or handling; explain substantive tradeoffs rather than change only cosmetic labels. No fixed prompt-to-card mapping or static recommendation catalogue in live mode.

Each concept card/detail must include: intended use; components used/unused by stable ID; extra parts, firmware/software or external dependencies; proposed assembly layout and orientation; form-factor rationale; assumptions/unresolved compatibility; source references when actual researched capabilities are used; supported CAD family/operations; and next measurements needed. Rank by explained qualitative criteria such as inventory coverage, practicality and supported geometry. Do not show a fictional success probability, confidence percentage or claim it is already electrically functional.

Also show a short **Why this fits you** explanation tied to the reported preferences, skills/tools required, difficulty with reasons rather than a universal score, and a practical staged path: verify component identities/interfaces → confirm remaining requirements → establish functional prototype/firmware task where needed → develop layout/CAD → fabricate/assemble/test. Only steps actually done in the platform get completed status. Optional instructions/resource links are useful when genuinely retrieved; invented wiring diagrams, unavailable firmware links and unverified pin mappings are not evidence. The app coordinates project direction and mechanical iteration; it does not claim all electronics/firmware/mechanism work is automatically finished.

Concept previews show approximate component arrangement and surrounding mechanical structure. Prefer lightweight procedural/envelope layouts generated from concept parameters; optional CAD-generated previews use explicit estimated inputs. Geometry with unconfirmed dimensions is visibly provisional. Whole-product Rodin meshes do not become authoritative preview/CAD. Reuse independent component reference assets when available. Do not launch multiple paid jobs for every concept card by default; generate chosen component references through the existing explicit/idempotent asset flow. A preview may be a labeled schematic if sufficient geometric evidence is unavailable.

Selecting “Develop this concept” records the concept and input snapshot, updates the project goal/constraints and enters the same component-confirmation/CAD pipeline. Selection does not accept an engineering revision, confirm unknown dimensions or approve extra purchases. Let users combine/refine ideas through Astra while preserving supplied inventory. A changed component inventory/version marks affected concept proposals and previews stale; regenerate them explicitly or explain why they remain applicable. No old concept may silently build against a new inventory.

Separate readiness labels: **Concept proposal**, **Needs measurement**, **Supported geometry checks passed**, and any **Functional compatibility unverified**. Passing mechanical checks is independent of firmware, wiring, power, RF, sensor performance or motion correctness. Show only relevant unknowns, not an unsolicited wall of warnings.

## 5. Visual design and interaction specification

### 5.1 Look and feel

Premium contemporary hardware design studio: a deep graphite spatial canvas, warm ivory typography, restrained oxidized-orange accents, crisp technical labels and deliberate editorial composition. The user rejected the earlier generic warm-white cards/forms as too basic. This direction supersedes their styling while retaining their functional contracts. Make the product feel designed around an evolving physical object, not a template dashboard. Users should feel Astra is helping understand their parts and shape a product from the first screen. Avoid a marketing homepage, giant empty chat interface, neon gradients, frosted-glass stacks and a wall of logs. A light inspection alternative can be added for readability, but is not the default onboarding treatment.

| Token | Proposed value/use |
|---|---|
| App background | #111315; graphite studio |
| Panel | #1A1D20; tonal surfaces rather than a grid of cards |
| Main text | #F1EFE8; warm ivory |
| Secondary text | #A4A9AA; measured contrast |
| Primary accent | #E98254; oxidized orange used sparingly for actions/selection |
| Borders | #34393D; thin, restrained |
| Viewport | #15191C, subtle contact shadows/grid; optional light inspection background |
| Attention | #E6B86A with restrained dark amber treatment |
| Error | #F09086 with a readable dark red treatment |
| Typography | Large editorial grotesk for opening phrases; clear UI sans; small monospace technical labels and tabular measurements |
| Spacing | 4/8 px scale, 12–16 px card padding, 20–24 px panel spacing |
| Corners | Mostly 4–8 px; minimal containers, occasional composer pill, restrained shadows |

Check actual contrast and keyboard focus when implementing; these tokens are design proposals, not a claim of certified accessibility. Use icons/text as well as color. Numeric fields retain their value on blur; blank is distinct from zero. Show mm beside fields, not as part of a numeric value sent to the server.

### 5.2 Layout

Desktop recording target: 1440×900 or similar. Top bar 56 px, left panel approximately 220–250 px, right inspector 320–360 px, central canvas flexible, revision strip about 56–64 px. At smaller widths collapse side panels into drawers/tabs; do not squeeze dimensions into unreadable cards. At desktop, model and main action remain visible without scrolling the entire page.

Top bar: editable display name, project, Design/Inspect/Export tabs, compact connectivity state. Left: stage steps during intake; assembly tree during design. Right: contextual component review/inspector/Astra/check/export panel. Bottom: revision list and compact actual job status. Advanced diagnostics belong in a drawer.

### 5.3 Four key screens

**A — Identify and confirm:** Large uploaded photo with editable numbered crop boxes. Component list, proposed manufacturer/model/revision, match state, dimension proposals with source links, missing-measurement question and goal. Actions: add part, adjust crop, choose another match, enter dimensions, confirm/build. Do not enable checked-fit creation while required values remain unresolved; allow clearly labeled estimated preview if implemented.

**B — Assembly:** Actual model centrally displayed. Independent parts tree with CAD/reference/envelope badges. Right tabs Astra/Inspect; editable values, locks and short decisions. Controls: orbit, fit view, hide, transparent lid, envelopes and explode. Separate Rodin stage card shows real job progress; never replace geometry with a fake generation animation.

**C — Conflict and repair:** Select affected part, show keep-out/plane conflict with an explanation. Distinguish current failed draft from candidate repair. Right card contains measured gap, required gap, shortfall, proposed diff and preserved locks. Apply button refers to the specific checked candidate. Comparison camera stays consistent; avoid changing angle so much that users cannot understand the edit.

**D — Accepted export:** Exploded assembly for inspection. Show accepted revision and actual applicable check results. File groups: printable CAD; design/evidence record; visual references. Download controls depend on files being present. No invented file sizes, dates, printing durations or slicing results.

### 5.4 Viewer and interaction caveats

- Selection in canvas/tree/inspector uses the same stable part ID, never mesh index or display name.
- Use a wrapper group for all mesh nodes of a part. Clone cached GLTF scenes/materials for independent instances; do not mutate shared assets.
- Fit camera to bounds when first geometry loads or user presses Fit. Preserve orbit on routine edits/comparison.
- Derive clipping/light/grid scale from actual bounds. Test with a known 100 mm cube before real assets.
- Transparent faces need deliberate render order/depth handling. A wireframe/envelope toggle is a useful inspection fallback.
- Explode is a viewer transform layer, deterministic by part role, and cannot alter backend coordinates or exports.
- Use a separate selected outline/overlay; do not overwrite original textures. Restoring selection must restore materials.
- Stop unnecessary spinning when inspecting dimensions; respect reduced motion. Short transitions around 150–250 ms are sufficient.
- Derive dimension labels and badges from state, not mockup pixels. Avoid decorating a reference mesh with claims of exact mechanical accuracy.
- Async result arriving after a project switch updates its originating project, never the new active project.
- A failed model load keeps engineering envelope and diagnostics visible. Dispose replaced GPU geometry/materials/textures.

### 5.5 Updated mockups

Four generated concept screens accompany this revision: component/evidence review, assembly, checked repair and accepted export. Made to Fit is a provisional name. They are visual references, not implemented screens or accurate drawings. Incidental dates, avatars, dimensions, materials, part counts and revision labels are illustrative. The fixture and contracts below are authoritative; do not copy generated inconsistencies into code. In particular the fixture battery is a rectangular envelope, not a cylinder, and the assembly has separate base/controller/battery/lid identities.

### 5.6 Synchronized CAD, rendered and overlay views

Provide three presentation modes of one assembly, not independently generated versions of the enclosure:

| Mode | Geometry shown | Purpose |
|---|---|---|
| CAD | Tessellated authoritative enclosure solids, component engineering envelopes and any confirmed feature geometry; edges and optional dimension annotations | Mechanical inspection and understanding checked dimensions |
| Rendered | The same enclosure tessellation with visual materials, plus calibrated component reference meshes where available | Legible visual assembly and product presentation |
| Overlay | CAD/envelopes with translucent or wireframe appearance references | Inspect visual alignment and reveal approximation |

The enclosure always originates in CAD. Rodin must not generate a second supposedly matching enclosure. If Rodin is used for a cosmetic concept, label it a reference; translate its supported design features into CAD before including them in printable geometry. Visual materials do not change shape. Browser rendering is a tessellated preview, not a native B-rep editor; CAD exports remain kernel-generated STEP/STL.

All modes share project/revision ID, stable part IDs, canonical millimetre dimensions, engineering transforms, visibility, selection and camera. Switching modes preserves framing. A split comparison, if implemented, shares camera target/orientation/projection. Enclosure preview and exports are built from the same frozen CAD revision; record tessellation settings and artifact hashes. A revision change invalidates dependent previews/checks instead of leaving stale geometry under a new revision label.

Appearance meshes use their own stored calibration transform beneath the part's engineering transform. Review orientation and meaningful datum/correspondences before measuring mesh bounds. Uniform scaling from a reliable reference is preferred; matching three different bounding-box extents by anisotropic scaling must be explicit and labelled approximate because it distorts visual detail. Do not automatically declare bounds equality to be geometric accuracy. Keep original meshes and calibration metadata. Changes to part dimensions update or invalidate calibration without a paid regeneration. Low confidence/unreviewed assets retain a visible alignment warning, with the engineering envelope as fallback.

Use the same calibration/engineering coordinate conversion in all views. Checks evaluate confirmed engineering geometry/envelopes in unexploded assembly coordinates. Rodin texture, holes, connector positions and hidden surface details do not establish precise dimensions. An independently generated reference can be approximately registered; perfect mesh-to-CAD agreement cannot be promised from a photograph. If exact component detail is required, use a licensed manufacturer CAD model, confirmed feature measurements or an authored CAD representation.

Viewer controls: orbit, pan, zoom, fit, top/front/side/isometric views, select/hide/isolate, CAD/Rendered/Overlay selector, dimension/envelope toggles, an explode slider and X-ray. X-ray makes enclosure surfaces translucent while keeping interior parts readable; it is a render mode, not a scan or inference of missing internals. Explode and X-ray are independent viewer state. Their use never modifies accepted placements, geometry, checks or exports. Optional clipping/section-plane inspection is additional to X-ray, not a claim that transparency performs geometric sectioning.

### 5.7 Contextual Astra chat

Keep chat in a resizable right sidebar beside the active photo/assembly; allow a collapsed rail on smaller screens. Provide Astra/Inspect/Checks tabs, persistent thread per project and context chips for the selected part, revision and active locks. The composer accepts text and optional image/document attachments. Any selected part enters requests by stable ID. Show concise explanations and actual tool activity, not hidden reasoning.

Support (1) initial goals with a proposed CAD plan and separately requested Rodin references; (2) part/source review with editable structured measurement cards and confirmed/unknown fields; (3) generation/build/check activity and genuine errors; (4) candidate diffs with computed checks, preserved locks, preview and explicit Apply; (5) acknowledgement that points at the newly accepted revision. A chat message alone must not silently confirm measurements or accept a candidate. Source links focus the relevant evidence; part links select the same object in the viewer/tree.

The accompanying LOVABLE-KICKOFF.md supplies the full frontend prompt and additional chat mockup guidance. These requirements supplement the earlier four-screen concepts; concept images are not literal engineering drawings or proof of implementation.

### 5.8 Functional landing, initial input and concept results

**Start:** a functional Astra-guided studio, not a large registration form. Compact brand/header, an editorial phrase such as “Your parts. Their next life.”, spatial working canvas and one prominent composer “Show me your parts, or tell me what you want to make.” Support drag/drop, attach-photo/manual/spec input and small intent shortcuts “I have an idea” / “Explore my components”. A user may express intent conversationally; ambiguous interpretation remains editable/confirmable. Both intents share the same input state. Before user evidence exists, do not claim to know the parts; an optional beautiful sample assembly is explicitly “Example scene”, separate from the project. No hero video, pricing, login wall or decorative dashboard.

**Populated intake/review:** Astra turns genuine analysis into editable on-canvas part anchors and a compact parts rail. Keep the original photo accessible alongside provisional component geometry. A compact evolving brief records “What you have”, “What you want”, constraints and unresolved fields, distinguishing observations/proposals from accepted facts. Ask one valuable next question, such as intended placement or an unknown assembled height, instead of showing all form fields at once. Structured confirmations appear only when relevant. Example inventory is controller/display/temperature sensor/battery; illustrative, not the only accepted combination. Manual editing remains discoverable. Preserve work on failed analysis; no automatic guessed acceptance.

**Discover:** put one selected concept at large scale on the spatial stage with its layout and short rationale; use a restrained filmstrip or rail for up to three alternatives instead of equal stock cards. Show purpose, inventory coverage, dependencies/readiness and meaningful form-factor tradeoffs beside the object. Contextual Astra dialogue refines the selection. Show “Concept preview · dimensions pending” until reviewed geometry supports precision. Actions: Develop this concept, Refine, Compare, Back to parts. No invented ranking percentages. Unsupported families explain required capability and a supported next step rather than showing functioning export controls.

The premium replacement concepts cover shared studio start, Astra understanding the uploaded parts and selected concept/form-factor exploration. Earlier basic light mockups are superseded for visual styling, but their review/measurement/repair/export functionality remains. Incidental model detail in imagegen is not engineering evidence.

### 5.9 Live onboarding behavior and polish

Use the existing photo analysis, evidence, agent and concept endpoints; do not introduce a separate unrestricted onboarding agent. Initial messages update a validated draft brief containing intent, goal, inventory IDs/version, constraints, missing fields and provenance. Reply/confirm controls persist semantic fields; the chat transcript alone is not authoritative state. The agent can suggest a next step, but cannot silently confirm identity/dimensions, accept CAD, add unseen inventory or start paid Rodin jobs.

The opening adapts to observed input: no parts → request a photo/list; unclear identity → focused clarification; identified parts/no goal → grounded directions; explicit goal → summarize it and ask the relevant next constraint; enough reviewed geometry → propose a CAD build. Conversations can start with a goal before parts exist, but geometry/discovery steps validate their own inventory requirements. Include Undo/edit brief and a manual route. Source/dependency failures show their actual state without replacing them with invented progress or ideas.

Visually, user evidence becomes the scene: image thumbnails and part anchors transition into independent envelopes/references, then a proposed layout, then CAD. Motion follows real state updates and uses transform/opacity animations; no fabricated scans, fake percentage timers or simulated chain-of-thought. Animate brief updates and focus the referenced part, preserving camera and selection. Loading is quiet and honest. Full-screen studio can progress into the denser engineering workspace without a disconnected page redesign. Use genuine geometry/materials, modest lighting/contact shadows and constrained texture budgets; dramatic images must not be the interactive canvas. Preserve contrast, reduced motion, keyboard access and GPU performance. Novelty comes from context and composition, not visual noise.

## 6. Architecture, ownership and agent freedom

### 6.1 Stack baseline

| Layer | Baseline | Responsibility |
|---|---|---|
| Frontend | Lovable's actual React/TypeScript scaffold | User flow, reviewed state, viewer, jobs and downloads |
| 3D | Three.js, React Three Fiber/Drei where compatible | Part rendering/selection, camera, visual overlays |
| Backend | Python, FastAPI, Pydantic, HTTP client | Authoritative specs, jobs, vendors, geometry, artifacts |
| CAD | CadQuery/OCCT on a supported native Python runtime | Solids, operations, validity, CAD/preview exports |
| Model | GPT-6 Astra through OpenAI Responses API | Image/spec interpretation and bounded creation/revision |
| Visual generation | Hyper3D Rodin authorized API | Independent textured reference assets/cosmetic concepts |
| Retrieval | Astra hosted web search + bounded document fetch/parser | Actual sources and field-level proposals |
| Persistence | SQLite plus filesystem artifact store | Immutable revisions, evidence, jobs and vendor IDs |
| Transport | HTTP with job polling initially | Simple debuggable integration; SSE optional |

The agent can adapt libraries to the generated frontend and proven environment. Preserve these roles and contracts. Do not presume Lovable functions can host a native CAD kernel. A normal Python process/container runs CadQuery. Do not add authentication, billing or a second database as unrelated work.

### 6.2 Firm requirements versus implementation choices

**Firm:** full P0 targets, actual Lovable frontend, runtime Astra, real Rodin integration, real cited source retrieval, variable inputs, mm/CAD geometry authority, evidence/confirmation separation, candidate/accepted separation, locks, actual exports, secrets server-side and original event work.

**Agent choices:** state store, router/components, CSS implementation, HTTP library, PDF extractor, tessellation path, job runner details, optional streaming, bounded operation limits and deployment route. Choose the smallest reliable solution; record important decisions in docs/DECISIONS.md with rationale and verification.

Unsupported operations/inputs require a specific explanation and supported alternative. Routine design choices do not need repeated approval. Changing model/vendor, dropping an agreed requirement, claiming unimplemented analysis or exposing the local backend broadly needs explicit discussion. Backend reachability for a hosted frontend is necessary; a public product deployment is not a supplied event submission requirement.

### 6.3 Execution model

One bounded Astra orchestration loop is sufficient. Stage-specific image/research calls are fine. No multi-agent runtime, arbitrary model-written Python/eval, or unrestricted shell access is required. CAD runs through authored operation handlers.

Start with one backend process and a serial CAD worker queue. Native kernel calls are CPU/blocking and must not run directly on the async HTTP event loop. A worker process with timeout is preferable where practical; serialize CAD access initially. Network generation/retrieval can run independently with bounded concurrency. Worker architecture is a proposed implementation choice, not permission to lose jobs on restart.

Persist job creation and vendor identifiers before polling; reconcile unfinished jobs on startup. Configure shutdown/recording mode deliberately. Auto-reload can kill in-process jobs; avoid it while paid jobs/capture are running. Multiple server workers with an in-memory job registry create inconsistent state—use persisted registry or keep one worker.

## 7. Repository and module implementation plan

Create the actual frontend in Lovable during the event, then connect GitHub and clone its repository. Keep generated frontend paths/scripts intact; the layout below is illustrative.

```text
repo/
  src/                         # Lovable-generated UI remains here if this is its scaffold
    components/                # review, workspace, checks, export
    features/                  # component evidence, revisions, assets as appropriate
    lib/api.ts                 # one typed backend adapter
    lib/coordinates.ts         # authoritative CAD/viewer conversion boundary
  public/
  package.json
  backend/
    pyproject.toml
    app/
      main.py                  # app lifecycle, CORS, routers
      config.py                # validated env; no secret-returning diagnostics
      schemas/                 # component/recipe/revision/job/check models
      api/                     # request boundaries and serialization
      services/
        photos.py              # orientation normalization, crops and analysis
        evidence.py            # candidate identity, retrieval and proposals
        revisions.py           # frozen candidates, locks and acceptance
        assets.py              # Rodin jobs, downloads, calibration
      providers/
        openai.py              # Responses/image/tool/search adapter
        hyper3d.py             # submit/status/download adapter
      cad/
        recipe.py              # allowlisted operation interpreter
        enclosure.py           # helper lowers into same recipe contract
        checks.py              # supported numeric/kernel computations
        exports.py             # real CAD/preview artifact manifest
      storage/                 # registry, database and file paths
      jobs/                    # worker lifecycle, deadlines and retries
    tests/                     # meaningful numerical/contract tests
  docs/
    FITFORGE-PRD.md
    LOVABLE-KICKOFF.md
    DECISIONS.md
    DEMO.md
  .env.example                 # variable names and safe defaults only
  .gitignore
  README.md
```

Minimal function responsibilities (names are recommendations): analyze_photo returns editable observations; resolve_component returns candidate evidence; confirm_component creates a component version; interpret_recipe validates/executes operations; build_revision exports frozen geometry; run_checks returns computed reports; accept_revision commits a checked version; submit_visual_job handles paid idempotency; reconcile_jobs resumes/reports unfinished work.

Use one source of truth for schemas. Derive frontend types from OpenAPI or maintain one reviewed contract file. Do not maintain three subtly different payload shapes in UI, agent prompt and backend. Compile/typecheck after changing the API adapter, and test a direct HTTP response before debugging the viewer.

## 8. Data contracts and coordinate conventions

### 8.1 Units and frames

- Engineering: millimeters, right-handed X width, Y depth, Z up. Enclosure outside bottom Z=0; fixture centered in X/Y.
- Component local envelope: lower corner at [0,0,0], positive size_mm=[X,Y,Z]. Pose maps local geometry to project coordinates. Visible product “length/width” labels must map explicitly into these axes.
- Renderer: meters, Y up. Default conversion **(x,y,z) CAD → (x/1000,z/1000,-y/1000) renderer**. It preserves handedness.
- Orientations: store normalized quaternion or documented XYZ convention, never ambiguous Euler values. If quaternion is engineering-frame rotation, convert using renderer basis C: R_render = C R_CAD C^-1. Translational scale is separate.
- Normalize CAD previews into the same renderer convention once at a documented export/load boundary. Some exporters apply axis conversion—test it; do not convert twice.
- Rodin GLB has visual/model coordinates. Store bounds and a separate calibration transform; it does not set project engineering units.
- STL has no reliable unit metadata; label/export it consistently as mm and preserve units in the manifest. STEP carries CAD geometry; maintain recipe/source for parametric recreation.

Mandatory calibration proof: a 100 mm cube measures 0.1 m in the selected meter-rendering convention, with a marker on +Z mapping up. A translated asymmetric part proves orientation, center and pivot. Do not rely on a symmetric cube alone for axis signs.

### 8.2 Records

| Record | Minimum fields |
|---|---|
| Project | ID, name/nullable goal, intent_mode (idea/discover), discovery preferences, selected concept ID, schema_version, draft version, active accepted revision ID, component IDs, locks |
| Onboarding brief | Versioned project draft projection: observed/proposed/accepted fields, inventory references, intent/goal, constraints, missing questions and provenance; never a parallel source of truth |
| Photo | ID, normalized image artifact, width/height, orientation, parent/source hash, optional views |
| Component version | Stable part ID + version ID, identity candidates/accepted identity, dimensions/provenance, local envelope, pose, interfaces, connections, visual IDs |
| Source document | ID, URL, publisher/title, revision/date if known, retrieval time, cached hash/artifact, location references |
| Dimension proposal | Field, raw value/unit, normalized value/tolerance, applicability, source ID/page, identity candidate, acceptance/override |
| Recipe | Version, units, parameters, operation nodes, parts/poses, declared constraints, limits |
| Revision | ID, parent ID, frozen spec/recipe hash, diff, state, check/artifact manifests, request, timestamps |
| Asset | Part ID, source type, original/preview hashes, bounds, calibration, vendor/job reference, status |
| Job | ID, type, project/part/revision IDs, idempotency key, stage, result/error, deadline, vendor refs (server-only) |
| Check | Exact revision/hash, method/basis, part IDs, pass/fail/unknown/not_applicable, values, units, message |
| Artifact | ID, hash, revision/asset ID, role, MIME, filename, unit/frame, server path and public serving route |
| Concept proposal | ID, project ID, inventory/draft snapshot hash, intent, title/purpose, used/unused part IDs, extra dependencies, user-preference fit rationale, skills/tools and difficulty reasons, staged build path, form-factor/layout proposal, evidence IDs, assumptions, required fields, supported family/capabilities, preview IDs/status and selection/stale state |

Example accepted synthetic component; it is not a commercial specification:

```json
{
  "part_id": "battery",
  "component_version": 1,
  "name": "Battery",
  "role": "hardware_reference",
  "size_mm": [40, 18, 10],
  "pose": {"translation_mm": [-20, -24, 4], "rotation_quaternion_xyzw": [0, 0, 0, 1]},
  "dimensions_confirmed": true,
  "dimensions_source": "synthetic_fixture",
  "keepout_mm": [0, 0, 0],
  "mounting_points_mm": [],
  "interfaces": [],
  "visual_asset_id": null,
  "engineering_geometry": "dimensioned_box",
  "printable_output": false,
  "locked_fields": []
}
```

Raw sources and extracted proposals remain separate from accepted size_mm. JSON examples establish semantic contracts, not a requirement to copy names or IDs into every project. Enforce finite numbers, valid lengths, normalized rotations and stable IDs. Missing is not zero. Reject NaN/Infinity, negative dimensions, unsupported scales and extra unrecognized fields at authoritative boundaries.

Concept layouts carry a geometry_status such as schematic, estimated or confirmed, and optional size/pose proposals separate from accepted engineering fields. Nullable dimensions are valid for discovery records but not automatically valid CAD build inputs. Inventory snapshots include component versions, capability/evidence references and preference constraints. Validate concept part IDs against that inventory. Selection validates expected draft version and concept snapshot; stale selection returns 409.

## 9. Photo analysis and component confirmation

Normalize uploaded orientation (including EXIF), downscale a derived analysis copy and preserve the original. Reject unsupported MIME/oversized input with an actionable message. Configure a sensible size limit, initially around 15 MB/image, and record it as an application limit.

Ask Astra for component candidates, visible markings, observations, uncertainty and bounding rectangles. Use normalized crop coordinates in [0,1], origin top-left; clamp/validate rectangles with positive area. Crops refer to the normalized image, not a differently rotated original. Browser CSS letterboxing must not change underlying image coordinates. Correct boxes against actual pixels before generation.

The user can add/delete/rename parts, adjust boxes and enter exact identifiers/links. Avoid grouping wires and boards into one model simply because they touch. Rectangular crops are acceptable; background removal/segmentation is refinement, not a prerequisite. A ruler/reference may suggest scale; a single photo cannot establish hidden height, underside geometry or exact electrical connectivity.

Store tentative connections as component/port pairs with provenance and confirmation. Confirm mating direction, cable space and locked relationships. Actual electrical pinout and cable bend/routing validity are outside implemented geometry checks unless separately built. A wire visible between parts does not prove electrical compatibility.

Initial layout can preserve the photograph's relative ordering and the user's stated relationships, but pixel distances are not accepted mechanical coordinates. Resolve placements from confirmed envelopes, clearances and user-approved datums. A deterministic row/shelf packing helper can supply a starting layout for movable parts; Astra can choose supported poses, while containment/overlap/lock checks reject invalid proposals. Keep locked parts fixed, reserve known connector keep-outs and report when the available footprint cannot hold the components. Do not claim a globally optimal layout or checked cable routing without implementing those analyses.

Confirm required engineering fields before checked-fit generation. Identification correction survives subsequent calls and must not be overwritten by repeated automatic analysis. Freeze a component version when used in a revision; newer observations belong to a draft/new version.

## 10. Online specification enrichment

### 10.1 Goal and retrieval path

Before asking users to measure every part, find documented specifications. Inputs: visible markings, corrected name, manufacturer/model/revision, product URL or user document. Resolve exact board/module variants, not only chips or generic appearance.

Default implementation: a bounded Astra research call using the currently documented hosted web_search tool, then extract/retain actual sources and fetch mechanical documents as needed. An alternative real search provider is acceptable if working and documented; no distributor OAuth dependency is required. A supplied manufacturer URL is a valid lookup entry path, but a URL-only flow must not be presented as automatic photo identification.

Prefer manufacturer drawings/datasheets, then exact supplier documentation. Use community pages only as lower-certainty hints. A snippet or model memory is not sufficient evidence. Preserve document/page references and raw evidence so proposals can be audited. Search URLs/annotations must come from real retrieval, never invented text.

### 10.2 Evidence states

| Dimension | Allowed states |
|---|---|
| Identity | exact_match / likely_match / ambiguous / unknown |
| Lookup | searching / fetching / extracting / ready / partial / failed |
| Field evidence | manufacturer_document / supplier_document / provided_document / image_estimate / unknown |
| User acceptance | proposed / accepted / user_override / rejected / disputed |
| Applicability | bare_board / assembled_module / active_area / connector / other |

No invented confidence percentages. Distinct identifying evidence supports an exact match; visual resemblance alone does not. Exact manufacturer documentation does not prove the photographed object is that variant. Confirm the identity and accepted fields before fit claims.

PCB dimensions can exclude connectors, headers and underside solder. Display active area differs from glass/module size. Chip package dimensions cannot stand in for a development board. Preserve stated dimensional tolerances; do not invent them or conflate them with printer/design clearance.

If two sources conflict, expose values/applicability/variant differences and ask for review. Do not average them. If length/width are documented but assembled height is not, prefill only the known fields and ask “Total height including installed headers and connectors?” Unknown mounting coordinates remain unknown.

Field example intentionally has no fabricated source URL:

```json
{
  "field": "assembled_height",
  "proposed_value_mm": null,
  "accepted_value_mm": null,
  "original_value": null,
  "original_unit": null,
  "tolerance_mm": null,
  "source_id": null,
  "source_location": null,
  "evidence_type": "unknown",
  "applies_to": "assembled_module",
  "acceptance": "proposed",
  "identity_candidate_id": null,
  "question": "What is the total height including installed headers and connectors?"
}
```

### 10.3 Bounded implementation and failure handling

Start with up to three candidate identities and three fetched sources per component, cached by identity/query/source hash. These are configurable product limits. Save timestamps and live/cached status. Failed lookup leaves user measurements and corrections intact; allow manual continuation without claiming online success.

Treat retrieved content as evidence, not agent instructions. Restrict URL schemes and reject private/local addresses; recheck redirects, limit byte sizes/time and parse safely. Do not forward secrets or unnecessarily send the full prototype image to suppliers. Source extraction may use PDF text and page images; unreadable drawings require user input rather than guessed dimensions.

A licensed usable manufacturer model can be preferred as a component reference when its format is supported. Do not force an arbitrary STEP-import project onto the critical path. If no suitable model exists, use confirmed envelopes and requested Rodin visuals. Identity changes invalidate dependent source proposals, while prior CAD revision evidence stays immutable.

## 11. Astra integration and bounded agent behavior

Use the exact requested model, gpt-6-astra, with the official OpenAI SDK and Responses API. Official documentation confirms image input, structured outputs and function calling; tool calling for Astra uses Responses. Start at medium reasoning for CAD planning; a lower effort for narrow extraction can be measured and chosen. Treat latency as measured, not promised. Keep the model ID configurable without silently substituting a different model.

### Application tools

| Tool | Input | Output / authority |
|---|---|---|
| get_design | project/revision ID | Frozen/current spec, locks, coverage and checks |
| analyze_photo | known photo ID | Proposed editable components/observations |
| lookup_component_specs | part ID, identifiers/link | Job/candidate sources and field proposals |
| get_component_evidence | part ID | Sources, user decisions, missing values |
| propose_product_concepts | project inventory snapshot, intent/preferences, supported capabilities | Persisted structured concept proposals with assumptions, dependencies and provisional layout; no accepted CAD state |
| preview_product_concept | concept ID and explicit estimated/confirmed layout parameters | Labeled schematic/provisional artifact; no fabricated checks or printable acceptance |
| propose_design | reviewed parts, supported recipe/spec, constraints | Frozen candidate ID and resolved inputs |
| propose_revision | parent ID, allowed changes | New candidate and exact diff |
| build_candidate | candidate ID | Actual artifacts or sanitized kernel error |
| run_geometry_checks | candidate ID | Deterministic measurements and coverage |
| request_visual_asset | part ID, known references, options | Idempotent async job ID |
| get_job_status | known job ID | Real stage/result |

Do not give the model an unconditional accept tool: user approval is a visible UI action. The agent can recommend a passing candidate. Server validates every mutation independently of prompt compliance.

### Tool-loop implementation specification

Define Responses-compatible function schemas, with strict output where supported, no extra properties and explicit nullable fields. Pydantic validates results again. Complex recursive CAD recipes may need a two-stage typed output or flat node schema; verify the SDK's supported schema subset rather than copying arbitrary Pydantic JSON Schema into strict mode.

The adapter must inspect response output items for actual function calls, parse arguments, execute only allowlisted handlers and return outputs using the original call_id. Preserve response continuity (previous response ID or the complete required output items, including reasoning items) according to the current SDK contract. A text answer alone is not a completed CAD action. Disable concurrent mutating tool execution initially; independent lookup/read tasks can be parallel only when safe.

Bound each operation by calls, wall time, output size and candidate attempts. Initial repair target: at most two candidate repair attempts and around eight tool rounds; tune from measured behavior. When budget expires, retain previous good state and report the unresolved reason. Handle refusals/incomplete responses explicitly, and prevent malformed outputs from reaching CAD.

Record actual model usage, vendor job consumption when available and elapsed stages in a small backend ledger. Treat the event credits as a budget, not permission for infinite retries. Reuse source caches, accepted envelopes and existing appearance assets; resend only changed context. Budget controls must not fabricate cheaper model identity or successful results. Do not promise a particular job cost or response time before measuring the event account.

Agent instructions: cite real sources; ask targeted missing-data questions; obey locks; use supported operations; run implemented checks; report their basis; never describe appearance as measurement or unchecked analysis as passing. Show short decisions/tool outcomes, not private chain-of-thought. Include only relevant spec/evidence/diagnostics in context; do not resend all images/mesh files/history on every round.

Research can be a separate bounded Responses call with web_search; preserve actual citation annotations and source URLs. Follow documented requirements for making source links visible. Open a cited source or retain the provider-fetched evidence when claiming a field came from a document; a listed but unread source is not extracted evidence.

## 12. Hyper3D Rodin: detailed integration

Backend only. Use the account's authorized API and current parameters; verify one real job during the event. Preserve separate reference crops and asset identities. Models are for appearance, not inferred hidden geometry or functional circuitry.

### Vendor boundary checked during planning

| Action | Endpoint / identifier |
|---|---|
| Submit | POST https://api.hyper3d.com/api/v2/rodin; authenticated multipart form |
| Status | POST /api/v2/status; body subscription_key from generation jobs.subscription_key |
| Results | POST /api/v2/download; body task_uuid from generation top-level uuid |

These identifiers are different. Keep the status subscription token server-side. Official docs currently specify one to five reference images and explicit Gen-2.5 tier. A proposed web-preview preset is GLB, Raw mesh and quality_override around 10000–20000 with a supported non-extreme tier; confirm access and response first. Default quality can be much larger, so do not blindly use defaults. Bounding-box conditioning controls model bounds; it does not certify interfaces or dimensions. Avoid unnecessary premium texture/upscale add-ons.

### Job lifecycle

- Save local idempotency key/input hash and pending submission before a paid request. Store vendor task/status identifiers immediately after response.
- Map vendor Waiting/Generating/Done/Failed to real app stages. Poll initially after about 5 s, back off toward 30 s and honor throttling. Download only after every required vendor job is Done.
- Status/download successful queries may return HTTP 201; do not require status code 200 exactly. Parse errors even when a body exists.
- Results contain expiring URLs. Download bytes promptly, validate file type/non-empty geometry and store original/hash; serve a stable local artifact URL to the UI.
- App stages: queued, submitting, waiting, generating, downloading, validating, ready, failed, unknown_submission. Never invent percent progress. A local waiting deadline does not prove vendor failure.
- An ambiguous submission timeout must not auto-submit again and double-charge. Reconcile existing vendor state where possible; otherwise surface uncertainty and require deliberate retry.
- Job completion is attached to the originating part/project. Repeated dimension/move/hide operations reuse the asset.

### Calibration and style

Preserve original mesh, derive optimized preview non-destructively. Record geometry bounds and orientation. Align the model with its dimensioned envelope using explicit pivot/orientation and uniform scale. If proportions disagree, label it illustrative; do not silently deform it to claim exact fit. One hardware reference can contain many GLB mesh nodes; group them under one part.

Guidance for component references: faithful to crop, clear silhouette, recognizable connectors, neutral illumination, no invented wires/labels, moderate texture detail. Cosmetic concepts may use a coherent product style, but mounting interfaces stay dimension-driven. Do not regenerate decorative features to solve an engineering dimension change. Confirm actual costs rather than inheriting a previous event's per-job credit assumption.

## 13. CAD recipe engine and enclosure construction

### 13.1 Generic, bounded operation language

Astra composes geometry through authored handlers. Enclosure helpers lower into that same geometry/state contract. A named helper is an accelerator, not a canned finished model or the only accepted input.

| Operation | Semantics / required parameters | Priority |
|---|---|---|
| box | size_mm, local lower_corner_mm; positive extents | P0 |
| cylinder | radius_mm, height_mm, origin at bottom center, normalized axis | P0 |
| translate / rotate | rigid transform of referenced geometry; documented pivot/order | P0 |
| union | children become one intended CAD part; report disjoint solids | P0 |
| subtract | base minus one/more cutting tools | P0 |
| assembly | independent part IDs/poses/roles and exports, not union | P0 |
| extrude_polygon | simple closed non-self-intersecting profile and depth | P1 |
| pattern / mirror | repeat geometry under explicit transforms | P1 |
| fillet / chamfer | deterministic selection/radius with kernel error handling | P1 |
| complex surfaces / joints | specialized geometry and analysis | Later |

Use a flat DAG or validated typed tree. Cap initial input around 12 parts, 100 nodes and depth 12; these are configurable application bounds, not CAD kernel limits. Resolve parameters once and freeze them. Do not allow eval, arbitrary imports, file paths or model-written Python. Detect reference cycles, unknown operations, invalid dimensions/axes and parameter/geometry mismatches before kernel execution.

Unions that yield unintended disconnected solids need a diagnostic; independent printable pieces should be separate assembly parts. Avoid coincident boolean faces where possible by extending cutting tools beyond the target and using a documented small geometric tolerance. Do not increase tolerances enough to hide real design conflicts. Keep exact solids for checks/export; tessellation is only a preview representation.

Illustrative new L-bracket composition, demonstrating geometry beyond a finished enclosure template:

```json
{
  "schema_version": 1,
  "units": "mm",
  "parameters": {"base_length": 80, "upright_height": 60, "width": 30, "thickness": 4, "hole_diameter": 5},
  "parts": [{
    "id": "bracket",
    "role": "printable_cad",
    "pose": {"translation_mm": [0, 0, 0], "rotation_quaternion_xyzw": [0, 0, 0, 1]},
    "geometry": {
      "op": "subtract",
      "base": {
        "op": "union",
        "children": [
          {"op": "box", "size_mm": [80, 30, 4], "lower_corner_mm": [0, 0, 0]},
          {"op": "box", "size_mm": [4, 30, 60], "lower_corner_mm": [0, 0, 0]}
        ]
      },
      "tools": [
        {"op": "cylinder", "radius_mm": 2.5, "height_mm": 8, "origin_mm": [20, 15, -2], "axis": [0, 0, 1]},
        {"op": "cylinder", "radius_mm": 2.5, "height_mm": 8, "origin_mm": [60, 15, -2], "axis": [0, 0, 1]}
      ]
    }
  }],
  "constraints": [],
  "locked_constraints": []
}
```

The base holes are 40 mm apart. This is planning data, not application code created before the event. Verify dimension semantics with actual generated bounds/holes; do not merely validate that JSON parses.

### 13.2 Enclosure helper

Inputs: reviewed component versions and poses; outer footprint/height or a clearly stated auto-sizing rule; wall/base/lid thickness; required internal clearance; confirmed ports/mounting datums; locks. No hardcoded component names/counts.

For the first rectangular enclosure: base outside footprint W×D, height H−lid_thickness. Subtract an internal cavity bounded by walls, beginning at base_thickness and open at the top. Lid is a separate plate of lid_thickness at Z=H−lid_thickness. This simple base/lid proves the CAD loop; it does not claim a finished closure mechanism. When adding lip/screws/bosses, model their actual interfaces and clearances rather than copying decorative mockup features.

Auto-size from transformed component envelopes plus declared wall/clearance margins. Preserve requested locked footprint or return incompatibility; do not quietly enlarge it. For ports, know the part/face, local datum, opening dimensions, normal/mating direction and clearance. Unknown coordinates require confirmation. Bosses depend on exact accepted mounting patterns; if absent, leave mounting unchecked or ask, rather than assume a commercial hole pattern.

A confirmed plain lid can pass internal height clearance while closure/latch fit remains unverified. Show analysis coverage explicitly. Parameter checks apply only to the geometry generated under the helper's assumptions.

### 13.3 Preview strategy and exports

Choose and prove one preview path early:

- Per-part tessellated STL/mesh → frontend loader/wrapper with explicit mm/frame conversion; stable part IDs supplied in a manifest.
- Or CadQuery assembly GLB export → inspect units/axis conversion and node identity, then normalize once. CadQuery documents glTF export for assemblies, not an arbitrary individual-solid GLB API.

Use actual supported CadQuery methods in the installed version; do not invent exporter signatures. Keep STEP/STL and preview derived from the same frozen solids. A single combined GLB is acceptable for inspection only when node-to-part identity is preserved; per-part previews can be simpler for hide/select/explode.

Set tessellation tolerances appropriate to millimeter geometry, then measure preview size/load quality. Preserve exact CAD separately from any decimated preview. Validate non-empty shapes, solids/volume where applicable and kernel validity. Curved precision should not depend on render-mesh triangle count.

## 14. Checks, locks and immutable revision semantics

### 14.1 Implemented analysis coverage

| Check | Method | Permitted claim |
|---|---|---|
| CAD validity | Kernel validity and non-empty intended solid | Generated geometry passes the implemented validity test |
| Envelope containment | Component envelope versus supported cavity bounds | Accepted proxy fits the modeled cavity under stated assumptions |
| Component conflict | AABB or exact solid intersection where implemented | Proxy overlap / exact overlap, with method identified |
| Lid gap | Component/keep-out top against supported underside plane | Height gap/penetration for the stated envelope/plane |
| Locked constraints | Frozen values/poses compared with parent | Specified locks preserved within documented tolerance |
| Wall parameter | Helper wall parameter versus configured minimum | Authored wall parameter meets the chosen minimum |
| Printer volume | Export bounds and selected orientation versus user bed | Bounds fit supplied print volume in that orientation |

A wall parameter comparison is not universal local wall-thickness analysis. A bed-bounds check is not slicing/printability certification. Interference/containment for arbitrary rotations requires transformed geometry; a conservative AABB warning is labeled conservative. If exact rotation-aware checks are absent, restrict that check's applicability rather than claim precision.

Represent expected contacts explicitly (base/lid seating, mounting interfaces) so intentional contact does not become a bogus global collision. Enclosure solid around a cavity is not a filled bounding box for exact hardware collision. Use actual shell geometry or clearly limited cavity formulas. Check keep-outs separately from physical surfaces. Do not use the display explode positions in any check.

### 14.2 Result and acceptance contract

```json
{
  "check_id": "battery_lid_clearance",
  "revision_id": "candidate-id",
  "spec_hash": "illustrative-input-hash",
  "basis": "dimensioned_component_envelope",
  "status": "fail",
  "part_ids": ["battery", "lid"],
  "measured_gap_mm": -2,
  "required_gap_mm": 2,
  "shortfall_mm": 4,
  "message": "Battery penetrates the lid plane by 2 mm; 4 mm additional space is required."
}
```

Use pass/fail/unknown/not_applicable. Never infer pass from absence of a failure. Required checks include CAD validity, unit/bounds sanity and declared locks, plus applicable enclosure containment/clearance constraints. User-requested but unsupported analyses remain unknown and prevent claiming that requirement is verified. Optional unknown coverage is visible beside completed checks.

Acceptance verifies complete artifacts, matching specification/check hashes and parent/version consistency. Apply is idempotent. A stale parent returns a conflict rather than overwriting newer accepted work. CAD build/check failures cannot replace accepted artifacts. Build/check outputs carry the exact revision ID; UI responses from older jobs cannot overwrite newer state.

Locks are server-enforced by immutable parent values or explicit lock definitions, not just a disabled field or prompt sentence. Support component pose locks and design parameter locks. If the user explicitly unlocks/changes a lock, create a new reviewed state and record that action. An agent does not unlock it silently.

Use an explicit numeric comparison tolerance separate from user-specified design clearance. A small floating-point/kernel tolerance can make equality robust; it must not turn a materially negative gap or unmet 2 mm clearance into a pass. Include the method/tolerance in diagnostics where relevant and test exact-boundary and just-below-boundary values.

### 14.3 Canonical numerical regression fixture

Synthetic values; no commercial hardware accuracy claim:

| Parameter | Value |
|---|---|
| Outside width / depth / height | 88 / 62 / 24 mm |
| Wall / base / lid | 2 / 2 / 2 mm |
| Cavity X/Y bounds | −42…42 / −29…29 mm |
| Cavity floor / lid underside | Z=2 / Z=22 mm |
| Controller envelope | 44×24×6 mm at lower corner (−22,2,4) |
| Battery envelope | 40×18×10 mm at lower corner (−20,−24,4) |
| Minimum lid clearance | 2 mm |
| Repair locks | Footprint, controller pose, wall/base/lid thickness |

Formula: gap = (assembly_height − lid_thickness) − (battery_lower_z + battery_height). Shortfall=max(0,required_gap−gap).

| State | Battery top | Lid underside | Gap | Result |
|---|---|---|---|---|
| Initial H=24, battery h=10 | 14 | 22 | 8 mm | Pass |
| Changed battery h=20, H=24 | 24 | 22 | −2 mm | 2 mm penetration; 4 mm shortfall |
| Repair H=28, battery h=20 | 24 | 26 | 2 mm | Pass; footprint/controller unchanged |

Increasing base wall height to 26 mm and placing the 2 mm lid at Z=26 produces total height 28 mm. Controller/battery envelopes do not overlap in Y. These formulas must agree with the actual solids, labels and exported bounds. Version numbering is generated from real revision history; do not force the mockup's v2 labels if the workflow creates separate failed and repaired candidates.

If max height is locked at 24 mm, footprint/controller/height constraints may be incompatible with this requested battery/clearance. Return an unresolved conflict, not a fabricated passing repair. Do not change the battery dimensions to hide the problem.

## 15. HTTP/API and job contracts

### 15.1 Application endpoints

These are proposed application routes, distinct from vendor endpoints. Generate OpenAPI and reconcile every route with the frontend adapter before live integration.

| Endpoint | Request / behavior |
|---|---|
| GET /health | Backend/native CAD readiness and configuration presence flags; no keys |
| POST /projects | Name, intent_mode, nullable goal, preferences and optional reviewed spec; validate goal for idea mode; return project |
| GET /projects/{id} | Draft, accepted/candidate IDs, parts, jobs and revisions |
| POST /projects/{id}/photos | Multipart uploaded image; return normalized photo ID |
| POST /projects/{id}/photos/analyze | Known photo IDs; return async analysis job |
| POST /projects/{id}/components/{part_id}/lookup | Identifiers/link; return evidence job |
| GET /projects/{id}/components/{part_id}/evidence | Candidate matches, source proposals and missing fields |
| POST /projects/{id}/components/confirm | Reviewed identity/field values plus draft version; create accepted component versions |
| POST /projects/{id}/concepts/generate | Inventory draft version/hash, preferences, client operation ID; return bounded Astra discovery job |
| GET /projects/{id}/concepts | Persisted concept proposals, snapshot/readiness and available preview manifests |
| POST /projects/{id}/concepts/{concept_id}/select | Expected draft version/snapshot; record chosen concept and project goal/constraints; no CAD acceptance |
| POST /projects/{id}/agent | User intent, parent/draft version, operation ID; return orchestration job |
| POST /projects/{id}/candidates | Validated full spec/recipe; freeze candidate |
| POST /revisions/{id}/build | Known frozen candidate; return CAD job |
| POST /revisions/{id}/checks | Run declared supported checks for this revision |
| POST /revisions/{id}/accept | Expected active parent; require matching complete artifacts/checks |
| POST /projects/{id}/assets/generate | Known part/crop IDs and reviewed options; return paid asset job |
| GET /jobs/{id} | Stage/result/error tied to originating project/revision |
| GET /revisions/{id}/exports | Actual artifact manifest and available package |
| GET /artifacts/{id} | Serve known file only, with correct type/download headers |

Async requests return 202 with job_id, not a pretend completed model. Confirmation/candidate creation may be synchronous. Errors have a stable code/message/details/retryable flag and request/job reference. Use 400/422 invalid input, 404 unknown ID, 409 stale parent/conflict, and appropriate service error states. Avoid HTTP-200 success wrappers around failed operations.

Example accepted job response:

```json
{
  "job_id": "job-example",
  "kind": "cad_build",
  "project_id": "project-example",
  "revision_id": "candidate-example",
  "stage": "queued",
  "result": null,
  "error": null
}
```

Client_operation_id/idempotency key is mandatory for paid generation and acceptance. It is an application deduplication contract; do not assume the vendor supports the same header. Save/hash the request; a repeated key with different payload is a conflict. Repeated identical requests return the existing job/result.

### 15.2 Frontend adapter and network details

Create one typed API client with a configurable public backend base URL. Derive URLs centrally, parse runtime payloads/errors and resolve artifact URLs against that base. Empty base can use a proven same-origin dev proxy; do not accidentally call the frontend origin for a Python route when no proxy exists.

For JSON use JSON headers; for multipart FormData let the browser set the boundary. Handle canceled uploads, invalid MIME and server size limits. Poll around 1–2 s for local jobs and adapt/stagger long jobs; never poll a paid submit endpoint. Stop polling on unmount/project changes while preserving backend jobs. Browser cancellation does not imply the external job was canceled.

CORS permits the actual local/frontend origin (including port) and hosted Lovable origin when needed. Avoid credentials mode unless genuinely used. HTTPS frontend needs an HTTPS reachable backend. Hosted preview localhost is not the developer laptop. Use a normal deploy or deliberately configured temporary tunnel if necessary; serving known artifact IDs is safer than exposing arbitrary filesystem paths. A frontend and backend running locally are sufficient for recording under the supplied submission rules.

SSE can improve status presentation after polling works; it is optional transport, not a core dependency. Ensure proxies buffer/timeout behavior is understood before adding it. Status labels come from actual stage transitions.

## 16. Persistence, asset manifests and export package

Use SQLite transactions for project versions, revisions, jobs, evidence and artifact registry. Store bytes under server-owned data paths, write outputs to a temporary per-job directory, then atomically publish/rename and record the manifest. Do not return partially written files as ready.

Store full accepted spec and recipe snapshots, input source hashes, model/tool summaries, actual vendor IDs (private), parameter diffs and check reports. Add schema_version and a startup compatibility check; do not silently reinterpret older records. Short event schema migrations can be simple, but preserve successful files and report incompatibility rather than erase data.

On restart: queued jobs can resume; submitted Rodin jobs reconcile via saved identifiers; interrupted CAD jobs can re-run from frozen inputs; uncertain paid submission stays uncertain until resolved. A saved visual library/revision remains visible during network failure; new generation requires connectivity.

### Artifact/export manifest

An artifact references exact revision/part, role, hash, MIME, unit/frame and known route. Use separate files for independent printable parts; never include the real-board/battery appearance meshes under printable_cad. Hardware-reference models may be inspected/exported separately as references.

| Package path | Content |
|---|---|
| printable/base.stl, lid.stl | CAD-derived parts, exported in mm, preferably local print pose |
| cad/enclosure.step | Exact CAD assembly/parts in documented design frame |
| design/design.json | Accepted components, dimensions, poses, locks and interfaces |
| design/recipe.json | Reproducible geometry program/parameters |
| design/checks.json | Actual methods/results and revision/hash |
| design/sources.json | Identity/field evidence and confirmation provenance |
| manifest.json | Artifact roles, hashes, units/frames and accepted revision |
| visuals/*.glb (separate opt-in) | Appearance references, clearly labeled non-authoritative |

If STL parts are translated to a local print pose while STEP uses assembly coordinates, include that transform. Do not claim STEP/STL retain full parametric history; the recipe/source is needed. A package ZIP can follow individual downloads; individual actual files establish export even before ZIP refinement. Filename extension, MIME and bytes must agree. Preview and export cannot be made from different stale specifications.

Keep API credentials, status subscription keys, signed download URLs, private photos, runtime database and generated artifacts out of the public repo by default. Include safe schemas/fixtures and documentation; event-created demonstration assets can be shared deliberately when rights/privacy are checked. The app must not log entire authorization headers or dump sensitive vendor responses to the UI.

## 17. Lovable development and coding-agent handover

### 17.1 Explicit responsibility

Lovable creates the actual shipped interface during the event: visual system, upload/review, parts tree, viewer controls, inspector, Astra/check panel, revisions and export. Coding agents integrate that interface with actual backend services; they do not discard it and rebuild an unrelated frontend.

Astra in development helps implement/test the backend and integrations. Astra in the product interprets real inputs and uses tools. Record both contributions distinctly. AI-assisted development does not establish runtime usage.

### 17.2 Handover steps

1. Create a fresh Lovable project at event build time using the starting prompt below and concept screens.
2. Connect GitHub; Lovable creates its connected repository. Make the repo public for submission. Current docs support local cloning/two-way sync, but importing an unrelated existing repo as a new Lovable project is not supported.
3. Clone the connected repo and open it in Cursor/Codex. Put this document in docs/FITFORGE-PRD.md and the kickoff prompt in docs/LOVABLE-KICKOFF.md. Inspect actual package.json, lockfile, app entry points and existing components before editing.
4. Agree on backend URL, payload shapes, units and async states immediately. Add the Python service and a single typed frontend adapter in the same checkout.
5. Preserve root frontend structure/scripts. Do not move it into web/ solely to match a planning diagram or replace Lovable's styling while connecting APIs.
6. Use clearly marked sample/disconnected fixtures for UI construction only. Replace them with actual artifact/job/state responses and remove success-looking mock states from the live path.
7. Before switching between Lovable and IDE edits, save/commit, pull current changes and inspect sync status. Avoid concurrent modifications to the same frontend files. Push tested changes to the actually synced branch.
8. Verify local run and hosted preview separately; code sync is not proof that a Python backend is reachable or deployed.

The coding agent operates on the cloned code; no separate “import agent” feature is required. A downloadable code snapshot is a fallback, but one canonical repo prevents drift.

## 18. Manual prerequisites and runtime configuration

### Before the event

Prepare tools/access and planning; create submitted implementation during build time. Bring laptop/charger, recorder/microphone permissions and enough disk space. Have Lovable, GitHub and coding-agent access ready. Confirm the ability to create a public repo. Prepare a component photo/known identifiers for the session and rights to use/share the material; do not rely on previous Arcade IRL product assets as event-created work.

Install a Python distribution compatible with the selected CadQuery package; prefer a known working native architecture. Use uv/venv or a tested conda environment as appropriate. Verify installation access and a native kernel import; submitted app code still begins at the event. Do not guess that the newest Python release has supported CAD wheels. Check Apple Silicon versus Intel package architecture; use one consistent runtime.

Prepare Node/package tooling appropriate to the Lovable scaffold. Do not install Unity/Unreal or create headset dependencies. Blender is optional for inspecting assets, not a core requirement. A physical printer is not required for a software/CAD demonstration; physical printing cannot be claimed without doing it.

### Configuration contract

| Variable | Location / meaning |
|---|---|
| OPENAI_API_KEY | Backend-only secret |
| OPENAI_MODEL | Backend; default gpt-6-astra |
| HYPER3D_API_KEY | Backend-only secret; map consistently into the vendor adapter |
| DATA_DIR | Backend artifact/database directory |
| ALLOWED_ORIGINS | Backend CORS list of exact app origins |
| BACKEND_PUBLIC_URL | Optional artifact public base/tunnel URL |
| VITE_API_BASE_URL or scaffold equivalent | Frontend public backend address only, never a secret |
| CAD_JOB_TIMEOUT_SECONDS | Configured native job deadline |
| MODEL_JOB_TIMEOUT_SECONDS | Configured orchestration deadline |
| RODIN_WAIT_DEADLINE_SECONDS | Local wait/reconciliation policy |
| LOOKUP_SOURCE_LIMIT | Configurable retrieval budget |

The exact frontend env prefix depends on the generated framework. Inspect it instead of assuming Vite blindly. .env.example contains names/defaults only. Show readiness flags, not credential values. Missing keys produce explicit disabled/not-configured states; do not fall back to fake integration.

### At development time: prove these paths separately

- Frontend installs/runs using its existing lockfile/package manager. Use npm ci only when that npm lockfile exists; don't delete/recreate lockfiles for convenience.
- Python environment imports CadQuery and exports a known solid and base/lid.
- FastAPI health responds directly, then the browser can call it with the configured origin.
- One Astra Responses call works; then a trivial authored function tool loop returns its actual output.
- One public manufacturer document is fetched/extracted; citations survive the evidence/UI boundary.
- One Rodin submit/status/download cycle succeeds; independent IDs and stored bytes are verified.
- Viewer loads a known asymmetric calibration mesh with the declared unit/frame conversion.

Illustrative backend launch after creating backend/pyproject.toml and installing its dependencies: from backend/, run uv sync, then uv run uvicorn app.main:app --host 127.0.0.1 --port 8000. Adapt to the proven environment. Avoid reload while paid jobs or capture are active. Frontend run command follows its actual package scripts. Write final exact commands in README after proving them.

## 19. Development milestones and ambitious execution plan

Use these milestones in dependency order. Independent UI generation and backend work can overlap through coding tools; shared-file edits are coordinated. Solo status does not remove requirements.

| Milestone | Build target | Reviewable completion evidence |
|---|---|---|
| M0: boot/contracts | Lovable scaffold, schema agreement, environment and connectivity | Frontend running, health visible, native CAD export and calibration proof |
| M1: CAD vertical slice | Generic operations + reusable base/lid helper | Fresh parameters → actual preview/STEP/STL through typed API |
| M2: input/evidence/discovery | Shared intake, photo proposals, editable crops/list, real lookup, Astra concepts, selection and targeted confirmation | Both intents work; grounded concepts persist; selection enters common build flow; unknown height handled |
| M3: visual assets | Independent Rodin jobs/calibration | Actual job results load under correct part IDs; dimension edits reuse assets |
| M4: assembly/agent | Layout, constraints, create/revise and computed checks | Canonical failure/repair, preserved locks, frozen candidate/accepted state |
| M5: flexible regression | Different component sets/layouts and supported fresh recipe | No example-name dependency; real exports and persistence after reload |
| M6: demo/submission | Record/upload/document completed event work | Public repo/video work signed out; submission confirmed |

### Two-hour target schedule (BST)

| Time | Target |
|---|---|
| Before 18:30 | Planning and environment/access preparation only |
| 18:30–18:45 | Lovable frontend generation + CAD/contract/calibration vertical slice |
| 18:45–19:05 | Shared intake/photo/evidence, grounded concept discovery/selection + early Rodin submissions while CAD/UI integrate |
| 19:05–19:25 | Full assembly, Astra recipe/revision, locks and deterministic checks |
| 19:25–19:40 | Saved assets/revisions, fresh inputs, errors and real export verification |
| 19:40–19:50 | Record a complete working screen/audio take |
| 19:50–20:10 | Edit/upload minute, README/public repo, last blocking corrections |
| 20:10–20:30 | Signed-out links, form and submission buffer |

These are ambitious targets, not guaranteed vendor/model latency. Fix failing boundaries immediately; do not discover basic CAD installation or network issues during final recording. Keep the agreed scope; report unfinished features truthfully if timing prevents completion. Preserve a successful take before further changes and use it if late networking fails. A live slow generation is not necessary for the actual recording; shortened waits/cached results must be labeled honestly.

Agent progress reports should state what actually works, evidence/checks run, remaining integration dependencies and next action. Do not repeatedly request permission for routine choices. Bring concrete incompatible constraints, unsupported requirements or material scope changes to Vikkash rather than silently changing them.

## 20. Acceptance tests and fresh-input verification

A few meaningful numeric/contract tests plus browser smoke checks are preferable to a giant mirrored test suite. Test authoritative behavior and failure recovery; don't claim tests passed until run against the implementation.

| ID | Test | Expected result |
|---|---|---|
| T01 | Baseline fixture | Actual valid base/lid, independent previews and exported bounds |
| T02 | Unit/frame calibration | 100 mm cube and asymmetric marker correct in viewer and exports |
| T03 | Battery baseline | Gap 8 mm, minimum 2 mm passes |
| T04 | Battery height 20 | Gap −2 mm, shortfall 4 mm; actual modeled conflict |
| T05 | Astra repair | Real runtime call proposes allowed candidate; H=28 produces gap 2 mm |
| T06 | Locked state | Footprint/controller pose and wall/base/lid parameters unchanged |
| T07 | Incompatible max height | Unresolved result; no silent unlock or fabricated success |
| T08 | Explode/hide/select | Stable IDs; display changes do not alter spec/check/export hashes |
| T09 | Photo corrections | Crop/name/identity correction survives calls and job completion |
| T10 | Exact/likely lookup | Real source and explicit variant; identity separate from dimensional evidence |
| T11 | Unknown height/board ambiguity | Targeted measurement; chip size not silently used as module size |
| T12 | Conflicting sources | Alternatives/disagreement visible; no average or silent override |
| T13 | Rodin pipeline | Actual submit/status/download, correct IDs, stored loadable GLB |
| T14 | Repeat asset/dimension edit | Same asset reused; identical operation ID creates no duplicate paid request |
| T15 | Ambiguous paid timeout | Uncertainty preserved; no blind resubmission |
| T16 | CAD/lookup/network failure | Accepted state/user values intact; actionable status/manual path |
| T17 | Stale/out-of-order result | Wrong-parent acceptance rejected; old result doesn't overwrite active project |
| T18 | Persistence/restart | Good files remain; known vendor jobs reconcile; no secret exposure |
| T19 | Export integrity | Actual files correspond to accepted hash/units; reference meshes excluded from printable folder |
| T20 | Public submission | Repo/video open signed out, screen/audio readable, original work identified |
| T21 | Dual-intent intake | Switching idea/discover preserves uploaded/manual parts; empty goal valid only in discovery; both converge on common review/build pipeline |
| T22 | Grounded live discovery | Real Astra proposals use actual inventory IDs/evidence; extras/unknown compatibility visible; no fictional success scores or fixed cards |
| T23 | Concept selection and stale inventory | Valid selection updates goal/constraints without confirming dimensions; altered inventory rejects/flags stale concepts |
| T24 | Provisional previews and paid jobs | Unknown sizes labelled schematic/estimated; no automatic multi-concept paid generation; reused references remain separate from CAD |
| T25 | Adaptive onboarding | Genuine photo/intent results update editable brief and next relevant question; no fabricated recognition or silent confirmation; manual path works |
| T26 | Studio transition | Evidence/photo, reference/envelope, concept and CAD states remain correctly labelled; animation/display transformations do not alter engineering state; reduced motion supported |
| T27 | Experience-aware suggestions | Same inventory with different reported interests/skills/tools changes explained tradeoffs/project path; extras and unknown tools remain explicit; no invented proficiency/compatibility |

### Variable-input matrix

1. Two components with different dimensions from the fixture: new geometry, no fixed-name assumptions.
2. Three/four components including a display, with different layout/placement locks: new containment results and updated enclosure.
3. Audience changes a component or connector opening: real dimension/cut change and revised export.
4. Generic foundation proof: fresh bracket lengths/hole spacing or cylinder sleeve recipe. Distinguish foundation operation support from completion of an extra product-family UI.
5. Ambiguous/unrecognizable part: explicit clarification/manual dimensions and no fake online match.
6. Four available components with no predefined product idea: real concept discovery and form-factor alternatives, then selected concept creates a new reviewed CAD design.
7. Change inventory/preferences during exploration: suggestions update or become stale, unsupported additions/dependencies are explicit, accepted engineering revisions remain intact.

Use actual new images/values where feasible. No canned prompt-to-file mapping or manually swapped finished model. For arbitrary rotation, prove exact geometry checks or show conservative/unsupported coverage. Backend numeric tests inspect results/locks/bounds; browser manual checks cover camera, selection, materials, source review and downloads.

## 21. Troubleshooting and common integration caveats

| Symptom | Likely boundary | First diagnostic/action |
|---|---|---|
| CadQuery import fails | Unsupported Python/wheel architecture | Check runtime/version/architecture and official install route; pin the working set |
| Health works in terminal but not browser | CORS, URL/proxy, HTTPS mixed content | Inspect network request URL/preflight; allow actual origin and test exact address |
| Hosted UI calls laptop localhost | Reachability assumption | Use reachable HTTPS backend/tunnel or capture local frontend/backend |
| Empty/wildly scaled model | Unit/frame conversion or camera bounds | Known 100 mm/asymmetric calibration, one conversion boundary and fit camera |
| CAD preview loader fails | HTML/JSON returned instead of geometry | Inspect status/MIME/bytes and artifact route before changing viewer code |
| Rodin stays pending after completion | Wrong identifier/states | subscription_key for status, top-level uuid for download; require all jobs Done |
| Vendor successful query reported failed | HTTP-200-only assumption | Accept documented 2xx codes and parse semantic errors |
| Paid generations duplicate | Retry/debounce/idempotency gap | Persist operation key and vendor refs; never retry unknown submission blindly |
| Correct dimensions, wrong model fit | Visual mesh treated as CAD authority | Inspect envelope/pose/calibration separately; label illustrative aspect mismatch |
| Crops are offset after upload | EXIF orientation/letterbox mapping | Use normalized image pixels and normalized coordinates consistently |
| All clones move/change materials | Shared GLTF cache mutated | Clone part scene/material state, retain wrapper IDs |
| Explode changes fit result | Display transform written into engineering pose | Separate viewer offsets from backend spec |
| Boolean operation invalid | Coincident faces, bad units or selection | Inspect smallest operation, extend cutters, validate operands; avoid decorative fillets first |
| Agent says “fixed” but no geometry | Text response mistaken for executed tool | Inspect actual function-call outputs, job/artifact manifest and checks |
| Tool loop loses context | Wrong call ID/output continuity | Follow current Responses schema and preserve required prior output items |
| Strict schema rejected | Unsupported schema/optional fields | Simplify function schema and validate subset; separate typed stages if needed |
| Old candidate overwrites new one | Stale response/revision state | Require project/revision/hash and expected parent; ignore stale UI results |
| Jobs vanish on restart | In-memory registry/reload | Persist IDs/status; reconcile known external jobs; controlled single backend worker |
| Downloaded CAD differs from preview | Mixed revision/pose/tessellation | Same frozen geometry origin and manifest; verify hashes/bounds/frame |
| “Wall check” passes thin complex shape | Parameter check overclaimed | Limit helper applicability; unknown local thickness until real analysis exists |
| Lookup looks exact but board wrong | Chip/module/variant conflation | Review identifying evidence and applicability; confirm variant/user measurement |
| Photo source cached but shown live | Status/provenance omitted | Save timestamp/retrieval state and label cached evidence |

Log operation/request/job/revision/part IDs and sanitized error codes. Keep source/vender response snippets bounded, with secrets redacted. A diagnostics drawer may show endpoint stage and last safe error; it should not expose private API responses or become the user's main workflow.

## 22. One-minute demo, narrative and submission package

Keep the broad platform ambition, but let the minute follow one coherent journey. This is presentation focus, not a scope cut.

| Seconds | Show | Message/evidence |
|---|---|---|
| 0–5 | Hardware kit/parts photo enters premium guided studio | “You have the parts. What should you build?” |
| 5–13 | Actual component understanding, reported experience/context and grounded concept selection | Astra proposes a useful direction from the real inventory, not a static template |
| 13–27 | Source-backed dimensions, targeted confirmation and actual assembly/CAD | Move from idea to mechanical design; references and engineering geometry stay distinct |
| 27–42 | Component edit → measured conflict → Astra repair request | Already building? Iterate while preserving footprint and board position |
| 42–54 | Checked repaired candidate, compare and accept | Actual measurement/lock evidence, not an AI verdict |
| 54–60 | Exploded inspection and actual CAD download | “Made to Fit: from loose parts to your next prototype.” |

Show one actual Rodin result and its stage/source briefly; don't devote most of the minute to a mesh-generation wait. Astra's visible contribution includes recognition/research, relevant questions and constrained iteration. Shorten genuine waits transparently, naming elapsed generation time where useful. Do not present mockups as app footage, pre-event assets as event work or unimplemented physical testing as done.

Capture a short microphone/readability test first. Save a full narrated working take locally while connectivity works; then trim. Keep key text large at playback size and avoid cursor wandering/scrolling multiple panels. No architecture-slide opening. A backup take can show saved successful state, clearly labeled, if venue Wi-Fi fails. The video/repo links must open without access requests.

### Submission contents

Public repo README with exact launch commands, original event feature list, tool contributions, basic architecture, screenshot/actual capture, limitations and safe environment template. Do not commit private keys/runtime files. One-minute public screen/audio video. Team name/member details and concise description of actual completed work. Record successful submission confirmation before 20:30 BST.

Description draft (edit to match completed features):

“Made to Fit turns a photographed hardware prototype into an editable assembly and dimensioned CAD parts. GPT-6 Astra proposes component identities, retrieves supporting specifications, asks for missing measurements and revises designs using computed geometric checks. Hyper3D Rodin supplies independent visual references; CadQuery produces actual manufacturing geometry. We built the interface in Lovable and integrated the backend with coding agents during the event. Our demo changes a component, detects a lid conflict and repairs it while preserving the footprint and board position, then exports the revised CAD.”

Do not claim measured time savings, guaranteed print fit, strength/thermal/electrical validation or market exclusivity. Useful future metrics to collect after the event: time to accepted/exported revision, manual fields required, source-match corrections, failed candidate recovery and physically measured fit. Those are future evaluations, not invented submission statistics.

## 23. Starting prompts and coding-agent autonomy

### 23.1 Lovable starting prompt

Use the complete updated LOVABLE-KICKOFF.md prompt as the frontend kickoff. It includes premium Astra-guided onboarding, functional landing and both intent paths. The condensed version below must preserve those requirements. Earlier light/card-heavy visual mockups are superseded by the premium studio concepts.

> Build the actual desktop frontend for Made to Fit (provisional name), using this master PRD, the complete LOVABLE-KICKOFF.md prompt and concept mockups. Start with one functional landing/input screen: “I have an idea” or “Explore my components”, shared photo/manual parts/spec links and optional form-factor preferences. Preserve inputs between modes. Discovery permits no goal and displays genuine runtime concept proposals with useful purpose, parts used/unused, dependencies, uncertainties and provisional layout, then explicit selection into the common confirmation/CAD pipeline. Deep graphite spatial studio, warm ivory typography, restrained orange actions, minimal tonal panels and editorial composition. Astra-guided onboarding uses one composer, editable live brief and real on-canvas part/context updates rather than a generic intake form. Create source review/confirmation, assembly, check/revision and export flows. Independent parts have stable IDs; identities, cited proposals and accepted values are separate. Include targeted measurement questions. Workspace: parts tree, real Three.js viewer, contextual Astra/inspector, revision strip; shared CAD/Rendered/Overlay modes, orbit/pan/zoom/select/hide, X-ray and display-only explode. CAD produces the enclosure; Rodin supplies calibrated component references. Use one typed external-backend adapter with section 15 routes, including discovery. Preview fixtures are visibly disconnected/sample and isolated from live success states. Never fabricate concept generation, completed CAD, AI calls, checks or files. Preserve the scaffold for GitHub/local integration. No private browser keys, unrelated authentication, marketing homepage or fixed scenario selector. Written contracts govern incidental image details; refine components/layout within requirements.

### 23.2 Cursor/Codex implementation prompt

> Read docs/FITFORGE-PRD.md and docs/LOVABLE-KICKOFF.md fully, inspect the actual Lovable-generated repository, package scripts and existing frontend before editing. Vikkash is solo but has explicitly retained the full agreed scope. Preserve Lovable's actual UI and repo structure. Make a concise implementation plan with module ownership, contracts, dependencies and verification gates; then execute without repeatedly seeking approval for routine choices. Prove CadQuery native import/export, backend health and asymmetric unit/frame calibration first. Implement the general allowlisted CAD operation language and enclosure helper, typed API adapter, frozen candidates/checks/acceptance, locks, artifact manifests and real STEP/STL previews/downloads. Integrate photo analysis/editable crops, real source-backed specification lookup before confirmation, independent Rodin image jobs/calibration and runtime GPT-6 Astra Responses tools. Use exact vendor identifiers and documented schemas; verify actual account/API behavior rather than copying untested signatures. Keep appearances separate from engineering envelopes. New component sets, sizes, layouts and supported recipes must create new geometry without canned response mapping. Persist user corrections, evidence, assets, vendor IDs and last good revisions; handle failed/unknown submissions honestly and avoid duplicate paid work. Run meaningful fixture, lock, idempotency, stale-response and fresh-input checks. Record important implementation choices in DECISIONS.md. You may refine libraries, decomposition and UX within the contracts, but don't silently replace Astra, shrink scope because of team size or claim unsupported analysis. Start asynchronous asset jobs early, integrate continuously, preserve a locally captured working take and reserve submission time. Report completion with evidence, remaining uncertainties and precise errors; never simulate completed integrations.

### 23.3 Agent planning checklist

Backend addition for the components-to-concepts journey and adaptive onboarding: implement section 4.1's structured discovery and section 15 concept endpoints/tools, nullable-goal discovery intake, inventory snapshots, experience/tool/interest preferences, dependency/capability evidence and stale selection validation. Concept selection enters the existing component-confirmation/CAD workflow, never a separate unchecked generation system. Initial layout previews are schematic/estimated where needed; don't spend Rodin credits on every proposed product. Prove T21–T27 and both entry paths alongside existing checks.

Before broad edits, identify: generated frontend architecture/package manager; working CAD/Python versions; preview format/conversion boundary; schemas; job/persistence strategy; real search integration; account access; required check definitions; branch/sync ownership; local/hosted URL path. A short concrete decision for each is sufficient—don't spend the event planning a different platform.

When a test fails, isolate the boundary and fix the smallest cause. Broaden tests after new failures/changes, not after every cosmetic edit. Document material deviations and ask when a firm requirement truly conflicts with environment/time; user silence is not consent to a scope reduction. Do not ask for permission to write ordinary reversible code, refine layout, add declared tests or repair routine integration errors within the authorized goal.

If using multiple coding tools, coordinate shared-file edits and commits. Avoid separate agents rewriting the same API/client/viewer contracts simultaneously. One runtime product agent is sufficient even if development tools help with distinct implementation tasks.

## 24. References, source verification and mockup briefs

Official/vendor references checked during planning. Proposed product behaviors and engineering choices above are requirements, not evidence of deployed behavior. Recheck exact SDK/package/account support when implementing; do not assume a website's marketing claims are measured performance.

| Topic | Source |
|---|---|
| Astra model/modalities | https://developers.openai.com/api/docs/models/gpt-6-astra |
| Current model/API guidance | https://developers.openai.com/api/docs/guides/latest-model |
| Function/tool schemas and continuation | https://developers.openai.com/api/docs/guides/function-calling |
| Structured output schema behavior | https://developers.openai.com/api/docs/guides/structured-outputs |
| Hosted search and visible citations | https://developers.openai.com/api/docs/guides/tools-web-search |
| Lovable GitHub/local handover | https://docs.lovable.dev/integrations/github |
| Git sync and branch behavior | https://docs.lovable.dev/integrations/git-sync-overview |
| Lovable external API integration | https://docs.lovable.dev/integrations/any-api |
| CadQuery import/export/assembly GLB | https://cadquery.readthedocs.io/en/latest/importexport.html |
| CadQuery assembly structure | https://cadquery.readthedocs.io/en/latest/assy.html |
| Rodin generation parameters | https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5 |
| Rodin status lifecycle | https://docs.hyper3d.ai/en/api-specification/check-status |
| Rodin result identifiers/downloads | https://docs.hyper3d.ai/en/api-specification/download-results |
| Rodin bounding-box conditioning | https://docs.hyper3d.ai/en/api-specification/bbox-control |
| BANG splitting (later) | https://docs.hyper3d.ai/en/api-specification/bang |
| Manufacturer mechanical evidence example | https://datasheets.raspberrypi.com/pico/pico-product-brief.pdf |
| Manufacturer variant/mechanical specifications | https://datasheets.raspberrypi.com/pico/pico-datasheet.pdf |
| Zoo | https://zoo.dev/docs/zoo-design-studio/zookeeper |
| Adam | https://adam.new/ |
| Backflip | https://www.backflip.ai/ |
| SpeakCAD | https://speakcad.com/enclosure-generator |
| Fusion electronics workflow | https://www.autodesk.com/uk/solutions/consumer-electronics |
| Event submission (user-supplied) | https://cerebralvalley.ai/e/openai-gpt-6-astra-london/hackathon/submit |

The final premium concept brief is a high-fidelity Made to Fit spatial studio: deep graphite canvas, warm ivory editorial typography, restrained oxidized-orange actions, precise technical labels, minimal tonal surfaces, contextual Astra guidance and genuine part/model focus. Onboarding starts with one composer and editable brief; engineering views reveal tree/inspector/check controls. Earlier warm-white/teal card-heavy concepts are superseded for styling. Every image carries CONCEPT UI; written geometry/evidence contracts remain authoritative.

| Concept | Specific visual brief |
|---|---|
| Component review | Photo with three editable boxes; likely Pico variant, manufacturer dimension proposals, unknown assembled height, targeted question and confirmation |
| Assembly | Separate base/controller/battery/lid; CAD/fixture/envelope/visual provenance, transparent lid, real-stage Rodin card and viewer controls |
| Checked revision | Measured −2 mm gap, required 2 mm, shortfall 4 mm; candidate H=24→28, preserved footprint/board and Apply |
| Export | Accepted exploded assembly, actual applicable checks, CAD files/design record separate from visual GLB, physical testing unclaimed |

Use the layout/style hierarchy, not incidental generated figures or decorative mechanical details. No image implies actual implementation. The confirmed contract, fixture formulas and source records govern what Lovable and the coding agent build.
