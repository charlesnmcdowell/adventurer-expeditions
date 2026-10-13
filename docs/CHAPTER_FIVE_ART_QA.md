# Chapter five — The Bandit Camp

Completed locally on 13 October 2026. Ready for player review; not published.

## Art delivered

| Actor | Ordinary drawings | Hiro pairs | Enemy pair | Review |
|---|---:|---:|---:|---|
| Skarn | 24 | 2 × 16 | 16 | [Animation review](art/story-skarn/index.html) |
| Hobgoblin Sergeant | 24 | 2 × 16 | 16 | [Animation review](art/story-hob-sergeant/index.html) |
| Road Bandit | 24 | 2 × 16 | 16 | [Animation review](art/story-road-bandit/index.html) |
| Gorruk | 28, including separate cast | 2 × 16 | 16 | [Animation review](art/story-gorruk/index.html) |

Femi, Gauntlet Soldier, archer and hired knife already had complete registered sets and were reused. No new voices or music were generated. Existing chapter paintings and recordings are retained.

Source masters, registration guides and exact generation prompts are in:

`C:/Users/charl/The Sorcerer Sword ARPG/adventurer-expeditions-source-art/astra-v8/story-enemies/`

The generation record is `chapter5-generation-20261013.json` (22 requests). Actor subfolders are `skarn`, `hob-sergeant`, `road-bandit` and `gorruk`. The hobgoblin set and Skarn/Road Bandit ordinary sheets were reused. Source masters are outside this runtime Git repository; the runtime atlases, manifests and review pages are inside it.

Rebuild one actor with `python tools/build_story_actor.py <slug> --intake`. Review before using intake after any source edit. The optional `cast` registration retains a separately authored release gesture; Gorruk releases on zero-based frame 2, from the measured palm anchor.

## Corrections made during review

- Replaced two clipped raised-weapon poses with full uncropped drawings.
- Assigned Skarn's fallen recovery body to the correct cell. His body now stays visible in frame 11 instead of appearing in the following row.
- Kept fixed anatomical reference heights across each paired sequence; no per-frame fit-to-box scaling.
- Inspected all twelve pairs' contact sheets, transparent backgrounds, contact/recovery frames and actual multi-enemy battle playback.
- Gorruk's two Hiro moves are nonlethal disarms. A source branch may keep him alive; dismemberment would contradict his later dialogue. The original Itsuki choice still controls his survival.
- Normalized the Gauntlet's nested Close Order status in the edition-owned adapter and hardened the HUD against unnamed/null statuses. Original data and shared code were not changed.

## Verification

All checks below passed after the changes:

- `npm test`, `npm run test:story`, `npm run test:ship`.
- `node test/story_balance.js --gate`: all 55 encounter floors passed, no stalls. Chapter-five results over 20 seeds: Femi 16 wins, patrol 20, palisade 20, Gorruk 20. No numeric balance changes were made. Later chapters still need production/balance work.
- `node test/browser_story_art.js <slug>` for all four sets: all clips load, each pair has sixteen drawings; contact and final-frame captures saved.
- `STORY_ACTORS` limited to the four new actors with `node test/browser_story_roster.js`: both Hiro pairs and lethal-DOT enemy finishers played all frames; other enemies stayed visible, native atlases returned, camera reset.
- `node test/browser_story_readability.js`: Gorruk's palm launch, bolt travel/impact/pause/recovery and the Gauntlet's Close Order badge passed, along with the earlier caster checks.
- `STORY_FROM=5 STORY_CHAPTERS=5 node test/browser_story_chapters.js`: four actual battles passed from the verified chapter-four save, with no retries.
- The same test with `STORY_BRANCH=camp-quiet` covers bypassing the first three battles and recovering the letters before the prisoner. `camp-quiet-shoot` and `camp-quiet-hold` seat the already-recruited Itsuki at the inn, then exercise his actual choice and verify Gorruk's death/survival and Itsuki's departure flags.
- `node test/browser_story_chapter_five.js`: default five-chapter title, chapter-four inn continuation, chapter-five inn, chapter-six gate and reload, with no missing requests or page errors.

Reports and screenshots are under `test/reports/` (local QA output, ignored by Git). Chapter playthrough reports are in `story-chapters-5`, `story-chapters-5-camp-quiet`, `story-chapters-5-camp-quiet-shoot` and `story-chapters-5-camp-quiet-hold`.

`sync:check` reports two existing differences, `play_local.js` and `js/ui/gate_ambience.js`. Both match this session's starting commit and were left alone; this is not reported as a passing sync gate.

## Scope and next step

Local limit is five chapters; the separate website packager still limits its demo to chapter one. No export, website staging or publishing was performed. Chapters 6–14 remain unfinished; 22 of 59 combat identities are registered. Continue chapter six only after checking its inventory and existing art.
