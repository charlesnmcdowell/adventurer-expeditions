# Campaign adaptation — production tracker

Updated 9 October 2026. This is an unfinished expansion, not a release candidate.

## Implemented this pass

- Citadel portal replacement: twelve distinct drawings, planted casting, folded legs in transit, landing and run recovery. Registered and intaken; fast running before/after, original scenery and effects retained. Review: `ART_REVIEW.html#T-CITADEL-JOURNEY`.
- Deterministic read-only original-campaign importer and media/hash inventory. 14 chapters, 55 encounter slots, 59 combat identities including branching opponents, 840 locally available recorded lines, 21 locally available music tracks. No ElevenLabs generation was necessary.
- Edition-owned story adapter reuses the existing, source-identical `ADV.Campaign3` and `ADV.GateFinale` functions. It does not flatten branching dialogue, discard their late-game history hooks, or replace the original core files.
- Independent save `adventurer_expeditions_story_v1`; only a marked story world is intercepted by the save adapter. Arcade and original `adv:*` saves are unaffected.
- Pre-fight checkpoint, retry, completed chapters, actual encounter outcomes, first-real-fight tutorial marker and explicit empty combat-allies list. The source story company remains available to dialogue conditions.
- Separate development title/prologue/choice preview, with original Lanternhold music and recordings. Nib's first fight is now playable; later unready fights still stop explicitly. Default `index.html` remains the existing playable Arcade; the new main campaign boot awaits finished combat content.
- Nib's 36 ordinary combat drawings and three 16-drawing paired finishers are registered and intaken (84 total). The browser verifies both Hiro pairs, lethal-DOT enemy finisher, camera reset and retry. Raw review is at `docs/art/story-nib/`.
- All 974 original media files copied and hash-verified in edition-owned storage, with original scene/still and chapter/combat music routing. Source skills and identity mapping verified across 55 encounter slots and three branch variants. Later fights still require their own art and solo balance.

## Binding art requirements

- Humanoid finishers contain gore in BOTH directions: Hiro against the enemy, and enemy against Hiro.
- Double the planned number of distinct drawings. Minimum 16 per new humanoid move; a planned 12-frame clip requires 24. Repeated images, interpolated holds and playback slowdowns do not count as additional drawings.
- Intake readiness rejects missing/invalid frame counts and missing gore confirmation. These declarations still require visual frame-by-frame review; a number in a manifest is not proof of animation quality.
- At least two matching Hiro pairs and one enemy-on-Hiro pair for every campaign enemy identity. Every pair must preserve both identities, relative body scale and hand/weapon contact through impact and recovery.
- Use the approved sprite-cleanup pilot: inspect neighboring-cell bleed, alpha/mattes, foot anchors, fixed anatomical scale, distinct poses, correct facing, complete visible bodies and final-state continuity before runtime intake.
- Escaping/spared named opponents keep the source's survival outcome. A lethal dismemberment cannot run before later dialogue with that same character. The adapter retains `noEscape` choice overrides; final combat integration must respect them.
- Local edition; do not export this material as a restricted-site build. Do not edit the original `adventurer` or any synced shared source file.

## Next work, in dependency order

1. Nib first-fight art/intake and tutorial/return/retry flow are complete for development playtest. Keep the rejected early pair drafts out of runtime. Continue Cobb's ordinary/pair sets; first approach draft is held for repeated leg poses.
2. Finish the other prologue opponents (Cobb, Hired Knife, Consortium Mage). Bind their source skills to the Expeditions simulation with solo-Hiro balance, correct name/art and explicit art-readiness checks. No portrait or unrelated-enemy fallback.
3. First battle tutorial, dialogue → combat → dialogue, victory history and defeat-finisher → retry are browser-tested. Extend those checks to multi-opponent fights, peaceful bypass of the first encounter, chapter transitions and later irreversible events as their art becomes available.
4. Complete original character/cutscene presentation. The preview currently demonstrates dialogue/choices over the opening setting; it is not the complete original scene renderer. Preserve letter-reading, father death, prison, dreams, mine outcomes, Hiwot's soul event and both finale choices.
5. Build remaining enemy sets by chapter using `STORY_CAMPAIGN_INVENTORY.md`. Review shared creature reuse individually; original portraits are references, not finished combat animation. Do not interpret 59 identity entries as 59 newly approved art sets.
6. Adapt original locations to grounded side-view combat; preserve distance → animated scenery/weather → character/contact ground, no foreground obstruction. Keep indoor weather appropriate. Reuse original music per chapter and named battle cues.
7. Add optional, geographically coherent extra encounters from the existing five locations. In particular, friendly Lanternhold must not randomly attack Hiro with Citadel elves without a story reason. Write/voice connective lines only where necessary; do not rewrite recorded campaign dialogue.
8. Add chapter progression/balance, original perk unlocks adapted to this engine, full branching QA and every enemy's lethal/DOT finisher routing. Test reload and defeat before/after irreversible story beats.
9. Enable the new title/main-campaign boot only when the required chapter content is ready. Preserve Arcade as a separate choice/save. Update ship packaging for the new assets and measure lazy loading; no portal upload/publishing has happened.

## Source masters and rebuilds

- Source: sibling `adventurer-expeditions-source-art/astra-v8/portal-story-20261009` and `astra-v8/story-enemies/nib`. Built-in image_gen; prompts/references retained per request. No original art masters overwritten.
- `python tools/build_portal_v8.py`
- `node tools/import_story_campaign.js`
- `node tools/build_story_preview.js`
- `node tools/build_art_review.js`
- `npm run test:story`

## Verification so far

Baseline and post-change `npm test` and `npm run test:ship` passed. `node test/browser_v3_art.js --expansion --travel-only` passed the Coast/Citadel travel paths; that command skips combat despite its generic final log message. Actual portal casting frame inspected in the browser screenshot. Story unit tests cover original text equality, local media existence, ask-and-return choices, peaceful bypass, art readiness, solo roster, independent save namespace, retry and the soul-taking/restore branches. Story browser QA covers the title, original opening voice/music requests, questions/replies, stopping before unfinished combat, reload/continue and 1280/375/390 layouts with no page errors. These checks do not certify the full 14-chapter adaptation.
