# Sprite cleanup pilot — 2026-09-28

## Scope and result
Technical repairs to three representative cases, using existing artwork only. No image-generation calls, no new frames, no changes to the original Adventurer website game. Baseline checkpoint: `a0589af`.

- Plant lash: replaced rigid grid extraction with six measured crop rectangles and root anchors. Removed neighboring fragments. Retained timing and contact events.
- Orc: removed neutral matte from both paired finishers with targeted GrabCut segmentation plus a separate soft mask for blue/purple effects. A broad gray threshold was rejected because it damaged armor. Some authored flame edges remain visibly cut off; do not call this a complete repaint or perfect source-art repair.
- Alpha cleave: paired body scale 1 → 1.306122 (320 / 245 measured Hiro reference), target-distance ratio 0.65 default → 0.94. Uniform scaling preserves contact. Other Alpha pairs were not adjusted because their embedded hero/wolf proportions need separate evaluation.
- Runtime transition: borrowed-sheet origin/scale now applies when the paired clip starts. Approach and return runs retain Hiro's native origin/scale. This prevents enlargement during locomotion around a finisher.

## Evidence
`art/cleanup-pilot/index.html` contains a side-by-side normal/half-speed comparison. Browser captures use isolated saves, deterministic encounters and disabled cinematic camera for clear comparison; they do not change player saves. The separate finisher browser suite exercises normal combat resolution.

Automated inventory covered 128 clips. Corner-alpha heuristic flags fell from 5 to 3; this heuristic is a review aid, NOT a complete visual quality pass. Unchanged plant frames (11) and orc frames (24) were compared to baseline and retained identical visible pixels and alpha. Transparent RGB values may differ after WebP encoding.

Validation: actor animation lifecycle 27/27; pacing checks across 17 finishers; shipping atlas/cache contract; three-case browser playback with zero page/resource errors; scale/texture restoration and native approach/return scale assertions. Broader finisher browser suite: 10/10 passed across all creature families. Cold-cache desktop, mobile portrait and mobile landscape reached gameplay at about 14.35 MB, first combat at 14.39 MB and audio unlock at 15.43 MB. These are local Chrome measurements, not CrazyGames portal certification.

## Size and preservation
Lossless encoding protects unaffected frames. Plant atlas: 396,418 → 1,084,504 bytes. Orc atlas: 1,915,580 → 4,635,720 bytes. Old atlases remain for rollback but are excluded from shipping. Total local ship payload approximately 45.58 MB; initial download remains below 20 MB. Review videos, tooling and isolated Python dependencies do not ship.

## Rebuild
`python tools/sprite_cleanup_pilot.py` writes inventory/backup reports; `--apply` rebuilds the pilot from baseline and existing source masters. Requires Pillow, NumPy, SciPy and OpenCV. This session installed OpenCV only under ignored `test/reports/sprite-cleanup/python`, not globally. If missing: `python -m pip install --no-deps --target test/reports/sprite-cleanup/python opencv-python-headless==5.0.0.93`.

Run this targeted step after an upstream art rebuild: general art generators do not yet incorporate these corrections. It intentionally reads baseline a0589af; review that baseline before adopting newer masters. Do not treat the orc mask as a universal cleanup filter.

## Remaining shortlist — no regeneration authorized by this pilot
1. Alpha pin/parry and moss-giant pairs: inspect relative anatomy, crop registration and ground anchors individually. Uniform scale cannot repair mismatched proportions inside one painted pair.
2. Hiro obstacle travel: inspect frame boundaries and foot registration against the moving plate.
3. Orc effect frames: focused repair of clipped blue-flame edges if still noticeable in motion.
4. Any other inventory flags: visually confirm before changing or generating anything.

Play-test the three pilot cases before spending image credits or expanding cleanup to every animation. No publishing performed.
