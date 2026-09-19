# Hiro painted animation source — Astra v1

Created 2026-09-19. This extends the original task after the user explicitly reminded us that **Hiro is also a character who needs art**.

**Delivered: 23 selected action sheets, containing 128 painted key-frame poses, plus a three-view full-body reference.** Three superseded attempts remain as documented source history. All selected image files decode correctly and were visually inspected.

This is **painted source coverage, not a claim that finished animations run in the game**. Fable's extraction, registration, timing, playback and final contact review remain necessary. Existing runtime files and original Adventurer assets were not edited.

## Location and manifest

- Selected PNGs: `assets/expedition/astra-v1/heroes/hiro/`
- Machine-readable preferred selection: `assets/expedition/astra-v1/heroes/hiro/manifest.json`
- Exact prompts and generation source paths: `docs/art/astra-v1/hiro-prompts.json`

The manifest exposes `basePath`, `reference` and `clips[]`; each clip has its preferred `file`, frame count, nominal grid, dimensions, byte size, SHA-256, pairing flag, source status, candidate contact/release frames and notes. **Read preferred file names from this manifest rather than globbing the folder**, because the first parry/riposte/hit attempts are superseded.

There are **48,601,228 bytes** of selected PNG masters including the reference. These are production sources. Do not add them unprocessed to the initial browser download. Generate cropped/compressed atlases and measure their runtime budget during intake.

## Character identity

The starting identity plate was `assets/anime/v2/runtime/hiro_cyber_20260916.webp`, inspected before generation. It has a faceless head and torso because the existing renderer composes face features.

The new complete reference preserves Hiro's dark-brown skin, purple loc topknot and shoulder-length silver-cuffed locs, temple implant, graphite lacquered lamellar samurai armor, narrow violet lighting, muted gold fittings, purple waist sash, under-robe, katana and left-hip scabbard. It extends the design with black trousers, armored shin guards and split-toe boots. The face now has visible brown/hazel eyes and natural facial features.

`hiro-reference.png` contains a drawn guard view, a sheathed standing view and back three-quarter view. These are a **proposed production reference**, not a claim of user approval. Root may present the reference for review alongside the complete set.

The method is full-image painted animation poses at the reference's illustrated fidelity. No skeleton rig, cutout body-part puppet or simple pose transforms were used to create the poses.

## Selected frame coverage

Storyboard ordering is one-based, left to right then top to bottom. For engine intake the manifest supplies **zero-based, clip-local** `contactFramesZeroBased` and `releaseFrameZeroBased`; use those fields instead of the legacy one-based `*Proposed` fields. Every clip also has `durationMsDraft`, `impactDraft`, and `timingGreenlit: false`. Grids describe the intended layout; use custom per-frame bounds where an extended blade or effect approaches a nominal cell boundary.

| Clip | Preferred source | Frames | Nominal grid | Contents |
|---|---|---:|---|---|
| `idle` | `idle.png` | 4 | 2 × 2 | Hiro |
| `walk` | `walk.png` | 8 | 4 × 2 | Hiro |
| `draw` | `draw.png` | 8 | 4 × 2 | Hiro |
| `short-draw` | `short-draw.png` | 4 | 2 × 2 | Hiro |
| `slash-l1` | `slash-l1.png` | 6 | 3 × 2 | Hiro |
| `slash-l2` | `slash-l2.png` | 6 | 3 × 2 | Hiro |
| `slash-l3` | `slash-l3.png` | 6 | 3 × 2 | Hiro |
| `roll` | `roll.png` | 6 | 3 × 2 | Hiro |
| `victory-sheath` | `victory-sheath.png` | 8 | 4 × 2 | Hiro |
| `kneel` | `kneel.png` | 4 | 2 × 2 | Hiro |
| `aura-l1` | `aura-l1.png` | 4 | 2 × 2 | Hiro |
| `aura-l2` | `aura-l2.png` | 4 | 2 × 2 | Hiro |
| `aura-l3` | `aura-l3.png` | 4 | 2 × 2 | Hiro |
| `bite-leg-paired` | `bite-leg-paired.png` | 10 | 5 × 2 | Paired Hiro + wolf |
| `bite-arm-paired` | `bite-arm-paired.png` | 10 | 5 × 2 | Paired Hiro + wolf |
| `finisher-l1-paired` | `finisher-l1-paired.png` | 3 | 3 × 1 | Paired Hiro + wolf |
| `finisher-l2-paired` | `finisher-l2-paired.png` | 3 | 3 × 1 | Paired Hiro + wolf |
| `finisher-l3-paired` | `finisher-l3-paired.png` | 3 | 3 × 1 | Paired Hiro + wolf |
| `intercept` | `intercept-v2.png` | 6 | 3 × 2 | Hiro |
| `riposte` | `riposte-v2.png` | 6 | 3 × 2 | Hiro |
| `hit-short` | `hit-short-v2.png` | 3 | 3 × 1 | Hiro |
| `counter-l2` | `counter-l2.png` | 6 | 3 × 2 | Hiro |
| `counter-l3` | `counter-l3.png` | 6 | 3 × 2 | Hiro |

### Motion decisions

- **Draw:** controlled thumb release and extraction into an alert guard. **Short draw:** abbreviated ready motion for later waves.
- **Victory:** held finishing stance, checks the road, guides a clean blade into its sheath, then relaxes. No blood-flick.
- **Slash:** single cut at L1, crossing two-cut motion at L2, dash/afterimage plus broad sweep at L3.
- **God Aura:** narrow ground ring at L1, projected half-shield at L2, crest/fan and stronger radial energy at L3.
- **Counter:** separate intercept and riposte at L1; L2 is a two-beat parry/riposte; L3 pivots into a broad returning sweep.
- **Roll:** crouch, tuck/inversion, landing and right-facing recovery rather than a rotating standing cutout.
- **Paired bites:** the wolf grips armored shin or forearm and follows Hiro's weight transfer through release, followed by a grounded recovery. There is no visible puncture, open wound or blood.
- **Finishers:** three painted paired wolf encounters with escalating single-cut, crossing-cut and dash presentation. The wolf remains whole and resolves into stylized defeat light. These are **quadruped finisher variants only**; they do not supply Hiro-specific plant/human finishers.

The wolf identity was drawn from `assets/expedition/astra-v1/beasts/wolf_reference.png`, inspected before use. Both actors are painted together within each bite or finisher frame. Keep that paired composition together in playback.

## Visual review and corrections

The first hit sheet lost the drawn sword during recoil. `hit-short-v2.png` corrects this: the katana remains in Hiro's hand and his other arm braces/protects.

The original five-column intercept/riposte sheets crowded adjoining cells. Preferred `intercept-v2.png` and `riposte-v2.png` use roomier three-by-two layouts and add a sixth settling pose. The old five-frame sources are explicitly superseded.

All 23 selected sheets have the intended pose count, a complete recognizable Hiro, and non-graphic action. The reference and broad sequence progression are visible. **This is not yet a per-pixel animation QA pass.** Known intake risks:

1. **Registration and scale vary between poses.** Align soles/root, normalize body scale and preview at 0.25× and normal speed before greenlight. Do not simply divide into equal cells and play.
2. **Some sword/cloth/effect extents are close to nominal cell edges.** Intercept's raised contact blade especially needs an edge inspection; use a dedicated repaired frame if a tip is clipped, never hide it with camera zoom.
3. **The walk poses need gait validation.** Eight poses exist, but some passing/contact phases are subtle and may not form a convincing seamless alternating walk without a pose correction.
4. **Scabbard and weapon continuity need final frame inspection.** Small hilt-like fittings from the original reference sometimes read as an extra weapon. Clean any distracting apparent duplicate or blade reversal before shipping.
5. **Gray backgrounds are opaque and not pixel-uniform everywhere.** Keying must preserve dark armor edges, locs, silver blade and translucent effects; there is no delivered transparent atlas yet.
6. **Effects are painted into several source poses.** Do not add a second full-intensity arc or aura on top of them. Decide at intake which effects remain baked and which are separated/replaced.
7. **Wolf scale and grip positions need final comparison to the registered hero.** Candidate contact/release indices in the manifest follow the storyboard, not a verified live collision tag.
8. **Expression and costume micro-detail may crawl across frames.** Fix any visible shimmer after sequencing; static image review cannot certify smooth playback.

## Contact and impact review starting points

These values are **proposed starting points only**, not final `X.impact` greenlight values. GDD §10.1 requires tuning against the registered painted animation. No runtime values were changed.

| Motion | Hit-stop | Flash (alpha / color) | Camera shake amplitude | Knockback suggestion |
|---|---:|---|---:|---|
| Slash L1 | 60 ms | 0.10 / pale violet | 0.0015 | 12 px, Quad.Out |
| Slash L2 | 70 ms at second hit | 0.13 / pale violet | 0.0020 | 18 px, Quad.Out |
| Slash L3 | 85 ms at sweep | 0.16 / pale violet | 0.0025 | 24 px, Cubic.Out |
| Intercept | 45 ms | 0.08 / warm gold | 0.0010 | 4 px recoil, Quad.Out |
| Riposte / Counter L2 | 65 ms | 0.12 / pale violet | 0.0018 | 14 px, Quad.Out |
| Counter L3 | 80 ms | 0.14 / pale violet | 0.0024 | 20 px, Cubic.Out |
| Hiro hit reaction | 55 ms | 0.06 / white | 0.0012 | 8 px, Quad.Out |
| Paired grip | 60 ms at grip only | 0.05 / white | 0.0010 | paired draw governs motion; no independent actor drift |
| Finisher snap | 140 ms | 0.16 / warm violet-white | 0.0030 | paired draw governs motion; aftermath drift ≤18 px |

For paired art, adding independent knockback to one actor would break the painted grip or contact. Move the whole pair only when the composition calls for it. Keep reduced-motion behavior in the existing code path. A finisher aftermath dissolving the wolf is only for a resolved lethal outcome; a non-lethal boss skill needs a separate intact recovery, not this defeat frame.

## Scope still beyond this delivery

- Alternate victory rotations 2/3 and a distinct short sidestep were optional later v0.5 work and are not included here.
- Hiro plant and human paired finisher sets are not present. Bram's separate four-class set cannot be relabeled as Hiro because the hero is part of every paired frame.
- No live integration, transparent atlas, per-frame measured root/contact coordinates, mobile playback check or final visual greenlight is claimed.
- No new voice or music was generated; existing recordings remain untouched.

## Generation provenance

All sheets were produced with the built-in `image_gen` tool using the original identity plate, the new complete model reference and (for paired clips) the project's wolf reference. No API/CLI fallback was used. Exact prompts for every attempt, including the selected corrections, are saved in `hiro-prompts.json`. Generated originals remain in the Codex generated-images directory; project copies are fully self-contained.

The original game at `../adventurer` was not changed.
