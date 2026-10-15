# Chapters 6–14 enemy art — October 14, 2026

## Delivery

The remaining 37 campaign opponents now have registered combat artwork. Campaign coverage increased from **22/59 to 59/59 identities**. This completes the enemy-art assignment; it does not certify chapters 6–14 as release-ready.

Review: [all 37 actors and their moves](STORY_LATE_ART_REVIEW.html). Select an opponent, then inspect ordinary attacks and both sides of its finishers. The review runs independently of campaign unlocks.

- Each new identity has 24 ordinary drawings: idle 4, approach 4, attack 8, hit 4, down 4.
- Each has two Hiro-on-enemy finishers and one enemy-on-Hiro finisher: **111 paired clips, 16 distinct drawings per clip**, with authored contact/release markers and 2,190 ms base timelines before cinematic scaling.
- Fixed body references, transparent extraction, ground anchors and ownership masks prevent crowd-dependent shrinking, neighboring-pose bleed and disappearing bodies. Large paired poses use wider source sheets. Targeted replacement drawings repaired clipped weapons, missing bodies and a doubled Hiro; source masters were retained.
- Thornwise, Nettle, Amara and Kolade have nonlethal Hiro endings where needed to preserve the campaign's survival/escape choices. A displayed finisher must not silently rewrite a story outcome.
- All 37 newly registered sets have zero extraction boundary warnings. This is a technical check, not a substitute for the player's aesthetic approval.

## Projectiles and casting

Six painted atlases add 24 four-frame effects: nature, frost, weapons, occult, fire and storm. Together with the existing chapter-one art and explicit aliases, the catalog covers all 37 ranged/ward/summon skill IDs found across the campaign and its encounter variants. Wards and seals appear at their recipient; arrows, breaths and bolts travel. No additional damage or status powers were introduced.

Cast release frames and normalized hand/staff/mouth anchors are stored in `tools/story_cast_anchors.json`. The reused bandit archer now releases from its bow frame. Counter sends the same painted projectile back toward the attacker; it retains the other session's two-block cap and reflected damage. Effects honor pause, hit-stop, time scale and scene shutdown. An already-loaded chapter-one atlas no longer causes preload to skip later groups.

## Verification completed

- `npm test` and `npm run test:ship`: passed.
- `test/story_campaign.js`, `story_combat.js`, `story_readability.js`: passed, including 55 main encounters and three alternate encounter branches.
- `test/story_late_art.js`: all 59 bindings present; 37 new actors, 111 pairs, 16 unique source drawings per pair, texture existence, anchors and nonlethal flags checked.
- `test/browser_story_late_art.js`: all 37 new opponents loaded in the real renderer. Both Hiro pairs and each actual lethal-DOT enemy finisher presented all 16 frames and restored the normal actor. The Umbral Hand branch is tested with its authored betrayal flag.
- `test/browser_story_projectiles.js`: release-point playback passed for Malvane, Grell, Kessa, Idris, Jarem, Altar Keepers, Wyvern Matriarch and Silksa. Captures are in `test/reports/story-projectiles/`.
- `test/story_effects_lifecycle.js` and `test/actor_animation_lifecycle.js`: painted reflection, impact ordering, pause/resume and cleanup passed.
- `test/browser_story_fight.js`: existing opening pairs, lethal-DOT defeat, camera restoration, retry and save isolation passed.
- `test/browser_story_preview.js`: actual tutorial clicks, chapter progress/reload, original audio requests and 375/390-pixel mobile layouts passed. The test now uses a fixed combat seed and presses available skills between tutorial prompts, including Iaido Draw; it does not weaken production combat to make the test pass.
- Full 12-seed balance sweep: no unwinnable encounters and no stalls. This art pass leaves the previous session's damage tuning intact. Some later fights remain difficult: chapter 7 encounter index 3 won 1/12; chapter 9 indices 0/1 and chapter 13 index 3 won 3/12. These are simulation samples, not a claim of final player difficulty approval.

Repeat the focused art gate with `npm run test:story-late-art`. Browser reports and screenshots are local test outputs; a compact evidence snapshot is retained under `docs/art/story-late-provenance/`.

## Follow-up (supersedes the remaining-work snapshot below)

Ground plates, late solo balance and chapter progression are handled in [the chapter-completion report](CHAPTERS_6_14_QA_20261014.md). The following records the state at the end of the earlier enemy-art pass. Website limits are now chapter one free and two through five password-gated; the site is independent of local chapter unlocks.

## Historical remaining work at the end of the art pass

The local playable cap stays **chapter 5**. The existing website packaging cap stays **chapter 2**. Nothing was published or exported to CrazyGames.

The late-chapter lineup captures expose separate environment work: the wyvern nest places Hiro over a cliff, the sewer needs a bank/platform rather than water under the fighters, and the consortium office needs a combat ground plane instead of furniture at foot level. Other later backgrounds need the same scene-by-scene review. Full later-chapter dialogue/choice/progression playthroughs and final difficulty approval are also outstanding. These issues do not require regenerating the completed enemy sheets.

## Files, source and rebuilds

- Packed runtime: `assets/expedition/story_<identity>/` and `assets/expedition/adult/story_<identity>-fatal/`.
- Review pages and packed copies: `docs/art/story-<identity>/`.
- Runtime routing: `js/expedition/story_art.js`, `story_effects.js`, and painted Counter reflection in `beats.js`.
- Builders: `tools/build_story_actor.py`, `build_story_nib.py`, `build_citadel_combat.py`, `build_story_late_effects.py`.
- PNG masters, exact generation requests, references, extraction configurations and repair receipts: `../adventurer-expeditions-source-art/astra-v8/story-enemies/`.
- A small copy of generation/configuration records lives in `docs/art/story-late-provenance/`; the large source PNGs remain outside this Git repository and need their own backup. The runtime commit does back up the packed derivatives.

The added runtime actor/fatal files total approximately **342.74 MB**, plus **4.625 MB** for six effect atlases and metadata. This is the requested local high-detail art pass, not a mobile-portal-sized package. Actors load for the current encounter; the painted effect groups currently preload for story battles. No shared original-game files, published website files, Counter balance or Iaido Draw powers were changed.
