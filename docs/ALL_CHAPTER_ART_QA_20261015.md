# All-chapter art and sprite QA — October 15, 2026

Local chapters 1–14 are ready for the player's visual review. This pass checks
the existing art, repairs extraction and presentation problems, and supplies
the missing inn journeys. It does not replace the original Adventurer game.

## Changes

- **Rear-row attacks:** wide attack poses could begin outside the right edge.
  Enemies now step into a visible starting position before the attack begins,
  retaining their normal size and returning to their formation slot. The
  movement and attack approach no longer race each other. The browser sweep
  records zero off-screen bounds observations across the 59 identities tested.
- **Travel sprites:** an even 3×4 grid cut through painted hands and boots in
  the swamp slide, market vault and rooftop climb. It also carried parts of
  neighboring poses into those frames. Re-extracted all 36 poses using measured
  ownership rectangles from the same original paintings. No new poses or
  interpolation; original body scale, contact indices and holds retained.
  Planted ground anchors now use the complete pose, and the swamp/market landing
  endpoint moves 60 world pixels left so the last extended arm stays on screen.
  The rooftop's previously approved replacement grip pose stays in frame 4.
  Atlases use lossless WebP and content-named pages to prevent stale cached pixels.
- **Nine Lanterns:** a dedicated combat painting replaces the unsuitable steps
  and planters under the fighters. The flat foreground supports their existing
  foot line. Lamps, cloth, water and sky motion align with the new painting.
  Dialogue still uses its original art. This is the only newly generated painting.
- **Inn journeys:** chapters 2–13 now play a painted outbound journey before
  departure dialogue and a return journey before arrival dialogue/the inn.
  Chapter 14 plays its outbound journey, retains the final choice and epilogue,
  then offers a thank-you card. The card links to games, books and support on
  Neverending Narratives and invites players to watch for the next adventure.
- **Travel saves/mobile:** a saved pending-trip marker resumes travel after a
  reload without awarding rewards twice or changing health. Travel uses FIT
  scaling, including Phaser's display-size aspect mode, so phones see the whole
  scene. Ordinary dialogue backgrounds keep their existing layout.

## Reused journeys

No new travel paintings were commissioned. The six approved journeys are reused
according to each chapter's route; city returns use the rooftop route. Each has
distance → moving weather/scenery → Hiro/contact ground. Normal running remains
420 pixels/second; existing 8–12-second atmospheric timing stays intact.

| Chapter | Route |
| --- | --- |
| 2 | Coast |
| 3–5 | Rainy forest road |
| 6–7 | Swamp |
| 8–9 | City market out / rooftops back |
| 10 | Citadel |
| 11–12 | City market out / rooftops back |
| 13 | Citadel |
| 14 | Citadel outbound, then epilogue and thank-you card |

Chapter 1 retains its existing opening/tutorial and inn transition. These are
shared route presentations, not thirteen individually painted journeys.

## Verification

| Check | Result |
| --- | --- |
| Campaign atlas inventory | 59 identities, 3,322 registered frames; zero invalid rectangles, missing frame references, trim errors or overlapping packed rectangles |
| Visual attack review | All 59 identity contact-sheet rows inspected: idle, windup, contact and recovery; attacks oriented toward Hiro |
| Runtime combat sweep | 59 identities; normal/cast attacks; 118 Hiro finisher plays; 59 enemy defeat-finisher plays; bodies restored after paired animations |
| Combat scenery | 32 distinct campaign battle locations checked for three depth planes, animated scenery, pause and ground placement; Nine Lanterns rechecked after replacement |
| Story travel | All 25 required legs passed: 12 round trips plus chapter 14 outbound; reload and 390×844 layout included |
| Repaired travel | All 36 extracted poses visually reviewed; 21 in-game action-frame screenshots across the three repaired sequences inspected |
| Finale | Original epilogue/narration retained; thank-you links and 390px layout passed |
| Regression | `npm test`, `npm run test:ship`, `node test/story_campaign.js` and `node test/story_readability.js` passed |

Browser testing used desktop Chrome, 1280×760 and a 390×844 emulated viewport.
This is not a physical iPhone performance certification or a claim that every
one of the 3,322 paintings received a full-resolution human art review. The
structural scan covers every registered frame; visual review covers attack
contact sheets, scenery lineups, the repaired travel frames and browser samples.
The player's aesthetic approval remains the final check.

## Evidence and reproduction

Compact results are committed under `docs/art/all-chapter-qa-20261015/`.
Full screenshots and logs are in `test/reports/all-chapter-art/`,
`test/reports/story-stages/`, `test/reports/story-travel/`,
`test/reports/story-travel-frames/` and `test/reports/story-local-release/`.

Useful repeat checks, with the local game server running:

```powershell
python test/art_campaign_atlas.py
node test/browser_story_all_art.js
node test/browser_story_stages.js
node test/browser_story_travel.js
node test/browser_story_travel_frames.js
node test/browser_story_local_release.js
```

Browser checks accept `TEST_ORIGIN` when the server is not on port 8742. The
combat sweep supports `--resume` for an interrupted diagnostic; use a fresh
report when testing changed combat code.

Travel rebuild: `python tools/repair_travel_cells_20261015.py`. Do not fall back
to equal-grid extraction for these three sheets. Measured registrations are
copied into this report's evidence directory. Source masters, the previous
runtime bundles and the new painting/prompt records are preserved at
`../adventurer-expeditions-source-art/astra-v9/all-chapter-qa-20261015/`.
Original travel sources remain in `astra-v3/travel/`. Those sibling source files
are outside this repository; runtime derivatives and repair code are in Git.

## Release boundary

This audit did not publish or push a website/portal release. A separate session
updated the website packaging cap to chapter 6 during the audit; its code and
changelog entry are preserved. Local chapters remain 1–14. Final travel sprite
repairs still need the normal packaging/publish flow to reach a hosted build.
The broad local ship set currently measures **280.89 MB**, above its historical
250 MB packaging target. The development test allows that warning; this is not
a release-size approval. This art QA follows the user's local-edition instruction
to preserve art quality rather than optimize file size.
