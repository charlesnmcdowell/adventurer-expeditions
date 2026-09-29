---
name: sprite-cleanup-pilot
description: Diagnose and polish existing game sprite animations with a small technical cleanup pilot before spending on replacement art. Use for neighboring-frame bleed, rectangular mattes, slipping ground anchors, or size jumps between normal and paired finisher animations.
---

# Sprite cleanup pilot

Preserve approved artwork and motion. Diagnose crop, alpha, registration, playback and scale faults before proposing new frames or regenerated sheets. This workflow was approved by the Adventurer: Expeditions user after the September 28, 2026 pilot. It does not imply that every art defect is technically repairable.

## Start small and preserve the baseline

- Read the project's art standard, current GDD and changelog; inspect the actual runtime manifests and animation code. Do not assume an old handoff still describes the build.
- Check Git state, review differences and follow the project's checkpoint convention before writing. Preserve source masters. Work only in the authorized game directory.
- Inventory clips once with a script. Record crop rectangles, atlas page dimensions, alpha, pivots/ground anchors, clip timing, contact/release events and normal/paired scales. Corner-alpha flags and connected components are leads, not proof of bad art.
- Select a few examples covering distinct suspected causes, rather than reprocessing every sheet. Capture baseline playback with repeatable encounters and an isolated save. Keep normal-speed evidence as well as slow review.

## Diagnose and repair the right layer

| Symptom | Check first | Appropriate technical repair |
|---|---|---|
| Neighbor pose enters a frame | Authored grid vs actual paint bounds; atlas sampling/padding | Measured per-frame crop rectangles, narrowly scoped fragment masks, padded packing |
| Rectangular backing despite RGBA | Actual alpha values and semitransparent neutral matte | Targeted segmentation; retain soft effects separately; inspect on several contrasting backgrounds |
| Feet slide or body jumps | Per-frame ground/contact anchors and trimmed-frame offsets | Register frames to a shared ground line and body reference; preserve intentional lunges and hops |
| Size changes in a finisher | Borrowed-sheet standing reference, pivot, and embedded hero/foe proportions | Apply measured clip-specific uniform scale only during the paired clip |
| Size changes on approach/return | Normal run borrowing finisher scale/origin | Restore the actor's native transform before normal locomotion and after completion/interruption |
| Motion still feels uneven | Anticipation, contact, release and recovery timing; missing poses | Tune supported timing carefully; identify specific missing artwork instead of assuming more frames solve it |

A broad gray threshold damaged the orc's metal armor in the approved pilot: reject such masks. GrabCut for solid figures plus a separate soft chroma mask for colored effects worked better there, but is not a universal recipe. Compare silhouettes, weapons, armor, shadows and effects at full size before accepting a mask. Never erase anatomy merely to remove a background.

Uniform scaling cannot fix a wrong hero-to-monster proportion painted inside one paired image. Record those cases for focused art repair. Do not invent limb detail, interpolate new poses, or regenerate sheets as part of a technical-only pass. If new art is warranted, name the exact frames and cost/scope before expanding the task under the user's authorization.

## Integrate without losing the fix

- Preserve frame order, timing, contact/release/disappear indices, damage and gameplay semantics unless the requested fix specifically concerns them.
- Check scale/origin restoration on success, cancellation, death and scene changes. Do not apply borrowed transforms while playing the actor's native run or idle.
- Keep unaffected frames visually identical: compare alpha and visible RGB, ignoring arbitrary RGB under fully transparent pixels. Lossless repacking may cost bytes; measure that tradeoff.
- Update atlas metadata, runtime registration, cache versions and the shipping allowlist together. Keep originals available for rollback but exclude unused duplicates from shipping.
- Record how future rebuilds preserve the correction. A script tied to a historical commit is a case study, not a safe blanket rebuild of newer art.

## Verify and stop at the agreed scope

Run focused animation lifecycle/contact tests, real browser playback, and shipping closure checks. Capture matched before/after clips. For paired animation, use the real finisher lifecycle rather than calling a raw clip that bypasses normal cleanup. Measure cold initial download through first gameplay and audio unlock after repacking; total package size is a different measure.

Report repaired cases, tested cases, remaining visual limitations, byte changes and any generation used. Keep the next repair shortlist separate. Heuristic flags disappearing is not evidence that all animations are polished. Offer the pilot for play-test before scaling up an expensive art pass unless the user already authorized that expansion.

## Adventurer: Expeditions reference

Runtime repository: `C:/Users/charl/The Sorcerer Sword ARPG/adventurer-expeditions`. The adjacent `adventurer` repository is the original live game and must remain untouched by an Expeditions task. Reuse existing source masters in `adventurer-expeditions-source-art`; do not copy large art collections into this skill.

Read these repository files only when applying this workflow there:
- `docs/SPRITE_CLEANUP_PILOT_20260928.md`: approved case study, dependencies, precise corrections and limitations.
- `tools/sprite_cleanup_pilot.py`: deterministic pilot implementation. **Inspect before running:** it uses baseline `a0589af` and is scoped to plant/orc/Alpha. Do not overwrite newer masters or metadata by blindly invoking `--apply`.
- `test/browser_sprite_cleanup.js`: isolated captures plus native walk-scale and restored-texture assertions.
- `test/actor_animation_lifecycle.js`, `test/finisher_pacing.js`, `test/browser_finishers.js`: lifecycle, timing and real combat checks.
- `test/ship_budget_contract.js`, `test/browser_startup_budget.js`: asset closure and measured startup bytes.
- `docs/art/cleanup-pilot/index.html`: before/after evidence. Repair commit `5436d49`.

The approved result used no image generation. Local startup after audio unlock measured about 15.43 MB at that time; remeasure current builds. Remaining candidates included Alpha pin/parry proportions, moss giant pairs, travel frame boundaries and clipped orc flame edges. Approval of the pilot is not proof those remaining issues are fixed.
