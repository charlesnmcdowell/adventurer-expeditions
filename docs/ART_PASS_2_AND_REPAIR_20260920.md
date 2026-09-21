# Art pass 2 and recovery of concurrent edits

Completed 2026-09-20, inside Adventurer: Expeditions only. The original
`../adventurer` website game was not edited or published. Fable was paused
before the runtime reconciliation.

## What is complete

The source art delivery is at
`../adventurer-expeditions-source-art/astra-v2/manifest.json` with a frame-by-frame
gallery at `astra-v2/index.html`. These files are outside the upload package.

- Six paired Hiro finishers: wolf cleave, boot pin, rising cut; plant stem cut,
  vine pin and crosscut. Six painted frames per clip, with visual contact and
  release markers; opponents dissolve without blood or exposed anatomy.
- A corrected eight-frame walk with passing positions and measured per-frame
  body registration. The rejected twelve-frame alternatives are not selected.
- Four-frame sheathed idle, keeping the sword at the hip.
- Two painted inn scenes: Hiro eating alone, or Hiro and Bram together. Three
  transparent four-frame overlays animate candle flame, stew steam and hearth.
  The people are painted stills; they do not perform an eating animation.
- Four distinct Hiro skill icons, reviewed at 64 pixels, with source resolution
  sufficient for the requested 96-pixel presentation.
- Existing wolf and thorn-lurker fight coverage confirmed: 13 clips / 55 frames.
  The sources are referenced from v1 rather than duplicated.

The selected new masters total 26,844,325 bytes across 14 PNG files. They are
**source art, not a shipping size**. Registration, alpha extraction, atlas
packing, animation integration and a fresh runtime size/readability check remain
the next intake step. This pass does not claim that these new pictures are
already displayed in the game. Existing v1 art remains the runtime art.

## Runtime faults found and repaired

Fable's write replaced newer integrations with older copies while retaining
other newer files. Comparing the resulting files and running the tests exposed
actual mismatches, not merely stylistic differences:

| Fault | Repair |
|---|---|
| Scene loader expected a single image while supplied Hiro art used multiple atlas pages | Added the common `painted.js` loader and used the existing packed atlas metadata in combat, travel and inn. |
| Save/load called a missing `Campaign.sanitizeRun` | Restored normalization and migration without discarding earned gold, skill levels or known purchased identities. |
| Recruit checks no longer proved that all required painted frames were loaded | Restored the complete-clip/frame gate. Only ready Bram may be fielded; new recruitment remains locked for this tutorial pass. |
| Old preloads could request missing or out-of-scope art | Limited the tutorial loader and ship manifest to Hiro, Bram, ordinary wolf and thorn lurker art plus needed scenery/music. |
| Combat/SDK start could run before scenery was ready | Wait for scenery and the first rendered frame; delayed-scene browser tests verify the readiness condition. |
| Hit-stop, recoil completion and paired-target metadata were lost | Restored animation sequencing, scaled-time impact holds, matching paired targets and one death presentation per victim. |
| Nested camera/slow-motion effects restored every clock to 1 | Capture each prior time scale and camera state, preserve outer cinematics and restore on completion, rejection or scene shutdown. |

Preserved Fable's intended manual skill taps, three-second hold information,
guided tutorial pauses, cast/kill cinematics, large HUD buttons, locked inn
options and Replay the road. Hiro remains permanent. The tutorial now uses
ordinary wolves, thorn lurkers and an ordinary gray-wolf pack leader; boar,
Alpha and later quests remain stored on disk but are outside this slice.

The old three wolf finisher clips still supply runtime paired finishes. The new
six-clip variety requires intake. Until then a plant's existing painted down
clip provides its death animation. Every lethal target is processed, including
early-wave, cleave and damage-over-time deaths; this is not a claim that all
new choreography is already integrated.

## Verification and size

- Final `npm test` headless regression gate **passed**. It covers simulation, recruitment/save migration,
  actor lifecycle, nested cinematic cleanup, portal readiness, art registration,
  the tutorial ship contract and the strict decimal 20 MB budget.
- Upload-only browser journey completed the tutorial twice: 170 gold persisted,
  12 requested skill casts, 20 cinematic runs and 20 time-scale restorations,
  no browser errors, hangs or defeats. A real 3.4-second inspection hold was
  exercised. Recruitment/dialogue counts are zero because the slice is locked.
- Separate recruitment browser checks cover legacy Bram ownership, rejected
  unsupported actors, denied direct purchases, save reload and painted travel.
- Cold startup tested at 1280×760, 390×844 and 844×390 with empty caches. A second
  pass used a CrazyGames SDK test stub and a 1,800 ms scenery delay. Loading-stop
  and gameplay-start occurred only after readiness.
- Runtime package: **15,650,969 bytes / 195 files**. Remaining space below
  20,000,000 bytes: **4,349,031 bytes** before v2 intake.
- Cold bytes through visible gameplay: **11,931,986**; after audio:
  **12,976,946**. The stub variant adds three bytes of test policy data.
- Source delivery validation checks all 27 selected/reused file paths, hashes,
  dimensions and animation marker contracts. Gallery QA covers ten players,
  four icons, frame stepping/wrapping, speed, pause and inn overlay placement.

Evidence lives in:

- `test/reports/expedition-reconciled-20260920/verification.json`
- `test/reports/regression-reconciled-20260920.log`
- `test/reports/startup-reconciled-20260920/cold-start.json`
- `test/reports/startup-reconciled-20260920/cold-start-portal-stub-delay1800.json`
- `../adventurer-expeditions-source-art/astra-v2/delivery-validation.json`

These are local automated/browser checks. Physical iPhone/Safari and the actual
CrazyGames portal remain unverified. The measured headroom is not a guarantee
that all new art will fit until its runtime atlases and inn composition are built.

## Intake next

Use the selected manifests, not directory globs: rejected sources and review
captures are deliberately retained. Preserve body proportions and per-frame
ground anchors instead of fitting each silhouette to the same rectangle.
Finishers have tight margins and gray backgrounds; review blades, silver armor,
fur and translucent dissolve effects after keying. Check the sheathed-idle
transition through the existing draw and sheath clips. Replace superseded clips
rather than packing unused alternatives. Then rerun the same regression,
upload-only journey and cold-load checks with the new atlases.
