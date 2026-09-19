# Astra v1 — shared human combat source set

Date: 2026-09-19. GDD v0.7 §15.2 item 4.

## What exists

**25 complete painted key poses in five PNG source sheets**, using one adult female street-leather bandit exemplar. The character follows the current `bandit_b` direction in `js/expedition/campaign.js`: brown skin, dark braid, street outfit. Existing references inspected were `wardrobe_f3.webp` and `heads_f_styles1.webp` (street outfit and head 9). The generated face/full-body costume is an interpretation of those assets, not a pixel-identical composite.

She wears a fitted long charcoal-brown leather coat over a cream shirt, belts, trousers, tall boots and steel forearm bracers. The short curved sword stays in the right hand. Camera is eye-level; she faces left, the enemy-facing direction.

| Source | Frames | Actual size | Alpha / intake state |
|---|---:|---:|---|
| `assets/expedition/astra-v1/humans/bandit-approach-source.png` | 6 | 1536 × 1024 | RGBA, residual dark vignette; matte cleanup required |
| `assets/expedition/astra-v1/humans/bandit-slash-source.png` | 6 | 1536 × 1024 | RGBA, residual dark vignette; matte cleanup required |
| `assets/expedition/astra-v1/humans/bandit-cast-source.png` | 6 | 1536 × 1024 | **RGB**, foreground extraction required |
| `assets/expedition/astra-v1/humans/bandit-hit-source.png` | 3 | 2172 × 724 | Isolated RGBA |
| `assets/expedition/astra-v1/humans/bandit-down-source.png` | 4 | 1254 × 1254 | Isolated RGBA with translucent defeat light |

These are **painted source keys, not a finished in-game animation set**. Extraction, registration, texture packing, playback and final greenlight remain. No runtime files were changed.

## Choreography

Frames below are one-based; the JSON uses zero-based indices.

- **Approach:** left contact → weight sink → passing → opposite contact → weight sink → passing. Six-frame loop. Sword carried low, braid/coat lag behind the movement.
- **Slash:** guard → strong rear wind-up → extended leftward strike/contact → downward overshoot → recover → guard. Contact is frame 3. The twist, extended arm and swept cloth carry the hit; no opponent or wound is baked in.
- **Cast:** guard → gather → prepare → left-palm release → overshoot → recover. Spell release is frame 4. Right hand retains the sword. This is the common human casting motion exemplar, not a proposal to add a spell to the bandit kit.
- **Hit:** compressed recoil → rear-foot brace → guarded recovery. The face grimaces, torso compresses and braid trails opposite the hit; no blood.
- **Down:** knees buckle → kneel → settle into gold/violet light → dissolve. No corpse or graphic injury.

## Intake coordinates and timing

`humans-regions.json` provides exact source rectangle coordinates and frame order. Coordinates are `[x,y,width,height]`, top-left origin, actual source pixels. Approach/cast use a 3 × 2 layout. Hit is 3 × 1. Down is 2 × 2.

**Slash is not safe to slice as an equal grid:** the contact-frame sword extends left of x=1024. Frame 3 has rectangle `[960,0,576,512]`; frame 2 ends at x=960. Use the manifest and preserve the blade tip. Registration must keep the actor root consistent even though crop widths differ.

The JSON contains suggested holds only: approach 570 ms per cycle, slash 635 ms excluding hit-stop, cast 610 ms, hit 310 ms, down 720 ms. Verify these at the actual actor height after extraction. Root motion remains runtime-owned; do not translate the character twice.

Suggested first-review impact values for the slash are **55 ms contact hold**, warm-white flash alpha **0.10**, camera amplitude **0.002**, and **18 px** victim drift at the demo's 240-pixel human height with cubic ease-out. These are proposals for composition review, **not final clip greenlight**. Cast has no body-contact hit-stop by itself; projectile impact should use its own effect/target reaction. Approach/down should not shake the screen.

## Quality review and limitations

- Every source sheet was viewed.
- Initial approach output lacked convincing passing poses. A second generation corrected frames 3 and 6 into raised-knee passing poses. Opposite-leg phasing, root drift and foot sliding still need loop playback review after extraction.
- Initial cast frame 5 had an extra third arm. It was repaired with a targeted image edit; the selected source visibly has two arms. The rejected anatomy draft is not copied into the project.
- Body/face/outfit identity is visually consistent enough for an intake prototype. Fine buckle placement, facial proportions and coat hems are not guaranteed pixel-locked across generated drawings. Check those at game size before greenlight.
- No cropped feet/head in the inspected key poses. Contact sword region is widened as documented.
- **The generator did not reliably honor transparent-background requests for the six-frame sheets.** A direct background-removal attempt and a chroma-matte attempt retained the dark vignette. That failed matte attempt is not selected. Approach/slash contain alpha but retain backdrop residue; cast is RGB. Do not call these three files ready for direct compositing.
- The cast's palm light is baked into its source. Extract its soft edge carefully; don't hard-key away the hand lighting.
- Hit/down are isolated RGBA, but still require registration and testing against an actual background.
- No in-game playback or performance claim is made. These images were not imported into Phaser.
- **A single full-painted human set cannot change into every guard, mage, bandit or rival just by swapping a bust.** The current set proves one silhouette and choreography. Other clothing/heads require individually painted variants or explicit acceptance of reusing this same bandit model. Do not silently erase character identity or revert to puppet assembly.

Fable should mask the three affected sheets, trim/register every frame, add atlas padding, attach contact/release tags, and review a loop and one attack at full and quarter scale beside the existing plates. If the matte or passing cycle fails review, regenerate only those frames before claiming item 4 production-ready.

## Provenance

Built-in `image_gen` only; no external downloaded art or API fallback. Exact prompts, including the pose/anatomy corrections and unsuccessful matte request, are in `humans-prompts.json`. Dimensions, mode, alpha bounds and SHA-256 hashes are in `humans-validation.json`.

Selected original outputs, retained at generation locations:

- Approach corrected: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-67e52588-46da-46c9-9ada-e144037d9023.png`
- Slash: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-8eaa1210-3a54-4fbf-b229-35fa002a2afb.png`
- Cast corrected: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-2c8ef1a1-fc8d-45f9-aa69-cd0fe8d61b15.png`
- Hit: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-71de99c7-78c8-473f-aa65-3af252a12ddc.png`
- Down: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-6dd22053-90c4-4148-a3ae-5bcac7f5f36e.png`

Source art stays within the Expeditions folder. Original Adventurer was not modified.

