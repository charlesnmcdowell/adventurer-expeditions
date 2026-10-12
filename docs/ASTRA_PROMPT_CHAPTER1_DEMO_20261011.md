Make chapter one of the Adventurer: Expeditions story campaign a polished demo, and fix the bugs Hiro found in playtesting (11 October 2026).

> **Update, end of 11 October 2026:** items 1, 2, 3, 5 and 6 below are done (see the CHANGELOG entry "Chapter one demo"). Only item 4, fighters floating above the ground, is still open, and it needs ground art. Review the done items in play; don't redo them.

PROJECT AND RULES
- Project: C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions. Local work only: don't publish, upload or export anything. Hiro plans to put chapter one on the neverendingnarratives site after their own QA, and will ask for packaging separately.
- The original game in C:\Users\charl\The Sorcerer Sword ARPG\adventurer is read-only, along with the synced shared files (js/core, js/data, js/ui). Story text, choices and recordings come from it unchanged.
- Read first: the top of docs/CHANGELOG.md (including today's "Campaign: chapter cards, join and seat notices, voice replay" entry) and docs/STORY_COMPARISON_20261011.md.
- Another session added these to docs/story_preview.js today; keep them working:
  - chapter title cards (`chapterCard`, `record.titleCards`);
  - join toasts and full-company seat offers (`noteSeats`, `seatMenu`, `record.seatOffer`);
  - the Replay line button.
  test/browser_story_chapters.js now answers a seat offer by leaving the newcomer at the inn.
- Player-facing copy should sound casual and plain, not like AI. No "cyber" and no "purple".

FIX AND CHANGE, IN THIS ORDER

1. Voice doesn't play the first time; Replay line works.
   Cause: docs/story_preview.js starts with `muted=true`, and `say()` returns early while muted. `replay()` ignores the mute, which is why only the replay is heard.
   - Start with sound on. Music and voice begin on the first click (Begin or Continue counts as the browser's required gesture).
   - Remember the player's choice in localStorage.
   - Make the fight page's Sound button (story_scene.js, `?muted=`) use the same setting, so turning sound on or off in either place applies to both.
   - Verify that the first line of a fresh campaign (Tesfaye at the door) is heard without pressing Sound or Replay.

2. Cutscene text boxes cover the art.
   The dialogue box can take up half the screen; on Tesfaye's death only half the still is visible. The original (gate_cinema.js `G.withScene`) loads the new painting and shows it first, and only then opens a bottom box about 156 px high on a 760 px stage, about a fifth of the screen.
   - Keep the box docked at the bottom, no taller than about 25% of the viewport on desktop. Use a smaller portrait and type. Long lines should scroll inside the box.
   - On every scene change, and always for stills, show the painting on its own until it has loaded and for about 1–1.5 s. Then fade the box in.
   - Make sure stills are framed so the important part isn't hidden behind the box (Tesfaye's death, the bounty, the letter). Check desktop and phone widths.

3. Restore the original death presentation.
   For `beat.death` (q1_death, plus q10_summit_kill and q14_final_taken later):
   - show `beat.caption || ADV.DATA.STORY_DEATH_CAPTIONS.gate` ("The sword goes through him. You run because he told you to.");
   - add a red flash over the still;
   - hold about 600 ms before Continue appears.
   Tesfaye's death must clearly read as a death.

4. Fighters float above the ground in some story fights.
   Example: chapter three's first fight, the Dunmere village before the mines. Hiro and the enemies' feet aren't on the ground, and they look like they're fighting above the village.
   - Check the ground line of every story battle backdrop (story_stage.js and the environment paintings) against the actors' feet at GROUND_Y, for every location in chapters 1–4 at least.
   - Fix it by cropping or offsetting the painting so a walkable surface sits under the fighters, not by moving the fighters.
   - Add a screenshot check per location to the story browser tests.

5. No gold: use arcade points and the leaderboard.
   This edition doesn't use gold. Chapter rewards currently say "750 gold earned" (story.js `chapterRewardDue`, story_preview.js reward screen).
   - Replace gold shown to the player with arcade points, earned per fight and per chapter, on the same scale as Arcade.
   - At the demo's end screen, show the score and the existing high-score flow (name entry, and the note about sharing a screenshot), as Arcade's End scene does.
   - If original Campaign3 logic still reads gold internally, keep it hidden rather than ripping it out, and say so in the changelog.

6. Make chapter one the demo.
   - Set `PLAYABLE_THROUGH = 1`.
   - After chapter one's reward screen, show a casual end card saying chapter two is coming soon, with the player's points and the high-score flow, and Back to title and Play Arcade buttons.
   - Remove development wording a player would see: the "CAMPAIGN DEVELOPMENT PREVIEW" tag, the "Development preview… not the finished campaign" notice, and "Begin campaign preview" (use plain labels such as "Begin" and "Continue").
   - Keep chapters 2+ in the code. They come back by raising the constant.

DONE MEANS
- Play chapter one end to end in the browser on a fresh save, at desktop and phone sizes. Check each item above with screenshots:
  - voice on the first line;
  - box size and scene-first reveal;
  - the death caption and flash;
  - grounded fighters;
  - points instead of gold;
  - the coming-soon end card.
- Reload mid-chapter and after a defeat, and check nothing is lost.
- These pass:
  - `npm test`
  - `npm run test:story`
  - `npm run test:ship`
  - `node test/browser_story_chapters.js`, `browser_story_spared.js` and `browser_story_endings.js` (update their expectations for the demo end and the new labels).
- Add a dated CHANGELOG entry: what changed, how it was verified, what's left. Regenerate STORY_CAMPAIGN_STATUS.md.
- Commit only your own files after checking git status. Nothing is published.
