# Campaign adaptation — production tracker

Updated 11 October 2026. This is an unfinished expansion, not a release candidate. The live registration checklist is [STORY_CAMPAIGN_STATUS.md](STORY_CAMPAIGN_STATUS.md), regenerated with `node tools/story_status.js`.

### October 11 continuation

The main route through chapters 1–3 passed nine real battles, original choices/scenes, rewards and reload into chapter four with zero retries and no page errors. All eleven opponent identities for these chapters are now registered, including Snarl and the alternate Bahadır set. Bahadır has two explicitly nonlethal Hiro disarms and one lethal enemy pair; his source survival outcome takes precedence over lethal imagery. His recovery strip was replaced after visual review caught connected poses causing missing/duplicate Hiro figures. The optional branch has separate browser coverage; see the dated changelog for its final result.

The original import was regenerated unchanged: 14 chapters, 55 encounter slots, 59 identities, 974 media files. Sparing Nib now has a dedicated real-browser tutorial/defeat/reload/retry check. Story survivors no longer receive ordinary defeat knockback. The physics-owned modules remain unchanged. Tunnel Kobold and Kobold Shaman are also registered and have passed actual multi-enemy finisher playback: 13/59 identities, 46 remain. The local launcher opens the three-chapter story preview; direct index.html remains Arcade. Chapter four onward still needs complete art and chapter playthroughs.

## Implemented this pass

- Citadel portal replacement: twelve distinct drawings, planted casting, folded legs in transit, landing and run recovery. Registered and intaken; fast running before/after, original scenery and effects retained. Review: `ART_REVIEW.html#T-CITADEL-JOURNEY`.
- Deterministic read-only original-campaign importer and media/hash inventory. 14 chapters, 55 encounter slots, 59 combat identities including branching opponents, 840 locally available recorded lines, 21 locally available music tracks. No ElevenLabs generation was necessary.
- Edition-owned story adapter reuses the existing, source-identical `ADV.Campaign3` and `ADV.GateFinale` functions. It does not flatten branching dialogue, discard their late-game history hooks, or replace the original core files.
- Independent save `adventurer_expeditions_story_v1`; only a marked story world is intercepted by the save adapter. Arcade and original `adv:*` saves are unaffected.
- Pre-fight checkpoint, retry, completed chapters, actual encounter outcomes, first-real-fight tutorial marker and explicit empty combat-allies list. The source story company remains available to dialogue conditions.
- Separate development title/prologue/choice preview, with original Lanternhold music and recordings. Chapters 1–2 now pass a complete browser playthrough through all six actual battles. Lurleen's chapter-three opener is registered too. Later unready fights stop explicitly. Default `index.html` remains the existing playable Arcade; the new main campaign boot awaits finished combat content.
- Nib's 36 ordinary combat drawings and three 16-drawing paired finishers are registered and intaken (84 total). The browser verifies both Hiro pairs, lethal-DOT enemy finisher, camera reset and retry. Raw review is at `docs/art/story-nib/`.
- All 974 original media files copied and hash-verified in edition-owned storage, with original scene/still and chapter/combat music routing. Source skills and identity mapping verified across 55 encounter slots and three branch variants. Later fights still require their own art and solo balance.
- Cobb, Hired Knife, Consortium Mage, Merle and Lurleen now have full combat and three 16-drawing pairs apiece. Road Wolf reuses the approved gray wolf and its Hiro-owned pairs. Actual multi-enemy browser checks cover both Hiro variants, lethal-DOT enemy finishers, all frames, native-atlas restoration and zoom reset. Lurleen's backward lunge and Merle's touching atlas cells were repaired before intake. Lurleen's translucent ordinary-sheet matte has an explicit, reproducible alpha correction preserving the high-alpha silhouette.
- Original speaker portraits, chapter-specific paintings and authored fire/water/cloth/weather layers are wired to the development story renderer. Title and dialogue use a separate animated backdrop canvas that sleeps during combat. All seven ending branches use their original text and Tesfaye narration; browser checks include mobile layout and returning to title.
- Campaign gifts and acknowledged notifications now survive save/reload. Chapter payouts are awarded once, chapter returns recover health, and retry restores full health while retaining completed chapters and reverting current-fight choices to the checkpoint. No new dialogue recording was needed.
- Sealed skills now report unavailable to manual requests and the tutorial; Hiro falls back to Basic Attack instead of losing every turn to an engine-rejected cast. The simulation audit now exercises between-turn casts, matching the browser rather than replacing Hiro's normal attacks with buttons.

## Binding art requirements

- Humanoid finishers contain gore in BOTH directions: Hiro against the enemy, and enemy against Hiro.
- Double the planned number of distinct drawings. Minimum 16 per new humanoid move; a planned 12-frame clip requires 24. Repeated images, interpolated holds and playback slowdowns do not count as additional drawings.
- Intake readiness rejects missing/invalid frame counts and missing gore confirmation. These declarations still require visual frame-by-frame review; a number in a manifest is not proof of animation quality.
- At least two matching Hiro pairs and one enemy-on-Hiro pair for every campaign enemy identity. Every pair must preserve both identities, relative body scale and hand/weapon contact through impact and recovery.
- Use the approved sprite-cleanup pilot: inspect neighboring-cell bleed, alpha/mattes, foot anchors, fixed anatomical scale, distinct poses, correct facing, complete visible bodies and final-state continuity before runtime intake.
- Escaping/spared named opponents keep the source's survival outcome. A lethal dismemberment cannot run before later dialogue with that same character. The adapter retains `noEscape` choice overrides; final combat integration must respect them.
- Local edition; do not export this material as a restricted-site build. Do not edit the original `adventurer` or any synced shared source file.

## Next work, in dependency order

1. Continue chapter four: Tunnel Kobold and Kobold Shaman are intaken and battle-tested. Kobold Chief is in source production; Acolyte of Veylan and Grukhar remain. Chapter three's main and alternate-branch playthroughs passed. The public development preview still ends after chapter three; later unready fights stay gated.
2. Extend actual chapter playthrough coverage beyond chapter two as art becomes available. Verify first-fight tutorial when Nib is spared and later irreversible events; unit coverage alone is not a completed browser campaign.
3. Audit every original scene transition and travel beat in context. Original scene selection, portraits, ending cards and ambience are wired, but all fourteen chapters have not been visually played through.
4. Tune later solo encounters with the corrected between-turn casting audit and actual browser play. A winning seed is a minimum gate, not a satisfactory difficulty curve. The weakest late-game win rates still need attention.
5. Build remaining enemy sets by chapter using `STORY_CAMPAIGN_INVENTORY.md`. Review shared creature reuse individually; original portraits are references, not finished combat animation. Do not interpret 59 identity entries as 59 newly approved art sets.
6. Adapt original locations to grounded side-view combat; preserve distance → animated scenery/weather → character/contact ground, no foreground obstruction. Keep indoor weather appropriate. Reuse original music per chapter and named battle cues.
7. Add optional, geographically coherent extra encounters from the existing five locations. In particular, friendly Lanternhold must not randomly attack Hiro with Citadel elves without a story reason. Write/voice connective lines only where necessary; do not rewrite recorded campaign dialogue.
8. Add chapter progression/balance, original perk unlocks adapted to this engine, full branching QA and every enemy's lethal/DOT finisher routing. Test reload and defeat before/after irreversible story beats.
9. Enable the new title/main-campaign boot only when the required chapter content is ready. Preserve Arcade as a separate choice/save. Update ship packaging for the new assets and measure lazy loading; no portal upload/publishing has happened.

## Source masters and rebuilds

- Source: sibling `adventurer-expeditions-source-art/astra-v8/portal-story-20261009` and `astra-v8/story-enemies/`. Built-in image_gen; prompts/references retained per request. No original art masters overwritten.
- `python tools/build_portal_v8.py`
- `node tools/import_story_campaign.js`
- `node tools/build_story_preview.js`
- `node tools/build_art_review.js`
- `npm run test:story`
- `STORY_CHAPTERS=3 node test/browser_story_chapters.js` (actual first three chapters; set environment variables using your shell)
- `node test/browser_story_spared.js` (spared Nib, guide at Cobb, defeat/reload/retry)
- `node test/browser_story_roster.js` (actual registered actors and defeat routing)
- `node test/browser_story_endings.js`
- `node test/story_balance.js --gate` (55 slots, fixture art only; never enables unfinished opponents)

## Verification so far

Baseline and post-change `npm test` and `npm run test:ship` passed. `node test/browser_v3_art.js --expansion --travel-only` passed the Coast/Citadel travel paths; that command skips combat despite its generic final log message. Actual portal casting frame inspected in the browser screenshot. Story unit tests cover original text equality, local media existence, ask-and-return choices, peaceful bypass, art readiness, solo roster, independent save namespace, retry and the soul-taking/restore branches. Story browser QA covers the title, original opening voice/music requests, questions/replies, stopping before unfinished combat, reload/continue and 1280/375/390 layouts with no page errors. These checks do not certify the full 14-chapter adaptation.
