---
name: Made to Fit — interactive assembly extension
description: "Inherited studio patterns for revision-linked assembly and source-backed wiring guidance."
colors:
  background: "#ffffff"
  surface: "oklch(1 0 0)"
  surface-2: "#f5f6f7"
  foreground: "oklch(0.2 0.006 236)"
  primary: "#b9481c"
  primary-foreground: "#ffffff"
  secondary: "#f4f5f6"
  muted-foreground: "oklch(0.48 0.008 230)"
  accent: "#fff1e9"
  border: "#e4e7eb"
  destructive: "oklch(0.65 0.18 25)"
typography:
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "32px"
  section:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "28px"
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
  pin:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "16px"
    lineHeight: "24px"
rounded:
  lg: "16px"
  pill: "9999px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-outline:
    textColor: "{colors.foreground}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-ghost:
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    typography: "{typography.body}"
  documentation-input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "12px"
    typography: "{typography.body}"
  step-navigation:
    rounded: "{rounded.pill}"
    size: "40px"
    typography: "{typography.body}"
  check-container:
    backgroundColor: "{colors.secondary}"
    rounded: "{rounded.lg}"
    padding: "16px"
    typography: "{typography.body}"
  wiring-endpoint:
    backgroundColor: "{colors.secondary}"
    rounded: "{rounded.lg}"
    padding: "16px"
    typography: "{typography.body}"
---

# Design System: Made to Fit — interactive assembly extension

## Overview

**Creative North Star: "Made to Fit physical-product studio"**

This assembly extension inherits the Made to Fit physical-product studio in [the root design system](../../DESIGN.md). Its shipped light workspace uses white surfaces, graphite reading text and a restrained orange action accent. This document applies only to BuildGuide, AssemblyDiagram, WiringPanel, WiringDiagram and their JobProgress presentation; it does not redefine the shell, viewer or assistant.

The source is the authority for inherited values: the current light overrides in `src/styles.css` differ from several values in the incumbent root document. The frontmatter below records those currently used overrides at this fresh boundary. The extension presents practical instructions through readable text, ordered controls and explicitly labelled diagrams; its identity is inherited, not a new visual world.

**Key Characteristics:**
- White studio surfaces with orange action and selection states.
- Geist instructions, medium-weight headings and mono measurements or pin labels.
- Flat tonal checks, wrapping pill controls and numbered assembly navigation.
- Measured-envelope legends and source-backed connection schematics with readable labels.

## Colors

One inherited action accent sits against white and pale neutral surfaces. The frontmatter preserves the source's hex and OKLCH formats; it does not replace them with approximate comment colors.

### Primary

**Studio orange** fills primary actions and the current numbered step. **Primary foreground** provides the corresponding action text. Ghost hover uses the pale orange accent; primary hover reduces the fill to 90% opacity.

### Neutral

**White background and surface** carry instructions and diagrams. **Graphite foreground** carries module names, checks and source titles. **Secondary** groups checks and endpoint labels; **surface-2** fills inactive hardware envelopes. **Muted foreground** carries helper copy, captions, status and inactive envelope strokes. **Border** divides evidence, connection rows and document controls. **Destructive** marks an actual request error with explicit recovery copy.

**The Action Accent Rule.** Orange identifies actions and current selection; instructions and evidence remain graphite on neutral surfaces. Connection-line colors identify suggested wire labels, not additional brand accents.

## Typography

**Body Font:** Geist with the source sans fallbacks. **Measurement / Pin Font:** JetBrains Mono with monospace fallbacks. Inter Tight is inherited elsewhere in the application; these scoped components use Geist headings rather than introducing a display role.

The hierarchy is compact and functional: active step and wiring titles use the title role; the guide title uses the section role. Parts, signal names, control labels and check headings add medium weight to body text. Instructions and plan overview use relaxed leading (1.625). Captions, progress summaries and evidence helper copy use supporting text. Dimensions and elapsed time use the measurement role; exact endpoint pins use the larger pin role.

**The Readable Label Rule.** Keep module names in the reading face and pin identifiers or measured dimensions in mono. Full labels wrap in HTML rather than shrinking inside a scalable diagram.

**The Heading First Rule.** The active step heading precedes its step count and review status. Sequence numbers belong to the navigation because assembly order carries meaning.

## Layout

Related controls use (8px) gaps; part legends, checkbox groups and evidence use (12px); containers use (16px) padding. Major groups separate by (20px) or (24px). The guide allows its title and progress summary to wrap, and its section and previous/next controls wrap into additional rows.

At (640px), preparation becomes two columns and wiring endpoints become two flexible columns with a (48px) connector between them. Below that width, endpoints stack vertically with a vertical connector. Names wrap at word boundaries; long pin identifiers may wrap anywhere. Neither layout truncates the actual module or pin name.

The measured-layout SVG scales to full available width with a maximum height of (256px). Its labels live in a separate wrapping HTML legend below the geometry, including names and dimensions. This keeps labels readable on phones without treating the SVG's reduced scale as a text-size decision. The diagram projects accepted engineering bounds into a top view; it does not draw mounts or inferred pin locations.

## Elevation & Depth

The scoped guide is flat. Pale fills group checks and endpoints; thin borders separate connection rows and source sections. It does not use the global contact shadow. Depth belongs to the separately owned 3D viewer, while the measured plan and connection schematic remain crisp geometry.

**The Flat Guidance Rule.** Separate instructions with borders, whitespace and neutral tonal fills. The assembly extension adds no shadow vocabulary.

Buttons inherit brief color transitions. Active jobs use the library spinner, suppressed for reduced motion; there is no authored decorative entrance. Keyboard focus inherits the global primary-colored outline (2px) with offset (2px).

## Shapes

Shared actions are pills and numbered step controls are circles. Check groups and endpoint labels use the inherited large corner. One-pixel borders, neutral fills and restrained stroke changes define state. The assembly diagram uses rectangular bounds with small geometric corners, because these shapes describe envelopes rather than container styling. Lucide stroke icons accompany navigation and status; completion uses the library check icon.

## Components

### Buttons

Clear action text with optional stroke icons. All three shared variants have a minimum height of (40px), an (8px) icon gap and medium-weight body text. Primary fills orange; outline uses a thin border that darkens toward muted foreground on hover; ghost uses foreground at 90% and the accent hover fill. Disabled controls block pointer interaction and reduce opacity to 40%. The section buttons expose pressed state.

### Inputs / Fields

The documentation input is a labelled, two-row textarea on white with a thin border and the inherited large corner. It accepts optional documentation URLs and keeps the empty research path visible. Review and completion use native checkboxes with adjacent explanatory text. An unavailable or saving progress record disables completion checks, including wire checks across wire navigation, so saved state remains authoritative.

### Cards / Containers

Check containers group a medium-weight instruction heading, relaxed check text and a completion checkbox in a neutral fill. Availability notes use the same tonal language. Request errors use a destructive tinted surface and border, a library warning icon, error text and Retry where supported. These patterns add no shadows.

### Navigation

Three wrapping action controls expose Parts & preparation, Assembly steps and Wiring. Assembly uses an ordered row of numbered circular controls; the current step has orange fill and `aria-current="step"`, and saved completed steps show a check icon. Choosing a step presents its title before its count/review status, focuses corresponding parts and leaves completion explicit. Previous/Next disable at sequence boundaries.

### Measured layout and part legend

A proportional top-view SVG shows native enclosure and hardware bounds. Active hardware fills orange; printable enclosure bounds remain white with an active stroke. Both diagram shapes and full-name legend controls focus the selected part in 3D; SVG controls support Enter and Space. The legend includes measured dimensions and the caption names the envelope limitation.

### Wiring connection and source evidence

Each active connection displays its signal, voltage, suggested wire identification color and two full module/pin endpoints. A crisp line joins the labels horizontally or vertically according to width. The caption explicitly identifies a schematic rather than physical pin positions. Suggested wire colors retain their local semantic role; they are not general interface accents.

Connection rows show both endpoint names and pin labels. Proposed plans expose per-connection review plus exact-module/pinout and power/logic confirmations; directions remain locked until review is complete and unresolved decisions are cleared. Reviewed plans show an instruction, completion check and server-saved per-wire checkbox. Browsing wires never implies completion.

Expandable evidence pairs the component and source location with a quotation and readable linked document title. Overview/power/unresolved references render human-readable document numbers; the Source documents list shows titles rather than internal source IDs. Downloads belong to the reviewed plan and matching revision/specification.

### Job progress

A compact status row combines a library spinner, check or alert icon with a readable job kind and backend stage. Elapsed time or completed duration uses mono tabular numerals below the status, with a static announcement policy for the ticking clock. Errors use destructive text; missing timing is explicitly labelled.

## Do's and Don'ts

### Do:

- **Do** inherit the current light studio custom properties and shared workspace buttons.
- **Do** keep step status below the heading and show full part and pin names on phones.
- **Do** provide textual labels and evidence alongside schematic color.
- **Do** retain loading, saving, error, disabled and keyboard-focus states.
- **Do** keep measured envelopes, display-only appearance previews and reviewed wiring distinct.

### Don't:

- **Don't** replace full endpoint names with shortened SVG labels.
- **Don't** infer physical pin positions from a connection schematic or dimensions from an appearance model.
- **Don't** use navigation or viewing a source as a completed check or user review.
- **Don't** broaden this extension document into rules for the shell, viewer or assistant.

Not canonized: synthetic review-fixture dimensions and pinouts, suggested wire colors as brand accents, outer diagram corners as a generic container default, and incumbent root-document values that differ from the current light-theme source. They are test data, local schematic semantics, a specific diagram treatment, or stale evidence rather than durable extension rules.

Evidence: `src/styles.css`; `src/components/workspace/{BuildGuide,AssemblyDiagram,WiringPanel,WiringDiagram,JobProgress,ui}.tsx`; [PRODUCT.md](../../PRODUCT.md); [surface brief](../interactive-assembly.md). Reviewed captures: `../review/assembly/{desktop,mobile,user-495,wiring-reviewed,wiring-phone}.png`. Captured inventories and test pinouts are labelled verification data. Ready appearance previews may display before manual alignment, but remain display-only; native envelopes retain dimensional authority. This document records the extension only and leaves inherited root design, viewer and assistant ownership intact.
