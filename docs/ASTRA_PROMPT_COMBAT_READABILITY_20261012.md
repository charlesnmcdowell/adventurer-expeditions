Fix three things in Adventurer: Expeditions story fights where the combat doesn't read right: enemy status attacks that do no damage, Hiro swings that do nothing visible, and the mage projectile that doesn't match the casting pose. Hiro found these in chapter one playtesting (12 October 2026).

PROJECT AND RULES
- Project: C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions. Local work only: don't publish or export anything.
- The original game in C:\Users\charl\The Sorcerer Sword ARPG\adventurer is read-only, along with the synced shared files (js/core, js/data, js/ui). Rule changes for this edition go in edition files (js/expedition/story_combat.js, encounter.js, beats.js and so on), never in the shared skill tables.
- Read first: the top of docs/CHANGELOG.md (the 2026-10-12 entries), docs/BUG_REVIEW_20261011.md, and the art rules in docs/STORY_CAMPAIGN_PRODUCTION.md.
- Another session changed these on 2026-10-12. Keep them working:
  - js/expedition/beats.js: enemy bites land damage on the bite's contact frame;
  - js/expedition/actors.js: landings never fall back to `down`;
  - js/expedition/defeat_fx.js and gore_fx.js: effects hold during hit-stop;
  - js/expedition/story_scene.js: `tutoring()` covers only the first two fights won.

1. ENEMY STATUS ATTACKS MUST HIT
   Problem: some enemy skills apply only a status and have 0 power, so Hiro takes no damage and the attack looks broken.
   - Chapter one example: Marked for the Knife. It's `power: 0, effect: 'mark'` in the original's campaign_skills.js: Hiro is marked for 3 rounds, and that enemy's hits ignore half his Defence.
   - Smoke Bomb, venom-style debuffs and anything else with power 0 aimed at Hiro have the same problem.
   Hiro wants these attacks to deal damage and keep their status effect.
   - List every enemy active in the 14-chapter story rosters that targets Hiro with power 0 (or that only adds a status). Use the story kits in story_combat.js and the original skill table. Put the list in the CHANGELOG.
   - In the edition's combat setup, give each one a real hit: a light strike near that enemy's basic attack (about 50–70% of it), plus the original status. Leave the original data files untouched.
   - Keep balance in check: rerun `node test/story_balance.js --gate` and report the win-rate change per chapter.
   - Show what the status did:
     - pop the skill's name over the enemy when it's used;
     - add a status badge on Hiro for its duration. "Marked" is missing from STATUS_STYLE in actors.js, so only bleed, poison, aura and counter show today.
     - Smoke Bomb should show the enemy's evasion going up.

2. HIRO'S ATTACKS THAT DO NOTHING VISIBLE
   Cause: `kitAction` in beats.js gathers Hiro's damage events. When the sim resolves his swing as an evade, a block or a counter, the list is empty. The slash still plays, but the enemy doesn't react: no dodge, no block, no "Miss" or "Blocked" text, no number. So it reads as Hiro hitting and doing nothing.
   - Present every outcome:
     - **Evade:** the enemy plays a dodge or step-back, with a "Miss" float.
     - **Block or parry:** the enemy plays a guard or parry with a spark and a "Blocked" float.
     - **0 damage:** show a "0" or "Resisted" float.
     - **Absorbed by a shield:** show the shield taking it.
     Use each enemy's own clips. If an enemy lacks the drawing, fall back to its hit-short or a small knockback slide, never nothing. Name any enemy that needs new art.
   - Check how often Hiro's swings miss in the first chapters (evasion from rogues and Smoke Bomb). If chapter one's tutorial fights let Hiro miss a lot, lower it there so the first two fights teach hitting and skills, not whiffing.
   - Add a beats test for each outcome (evade, block, 0 damage): every one must produce a visible enemy reaction. test/actor_animation_lifecycle.js has a director fixture to copy.

3. MAGE PROJECTILES DON'T MATCH THE CASTING POSE (art and timing)
   Problem: the Fire Bolt / Prismatic Bolt effect doesn't line up with what the mage's sprite is doing, which makes the art look wrong. In `humanAction` (beats.js) and story_effects.js today:
   - the projectile starts only after the whole `cast` clip has finished;
   - it starts from the actor's chest, not the hand or staff;
   - it's a fixed 190 px square sprite, rotated toward Hiro.
   Fix:
   - Launch the projectile on the cast clip's release frame, from a per-clip anchor at the hand or staff tip measured on the frames. Add `releaseAnchor` to the clip data the way contact frames are stored.
   - Hold the mage's follow-through pose while it flies.
   - Match the effect to the pose: size relative to the mage's height, angle from the anchor to Hiro, and colour and style matched to the painted spell. If the current sheet (assets/expedition/story/effects/chapter-one.json) can't match the casting gesture, repaint it, following the sprite-cleanup workflow and saving prompts and drafts under adventurer-expeditions-source-art/astra-v8/.
   - The impact on Hiro lands when the projectile arrives, not before.
   - Check every caster in chapters 1–4 the same way: Merle, consortium mages and kobold shamans.

DONE MEANS
- In real play of chapter one, with screenshots:
  - every enemy attack aimed at Hiro either damages him or visibly misses or gets blocked;
  - every Hiro swing gets a visible enemy reaction;
  - mage bolts leave the hand or staff on the release frame.
- The win-rate table from story_balance before and after, in the CHANGELOG.
- These pass:
  - `npm test`
  - `npm run test:story`
  - `npm run test:ship`
  - `node test/browser_story_chapters.js`, `browser_story_spared.js` and `browser_story_endings.js`
- Add a dated CHANGELOG entry: what changed, how it was verified, what's left.
- Commit only your own files after checking git status. Nothing is published.
