---
name: Made to Fit
description: "A physical-product workbench for reviewed parts and measured enclosures."
colors:
  background: "oklch(0.183 0.004 236)"
  surface: "oklch(0.225 0.006 236)"
  surface-2: "oklch(0.26 0.007 236)"
  foreground: "oklch(0.948 0.009 95)"
  primary: "oklch(0.71 0.13 45)"
  primary-foreground: "oklch(0.18 0.01 45)"
  muted-foreground: "oklch(0.72 0.007 200)"
  accent: "oklch(0.29 0.008 236)"
  border: "oklch(0.335 0.008 230)"
  destructive: "oklch(0.65 0.18 25)"
  success: "oklch(0.74 0.11 155)"
  warning: "oklch(0.8 0.13 80)"
  studio-background: "#ffffff"
  studio-surface: "oklch(1 0 0)"
  studio-surface-2: "#f5f6f7"
  studio-foreground: "oklch(0.2 0.006 236)"
  studio-primary: "#b9481c"
  studio-primary-foreground: "#ffffff"
  studio-secondary: "#f4f5f6"
  studio-muted-foreground: "oklch(0.48 0.008 230)"
  studio-accent: "#fff1e9"
  studio-border: "#e4e7eb"
  studio-input: "oklch(0.86 0.008 90)"
  studio-success: "oklch(0.52 0.12 155)"
  studio-warning: "oklch(0.58 0.13 70)"
typography:
  display:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(28px, 3vw, 40px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "28px"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0"
  measurement:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "14px"
    lineHeight: "20px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "7": "28px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.studio-primary}"
    textColor: "{colors.studio-primary-foreground}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    textColor: "{colors.studio-foreground}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "40px"
  button-ghost:
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "40px"
  dimension-input:
    backgroundColor: "{colors.studio-background}"
    textColor: "{colors.studio-foreground}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
    typography: "{typography.measurement}"
  stage-navigation-item:
    rounded: "{rounded.pill}"
    padding: "0px 16px"
    height: "44px"
  status-pill:
    rounded: "{rounded.pill}"
    padding: "4px 8px"
    typography: "{typography.label}"
  artifact-surface:
    backgroundColor: "{colors.studio-surface}"
    rounded: "{rounded.lg}"
  composer:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px"
---

# Design System: Made to Fit

## Overview

**Creative North Star: "Made to Fit physical-product workbench"**

Made to Fit extends its existing physical-product studio under the user's white-and-orange direction. Graphite and ivory frame the home page; white grounds project workspaces and the 3D viewer. Orange gives actions and current selection a consistent voice across both themes. Authentic uploaded photos, their reviewed crops and actual geometry carry the visual interest.

The interface is practical and spacious: plain task headings, rounded controls, divided lists and pale tonal groups help a hobbyist move from loose hardware to a printable build. Suggested identity, appearance, measured fit and accepted geometry remain visibly distinct. This records the finished implementation, not a seed or a newly invented visual world; no random concept roll or new raster artwork was produced by this redesign.

**Key Characteristics:**

- Graphite home, white workspace and viewer, existing orange action accent.
- Inter Tight task headings, Geist instructions and labels, JetBrains Mono measurements.
- Soft 8/12/16/20px corners, pill actions and restrained borders.
- Photos and real CAD lead; status, recovery and next actions stay distinct.
- One task-page scroll with contextual Astra help and persistent drafts.

## Colors

One orange brand accent coordinates two themes. The frontmatter preserves the source's mixed hex and OKLCH notation. Unprefixed tokens describe the graphite root; `studio-` tokens describe light workspace overrides. Card and popover share their theme's surface/foreground; dark secondary and muted share surface-2, while studio secondary and muted share studio-secondary. Focus rings use the current primary.

### Primary

**Oxidized orange** fills home actions and marks selected intent choices. **Studio orange** fills workspace primary actions, active step numerals and recommended print downloads; its white foreground is the implemented readable action pairing. **Pale orange accent** groups a next-step prompt, selected part or contextual help launcher without competing with the photo or model.

### Neutral

**Graphite and ivory** form the home background/reading pair. **White and graphite ink** form the workspace, assistant and viewer pair. Pale neutral secondary and surface-2 tones group controls and artifact context; muted foreground supports captions and instructions. Thin neutral borders divide rows and outline fields.

Success green identifies confirmed states, warning amber identifies unresolved review, and destructive marks request failures. Pair each with explicit text or a labelled icon; these are semantic states, not additional brand accents. Studio success and warning override the root values; destructive is inherited.

**The Theme Boundary Rule.** Keep project workspaces and viewers white; keep the home scene graphite. Apply the existing theme boundary rather than introducing a third palette.

**The Action Accent Rule.** Use orange for actions and current selection. Use textual status with semantic color for confirmed, unresolved and failed states.

## Typography

**Display Font:** Inter Tight with ui-sans-serif, system-ui and sans-serif fallbacks. **Body Font:** Geist with the same fallbacks. **Measurement Font:** JetBrains Mono with ui-monospace and monospace fallbacks. The root loads these incumbent families; this redesign introduced no new typeface.

The ramp moves from compact technical values and supporting labels to readable instructions and broad task headings. Weight and space establish hierarchy without decorative task eyebrows. The graphite landing title uses the shared display treatment at a responsive (44–80px); task headings use the headline role. Body copy sometimes uses relaxed leading (1.625), and Astra markdown uses (14px) text with (1.65) leading.

### Hierarchy

- **Display:** Semibold, compact Inter Tight for home headings; shared metrics are normative in the frontmatter.
- **Headline:** Responsive Inter Tight for the current task; its balanced wrapping keeps the task readable at narrow widths.
- **Section:** Semibold Geist for parts, assistant and subsection headings. Other observed content titles use (20–24px) with medium or semibold weight.
- **Body:** Geist for instructions, action text and facts; buttons raise the weight to medium. Longer concept descriptions use (16px), and the landing introduction uses (18px).
- **Label:** Sentence-case Geist for fields, summaries and workspace task labels. The light theme explicitly removes uppercase mono tracking from the incumbent label utility.
- **Measurement:** Mono for numeric fields and dimensions, with a smaller (12px) variant for revision metadata and file hashes.

**The Reading Voice Rule.** Keep task labels and instructions in Geist. Reserve mono for measured values, revision metadata, code and technical identifiers.

## Layout

The workspace uses normal page flow beneath its wrapping header, project summary, stage strip and Astra launcher. Content shares one page scroll; the assistant conversation alone has an independent scroll. Stage panels stay mounted after a visit, preserving unsaved fields while only the active panel is visible. Stage navigation scrolls horizontally and automatically reveals the current step on stage change and resize.

Workspace horizontal padding grows from (16px) to (32px) at (640px). Related controls usually use (8px) gaps, cards and form groups use (12–20px) padding, and main sections use (24–32px) gaps. The frontmatter records the recurring spacing steps rather than every one-off offset.

Parts use a flexible photo column plus a (340px) review/list column with a (28px) gap. The layout stacks at a workspace container width of (850px) or less; photo minimum height changes from (400px) to (300px). Selecting a numbered crop or list part opens its review form, scrolls it into view and focuses it without a second scroll. Optional project preferences live in disclosure sections.

Build/check uses a flexible viewer and a (320px) inspection column, stacking at a container width of (900px) or less. Measurements and print resources use two flexible columns from (1280px), stacking below that viewport width. Print's task heading and revision/resource context precede the model in source order, including on phones. The draft-creation action follows the measurement list in normal flow.

Viewer frames have a desktop minimum of (520px), with height `min(65vh, 720px)`. At viewport widths of (640px) or less, their minimum is (420px) and height is `60vh`. Toolbars sit above and below the canvas in flow and wrap; they do not cover the geometry with floating overlays.

Astra opens a sticky (360px) dock at viewport widths of (1440px) and above. Below that width it opens a right-side dialog drawer, full width up to (440px), with an overlay and focus return to the launcher. Dock height is `calc(100dvh - 64px)`; its conversation scrolls within the available height. The draft survives stage changes and reopening.

The home container caps at (1600px), with horizontal padding (24px), (40px) from (640px), (64px) from (1024px) and (88px) from (1280px). Its text/image layout splits at (1024px). Intent choices wrap; the large composer keeps its labelled input first and places its submit control across the phone width. Workflow columns move from one to two at (640px) and four at (1024px).

**The One Task Scroll Rule.** Keep stage instructions and actions in page flow. Preserve independent scrolling only for bounded conversations and modal content.

## Elevation & Depth

Task surfaces are mostly flat: thin borders, white space and pale fills provide hierarchy. Physical depth comes from the 3D assembly, its light and contact shadows. The photo's small numbered markers use the library's subtle shadow; modal dialogs use standard library elevation. The Astra drawer has an explicit diffuse side shadow (`-12px 0 40px -20px rgba(0,0,0,.25)`); the desktop dock is separated by a border. These are contextual treatments rather than a shadow on every card.

Shared controls use brief color transitions; home intent choices explicitly transition background and border over (160ms) with ease-out. Library dialogs use (200ms) open/close animation. Global reduced-motion styling collapses durations to (0.01ms). Keyboard focus uses the active orange outline (2px) with an offset of (2px); individual fields also shift their border toward primary on focus.

**The Artifact Depth Rule.** Let photos and geometry carry depth. Group surrounding guidance with tonal fills, borders and space.

## Shapes

The scale is soft and deliberate: small corners for fields, crops and thumbnail frames; medium corners for review rows, messages and error notes; large corners for artifact surfaces and composers; extra-large corners for the home image and drawer edge. The normative scale is in the frontmatter. Shared actions, stage choices, viewer segmented controls and status tags use full pills; numeric step indicators and icon actions use circles.

Borders are usually one pixel; photo anchor regions use two pixels and a selected orange stroke. Lucide stroke icons accompany action/status text, and the incumbent corner-shaped SVG mark identifies the product. Actual CAD corners, measured envelope shapes and schematic linework describe hardware and do not establish UI container radii.

## Components

### Buttons

Rounded, readable actions with clear hierarchy. Shared primary, outline and ghost variants use medium-weight (14px) text, (8px) icon gaps and a minimum height of (40px). Larger next-step actions and stage controls use (44px). Primary pairs the active orange and its foreground, reducing fill to 90% on hover; outline darkens its border toward muted foreground; ghost uses foreground at 90% and a pale accent hover fill. Disabled shared controls block pointer interaction and reduce opacity to 40%. All retain visible keyboard focus.

### Chips

Intent and context chips wrap rather than truncate the decision. Home intent choices expose pressed state and show an orange border plus a 10% orange fill when selected. Status pills pair text with semantic color and a faint tonal fill; confirmed and proposed states read “Confirmed” and “Needs review.” Viewer toggles expose pressed state and use a primary-tinted border/fill when enabled. Connection-wire colors belong to the scoped assembly schematic, not this brand palette.

### Cards / Containers

Artifact surfaces are large and calm. Photos and viewer frames use large corners; reviewed photo crops remain authentic image crops. Concept options use bordered large corners and (20px) padding, with orange/accent selection and muted hover. Facts, checks and print files favor divided rows. A tonal next-step group can prioritize one primary action; optional background material sits in disclosure sections. Error notes use medium corners, destructive border/fill tints, an alert icon, readable text and Retry when supported.

### Inputs / Fields

Labels sit above fields in the reading face. Dimension groups retain three axes with visible millimetre units; the numeric values use mono. Blank input means unknown. Estimates visibly state their provenance and need review before confirmation; only parts used by the chosen project govern the measurement stage. Once those parts have estimates or confirmed dimensions, an irrelevant historical estimate failure no longer appears as the current task state. Errors sit after the related action rather than replacing it.

The composer has a bordered large-corner surface. The large home variant uses a labelled, two-row textarea, attachment/link controls and a text-labelled submit action. The assistant variant keeps contextual prompts above its composer. Busy state disables sending and relevant inputs; failed submission retains the draft.

### Navigation

Main navigation uses reading text and an orange underline for the active route; the header wraps on phones and centers navigation from (768px). The project has five stages: Review parts, Choose a project, Measure parts, Build & check, Print & assemble. Active steps have a pale orange pill, orange text and an orange numbered circle. Completed steps show a check; locked steps show a lock and explain the dependency with a route to resolve it. A stage click does not accept a design or complete a review.

### Photo review and CAD viewer

Numbered regions, cropped part rows and the editor share selection. Identity, measurements and generated appearance have distinct labels. CAD, Rendered and Overlay are explicit viewer modes; camera presets, Fit, X-ray, Dims, Envelopes and Explode wrap in their own toolbar rows. Provenance explains what the current mode shows. Explode and X-ray are display-only. Fit checks continue to use measured geometry when an appearance model is visible.

### Print and assembly resources

Print files and Assembly guide expose pressed state and show their matching accepted revision. The combined enclosure 3MF is the primary recommended download; separate plates are disclosed and STEP/STL actions are outlined secondary controls. Records and optional appearance references stay in their own sections. Downloads require real artifacts matching a non-sample accepted revision and specification. The scoped [assembly extension](.impeccable/assembly/DESIGN.md) records guide navigation, measured-layout legends, wiring endpoints and source evidence; inherit it without redefining its local schematic semantics here.

## Do's and Don'ts

### Do:

- **Do** preserve the graphite home and white workspace/viewer theme boundary.
- **Do** use reading-face task labels, rounded actions and the established radius scale.
- **Do** let authentic photos and CAD lead, with readable task context before the artifact.
- **Do** show errors, unresolved review, current selection and next actions as distinct states.
- **Do** preserve page scroll, active-step visibility, focus return and unsaved drafts on phones.
- **Do** retain explicit sample, appearance, measurement and accepted-revision provenance.

### Don't:

- **Don't** infer measurements or checked fit from a photo or generated appearance model.
- **Don't** treat selecting a concept, browsing a step or opening a guide as confirmation or acceptance.
- **Don't** let display controls change placements, checks or export artifacts.
- **Don't** present fixture previews or mismatched revision artifacts as real downloadable output.
- **Don't** place a sticky draft action over measurement fields or floating toolbars over the model.

Not canonized: residual uppercase mono header eyebrows and sub-12px compact metadata/provenance labels are incumbent legibility/craft defects, not reusable typography defaults. Tiny inline-code corners are a local code treatment, and CAD/diagram corners are geometry, not additions to the UI scale. Synthetic verification data and panel-generated tonal ramps are not production content or palette authority.

Evidence: `src/styles.css`; `src/routes/{index,studio.$projectId,__root}.tsx`; `src/components/workspace/{ui,PartsStage,DiscoverStage,ConfirmStage,AutomaticDimensions,EngineerStage,ExportStage,WorkspaceAssistant,AstraPanel}.tsx`; `src/components/studio/Composer.tsx`; `src/components/shell/TopBar.tsx`; `src/components/viewer/ViewerPanel.tsx`; `src/lib/domain/stage-access.ts`; PRODUCT.md; `.impeccable/workspace-redesign.md`; and the current `.impeccable/review/after-*.jpg` captures. Existing `src/assets/example-scene.jpg` is labelled an illustrative assembly; this redesign created no new raster artwork. Runtime uploaded photos, appearance models and native CAD are backend artifacts with their own provenance.
