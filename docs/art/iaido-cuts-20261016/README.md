# Hiro draw-cut revision — motion review

Local review: http://127.0.0.1:8742/docs/art/iaido-cuts-20261016/

These are proposed replacement animations, not deployed runtime assets. The existing Hiro atlas, combat damage, cooldown, Counter, companions and published package are unchanged. ART_STANDARD §2.9 requires "greenlight per clip after it is seen in the game"; this isolated review is the motion check before a combat integration pass.

| Cut | Drawings per sequence | Review duration | Contact (zero-based) |
| --- | ---: | ---: | ---: |
| Do, horizontal midsection sweep | 19 | 2675 ms | 4 |
| Horizontal neck-height sweep | 20 | 2795 ms | 5 |
| Kote, rising vertical hand-height cut | 20 | 2795 ms | 4 |
| Men, rising vertical head-height cut | 20 | 2795 ms | 5 |

The neck sweep follows the user's requested horizontal path; it is not labelled a traditional diagonal kesa kata. The vertical cuts are rising from the sheath, not a second overhead attack after unsheathing. The supplied Samurai Shodown image informed silhouette changes and torso rotation, principally the revised do cut. Hiro's design and painted style are retained; the reference character, costume and pixels are not shipped.

All four share eight no-look noto drawings. Three intermediate guide poses were repainted so the left hand contacts nearer the base, then the middle, then the tip before insertion. The remaining five original recovery drawings are retained. The repaired sheet has two clipped hair-edge pixels in its unused frame 0; that frame is not adopted. All adopted drawings pass source-edge and padded-canvas bounds checks. A controlled wrist turn is used rather than releasing the sword. This review does not certify historical or martial-arts accuracy: check the hand, blade path, scabbard and transitions visually.

There are **55 distinct adopted drawings**, reused as **79 frame references** across the four clips. No interpolated or duplicated images are counted as new drawings. Source poses are registered with a fixed body reference per sheet, boot anchor and common ground line; sword reach never determines body scale. Connected drawings are isolated rather than cropped at assumed grid boundaries, preserving swords extending into empty gutters. The discarded first four-column grid had neighboring-frame overlap and is excluded.

Generation: built-in `image_gen`, **13 requests** including rejected/layout drafts, a targeted effect edit and the three-pose noto repair. No ElevenLabs calls. Prompts and generated-output references are in `prompts.json`; source masters and rejected drafts are in `C:/Users/charl/The Sorcerer Sword ARPG/adventurer-expeditions-source-art/astra-v10/hiro-draw-cuts-20261016/`. Reference records are retained there. Do not pack these review atlases into a website release until the motion is approved and integrated.

Technical verification: `python tools/build_iaido_review_20261016.py` checks source bounds, eight components per source, unique per-clip frames and padded registration. `node test/browser_iaido_cuts_review.js` checks all four sheets, contact/noto navigation, frame stepping, hand zoom and a 390×844 layout. Transparent checkerboard screenshots are in `test/reports/iaido-cuts-20261016/`. No game regression run is claimed for this art-review-only pass.

Form reference consulted: [All United States Kendo Federation — Iaido Judging Points](https://www.auskf.org/department/iaido/iaido-judging-points), especially the timing of nukitsuke as the sword leaves the saya and the use of sayabiki. The requested game variants remain stylized interpretations, subject to the user's motion review.
