# Astra v1 art intake — Fable handoff

Inspected 2026-09-19. This is a read-only audit of the current integration points and source plates, plus intake requirements. It does **not** mark any artwork generated, approved, animated in-engine, or published. Consult the delivery inventory for the actual supplied files.

## Scope and isolation

- Work in `adventurer-expeditions` only. The sibling `../adventurer` is a read-only reference and must not be changed by art intake, asset sync, tests, builds, or publishing.
- GDD v0.7 is current. Its §10.1–10.3 and §15.2 govern presentation and priorities; v0.5 §5.4 supplies the earlier explicit frame counts. v0.5's Hiro-specific weapon actions are a reference budget, not an instruction to give Bram a katana.
- Astra supplies painted complete frames, identity references, effect/icon textures, backgrounds, and proposed timing notes. Fable implements intake and integration. No rigs, detached heads, body-part puppets, or cutout deformation. A contact sheet is source artwork, not a ready-to-run animation until extraction and registration are verified.
- Prefer the original music, voices, skill resolution, and sound bank. Art intake must not alter damage, combat timing rules, saves, or rewards to accommodate an image.

## Identity and source plates

All source paths below are relative to the Expeditions project.

| Subject | Exact source | Appearance to preserve |
|---|---|---|
| Bram's head | `assets/anime/v2/runtime/heads_m_styles1.webp`, frame 0; 500×500 top-left cell of 1000×1000 sheet | Dark brown skin, shoulder-length thick black locs parted/radiating back from the forehead, sparse mustache and short chin beard/stubble. This is **not Hiro** and has no purple hair. The source head has blank eyes/mouth because the existing portrait composes them; action frames need fully painted facial features. |
| Bram's travelling outfit | `assets/anime/v2/runtime/wardrobe_m2.webp`, frame 1; top-right 500×500 cell | Burgundy fitted longcoat, gold piping, white high collar/cravat, engraved asymmetrical metal shoulder, crossed dark straps/belts, black gloves and trousers, sword at the hip. Lower legs/full-body view must be authored consistently with this cropped plate. |
| Bram's purchased Plate Harness | Same sheet, frame 0; top-left cell | Silver segmented plate over burgundy, burgundy shoulder cape and gold-edged tabard. Outfit is a real purchase and visible upgrade. Do not silently show it before purchase or erase the difference afterward. |
| Dire Wolf | `assets/anime/v2/runtime/creatures_1.webp`, frame 0; top-left 512×512 cell of 1024×1024 sheet | Gray and white wolf; large dark spiked ruff, yellow eyes, heavy forequarters. Source faces left toward the player. |
| Cave Boar | Same sheet, frame 1; top-right cell | Heavy brown boar, upcurving ivory tusks, red eyes, bristly mane. |
| Thorn Lurker | Same sheet, frame 2; bottom-left cell | Rooted green twisting vine body with a large burgundy flower-mouth and yellow teeth. Its rooted lash differs from a quadruped lunge. |
| Alpha | Current placeholder reuses Dire Wolf frame 0, tint `0xb9b3c4`, height 330 | GDD calls for an authored boss design with heavier ruff and scarred muzzle. It is not completed by scaling the ordinary wolf. |

Bram is defined in `js/expedition/heroes.js` with `key:'bram'`, `head:5`, `seed:9101`, `startSet:'duelist'`, `set:'plate'`. Male head index 5 resolves through `js/ui/anime_identities.js` to `heads_m_styles1` frame 0. Body mapping is in `js/ui/anime_world.js`. His starting kit is Shield Wall, Cleave, and Bulwark; trainer offers Taunt, Sunder, Stand Fast, Momentum, and Arena Champion. Preserve his shieldbearer identity when adapting draw, intercept, and victory poses.

The exact rendered face also contains generated eye/lip choices from seed 9101. Capture the composed in-game portrait as the final face comparison; the blank head plate alone is insufficient to certify a match.

## Frame budget and names

The v0.5 first-fight table totals **71 hero frames + 38 wolf frames = 109** (rounded to about 110 in the GDD). v0.7 adds `cast` to the picked hero's required set and expands the roster; its full final total is therefore larger. Do not claim the old count covers every new action.

| Action | v0.5 frames | Current runtime name / intake note |
|---|---:|---|
| Guard idle | 4 | `idle`; loop needs explicit implementation |
| Walk | 8 | `walk`; all translation is on actor root |
| Draw / ready | 8 | `draw`; character-specific equipment and stance |
| Short draw | 4 | `short_draw` |
| Basic slash | 6 | `slash`; v0.5 calls it `slash_L1` |
| Short hit | 3 | `hit_short` |
| Bite and shake-off | 10 | Hero `bite_grip`, paired to wolf `bite`; old GDD frame 3 contact / 7 release are human-readable ordinals and need explicit conversion to zero-based metadata |
| Roll | 6 | `roll` |
| Intercept | 5 | `intercept` |
| Riposte | 5 | `riposte` |
| Victory / compose | 8 | `victory` |
| Down / kneel | 4 | `kneel`; deaths route through `down_fade` separately |
| Cast / shield invocation | Not specified | v0.7 requirement; record delivered count explicitly |
| Wolf idle / stalk | 4 | `idle`, `stalk` |
| Wolf run | 6 | `run` is not currently a placeholder method; `enter` handles entry |
| Wolf leap | 5 | `leap` |
| Wolf bite | 4 | `bite`; clamped poses originally specified as frames 2–3 |
| Wolf shake-off landing | 5 | `land_tumble` |
| Wolf dodge-miss landing | 4 | `overshoot_land` |
| Wolf parried landing | 3 | `land_beside` |
| Wolf hit | 3 | `hit_short` |
| Wolf defeat | 4 | `down_fade`; non-graphic light dissolve |

Additional current placeholder names include `enter`, `slash_wide`, `aura`, `stance`, `finisher`, `stagger`, boar `charge`, plant `lash`, Alpha `pounce` and `enrage`. Preserve or explicitly map every name consumed by `scene.js` and `beats.js`; a differently named art clip will otherwise fall back silently.

## Runtime gaps found before intake

These are findings for Fable, not changes made by this delivery:

1. **Animated object type:** `Actor` currently creates `this.img` with `scene.add.image`, but `playSheet` invokes `this.img.play`. A Phaser Image is not an animated Sprite. Convert the art-backed path to a Sprite or implement an explicit frame player before enabling sheets.
2. **No sheet assigned:** `scene.js` builds player, companions, and foes with portrait/creature textures and no `sheet` option. Loading a new atlas alone does not activate it.
3. **Release metadata is ignored:** the documented shape is `{ key, clips:{ name:{ frames, contact, release, fps } } }`. `playSheet` reads `frames`, `contact`, and `fps`, but resolves only on `animationcomplete`; it never dispatches `opts.onRelease`. The bite/shake-off path requires release alignment.
4. **First-frame contact:** current callbacks fire from `animationupdate`; contact on the very first displayed frame needs an explicit start-frame check. Use zero-based clip-local contact indices, not global atlas indices.
5. **Holds and loops:** current animation creation uses one uniform `fps` and `repeat:0`. Painted idle/walk loops, per-frame holds, smear durations, and wind-up/contact/aftermath timings need metadata/player support. Repeat-index tricks must not reapply damage.
6. **Movement and facing:** the actor has root translation, image offsets, ground pivot, and left/right facing. Full-frame art needs these registered consistently. Existing portrait scale/angle tweens should not stretch finished action drawings or double-translate baked-in movement.
7. **Paired finisher renderer absent:** the current `finisher` is one hero moving through a separate foe. v0.7 instead requires one clip with both characters. Temporarily hide both normal actors, play one paired clip at a shared ground anchor, then restore/fade according to already-resolved events. Never show duplicate figures.
8. **Impact table absent:** v0.7 requests per-clip `X.impact`, but current `beats.js` contains global/literal hit-stop, flash, and shake. Add that table and reduced-motion equivalents before applying final Astra tuning. Proposed numbers are not tested greenlight values until the actual frames play in-engine.
9. **Whole-scene staging drift:** v0.5 describes a foreground strip, while current `buildBand()` intentionally has no strip or foliage bar. Keep new background composition compatible with the current ground/shadow placement and HUD; do not cover actors with a new arbitrary strip.

## Painted intake contract

Each delivered clip should have an asset ID, character/outfit variant, source-reference paths, actual canvas dimensions, frame count/order, facing, scale reference, ground line, pivot, contact/release frame indices, loop policy, frame durations, and a completion status. Preserve original PNGs and generation provenance. Derivatives belong in the offshoot, never over the source plates.

Fable should:

1. Extract cells at measured sheet boundaries; do not assume a generator's output dimensions exactly match the prompt.
2. Key any flat background without eating similarly colored hair, metal highlights, or VFX. Inspect edges on both dark and light backgrounds. Avoid opaque baked checkerboards.
3. Register all complete frames to one stable foot pivot/ground line. Trimming each frame to its own bounds without origin metadata causes foot sliding, size pumping, and jumps.
4. Pack a consistent atlas with padding and explicit frame rectangles. Save the original full canvas and registration offsets.
5. Preview every frame next to its neighbors and approved reference at 1× and 0.25×. Inspect blade length, loc count/mass, face, skin tone, armor clasps, shield emblem, fingers, legs, light direction, and silhouette scale.
6. Reject an off-model frame individually. Do not hide a changing weapon, missing hand, or detached head with flash or blur.
7. Confirm attacks, hits, dodges, parries, status ticks, and deaths come from the real combat event stream. Repeated animation frames must not cause repeated damage, rewards, voices, or SFX.
8. Keep text and health/status HUD outside the art. Effects should have their own alpha and stay legible at gameplay size.

## Paired finishers: reuse limits

The v0.7 request is four silhouette categories × three paired frames = 12 frames for the selected hero. This is a useful initial **choreography budget**, not proof that one painted opponent can represent every enemy identity.

- A gray wolf painted into a paired frame cannot become a brown tusked boar through a label or tint. Supply species-specific paired variants, or use that painted finisher only for the exact supported opponent and retain a truthful fallback elsewhere.
- A paired human image embeds the opponent's body, clothes, weapon, and face. Do not replace only the bust, detach the head, or silently turn a watchman into a bandit. Reuse the timing/choreography contract and redraw identity variants where needed.
- The same issue applies to Bram's duelist versus Plate Harness outfit. The paired hero must match his current outfit or the integration must explicitly defer that finisher until supported.
- Do not trigger a finisher on the unwinnable Pass Tyrant or on a nonlethal boss hit. The last-enemy and lethal-result gates belong in simulation-facing presentation logic.
- Use exaggerated impact poses, brief non-graphic contact, and stylized defeat light. No blood spray, exposed injuries, impalement, severed parts, or lingering suffering.

## Verification and completion criteria

Artwork delivery, intake approval, in-engine animation, gameplay verification, and publication are separate milestones. Record them separately.

Before calling a clip integrated: play entry/idle/action/return transitions; verify contact and release; pause/background/resume during contact; test reduced motion; check facing on both sides; ensure the wrong species/outfit never appears; check portrait/HUD identity matches; inspect phone-size readability; and verify atlas weight/cold-start phasing.

Relevant existing checks are `npm test`, `npm run test:browser`, and `npm run sync:check`. This read-only intake audit did **not** run those tests and does not certify they pass. The separate art delivery does not authorize publishing or modifying the original game.
