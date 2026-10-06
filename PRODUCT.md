# Made to Fit

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hobbyists building small electronics projects from parts they already own, including people making their first build.

## Product Purpose

Turn photographs of available parts and a desired purpose into grounded project options, reviewed component measurements, printable enclosures, and understandable printing and assembly guidance.

## Operating Context

Two entry points: bring an idea, or discover a project from photographed parts. Review identities and photo crops, explain intended use and available tools, choose a concept, confirm measurements, build and check CAD, explicitly accept a revision, then print and assemble.

## Capabilities and Constraints

The Python backend owns project state. Astra proposes identities and project concepts. Rodin creates optional paid component appearance references, which never establish dimensions. Native CAD supports rectangular enclosures and bounded primitive recipes. Downloads require real artifacts from the current accepted revision. Geometry checks do not verify wiring, firmware, thermal performance, fastening, or slicer settings.

## Brand Commitments

Preserve the existing Made to Fit interface and voice while extending the parts-to-project workflow.

## Evidence on Hand

Existing typed adapter, Python CAD pipeline, reviewed photo crops, revision manifests, checks, and registered artifacts. Fixture mode is labelled sample data with a backend disconnected badge.

## Product Principles

- Start with the hardware the hobbyist owns and the purpose they describe.
- Keep suggested identity, appearance, measured fit, and accepted geometry distinct.
- Explain dependencies and unresolved decisions before building.
- Tie printing and assembly instructions to an immutable design revision.
- Never invent pinouts, mounting hardware, measurements, or successful provider results.
