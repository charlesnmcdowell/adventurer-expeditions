# Campaign adaptation — production tracker

Updated 14 October 2026. The complete local campaign is ready for player review; see `CHAPTERS_6_14_QA_20261014.md` for the evidence and remaining scope. The live registration checklist is [STORY_CAMPAIGN_STATUS.md](STORY_CAMPAIGN_STATUS.md), regenerated with `node tools/story_status.js`.

### October 14 chapters 6–14 — current

All **59/59 identities** are registered and the local title now opens chapters **1–14**. The chosen later route’s 37 fought encounters, chapter inns, retries and final restore ending were exercised in the browser; alternative mercy/ascension routes were also checked in simulation. Ten new combat paintings provide appropriate ground at cliffs, sewers and later interiors. All 21 later battle locations and 12 affected original dialogue paintings passed environment checks. Four late party-sized encounters received enemy-HP reductions only; the existing damage, Counter and Iaido Draw changes remain. Original story, voices and music are reused. No duplicate enemy-art generation or new voice recording was needed. See the chapter-completion report for the browser harness correction and exact coverage.

The website remains separately packaged: chapter one free, two through five password-gated. No publication by this pass.

### October 13 chapter-five completion — historical

Chapter five, The Bandit Camp, is playable locally. **22/59 identities registered; 37 remain.** New Skarn, Hobgoblin Sergeant, Road Bandit and Gorruk sets complete its roster alongside existing Femi, Gauntlet Soldier, archer and hired knife. All four actual main-route fights passed; quiet entry and both Itsuki/Gorruk choices passed, with both prisoner/letters rescue orders covered. Original story/media remain unchanged. Every new pair has sixteen distinct drawings and passed actual battle lifecycle checks. The patrol Close Order badge crash is fixed locally. Chapter-four inn continues to chapter five; chapter-five inn reaches the chapter-six coming-soon card, retaining progress through reload. The public demo remains chapter one. No publishing. See `CHAPTER_FIVE_ART_QA.md` and the October 13 changelog for evidence and source masters.

This chapter-five snapshot is superseded by the October 14 late-chapter completion notes. Earlier progress paragraphs below are historical snapshots.

### October 12 inn and demo verification

Current registration is 18/59 identities. Chapters 1–4 passed their 13 actual main-route fights, original dialogue/choices, rewards, checkpoint handling and reload. Chapter 4 already has its required mine art and fights; no duplicate production was needed. The normal local entry opens the story with four chapters enabled. Chapter returns now visit the existing animated inn with health carried: Rest pays 1,000 points initially (doubling each use) and opens the corrected animated bathhouse, or Continue story leaves immediately. Retry still restores full health. Save migration, rest/reload without duplicate payment, insufficient points, repeat visits, pause and phone layout have browser coverage. Older statements below describing automatic chapter healing or default Arcade boot are historical.

The public website demo is independently capped after chapter one. `tools/site_demo.js build`, then `verify`, then `stage <website-checkout>` stages only the exact hash-verified files. The public copy includes the inn and bathhouse but excludes chapter-two and later story media/art. Chapters 5–14, their remaining 41 opponent identities, later balance and optional supplemental encounters remain production work.

### October 11 continuation

The main route through chapters 1–3 passed nine real battles, original choices/scenes, rewards and reload into chapter four with zero retries and no page errors. All eleven opponent identities for these chapters are now registered, including Snarl and the alternate Bahadır set. Bahadır has two explicitly nonlethal Hiro disarms and one lethal enemy pair; his source survival outcome takes precedence over lethal imagery. His recovery strip was replaced after visual review caught connected poses causing missing/duplicate Hiro figures. The optional branch has separate browser coverage; see the dated changelog for its final result.

The original import was regenerated unchanged: 14 chapters, 55 encounter slots, 59 identities, 974 media files. Sparing Nib now has a dedicated real-browser tutorial/defeat/reload/retry check. Story survivors no longer receive ordinary defeat knockback. The physics-owned modules remain unchanged. Tunnel Kobold and Kobold Shaman are also registered and have passed actual multi-enemy finisher playback: 17/59 identities, 42 remain. Femi now has a verified full combat set and three sixteen-drawing pairs; the rest of chapter five remains gated. The local launcher opens the four-chapter story preview; direct index.html remains Arcade. Chapter five onward still needs complete art and chapter playthroughs.

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

## Remaining work after the local chapter-completion pass

1. Player review of the complete local campaign: narrative pacing, solo difficulty and the new ground paintings. Automated outcomes are evidence, not aesthetic approval.
2. Optional supplemental encounters from the five Arcade locations. These are not inserted yet; each needs a story reason and appropriate travel placement rather than interrupting the original campaign arbitrarily.
3. Separately plan website expansion if requested. The current package remains chapter one free and chapters two through five password-gated. Its hosting headroom must be addressed before adding the much larger later enemy-art set.
4. Portal-specific content/performance review and a separate export if requested. No new CrazyGames export, submission or publication is part of this local update.

Earlier production paragraphs below are historical snapshots. Current chapter evidence belongs in `CHAPTERS_6_14_QA_20261014.md` and the dated changelog.

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
