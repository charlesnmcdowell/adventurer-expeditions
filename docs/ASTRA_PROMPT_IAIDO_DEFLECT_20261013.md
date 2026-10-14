Paint the art for two new Hiro moves in Adventurer: Expeditions: the Iaido Draw (it replaces God Aura) and the projectile deflect on Counter. The code is already in and runs on placeholder clips (13 October 2026).

PROJECT AND RULES
- Project: C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions. Local work only: no publishing.
- Follow the binding art rules in docs/STORY_CAMPAIGN_PRODUCTION.md and the sprite-cleanup workflow (docs/skills/sprite-cleanup-pilot). Save every prompt, reference and rejected draft under adventurer-expeditions-source-art/astra-v8/.
- Hiro's look stays exactly on-model: same armour, sash, hair, katana and body scale as assets/expedition/hiro. No new colours; Hiro doesn't use "cyber" or "purple" glows.
- Read the top of docs/CHANGELOG.md first (the 2026-10-13 entry "Harder fights, Counter answers projectiles, Iaido Draw replaces God Aura").

WHAT CHANGED IN CODE (keep working)
- Hiro's second skill slot (internal id god_aura) is now **Iaido Draw**: one drawn cut through every enemy at once, heavy damage, 22-second recovery. God Aura and its purple ring are gone.
- Counter Attack holds 2 blocks and now also catches arrows and spells. The shot is knocked off the blade back into the shooter, then Hiro ripostes.
- No rings or circles around Hiro for any skill.
- Hooks waiting for your art:
  - js/expedition/actors.js clip alias `iaido: ['iaido-draw', ...]` plays `iaido-draw` as soon as it's in Hiro's atlas;
  - js/expedition/beats.js `deflect()` currently flies a plain coloured dot back to the shooter;
  - the HUD's second skill icon still shows the old God Aura painting (xp_hiro_skill_icons, frame god_aura).

1. HIRO: IAIDO DRAW (clip `iaido-draw` in Hiro's atlas)
   - Real iaido: Hiro stands sheathed with his hand on the hilt, crouches, then draws and cuts in one blinding motion. He ends in the follow-through with the blade extended, holds, and slowly sheathes. Think a quick-draw duel cut, not a spin.
   - The cut is meant to read as passing through every enemy on the field at once:
     - a long horizontal blade-light streak across the whole enemy line on the contact frame, in white or steel with no purple;
     - the enemies react on that frame (the code staggers their hit reactions 90 ms apart).
   - At least 16 distinct drawings, and double the planned count (holds and slowdowns don't count). Mark one contact frame (`contact`) for the moment the blade clears the scabbard, and a release frame.
   - Body scale, pivot and feet match his other clips, so he doesn't jump or shrink when the clip starts.
   - Optional: a separate full-screen streak sheet, if the line reads better as an overlay than painted into Hiro's frames. Tell me which you chose so I can wire it.

2. HIRO: PROJECTILE DEFLECT (clip `deflect`)
   - When Counter catches an arrow or spell, Hiro snaps the blade across and knocks the shot back toward the shooter: a short guard-and-flick, 10–14 drawings, contact on the frame the blade meets the shot.
   - It plays instead of `intercept` when the countered attack was ranged. The riposte that follows is unchanged.
   - It must work against both an arrow (Bandit Archer) and a spell (Consortium Mage's fire and prismatic bolts).

3. DEFLECTED SHOT EFFECT (story effects sheet)
   - A "knocked back" version of each projectile in assets/expedition/story/effects/chapter-one.json:
     - fire_bolt, prismatic_bolt, an arrow, and marked_for_the_knife if it should bounce;
     - spinning or tumbling on the return flight, with a small spark burst where it leaves the blade and an impact burst on the shooter.
   - Four frames each is fine, matching the existing sheet's frame size.

4. HUD ICON: IAIDO DRAW
   - Replace the God Aura painting in Hiro's skill icon sheet (frame god_aura) with an Iaido Draw icon: a katana half-drawn from its scabbard, with one bright horizontal slash. Same frame size and border style as the Finisher and Counter icons, no purple.

5. CLEAN-UP CHECK
   - Check Hiro's `intercept` and `counter-l2`/`counter-l3` clips for any painted ring or circle around his body. If there is one, repaint those frames without it. Hiro asked for no circles around him when he uses skills; sparks at the blade are fine.

DONE MEANS
- `node test/browser_story_preview.js` and the chapter browser tests pass.
- Screenshots in a real fight of chapter 1 or 2, saved under test/reports/:
  - Iaido Draw against three enemies;
  - Counter deflecting the Consortium Mage's bolt and a Bandit Archer arrow back into the shooter, then the riposte.
- A dated CHANGELOG entry. Commit only your own files after checking git status. Nothing is published.
