# Bram paired arm bite — bounded correction

Generated and visually inspected 2026-09-19 with built-in image generation.

Preferred source: `assets/expedition/astra-v1/heroes/bram/bite_arm_clean.png`.

- 1536×1024, six paired complete drawings in a 3×2 row-major arrangement.
- 1,724,151 bytes; SHA-256 `e5eab43b9d5cc8c78d08978e82f493208b655137b99f4adbab2657ffd6337210`.
- Original `bite_arm.png` retained untouched. No runtime or other artwork changed.

## Corrected behavior and inspection

The clipped wolf tail in original frame 0 is now fully shown. All six frames visibly contain Bram's complete boots/sword and the wolf's paws/tail. Bram remains at the left, wolf at the right. The near/down hand retains the sword in every drawing, matching the reference's anatomical right hand; the forward/far left forearm retains its shield. No visible hand swap or extra weapon was found in this static review.

Choreography is explicitly **left upper-arm/sleeve contact above the shield**, not the sword arm. Zero-based sequence:

| Frame | Action |
|---|---|
| 0 | Wolf approaches the shield-side upper arm |
| 1 | Jaws close at the left upper sleeve above the shield edge |
| 2 | Sustained grip and braced reaction; forepaws on shield |
| 3 | Left-arm shield push; jaws visibly open and release |
| 4 | Wolf lands on the right; Bram regains support |
| 5 | Separation and guard restored |

There is no blood, torn flesh, or exposed wound. Coat, boots, dark skin, black locs, beard, and straight sword remain consistent with the reference.

## Remaining limitation — not fully approved

Two generation passes improved separation and complete silhouettes, but the tool **did not meet the requested 15% margin in every cell**. Approximate dark-pixel margin checks find minimum margins of 39, 40, 29, 39, 14, and 7 pixels across frames 0–5; 15% would require about77 pixels. None of the inspected figures is visibly cropped, but this is not an exact registered production sheet.

Fable must key the white background, extract complete pairs, add padding, preserve relative hero/wolf scale, and register a common ground/pivot. The second row's foot baselines differ from the first row. Do not blindly play each512pxcell without correcting registration. No image-processing or packing code was added by this task.

**Status: preferred uncropped source candidate; exact-margin and in-engine paired-contact approval pending.** Handedness passed static visual inspection, but grip occlusion, contact anchoring, release timing and continuous motion still need actual playback. Contact/release proposals are indices1/3; they must never add extra damage while the grip holds.

Exact prompts, original generated paths, measured bounds, and metadata are in `bite-arm-corrections-prompts.json`. The asset was produced with the built-in tool, not an external API runner.
