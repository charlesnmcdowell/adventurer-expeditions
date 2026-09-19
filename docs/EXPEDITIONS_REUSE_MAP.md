# Adventurer: Expeditions — reuse / gap map (M0)

2026-09-18 · Companion to `ADVENTURER_EXPEDITIONS_GDD_v0.5.md` §2, §5, §6 · Verified against the working tree, not assumed.

Scope of this map: everything the **first wolf fight + forward arrow** needs (GDD M1–M2). Items marked *later* are noted so the first build doesn't paint itself into a corner.

---

## 1. How the original boots and fights (what we plug into)

| Fact | Where | Consequence for Expeditions |
|---|---|---|
| Static Phaser app, no bundler. `index.html` lists ~120 scripts in a fixed order; `test/harness.js` loads the same data+core files in the same order for headless Node tests. | `index.html` 108–250, `test/harness.js` | `expedition.html` copies the data+core script block verbatim and the UI scripts it needs, then adds `js/expedition/*.js`. The harness gives us headless sim tests for free. |
| Phaser config: 1280×760 (`T().W/H`), scenes `[Title, Creation, Town, Quest, Combat, Death, AnimePreview, AnimeCombat, GatePreview]`. | `index.html` 48–62 | Expedition config registers one scene: `ExpeditionScene`. Same canvas size, so every existing layout constant and `mobile.css` still fits. |
| `Combat.create(charsA, charsB, {rng, context, questTier, encounterIndex})` builds `st`. Loop is `currentTurn(st)` → player: `autoReadyAction(st,u)` → `commitAction` → `Combat.act(st,u,action)` → `advance(st)`; enemy: `Combat.aiTakeTurn(st,u)` → `advance`. Outcomes are pushed to `st.events` as `{t:'damage'|'evade'|'counter'|'riposte'|'execute'|'status'|'down'|'use'|'heal'|'round'|'end'|…, uid, by, dmg, tag, visual}`. | `js/core/combat.js` 369, 651, 691, 917, 1281; `combat_damage.js` 489 | The director calls exactly these functions. It never computes an outcome. |
| `CombatScene.loop()` / `drainEvents(cb)` animate `st.events` since `eventCursor` then advance. `queuePlayerAuto` shows the auto strip and commits after `autoGap(360)`. `checkPlayerDanger()` can halt auto and show a flee bar. `Prefs.pauseEnemy()` can hold enemy turns. | `js/ui/scene_combat.js` 374–408, 477–490, 923–945 | Copy the loop shape; drop `checkPlayerDanger`, hatred remarks, flee, action bar, lane grid, turn strip. Replace `animateEvent` with the beat director. |
| `AnimeCombat` (art fitting room) is a save-isolated combat harness: builds a fake `game` with `World.create`, `Character.makePlayer/makeEnemy`, `Save.bind(game, Save.memoryBackend())`, `game.rescueCombat = {st: Combat.create(...)}` and runs `CombatScene` in `mode:'rescue'`. | `js/ui/scene_anime_preview.js` 12–27, 99–113 | This is the template for the Expedition's `demoGame()`: same construction, our own save backend and key. |
| `Character.makeRegistry(rng, 'hiro', name, false)` builds Hiro from `DATA.REGISTRY.hiro`: rolls human stats, applies `statMult {hp 7, atk 2.5, def 2.5, spd 1.5}`, pushes perks/actives at max tier, sets `fixedKit`. | `js/core/character.js` 354–392; `js/data/registry.js` 10–33 | Create him this way, then apply the Expedition overrides to the returned object (stats, perks list) before `Combat.create`. Nothing in registry.js changes. |
| `Character.makeEnemy(rng, 'dire_wolf', {level})`: beast species range `hp 70–90, atk 12–16, def 4–7, spd 14–18`, mooks roll the low half ×0.75 hp. `dire_wolf` has perk `momentum` and active `pack_snap` (power 2.4, front, melee, stacking Bleed). `alpha` (boss) exists with `pack_snap, cleave, beast_shape, thorn_skin` and Bleed on hit. | `character.js` 274–300; `data/enemies.js` 38, 145; `data/monster_skills.js` 24; `data/constants.js` 25 | Wolves inflict Bleed already (user requirement met by shipped data). Blight Wolf = `makeEnemy('dire_wolf')` + `hitStatus` override + tint. Alpha needs only a level override (*later*). |
| Hiro's four skills: `katana_slash` (2.6, allEnemies, autoKillPct .25, no cooldown), `god_aura` (party buff, cd 5), `counter_attack` (4 counters/2 rounds, riposte = katana_slash), `finisher` (requireBelowPct .4, heal 200%, +10 stats). All `noTierGrowth`, tiers identical. | `js/data/skills.js` 457–487 | Resolved through `Combat.manifestFor(u, skillId)` (combat.js 953/963). The Expedition wraps it: when `u.ch.registryId==='hiro'` and Expedition is active, return `{tier, data}` from `ADV.Expedition.skills[id][level]`. |
| Save: `SaveStore.create(storage, version)` writes `adv:slot:0/1` + `adv:commit` atomically; `Save.bind(game, backend)` swaps the storage per game. `Prefs` uses `adv:prefs`. | `js/core/save_store.js` 5, `save.js` 26–27, `prefs.js` 7 | Expedition binds its own backend: a thin localStorage wrapper that prefixes every key with `adventurer_expeditions_hiro_preview_v1:`. Website keys are never touched. |
| Release: `ADV.Release.target` is frozen at build time; `tools/crazygames/release_config.js` is the CG variant; `tools/release_files.py collect(root,'crazygames')` + `safe_publish.py` produce the upload folder; `test/crazygames_profile.js` guards it. Voice under `audio/vo/` is marked `delivery:'external'` for CG builds. | `js/core/release_config.js`, `tools/crazygames/`, `tools/release_files.py`, `test/crazygames_profile.js` | Add a `crazygames-expedition` profile whose required set is `expedition.html` + the phase manifests, with **no external delivery** for anything. |
| Portal: `Portal.prepare()` loads SDK v3, `loadingStart`; `Portal.sync(scenes)` fires `loadingStop` when a scene is RUNNING and `gameplayStart/Stop` for `Quest`/`Combat`/`Town`. | `js/ui/portal.js` | Reuse; add `'Expedition'` to the gameplay scene keys (one-line additive change, covered by both editions' tests). |

---

## 2. Presentation and art: what exists, what's placeholder, what's a gap

| Need | Existing | Reuse verdict | Gap / placeholder |
|---|---|---|---|
| Painted forest backdrop with environmental motion | `AnimeEnvironments.view(scene, id, phase, {depth})` loads `assets/anime/v2/runtime/<id>.webp`, builds parallax `planes`, and animates authored details (`forest: {leaves:true, mist:.58}`; `road: {leaves, water}`). `BattleArt.paint(scene,'deep_wood','day')` wraps it and attaches `WeatherFX`. `deep_wood` aliases to `forest`. | **Reuse as-is** for the ambush backdrop. | Thicket and clearing plates are Astra (*later*). For the arrow transition placeholder, walk from `forest` into `road` (it's the only other outdoor plate with leaves). |
| Travel panorama scroll | `TravelPanorama` (travel-only, `assets/anime/travel/v1/runtime/`), `travel_ambience.js` (37 lines: canopy light, birds, mist). | Reuse `travel_ambience` helpers on the band; the panorama loader is not needed if we scroll the env plate + a foreground layer ourselves. | Foreground foliage layer: placeholder = a blurred, darkened crop of the bottom of `forest.webp`. |
| Hiro actor | `hiro_cyber_20260916.webp` = head plate (frame 0) + outfit plate (frame 1), composed at runtime by `AnimeWorld` (`anime_identities.js` 62, 83: reserved cyber head, Ronin body, `bodyWidth 1060`). `AnimeWorld.portraitKey(scene, ch)` returns a composed 1122×1402 canvas texture. | **Placeholder only**: the composed bust, scaled to the band, moved with the existing `VFX.lunge/recoil/shake/tintFlash/scalePunch` (this is exactly the "portrait motion" the website uses). | Full-body frames per GDD §5.4 are Astra. The actor API is written for sheets from day one; the placeholder is a one-frame sheet. |
| Wolf actor | `AnimeManifest.creatures.dire_wolf = {sheet:'creatures_1', frame:0}`, 512 px cell, side-on snarl facing left. `AnimeWorld` crops it via `cell(scene,'creatures_1',0)`. | **Placeholder**: the crop, flipped as needed, moved with VFX. Its pose is a real reference for Astra's frames. | Frames per §5.4 are Astra. Blight tint: `ch.skinTint` is already honored in the portrait signature; a `tint` on the sprite works for placeholder. |
| Skill/impact effects | `VFX.slashArc, burst, aura, hitStop, camShake, zoomPunch, flashOverlay, damageNumber, projectile, evadeBeat` (vfx.js); `spell_fx.js`; `skill_art.js` + `skill_art_catalog.js` bind effect art to skill IDs; `combat_presentation.event(scene, e)` plays swing/impact/SFX per event with a synth fallback. | **Reuse**: VFX primitives for L1 presentations; `combat_presentation.event` as the fallback for any event without a bespoke beat. | L2/L3 painted effect textures are Astra (*later*). |
| Status badges, HP bars, hit numbers | `scene_combat.js` unit views (name plate, HP bar, intent icon, status icons), `VFX.damageNumber`. | Reuse the drawing code by extraction; new placement (above each actor on the band, per the reference layout). | — |
| Tutorial hand / gating | `Tutor.callout(scene, rect, title, body, {pass:true})`: highlight ring around a rect, clicks fall through only to the highlighted thing, tween pulse. | **Reuse the ring + pass-through gating**, drop the text card. Add a pointing-hand sprite that taps toward the target. | Hand icon: placeholder drawn with graphics; Astra later. **No voice, no text**: the hand and ring are the whole instruction. |
| Portrait card / buttons | `T().button`, `uikit.js`, existing Hiro portrait composition, `mobile.css` touch sizing. | Reuse. | Card frames/ready glow are Astra (*later*); placeholder = graphics. |

---

## 3. Audio: what to use and what not to

| Need | Existing | Decision |
|---|---|---|
| Battle music | `audio/music/`: `battle_ronin1/2` (2.8 MB), `battle_clove`, `battle_fire1/2`, `battle_origin`, `battle_salute1/2`, `battle_riot1/2`; `boss1/2` (1.8 MB); `forest1/2`. `Music.play('combat'|'boss'|'quest')` picks from pools; `playQuest`. | `battle_ronin1` for the wolf fights (katana theme, already in the game), `boss1` for the Alpha (*later*). Use `Music.play` with a pinned track rather than the pool. Phase A budget carries one track. The Gate tracks in `Claude outputs/` are not needed. |
| SFX | `audio/sfx/` (42 clips, 1.2 MB): `slash_use/hit`, `bite_use/hit`, `claw_use/hit`, `block`, `miss`, `guard_use`, `thrust_*`, `unarmed_*`. `combat_presentation.sound(scene, profile, phase)` maps skill profiles to `_use`/`_hit`. | Reuse all: slash for Katana Slash and riposte, bite for wolves, block for intercept, miss for the roll, guard_use for aura. Align to tagged contact frames. |
| Voice | `audio/vo/HIRO/` has 16 clips; `general_*` are fourth-wall lines ("Enjoying the game?"), `friendly/hatred/romantic` are relationship lines. | **No voice in the first build.** Nothing fits, and instructions are non-verbal by direction. Gap log entry: "arrival/victory grunt or short line" for later, only if wanted. |

---

## 4. Tests and tooling

| Tool | Use |
|---|---|
| `test/harness.js` + `tools/test_runner.js headless` + `test/suites.json` | Add `test/expedition_sim.js` (determinism, no-tap completion, build viability, purchase/request races, save isolation). Registered in `suites.json` so `npm test` and `safe_publish --check-only` run it. |
| `test/fixtures/combat-traces.json` (24 seeded traces) | Untouched. Our override is scoped to `registryId==='hiro'` under `Expedition.active`, so traces cannot change. |
| Playwright (installed in `node_modules`), `test/browser_mobile_launch.js`, `tools/test_runner.js browser|mobile` | `test/browser_expedition.js`: boots `expedition.html`, waits for the ambush, screenshots at beats, taps the hand target, asserts gating and the arrow. |
| `Play Adventurer.bat` (local server on 8734) | `http://127.0.0.1:8734/expedition.html` for manual play. |
| `tools/release_files.py`, `safe_publish.py`, `tools/crazygames/` | New profile `crazygames-expedition` (*M4*). |

---

## 5. The first-fight slice, concretely

**Reference layout** (CrazyGames auto-battler screenshot, 2026-09-18): painted forest with a grass band; heroes left facing right, enemies right facing left; `[Lvl.N]` tag + HP bar floating above each unit; top-left gold and a counter; top-center wave nodes (✓ done, ⚔ current, ⚔ next); top-right timer, sound, pause; bottom-center portrait cards with a skill emblem, the ready one glowing, level badge. Expeditions uses this exact arrangement with one hero.

**Files to create (all new, nothing under `js/data` or `js/core` edited):**

```
expedition.html                      entry; data+core script block copied from index.html; UI subset; then:
js/expedition/data.js                ADV.Expedition: saveKey, hero overrides, skills[id][level], enemies, encounters, economy
js/expedition/manifest_shim.js       wraps Combat.manifestFor for Hiro when Expedition.active
js/expedition/save.js                prefixed localStorage backend + run state (gold, levels, checkpoint, awarded, tutorial)
js/expedition/actors.js              Actor: sheet state machine, tagged frames, placeholder one-frame sheets, VFX motion
js/expedition/beats.js               event → beat table; beat player with budgets, pause/resume, reduced motion
js/expedition/director.js            demoGame(); Combat loop; Finisher request; upgrade pipeline; encounter transitions
js/expedition/hud.js                 top bar, wave nodes, portrait card, upgrade cards, arrow, hand/ring gating
js/expedition/scene.js               ExpeditionScene: band + env plate + foreground layer; wires director/actors/hud
js/expedition/portal_keys.js         adds 'Expedition' to Portal gameplay keys (additive)
test/expedition_sim.js               headless suite
test/browser_expedition.js           Playwright suite
```

**Hand-holding sequence for the first minute (non-verbal, gated):**

1. Ambush starts on its own; wolves enter; Hiro draws. No input required for the first exchanges.
2. First time Finisher is ready (a wolf < 40%): the sim holds at Hiro's turn boundary. Hand taps toward the portrait; ring pulses; nothing else is interactive. Tap → Finisher fires → hold released. (If the player never gets a Finisher window, e.g. the wolves die to Slash/Bleed first, the step is deferred to the next fight; the fight still ends.)
3. Victory beat; gold counts into the top-left. Hand moves to the Katana Slash card's `+`; ring pulses; game holds. Tap `+` → inline chip; hand moves to Confirm; tap → level 2, card flashes, Hiro pulses.
4. Arrow appears on the right edge; hand taps toward it; hold. Tap → Hiro sheathes (already done in the victory beat), walks right; band scrolls `forest` → `road` plate; wave node 1 ✓, node 2 ⚔; stop at the second fight's start position (the second fight itself is out of scope for now; the scene parks in idle with the next wolves off-screen).
5. Skip is available at every hold (small ✕ on the ring) and removes gating without removing gold.

**Placeholder art in the first build:** composed Hiro bust (head+outfit plates) and the `creatures_1` wolf crop as one-frame sheets, moved with the website's VFX; `forest.webp` via `BattleArt.paint` with its leaves/mist; hand and HUD drawn with graphics. Every one of these is swapped for Astra frames by dropping a sheet + tag file into `assets/expedition/` without touching code.

---

## 6. Open questions (none block M1)

1. Hiro's `master_swordsman` and `lone_wolf` perk effects were not read in detail; the demo starts with only `lone_wolf` and the headless sim will show whether it needs to go too.
2. `Combat.manifestFor` is also referenced by `combat_effects.js` through `_internals`; the shim must wrap both the exported function and the internal reference, or `god_aura`/`counter_attack` handlers will read website tiers. Verify in M1's first headless run.
3. Whether `AnimeEnvironments.view` planes can be scrolled horizontally past their 1280 width without a seam; if not, the transition uses a crossfade between `forest` and `road` rather than a continuous scroll for the placeholder build.
