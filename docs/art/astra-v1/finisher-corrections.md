# Bram finisher framing and anatomy corrections

Date: 2026-09-19. Follow-up QA of the four root-produced paired finisher sheets.

## Selected replacements

Files are beside the original sheets in `assets/expedition/astra-v1/heroes/bram/`. Originals were retained. **Use the `_clean` versions for intake**.

| Replacement | What was corrected |
|---|---|
| `finisher_quadruped_clean.png` | Entire paired groups reduced and reframed. First-panel wolf rear paws and tail restored; Bram sword and coat fit within every panel. |
| `finisher_plant_clean.png` | First-panel coat tail restored and padded; plant roots, curling vines, sword and scattered leaves stay inside each panel. |
| `finisher_human_clean.png` | Extra third arm/hand removed from the first-panel bandit. All paired poses reduced together; full lowered sword and coat hem visible in the kneeling aftermath. |
| `finisher_boss_clean.png` | First-panel boss hind legs and tail restored; all panels padded. An unwanted second tail introduced during reframing was removed in a separate targeted correction. |

All four files are **2172 × 724 RGB source boards** with a plain white background. They are not transparent runtime atlases. Foreground extraction, edge cleanup, registration and packing remain Fable's intake work.

## Review findings

Each selected output was viewed at full-sheet resolution. The bodies, feet, heads, clothing tails, weapon tips, wolf tails and major foliage now remain within their respective panels with visible white margins. No anatomy touches the outside canvas edge. The strongest clipping cases in the original boards are repaired.

The human first panel visibly contains two bandit arms: the raised sword arm and the arm extended behind. The previous low third hand beside her waist is gone. The final boss first panel has one continuous bushy tail behind the rump rather than the two tails introduced in the first repair attempt.

Both participants were kept together during each edit. The central impact poses retain the shield-to-wolf contact, blade-to-plant stalk motion, and crossed-blade/shield human interaction. No blood, open wound or gore was added.

Requested margins were approximate generation guidance, not a guarantee of exactly 12% padding. The actual rendered silhouettes fit; use the source as delivered rather than assuming uniform per-pose scale.

## Panel coordinates

The boss sheet's generator moved its separators, so it **must not be sliced into three 724-pixel squares**.

Suggested intake rectangles `[x,y,width,height]` that exclude the divider strokes and outermost border:

| Sheet | Wind-up | Contact | Aftermath |
|---|---|---|---|
| boss_clean | [2,2,684,720] | [692,2,742,720] | [1440,2,730,720] |
| human_clean | [2,2,719,720] | [726,2,719,720] | [1450,2,720,720] |
| plant_clean | [2,2,719,720] | [726,2,719,720] | [1450,2,720,720] |
| quadruped_clean | [2,2,719,720] | [727,2,718,720] | [1450,2,720,720] |

Boss divider dark columns were measured at **688–689 and 1436–1437**. Human divider columns are **723 and 1447**. Other boards use approximately **723–724 and 1447**. Verify the matte crop before packing, especially pale defeat particles that blend into the white board.

Maintain one root coordinate for the **paired group**; don't independently scale or shift the opponent to compensate for different crop widths. Calibrate Bram's apparent height during playback and let the intended crouch/extension remain. Timing/contact greenlight belongs to the final paired clip, after extraction.

## Validation

`finisher-corrections-validation.json` records actual size, mode, byte count, SHA-256 and detected divider columns. The four selected files decode successfully. No runtime scene or manifest was changed by this repair task; the root agent owns Bram's manifest and timing data.

No in-game playback, transparent matte or final performance claim is made by this document. This closes the visible clipping/extra-limb source-art defects found in the four boards.

## Exact prompts and provenance

Built-in `image_gen` edits, using the original root-produced source boards as the reference targets. Exact prompts are saved in `finisher-corrections-prompts.json` (human, quadruped, plant, boss, boss_tail_correction). The last entry repairs the intermediate boss result.

Selected generated originals, retained in place:

- Human: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-77b7b707-ebc4-4a5e-92ee-d8ecf7250ed1.png`
- Quadruped: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-ed7b91db-2e0a-458c-a975-9cc04d54c702.png`
- Plant: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-9d7098ea-478f-4ee2-b830-92d0e409722d.png`
- Boss, after tail repair: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-eff368da-422c-4c1e-94d2-d067955c15bc.png`

