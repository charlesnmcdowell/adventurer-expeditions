# Silent preview revision — September 29, 2026

Replaced arbitrary early cuts with complete action beats: wolf finisher (4s), forest vault including landing and run-out (4s, starting 0.8s into capture), moss giant finisher (2.5s), orc finisher and recovery (6s), victory/sheathing (3.5s). Total: exactly 20 seconds at 30 fps.

Both formats preserve the entire recorded game frame. Portrait no longer uses horizontal crops that cut off actors; landscape no longer trims the top and bottom. Soft scenery fill accommodates aspect ratios without stretching the foreground. Existing in-game cinematic framing remains part of the recording.

Source: the post-cleanup Facebook captures. No audio, voiceover, added captions, end card, artificial slow motion or new artwork. No game changes. Covers unchanged. Rebuild with `python marketing/crazygames-store-20260928/build_store_assets.py --videos-only`. Open preview.html to compare both outputs. This is an edited gameplay showcase, not a continuous playthrough.

Validation: both exports fully decoded as 600 frames, exactly 20 seconds, with one H.264 video stream and no audio streams. Dimensions verified; Chrome playback passed for both. Final frame sheets inspected. Landscape 13,502,310 bytes; portrait 8,131,279 bytes.
