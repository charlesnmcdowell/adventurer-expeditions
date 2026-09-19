# Astra v1 — painted effects and skill icons

Date: 2026-09-19. Scope: GDD v0.7 §15.2 items 5–6. Owner of source art: Astra; extraction, trimming, registration, packing and runtime hookup: Fable.

## Delivered

Five original painted RGBA PNG source sheets, containing **48 useful cells: 16 combat effects, 29 skill/perk icons, and 3 tier rims**. One additional Sable cell is deliberately empty.

These are **source artwork, not packed runtime atlases**. Nothing in the game has been wired to them, and no file in the original Adventurer game was changed.

| Sheet | Actual source size | Layout | Useful cells |
|---|---:|---|---:|
| `assets/expedition/astra-v1/effects/combat-effects-source.png` | 1254 × 1254 | 4 × 4 | 16 |
| `assets/expedition/astra-v1/icons/bram-skills-source.png` | 1774 × 887 | 4 × 2 | 8 |
| `assets/expedition/astra-v1/icons/nyx-skills-source.png` | 1774 × 887 | 4 × 2 | 8 |
| `assets/expedition/astra-v1/icons/sable-skills-source.png` | 1774 × 887 | 4 × 2 | 7 |
| `assets/expedition/astra-v1/icons/hiro-skills-tiers-source.png` | 1254 × 1254 | 3 × 3 | 9 |

Source PNGs total **9,444,664 bytes**. They retain full generation quality and provenance and should not be added wholesale to the initial download. Fable should crop the consumed cells, optimize them and load non-opening content when needed.

The built-in generator returned the sizes above rather than the sizes requested in the prompts. Do **not** slice at a hardcoded 512-pixel interval.

## Cell map

Rows and columns below are one-based, read left to right.

### Effects — 4 columns

| Row | Column 1 | Column 2 | Column 3 | Column 4 |
|---|---|---|---|---|
| 1 | katana_arc_narrow | katana_arc_cross | katana_arc_broad | hiro_afterimage |
| 2 | aura_level_1 | aura_level_2 | aura_level_3 | fire_bolt |
| 3 | ice_bolt | lightning_bolt | status_bleed | status_poison |
| 4 | dust_skid | impact_spark | defeat_light | shield_ripple |

The three arc silhouettes and three aura constructions offer genuine visual tier differences rather than only tint changes. Bolts point right and may be mirrored. The afterimage is an abstract purple motion echo; it is an accent behind the actor, not a replacement for a frame of that specific hero.

Bleed is a symbolic ruby slash/droplet badge. It is not a blood spray. Poison is an emerald drop/fang badge. Defeat is an upward light-and-mote texture without a corpse.

### Bram — 4 columns

| Row | Column 1 | Column 2 | Column 3 | Column 4 |
|---|---|---|---|---|
| 1 | shield_wall | cleave | bulwark | taunt |
| 2 | sunder | stand_fast | momentum | arena_champion |

### Nyx — 4 columns

| Row | Column 1 | Column 2 | Column 3 | Column 4 |
|---|---|---|---|---|
| 1 | venom_fang | aimed_shot | opportunist | snare |
| 2 | smoke_bomb | marksman | sniper | septic_sanguine |

### Sable — 4 columns

| Row | Column 1 | Column 2 | Column 3 | Column 4 |
|---|---|---|---|---|
| 1 | fire_bolt | spark | arcane_focus | frost_touch |
| 2 | ember_lash | pyromaniac | lightning_king | EMPTY |

### Hiro and tier rims — 3 columns

| Row | Column 1 | Column 2 | Column 3 |
|---|---|---|---|
| 1 | katana_slash | god_aura | counter_attack |
| 2 | finisher | lone_wolf | expedition_riposte |
| 3 | tier_basic | tier_intermediate | tier_advanced |

The bronze, silver and gold rims have one, two and three lower inset gems respectively, so the progression is not communicated by color alone. Centers contain actual transparent pixels. Crop rims separately, normalize their outer diameter, then place the icon behind the rim. Keep cooldowns, labels, level numbers, locked/affordable states and tutorial highlights as code/UI overlays.

The icon IDs were checked against `js/expedition/heroes.js` and `js/expedition/data.js`; meanings were checked against `js/data/skills.js`. They cover all current starting and trainer skills/perks of Bram, Nyx and Sable, plus Hiro's four signature skills, lone_wolf and expedition_riposte. Some of these are hidden auto/perk entries rather than clickable HUD abilities; delivery of an icon is not an instruction to change the HUD.

## Exact source coordinates

`effects-icons-regions.json` is the machine-readable coordinate map. Each rectangle is `[x, y, width, height]`, origin at the source top-left, in **actual source pixels**. The rows differ slightly from a mathematically even grid to keep the rendered silhouettes intact.

These are **intake regions**, not already greenlit runtime frame boxes. Sparse soft glow may touch a neighboring region, especially on the FX sheet. Inspect the crop on both a light and dark background, isolate only that subject's fringe if needed, then trim and add atlas extrusion/padding. Do not cut a rim or blade simply to maintain an equal grid. Keep the original source untouched.

## Visual review and technical checks

- All five sheets were visually inspected at generation completion.
- They use painted metallic materials and sharp anime light/shadow shapes consistent with the existing Hiro atlas; not flat glyphs, emoji or UI screenshots.
- All 29 requested skill/perk subjects are present and visually distinct. Sable's last square is intentionally empty.
- All PNGs are RGBA with nontrivial alpha. Icon alpha range is 0–255. FX alpha range is 0–254, preserving translucent effects.
- Icons contain no baked text, progress numbers or promotional branding.
- No visible flesh wound, gore or graphic injury is depicted.
- Tier rims have hollow transparent centers and the intended one/two/three lower-gem treatment.
- `effects-icons-validation.json` records actual dimensions, byte counts and SHA-256 hashes.
- No browser, gameplay or runtime integration test was run for these unhooked source assets. The final cropped icons must still be checked at real HUD size and on mobile.
- These are individual effect textures, not frame-by-frame effect movies. Fable combines them with the painted actors and existing beats layer. They do not replace the paired hero/opponent contact drawings.

## Suggested presentation use

Treat these as starting art-direction notes to verify alongside the finished actor clips; they are not a declaration that impact tuning is approved.

- Katana arcs: keep the bright crescent at the actual blade contact frame, not during the full wind-up. Narrow → intersecting → broad fan gives the three levels distinct silhouettes.
- Auras: anchor ellipse to the actor's ground plane; the upright fringe can pulse gently. Do not let a full-intensity aura obscure feet/contact.
- Fire, ice, lightning: use separate projectile and impact timing. Their shape/color alone must not become the sole indication of status.
- Dust belongs at a planted foot, skid or landing; shield ripple belongs at the shield/contact point.
- Spark and defeat light are accents, not whole-screen flashes. Avoid repeatedly flashing the full battlefield.
- Keep ordinary icon interiors uncluttered and apply one reusable tier rim; there is no need to generate every skill at every tier as a separate painted icon.

## Provenance and exact prompts

Generated with the **built-in image_gen tool**, not the CLI/API fallback. No external source artwork was downloaded. The existing local `assets/anime/v2/runtime/hiro_cyber_20260916.webp` was inspected for palette/style; it was not passed as an edit target. All five sheets were generated as new original source art.

The exact five submitted prompts are preserved verbatim in `effects-icons-prompts.json` under keys `fx`, `bram`, `nyx`, `sable`, `hiro`.

Original generated source paths, retained in place:

- Effects: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-6b7a50bb-52ee-4dc6-97d2-c5341d373c66.png`
- Bram: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-3c454086-d5dd-44b7-8e65-e5f77d54e374.png`
- Nyx: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-0d478e08-16cf-4bba-9d6e-803635e211c0.png`
- Sable: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-7a0f7cb9-c1b8-4298-a1fa-acf248e9f438.png`
- Hiro/rims: `C:/Users/charl/.codex/generated_images/01a0b9f4-2912-7fd3-b1f1-8cecb7fe52c4/exec-2c0033fb-32c4-46fa-9391-88c30394b182.png`

