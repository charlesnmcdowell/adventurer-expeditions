# Campaign comparison: Expeditions story vs. the original Varenholm Gate (11 October 2026)

> **Status, end of 11 October 2026:** fixed, see CHANGELOG.
> - sound starts on and is remembered;
> - the death caption, flash and hold are back;
> - chapter title cards are in;
> - join and seat notices are in;
> - a replay button is in;
> - the box is compact and paintings show first.
>
> The rest of this page is the original report and still lists those items as open.

Read-only comparison of `docs/STORY_CAMPAIGN_PREVIEW.html` (`docs/story_preview.js`, `js/expedition/story*.js`) against the original `../adventurer` (`js/ui/campaign3_ui.js`, `js/ui/gate_cinema.js`, `js/data/campaign3_*.js`). Nothing was changed. Story files belong to Astra.

## Root cause of "no voice, wrong music"

The Expeditions campaign starts **muted** (`story_preview.js` line 4, `muted=true`). Story music and voice only start after the small **Sound on** button at the top right is pressed, and the setting isn't remembered between visits. The original starts with sound on (`ADV.Music.muted: false`, remembered in `adv:muted`).

The fight page inherits the mute (`?muted=1`). If its own Sound button is pressed, only that fight's battle track (`vg_battle`) plays. Back in the story it's muted again, so there's no chapter music and no voice. That matches what was heard.

The audio itself is correct:
- The music table is identical to the original's `CAMPAIGN3_MUSIC`: chapter 1 `vg_lanternhold`, 2 `vg_shore_road`, 3 `vg_thornbury`, fights `vg_battle`, dreams `vg_dream`.
- All 21 music files and 840 voice files are present under `assets/expedition/story/media/`.
- Spot-checked files are byte-identical to the original.
- `preview-media.json` lists 974 voice paths, 153 of them for chapters 1–3, including `aldric/q1_death_1.mp3`.

## Tesfaye's death (chapter 1 closing, beat `q1_death`)

| | Original | Expeditions |
|---|---|---|
| Death still (`still_death.webp`) with fire ambience | Yes | Yes |
| Line "Go —" | Yes, voiced | Yes, silent while muted |
| Caption "The sword goes through him. You run because he told you to." | Yes (`STORY_DEATH_CAPTIONS.gate` fallback) | **Missing.** The beat has no caption of its own; the original supplies the fallback in `campaign3_ui.js` line 100. |
| Red flash, then a 600 ms hold before the next beat | Yes | **Missing.** It's a normal Continue button. |

So in Expeditions the death reads as Tesfaye saying "Go —" over a still, followed by a Continue button. Without the caption, the flash and the voice, it's easy to miss that he died. The same applies to the other death beats: `q10_summit_kill` and `q14_final_taken`.

## Other differences

1. **No chapter title cards.** The original opens each chapter with a title plate over the location (`GateArt.chapter`, `gate_cinema.js` line 138). Expeditions has none.
2. **No join and seat notices.** The original announces recruits and offers party seats (`announceJoins`, `offerSeats`). Expeditions applies these silently.
3. **No voice replay or narration prompt.** The original has a replay control on voiced lines and a "Sound is muted / Tap Play narration" prompt on the end card. Expeditions has neither; the ending's "Read aloud" works.
4. **Solo combat.** The original fights with the party; Expeditions has Hiro fight alone ("your companions remain part of the story"). This is by design in the new combat system.
5. **Locked chapters.** Only chapters 1–3 play, because chapter 4 onward needs enemy art (11 of 59 enemies registered). The playtest build ends with "To be continued".
6. **No camp or hub music.** The original's town and camp underscore (`vg_camp`, `hubMusic`) has no counterpart because there's no hub.
7. **Speakers are portrait busts** rather than the original's full-body scene speakers. This is a deliberate art change.
8. **Same content.** Expeditions reuses the original `Campaign3` script, choices and flags, so the dialogue, choices and branches are the same.

## Suggested fixes (for Astra)

1. Start with sound on after the first click, the way the original does, and remember the setting (for example in `adv:muted`). Make the fight's Sound button and the story's Sound button share that setting.
2. On `beat.death`:
   - show `beat.caption || ADV.DATA.STORY_DEATH_CAPTIONS.gate`;
   - add a red flash over the still;
   - hold about 600 ms before Continue becomes available.
3. Add chapter title cards at each chapter's departure, using `G.chapterLocations` for the location art.
4. Add brief join notices when companions are recruited.
5. Optional: a replay button for the current voiced line.
