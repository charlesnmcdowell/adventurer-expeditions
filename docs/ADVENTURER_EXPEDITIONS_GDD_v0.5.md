# Adventurer: Expeditions
## Hiro cinematic demo — reuse-first game design document

Version 0.5 · September 18, 2026 · Working title · Design only

This revision supersedes v0.4. It keeps v0.4's scope lock and reuse-first rule, corrects four places where v0.4 described the existing skill data wrong, records the decisions taken on September 18 (portrait binds Finisher; the poison enemy is a Blight Wolf variant; ordinary wolves inflict Bleed; **the painted illustration style is kept at full fidelity for the animated actors**), corrects the description of the existing art after inspecting it, and adds a build-out section (§6) that says exactly how the first five minutes is constructed on top of the existing combat engine.

The immediate deliverable is one adrenaline-packed neutral level-one quest with Hiro alone: approximately two to three minutes, five minutes maximum under ordinary guided play. Deliberate pauses and accessibility needs do not cause a forced timeout.

The original website game, its balance, saves, and publication remain unchanged. No implementation or publishing is performed by this document.

---

## 1. Direction and evidence

Keep Adventurer's established art style exactly as it is: **painted, high-detail anime illustration**, not cel shading. Inspected 2026-09-18: soft-gradient skin and individually rendered locs on Hiro, rendered lacquered metal with purple LED trim and gold fittings on the armor, individually rendered fur on the Dire Wolf, and painted backgrounds with atmospheric light and depth. The demo does not simplify this look for animation. It goes further: the same painted fidelity, now fully articulated in motion and staged as cinematic battles. §6.8 and §10 say how that is achieved without the rendering crawling between frames.

Reuse Adventurer's world, authored Hiro identity, gear designs, skills, status systems, combat logic, backgrounds, environmental animation, voices, music, effects, and tested infrastructure wherever practical. Reorganize and present that work differently rather than rebuilding it.

The developer observed animated battlefield characters, immediate action, automatic fighting, guided choices, and continuous progression among prominently advertised CrazyGames games. Treat that visibility as an implicit competitive benchmark. Written rules do not mandate sprites. Our goal goes beyond minimum eligibility: make this presentation competitive for player attention and distribution.

**Rejection evidence.** The 16 September submission record (`docs/dialogue/CRAZYGAMES_SUBMISSION_RECORD_2026-09-16.md`) lists risks carried into review that are unrelated to animation quality: a Fullscreen button and visible cursor in the landscape preview video, a letterboxed portrait preview, the tags Idle/Incremental, and 8,284 voice clips fetched from an external GitHub Pages host rather than bundled. Before Milestone 1 begins, paste the portal's actual rejection text here verbatim:

> _Rejection text (to be pasted from the CrazyGames developer portal):_
> _…_

Whatever the text says, the Expeditions build must (a) bundle every asset it uses, with no external fetches, (b) ship store media captured from the Expeditions build itself with no cursor and no controls the build lacks, and (c) carry tags that describe it (Action, Anime, Fighting, 1 Player, Casual). These are fixed regardless of the animation work.

Reference: [CrazyGames quality guidelines](https://docs.crazygames.com/requirements/quality/) and [technical requirements](https://docs.crazygames.com/requirements/technical/). Animation alone cannot guarantee acceptance or promotion.

**Promise:** Watch Hiro survive a spectacular ambush, strengthen his signature skills with earned gold, and clear the road in one short adventure.

---

## 2. Reuse is a production requirement

Before authoring a replacement, identify the existing implementation or asset, test whether it can serve the demo, and document the smallest adaptation needed. The major expected new effort is fully articulated character/enemy animation and cinematic expression of existing combat. New glue code and skill-level definitions are expected; wholesale simulation, audio, progression, or renderer rewrites are not the default.

The existing engine already has the seam this demo needs. `js/core/combat.js` is a deterministic state machine (`Combat.create`, `Combat.currentTurn`, `Combat.act`, `Combat.advance`, `Combat.autoReadyAction`) that pushes typed events onto `st.events` (`damage`, `evade`, `counter`, `riposte`, `execute`, `status`, `down`, `use`, `heal`, `round`, `end`, and about thirty more). `js/ui/scene_combat.js` consumes them through `drainEvents()`, which animates every event appended since an `eventCursor` and then calls back to advance the sim. Expeditions replaces what `drainEvents` does with the events, not the events, the sim, or the turn loop.

| Existing candidate, confirmed by file inventory | Intended reuse / adaptation |
|---|---|
| `js/core/combat.js`, `combat_turns.js`, `combat_ai.js` | Preserve combat resolution and automatic decisions unchanged. The demo calls the same `currentTurn → act → advance` loop. |
| `combat_damage.js` (emits `{t:'damage', uid, by, dmg, tag, visual}`), `combat_healing.js`, `combat_statuses.js`, `combat_effects.js`, `combat_targeting.js`, `combat_events.js` | Reuse as-is. The cinematic layer reads their events; it never computes an outcome. |
| `js/ui/scene_combat.js` (`drainEvents`, `queuePlayerAuto`, `eventCursor`) | Copy the loop shape into a new `ExpeditionCombatScene`; replace portrait-slide presentation with the choreography director. Do not import the party/panel/hatred-remark machinery. |
| `js/ui/combat_presentation.js` (`event(scene,e)`, `swing`, `impact`, `sound`, synth SFX) | Reuse the per-event SFX/impact helpers as the fallback layer for events the director has no bespoke clip for. |
| `js/ui/skill_art.js`, `skill_art_catalog.js` | Reuse effect artwork and bindings where appropriate; extend for distinct skill levels. |
| `js/ui/travel_panorama.js`, `travel_ambience.js`, `travel_battle_art.js`, `battle_art.js` | Recompose existing scenery and environmental motion into connected fighting/walking spaces. |
| `js/ui/gate_cinema.js` | Inspect reusable camera, sequencing and cinematic helpers; do not import campaign dependencies. |
| `js/ui/portal.js` | Reuse the CrazyGames SDK adapter as-is (`loadingStart/Stop`, `gameplayStart/Stop` driven by scene status). Add the `Expedition` scene key to `P.sync`. |
| `js/ui/music.js`, `js/data/voice_manifest.js`, `audio/vo/HIRO/*` (16 clips) | Reuse music selection/volume and Hiro's voice identity. See §12 for which clips can fit. |
| `js/core/save_store.js`, `js/core/prefs.js` (`KEY = 'adv:prefs'`) | Reuse the atomic single-string save pattern under a new key. |
| `js/data/registry.js` (`hiro`), `js/data/skills.js`, `js/data/enemies.js` (`dire_wolf`, `alpha`), `js/data/monster_skills.js` (`pack_snap`) | Retain identities; add offshoot-only overrides (§4, §6.6). |
| `assets/anime/v2/runtime/hiro_cyber_20260916.webp` (faceless head plate + separate outfit plate, front-facing, no legs), `creatures_1.webp` (Dire Wolf, side-on dynamic pose), `road.webp`, `forest.webp` | Hiro's identity source and the wolf's animation reference exist. No full-body Hiro exists; §12 makes the side-on turnaround the first art task. Backgrounds are painted with depth perspective; §6.8 sets the foreground-band staging that lets them serve a lateral battlefield. |
| `js/ui/*expressions*` (runtime face compositing on the blank head plate) | Not reused for the animated actor: faces are painted into the action frames. The plates remain the identity reference. |
| `tools/test_runner.js` (headless / browser / mobile / smoke), `test/browser_hiro.js`, `test/browser_mobile_launch.js` | Extend with an `expedition` suite (§6.9). |

These are reuse candidates, not a claim that every module is already drop-in compatible. Produce a compact inventory listing asset/module, current purpose, proposed use, dependencies, required changes and validation. Inspect existing save, tutorial, reward and release helpers as part of that inventory before writing new ones.

Reuse existing voice lines only when their wording fits the new scene. Do not play campaign-specific references, misleading instructions, adult language or irrelevant dialogue just because a recording exists. Correct Hiro voice identity remains mandatory. Prefer an appropriate existing short line or silence over unnecessary new voice generation. Reuse existing music/SFX before commissioning anything.

---

## 3. Locked demo scope

- No title screen, character creation, character selection, quest browser, town, recruitment, inventory, or equipment-by-equipment management.
- After necessary loading, enter a forest-road wolf ambush already underway. Combat visuals do not wait for browser audio permission; sound starts on an allowed user interaction.
- Prebuilt Hiro: dark skin, purple locs, cyberpunk samurai outfit, authored katana. Same established art direction and identity, now fully animated.
- Four signature skills begin at level 1. Baseline fighting, defensive reactions and automatic skill use continue without input. **The existing Hiro portrait at the bottom becomes a tappable Finisher control** (decision 2026-09-18; supersedes v0.4's Katana Slash binding, see §6.4). No manual movement, timing minigame or quick-time event is required.
- **Ordinary wolves inflict Bleed on a landed bite** (their existing `pack_snap` already does). **The second group adds a Blight Wolf variant that inflicts Poison** (decision 2026-09-18). The boss is the existing `alpha` with its existing Bleed-on-hit.
- First wolf group → gold and guided skill purchase → forward arrow/walking → second group (wolves + Blight Wolf) → gold and quick upgrade → forward arrow → boss → compact completion overlay.
- First build has three encounters total: two ordinary groups and a boss. Add a third ordinary group only later if it improves pacing within five minutes.
- The primary player decisions are when to tap Finisher, which skills to improve, and when to move forward.
- Story, additional heroes and missions follow only after this slice succeeds. Do not build their menus or content now.

---

## 4. Hiro's actual kit and the demo-only overrides

Verified in `js/data/registry.js`, `js/data/skills.js`, `js/data/enemies.js` on 2026-09-18. The left column is what ships on the website today; the right column is the isolated Expeditions override. Nothing in the left column changes.

### 4.1 Hiro's character entry

| Field (website, `registry.js`) | Website value | Expeditions override |
|---|---|---|
| `statMult` | `hp 7, atk 2.5, def 2.5, spd 1.5` | `hp 2.2, atk 1.4, def 1.3, spd 1.2` — starting tune, so wolves land visible hits and Bleed/Poison matter. |
| `perks` | `demigod, master_swordsman, lone_wolf, rich` | Drop `demigod` (status immunity, extra turns, overheal), drop `rich` (gold multiplier). Keep `lone_wolf`. Review `master_swordsman`'s actual effect during inventory; keep only if it does not multiply katana damage past the tune. |
| `actives` | `katana_slash, god_aura, counter_attack, finisher` | Same four IDs, resolved through an Expeditions tier table (§4.2). |
| Status immunity | Immune (via Demigod) | Bleed, Poison and buffs affect Hiro. Other hostile statuses are not present in the demo's enemy set. |
| Portrait / voice / gear | `hiro`, `HIRO`, `abyssal_katana + ronin_gear` | Unchanged. |

### 4.2 The four skills — data as shipped, and what the demo must override

All four are `noTierGrowth: true` with three identical tiers (`basic/intermediate/advanced`). Merely setting a level number does nothing. The demo supplies its own `expeditionTiers: { 1, 2, 3 }` per skill and a `manifestFor` shim that resolves Hiro's skills from that table instead of the website tiers (§6.6). Base fields that must be overridden are named explicitly here because they would otherwise silently break the demo.

| Skill | Shipped base fields | Fields the demo must override | Why |
|---|---|---|---|
| Katana Slash | `power 2.6, target: allEnemies, reach: any, autoKillPct 0.25, noReflect`, no cooldown; bleed `0.6 × 3 rounds`, stacks | `autoKillPct → 0`; `target → 'enemy'` at L1 and L2, `allEnemies` at L3; `power` per level | Random 25% instant kills make the demo incoherent (§8). The L1→L3 escalation in §9 needs single-target at L1. |
| God Aura | `target: party, auraAtk 1.3, auraDef 1.3, auraEvade 0.15, rounds 3, cooldown 5` | Per-level values; L2+ adds a capped shield | Solo party, so `party` target is fine. Values are already sensible; they just need to differ per level. |
| Counter Attack | `counterNext 4, counterRounds 2, counterRiposte: 'katana_slash'` | `counterNext` per level; `counterRiposte → 'expedition_riposte'` | The shipped riposte *is* Katana Slash, so upgrading Slash would silently upgrade every riposte, and four full-line slashes in two rounds ends any wolf group. The demo decouples them: the riposte is a dedicated single-target cut whose power scales with Counter's own level. |
| Finisher | `requireBelowPct 0.40, executeBelow 0.40, healOnKillPct 2.0, permStatGain 10, questGain true`, no cooldown | `healOnKillPct` per level (0.25–0.50); `permStatGain → 0`; `questGain → false`; add `cooldown 3`; add `bossDamagePct` per level | 200% overheal and +10 all stats per kill are runaway growth. Bosses need a bounded outcome. A cooldown is what makes the portrait tap a decision. |

### 4.3 Level cap

Prototype cap: level 3 for each of the four skills, giving 12 authored skill-level presentations. All four start available at level 1. A first run need only contain two purchases; replay and QA expose other combinations. Do not advertise unfinished levels.

---

## 5. Division of work: what Fable 5.1 builds, what Astra paints

Decision 2026-09-18. Two tools, one clear line: **Astra owns every pixel; Fable owns every mechanic, every line of code, the art intake pipeline, and verification.** Neither does the other's job. No rigs, cutouts or part-based puppets (tried on another game; rejected). Animation is **frame-based**: Astra paints full key frames at plate fidelity, Fable plays them as anime-style limited animation.

### 5.1 Fable 5.1 owns

| Area | Deliverables |
|---|---|
| **Engine integration** | `expedition.html` entry point, `js/expedition/` module, `crazygames-expedition` release profile, isolated save key, portal SDK hooks, both editions' regression checks. |
| **Combat mechanics** | The director that drives the existing `Combat` loop; event → beat translation (§6.2); beat clock and pause/resume rules (§6.3); the Finisher request pipeline (§6.4); the upgrade pipeline (§6.5); the single override file with Hiro's stats, the 12 skill levels, `expedition_riposte`, the three enemies and three encounters (§6.6); balance tuning by headless simulation (§6.7). |
| **Presentation code** | Sheet-based actor state machines with tagged contact/release frames; foreground-band scene with parallax layers; camera push/pull, shake and reduced-motion; particle systems that use Astra's effect textures; status badges; hit numbers; timing, holds, smears and ease curves that make limited animation read as continuous motion. |
| **HUD and flow** | Health/gold/progress/pause, Finisher portrait control, four upgrade cards with inline chips, forward arrow, tutorial hand and spotlight, victory payout, walk transition, completion overlay, defeat/Retry. |
| **Art intake pipeline** | Per-asset briefs for Astra (§5.3); frame extraction, background keying, trimming, registration to a fixed pivot and ground line, sheet packing, contact/release tagging; on-model review by viewing every frame against the plates; placeholder frames so the whole fight is testable before painted art exists. |
| **Audio** | Selection of existing music/voice/SFX, alignment of impacts to contact frames, level normalization, gap log. |
| **Verification** | The `expedition` test suite (§6.9): determinism, no-tap completion, purchase and request races, save isolation, portal timing, mobile layout; screenshot-based visual QA; cold-cache load measurement. |
| **Release** | Load phasing and manifests; store media captured from the build (no cursor, no fake controls); tags; submission record. |

### 5.2 Astra owns

| Area | Deliverables |
|---|---|
| **Hiro turnaround** | Full-body side-on guard pose, neutral stand, and back three-quarter, painted from the head and outfit plates at plate fidelity. Greenlit before any action sheet is painted. |
| **Hiro action key frames** | Every clip in §5.4, as full painted frames on a flat solid background, each frame a complete on-model Hiro (face included). |
| **Wolf key frames** | Dire Wolf clips in §5.4 from the `creatures_1` reference; Blight Wolf as the same frames with the Night Coat tint, green eyes and drool tell; Alpha later (M3) at boss scale with heavier ruff and scarred muzzle. |
| **Backgrounds** | Thicket plate and rocky-clearing plate in the hand and light of `forest.webp`; three painted foreground layers (ambush, thicket, clearing) on transparent background. |
| **Effects textures** | Katana arc strokes (narrow, crossing, broad), afterimage silhouette, aura ring/crest layers, Bleed and Poison badges, poison motes, spark, dust puff, leaf cluster, stylized defeat-light. |
| **Icons and HUD skin** | 12 skill icons (4 skills × 3 levels), portrait frame with ready state, upgrade card frames, forward arrow, tutorial hand, gold coin, completion overlay frame. |

### 5.3 The handoff contract

1. Fable writes one brief per asset: asset ID, canvas size, background colour to render on, the reference image(s) to feed, the frame list with a one-line pose description per frame, the ground line and facing, and what must not change between frames (silhouette scale, light direction, blade length, loc count).
2. Astra returns PNGs at the brief's canvas size, one frame per file or one contact sheet per clip, on the flat background, no cropping of limbs or blade.
3. Fable keys, trims, registers, packs, tags and views every frame. Review is side by side with the plates at 1× and 0.25×.
4. Greenlight per clip. A rejected frame is regenerated individually, not the whole clip. The `sorcerer-sword-art-pipeline` greenlighting steps (golden reference, scale check) apply.
5. Placeholder frames are replaced clip by clip; the fight is playable throughout.

### 5.4 First-fight frame budget (M1–M2)

Limited animation: 8–12 painted frames per second of motion, played on holds of 2s and 3s with smear frames on fast cuts. The camera, ease curves and effects carry the rest.

| Actor | Clip | Frames | Notes |
|---|---|---|---|
| Hiro | idle (guard) | 4 | breathing hold; locs settle |
| Hiro | walk | 8 | sheathed, one full cycle |
| Hiro | draw | 8 | thumb release → blade fully out → guard |
| Hiro | short draw | 4 | arrival at the next fight |
| Hiro | slash_L1 | 6 | wind-up, smear cut, follow-through, recover |
| Hiro | hit_short | 3 | recoil, brace, recover |
| Hiro | bite_leg + shake-off | 10 | paired with wolf; contact on frame 3, release on frame 7 |
| Hiro | roll | 6 | drop, tuck, rise facing |
| Hiro | intercept | 5 | plant, angle blade, spark frame |
| Hiro | riposte | 5 | single cut from the intercept pose |
| Hiro | victory_1 | 8 | hold, check road, turn blade, sheath, click |
| Hiro | down | 4 | kneel |
| Wolf | idle / stalk | 4 | |
| Wolf | run | 6 | |
| Wolf | leap | 5 | crouch tell on frame 1 |
| Wolf | bite (paired) | 4 | jaws clamped on frames 2–3 |
| Wolf | land_tumble | 5 | after shake-off |
| Wolf | overshoot_land | 4 | after Hiro's roll |
| Wolf | land_beside | 3 | after intercept |
| Wolf | hit_short | 3 | |
| Wolf | down_fade | 4 | stylized light, no corpse |

Total ≈ 71 Hiro frames + 38 wolf frames ≈ **110 painted frames for the first fight.** Slash L2/L3, aura, counter variants, finisher, bite_arm, victory_2/3, the Alpha and the second/third backgrounds are M3.

**Upgrade path, not plan of record:** if an image-to-video tool becomes available, the same briefs are used to generate one clip per action from the turnaround still; Fable extracts and processes the frames through the identical pipeline. Video models hold identity within a clip better than image models hold it across frames, so this can raise frame counts without raising drift. Nothing in the code changes either way.

---

## 6. How the first five minutes is built

This section is the implementation spine. Everything in §7–§11 hangs off it.

### 5.1 Architecture: one sim, one director, one actor layer

```
 ExpeditionQuest (data)          ExpeditionDirector              Actor layer
 ┌───────────────────┐   start   ┌────────────────────┐  beats   ┌──────────────────┐
 │ encounters[3]     │ ────────► │ runs Combat loop    │ ───────► │ HiroActor        │
 │ economy           │           │ reads st.events     │          │ WolfActor ×n     │
 │ tutorial steps    │           │ builds Beat list    │          │ BossActor        │
 │ asset phases      │           │ owns clock/pauses   │ ◄─────── │ CameraRig, FX,   │
 └───────────────────┘           │ handles requests    │  done    │ StatusBadges     │
                                 └────────────────────┘          └──────────────────┘
                                          ▲  ▲
                              tap Finisher│  │ buy upgrade
                                     ExpeditionHUD
```

**Sim (unchanged code).** `Combat.create(st…)` with Hiro on side `a` and the encounter's enemies on side `b`. The director drives `Combat.currentTurn(st)`, chooses Hiro's action with `Combat.autoReadyAction(st, u)` (or a queued Finisher request, §6.4), calls `Combat.act(st, u, action)`, then `Combat.advance(st)`. Enemies act through the existing `combat_ai.js`. Every outcome the player sees originates as an entry in `st.events`.

**Director (new, `js/expedition/director.js`).** Owns the loop that `scene_combat.js` currently owns. After every `act`, it slices `st.events` from its cursor, groups them into one *action group* (the acting unit's `use`/`damage`/`evade`/`counter`/`status`/`down` events for that action), and translates the group into a list of **Beats**. It then plays the Beats in order, waits for the actor layer to report completion, and only then advances the sim. The sim never runs ahead of the picture; the picture never shows what the sim didn't resolve.

**Actor layer (new, `js/expedition/actors/*.js`).** Phaser sprites with a small state machine each: `idle | ready | walk | draw | attack_* | hit_short | hit_bite_leg | hit_bite_arm | roll | intercept | riposte | aura_* | finisher_* | victory_* | down | sheath`. An actor accepts a Beat, plays its clip(s), fires `contact` at the frame tagged in the clip's metadata, and resolves a promise on the clip's `release` frame. Paired beats (a bite, a parry) are played by *both* actors from one shared timeline so contact frames align.

**HUD (new, `js/expedition/hud.js`).** Health, gold, encounter progress, pause/mute at the top; Hiro's portrait (Finisher control) plus four skill-upgrade cards at the bottom; the forward arrow on the right edge. The HUD never talks to the sim directly. It posts two request types to the director: `requestFinisher()` and `buyUpgrade(skillId)`.

### 5.2 The event → beat mapping

This table is the whole cinematic layer in one place. "Outcome" is the sim event; "Beat" is what the actors play. The director selects among variants using a seeded RNG (`js/core/rng.js`) keyed to the encounter seed so a run is reproducible for tests.

| Sim outcome (from `st.events`) | Beat(s) played | Variant selection |
|---|---|---|
| Enemy `use pack_snap` + `damage` on Hiro (`tag: 'attack'`) | Wolf `leap` → paired `bite_leg` or `bite_arm` on Hiro → wolf `land_tumble` → Hiro `shake_off` → both `recover` | Leg bite by default; arm bite at most once per encounter and only when dmg ≥ 20% of Hiro's max HP. Plain `hit_short` for the third and later hits in the same round. |
| Enemy `use pack_snap` + `evade` on Hiro | Wolf `leap` → Hiro `roll` → wolf `overshoot_land` → Hiro `rise_facing` | Every third successful evade may use `sidestep_short` instead to keep rolls special. |
| Enemy attack + `counter` + `riposte` (Counter Attack stance active) | Wolf `leap` → Hiro `intercept` (blade angle, spark at contact) → wolf `land_beside` → Hiro `riposte_cut` → wolf `hit_short` (+ `down` if lethal) | L2/L3 Counter uses the two-beat and sweeping variants (§9). |
| Hiro `use katana_slash` + `damage` per target | Hiro `slash_L{n}` with contact per target in lane order → each wolf `hit_short` or `down` | L1 one target; L2 primary + adjacent; L3 all with dash/afterimage. |
| Hiro `use god_aura` + `status` (aura) | Hiro `aura_L{n}` → badge appears on Hiro | Never interrupts an in-flight bite; queued to the next action boundary by the sim itself. |
| Hiro `use finisher` + `execute` (lethal) | Camera push → Hiro `finisher_L{n}` → target `fade_light` → Hiro `compose` | Only path that may end an encounter with the finishing beat. |
| Hiro `use finisher` + `damage` (boss, non-lethal) | Hiro `finisher_L{n}` → boss `hit_heavy` + `recover` | No victory cue. Overlay text: "Heavy hit." |
| `status` bleed / poison tick (`tag: 'dot'`) | Badge pulse + small tick number; actor `flinch_micro` only if the tick is ≥ 8% max HP | Never a full hit reaction. Never invisible: if a camera move is in progress, the badge still pulses. |
| `down` (any wolf) | `down_fade` (stylized light, no corpse) | — |
| `down` (Hiro) | Hiro `kneel` → Retry overlay | — |
| `round` | Nothing visible; director checks timing budget (§6.3) | — |
| `end` (side b empty) | Hiro `victory_L{variant}` (hold → check road → turn blade → sheath, click) → gold collects during the hold → forward arrow enables | Three victory postures, never the same twice in a row. |
| Boss `use cleave` (the pounce) | Boss `scrape` → `crouch_tell` → `pounce_arc` (dust/leaves) → resolved as bite / roll / intercept above | Second-phase variants after boss HP < 50% (§6.7). |
| Any event with no bespoke beat | Fall back to `combat_presentation.event(scene, e)` (existing swing/impact/SFX helpers) | Guarantees nothing resolves silently. |

Rule: a beat may add zero damage, zero healing and zero status. The `damage` value on the event is the number that appears on screen.

### 5.3 The clock: turns inside continuous action

The sim is round-based. The director makes it look continuous by never showing a "turn" and by budgeting each action group's beats. Starting budgets:

| Beat class | Budget | Examples |
|---|---|---|
| Ordinary action | 0.4–0.9 s | `slash_L1`, `hit_short`, `aura_L1` |
| Paired special reaction | 0.8–1.5 s | bite + shake-off, leap + roll, intercept + riposte |
| Camera-emphasis beat | ≤ 2.0 s, at most one per 8–12 s | boss pounce, lethal Finisher |
| Draw / victory | 0.8–1.3 s / 1.0–1.5 s | opening draw, sheathing |

Round math at these budgets: a first-group round (Hiro + two wolves) costs roughly 2.5–4 s. Four to five rounds clears the group in 12–20 s of fighting, which leaves headroom for the draw, the tutorial hand and the victory beat inside the 8–35 s window in §7. If measured rounds run longer, shorten the *fallback* beats first, then reduce wolf HP, and only then touch reaction budgets.

While a beat plays, the sim is idle by construction (the director hasn't called `advance`), so nothing ticks invisibly. `document.hidden`, pause, and the tutorial spotlight stop the beat clock; on resume the current beat finishes from its paused frame. Reduced-motion mode swaps camera push/shake/flash beats for a static frame hold of the same duration so timing and readability are unchanged.

### 5.4 The portrait: Finisher on request

Decision 2026-09-18: the portrait fires **Finisher**, not Katana Slash. Reason: shipped Katana Slash has no cooldown and is Hiro's default automatic attack, so tapping it would change nothing visible. Finisher has a real precondition (a target below the threshold), which turns the tap into a "now!" moment, and it is the natural climax of the boss fight.

Pipeline:

1. **Readiness.** After every sim advance, the director evaluates `finisherReady = cooldown === 0 && exists living enemy with hp/maxHp < executeBelow(L)`. For the boss, the same rule applies with the boss's `bossThreshold` (0.60) so the moment reads on a big health bar. The portrait lights, its emblem pulses, and a one-line tooltip on first readiness says "Tap Hiro: Finisher."
2. **Hold-off window.** When `finisherReady` becomes true, the director sets `holdOff = 1 full round` during which `autoReadyAction` skips Finisher. This gives a beginner the chance to tap. Once the window passes, the normal auto policy may use Finisher itself. The demo is completable without ever tapping (acceptance criterion).
3. **Request.** `requestFinisher()` sets `pendingRequest = { skillId:'finisher', queuedAt: turnIdx }` if none exists; repeated taps do nothing and briefly show "Queued." An invalid tap (not ready) shows the reason for 1 s: "Finisher needs an enemy below 40%."
4. **Execution.** At Hiro's next `currentTurn`, the director revalidates: cooldown still 0, a valid target still lives. If valid, it calls `Combat.act(st, hiro, { kind:'skill', skillId:'finisher', target })` instead of the auto choice, using the *same* resolver and level as automatic use. If not valid (the target died to Bleed), the request is cleared with a short "Target down" cue and the auto action proceeds. No free extra turn is granted.
5. **Clear.** Requests clear on encounter end, Hiro down, restart, and on any purchase of a Finisher level (the new level applies to the next request, not retroactively).

A tap never interrupts a beat in progress; it is consumed at the next action boundary. Rapid taps, auto-use races, queued target dying, pause/resume and encounter transitions are explicit test cases (§6.9).

### 5.5 The upgrade pipeline

1. Gold is granted once per encounter by `awardRewards(encounterId)`, which writes `awardedRewardIds` to the save before it updates the HUD (so a reload during the victory beat cannot pay twice).
2. Tapping a skill card's `+` opens an inline chip: price, next level, one-sentence benefit, Confirm. Nothing else pauses.
3. Confirm calls `buyUpgrade(skillId)`: deduct gold exactly once, set `levels[skillId] += 1`, persist, flash the card, play a short purple pulse on Hiro (`upgrade_pulse` beat, 0.3 s, non-blocking).
4. The `manifestFor` shim (§6.6) reads `levels[skillId]` at the moment `Combat.act` is called. An action already resolved keeps the level it was resolved at; the next use employs the new variant.
5. The first purchase is tutorial-gated: after the first victory, the hand points at the recommended card (Katana Slash), the spotlight pauses the beat clock, and Confirm or Skip resumes it. Skip removes gating but not gold.

Economy (unchanged from v0.4, to be tuned in M2): start 0; group 1 awards 30; L1→L2 costs 20; group 2 awards 40; L2→L3 costs 40; boss awards 50. The reachable purchase paths before the boss are: one skill to L3, or two skills to L2. All are viable by design (§6.7).

### 5.6 Data: Expeditions overrides live in one file

`js/expedition/data.js` defines everything the demo changes, and nothing else in `js/data/` is edited:

```js
ADV.Expedition = {
  saveKey: 'adventurer_expeditions_hiro_preview_v1',
  hero: { base: 'hiro', statMult: {hp:2.2, atk:1.4, def:1.3, spd:1.2},
          perks: ['lone_wolf'], allowStatuses: ['bleed','poison'] },
  skills: {
    katana_slash: { 1:{power:1.6, target:'enemy', bleed:{power:0.4,rounds:3,stacks:true}},
                    2:{power:1.9, target:'enemy', splash:1, bleed:{power:0.5,rounds:3,stacks:true}},
                    3:{power:2.1, target:'allEnemies', bleed:{power:0.6,rounds:3,stacks:true}},
                    autoKillPct:0 },
    god_aura:     { 1:{auraAtk:1.2, auraDef:1.2, auraEvade:0.10, rounds:2, cooldown:5},
                    2:{auraAtk:1.3, auraDef:1.3, auraEvade:0.15, rounds:3, cooldown:5, shieldPct:0.15},
                    3:{auraAtk:1.4, auraDef:1.4, auraEvade:0.20, rounds:3, cooldown:4, shieldPct:0.25} },
    counter_attack: { 1:{counterNext:1, counterRounds:2, counterRiposte:'expedition_riposte', ripostePower:1.4},
                      2:{counterNext:2, counterRounds:2, counterRiposte:'expedition_riposte', ripostePower:1.7},
                      3:{counterNext:3, counterRounds:2, counterRiposte:'expedition_riposte', ripostePower:2.0} },
    finisher:     { 1:{executeBelow:0.40, healOnKillPct:0.25, bossDamagePct:0.20, cooldown:3},
                    2:{executeBelow:0.50, healOnKillPct:0.35, bossDamagePct:0.25, cooldown:3},
                    3:{executeBelow:0.60, healOnKillPct:0.50, bossDamagePct:0.30, cooldown:2, atkBuff:{mult:1.2, rounds:2}},
                    permStatGain:0, questGain:false, bossThreshold:0.60 },
  },
  enemies: {
    dire_wolf:   { base:'dire_wolf', level:1 },                       // pack_snap: stacking Bleed (shipped)
    blight_wolf: { base:'dire_wolf', level:2, tint:'Night Coat', accent:'#5cff8a',
                   hitStatus:{kind:'poison', power:0.5, rounds:3, stacks:true} },
    alpha:       { base:'alpha', level:4, actives:['pack_snap','cleave'], phase2At:0.5 }, // Bleed on hit (shipped)
  },
  encounters: [
    { id:'road_ambush',  bg:'road',   enemies:['dire_wolf','dire_wolf'],                gold:30 },
    { id:'thicket',      bg:'forest', enemies:['dire_wolf','blight_wolf','dire_wolf'],   gold:40 },
    { id:'clearing',     bg:'clearing', enemies:['alpha'], boss:true,                    gold:50 },
  ],
  economy: { costs:{2:20, 3:40} },
};
```

The numbers are starting tunes, not commitments. The shape is the commitment: one file, one save key, no edits to shipped data. A `manifestFor` shim wraps `Combat.manifestFor` so that when `u.ch.id === 'hiro'` and `ADV.Expedition.active`, the tier data comes from `skills[id][levels[id]]`; every other unit resolves exactly as it does on the website. `expedition_riposte` is registered as a new skill ID in this file (single target, `melee: true`, katana-tagged so Master Swordsman scoping still works if kept).

`blight_wolf` is a data clone of `dire_wolf`, so it inherits `pack_snap` and the wolf animation set; the only new art is the tint/accent pass and a green-eye/drool tell so the poison reads without text.

### 5.7 Encounter definitions and the boss

**Road ambush (2 Dire Wolves, L1).** Purpose: teach that fighting is automatic, show a parry, a dodge and one bite, then pay out. Expected 4–5 rounds. Bleed on Hiro from one landed bite is desirable here: it makes the badge visible before the player has to understand it.

**Thicket (Dire Wolf, Blight Wolf, Dire Wolf, L1–2).** Purpose: show the purchased upgrade early (the director biases Hiro's first action to the upgraded skill if it's ready), introduce Poison with one hint, and make the second purchase feel earned. Expected 5–6 rounds. Blight Wolf enters last so its tell is seen.

**Clearing (Alpha, L4).** Purpose: a readable tell-and-punish fight with room for Counter, Aura and Finisher. `cleave` is presented as the pounce (scrape → crouch → arc). At 50% HP, phase 2: the Alpha's `momentum` perk (shipped) is made visible as a rising red trail on consecutive attacks, and its pounce gains a second landing snap. Finisher on the boss is bounded damage (20–30% of max HP per use, one use per cooldown), so it cannot delete the boss but does decide the fight. Expected 7–9 rounds.

Viability across purchase paths is checked in M2 by running each of the reachable builds (Slash L3; Aura L3; Counter L3; Finisher L3; any two at L2) through the headless sim 200 times each with the no-tap policy. Target: every build clears the road in ≥ 85% of runs and no build exceeds the 5-minute ordinary-play bound.

### 5.8 Asset phases and loading

Startup budget: under **12 MB before `gameplayStart`**, measured cold-cache in the portal iframe, not assumed. The remaining assets stream during play. v0.4's 15 MB was a total; this splits it into phases because the full demo will not fit in 15 MB at painted-illustration quality.

| Phase | Loaded when | Contents | Estimate |
|---|---|---|---|
| A — before `gameplayStart` | Boot | Hiro first-fight sheets (§5.4), Dire Wolf sheets, `forest.webp` (480 KB) + ambush foreground layer, HUD atlas, effect textures L1, SFX bank, `16_battle` music (1.9 MB), skill icons L1 | ≈ 8–10 MB |
| B — during road ambush | On first `round` event | Thicket plate + foreground layer, Blight Wolf sheets (tinted variant), Hiro slash L2/L3, aura, counter variant sheets and effect textures, bite_arm pair, victory_2/3, icons L2/L3 | ≈ 3–5 MB |
| C — during thicket | On thicket's first `round` | Alpha sheets, clearing plate + foreground layer, `18_boss` music (1.9 MB), finisher L2/L3 sheets and effects | ≈ 4–6 MB |

`portal.js` already sends `loadingStart` at init and `loadingStop` when a scene reaches RUNNING; add `Expedition` to the `P.sync` scene keys so `gameplayStart` fires when the ambush is on screen, not before. If a later phase hasn't finished when its encounter starts, the forward-arrow walk extends by up to 2 s with the road scrolling (never a spinner); beyond that, the encounter starts with the fallback presentation for any missing clip.

**Production approach: painted key frames, played as limited animation.** No rigs, cutouts or part puppets (§5). Every frame is a complete painted Hiro or wolf from Astra, on-model to the plates. Fable keeps the painted look stable in motion by controlling what *isn't* painted: few frames, each fully finished, held on 2s and 3s, with smear frames on the fast cuts, ease curves on the holds, and the camera and effects layers carrying speed. That is how anime itself moves painted characters without crawl, and it is the opposite of asking an image model for 24 slightly different Hiros per second.

Drift control is in the brief and the review, not the renderer: each brief fixes the silhouette scale, ground line, facing, light direction, blade length and loc count; each returned frame is viewed against the plates and against its neighbours; a frame that drifts is regenerated alone. Contact and release frames are tagged in the sheet metadata so paired beats (bite, intercept) align by frame index, not by guesswork.

The M1 test is the bite-and-shake-off pair plus the opening draw, at 1× and 0.25×, judged side by side with the portrait plates: it passes when a viewer cannot tell the animated Hiro is a different asset from the portrait and no frame pops.

Sheet budget: ≈ 110 first-fight frames (§5.4). At a 512 px working canvas, trimmed and packed as lossy WebP at painted-illustration quality, expect 35–60 KB per frame, so ≈ 4–6 MB for Hiro and the wolf together. That is what the Phase A estimate below assumes; measure the first greenlit clip and re-plan if frames come in heavier.

**Background staging.** `road.webp` and `forest.webp` are painted with converging depth, not as lateral scrolls, and `road.webp` reads as farmland outside a city rather than a forest road. The demo stages every fight on a **foreground band**: actors stand on a shallow ground strip in the bottom third of the frame, the painted background sits behind as a parallax plate (slow), and one painted foreground foliage/rock layer sits in front (fast), so walking right scrolls the layers at different rates while the background's own perspective is never violated. `forest.webp` is the ambush backdrop (the ruined gateway makes a natural "road"), `road.webp` is not used, and the thicket and rocky clearing are two new painted plates in the same hand, plus the foreground layers. Painted plates get the existing environmental motion (canopy light, leaves, birds, mist) from `travel_ambience.js`.

### 5.9 Tests and determinism

Extend `tools/test_runner.js` with an `expedition` suite:

- **Determinism.** Seed → full run with the no-tap policy → the `st.events` log is byte-identical across two runs. Any director RNG draws from the same seed.
- **Completion without tapping.** 200 seeded runs per reachable build (§6.7) clear the road; none exceeds the 5-minute bound at the §6.3 budgets.
- **Finisher request races.** Tap while a beat plays; tap twice; tap, then target dies to Bleed before Hiro's turn; tap, pause, resume; tap during the victory beat. Expected: one request, one cast or a cleared request, never two casts, never a stranded request.
- **Purchase integrity.** Buy, reload mid-victory, confirm gold and level once. Buy during a beat, confirm the in-flight action keeps its captured level.
- **Save isolation.** Website keys untouched before/after a full Expeditions run; `adventurer_expeditions_hiro_preview_v1` is the only key written.
- **Portal.** `gameplayStart` fires after the first frame of the ambush, never before; `loadingStop` fires before it.
- **Browser/mobile.** Reuse `test/browser_mobile_launch.js` shape: phone viewport, tap targets ≥ 44 px, no hover-only info, no orientation trap.

Visual QA (a recorded run per milestone, watched at 1× and 0.25×) supplements these; it checks contact alignment, no clipping through paired actions, and no damage number without a visible cause.

### 5.10 Build order

| Milestone | Deliverable | Gate |
|---|---|---|
| **M0 — Reuse/gap map** (≈ 2–3 days) | `docs/design/EXPEDITIONS_REUSE_MAP.md`: every module/asset in §2 with dependencies, required change, validation. `expedition.html` entry + `js/expedition/` folder + `crazygames-expedition` release profile that bundles nothing outside the phase manifests. | Map reviewed; entry point boots the existing engine with Hiro vs two wolves in headless mode. |
| **M1 — Animation proof** | **Astra:** full-body side-on Hiro turnaround from the plates, greenlit against `hiro_cyber_20260916`; then the draw, bite_leg + shake-off (paired with the wolf's leap/bite/land_tumble) and slash_L1 frames per §5.4. **Fable:** grey-box placeholder frames at correct proportions so the whole first fight runs before painted art lands; HiroActor + WolfActor sheet state machines with tagged frames; intake pipeline (key, trim, register, pack, tag, review); director consuming real `st.events` for those beats, everything else through the `combat_presentation` fallback. | A viewer comparing the animated Hiro to the portrait plates at 1× cannot tell they are different assets; no frame pops at 0.25×. The bite/parry/dodge pair shows aligned contact and grounded weight. Measured frame weight confirms or re-plans the Phase A budget. |
| **M2 — First encounter** | Road ambush start-to-payout: HUD, gold, tutorial hand, inline purchase, victory beat, walk transition into the thicket background. `expedition_riposte` and the `manifestFor` shim. Determinism + purchase tests green. | An unfamiliar tester reaches the thicket unaided. Round timing measured against §6.3. |
| **M3 — Complete quest** | Thicket + Blight Wolf + Poison hint; second purchase; Alpha with pounce tell and phase 2; all 12 skill-level presentations and icons; Phase B/C streaming; reused music/SFX/voice; completion overlay + Replay; defeat/Retry. Full test suite green. | Every reachable build clears the road per §6.7. All 12 variants viewable in QA. |
| **M4 — Polish and validation** | Five uncoached testers; timing tightened; reduced-motion; cold-cache load measured in the portal iframe; store media captured from this build; tags fixed; isolation verified. | Acceptance criteria in §16 met. Export through the gated flow only. |

---

## 7. Five-minute opening: action script

Target 150–210 seconds including brief upgrade decisions. This is a tuning target, not a pre-rendered timeline. No cinematic is allowed to invent a hit, evade, purchase or kill that the game did not resolve.

| Approximate time | Action and staging | Player guidance |
|---|---|---|
| 0–8 s | Hiro already stands on the forest road. Wolves enter; a brief low-to-side camera settle reveals his full body and katana draw. Begin play immediately. | Small objective: "Clear the forest road." |
| 8–35 s | Two wolves attack from the right. A telegraphed leap gives a defensive exchange; a separate landed bite establishes contact and puts a Bleed badge on Hiro. Level-1 skills activate automatically. When a wolf drops below 40%, the portrait lights. | Hand cue on first readiness: "Tap Hiro: Finisher." Normal fighting does not depend on tapping. |
| 35–50 s | Victory hold; gold moves into the HUD. Hand points at Katana Slash's + and its inline chip. Apply the chosen upgrade immediately. | "Use gold to strengthen a skill." Recommendation, not compulsion. |
| 50–57 s | Tap arrow. Hiro lowers his blade and walks; road and foreground foliage scroll. Birds lift away. Next clearing enters without a new screen. | "Continue along the road." |
| 57–95 s | Dire Wolf, Blight Wolf, Dire Wolf. Hiro's first ready action is the upgraded skill. Blight Wolf's bite introduces Poison. | One hint when it lands: "Poison deals damage over time." |
| 95–110 s | Second gold payout. Show an affordable improvement in the same compact HUD. | Recommendation, not a compulsory build choice. |
| 110–118 s | Tap arrow. Move into rocky clearing. Wind, foliage, bird movement and music build toward the boss. | Progress shows the final encounter. |
| 118–170 s | Alpha: scrape, crouch, pounce, recover. Phase 2 at half health. Counter, Aura and Finisher have clear opportunities; the portrait lights at 60% boss HP. | No long explanatory overlay. |
| 170–185 s | Non-graphic defeat; Hiro settles his blade and sheathes. Small quest-complete overlay over the scene. | "Road cleared." Show gold, final skill levels and Replay. |

The encounter director creates opportunities for varied actions; it does not force every recorded beat regardless of player upgrades. Timing should remain brisk on every supported purchase path. No mandatory new narration. Existing appropriate short Hiro lines can punctuate arrival or victory without delaying play.

---

## 8. Gold upgrades during the action

Bottom HUD reuses Hiro's existing portrait as the Finisher button, with four compact skill-upgrade icons alongside it. Skill icons show current level and a small + control when affordable. Tap + to show an inline price, level and one-sentence benefit; confirm there. Portrait activation and upgrade controls are visually distinct and cannot overlap. No full-screen menu, trainer, skill tree, inventory or equipment screen.

Portrait behaviour is specified in §6.4; purchase behaviour in §6.5. Both remain accessible during fighting and between encounters. Pause/settings always remain accessible. A hand points to the real button without covering it. Skip guidance removes tutorial gating without removing rewards or a viable path.

Save current run gold/levels at stable checkpoints (each encounter's pre-fight state and each victory payout). Replay clearly starts a fresh level-1 demonstration. This prototype reset does not establish the final game's long-term progression policy.

---

## 9. Every supported skill level has its own presentation

Reuse existing skill effects as components, but each level needs a distinct motion/timing, weapon or aura effect, impact treatment and icon variation. Recoloring or enlarging particles alone is insufficient. More impressive must not mean slower or visually unreadable.

| Skill | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| Katana Slash | Crisp draw-cut, narrow violet arc, one target, light Bleed. | Step-through double cut with crossing arcs; primary target plus one adjacent hit; stronger Bleed. | Short crossing dash, controlled afterimage and broad final arc across the whole line; bounded group damage. |
| God Aura | Close violet outline and brief stance; modest 2-round buff. | Expanding ring and geometric accents; stronger 3-round buff and a small capped shield. | Layered crest and animated cloth/light response; strongest bounded protection and shield without hiding enemies. |
| Counter Attack | Redirected lunge, one riposte cut. | Pivoting intercept and two-beat response; two counters permitted. | Brief impact emphasis, controlled turn and sweeping answer; three counters, no infinite chain. |
| Finisher | Low stance and one clean closing strike (targets below 40%). | Feint, step behind, diagonal flourish (below 50%); larger bounded recovery. | Brief silhouette/afterimage sequence and sheathing beat (below 60%); short attack buff; ends a boss only if the actual result is lethal. |

Mechanics are the §6.6 starting values. Keep existing names and skill identity. Avoid importing runaway growth or random instant kills that make the demo incoherent.

Each of the 12 icon variants retains its recognizable motif with a clear level badge. Level changes must be readable on a phone. Test all variants and build combinations, including those not shown in a normal single run.

---

## 10. Cinematic choreography specification

Create cinematic moments inside the continuous battlefield, not repeated video interruptions. Full-body motion, paired contact, brief camera emphasis, expression, effects and sound express the existing combat outcomes. Surprise comes from varied valid actions, not unpredictable controls. The event mapping in §6.2 decides *when* each of these plays; this section says *what* they look like.

### Painted-fidelity rules for motion

- Every frame is a complete painting at plate fidelity from the approved turnaround; nothing on screen is drawn at a lower level of finish than the portrait. No "animation-quality" simplification of fur, locs, metal or cloth.
- Few frames, fully finished, beat many frames that wobble. Motion between key frames comes from holds, ease curves, smear frames and camera, never from stretching, warping or cutting a painted frame into parts.
- Secondary motion is painted into the key frames: locs settle a beat after the head stops; the sash and coat trail and drop; wolf fur ruffles on landing; the scabbard swings with the hip. The brief names these per frame so Astra paints weight, not jiggle.
- Painted light stays consistent: the brief fixes the key-light direction to match the background plate; camera pushes never expose a cropped limb or blade.
- Expressions are painted into the frames: grimace on the bite contact frame, focus in the guard, the shoulder release on victory.
- Effects (arcs, aura, afterimages, dust, leaves, sparks) are painted-texture particles in the same palette, layered over and under the actors, never flat vector shapes.
- Camera emphasis is a real push or pull on the layered scene (background, band, foreground move at different rates), so depth reads even during a close beat.

### Personality: battle-ready draw and victory sheathing

Hiro's composure contrasts with the wolves' explosive movement. Before the first exchange he plants his feet, turns slightly side-on, settles his left hand on the scabbard, releases the guard with his thumb and draws in one controlled motion. His gaze stays on the threat; locs and coat settle after the movement. End in a usable guard pose. The blade must visibly emerge from the scabbard rather than pop into his hand.

After the last enemy is actually defeated, Hiro holds the final pose for a beat, checks the now-clear road, turns the clean blade and guides it back into the scabbard with a precise closing click. A slight shoulder release communicates confidence. No blood-flick animation. Finish in the sheathed walking pose used by the forward transition. On arrival at the next threat, use a shorter ready draw. Never sheath while an enemy, projectile or unresolved damaging event remains active.

Target 0.8–1.3 s for the opening draw and 1–1.5 s for the group victory flourish. Gold collection happens during the victory beat. A forward tap may queue travel while the sheathing completes; never freeze controls behind a celebration. Three victory postures rotate so no two consecutive victories are identical.

Every future hero needs an authored ready/guard pose, battle-entry action, victory action and transition back to locomotion that expresses that character. Reuse the state/event interface, not Hiro's katana choreography.

### Wolf attack: parry and answer

Wolf crouches and springs. Hiro plants his lead foot and angles the katana to redirect the lunge. A small spark at contact marks the successful defense. Wolf lands beside him; Hiro follows with the resolved riposte. Feet, blade and attacker must connect convincingly. Plays only on a `counter` + `riposte` event.

### Wolf attack: rolling dodge

Wolf telegraphs its leap. Hiro drops into a compact roll, wolf crosses his former position, and Hiro plants a foot to rise facing it. Plays only on an `evade` event. A visually successful dodge cannot secretly deal the bite damage.

### Wolf attack: bite and shake-off

Wolf briefly grips the armored boot/shin. Hiro grimaces, braces on his free foot and shakes it away. Wolf tumbles and recovers. No torn skin, wound, blood or prolonged distress. The `damage` event's value applies once; the Bleed badge appears at release. This is a short hit-reaction variant, not an unplanned extended stun.

Arm-grip variant: wolf clamps onto the armored forearm/sleeve; Hiro's shoulder and elbow yield under its weight, his torso turns, and his rear foot braces. He rotates the trapped arm and shakes/pushes the wolf clear with the free arm or guarded hilt, then recovers his weapon guard. Keep jaws aligned to the grip point throughout and show compressed fabric/armor contact rather than teeth puncturing flesh. The wolf lands and regains footing instead of floating away. At most once per encounter (§6.2).

Both actors need synchronized entry, contact, release and recovery frames. Do not attach a wolf rigidly to a moving limb with no compensating body motion, or add extra damage while the animation lingers.

### Ordinary impacts

Use shorter recoil and recovery poses for most hits. Reserve elaborate bite reactions so repeated damage stays brisk. Locs, cloth and armor respond to motion rather than float apart.

### Boss pounce

Boss scrapes the ground, crouches, launches through a readable arc and lands with dust/leaf movement. The actual outcome selects intercept, roll or impact. Recovery is visible before the next heavy action. Phase 2 adds a rising red momentum trail and a second landing snap. A larger health bar alone is not a distinct boss.

### Finishing beat

A brief camera push and weapon trail emphasize a mechanically lethal hit. Enemy retreats or fades in stylized light; Hiro returns to a composed stance. No gore, dismemberment, impalement, execution close-up or corpse focus. If Finisher is not lethal (the boss), show a heavy strike and recovery rather than falsely announcing victory.

### Timing, synchronization and variation

Budgets are in §6.3. Camera-heavy moments occur roughly once per 8–12 s at most. Queue/coordinate participants so wolves do not clip through a paired action or inflict invisible damage off-camera. When emphasis slows or suspends time, the sim is already idle (§6.3); no status ticks while the picture is frozen. Protect the upgrade HUD, health and status visibility during camera moves. Seed variation for reproducible tests. Pausing, backgrounding or low frame rate cannot skip damage, double rewards or leave actors permanently locked.

---

## 11. Status effects and recovery

Reuse current status resolution wherever possible. Demonstrate Bleed two ways (Katana Slash on wolves; wolf bites on Hiro), Poison from the Blight Wolf, and God Aura as a beneficial status. Other existing effects remain expansion candidates.

Bleed retains damage-over-time function but uses an abstract crimson slash badge and ticks, not blood trails or open wounds. Poison uses a green icon and restrained motes, not graphic sickness. Display remaining rounds and bounded stacks consistently with the reused rules. Do not label turn-based values as seconds without a real conversion.

First Poison hint: "Poison deals damage over time." First Bleed on Hiro: "Bleeding — it wears off." Checkpoint rule: clear hostile effects and restore Hiro's health between groups, preserving gold and upgrades.

On defeat, a short kneel and Retry return to the current encounter's pre-fight checkpoint, retaining previously purchased upgrades and current gold. No gold charge, ad or permanent death. Retry never re-awards a payout already recorded in `awardedRewardIds`.

---

## 12. Asset and audio plan

Inventory before generation. Confirmed on disk:

- Hiro reference: `assets/anime/v2/runtime/hiro_cyber_20260916.webp` (1000×500, 463 KB): a faceless head plate (purple locs with silver cuffs, dark skin, a tech implant at the temple) and a separate outfit plate (black lacquered lamellar with purple LED trim and gold fittings, purple sash and under-robe, katana at the left hip). Front-facing, no legs, no face — the face is composited at runtime. It is the identity source, not an animation source. **First art task: a full-body side-on turnaround painted from these plates** (guard, neutral, and a back three-quarter for the roll), greenlit before any part is cut.
- Wolf: the Dire Wolf is the top-left creature in `assets/anime/v2/runtime/creatures_1.webp` (1024×1024 sheet, grey, side-on snarl, weight on the forelegs). It is a usable animation reference as painted. The Alpha is the same design at boss scale with its own painted parts (heavier ruff, scarred muzzle, larger jaw parts), not a scaled sprite. `assets/anime/v1/werewolf.png` is *not* the wolf and must not be used.
- Backgrounds: `forest.webp` (1279×760, 480 KB — ruined stone gateway on a mossy paved path under old trees, sun shafts, painted depth) is the ambush backdrop. `road.webp` (1024×760 — farmland road with a bridge and walled city) does not read as a forest road and is not used. The thicket and rocky clearing are two new painted plates in the same hand and light, each with a painted foreground layer, per the foreground-band staging in §6.8. `assets/anime/travel/v1/source/road_forest.png` is a candidate source for the thicket plate.
- Music: `Claude outputs/16_battle_v2.mp3` (group fights), `18_boss_v2.mp3` (Alpha), `05_gnashing_wood_v2.mp3` (optional walk ambience), each ≈ 1.9 MB. Music continuity: one battle track across both groups, crossfade to boss on the second arrow.
- Voice: `audio/vo/HIRO/` holds 16 clips in four sets (`general_1–4`, `friendly_1–4`, `hatred_1–4`, `romantic_1–4`). None are combat lines. Audition `general_*` for arrival/victory fit and `hatred_*` for the boss arrival; exclude `romantic_*` and anything campaign-specific. Expect zero to two usable lines; silence is acceptable. The ARPG's `Kenji/voice_audio` folder is a second inventory source for Hiro-voiced lines.
- SFX: the synth bank in `combat_presentation.js` plus any authored impacts found in `audio/`.

Primary new production (all Astra, all at plate fidelity, per §5 and §10):

- Hiro side-on turnaround; Hiro key-frame clips — first fight per §5.4 (≈ 71 frames), then M3: slash L2/L3, aura ×3, intercept + riposte L2/L3, finisher ×3, bite_arm pair, sidestep, victory_2/3.
- Dire Wolf key-frame clips per §5.4 (≈ 38 frames); Blight Wolf as the tinted variant with green eyes and drool tell; Alpha at boss scale (the wolf set plus scrape, crouch_tell, pounce_arc, hit_heavy, phase-2 frames).
- Effect textures for the twelve skill-level presentations (arcs, afterimage, aura layers, badges, motes, spark, dust, leaves, defeat-light) and the 12 icons; existing effect components reused where they match the palette.
- Two painted background plates (thicket, rocky clearing) and three painted foreground layers.
- HUD skin: portrait frame and ready state, card frames, arrow, hand, coin, completion overlay frame.

Fable assembles, tags, times and plays all of it. Static portrait slides, wobbling cutouts and camera shake do not satisfy full-body choreography. Frames that drift off-model do not satisfy the style requirement and are regenerated individually.

---

## 13. Audience and presentation boundaries

Preteen-friendly action, suitable in tone for younger viewers. Keep the established painted illustration style with slightly exaggerated physical reactions. No swearing, sexual material, gore, torn flesh, graphic injuries, cruelty or prolonged suffering. Boot-bite reactions are brief and stylized.

This is a creative target, not a claimed age certification. Review actual motion, sound and framing before release. Retaining a status named Bleed does not permit bloody imagery. No adult campaign scenes or the `romantic_*` voice set are imported.

---

## 14. HUD and future scope

Top: health, gold, encounter progress, pause/mute. Bottom: reused Hiro portrait with Finisher readiness, plus four compact skill-upgrade cards. Right edge: forward arrow after combat/rewards. Status icons stay close to affected actors. No notification stack, recruitment UI, gear inventory or quest browser.

Large readable touch targets (≥ 44 px) and no hover-only information. Test desktop and phone layouts before declaring mobile support. No trapped orientation overlay. Tutorial hand can always be skipped and does not repeat completed instructions after reload.

Quest completion shows earned gold, final skill levels and Replay over the scene. It must not promise playable quests that do not exist.

Later: preset characters authored from existing Adventurer gear/skills, more missions, story, and broader progression. Each future hero binds its own signature skill to its portrait through the same request pipeline (§6.4).

---

## 15. Isolation, implementation and release

Use a separate worktree/branch, `expedition.html` as the entry point, and a `crazygames-expedition` release profile. Reference stable existing code/assets rather than maintain copied rewrites. All overrides live in `js/expedition/` (§6.6); nothing under `js/data/` or `js/core/` is edited for this edition except additive hooks (the `manifestFor` shim registration and the `Expedition` scene key in `portal.js`), each covered by both editions' regression checks.

Save namespace: `adventurer_expeditions_hiro_preview_v1`, via the existing atomic single-string pattern in `save_store.js`. Store checkpoint, skill levels, gold, `awardedRewardIds` and tutorial progress. Never reset or migrate website saves. Use LocalStorage only (matching the declared save method); the SDK Data Module is a later option.

Required pre-implementation artifact: the M0 reuse/gap map. Any proposed replacement of a functioning shared system must explain why an adapter is insufficient and its impact on the original game.

Load only this quest's assets in the phases of §6.8. Recheck current CrazyGames technical requirements at submission. Do not send `gameplayStart` early to disguise loading. Export separately through the gated flow; no automatic website publication. No ads or new monetization systems in this demo.

---

## 16. Acceptance criteria

- Immediate in-game action without title/creation/selection screens.
- Two ordinary groups plus boss, around 2–3 minutes of brisk play and at most five minutes of ordinary guided play; no forced timeout for reading or pauses.
- Four current signature skills start level 1; every supported level has its own authored look and flavor.
- Portrait tapping visibly requests Finisher; cooldown, threshold and action rules are preserved. Rapid taps, automatic-use races, queued targets dying, pause/resume and encounter transitions cannot double-cast or strand a request. The entire demo remains completable without tapping.
- Hiro has a convincing battle-entry draw and group-victory sheathing sequence, with clean transitions into guard and walking. Arm/leg grips, parries and rolls show aligned contact, grounded weight transfer and synchronized recovery without graphic injury.
- Gold upgrades are quick, readable and reflected in the next valid use; rewards and purchases occur exactly once across reloads.
- Every reachable upgrade path clears the road in ≥ 85% of 200 seeded no-tap runs; skipping guidance cannot trap the player. No endless healer build, permanent status lock or automatic boss deletion.
- Real outcomes match parry/dodge/hit/Finisher choreography; no off-camera damage, detached body parts, slipping weapons or persistent animation locks. Seeded runs are deterministic.
- Poison, Bleed and aura are readable with audio muted and without graphic imagery.
- Existing voices/music/effects are reused appropriately; new audio work requires a documented gap. No external asset fetches.
- Pause/background/resume and checkpoint retry remain reliable. Cold-cache load to `gameplayStart` measured in the portal iframe is under 12 MB.
- At least five unfamiliar testers: four of five make a purchase and reach the boss unaided. Record excitement, boredom and comprehension; a small sample is not proof of retention or platform acceptance.
- Website behavior, saves and exports stay unchanged. Shared-code changes receive both editions' regression checks. Visual QA supplements automated tests.

---

## 17. Decisions and superseded scope

**Confirmed 2026-09-18:** reuse-first remake on the existing deterministic combat engine and its event stream; **the existing painted illustration style kept at full fidelity and taken into full animation as painted key frames played as limited animation** (no cel-shaded or simplified tier; no rigs, cutouts or part puppets); **Astra paints every pixel, Fable 5.1 builds every mechanic, the intake pipeline and the tests** (§5); foreground-band staging on painted plates; a side-on Hiro turnaround as the first art task; a ≈ 110-frame first-fight budget; Hiro alone; immediate wolf ambush; automatic fighting; **portrait binds Finisher** with a single queued request, a one-round hold-off window and idle-compatible automatic fallback; quick gold-funded skill upgrades from one override file; **ordinary wolves inflict Bleed** (shipped `pack_snap`); **Blight Wolf** (dire_wolf data clone with Poison on hit) as the second-group status enemy; Alpha as the boss with bounded Finisher damage; Counter Attack's riposte decoupled from Katana Slash; cinematic full-body interaction with convincing contact; character-specific battle-ready and victory animations; continuous encounter transitions; younger-audience non-graphic tone; one mission before expansion.

**Proposed defaults to tune in M2/M3:** every number in §6.6, the economy, checkpoint healing, phase budgets, the 12 MB pre-gameplay ceiling, and which existing Hiro voice lines (if any) fit.

**Superseded from v0.4:** the "anime cel-shaded" description of the art (the art is painted illustration); "sheets vs rig" as an open test (rigs and cutouts are rejected outright; frame-based is the method); `road.webp` as the ambush backdrop; portrait bound to Katana Slash; "specific reason for rejection unknown" (see §1 evidence and the paste-in block); a single 15 MB budget with no phasing; venom enemy left open; Counter Attack riposte implicitly reusing Katana Slash; the unstated assumption that Katana Slash's `autoKillPct` and Finisher's `permStatGain`/`healOnKillPct 2.0` would be handled somewhere.

**Superseded from v0.2/v0.3:** opening party selection, three-hero production, equipment-upgrade tutorial, XP-based branching upgrade screen, automatic commitment to a new cooldown simulation, three-quest submission scope, permanent-versus-run progression assumptions, and v0.3's prohibition on direct skill activation.
