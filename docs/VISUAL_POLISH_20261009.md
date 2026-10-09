# October 9 visual polish — local playtest

Open `http://127.0.0.1:8742/index.html?revision=visual-polish-20261009`.
Use the developer cog → Preview a location → Shipwreck Coast / Arcane Citadel for quick visits. Normal progression still runs Forest → Swamp → City → Coast → Citadel.

## What to look for

- The dark swordswoman watches Hiro in idle and returns to that stance after an attack.
- New Hiro finishers have readable anticipation, contact and follow-through; 19 added poses bridge selected large gaps. Crab crouch now precedes the leap. Hydra remains five-headed.
- Elf and orc finishing hits bleed at the sword contact. Local humanoid impacts are stylized blood/gore, not a new anatomical dismemberment system. Paired art stays at its authored body scale.
- Coast: Hiro launches a glider, crosses the gap and lands. Citadel: a portal entrance/exit replaces the old jump. Both journeys retain full-speed run-in/out and return him to the center.
- Citadel foreground tree is gone. City foreground mountains no longer incorrectly cover the distant castle. Low rooftop foreground and the bird stay clear of Hiro.
- Distant scenery, contact ground and near scenery remain separate through every travel action. Clouds move; painted lights flicker. Battles keep fixed ground under the actors.

`FINISHER_REVIEW.html` has been rebuilt with current timing/frames and still lists 51 active clips. Its raw-sheet viewer does not draw the runtime blood overlay; inspect that in the game. Existing removed moves have not been restored.

## Verification and limits

Automated simulation, animation lifecycle and ship gate passed. Browser tests exercised sixteen expansion Hiro pairs, ten retained older pairs, all eighteen enemy-on-Hiro defeats, six travel scenes, seven battle settings, and a complete Coast/Citadel journey at 390 CSS pixels. Normal-speed recordings and registration strips are under `test/reports/polish` and `test/reports/v3`. Browser evidence uses Chrome/Canvas and emulated widths, not physical phones.

Runtime is approximately 103.23 MB against the authorized 250 MB local budget. Cold startup through audio unlock measured 23.67 MB; the old 20 MB portal-size test therefore reports a failure. There were no other startup findings. No new CrazyGames package was made.

## Sources and safe rebuild order

Original masters remain intact. This pass used built-in imagegen for new painted poses/plates and technical extraction, registration and packing for intake. Complete prompts/references and generated masters are in `../adventurer-expeditions-source-art/astra-v6/polish-20261009/prompts.json`.

1. `tools/build_citadel_combat.py` mirrors only the six identified dark-swordswoman ordinary poses, after extracting the original sheet. Do not mirror paired finishers.
2. `tools/build_pair_polish.py` reuses ordinary and paired masters, inserts selected bridge poses, remaps contact/release indices, and marks authored timings to survive `Painted.sheet`. Hydra bridge 0 is deliberately excluded because it has an extra head. Do not bulk-run the older expansion builder afterward: it would restore old timing/art.
3. `tools/build_travel_polish.py` packs the new 12-pose travel actions and their plates. `tools/register_travel_layers.py` registers four older alpha plates against baseline `5a127ed`; this is a scoped historical repair, not a blanket tool for future repainted travel art. It requires OpenCV in addition to Pillow/NumPy.
4. `tools/build_light_anchors.py` refreshes the measured lamp/window positions if those plates change. Blood contact points are measured registered-canvas offsets in `gore_fx.js`; update them if paired composition or pivot changes.
5. Rebuild the finisher review, stamp scripts, run tests and inspect actual playback. New source art does not ship; packed derivatives do.

The existing local edition has bloody elf follow-through art in its common atlases. A future restricted-site export must deliberately select approved non-bloody art; merely disabling the separate blood overlay is insufficient. This pass did not alter or republish the previously submitted build.
