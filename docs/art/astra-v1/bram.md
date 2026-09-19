# Bram — first painted clip set

Created 2026-09-19 for GDD v0.7 §15.2. This is the first **source-art pass**, not an installed animation pack. Hiro has his own separate set; Bram does not replace him.

## Delivered artwork

Bram has 12 solo action sheets (68 drawings), two paired wolf reactions (16 drawings), and four paired finisher boards (12 drawings). Total: **96 selected source drawings**, plus the identity reference and retained superseded drafts.

He follows the existing starter duelist plate: dark brown skin, black locs, burgundy longcoat, gold piping, white collar, silver shoulder armor, straight sword and round shield. A full-body interpretation is necessary because the original is a bust; the composed in-game face still needs the final likeness comparison. This is **not his purchased Plate Harness outfit**.

| Clip | Preferred file | Drawings |
|---|---|---:|
| Breathing guard | idle_clean.png | 4 |
| Walk | walk_clean.png | 8 |
| Draw / ready | draw.png | 8 |
| Short draw | short_draw.png | 4 |
| Slash | slash_clean.png | 6 |
| Hit | hit_short.png | 3 |
| Roll | roll.png | 6 |
| Shield intercept | intercept.png | 5 |
| Riposte | riposte_clean.png | 6 |
| Shield invocation / cast | cast.png | 6 |
| Victory / sheath | victory.png | 8 |
| Kneel | kneel.png | 4 |
| Wolf leg grip and shake-off | bite_leg_a_clean.png + bite_leg_b.png | 10 |
| Wolf arm grip and shield release | bite_arm_clean.png | 6 |
| Wolf, plant, bandit, Alpha finishers | finisher_*_clean.png | 3 each |

All files are in `assets/expedition/astra-v1/heroes/bram/`. Machine-readable order, proposed holds, contact/release indices and impact values are in [bram-clips.json](bram-clips.json).

## Selection and corrections

The original idle/walk sheets had dark vignette backgrounds; their clean replacements use white. The walk replacement has more leg articulation. Riposte was redrawn into a six-key 3×2 board. Slash was reframed so the blade fits the canvas; exact custom extraction is still needed at one internal midpoint. The original leg-grip sheet had the wolf on the wrong side for the recovery sheet; `bite_leg_a_clean.png` keeps Bram left and wolf right.

The four finisher repairs fix clipped coat hems, weapons and wolf tails. The human wind-up's extra hand was removed, and a duplicate boss tail introduced during repair was removed. See [finisher-corrections.md](finisher-corrections.md) for exact panel rectangles. The arm grip correction restores the wolf's tail and keeps contact above the shield on Bram's left upper arm; see [bite-arm-corrections.md](bite-arm-corrections.md).

Retained originals are provenance/rejected alternatives, **not extra runtime variants**. Select the filenames in the manifest.

## Intake and remaining visual work

- Several boards are opaque white, and draw/roll retain colored mattes. None should be wired as a whole rectangular sprite. Isolate complete figures, preserve pale metal highlights, and inspect against both light and dark backgrounds.
- Layouts and margins are generated, not mathematically guaranteed. Use measured source regions. Avoid slicing blades or cloth at a nominal equal-grid boundary.
- Register planted feet and apparent body size across sheets. Different poses must not be individually normalized to the same bounding-box height; crouches should remain shorter. Keep one common ground origin.
- Body facing, shield decoration, sword length, loc shape and small costume details vary between drawings. The first playback review must catch any visible morphing; correct individual keys instead of hiding them under flash.
- Pair scale differs between the leg-grip and recovery boards. Both participants need a shared registration transform. Wolf teeth meet armored boot/upper sleeve; there is no blood or injury detail.
- One wolf finisher cannot represent a boar. One bandit finisher cannot represent every guard or rival. The hero and opponent both need to match the real encounter and equipped outfit.
- The full Plate Harness outfit set and final hand/foot contact approval are not supplied. Do not silently display starter clothes after a visual gear purchase.

Proposed timing and impact values are recorded for Fable to preview. They are **not final greenlight**: no sheet has played in Phaser, and no runtime combat code has changed in this pass. The source-art QA notes are in [bram-source-qa.md](bram-source-qa.md).

## Provenance

Built-in image_gen only. Local existing character/creature plates and newly generated references were inspected before use. Original outputs remain at the generated-image paths recorded in [bram-prompts.json](bram-prompts.json); the final slash/leg corrections are in [bram-final-corrections-prompts.json](bram-final-corrections-prompts.json). Finisher and arm corrections have separate exact prompt records linked above.

