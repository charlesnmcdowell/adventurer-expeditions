# Release polish and submission candidate — September 27, 2026

## Playtest changes

September 27 follow-up: all travel now lasts 7.67 seconds including its transition hold, with at least three seconds of running before and after the obstacle action. Uses the existing sixteen-frame run; no additional image downloads.

- Alpha paired finishers: 665–780 ms became 1,400–1,620 ms of authored playback. Browser measurements including approach were about 1.93–2.15 seconds. Anticipation, contact and recovery receive longer holds; attack contact indices, release indices and artwork remain intact.
- Fourteen later-monster finishers: 770 ms became 1,420 ms. Ordinary attacks, global combat speed and the disabled cinematic camera setting remain as configured. This pass retimes the existing frames; it does not claim additional in-between paintings were created.
- Mountain and city battle paintings now have continuous horizontal ground at the fighters' feet. The shrine, mountains and city architecture retain the established finish. Edition-owned stage rendering preserves the quest weather and adds distant mountain haze. The source/shared backgrounds are untouched.
- Bram sits with Hiro after odd-numbered completed quests. Even-numbered returns use the solo painting. Selection is stable through reloads and never changes the roster, skills or recruitment lock.

Source masters and exact built-in image_gen prompts/references: `../adventurer-expeditions-source-art/astra-v3/release-polish/`. Runtime: `assets/expedition/stages/`. Rebuild using `python tools/build_battle_stages.py`. Finisher pacing lives in `js/expedition/painted.js`, so rebuilding the source atlases cannot discard the pacing adjustment.

## Verification

- Unit/simulation suite, including camera restoration, animation interruption and saved progression.
- New pacing contract covers all 17 adjusted finishers and asserts unchanged contact/release markers and untouched cached source metadata.
- Browser v3 test: all 14 new pairs, all seven new monsters and all four travel beats.
- Focused browser test: mountain/city stages, all three Alpha finishers, guest/solo inn at 1280 and 390 px widths, locked recruitment.
- Full three-location ship-allowlist journey and frozen candidate first-quest smoke test. Evidence: `test/reports/expedition/` and `test/reports/release-candidate/`.
- Cold-cache SDK-stub test, with an additional 1,800 ms scenery delay, across desktop and emulated portrait/landscape mobile. Gameplay event waited for visible scenery. Approximately 13.59 MB at gameplay start; 14.64 MB through the first action/audio unlock. Evidence: `test/reports/release-startup/`.

These are local Chromium measurements, not physical Safari/Android or CrazyGames hosting certification. Artificial scenery delay checks readiness, not real bandwidth throttling.

## Frozen upload candidate

Folder: `dist/crazygames-20260927-travel/`.

255 verified files, approximately 38.80 MB total. `index.html` is at its root. The separate adjacent manifest records every file's SHA-256. Upload the folder's **contents**, not a ZIP; keep the verification manifest outside the upload.

`npm run package:crazygames` creates a new candidate without changing the local game. It freezes the allowlisted source, rejects concurrent source changes, and verifies written bytes. Only inside the candidate it disables developer tools, enables the CrazyGames release policy and disables the developer inn-entry shortcut. Existing candidates are never overwritten.

The candidate passes the local release gate (using `EXPEDITIONS_TEST_ROOT` pointed at that folder). The working tree deliberately keeps developer tools for playtesting and is not itself the upload folder. Packaging is not a deployment or submission.

## Remaining before submission

1. Hiro approves the new pacing and footing in-game.
2. Test the uploaded preview: real SDK initialization and events, audio after backgrounding, save/reload, touch controls on an actual phone, and loading on a slower connection.
3. Confirm store images/video match this Expeditions game and current gameplay. This pass did not recreate store media.
4. CrazyGames performs its own content/quality review; passing local technical checks does not promise acceptance.

Current technical requirements permit 250 MB total / 1,500 files and require at most 20 MB initial loading for mobile-homepage eligibility with appropriate SDK event timing. Without SDK integration, total size is used. Sources checked September 27: https://docs.crazygames.com/requirements/technical/ and https://docs.crazygames.com/requirements/gameplay/ .

The earlier GDD ideas to remove skill levels, redesign God Aura and add a bespoke Part 2 ending remain deferred design work, not changes made in this polish pass. The playable loop currently returns to the inn after the city.
