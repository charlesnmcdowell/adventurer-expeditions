# Bug review — 11 October 2026

Read-only review of `js/expedition/` (arcade, physics and story campaign) by four reviewers, each reading their files in full and checking callers. Items marked **Verified** were reproduced headlessly or confirmed in the code by the session lead; the rest are reviewer findings with the stated confidence. Nothing here has been fixed yet unless it says so.

Owner: **Arcade** = shared arcade code (this session can fix); **Astra** = story-campaign files (`story*.js`, `docs/story_preview.js`, story fight page).

## Fix first

| # | Problem | Where | Owner | Status |
|---|---|---|---|---|
| 1 | Leaving a fight during a hit-stop (pause menu End run, the campaign's Story button, any scene change) leaves the hit-stop counter above zero. The scene object is reused, so the next fight's painted animations stay paused and the director waits forever: a softlock. | `beats.js` 28–51; no reset in `scene.js` or `story_scene.js` `create()` | Arcade + Astra | **Fixed 2026-10-11:** both `create()`s reset the counter |
| 2 | From playthrough 2 on, a reload after clearing a wave pays that wave's score again. Generated wave ids such as `rain_L2_w1` are stripped from `run.awarded` by save sanitizing, and the run is saved on the cleared wave before `wave` advances. | `campaign.js` 351; `scene.js` victory/tapArrow | Arcade | Verified: same wave paid 375 twice |
| 3 | A save whose `questsDone` is not a list throws during sanitize. `Run.load` drops the save silently; the Travel scene and `buildWorld` would crash. | `campaign.js` 346 runs before 350 | Arcade | Verified: throws |
| 4 | The Alpha plays its collapse clip after every landed pounce: `land_tumble` falls back to `down` because the Alpha has no tumble clip. Parries and misses play its hurt clip. | `actors.js` 218 aliases | Arcade | **Fixed 2026-10-11:** landings settle to idle; regression test added |
| 5 | Campaign: clicking Story during the victory pose discards a won fight; the player refights it. | `story_scene.js` 61, 75 | Astra | Verified (code path) |
| 6 | Campaign: any error in the battle frame (manifest fetch, unready art, a scene `create` throw) is a softlock; the frame covers the Title button. | `STORY_FIGHT_PREVIEW.html` 132 | Astra | High |
| 7 | Campaign: switching tabs during a fight restarts story music under the battle and can save the parent's stale record over the battle's win. | `docs/story_preview.js` 119 | Astra | Verified (handler has no battle check) |
| 8 | Campaign: Retry inside a fight is silent; the reused scene keeps the paused music object and `startMusic` returns early. | `story_scene.js` 33, 36 | Astra | Verified (code) |

## Visible glitches

- **Fixed 2026-10-11. Alpha heavy hit showed damage before its strike landed.** The damage number and Hiro's stagger fired before the attack's contact frame. They now fire on the bite's contact frame; the plain wolf bite too. Regression test added. `beats.js` 299–304.
- **Fixed 2026-10-11. Blood kept animating through the finisher hit-stop.** Blood and every defeat effect now hold through pause and the painted hit-stop and follow slow motion (`DefeatFX.held`). The city effect no longer leaves a shutdown listener per kill. `gore_fx.js` 32, `defeat_fx.js` 57–64.
- **End run inside the End scene restarts End without its footer and high-score note, and relabels a defeat as "Run ended".** `scenes_town.js` 437/439, `ui_common.js` 269. Arcade, high.
- **The End scene's name field (a page element) sits over the pause menu's buttons,** and Enter submits while paused. `scenes_town.js` 391/399. Arcade, high.
- **Tutorial hold flags carry into the next wave,** so a skill still ready at wave end gets no hold. `scene.js` 257, 225/407. Arcade, medium.
- **Campaign: corrupt saves pass the loader and throw later.** Examples: missing `completed` or `outcomes`, `defeat` without a checkpoint, an out-of-range encounter, an unknown perk id. `story.js` 31, `story_preview.js` 56. Astra, high for corrupt saves only.
- **Campaign: battle music plays in a hidden tab;** narration stalls after a tab switch on the ending screen. `story_scene.js`, `story_preview.js` 119. Astra.
- **Fixed 2026-10-12. Campaign: the fight page's fallback link pointed at a missing file** (`STORY_CAMPAIGN_PREVIEW.html` resolves to the project root). `story_scene.js` 77. Astra, verified.
- **Boss Finisher readiness and execution disagree when the boss has temporary health:** a lit button, then no execute. `encounter.js` 223 vs 447. Arcade, medium.
- **`?at=inn&score=N` works in the local build:** it wipes the save and sets any score. The portal packager already gates it. `index.html` 249. Arcade, high, local only.

## Smoothness

- Health-bar tweens are added on every refresh even when health is unchanged (`actors.js` 105).
- The cooldown ticker re-renders skill text 10 times a second (`hud.js` 269) and rebuilds full skill states each tick (`scene.js` 106).
- Infinite pulse tweens survive their destroyed targets: queued ring, gate rings, hand, hidden arrow (`hud.js`, `ui_common.js`).
- Each atlas JSON is fetched and parsed twice, once for the atlas and once for clip data (`painted.js` 48–49, `enemy_finishers.js`, `props.js`).
- All five inn paintings decode on every visit, though one is shown (`inn_art.js` 13–19).
- The next fight's monsters load after travel, not during it (`scenes_town.js` Travel preload).
- Campaign: the title weather canvas keeps drawing behind battles; each dialogue beat saves 3–4 times; backdrop art accumulates across chapters; story scripts lack cache-busting stamps.

## Rule and data mismatches

- The pacing comment says normal is two seconds; the value is one second and the fallback two (`data.js` 267). Decide which is intended.
- `'grave'` is still an accepted saved phase and routes a run to a reset (`campaign.js` 364).

## Dead code (safe removals)

- Rival path: `Enc.makeRival` and its branch call `X.Campaign.rival`, which does not exist. The code is broken, not retained.
- `ruins` quest and encounters; `marsh_*`/`city_*` definitions overwritten later; boar and human foe definitions; `Camp.timesCleared`; `run.cycles` writes; `Enc.restore`; gold inventory.
- `tryLowHealth` stub and its two awaits; `this.trail`; `G.contacts`; `__lastHumanoidGore`; `props live.debris`.
- Unreachable travel banter branch; `hiroWalk`; `UI.preloadHiroSheet`; `UI.hiroFigure`; `UI.hand`; `UI.faceFrom`; HUD `iconButton`, `setFinisher`, `shakePortrait`, `defeatCard`; `tapFinisher`; story `tapArrow` and `api.destroy`.
- Stale comments describing three or four locations.

## Already fixed today

- Battle backdrops loaded the same travel images under a second key (memory and download). Fixed: they share the travel keys.
- Bram's bust loaded in every first fight, and its listener stacked on restarts. Fixed.
- Survivors were thrown by the knockback. Fixed by Astra (`campaignExit` exemption).
