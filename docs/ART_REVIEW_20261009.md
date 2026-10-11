# Art and file review — 9 October 2026

Read-only audit of the local edition at commit 0b51db6. No art was deleted or moved. Every item below is **marked for Hiro's review**: keep, stop shipping, or delete.

How it was measured: a script matched every file under `assets/` and `audio/` against the ship list (`tools/size_check.js`), every runtime manifest and every script; a headless harness asked every actor for every clip name the game can request (finisher rotations included); and a browser tour loaded all fifteen fights, every travel leg, the inn and the End screen while recording each downloaded file.

## 1. Shipped, but the game never loads them (about 5.1 MB)

| File | Size | Why unused |
|---|---|---|
| `assets/anime/v2/runtime/{alley,forest,marsh,road,ruins,tavern}.webp` | 2.29 MB | Old battle plates. All open quests use the layered stages; only `mountain.webp` is still loaded (as the mountain far layer). `ruins` is a closed quest. |
| `assets/anime/travel/v1/runtime/{city,forest,marsh,ruins}.webp` | 1.33 MB | Old travel panoramas, replaced by the painted travel beats. |
| `assets/expedition/stages/{city,mountain,swamp}.webp` | 0.91 MB | Pre-layer battle floors; no code references them since the three-plane stages (8 Oct). |
| `assets/expedition/effects/swamp.webp` | 0.23 MB | Swamp defeat effect is code-drawn since 28 Sept; only `city.webp` is loaded. |
| `audio/vo/M05/*` (12 lines) | 0.35 MB | Companion travel banter. Painted travel returns before banter, and there are no companions. |

## 2. Shipped twice (about 1.8 MB download, about 36 MB image memory)

`assets/expedition/stages/coast/atmosphere-{far,ground,near}.webp` and `stages/citadel/atmosphere-*` are byte-identical to `travel/coast-mast-vault/atmosphere-*` and `travel/citadel-bridge-leap/atmosphere-*`. Battle and travel load them under different keys, so each is downloaded and held twice. Suggested fix: point the Coast and Citadel battle stages at the travel files, as forest, swamp and city already do.

## 3. Drawings inside loaded atlases that can never play

Every page of an atlas downloads when the actor is needed, so these cost real time and memory.

- **Hiro** (`hiro.json`, 6 pages, about 119 MB of image memory): `slash-l2`, `slash-l3`, `aura-l2`, `aura-l3`, `counter-l3` (skill levels were removed) and the retired `plant-stem-cut-paired`. Share of each page that is dead: hiro-0 ~5%, hiro-1 ~17%, hiro-2 ~24%, hiro-roster-0 ~17%, hiro-roster-1 ~75% (slightly higher once `slash-l3` is counted).
- **Alpha**: retired `hiro-alpha-pin-paired` — alpha-0 22%, alpha-1 46%.
- **Retired Hiro finishers on monster pages**: beetle-roster 38%, goblin-roster 36%, serpent-roster 34%, spider-roster 28%.
- **Enrage poses on regular monsters**: serpent, beetle, moss giant, goblin, spider each carry 4 enrage drawings; only bosses enrage.

Re-packing these atlases without the dead clips would cut download and memory; the source masters stay in the sibling source-art folder.

## 4. On disk, not shipped, not referenced

| File | Size | Suggestion |
|---|---|---|
| `assets/expedition/hiro/hiro.webp` | 1.29 MB | Superseded atlas page. Delete candidate. |
| `assets/expedition/orc/orc-0.webp` | 1.83 MB | Superseded by `orc-clean-0`. Delete candidate. |
| `assets/expedition/plant/plant-0.webp` | 0.38 MB | Superseded by `plant-clean-0`. Delete candidate. |
| `assets/expedition/inn/inn-hiro-{mage,warrior}-v2.webp` | 0.25 MB | Kid-safe wardrobe versions. Keep for a Poki build. |
| `assets/expedition/boar/` | 0.29 MB | Retired enemy. Keep only if boars may return. |
| `assets/expedition/bram/`, `busts/` (recruits, human foes) | 2.8 MB | Hero-pack fixture. Keep. |
| `assets/anime/v2/runtime/{headgear,heads_*,wardrobe_*}.webp` | 4.4 MB | Bust-baking part sheets (dev only). Keep. |
| `assets/anime/v2/runtime/{creatures_1,hiro_cyber_20260916}.webp` | 1.4 MB | No reference found. Review. |
| `audio/vo/{F03,F07,M02,M11}` | 1.6 MB | Recruit voices for a hero pack. Keep or archive. |
| `assets/app/icon-512.png`, `icon.svg` | 0.2 MB | Unused app icons. Review. |

## 5. Efficiency findings from the browser tour

- **Image memory is never freed.** After one visit to each location the game held 147 textures, about **1.1 GB** of decoded images; no code removes a texture. This is the most likely cause of stutter or crashes on phones and tablets. Suggested fix: free the previous location's monster, defeat, stage and travel textures when leaving it.
- The first fight took about a minute to load from the local server in the browser pane (Hiro, Alpha, wolf, thorn lurker and three defeat atlases at once).
- The first scene loads Bram's bust although he cannot be recruited.
- Every inn visit decodes all five inn paintings, though one is shown.
- Runtime files are named `wolf-fatal-0-review-r2.webp` and `orc-fatal-0-review-r2.webp`; renaming would remove "review" from the shipped build.
- Actor drawings are stored at about their on-screen height (300–360 px standing), so resolution itself is not wasteful.

## 6. Housekeeping

- Five browser tests are not wired to any npm script: `browser_battle_layers`, `browser_coast_combat`, `browser_coast_scenery`, `browser_expansion_journey`, `browser_sprite_cleanup`.
- Staged (not deleted) to `../_to_delete/expeditions-cleanup-20261009/` (349 MB, all untracked): September test screenshots (`arcade`, `release-candidate`, `release-polish`, `sprite-cleanup`), the superseded `crazygames-20260928-night` and `-arcade` candidates, the Facebook reel's `work/` renders and `tools/__pycache__`. The 28 Sept staging folder (780 MB) is also still there awaiting deletion.
