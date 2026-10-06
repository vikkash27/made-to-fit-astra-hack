---
name: Made to Fit
description: "Existing physical-product studio for small electronics projects."
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
  studio-background: "oklch(0.975 0.006 90)"
  studio-surface: "oklch(1 0 0)"
  studio-surface-2: "oklch(0.955 0.007 90)"
  studio-foreground: "oklch(0.2 0.006 236)"
  studio-primary: "oklch(0.64 0.15 45)"
  studio-secondary: "oklch(0.94 0.007 90)"
  studio-muted-foreground: "oklch(0.48 0.008 230)"
  studio-accent: "oklch(0.92 0.01 80)"
  studio-border: "oklch(0.88 0.008 90)"
  studio-input: "oklch(0.86 0.008 90)"
  studio-success: "oklch(0.52 0.12 155)"
  studio-warning: "oklch(0.58 0.13 70)"
typography:
  display:
    fontFamily: "Inter Tight, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 0.92
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "32px"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  supporting:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    lineHeight: "16px"
  measurement:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    lineHeight: "16px"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  pill: "9999px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
components:
  button-discovery-primary:
    backgroundColor: "{colors.studio-primary}"
    textColor: "{colors.studio-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-outline:
    rounded: "{rounded.md}"
    padding: "8px 16px"
  purpose-input:
    backgroundColor: "{colors.studio-background}"
    textColor: "{colors.studio-foreground}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  purpose-chip:
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  stage-navigation-item:
    rounded: "{rounded.sm}"
    padding: "6px 12px"
---

# Design System: Made to Fit

## Overview

Made to Fit preserves its existing physical-product studio interface and voice. The landing page uses graphite, ivory and oxidized orange around the supplied example enclosure image. Project workspaces use warm paper, white surfaces, graphite text and the same orange accent.

Slim borders, compact controls and larger display headings organize the work. Parts, measurements, proposals, appearance references and accepted geometry remain visibly distinguishable.

**Key Characteristics:**
- Graphite/ivory landing and warm-paper studio themes.
- Inter Tight headings, Geist reading text and JetBrains Mono measurements.
- Slim borders, small corners and orange action/selection states.
- Actual accepted geometry beside revision-linked guidance.

## Colors

The source uses OKLCH values; the frontmatter retains those values rather than approximate comment hex codes. Root names describe the graphite theme; `studio-` names record the corresponding light-theme overrides. Card and popover surfaces share the surface color; root secondary and muted surfaces share surface-2, while studio secondary and muted share studio-secondary. Focus rings share the active theme’s primary color.

### Primary

**Oxidized orange** identifies primary actions, selected borders and stage numerals. Discovery actions and discovery print/assembly resources pair the studio orange with graphite foreground. The root orange pairs with the dark primary foreground.

### Neutral

**Graphite**, **ivory**, **warm paper** and **white surface** form the background/text pairs. Surface-2 and accent create restrained tonal separation; muted foreground supports secondary instructions, and border/input colors define slim dividers and fields.

Success, warning and destructive are status colors with explicit textual status or recovery copy. Studio success and warning override their root counterparts; destructive is inherited.

**The Theme Boundary Rule.** Use the existing light studio theme for project workspaces and the root graphite theme for the landing page.

**The Discovery Action Contrast Rule.** Discovery and its print/assembly resources use graphite foreground on orange primary actions, through the local primary-foreground override.

## Typography

**Display Font:** Inter Tight with the source sans fallbacks. **Body Font:** Geist with the source sans fallbacks. **Measurement Font:** JetBrains Mono with monospace fallbacks. The root route loads these three Google Font families.

The display face is compact and semibold; the reading hierarchy uses size and medium weight rather than an additional decorative font. Stage headings use responsive sizes. The exploration empty-state heading runs from (40px) to (64px); concept headings from (44px) to (76px). Export headings use (48px). Titles use the frontmatter title role, with (18px) section titles and (20px) assembly-step titles also present. Most fields, facts and instructions use the body role; helper copy uses supporting text. Relaxed instructions use line-height (1.625), while compact summaries use (1.375).

**The Measurement Voice Rule.** Use the mono face for dimensions, revision identifiers and structured data; keep instructions and field labels in the reading face.

## Layout

The studio shell fills the viewport and provides a scrolling content area below its wrapping header. Stage navigation scrolls horizontally; unavailable stages remain visible and disabled. Desktop workspace panels may scroll independently.

Horizontal panel padding is usually (24px), increasing to (40px) or (48px) at the large breakpoint. Closely related controls use (8px) gaps; sections typically separate by (20–32px). The discovery form is centered within (768px), with optional context fields becoming two columns at (640px). Concept alternatives become three columns at (768px). At (1024px), the concept screen splits into a (420–560px) details panel and a flexible plan/preview panel; export uses two equal columns. Below that breakpoint these panels stack in source order with scrolling access to their contents. Export reserves at least (400px) for the viewer.

## Elevation & Depth

Workspace content is primarily separated by one-pixel borders and tonal surfaces. The composer and viewer controls use translucent theme surfaces with backdrop blur so the underlying image or geometry remains visible. Physical depth comes from the actual 3D assembly and its lighting.

Color transitions are brief; concept previews have a (500ms) fade. The global reduced-motion rule collapses transition and animation durations. Keyboard focus uses a (2px) primary-colored outline with a (2px) offset.

## Shapes

Small corners are consistent across fields, stage navigation, badges and alternative concepts. Buttons use the medium corner; the composer uses the large corner. Purpose/intent choices use full pills. One-pixel borders define containers and selected states; selection changes border color or surface tone. Lucide stroke icons accompany action text, and the existing corner-shaped SVG mark identifies the product.

## Components

### Buttons

Workspace buttons share the body size, medium corners, horizontal/vertical padding in the frontmatter, and an (8px) icon gap. Primary actions fill orange and reduce it to 90% on hover. Ghost actions use foreground at 90% and an accent hover surface; outline actions change from border to muted-foreground on hover. Disabled buttons block pointer interaction and use 40% opacity. The concept’s “Build this project” action is (48px) high with (24px) horizontal padding and (15px) text; it appears before the detailed facts. Discovery’s local graphite foreground override also covers its descendants and discovery export resources.

### Chips

Purpose suggestions are compact outlined pills. Selection changes the border to orange and the text to foreground; unselected choices use muted foreground. They wrap and expose their pressed state. Landing intent choices use the same outlined-pill language at larger padding.

### Cards / Containers

Prefer the existing slim bordered or tonal containers, not a new shadow vocabulary. Alternative concepts use small corners, a fixed (112px) height, an orange selected border and a muted-foreground hover border. Plan facts and export artifacts use divided rows. An empty “Measure next” list receives the existing width, depth and assembled-height review prompt in both the detailed and comparison views. The composer uses the large corner, surface at 85% opacity and backdrop blur.

### Inputs / Fields

Purpose fields and guide selects use small corners, a one-pixel border and background fill. Labels sit above the control; optional context stays optional. Busy forms disable their fieldset and reduce its opacity. Error notes combine destructive border/fill tints, an icon, readable error text and a retry action when retryable. Dimension fields show their units and preserve an unknown blank value.

### Navigation

The main header wraps on phones; its navigation centers at the medium breakpoint. Main active links use foreground and an orange underline. Project stages retain the existing labels: Parts, Explore, Dimensions, Design, Print & assemble. Active stages use the accent surface, foreground text and an orange numbered step; inactive stages use muted foreground. The stage strip scrolls horizontally on narrow screens.

### Accepted-revision assembly guide

Print files and Assembly guide are pressed-state resource controls. The guide separates “Print these” from “Use your hardware,” presents dimensions and additional dependencies, and opens unresolved decisions for review. A labelled native select and Previous/Next controls browse steps; each step includes its completion check. The interactive guide validates both revision ID and specification hash, and the downloadable guide belongs to the same accepted snapshot.

“Show parts in 3D” selects the step’s corresponding part, clears hidden/isolation state, applies display-only explode (0.6), selects the isometric camera and fits the actual accepted assembly. Below (1024px) it scrolls the viewer into view. Browsing steps neither marks assembly complete nor changes the revision. Viewer controls retain CAD/Rendered/Overlay, camera presets, Fit, X-ray, Dims, Envelopes and Explode.

## Do's and Don'ts

### Do:

- **Do** retain existing action names, stage labels and Made to Fit voice.
- **Do** use the light studio theme and the established discovery action foreground override.
- **Do** preserve visible focus, loading, error, empty and disabled states.
- **Do** keep measured envelopes, appearance references and accepted CAD visibly distinct.
- **Do** preserve scrolling access to instructions and viewer controls on phones.

### Don't:

- **Don’t** turn concept selection or guide navigation into confirmation of dimensions or acceptance of a design.
- **Don’t** hide fixture provenance or present appearance references as measured geometry.
- **Don’t** let explode, X-ray or assembly-step browsing alter geometry, checks or exports.
- **Don’t** offer downloads or a real assembly guide for sample previews or mismatched revisions.

Not canonized: the build carries uppercase mono eyebrows above some headings and display tracking (-0.045em), which the craft floor rejects; these remain incumbent defects, not reusable rules. The landing heading’s (128px) maximum and the light theme’s white-on-orange action foreground are also excluded as general defaults because they exceed the floor’s display/contrast guidance. Existing small corners remain recorded because the explicitly preserved incumbent interface establishes them.

Evidence: `src/styles.css`, workspace `ui.tsx`, `PurposeBrief.tsx`, `DiscoverStage.tsx`, `BuildGuide.tsx`, `ExportStage.tsx`, `ViewerPanel.tsx`, `TopBar.tsx`, `Composer.tsx`, and the studio/landing routes; desktop discovery and mobile accepted-assembly screenshots in `.impeccable/review/`. Screenshot inventories are synthetic workflow-verification data, not the user’s personal parts.
