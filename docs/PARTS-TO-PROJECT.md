# Explore my components

The discovery path focuses on small electronics hobbyists. The idea-first entry remains available.

1. Upload up to five JPEG/PNG/WebP photos at a time. Review photo analysis proposals, identities and each component crop. Extra photos remain selectable in the parts workspace.
2. Generate each confirmed photographed component's optional paid Rodin reference from its reviewed crop. Review alignment; appearance is never dimensional authority. Fit continues to use measured envelopes.
3. Enter Explore. Describe the purpose, use setting, experience, available tools, time budget and whether extra hardware is allowed. Fields are optional. Preferences save through BackendAdapter before concept generation uses the returned draft version.
4. Compare projects using human-readable part names, extra hardware, firmware, difficulty reasons, unresolved assumptions, measurements and layout rationale. The guided draft path supports rectangular enclosures; concepts requiring custom recipes need refinement.
5. Confirm identity and X/Y/Z measurements for only the parts used by the selected project. Unused parts remain in inventory. Candidate validation enforces the selected part set and reviewed dimensions. The first draft packs measured envelopes; mounting, wires and access openings need deliberate review.
6. Build and check native CAD, inspect it, then explicitly accept a revision. Print files and Assembly guide are two views inside Print & assemble. Existing STEP/STL/3MF generation comes from the native CAD pipeline.
7. The interactive guide lists printed parts separately from hardware, carries concept dependencies and unresolved decisions, and supplies mechanical preparation, slicing, dry-fit, wiring-review, closure and functional-test steps. Show parts in 3D changes viewer selection/explode only. On mobile it brings the assembly back into view.

## Revision-bound guide

Candidates freeze `goal_snapshot` and `concept_snapshot`. CAD builds derive a structured `build_guide` from that snapshot and the actual native assembly manifest, then register `build-guide.md` as a hashed artifact carrying the revision ID and specification hash. The same structured content feeds `GET /revisions/{id}/build-guide`.

The endpoint requires the current accepted revision. The frontend checks the guide's revision and specification hash and offers only matching real downloads. Later brief changes do not rewrite an existing guide. Older builds without a guide show a rebuild-and-accept instruction. Sample previews create no downloads or assembly claims.

Guidance is mechanical and grounded in the reviewed envelope layout. It does not invent pin-to-pin wiring, firmware, mounting fixtures, apertures or validated print profiles. Those requirements stay visible as decisions to review before construction.

## Verification

`src/test/discovery-workflow.test.tsx` verifies save-before-generate versioning, error behavior and used-part selection. `backend/tests/test_build_guide.py` exercises real native build/accept/export, preserved unused inventory, immutable guide snapshots, artifact hashes and current-accepted gating. Existing frontend/backend tests cover the original path and engineering rules.
