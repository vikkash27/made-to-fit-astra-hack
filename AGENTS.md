<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All backend calls go through `BackendAdapter` (`src/lib/api`); `VITE_API_BASE_URL` selects `HttpAdapter`, unset selects the labelled `FixtureAdapter`. Why: one typed boundary for the Python backend.
- A failed HTTP request surfaces as `ApiError`; never fall back to fixture data. Why: preview data must not pose as real results.
- Fixture output carries `sample: true` and the UI shows a "backend disconnected" badge. Why: no fake Astra/CAD/Rodin claims.
- CAD (mm, Z-up) → renderer (m, Y-up) conversion lives only in `src/lib/domain/units.ts`, applied once at the viewer root group. Why: PRD §8.1, avoid double conversion.
- Explode/X-ray are display-only; they never change placements, checks or exports.
- Blank dimension input is unknown (`null`), never zero (`parseDimensionInput`).
- Downloads appear only for real artifacts on a non-sample accepted revision (`downloadableArtifact`).
- Project state is server-authoritative, fetched with TanStack Query; zustand holds viewer-only UI state.
- Routes using the 3D canvas or browser storage use `ssr: false`; the canvas is lazy-loaded.
