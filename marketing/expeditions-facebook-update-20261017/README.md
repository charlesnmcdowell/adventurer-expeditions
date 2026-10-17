# Adventurer: Expeditions — Facebook update Reel

Created October 17, 2026. Deliverable: **Adventurer_Expeditions_Facebook_Update_45s.mp4**.

45 seconds, 1080 × 1920 portrait, 30 fps, H.264 video and AAC stereo. Music only: no voiceover or captured game audio.

## Edit

| Time | Party and scene |
| --- | --- |
| 0–14 seconds | Hiro, Santiago and Beau fight gnoll raiders and Snarl at the gnoll fortress. Both companions attack; Hiro finishes Snarl and sheathes his sword. Brief “New game update” title appears above the gameplay. |
| 14–27 seconds | Hiro, Winston and Hiwot fight wolves on the Shore Road. Both companions attack; Hiro finishes the last wolf and takes his victory stance. |
| 27–41 seconds | Hiro, Layla and Wanjiru fight sewer crawlers and the Ogre Under the Docks. Both companions attack; Hiro finishes the ogre. The demo URL and Facebook feedback invitation appear below the gameplay during the last seven seconds. |
| 41–45 seconds | The existing cover and Neverendingnarratives/Facebook ending card, taken directly from seconds 66–70 of the previous 70-second Expeditions Reel. |

The full battle width is preserved, including the companions, enemies and interface. Portrait space above and below uses a softened, darkened copy of the moving footage. Complete actions and finishers are retained; clips are gently retimed to fit their slots without cutting off recoveries.

Music is **Hammer Psalm black smith theme 1.wav**, from the user’s Kenji music folder. The first frame of this Reel starts at **0:27 of the song**, and uses the following 45 seconds, with loudness normalization and a closing fade.

## Suggested Facebook post

The Adventurer: Expeditions demo has a new update! Take Hiro into battle with his companions, explore the story, and try the finishing moves.

Play now: https://neverendingnarratives.com/expeditions

Give it a try and send me your feedback here on Facebook. Let me know what you enjoyed and what needs work.

## Capture and verification

- Recorded from the current local game’s Phaser renderer, with the actual companion art, scenery, combat effects and paired finishers. Like the previous Reel, this is a staged gameplay montage, not an unedited playthrough: the capture script selects the teams, schedules the attacks and prepares enemies for their finishing blows.
- Each fight uses a fresh disposable browser context. No real save, gameplay code or original Adventurer file is changed. JavaScript is frozen in memory when capture begins to avoid mixing code revisions during concurrent development.
- `capture.json` records the loaded parties, enemies, locations, action times, three completed finishers with zero enemies remaining, browser errors and source hashes.
- `verification.json` records the final file’s dimensions, duration, codecs, music offset, end-card source and checksum. The entire final video is decoded to check for errors.
- `review/storyboard.jpg` and individual review frames are local QA output. Raw recordings and intermediate renders are retained locally but excluded from Git.
- No new artwork or voice generation was used. Nothing has been uploaded or published.

## Rebuild

From the Expeditions root, run `node marketing/expeditions-facebook-update-20261017/capture.js`, then `python marketing/expeditions-facebook-update-20261017/compose.py`. Requires installed Chrome, Playwright, Python/Pillow and the FFmpeg path recorded in `compose.py`. The source soundtrack remains in its original location.
