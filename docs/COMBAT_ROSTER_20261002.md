# Local combat roster expansion - October 2, 2026

Ready for visual playtesting, not a declaration that every animation is final.

Nine remaining monsters have 12-frame primary attacks: wolf, plant, serpent, beetle, moss giant, hag, goblin, spider and orc. Alpha retains its approved 12-frame attack. Fifteen Hiro paired finishers now have 12 drawings. Pilot Hiro slash/hit and Alpha cleave remain unchanged. No combat stats or logical hit times changed.

| Actor | Clip | Frames before / after | Duration | Main contact |
|---|---|---:|---:|---:|
| wolf | bite | 4 / 12 | 370 ms | 80 ms |
| plant | lash | 6 / 12 | 660 ms | 350 ms |
| serpent | attack | 4 / 12 | 490 ms | 240 ms |
| beetle | attack | 4 / 12 | 490 ms | 240 ms |
| moss_giant | attack | 4 / 12 | 490 ms | 240 ms |
| hag | attack | 4 / 12 | 490 ms | 240 ms |
| goblin | attack | 4 / 12 | 490 ms | 240 ms |
| spider | attack | 4 / 12 | 490 ms | 240 ms |
| orc | attack | 4 / 12 | 490 ms | 240 ms |
| serpent | hiro-finisher-1 | 6 / 12 | 1420 ms | 400 ms |
| serpent | hiro-finisher-2 | 6 / 12 | 1420 ms | 400 ms |
| beetle | hiro-finisher-1 | 6 / 12 | 1420 ms | 400 ms |
| beetle | hiro-finisher-2 | 6 / 12 | 1420 ms | 400 ms |
| hag | hiro-finisher-1 | 6 / 12 | 1420 ms | 400 ms |
| hag | hiro-finisher-2 | 6 / 12 | 1420 ms | 400 ms |
| goblin | hiro-finisher-1 | 6 / 12 | 1420 ms | 400 ms |
| goblin | hiro-finisher-2 | 6 / 12 | 1420 ms | 400 ms |
| spider | hiro-finisher-1 | 6 / 12 | 1420 ms | 400 ms |
| spider | hiro-finisher-2 | 6 / 12 | 1420 ms | 400 ms |
| orc | hiro-finisher-1 | 6 / 12 | 1420 ms | 400 ms |
| hiro | wolf-pin-paired | 6 / 12 | 1600 ms | 660 ms |
| hiro | wolf-rising-cut-paired | 6 / 12 | 1600 ms | 520 ms |
| hiro | plant-stem-cut-paired | 8 / 12 | 1800 ms | 640 ms |
| hiro | plant-vine-pin-paired | 6 / 12 | 1600 ms | 660 ms |

## Rejected drafts and continuity

Retained the approved Alpha pin/parry, both moss-giant finishers, plant crosscut and orc finisher 2. Replacement drafts had wrong paired proportions, cropped anatomy or neighboring poses. Rejected drafts are not shipped. Retained clips still have their previous visual limitations; this is not a claim that every proportion issue is fixed.

Plant vine-pin contains Hiro throughout. Its last extracted region included a second recovery Hiro; a measured empty gap now excludes that extra pose. Background keying preserves metal and white blade pixels. Purple-pixel detection is a diagnostic, not semantic proof: review the actual drawings and browser playback too.

All unaffected clip metadata, crop rectangles and pivot-relative offsets match the saved baseline. Original atlas pixels were not repacked. Every expanded clip retains its total duration and logical contact time; see timing-audit.json.

## Validation

- npm test passes: simulation, lifecycle, 13 atlas contracts, pacing, policy and shipping closure.
- npm run test:combat-roster passes: all 23 paired variants across ten monsters, every expected frame, visible Hiro object, native texture/scale restored on completion and cancellation. Browser videos: test/reports/combat-roster/ (ignored by Git). Object visibility is not proof that a drawing contains correct anatomy.
- Browser Alpha pilot: optional fatal routing, pause, restart, disable and portal policy passed.
- Installed Chrome ship journey: tutorial forest, inn, swamp, inn passed. Subsequent plant repair/retained moss clips verified with the focused roster test.
- Cold-cache desktop/mobile portrait/mobile landscape loaded successfully. The unchanged 20 MB startup gate FAILS: ~20.74 MB visible gameplay / ~21.82 MB with audio, versus pilot ~18.68 MB with audio. Full selected package ~62.20 MB, formerly ~48.86 MB. This is a local-edition build; no portal export or deployment was made.

## Pending monster-on-Hiro work

Only the previously approved optional Alpha fatal is implemented. The wolf request was rejected by the image-generation tool; no additional monster fatalities were generated. Pending choice: non-graphic defeats or leave these out. Do not describe this attack/Hiro-finisher batch as completion of the enemy-fatal roster. Local-only/default-off setting and portal exclusion remain unchanged.

## Rebuild and provenance

Masters, extracted PNGs, exact prompts/reference records and rejected drafts: ../adventurer-expeditions-source-art/astra-v4/roster-20261002/. These masters are outside this Git repository. Runtime atlases, registration/prompts and intake code are saved here.

Use tools/build_combat_roster.py --prepare-attacks / --prepare-pairs, inspect the extracted drawings, then --apply. The explicit reject list preserves six previous finishers. The optional prepare_pairs(only={...}) Python helper supports targeted repair. Do not run older blanket builders over current atlas metadata.

Changed: ten actor manifests, eleven appended roster WebP pages, painted.js cache stamp, index script stamp, ship allowlist, intake tool, tests/package command, LEVELS/GDD/CHANGELOG and this gallery. Original Adventurer and synced shared files untouched.

Play: http://127.0.0.1:8742/index.html?revision=combat-roster-20261002
Review: http://127.0.0.1:8742/docs/art/combat-roster-20261002/
