# Made to Fit — quick rehearsal and filming script

Prepared 6 October 2026. This is a rehearsal plan for the local live backend.

## Open these before recording

- App: http://127.0.0.1:5173/
- Demo input: `demo-assets/desk-climate-monitor-parts.png` (AI-generated illustrative photo).
- Finished CAD backup: http://127.0.0.1:5173/studio/project_12b5fa1e40bf4388b2e2ac6a91eb7534?stage=export

The backup is a separate project called “P2S print export verification · synthetic dimensions.” If you show it, introduce it as a previously completed enclosure test; do not imply it was generated from the new photo.

Verified in the running browser: the backup shows accepted revision R3, native CAD, passing geometry checks and actual base/lid/combined 3MF plus STEP/STL download links. Its older revision has no assembly guide; the UI asks you to build and accept a new revision to create one. Use it for CAD/export footage only unless you rebuild it.

## Copy-and-paste brief

> I have a Pico-style controller, a BME280-style environmental sensor and a small OLED display. Explore a beginner-friendly USB-powered desk temperature and humidity monitor using these parts. I have a Bambu P2S and basic soldering tools. Prefer a simple rectangular enclosure with a removable lid and minimal extra hardware. This is a synthetic photo for a software demonstration; exact variants and physical measurements are unverified. Keep electrical compatibility, firmware, mounting, USB access, display openings and sensor ventilation as explicit decisions to review.

## Rehearse once, then film in short clips

1. **Start and upload.** Check the header says **Connected · CAD ready**. Select **Explore my components**, paste the brief, choose the demo PNG, then **Start project**. Wait for photo analysis to finish; you can cut the waiting interval from the video.
2. **Review parts.** Expect three module proposals. Select each numbered crop; correct names and crops if necessary. Confirm each identity as a *demo component description*, not a verified manufacturer variant. If recognition misses a module, add it manually. Proceed to Explore after review.
3. **Find a project.** Use the brief to generate project options. Choose the simplest desk-monitor concept supported by a rectangular enclosure. Show the parts used, extra hardware and unresolved assumptions. Click **Choose project & measure parts**. If the concept needs an unsupported enclosure recipe, refine it toward a rectangular enclosure before continuing.
4. **Enter demo envelopes.** Skip specification research for the quick rehearsal. Use the synthetic values below, replacing any prefilled estimate. Confirm each part’s dimensions. State on camera that these values are demonstration inputs; they are not measurements inferred from the image.
   - Controller: Width **21**, Depth **51**, Height **4** mm.
   - Sensor breakout: Width **11**, Depth **15**, Height **4** mm.
   - OLED module including header envelope: Width **28**, Depth **28**, Height **8** mm.
   - If the chosen concept uses fewer parts, confirm only those parts. Leave unused hardware in inventory.
5. **Build CAD.** Click **Create enclosure draft**, then **Build & check**. Wait for real native CAD and fit checks. Inspect the base and lid; briefly show orbit, explode and X-ray. The first enclosure draft packs component envelopes; review openings and mounting separately. If a check fails, use **Adjust enclosure** to increase the implicated dimension or clearance, preview a new candidate, and build/check again. Accept only an eligible revision with its reported checks reviewed.
6. **Export.** Click **Accept [revision]**, then go to **Print & assemble → Print files**. Download the P2S 3MF or an STL. Show that the files belong to the accepted revision. Open the 3MF in Bambu Studio if that is already available; choose actual printer/nozzle/filament settings and slice separately.
7. **Finish with guidance.** Open **Assembly guide**. Show the parts/preparation and assembly steps. If wiring research is still awaiting evidence or review, show that status and stop there. The guide does not establish a working electrical build from a generated photograph.

## Short Astra prompts

Project refinement:
> Keep this project USB powered, beginner friendly and compatible with the guided rectangular-enclosure path. Use my reviewed inventory and list remaining hardware, firmware and enclosure-opening decisions.

CAD review:
> Review this candidate’s actual fit checks. Explain anything still unresolved for mounting, USB access, display access and sensor ventilation. Keep my confirmed demo dimensions unchanged.

Revision demo, optional:
> Propose a new candidate with 2 mm more side clearance while preserving my confirmed dimensions. Explain what changed and what needs rebuilding before acceptance.

## 90-second edit

- **0–10 s:** “Made to Fit turns the electronics you already have into a project and a custom enclosure.” Show landing page and the parts photo.
- **10–25 s:** Upload and show the three reviewed crops. “Astra proposes identities; I review them.”
- **25–40 s:** Show project options and select the desk monitor. “It explains what I can build, what else I need and what is still unknown.”
- **40–55 s:** Show confirmed dimensions. “This demo uses synthetic dimensions. Real builds use measurements of the actual hardware.”
- **55–75 s:** Show native CAD, fit checks and explode view. “The enclosure is generated as CAD, checked and explicitly accepted.”
- **75–90 s:** Show real print-file downloads and assembly guide. “The accepted design carries its print files and matching assembly guidance.”

Record provider waits as separate clips and edit them down. Keep the same project for the main story. If switching to the completed backup, clearly label the switch.

## Ready-to-film checks

- Header remains connected; no backend-disconnected/sample-preview badge.
- A photo-analysis result is visible, or manually entered parts are clearly described as manual.
- Identities and all dimensions of used parts are confirmed.
- CAD viewer renders without a crash after measurement confirmation.
- Build produces an eligible candidate; acceptance succeeds.
- The downloaded 3MF/STL is a real artifact belonging to the current accepted revision.
- Assembly guide opens, or the completed CAD backup is explicitly presented as a separate earlier test.

Do not make specification research, appearance-model generation or wiring research a dependency of the short filming route. Pre-run optional jobs and show their completed results only if ready.

## Other agent status at preparation time

These are snapshots, not a guarantee that ongoing edits have finished.

- **Update landing page messaging** — completed; reports desktop/mobile review, 37 tests, TypeScript and production build passing.
- **Integrate backend with frontend** — completed; reports pushed checkpoint c92a439, live provider/CAD integration and a successful Bambu Studio import. Independently verified the live API health and an accepted project's CAD/export UI for this filming plan.
- **Redesign Made to Fit UI** — active; latest report confirms the tested journey reaches acceptance and real STEP/STL/P2S 3MF downloads. Earlier measurement-viewer crash is being addressed as part of that live testing. Final completion has not been reported.
- **Assess end-to-end workflow readiness** — active; reports separated model/research worker pools and a combined specification extraction call with a 75-second budget. Reports five appearance models already generated for the user's existing project. Final verification is ongoing.
- **Build the parts-to-project workflow** — active; testing assembly/wiring guidance and replacing technical source IDs in guide text. Wiring instructions remain held where manufacturer evidence does not support required details.
- **Recover hackathon project state** — older interrupted chat, not currently loaded; its integration work is superseded by the completed integration chat above.
- **Build the Made to Fit backend** — older interrupted chat, not currently loaded; use the current canonical repo and completed integration checkpoint.

The new generated-photo journey has not been executed end to end by this preparation chat. The rehearsal checks above are your gate before filming its final CAD/export sequence.
