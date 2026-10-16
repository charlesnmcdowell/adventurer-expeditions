Finish the companion feature in Adventurer: Expeditions so Hiro fights with up to two companions from chapter 2 (16 October 2026): a new join display, a party check before each chapter, the remaining companion art, then switch it on.

PROJECT AND RULES
- Project: C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions. Local work only: no publishing or pushing. Hiro publishes the website himself.
- The original game in C:\Users\charl\The Sorcerer Sword ARPG\adventurer is read-only, along with the synced shared files (js/core, js/data, js/ui).
- Read first:
  - the top of docs/CHANGELOG.md (all 2026-10-15/16 companion entries);
  - docs/COMPANION_PRODUCTION_PROGRESS_20261015.md;
  - docs/ASTRA_PROMPT_COMPANIONS_HIRO_VOICE_20261015.md (the original brief; still binding where this prompt doesn't change it);
  - docs/STORY_CAMPAIGN_PRODUCTION.md and the sprite-cleanup workflow.
- Keep working what you already built:
  - `story_companions.js` and `story_companion_ui.js`;
  - knockout, never finished, Hiro-only defeat;
  - the party picker and the four pilots (Hiwot, Desmond, Winston, Santiago);
  - Hiro's 200 voiced choices;
  - the companion move sounds and effects;
  - balance (two-companion fixture 1,021/1,100).
  Also keep working my systems: Counter (2 blocks, deflects projectiles), Iaido Draw (power 3.6), the per-opponent hit scale, Snarl's retaliation fix, the tutorial in the first two fights won, and the dev chapter jump.
- Player-facing text sounds casual and plain, not like AI. Hiro (the character) uses no "cyber" and no "purple" glows.

WHAT HIRO WANTS (his words, condensed)
"Cool portrait display of them popping up, sliding from the side, with a companion join jingle — like the little 'new player' sound — including their name in a stylised way that matches their personality, and the player accepts and it goes away. Then before every chapter, confirm the party members, and they fight alongside each other. The first companion should be his sister at the beginning of chapter 2."

1. FIRST COMPANION: HIWOT AT THE START OF CHAPTER 2
   - Hiwot (wren_ward) is recruited by the story at the end of chapter 1 (q1_join). Keep that story beat as it is. Chapter 1 stays solo.
   - **Hold her join display until chapter 2 begins**: after the inn and road trip, before chapter 2's first dialogue. Then go straight into the party check (2).
   - She's the first companion anyone sees, so her display has to be the best one. Use her as the template for all the others.
   - The other chapter 2 recruits (Desmond, Winston, Santiago, Beau, Delphine) get their display at the moment the story recruits them, followed by the party check whenever a slot could change.

2. THE JOIN DISPLAY (replaces today's 2.4-second auto-closing card in `story_companion_ui.js` `unlock()`)
   - **Portrait slides in from the side.** Their story portrait, large, from the left or right edge. Alternate sides or pick per companion. A quick ease-out with a small overshoot and settle, plus a light streak or banner behind them. It should feel like a fighting-game "new challenger" or a JRPG "joined the party" moment.
   - **A "new party member" jingle** as it lands: short, bright and melodic, about 2–3 seconds. The current 2.2-second "unpitched flourish" isn't enough. It should sound like a little "you got a new party member" fanfare, in key with the campaign music.
     - Compose it, or make it with ElevenLabs sound effects or music.
     - One shared jingle, or a short per-companion sting on top of one shared base. Your call.
     - It respects mute. Keep its volume under the dialogue.
   - **The name, styled to match the personality.** One display treatment per companion, not just a font swap: lettering, colour, texture and motion should all say who they are. Examples:
     - Hiwot: quick, scrappy, slightly crooked and lively;
     - Bahadır: huge and booming, maybe shaking;
     - Delphine: warm and solid;
     - Layla: cold and elegant.
     - Keep it readable at phone width.
     - Fonts must be web-safe or bundled with an open licence. List each font's licence.
     - No purple glow for Hiro-adjacent UI. Companions may use their own colours.
   - **A one-line hook under the name**, in their voice from their existing dialogue or a short new line, for example "Hiwot — I can pick locks. Let me come." Keep it plain.
   - **The player accepts and it goes away.** No auto-close. An "Accept" or "Welcome aboard" button, plus keyboard and tap, dismisses it with a slide-out. Then the party check, if one is due, else back to the story.
   - It shows once per companion per save and survives a reload. Today's `queueUnlocks` and `claimUnlock` already track this; keep that.
   - Reduced-motion users get a fade instead of the slide.
   - Test on desktop and 390×844.

3. PARTY CHECK BEFORE EVERY CHAPTER (`picker()` already exists)
   - Before every chapter from chapter 2 on, at the chapter start after the road trip and title card, show "Your party for this chapter":
     - Hiro;
     - the two chosen companions, with portrait, styled name, weapon and two signature moves;
     - "Change" and "Set out".
   - Default to the last pair. If a companion has left, died or betrayed, they drop out and the slot is offered to someone else.
   - Also open it right after a new companion's join display, so the player can bring them in at once.
   - Only offer companions with finished, registered art (readiness gate). A companion without art never appears in the picker.

4. FIGHTING TOGETHER
   - In every story fight from chapter 2 on, the two picked companions fight beside Hiro, using your existing party combat, knockout and signature-move system.
   - Make sure both are visible and don't overlap Hiro or the HUD at desktop and phone sizes.
   - Their barks play during fights (the dialogue rewrite in docs/ASTRA_PROMPT_COMPANION_DIALOGUE_20261016.md will add more; use what exists until then).

5. FINISH THE ART: 11 companion sets remain
   - Beau: idle/walk and attack drafts exist; Attack/Cleave were rejected for cropped or joined frames.
   - Delphine: an idle draft exists.
   - Unpainted: Itsuki, Bahadır, Yasemin, Devendra, Layla, Kaito, Wanjiru, Dai Morgan and Amara.
   - Use the approved weapons and signatures in the 2026-10-15 CHANGELOG table: eight groups each, at least 16 distinct drawings per move with the doubling rule, no finisher art.
   - **Order: Beau and Delphine first** (they join in chapter 2), then chapter 3's four, then Layla, Kaito, Wanjiru, Dai Morgan, Amara.
   - Fix the flagged Hiwot blade pixel and stride polish before marking the four pilots production-approved.
   - Feminine characters stay feminine and attractive; keep everyone on-model with their portrait.

6. SWITCH IT ON
   - Set `S.Companions.enabled = true` once every companion who can join through the website's playable chapters (chapters 1–6, and Hiro wants that range) has finished art.
   - Until then, gate by chapter. Companions on with only painted companions offered is fine for local play, but say clearly in the CHANGELOG what a player can and can't get.
   - Rerun `node test/story_balance.js --gate` with real party picks (the default pair per chapter), and report the win rates.
   - Update `tools/site_demo.js` so the website package includes companions who can join by its SITE_THROUGH, and add the join display, the party check and one party fight to its verify.
   - Report the package size. f4518b5 staged the demo on its own Pages site; say which site the numbers are for.

DONE MEANS
- A fresh save played in the browser through the end of chapter 1 into chapter 2:
  - Hiwot's join display slides in with the jingle, styled name, hook line and Accept;
  - the party check;
  - a chapter 2 fight with Hiwot beside Hiro using a signature move;
  - a later recruit's display, and the party check before chapter 3.
  Take desktop and phone screenshots of each companion's join display that's finished.
- A reload during the display doesn't repeat or skip it.
- `npm test`, `npm run test:ship`, `npm run test:story` and the companion and story browser tests pass.
- A dated CHANGELOG entry: companions finished vs pending, how the jingle was made (and credits, if any), the fonts and their licences, balance before and after, and the package size.
- Commit only your own files after checking git status. Nothing is published.
