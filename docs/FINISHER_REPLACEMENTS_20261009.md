# Finisher replacement and scenery ordering — local edition

## Scope

Replaces 17 rejected Hiro clips: moss giant pair one, both pairs for crab,
toad, vulture and Hydra, and both pairs for elven wizard, elven ranger,
dark-elven swordswoman and enchantress. Stable review IDs are retained.
The eight elf clips have 16 painted poses, up from eight. Creature replacements
have eight poses. The other Hiro clips and all 18 enemy-on-Hiro finishers remain.

New elf timelines last 2.36–2.42 seconds before cinematic time scaling;
creature replacements last 1.50 seconds. These are authored drawing counts,
not the game's render frame rate. Added poses include preparation, blade travel,
contact, withdrawal and recovery. Holding an impact longer also matters; simply
playing twice as many drawings in the old duration would still look rushed.

## What caused instability

The earlier Coast import measured horizontal roots from each pose's feet and
vertical roots from the combined hero/enemy/effect bounds. Changing silhouettes
could therefore change registration. Some older bridge sheets also used changing
body-height references. This pass uses one horizontal root and anatomical body
reference for each move. Only Hiro's measured foot baseline changes per pose;
the opponent and dissolving particles cannot move that baseline.

New drawings came from the built-in image generator, with Hiro and each enemy's
identity references. Masters, rejected drafts, prompts and reference paths are in
the sibling source-art directory:

`adventurer-expeditions-source-art/astra-v7/finisher-replacements-20261009/`

The main sheets provide eight poses each; each elf has an additional eight-pose
sheet. These are new drawings, not duplicate frames or optical-flow interpolation.
`tools/build_v7_pairs.py` keys the measured cell mattes, removes detached grid
rules, orders the drawings, registers and losslessly packs them. The Hydra body
collapse precedes its dissolution. The swordswoman's parry precedes her injury.
The ranger's first visible impact owns the contact event. Boss pairs keep the
existing boss-family matching metadata, preventing a fallback to an ordinary slash.

Do not rebuild this delivery with the historical Coast bridge script. Retained
ordinary clips are extracted from `baseline/`, use `preservePixels`, and retain
their original metadata. `tools/verify_v7_pairs.py` checks their visible RGB,
alpha and root offsets against that baseline. Lossless encoding deliberately
costs more bytes to avoid recompressing unaffected illustrations.

Packed image filenames include their content hash, and the nine atlas JSON
requests use the v7 revision. Both must change together: changing only a JSON
query string can pair fresh frame rectangles with a browser's cached old image.

The elf pairs contain their own painted blood; the generic humanoid blood overlay
is suppressed for those clips only. Older orc/goblin/hag overlay behavior remains.
This is local artwork, not a restricted-site export.

## Scenery order

All six travel presentations and seven battle settings use this back-to-front order:

1. Distant painted scenery.
2. Moving clouds, weather and atmospheric scenery effects.
3. Hiro, enemies and their ground/contact art.

The former near/foreground decoration is no longer loaded or drawn over Hiro.
There are two painted scenery layers plus a separate animated atmosphere plane,
not three overlapping static paintings. Ground stays fixed during battles;
travel retains its fast 420 px/s ground scroll, existing journey duration and
centered run-out. Lamps flicker at their painted positions. Contact splashes and
debris remain local reactions at the obstacle, not foreground scenery.

## Review and limits

Use `docs/ART_REVIEW.html` for individual drawings, slower playback and rework
notes; use the game for cinematic timing and normal-to-paired transitions.
Automated checks cover playback lifecycle and registration, but final movement
quality still needs the user's eyes. Generated drawings are not skeletal animation
and can retain small pose-to-pose contour differences.

The previously reported Citadel portal repeated-leading-leg artwork has not been
replaced by this finisher/scenery pass. It remains a separate known art rework.
No balance, save, recruitment, enemy-defeat eligibility or original Adventurer
files are changed. No build has been published.

## Validation completed

- `npm test` and `npm run test:ship` passed. The shipped-files browser journey
  completed the tutorial and swamp, returned to the inn, and restored camera/time.
- `browser_v3_art.js --expansion --record`: all sixteen Coast/Citadel pairs
  completed, retired the paired victim and restored Hiro's own texture/scale;
  both expansion journeys passed. Recorded playback and inspected contact strips.
- `browser_v3_art.js`: ten retained/new earlier-location pairs, including the
  new moss giant move, and all four older travel presentations passed.
- `browser_battle_layers.js`: seven settings verified moving clouds, a fixed
  ground, weather parentage behind that ground and no independent foreground.
- `browser_visual_review.js`: all 71 entries, last frames, filters, notes,
  desktop/390px layout and isolated save storage passed; repeated after texture
  filenames were versioned. Atlas/ship closure and pixel preservation also passed
  after versioning. **255 retained frames are pixel/alpha/root-identical.**
- Cold startup was measured in Chrome desktop, mobile portrait and landscape:
  **23.40 MB after audio unlock**, down from about 23.67 MB with foreground art.
  The historical 20 MB mobile-portal test still fails; this size-waived local
  edition does not claim portal eligibility. Total shipped files are about
  **147.03 MB / 250 MB**, up from about 103.23 MB, chiefly from new poses and
  lossless packing. No missing files were reported.

These checks use headless Chrome and emulated viewports, not physical devices.
Evidence is in `test/reports/v3`, `polish`, `battle-layers`, `visual-review`,
`expedition` and `startup`. Source art is retained separately for future revisions.
