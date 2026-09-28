# Adventurer: Expeditions — Facebook campaign

Made September 28, 2026. User-requested 70-second vertical Facebook Reel and cover.

## Upload files

- `Adventurer_Expeditions_Facebook_Reel_70s.mp4` — 1080 × 1920, 30 fps, H.264 video and AAC stereo music. 70 seconds including a four-second end card.
- `Adventurer_Expeditions_Cover_1080x1920.png` — matching cover.
- `preview.html` — local viewing page.

## Creative treatment

Hiro draws his katana, fights wolves, and performs his overhead finisher. Forest travel leads into serpent and moss-giant combat in the swamp, then city traversal, goblin and spider finishers. A five-scene inn montage shows Hiro alone, with Bram, mage/dancer, warrior/barmaid and ranger. The finale shows the Alpha and orc boss takedowns, Hiro's victory/sheathing animation, then fades to the cover with Neverendingnarratives branding and `facebook.com/neverendingnarratives`.

Revision 2: removed all added titles, descriptive captions and branding during gameplay. The footage, edit timing, music and final cover/Facebook end card are unchanged. In-game interface text remains part of the actual capture.

Audio uses only the first 70 seconds of the user-selected `cookie relaxation 2.wav`, normalized toward -16 LUFS with an opening fade and two-second closing fade. No voiceover and no captured game audio.

## Production and provenance

- Cover created with built-in image_gen from Hiro's established reference. Exact prompt: `cover-prompt.txt`. Original output: `cover-master.png`; export is a size conversion.
- All action was recorded from the local Expeditions game. `capture.js` stages its existing scenes, animation clips, finishing moves and effects in an isolated browser context. Enemies are placed at finishing health for capture. This is an edited gameplay showcase, not a continuous playthrough or new gameplay functionality.
- `capture.json` records the captures and browser errors. `compose.py` is the reproducible edit. `verification.json` records the final file's dimensions, duration, streams, music source and checksum.
- `raw/`, `work/`, and `review/` retain captures, intermediate renders and QA images locally, excluded from Git. The source music stays at its original user-provided path.
- No changes to runtime game code, save data, ship manifest or live website are needed for this campaign. Marketing files are not in the game shipping allowlist. Nothing has been posted to Facebook.

## Suggested Facebook post

Meet Hiro. Draw your blade, take the road, and finish the fight.

Adventurer: Expeditions brings cinematic samurai combat to the forest, swamp and city—with a well-earned stop at the inn between adventures.

Follow Neverendingnarratives for the game and updates:
https://www.facebook.com/neverendingnarratives

## Rebuild

From the Expeditions root, run `node marketing/expeditions-facebook-20260928/capture.js`, then `python marketing/expeditions-facebook-20260928/compose.py`. Uses installed Google Chrome, Playwright, Pillow and the local FFmpeg path recorded in the compose script.
