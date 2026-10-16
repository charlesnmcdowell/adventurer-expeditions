Finish what's left in Adventurer: Expeditions, in this order: companions (switch them on with a proper join display and party check), Hiro's Iaido Draw and deflect art, then the website package (16 October 2026, end of day).

This replaces docs/ASTRA_PROMPT_COMPANIONS_FINISH_20261016.md. Everything in that prompt still applies except where the status below has moved on.

PROJECT AND RULES
- Project: C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions. Local work only: no publishing or pushing. Hiro publishes the website himself; `node tools/site_demo.js stage` targets the audiobook2-audio Pages checkout.
- The original game in C:\Users\charl\The Sorcerer Sword ARPG\adventurer is read-only, along with the synced shared files (js/core, js/data, js/ui).
- Read first: the top of docs/CHANGELOG.md, docs/COMPANION_PRODUCTION_PROGRESS_20261015.md and docs/STORY_CAMPAIGN_PRODUCTION.md.
- Keep working, without regressions:
  - Hiro's 200 voiced choices;
  - the 560-segment companion dialogue and 6-bark banks (bcc1df0);
  - Santiago's rewrite;
  - Counter (2 blocks, deflects arrows and spells);
  - Iaido Draw (god_aura slot, power 3.6, 22 s);
  - the per-opponent hit scale and Snarl's retaliation fix;
  - Retry keeping its music;
  - the tutorial in the first two fights won;
  - the dev chapter jump;
  - the password gate (chapter 1 free, "Hiro" opens 2–6).
- Player-facing text sounds casual and plain, not like AI. Hiro (the character) uses no "cyber" and no "purple" glows.

WHERE THINGS STAND
- **Companion art:** atlases exist for all 15 (`assets/expedition/companion_*`, f4518b5), but only Hiwot, Desmond, Winston and Santiago went through the reviewed pilot process. The other 11 were added in one batch.
- **Companion combat** is built (party picker, knocked out not finished, Hiro-only defeat, signature moves and effects) but switched off: `S.Companions.enabled=false` in story_companions.js.
- **The join display** (`story_companion_ui.js` `unlock()`) is a plain card that auto-closes after 2.4 seconds, with a 2.2-second unpitched flourish. It's nowhere near what Hiro asked for.
- **Hiro's `iaido-draw` and `deflect` clips** aren't in his atlas yet. Iaido plays his widest slash, and deflected shots fly back as a plain dot (docs/ASTRA_PROMPT_IAIDO_DEFLECT_20261013.md).
- **The website demo** is live at charlesnmcdowell.github.io/audiobook2-audio/ (DEMO_THROUGH=1, UNLOCK_THROUGH=6), and the main site links to it. `tools/site_demo.js` SITE_THROUGH=6, and the package is about 414 MB. That Pages site has its own 1 GB.

1. QA THE 11 BATCH COMPANION SETS (before anything turns on)
   - The 11 are Beau, Delphine, Itsuki, Bahadır, Yasemin, Devendra, Layla, Kaito, Wanjiru, Dai Morgan and Amara.
   - Check each against the binding art rules and the approved weapon and signature table (2026-10-15 CHANGELOG):
     - on-model with their story portrait;
     - feminine characters stay feminine and attractive;
     - at least 16 distinct drawings per move, with the doubling rule;
     - no cropped or joined frames (Beau's earlier attack drafts failed exactly this way);
     - feet on Hiro's ground line, matching body scale;
     - contact and release frames marked;
     - signature projectiles leave the weapon or hand on the release frame;
     - knocked-out, never death or gore.
   - Fix or repaint anything that fails, following the sprite-cleanup workflow. Save prompts and drafts under adventurer-expeditions-source-art/astra-v10/.
   - Fix the flagged Hiwot blade pixel and stride polish.
   - Make a review page showing all 15 in their idle, attack and two signatures. Hiro approves there.

2. THE JOIN DISPLAY HIRO ASKED FOR (replace `unlock()`)
   - **Hiwot is the first companion, at the start of chapter 2.** She's still recruited at the end of chapter 1 (q1_join) and chapter 1 stays solo. Hold her display until chapter 2 begins, after the inn and road trip, before chapter 2's first dialogue. Every later recruit gets theirs when the story recruits them.
   - **The portrait slides in from the side.** Large, with an ease-out, a small overshoot and settle, and a light streak or banner behind it. Think "new challenger" or "joined the party". Reduced-motion users get a fade.
   - **A "new party member" jingle.** Short (2–3 s), bright and melodic, in key with the campaign music, like the little "you got a new party member" fanfare. Replace the unpitched flourish. Make it with ElevenLabs sound effects or music, or compose it, and log any credits. It respects mute and sits under the dialogue.
   - **The name, styled to match the personality.** One treatment per companion, not just a font swap: lettering, colour, texture and motion. For example:
     - Hiwot: scrappy and lively;
     - Bahadır: huge and shaking;
     - Delphine: warm and solid;
     - Layla: cold and elegant;
     - Kaito: showy.
     It has to read on a phone. Fonts must be bundled with an open licence; list each licence.
   - **One hook line** under the name, in their voice, from their existing dialogue.
   - **The player accepts and it goes away.** No auto-close. An Accept button (also keyboard and tap) slides it out, then the party check.
   - It shows once per companion per save and survives a reload (keep `queueUnlocks` and `claimUnlock`).

3. PARTY CHECK BEFORE EVERY CHAPTER (`picker()` exists)
   - From chapter 2 on, at each chapter start after the road trip and title card, show "Your party for this chapter":
     - Hiro;
     - the two companions, with portrait, styled name, weapon and two moves;
     - "Change" and "Set out".
   - It also opens right after a join display.
   - Default to the last pair. Companions who left, died or betrayed drop out and their slot is offered to someone else.
   - Only companions with approved art appear.

4. SWITCH COMPANIONS ON
   - Set `S.Companions.enabled=true` once 1–3 pass and Hiro has approved the art.
   - In every story fight from chapter 2 on, the two picked companions fight beside Hiro. Both are visible and clear of Hiro and the HUD on desktop and at 390×844.
   - Their barks play.
   - Run `node test/story_balance.js --gate` with the default pair per chapter, and report win rates before and after.

5. HIRO'S IAIDO DRAW AND DEFLECT ART (docs/ASTRA_PROMPT_IAIDO_DEFLECT_20261013.md, still open)
   - `iaido-draw`: a sheathed crouch, then one blinding draw-cut with a white or steel streak across the whole enemy line, then a slow re-sheathe. At least 16 drawings, with the doubling rule.
   - `deflect`: a guard-and-flick that knocks an arrow or spell back at the shooter.
   - Knocked-back versions of fire_bolt, prismatic_bolt and an arrow.
   - A new Iaido Draw HUD icon replacing the God Aura painting.
   - The code hooks are already wired (actors.js aliases `iaido` and `deflect`).

6. WEBSITE PACKAGE
   - Update `tools/site_demo.js` so the package carries companions who can join by SITE_THROUGH.
   - Its verify adds the join display, the party check and one party fight.
   - Report the package size against the audiobook2-audio site's 1 GB.
   - Also report the size with SITE_THROUGH = 14, so Hiro can decide whether to put the whole campaign behind the password.
   - Don't stage or publish; Hiro does that.

DONE MEANS
- A fresh save played in the browser from the end of chapter 1 into chapter 2:
  - Hiwot's join display (slide, jingle, styled name, hook, Accept);
  - the party check;
  - a fight with Hiwot beside Hiro using a signature move and getting knocked out, then back next fight;
  - a later recruit's display and the party check before chapter 3.
  Take screenshots of all 15 join displays, desktop and phone.
- Iaido Draw against three enemies, and a deflected Consortium Mage bolt and Bandit Archer arrow, in real fights.
- `npm test`, `npm run test:ship`, `npm run test:story`, `node test/story_balance.js --gate` and all story and companion browser tests pass. The site verify passes too.
- A dated CHANGELOG entry: companion QA results per companion, jingle source and credits, fonts and licences, balance before and after, and package sizes.
- Commit only your own files after checking git status. Nothing is published.
