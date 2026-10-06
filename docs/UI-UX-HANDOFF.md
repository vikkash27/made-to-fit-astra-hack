# Prompt for the UI/UX agent

Copy the following prompt into the next agent chat:

---

Continue Made to Fit in `/Users/vikkash/dev/made-to-fit-astra-hack`. Redesign and implement the frontend experience, not just its copy. Use the installed Impeccable skill and inspect the running app before changing it. Read AGENTS.md, PRODUCT.md and CONTINUITY.md. Preserve existing backend integration and other agents’ uncommitted work.

The current UI feels like a long document squeezed into the left column. Instructions, project preferences, component references, task history and Astra chat all look alike and compete for attention. Users cannot tell what matters, what to do next, or whether something is optional. Replace this layout with an intuitive, visually differentiated product workspace that feels good to use. You have freedom to change the frontend layout, navigation, interactions and visual design.

The real user journey is: upload a parts photo or enter parts → review component identity and crops → choose a purpose or discover a grounded project → confirm the components actually used and their physical dimensions → inspect/build/check CAD → explicitly accept a revision → download enclosure print files and follow the assembly guide. Keep this journey coherent across both “I have an idea” and “Explore my components”.

Design each step around one clear primary action and the main artifact. Give photos and 3D models enough room. Make part review a tangible interaction with photo crops, thumbnails, selection and clear status, rather than another paragraph or undifferentiated accordion. Use meaningful grouping, hierarchy, typography, spacing and surfaces to separate the current task, required inputs, optional tools and results. Do not turn everything into identical dashboard cards. Reduce instructional text and reveal details at the moment they are useful.

Move optional Rodin references, task history and advanced settings out of the main onboarding path. Astra should be a useful, contextual assistant that is easy to open and consult, with prompts suited to the current step. Avoid a permanently dominant wall of chat and instructions. Make blocked navigation explain the requirement and provide an action to resolve it. Show a concise “next step” and preserve users’ progress when moving between stages.

Make these distinctions obvious:
- Component identity is proposed or confirmed; missing dimensions are unknown, never zero.
- Rodin generates component appearance from reviewed photo crops. It is a paid, optional operation, not a measurement or fit check.
- Rendered mode uses aligned, reviewed Rodin models. CAD/Overlay retain the authoritative measured envelope. Include an understandable alignment preview without exposing internal IDs or technical units unnecessarily.
- Generation jobs show their current stage, elapsed time and historical ETA when supported. Never invent percentages or completion times. Keep historical failures in task history, not over an unrelated photo or model.
- An accepted enclosure has real, revision-bound 3MF/STEP/STL artifacts. Bambu P2S 3MF contains separate base/lid objects oriented on the print bed; printing still requires selecting filament/nozzle and slicing. Assembly guidance must be discoverable next to print files.

Preserve engineering and integration rules: every backend call goes through BackendAdapter; HTTP failures surface as ApiError without fixture fallback; fixture data is explicitly labelled; TanStack Query is server state and zustand is viewer state; CAD mm/Z-up conversion stays in units.ts and happens once; explode/X-ray are display-only; exports belong only to the current real accepted revision; rejected candidates cannot replace accepted geometry. Do not rewrite the Python backend, replace real CAD with decorative meshes, fabricate results, modify existing projects’ measurements for a demo, expose keys, or rewrite published Lovable Git history.

Implement a coherent desktop/tablet/mobile experience with no cramped columns, overlapping panes or confusing nested scrolling. Provide keyboard access, visible focus, accessible contrast, understandable error recovery, empty/loading states and reduced-motion support. Use the visual language intentionally, with clear differences between navigation, actions, forms, statuses and optional information.

Test the full journey against the live backend with labelled test data. Use separate test data/ports if another chat is active. Verify photo review, concept selection, measurement confirmation, native CAD, failed-check recovery, acceptance, Rodin alignment, real downloads and the assembly guide. Capture before/after screenshots at desktop and narrow widths; run frontend tests, type-check and production build. Fix problems you find, then update the handoff documentation. Complete the redesign and explain what changed and what remains incomplete; do not stop at a proposed plan.

---

## Functional checkpoint

The implementation supports live local backend/ frontend integration, native CAD checks, explicit revision acceptance, real Rodin references, P2S print geometry and persistent progress timers. See CONTINUITY.md for exact verification and limitations. The screenshot supplied by the user is the anti-reference for layout density and lack of hierarchy; it is not a visual direction to preserve.
