# Hiro paired finishers — independent source review

2026-09-20. Six delivered PNG sheets were viewed individually at their native
1254×1254 dimensions. Each contains six distinct painted paired poses in a
2-column × 3-row grid: 36 drawings total. This review changes no assets or
runtime code. Source paths, bytes and SHA-256 hashes are recorded in
`finisher-source-audit.json` beside this file.

Source root: `../adventurer-expeditions-source-art/astra-v2/heroes/hiro/`.

| Source | Readable action and outcome | Inspection caution |
|---|---|---|
| `wolf-cleave-paired.png` | Wind-up, incoming wolf, horizontal contact, light-filled separation, dissolve, empty recovery | Hiro's boots and the wolf tail approach cell edges; keep the whole 627×418 region before keying |
| `wolf-pin-paired.png` | Kick/knockdown, foot pin, downward contact, dissolution, recovery | Frame 0 raised blade is close to the top; frame 1 sword is close to its left cell boundary |
| `wolf-rising-cut-paired.png` | Wolf leap, Hiro ducks, rising cut, luminous separation, dissolve, recovery | Frame 0 wolf rear paw is very close to the right cell edge; airborne wolf height must not rescale Hiro |
| `plant-stem-cut-paired.png` | Approach cut, stem contact, falling crown, grounded dissolve, recovery | Roots and a few vine tips nearly fill their cells; preserve detached leaves and the head silhouette |
| `plant-vine-pin-paired.png` | Vine reaches Hiro, boot pins it, wind-up, cut, dissolve, recovery | Vine/boot contacts read clearly, but root and foot margins are narrow |
| `plant-crosscut-paired.png` | Raised vine, parry contact, rising cut, downward return, dissolve, recovery | Raised vine comes close to the upper edge; do not key away the silver blade against gray |

Hiro stays left of the victim in all six sets. His dark skin, purple locs,
black/gold armor, violet sash and katana remain recognizable throughout.
Wolves retain the gray/white mane and plants retain the red toothed flower,
green thorn vines and root body. No obvious missing-body part, outfit/species
swap, exposed anatomy or blood was found in this source review. Dissolution
occupies the final victim poses; the final frame leaves Hiro and fading effects.

The figures appear complete, but several margins are much smaller than a
generous production pad. These are extraction risks rather than a finding
that every tight margin is cropped. Do not crop cells inward or let a packer
discard sword tips/roots as neighboring fragments. Preserve source scale and
use per-frame ground/anchor registration; total silhouette height changes
with a raised blade or airborne enemy and must not control actor scale.

**Status: source delivered and visually inspected, intake pending.** Contact
and release markers, durations, opponent identity and final selected IDs belong
to the producer manifest. This review does not certify that a marker already
matches damage, that every kill uses a finisher, or that camera/slow motion,
pause/reduced-motion behavior and mobile readability pass in the game. Those
checks require the adopted runtime; timing and registration remain unapproved.
