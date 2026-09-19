# Beast artwork — Astra v1

Produced and visually inspected 2026-09-19 using the built-in image generation tool. All files are saved inside this offshoot. Original website files, runtime JavaScript, and publishing outputs were not changed by this beast-art task.

**Delivery stage: painted source art for Fable intake.** These are not registered runtime atlases, and they have not been played inside the game. Final animation/paired-contact approval remains pending.

## Files and coverage

Artwork folder: `assets/expedition/astra-v1/beasts/`.

| Preferred file | Layout / inspected count | Coverage |
|---|---|---|
| `wolf_reference.png` | One complete 1536×1024 reference | Gray-white amber-eyed Dire Wolf with charcoal ruff, from existing creature atlas frame 0 |
| `wolf_idle.png` | 2×2 / 4 | Guard-breathing keys |
| `wolf_run.png` | 3×2 / 6 | Collected stride, push, flight, contact, collection, reset |
| `wolf_leap.png` | 3×2 / 5; last cell empty | Crouch, takeoff, flight, reach, landing |
| `wolf_bite_v2.png` | 2×2 / 4 | Approach, two clamp candidates, release; improved gutter spacing |
| `wolf_land_tumble.png` | 3×2 / 5; last cell empty | Thrown back, tumble, ground contact, rise, recovery |
| `wolf_overshoot_land.png` | 2×2 / 4 | Miss, landing, low skid, guard |
| `wolf_land_beside.png` | 3×1 / 3 | Redirected/parried landing and recovery |
| `wolf_hit_short.png` | 3×1 / 3 | Contact recoil, overshoot, recovery |
| `wolf_down_fade.png` | 2×2 / 4 | Buckle, settle, partial dissolve, golden-light dissolve |
| `boar_action_keys.png` | 3×2 / 6 | Idle, charge anticipation/contact, hit, recover, defeat key poses |
| `thorn_lurker_action_keys.png` | 3×2 / 6 | Rooted idle, lash anticipation/contact, hit, recover, defeat key poses |
| `alpha_action_keys_v2.png` | 3×2 / 6 | Boss idle, pounce anticipation/contact, heavy hit, enrage, down key poses |
| `boar_run.png` | 3×2 / 6 | Articulated gallop cycle |
| `boar_charge.png` | 3×2 / 6 | Tell, wind-up, launch, contact, overshoot, recovery |
| `thorn_lurker_idle.png` | 2×2 / 4 | Rooted breathing/petal/tendril idle cycle |
| `thorn_lurker_lash.png` | 3×2 / 6 | Rooted guard, coil, acceleration, lash contact, overshoot, recovery |
| `alpha_stalk.png` | 2×2 / 4 | Weighted alternating-paw stalking cycle |
| `alpha_pounce.png` | 3×2 / 6 | Scrape tell, deep crouch, takeoff, contact, heavy landing, recovery |
| `boar_hit_short.png` | 3×1 / 3 | Impact recoil, weight overshoot, guard recovery |
| `boar_down_fade.png` | 2×2 / 4 | Buckle, rest, partial dissolve, golden-light disappearance |
| `thorn_lurker_hit_short.png` | 3×1 / 3 | Rooted contact compression, flower recoil, recovery |
| `thorn_lurker_down_fade.png` | 2×2 / 4 | Droop, close flower, partial dissolve, green-gold leaf light |
| `alpha_hit_heavy.png` | 3×1 / 3 | Heavy recoil, overshoot, planted guard |
| `alpha_enrage.png` | 2×2 / 4 | Trigger, intake, roar, dangerous guard |
| `alpha_down_fade.png` | 2×2 / 4 | Buckle, rest, partial dissolve, golden-light disappearance |

There are **38 primary wolf motion frames + 57 secondary-beast motion frames + 18 secondary-beast key poses = 113 selected motion/pose drawings**, plus the single wolf reference. Original `wolf_bite.png` and `alpha_action_keys.png` are retained as superseded attempts, not extra animation coverage. Preferred v2 files have the same frame counts as their originals. All 28 PNG masters together occupy 64,724,673 bytes before processing.

The original boar, plant, and Alpha `action_keys` sheets remain **six-key action proofs**, not six complete animation clips. Thirteen additional named motion sheets now provide consecutive run/charge, idle/lash, stalk/pounce, hit/defeat, and Alpha enrage sequences with draft timing. The requested secondary-beast motion source coverage is delivered; integration and actual-motion quality approval are separate. No bespoke boar breathing-idle loop is claimed beyond its guard key and charge recovery; Fable must explicitly map idle/entry/return transitions rather than silently substitute species or unrelated clips.

## Visual review

- All intended source-sheet frame counts are present. Five-frame wolf sheets leave the final cell empty.
- Wolf design remains gray/white with yellow eyes and a large charcoal ruff. Run, leap, tumble, recoil, and defeat show articulated limb/body changes rather than an identical portrait rotated in code.
- Boar preserves the existing brown hide, dark mane, red eyes, hooves, and upturned ivory tusks. Plant preserves rooted woody vines and burgundy tooth-lined flower. It attacks by vine extension, not a wolf lunge.
- Additional six motion sheets were visually counted and inspected: 6/6/4/6/4/6 frames respectively. Plant lash visibly coils, extends, and returns; the boar gallops then braces through its charge; Alpha stalk and pounce retain the dark boss markings. Roots/hooves still require frame registration before claiming grounded playback.
- The final seven hit/defeat/enrage sheets were visually counted at 3/4/3/4/3/4/4 frames. Bodies remain complete and coherent, recoil returns toward the guard, plants stay rooted, and the defeat sequences resolve into stylized light rather than wounds. Alpha enrage preserves its muzzle/eyebrow markings and uses a grounded roar.
- Alpha v2 makes the boss darker and heavier through the ruff, with visible pale healed muzzle markings and silver eyebrow accents. These are closed markings, not fresh wounds. The v2 down pose no longer contains the original baked dissolve motes; Fable can use the separately supplied defeat effect when the runtime is integrated.
- Actions remain non-graphic: no blood spray, torn flesh, exposed injury, severed parts, or lingering suffering.

## Intake cautions

1. Most sources are 1536×1024 RGBA. `wolf_land_beside.png` is 2172×724; `wolf_hit_short.png` is 2032×774. The latter width is not divisible by three. Use measured frame rectangles rather than assuming every source is a uniform runtime grid.
   The three new hit strips (`boar_hit_short`, `thorn_lurker_hit_short`, `alpha_hit_heavy`) are each2172×724. These nominal724px cells still require content-bound and pivot checks.
2. Generated layout is not exact registration. Some fur/tail extremities approach or slightly cross nominal equal-cell boundaries. Isolate complete silhouettes with padding; do not cut them to an assumed midpoint. Wide gaps are better in bite v2 but still require inspection.
3. Alpha channels were measured. Most range 0–254, while the three-frame strips reach 255. The sources contain real transparency, but edge/glow handling must be checked on both light and dark gameplay backgrounds before packing. Preserve intentional translucent dissolve effects; do not threshold every alpha pixel.
4. These PNG masters are roughly tens of megabytes together. They are production sources, not startup-ready delivery files. Trim, register, pack, and compress measured derivatives, then repeat the cold-load test.
5. Bite contact is **not certified** until paired with the exact hero's forearm/leg reaction. Frames alone do not establish correct joint anchors, relative scale, or release timing. Do not advertise the two contact poses as a finished paired cinematic.
6. Idle/run continuity, feet staying grounded, and stable fur markings require playback review. Static frame inspection cannot prove seamless animation.

## Metadata and provenance

- `beasts-prompts.json`: exact prompts, source references, generated original paths, intended pose sequences, and versioned outputs. Built-in generation only; no separate paid API runner.
- `beasts-clips.json`: preferred files, row-major frame counts, draft per-frame timing/contact/release proposals, and explicit incomplete coverage.
- `beasts-inspection.json`: actual file dimensions, alpha extrema, byte sizes, and hashes from disk.
- `ART_INTAKE_NOTES.md`: wider actor-code gaps, source identity maps, and paired-finisher reuse constraints.

Timing/impact numbers are **draft artistic proposals**. Final `hitStop`, flash, shake, and drift must be tuned against registered frames in-engine and recorded at greenlight. The existing renderer must first implement the missing sheet, release, hold, and pair handling documented in the intake notes.

## Remaining production work

Fable intake and animation integration; actual-motion/paired-contact review; explicit entry/idle/return transition mapping and any playback-driven correction frames; outfit/species-specific paired finisher support; and full browser/mobile/reduced-motion/paused-state verification. No gameplay tests were run for this source-only art delivery, and no publication occurred. **Coverage complete for the requested source-sheet list is not the same as registered, greenlit, integrated animation.**
