# Adventurer: Expeditions — change log

Every change made to this folder since it was created, newest first. The
original website game in `../adventurer` is never modified; entries here only
ever describe files inside `adventurer-expeditions/`.

**How to keep this file.** One entry per working session, dated. Record what
changed, which files it touched, and any decision that a later session would
otherwise have to re-derive. Numbers that were tuned belong here with their
before/after, because the GDD only carries the current value.

Entries before 2026-09-19 were reconstructed from the working session and the
files themselves; they are accurate as to content, approximate as to the order
of small fixes within a day.

---

## 2026-09-28 - Stable enemy scale, three inn guests and swamp polish

Removed crowd-dependent shrinking; goblin/spider are now 175/155 high against Hiro's 330, with four repainted matching finisher sheets. Added three inn paintings (mage+dancer, warrior+barmaid, ranger), stable five-scene rotation, level swamp battlefield and a one-shot 750 ms ground dust defeat effect. Existing inn loops reused. Files: actor spacing in `scene.js`, visual heights in `campaign.js`, `inn_art.js`, `battle_stage.js`, `defeat_fx.js`, goblin/spider atlases, inn manifest/paintings, swamp plate, ship manifest, xp12 cache stamp, browser/inn checks and `build_inn_swamp_polish.py`.

Presentation browser checks and focused unit checks passed; startup 14.74 MB after audio unlock. Full npm test still fails the pre-existing balance win-rate floor, independently reproduced from the pre-art Git checkpoint. Details, source prompts, validation and limitations: `INN_SWAMP_POLISH_20260928.md`. No deployment; user playtest pending.

---

## 2026-09-28 - Second balance pass: harder monsters, guaranteed boss packs, bosses in regular waves, permanent board

Hiro's playtest of the first pass reached a fourth playthrough without ever meeting a two-boss wave (the 60% single-boss roll on the second playthrough), and asked for more bite. All knobs in `js/expedition/data.js` and `js/expedition/campaign.js`:

- **Base tuning** `X.monsterMult = { regular: { hp: 1, atk: 1.1 }, boss: { hp: 1.25, atk: 1.25 } }`, applied in `Enc.makeEnemy` after the enemy's own statMult and before the loop scale, so it is the first playthrough's tuning and every later playthrough compounds x1.3 on top of it. The Finisher's kill heal drops 35% -> 25% (`healOnKillPct`).
- **Boss packs are guaranteed.** `Camp.bossOdds`: playthrough 1 own boss only (the authored lists); playthrough 2 always two bosses (own x2 or own + another location's, 50/50); playthrough 3 and later always three. Was 60/20/20/0, 40/25/25/10, 25/25/25/25. `Camp.maxBosses` stays 3.
- **Bosses join regular waves.** New `Camp.waveBossOdds` ([none, one, two]): playthrough 3 70/30/0, playthrough 4 and later 55/30/15. Bosses come from any location and stand last in the list (front-most on stage). A wave holds at most `Camp.maxWave = 4` monsters, the regulars making room, and at least one regular stays. The generated wave carries `bosses: n`. `X.bossShare` still applies by boss count, so a mixed wave with two bosses scales them by 0.7.
- **Permanent board.** The local board is browser storage only; CrazyGames does not keep it, so a cleared browser or another device starts empty. `X.board.hall = []` holds rows shipped with the game (Hiro adds them by hand from screenshots players send on Facebook), merged with the local rows in `Board.load`, best first, a tie keeping the permanent row above; `Board.local` and `Board.save` only ever touch this device's rows, so a permanent row is never written to storage and never duplicates. The End scene shows `X.board.note` above the Part 2 footer: *Made the top ten? Send a screenshot of this screen to Hiro on Facebook and your score goes on the permanent board in the next update.*

Balance probe after (100 runs per player, Rest below 50%; before in parentheses): no taps ends in the forest or the swamp's first fight with ~300 points (500); tutorial taps only ~400 (1,400), still dying at the swamp's first fight; casual median 4,175 (7,550), 77% end on the second playthrough; every-skill player median 5,850 (11,200), 99% end on the second playthrough, over half of them on the forest's two-boss wave; a mixed board's #10 after 100 runs 6,000 (14,000). No simulated player reaches the third playthrough now; Hiro, who reached the fourth under the old rules, plays better than the probe's tap-everything policy, so his playtest decides whether `X.bossShare[2]` or the boss multiplier should come down.

Tests: `test/expedition_sim.js` covers the heal, the guaranteed packs by loop, the regular-wave boss odds and placement, the base tuning under the loop scale, and the permanent board merge (loads `run.js` for that one). `npm test` green. `test:arcade` could not run on this PC (Playwright's Chromium is not installed here; the build sandbox runs the browser suites). Script stamp xp2. GDD §4, §5.0, §5.0a and §7.0 updated. No new candidate built.

---

## 2026-09-28 - Arcade balance pass, docs and candidate

New `tools/balance_arcade.js` plays whole runs headlessly (Hiro alone, health carrying, Rest by rule, scoring and loop rules as the game applies them) for four players: no taps, tutorial taps only, casual (half the ready skills), and every ready skill. Findings as rolled: a two-boss wave was won 40/12/4% (forest/swamp/city) by the best player and a three-boss wave never, so no run reached a fourth playthrough; a tutorial-only player reached the first boss at ~10 hp and lost it 57% of the time; Rest never changed how far a run went. Two knobs, both in `js/expedition/data.js` and one line to revert: `X.bossShare = {2: 0.7, 3: 0.5}` (every boss of a pack is scaled by the pack's share on top of the loop scale, applied in `Enc.create`) and `X.tutorialHeals = true` (on the first quest of a run each fight opens at full health; from the second quest health carries as designed, applied in `Enc.makeHero`). After: two-boss waves 92/80/36%, three-boss ~10%; the tutorial follower clears the forest every time; the best player's median run is two full playthroughs (~11,400 points), about half reach the third; a mixed board's #10 after 150 runs is ~14,500. Rest left as designed; finding recorded in the GDD §4. Point table, loop scale and boss odds unchanged.

Docs: GDD v0.9 gains the arcade status paragraph, §4 (inn as built, Rest finding), §5.0 (End scene as built, name rules), new §5.0a (scoring, playthroughs, boss packs, balance table), §7.0 (skills as built), §16 and §17 entries; ART_STANDARD §8 item 7 (score mark and End-scene background as placeholders); `docs/HANDOFF_ARCADE_20260927.md` from the previous session. `test/browser_arcade.js` now covers both knobs (33 checks). Stamp xp1 of 2026-09-28.

Validation: npm test green here and on Hiro's PC; browser_arcade 33/33, browser_expedition --ship, browser_restart_dev 23/23, browser_finishers 10/10, browser_v3_art green (the session VM on the PC cannot launch headless Chromium — missing libXdamage — so browser suites run from the build sandbox against byte-identical files). Candidate: `dist/crazygames-20260928-arcade/` — 267 files, 42.45 MB, `release_check` ready to ship (dev tools off in the candidate; run it with `EXPEDITIONS_TEST_ROOT` pointing at the folder); cold start 13.62 MB to gameplay, 14.67 MB after audio unlock on desktop and emulated mobile portrait/landscape. Not uploaded. Hiro's playtest of the balance knobs is the next gate.

---

## 2026-09-27 - Travel recenter and arcade UI polish

After an obstacle Hiro now eases from the authored exit position to screen x=650 over 400 ms, then remains centered. Run cadence, 420 px/s landscape speed, obstacle action and travel duration are unchanged. Added a regression assertion covering the second half of all four journeys.

Score counters and the high-score panel now share a dark blue steel/gold frame. The board has alternating rows, three rank medals, and a highlighted best score when populated; the end screen retains its submitted-row highlight. The tutorial hand is a shaded glove with a purple/gold cuff and its existing tap/hold guidance. Next is a framed gold arrow with a readable label and gentler pulse (1.08/520 ms -> 1.035/720 ms). Hit targets and arcade scoring/progression remain unchanged. These are native graphics, adding no bitmap downloads.

Files: `js/expedition/{travel_art,ui_common,hud}.js`, `test/browser_v3_art.js`, `index.html` (xp9), this log. Validation: npm test passed; all four travel checks passed; arcade browser suite 32/32 passed with no page errors. Board, pointer and Next screenshots reviewed in `test/reports/arcade/`. No original website/shared files edited; no new upload candidate or deployment in this pass. Playtest approval pending.

---

## 2026-09-27 - Arcade mode (steps 1-7): score, single-level skills, health carry, Rest, End scene, board, loop rules

Implements the reviewed arcade plan (Claude Doc "Expeditions Arcade Mode Plan"). Gold is gone; a run scores points (regular 100, boss 500, +50 Finisher kill, +50 clean wave at >=75% hp, quest clear 300, x(1 + 0.25 per extra playthrough)). Every skill is owned from the start at one level (`X.purchasable = []`, `X.tappable`); God Aura is attack x1.35 only (`auraDef` 1 so the engine's divide-by-def stays neutral). The tutorial teaches Finisher (fight 1), Counter Attack (fight 2), God Aura (boss) and only holds on the first quest. Health carries across waves and quests (`run.hp` -> `ch.combatHp`); only the Finisher heal (35% on kill) and Rest at the inn restore it. Rest: full heal, 1,000 points doubling each use, refused at full health. Defeat ends the run; End Run sits in the pause menu behind one confirm. New End scene: score, playthrough, top-10 local board (`X.Board`, key `adventurer_expeditions_highscores_v1`), required name-shaped name (`X.validName`, 25 max), play again = fresh run. Loop 2+ (`Camp.loopEncounters`, seeded from `run.seed`): regular waves draw from a shuffled monster pool; enemy hp/atk x1.3 per playthrough, compounding, uncapped; boss wave rolls own / own x2 / own + another area's boss / three bosses with odds 60/20/20/0 (loop 2), 40/25/25/10 (loop 3), 25/25/25/25 (loop 4+); max three bosses. Crowded waves are placed by painted width (`spaceFoes`) and shrunk to no less than 0.82 (`Actor.rescale`). Defeat effects stay location-specific and play on any monster.

Files: `js/expedition/{data,encounter,campaign,run,shim,scene,actors,hud,scenes_town,ui_common,beats,dev,battle_stage,painted}.js`, `index.html` (End scene registered, `?at=inn&score=N`, stamp xp8), `tools/levels_doc.js` (no Gold column), `package.json` (`test:arcade`), tests `test/{expedition_sim,expedition_recruit_gate,browser_expedition,browser_restart_dev}.js` rewritten for the arcade and new `test/browser_arcade.js` (32 checks incl. a fourth-playthrough three-boss wave). Save key is now `adventurer_expeditions_arcade_v1`; older saves are ignored. Commits `b2fb884`, `dfe3592`, and Arcade 6 (loop rules). No original website files changed.

Validation: npm test green; browser_arcade 32/32, browser_finishers 10/10, ship journey and restart suites green in the build sandbox. Still to do: balance pass in the simulator, GDD sections for the inn/ending/loop rules, a new CrazyGames candidate, Facebook link and feedback destination. Hand-off prompt: `docs/HANDOFF_ARCADE_20260927.md`.

---

## 2026-09-27 - Atmospheric parallax travel

Supersedes the short-distance slow run below. Travel now scrolls newly painted distant scenery, ground and foreground at independent rates (0.07 / 1 / 1.5), with ground speed fixed at 420 world pixels/second. Hiro keeps the approved 16-frame, 800 ms run cycle. The existing obstacle action remains 1,490 ms with authored contact positions. Running on each side: forest/market 4,000 ms, rooftop 4,500 ms, swamp 5,000 ms; total including transition hold: 9,670 / 10,670 / 11,670 ms, formerly 7,670 ms. Weather remains active; the swamp adds fireflies and a slowly moving moonlit distance.

Files: `js/expedition/travel_art.js`, `index.html` (xp4 cache stamp), `test/browser_v3_art.js`, `tools/build_travel_atmosphere.py`, twelve `assets/expedition/travel/*/atmosphere-*.webp` layers, GDD and release notes. Masters, exact generation prompts, alpha corrections and packing regions are in `../adventurer-expeditions-source-art/astra-v3/atmosphere/`. No original website files changed.

Validation: npm test passed; four-beat browser checks passed (run/action/run phases, fixed speed, separate layer rates and real return to combat). Screenshots reviewed and painted band edges/rooftop camera gap corrected. Cold-cache SDK-stub checks passed at desktop and emulated mobile portrait/landscape: 13.60 MB to gameplay, 14.64 MB after audio unlock. New scenery is loaded on demand; total ship set is 267 files / 42.43 MB. Physical-phone and hosted-portal QA remain outstanding. Candidate: `dist/crazygames-20260927-parallax/`.

---

Follow-up gate: `npm run test:ship` passed the guided forest and swamp quests, travel, upgrades, save state and return to the inn. The frozen 267-file candidate passed `release_check.js`. No hosted upload performed.

## 2026-09-27 - Longer travel journeys

Travel now includes 3,000 ms of the existing sixteen-frame Hiro run before the authored obstacle action and 3,000 ms afterward. The central action keeps its contact positions and original speed (1,490 ms); total animated journey 7,490 ms plus the existing 180 ms transition hold = 7,670 ms. All four forest/swamp/city beats use this schedule. No new art downloads. Updated `js/expedition/travel_art.js`, its browser phase/transition checks and the script cache stamp. The upload candidate is refreshed separately as `dist/crazygames-20260927-travel/`; the previous polish candidate is superseded.

---

## 2026-09-27 - Release polish: readable finishers, grounded combat and inn guest

Implemented the user-approved polish pass. Alpha finishers 665-780 ms -> 1,400-1,620 ms; later monster finishers 770 ms -> 1,420 ms. The same frames/markers are retained with longer setup, impact and recovery holds. Two new battle plates provide continuous level mountain/city footing. Bram's existing seated painting appears after odd-numbered quest clears without granting recruitment. Original website/shared files remain unchanged.

Files: `js/expedition/{painted,inn_art,scene,battle_stage}.js`, `assets/expedition/stages/`, `index.html` (cache stamp xp2), `tools/{ship_manifest.json,build_battle_stages.py,package_crazygames.js,release_check.js}`, `package.json`, focused pacing/inn/browser tests and candidate-aware browser test paths. Source masters/prompts: `../adventurer-expeditions-source-art/astra-v3/release-polish/`.

A separate verified CrazyGames candidate hides development tools and enables SDK policy only in the exported copy. Total approximately 38.80 MB / 255 files; measured startup including first action and audio 14.64 MB. Local automated tests and visual checks are recorded in `docs/RELEASE_POLISH_20260927.md`. User playtest approval, uploaded portal QA and physical-device testing remain; no public deployment or acceptance claim.

---

## 2026-09-26 — Astra v3 art integrated: forest, swamp and city playable

User authorized source creation, intake and runtime integration in this session. The original `adventurer/` and synced shared files were not edited. Source masters and generation/reference records are in `../adventurer-expeditions-source-art/astra-v3/`; this is a local playtest build, not a publication or final art approval.

**Delivered.** Seven new monster atlases (serpent, beetle, moss giant, hag, goblin, spider, orc), each with idle, approach, attack, hit, down, threat/enrage and two unique Hiro paired finishers. Four scene-specific painted travel beats: forest carriage hop, swamp log slide, city market vault, city rooftop climb/run. Each has a clean plate, 12 registered action frames and environment loops. Swamp mud dissolution and city blue-flame defeat effects are loaded with their locations. Original music and existing battle plates are reused.

**Runtime.** Open quest list changed from rain/marsh/city/ruins to rain/marsh/city (4 to 3). Hiro remains the only selectable hero; recruitment stays locked. Swamp and city encounter identities remain stable for saves but now resolve to the intended monsters. Hag and orc explicitly have `boss: true`; other new creatures explicitly have `boss: false`, preserving the flat 25% / 50% Finisher thresholds. Paired kills still require the player's Finisher; the two new variants alternate without requiring skill levels. Boss enrage tells play once below half HP. Travel waits for its authored beat before changing scenes. Approach clips loop so entrance movement completes; native left-facing art is not mirrored. Weather now follows each quest's explicit setting rather than the shared renderer's marsh rain bias.

**Registration fixes.** Stable anatomical scale is retained throughout each sheet. Contact corrections translate frames rather than enlarge Hiro: market contact frames lowered 20 px; rooftop ledge frame anchor Y 560 → 630; rooftop bird loop scale 1 → 0.55. A complete-body ledge-grip frame replaces the source frame with cropped legs. Planted frames use the visible alpha baseline, avoiding floating feet.

**Size.** Runtime package approximately 38.15 MB / 252 files. Source PNG masters do not ship. Separate total-package allowance is 250 MB; initial-gameplay target remains 20 MB. Cold-cache local Chromium tests measured approximately 14.64 MB through first combat and audio, on desktop and emulated portrait/landscape mobile. This is not a measurement inside CrazyGames or on physical iOS hardware.

**Validation.** `npm test`; ship-allowlist browser run; complete three-quest ship run at 390 px width (three clears, zero defeats/errors); seven visible monster checks; all 14 new paired-finisher playback/contact/cleanup checks; all four travel beats sampled at five times; cold-cache startup test. Reports are under `test/reports/`. Final targeted Finisher test also covers actual skill execution for all ten creature sets (forest plus new locations).

**Files.** `assets/expedition/{serpent,beetle,moss_giant,hag,goblin,spider,orc,travel,effects}/`; `js/expedition/{data,campaign,encounter,painted,scene,actors,beats,defeat_fx,travel_art,scenes_town}.js`; script stamps in `index.html`; `tools/{build_v3_monsters.py,build_v3_travel.py,ship_manifest.json}`; `test/{expedition_sim,browser_v3_art,browser_finishers,browser_startup_budget}.js`; `package.json`; GDD, this log and generated `docs/LEVELS.md`.

**Still separate planned work.** September 24's skill-level removal, attack-only God Aura redesign and bespoke Part 2 ending screen were not part of this art/travel authorization and remain unimplemented. After the city, the current completion flow returns to the inn. Art is ready for Hiro's in-game approval; this entry does not certify platform acceptance.

---

## 2026-09-24 — Version 1 content: three locations, new monsters, no skill levels

Opus 5.5. Docs only; nothing built.

**Locations and ending.** Version 1 is forest (Road in the Rain) → swamp → city,
then an ending screen: thanks, **Part 2 with a new protagonist — stay tuned**,
follow Hiro on Facebook, send feedback. The old ruins leaves version 1. Checked
CrazyGames' gameplay rules: community links are allowed **in the game menu
only**, so the Facebook and feedback links go in the pause/settings menu and
the ending screen points there. GDD §5.0.

**Monsters (Hiro).** Swamp: serpent, beetle, moss giant, **hag boss**. City:
goblin, spider, **orc boss**. Designs, skills and roars from the original game
(river serpent, iron beetle, moss giant, mire hag, goblin, crystal spider, orc
king). Every enemy gets **at least two unique Hiro finishing moves** — 7 new
monsters, at least 14 new paired sheets. Defeat effects: forest sparkle (as
built), swamp **melt into mud**, city **blue magical flame**; recommended as one
painted effect per location plus a dissolve in code. `ART_STANDARD.md` v1.1 §7.

**Skills.** Levelling removed: each skill unlocked once, each unlock costing
moderately more (proposed 20 / 35 / 50 gold, which fits inside the tutorial
road's payouts). **God Aura** keeps its look but drops defense and evasion for
more attack (proposed ×1.35). Proposed single values for Counter Attack and
Finisher from today's middle level. GDD §7.0.

Open decisions added as GDD §16.18–21 and ART_STANDARD §8.

**Answered the same day (Hiro):** after the ending the player goes **back to the
inn and can replay** all three locations; **Part 2 is an add-on** to this game
at a future date, on the same listing (GDD §5.0, §16.19–20). Still open: the
Facebook address and where feedback goes.

---

## 2026-09-24 — Art standard: Hiro painted into every non-interactive scene

Opus 5.5. Docs and research only; no game code or art changed.

**Verified how the inn is built.** One still painting with Hiro in it, plus three
4-frame loops (candle, stew steam, hearth) placed from `inn.json`. Hiro does not
move; Astra's four-painting eating loop was rejected because the paintings did
not line up. Hiro: keep it as is.

**Verified how travel is built.** A website panorama scrolled sideways, code-driven
ambience on top, and Hiro as a separate sprite running in place at a fixed height.
Measured why it does not fit: fixed foot height lands on wall faces in the city
and ruins, the ground moves ~77 px per stride so his feet slide, the panoramas
are the website's style, and nothing reacts to him.

**New `docs/ART_STANDARD.md`**, with screenshots in `docs/art_research/`: the
standard, the research, three ways to build painted travel (recommended: clean
plate + Hiro painted onto it + local loops at his footfalls + a camera path),
beats per location, and what Astra delivers per beat. First job when art
resumes: one test beat, the forest-road carriage vault.

**Decisions (Hiro):** inn unchanged; the Bram inn painting shows at random on
return (not built); travel to be repainted as run-through scenes; enemies are
monsters only. GDD §10 pointer and §17 decision added.

---

## 2026-09-22 — Version 1 scope, the update model, and the size rule corrected

Opus 5.5. Docs only; no code changed. Hiro set the shape of version 1 and what
comes after it, and the size rule this project has been working to turned out
to be misread.

**Version 1: Hiro alone.** *"we should not offer a new hero. instead just leave
it at hero, develop 2 or 3 new enemy types, smooth out the animations with more
frames and call it a game."* Hiring stays locked, not deleted.

**Grow by updates, not sequels.** *"so instead of new game, we make new updates
and we keep adding heroes and locations?"* Yes: location packs and hero packs on
the same listing, loaded after gameplay starts. New GDD §12c.

**Bram is not the next hero.** *"it was something ai came up with, I haven't
really thought up the next character yet."* GDD §3 now marks the recruit table as
history. Bram's art stays on disk, out of the package, as an archive and as the
hero-pack test fixture.

**The size rule, corrected.** CrazyGames' technical requirements, read today:
initial download 50 MB or less to be accepted and 20 MB or less for the mobile
homepage, measured up to the first `gameplayStart` when the SDK is integrated;
whole game 250 MB and 1,500 files at most. This project has been gating the whole
package at 20 MB, so the 20.77 MB total is not a submission blocker. The number
that matters was last measured at 9.69 MB before the first fight (2026-09-21) and
must be re-measured. New GDD §12a.0 lists the tooling change — two numbers in
`size_check`, with `release:check` gating on the initial download — not built.

**Size review, verified and recorded, not acted on.** 20.77 MB / 214 files, of
which about 1.42 MB is loaded but never reached: website campaign and dialogue
scripts ~0.59 (dropping them needs a load test, since shared core files may
reference them), Bram voice 0.33, tavern plate 0.28, Bram inn painting 0.16, Bram
bust 0.06. `Dev.DEV_BUILD` is still true. The quest comment in `data.js` carries
two stale sentences above the current one. The fight ids `rain_boars`,
`rain_bandits`, `rain_boar_boss` and `city_watch` name creatures they no longer
field.

**GDD edits:** top status (direction, size), §2 override, §3 roster note,
§12a.0, §12b note, §12c, §14 size row, §15 reconciliation, §16.13 superseded and
§16.14–17 added, §17 decision.

---

## 2026-09-22 — The Finisher kills the boss wolves, with their finishing move

Opus 5.5. Hiro: *"Keep bosses at 25% and make the changes to fix this bug."* The
boss line stays at 25 %. Three changes, one of them a cause the diagnosis below
had not found.

**Readiness now matches execution** (`js/expedition/encounter.js`).
`Enc.skillState` builds the Finisher's target pool with each target's own line:
ordinary enemies at 50 %, bosses at `X.finisherThresholds.boss` (25 %). An Alpha
above 25 % is never offered, so the button glows only when a kill is real, and in
a mixed boss wave the Finisher takes the wolf instead of wasting itself on the
Alpha.

**The Alpha on the later levels now plays its finishing move**
(`js/expedition/actors.js`). With the kill fixed, the marsh, city and ruins boss
(`alpha_2`) died — but with a plain `down`. Hiro borrows the Alpha's sheet, which
holds the paired Alpha frames, only when the target's identity was exactly
`tutorial-alpha`; `alpha_2` is drawn from the same painted set under another name
and was skipped. The borrow now keys on the drawn set (`X.paintedActorOf`), the
rule `Actor.canPair` already used. The rain boss was unaffected: it pairs from
Hiro's own sheet.

**Casts get their cinematic beats** (`js/expedition/beats.js`). A skill fired
between turns (`how: 'cast'`) was not counted as a tap, so with Cinematic camera
on it got no push-in on the kill. It now counts like a requested skill.

**Tests.** `test/expedition_sim.js`: "the Finisher only glows on a boss when it can
actually finish it" (both boss wolves dark at 45 % and 30 %, lit and killed at
20 %; wolves and plants still finishable at 45 %) and "in a boss wave the
Finisher takes the wolf, never the boss above its line" (12 seeds). Both fail on
the old code. New `test/browser_finishers.js` (`npm run test:finishers`) finishes a
wolf, a plant and the boss on each open level and requires the kill, a paired
clip, and for bosses a clip from the Alpha sheet — 9/9 pass:

| level | target | result |
|---|---|---|
| rain | dire_wolf / thorn_lurker / road_wolf_leader | killed, paired |
| marsh | dire_wolf_2 / thorn_2 / alpha_2 | killed, paired |
| city, ruins | alpha_2, thorn_2 | killed, paired |

Also green: `npm test`, `test:ship`, `test:camera` (6/6, finisher kill seen),
`test:restart` (24/24), and every open level's waves load with the right sheets.
Cache stamp bumped.

---

## 2026-09-22 — Status after play-testing; the Finisher's boss-line bug diagnosed

Fable. Hiro, after playing the turn-agnostic build: *"the game is playing much
more smoothly now after those recent changes"* — and one report: *"finisher is
not working on dire wolf, it's not doing the finishing move animations or
killing him ... it's working on regular wolfs and plants though."*

**Status.** GDD v0.9's top status block is rewritten for today and the
2026-09-21 block kept beneath it as history; §15 gains a 2026-09-22
reconciliation. It had still said only the first road was playable and that the
build sat under 20 MB — both wrong since this morning.

**Diagnosis, no code changed.** Measured rather than guessed: the Finisher fired
at every creature an open quest fields, at 45 %, 30 % and 20 % health.

| creature | 45 % | 30 % | 20 % |
|---|---|---|---|
| wolf (rain), wolf_2 (later) | dies | dies | dies |
| thorn lurker, thorn_2 | dies | dies | dies |
| **Alpha, rain boss** | **survives, ~22 dmg** | **survives** | dies |
| **Alpha, later bosses** | **survives** | **survives** | dies |

The wolf Hiro means is the boss — the Alpha is a gray wolf, and the rain's is
built on the `dire_wolf` base. The cause is two thresholds that disagree.
Execution honours the boss line: `Enc.bossExecutable` unmasks a boss only at or
under 25 %, because the shared engine exempts bosses from execution outright.
Readiness — what lights the button — uses the ordinary `requireBelowPct 0.51`
for every enemy, boss included. So the button promises a kill at 51 % that the
game will not deliver until 25 %. With no kill, `opts.lethal` is false and
`Actor.canPair` correctly refuses the paired clip: the missing animation and the
missing kill are one bug.

It bites harder in the later boss waves, where the Alpha fights beside a wolf.
Both at 40 %, five seeds: the Finisher aimed at the Alpha three times and
**nobody died**, though a finishable wolf stood beside it — the boss sits in the
valid-target pool and threat targeting prefers it.

**Proposed fix, not applied.** Build the Finisher's target pool with each
target's own line — 50 % for an ordinary enemy, 25 % for a boss. The button then
glows only when a kill is real, an Alpha above 25 % is never offered, and in a
mixed wave the Finisher always takes the wolf. One change in `Enc.skillState`,
plus a sim case that fires at a boss at 40 % and asserts the button is dark.
Waiting on Hiro before touching code.

**Other status worth recording.** 20.77 MB against the 20.0 MB target, over by
Hiro's call and blocked at packaging. Status durations remain in rounds. The
headless-Canvas frame rate of 50.7 fps is a worst case with the GPU disabled,
not a measurement of Hiro's machine.

---

## 2026-09-22 — Skills fire between turns, and recover on a clock

Fable, to Hiro's spec after a design pass: *"I want the skills to be turn
agnostic, so they feel better ... it happens regardless of turn count because
that feels better to the player ... it'll also add more player agency since the
skill usage doesn't count as a turn."*

**Verified before building, as promised.** The shared engine counts statuses and
counters in rounds and `js/core` is never edited here, so acting out of turn was
a real unknown. A probe settled it: `Combat.act` on the hero while an enemy held
the turn returned ok, applied the aura, left the current turn and the round
exactly where they were, and the fight finished normally. The seam is that
`Enc.step` calls `commit()` and then `A.Combat.advance()` — a cast is the same
commit without the advance. No fallback was needed.

**Casting.** `Enc.castNow` resolves a queued tap immediately and deliberately
does not advance the turn, so a cast costs nobody a turn and skips nobody's.
`scene.drainCasts()` runs it between beats and inside the gap between turns,
never mid-animation: a tap made while an enemy is swinging waits for that swing
to land, then fires as its own beat. Measured in a browser: tap accepted at
once, fired 830 ms later when the animation ended, turn `b0` before and after,
round 2 before and after, one cast recorded.

**Recovery is wall-clock.** God Aura and Counter Attack carried cooldowns of 5
and 2 *turns*, which a player casting off-turn cannot read — the wedge would sit
still because no turn had passed. All six entries in `X.skills` are now
`cooldown: 0`, which is what stops the engine recording one, and
`X.skillCooldownMs` owns recovery instead: God Aura 10/10/8 s, Counter Attack
5/5/4 s. `Enc.cooldownLeftMs` is the only gate, `X.now()` is the single clock so
the simulation can hold time still, and the HUD wedge drains against `leftMs`,
repainted ten times a second while anything is recovering rather than stepping
once per turn.

**Durations stay in rounds.** God Aura's buff and Counter Attack's window are
applied by the shared engine in rounds, and moving them would mean the
Expedition layer expiring statuses the engine owns. Left alone deliberately: a
buff's length therefore still shifts a little with turn speed.

**Turn gap:** 1 s normal, 2 s slow, 0.5 s fast, per Hiro. The wait is sliced into
120 ms pieces so a tap during the gap fires almost at once instead of waiting
for the next turn.

**Frame rate, asked about.** No `fps` block in the Phaser config, so it is the
default: a `requestAnimationFrame` loop targeting 60, rendering at the display's
refresh rate, WebGL unless `?renderer=canvas`. Headless Canvas with the GPU
disabled — the worst case the tests can produce — measured 50.7 fps average
against a target of 60. That number says nothing about Hiro's machine; a live
readout in the dev panel is the honest way to answer it and has not been built.

**Expect it to be easier.** Free casts on top of a simulation that already wins
every fight is a real power jump. Deliberately not tuned yet: Hiro plays it
first, then enemies come up rather than skills coming down.

**Tests.** Two new sim cases: a cast fires between turns leaving the turn, round
and step count untouched and the fight still resolving; and recovery measured in
seconds, asserting no shipped skill carries a turn-based cooldown, that six
turns passing does not shorten it, and that advancing the clock does. The
journey's manual-skill contract now recognises `how: 'cast'` as a player tap
alongside `how: 'request'`, and its trace hooks `castNow` as well as `step` —
without that it would have seen no player-fired skills at all. Headless 21 sim /
9 / 25 / 6 / 6 / 5 / registration / contract / levels doc; browser `test:ship`
ok, `test:camera` 6/0, `test:restart` 24/0, level sweep 8/8.

---

## 2026-09-22 — Four levels in order; finishers match by painted set, not by entity

Fable, on Hiro's direction: unlock the other levels, wolf/Alpha/plant only, drop
"Clear the road" from the rotation, and run the suite because "the game will
break if you use monsters that don't have art".

**The rotation.** A run now starts at **Road in the Rain** and goes **the reed
marsh, the city watch, the old ruins**, then cycles. `X.slice.startQuest` says
where a run begins and `X.slice.openQuests` is the order; every place that used
to hard-code `'road'` asks `Camp.startQuestId()` instead. "Clear the road" keeps
its data as the dev panel's preview and as the record of the tutorial, but
nothing routes to it. Road in the Rain inherits the tutorial's gentle curve —
ordinary wolves, then wolves and lurkers, then the Alpha — because it is where a
new player now lands; the three after it use the tougher variants.

**Only reworked creatures.** Every wave across all four is wolf, thorn lurker or
Alpha. Verified in a browser: eight checks, wave 1 and the boss wave of each
level, every enemy carrying `xp_wolf_sheet`, `xp_plant_sheet` or
`xp_alpha_sheet`, every wave resolving, no page errors and no failed requests.

**Correct music and plates, over the budget deliberately.** Hiro: *"ignore the
budget for now ... it is more important that we set this stuff up correctly the
first time around."* So the marsh and the ruins keep `night1` rather than
borrowing a track that already shipped, and all four plates are in. The set is
**20.76 MB against the 20.0 MB target**. `size_check` now reports an overage
loudly and carries on; `--strict` still fails, and `release_check` uses it, so
nothing can be packaged over the line. Both behaviours are pinned in the
contract test.

**Finishing moves are matched by painted set, not by entity id.** Hiro asked the
right question — *"why is finisher and animations hard tied to a specific
entity, instead of a class type"* — after noticing the finisher animated on the
forest board and nowhere else. The cause: the paired clips name their opponent
exactly (`dire_wolf`, `thorn_lurker`, `road_wolf_leader`), and `Actor.canPair`
demanded that exact key, so `dire_wolf_2`, `thorn_2` and `alpha_2` were all
refused and the finisher resolved as an ordinary kill with no animation. The
pair is painted against a *creature*, so the rule is now the painted set:
`X.paintedActorOf` (which sheet the actor is drawn from) and
`X.paintedActorOfKey` (which sheet a definition resolves to). Any number of wolf
variants pair because they come out of the wolf sheet — no per-entity wiring —
while a recolour is still refused, so the gray wolf cannot double as the green
blight wolf. `X.clipFor` picks the family the same way. Without `data.js` loaded
(the animation harness) a name resolves to itself, which is the old exact-key
behaviour, so those contracts stay honest.

**Turn pacing.** A pause between turns, **2 seconds by default**, after the
beats have played and the icons have been refreshed — so it is time to read a
truthful HUD and tap, not dead air. **Turn speed** is a player setting on the
pause screen: slow (3.2 s), normal (2 s), fast (0.6 s).

**The developer tools stop disappearing.** `Shift+D` used to write a persistent
"hidden" flag; pressing it once removed the cog for good, across reloads, with
no way back from inside the game. While `DEV_BUILD` is true the tools are always
present, `Shift+D` opens and closes the panel, and a stored flag from before is
cleared on load so an affected browser recovers by itself.

**Cinematics off by default**, as asked, with a **Cinematic camera** row on the
pause screen beside Turn speed.

**New gate.** `expedition_sim` asserts every creature an open quest can field
resolves to a painted set that has finishing moves — the rule as it is actually
felt, rather than as a list of entity names — and that each variant resolves to
the same set as the creature its clips were painted against.

**Suites.** Headless 19 sim / 9 recruit / 25 lifecycle / 6 cinematic / 6 portal /
5 inn / registration / contract / levels doc. Browser: level sweep 8/8,
`test:restart` 24/0, `test:ship` ok, `test:camera` 6/0. `docs/LEVELS.md`
regenerated and now reads in play order.

---

## 2026-09-21 — Inn Embark was still the tutorial; Finisher missed half health

Hiro still never left the tutorial road, the first Finisher pause still did not
hold, Katana Slash still hit too hard, and the Alpha died too fast.

**Quest two was a lie.** `openQuests` already listed rain then city, and the inn
even drew a Next-quest button — but `InnScene.embark()` returned `replayRoad()`
whenever recruiting was locked, and the gold button the hand pointed at *was*
Replay the road. Sanitation was fixed this morning; the button was not. Embark
now walks `Camp.nextQuestId` (tutorial → rain → city → rain…) while hiring stays
shut. Replay the road is the quieter extra above it. Marsh and ruins stay closed:
their plates and `night1` are still over the 20 MB budget. `scenes_town.js`,
`data.js`.

**Finisher never paused at half.** Core targeting is a strict `<`, so a wolf
sitting on exactly 50% greys the icon out. Katana Slash at 1.6 plus bleed then
often skipped the window entirely. Fixes: Finisher L1–3 `requireBelowPct` /
`executeBelow` 0.50 → 0.51 (so "at or under half" is actually offered), and the
director holds as soon as the window opens rather than only on Hiro's next turn.
`data.js`, `scene.js`.

**Numbers.** Katana Slash L1 1.6 / bleed 0.4 → 1.3 / 0.3 (L2 1.6 / 0.4, L3 1.85
/ 0.5). Alpha 1.25 → 1.9 HP.

**Tests.** Headless sim: inclusive half-health window, ≥70% of road ambushes
open a Finisher window without a tap, inn still cycles rain then city.
Browser inn/recruit suites now read `embarkBtn` as the next quest and
`replayBtn` as Replay the road.

---

## 2026-09-21 — The real freeze: an enemy with no body. Wolf and plant only.

Fable. The cache-stamp fix earlier was necessary but it was not the freeze Hiro
was seeing. His screenshot showed it plainly: a green enemy health bar floating
by the arch with **no creature under it**, and a fight that could not end.

**Cause, and it was mine.** Road in the Rain opens on two cave boars
(`rain_boars`) and closes on a boar boss. When I added `X.shipped.actors` as the
list of art the runtime may queue, I left the boar out — deliberately, on the
strength of a contract assertion that said the boar atlas was "off-scope". That
assertion predated the rain quest being open. So `P.needed()` refused to load
the boar atlas, the boars arrived with stats and a health bar and no body, and
nothing could resolve. The guard meant to prevent a missing-art hang caused one.

**Hiro's call, and the better fix:** *"we should only be using the wolf and the
plant creature for now, since those are the only ones with full art."* Right —
so rather than shipping boar art, every open quest is rebuilt from the creatures
that have been reworked. Road in the Rain and the City Watch now field wolves,
thorn lurkers and the Alpha; the boars and the human foes are out of both. The
original rosters are kept in a comment beside each one so they can come back
when their art does. The marsh and ruins rosters were fixed the same way even
though they stay closed, so reopening them cannot repeat this.

The Alpha stays as the boss on purpose: 9 clips, 45 frames and three Hiro paired
finishers, which is the same bar as the wolf and the plant.

**A second bug the fix uncovered.** `alpha_2` — the boss of every non-tutorial
quest — had neither `artActor` nor `artIdentity`, so it resolved to no painted
set, and `scene.js` threw *"No complete painted enemy in tutorial: alpha_2"* the
moment a boss wave came up. It is now wired exactly as the road's boss is, and
its `tint` is gone; that belonged to plate art, not to a painted sheet. Worth
noting that this one failed loudly rather than silently, which is the behaviour
we want: the scene refuses to open a fight with an enemy that has no art.

**The gate that would have caught it.** `test/expedition_sim.js` now walks every
encounter of every open quest and asserts that each creature it can field has
its art in `X.shipped` — humans excepted, since they compose from the shared
part sheets. An enemy with no art stops the game rather than merely looking
wrong, so this is the more important half of the art contract; the scenery check
added earlier is the other half.

**Verification.** Headless 17 sim / 9 recruit / 25 lifecycle / 6 cinematic / 6
portal / 5 inn / registration / contract. A browser probe jumped straight into
Road in the Rain and reported both enemies carrying `xp_wolf_sheet` at full
size, the wave resolving, and no page errors or failed requests. `test:ship`
plays the whole journey into the rain quest and passes; `test:restart` 22/0.
Ship set 18.33 MB of 20.0.

---

## 2026-09-21 — Freeze: a half-updated build, and the guard against it

Fable. Hiro: *"game has crashed"*, then *"game is frozen and I can't restart."*
My fault, and the cause is worth recording because it will recur otherwise.

**What happened.** Thirteen expedition scripts changed today, but `index.html`
still stamped them `?v=20260920-astra-v2` — yesterday's cache-busting version.
Only `dev.js` had its stamp bumped, in the very commit meant to make the new
panel reachable. So a browser that already had the game open loaded **today's
`dev.js` against yesterday's cached `campaign.js`, `data.js`, `scene.js` and the
rest**. Today's code calls things that only exist in today's files —
`Camp.artShipped`, `X.shipped`, `X.fx`, the rewritten `sanitizeRun` — so the
scene threw during setup, died before `X.UI.corner` ever mounted, and took the
Start over button down with it. Hence frozen *and* unable to restart: the only
control that could have recovered the run is drawn by the scene that crashed.

Note what did **not** cause it. The headless suite was green, and a probe that
drove every new control in a real browser — weather cycling, time cycling, full
speed, previewing the locked marsh, then reloading — reported zero page errors,
zero console errors and zero failed requests. The code was fine. The delivery
was not.

**The fix.** All fifteen expedition scripts now share one stamp,
`20260921-xp3`, and move together.

**The guard.** `test/ship_budget_contract.js` now asserts two things about
`index.html`: every `js/expedition/*.js` script tag carries a `?v=` stamp and
all of them are identical, and that stamp's date is not older than the newest
file it covers. Either mistake fails `npm test`. Verified by deliberately
bumping one script out of step and watching the contract name the odd one out.

**For Hiro:** a hard refresh (Ctrl+F5) once, and the whole set comes down
together. `?fresh=1` clears a saved run without needing the frozen screen to
respond, which is the general escape hatch for this class of problem.

---

## 2026-09-21 — Full speed, a location preview, and the art catalogue

Fable. Hiro, after confirming the tutorial now works: *"temporarily disable the
cinematic cam and the slow down on finishing moves and skill use to see how the
game looks at full speed"*, *"I'm still not able to get to the next quest
location, it just repeats to the forest area again"*, and then a request for the
full palette to design level two with.

**Full speed.** `X.fx = { cinematics: true }`. With it false, `UI.cinematic`
runs its body straight through — no push, no slow motion, no scene bookkeeping —
and `hitStop` returns immediately, so no impact holds. The same hits land in the
same order at one speed. The dev panel's **Full speed** toggles it; players
cannot reach the switch. `data.js`, `ui_common.js`, `beats.js`.

**Why the forest repeats, which is not a bug.** Road in the Rain is painted on
the same plates as the tutorial road — `deep_wood, bandit_road, mountain` — with
the same `forest` panorama and storm weather. It is the same place in worse
weather, by design. The City Watch (alley) is the first visually distinct stop,
and it is open now.

**Preview a location.** A second page on the dev panel listing every quest,
locked ones included: picking one lifts the slice lock, retires the guidance and
drops into that quest's travel panorama, so the location is the first thing on
screen. The marsh and ruins are not in the packaged build, so this works against
a local server — which is where the panel lives — and not in a `--ship` run.

**Weather and time cycling.** `Camp.weatherFor` now honours `X.devWeather` and
`X.devPhase`, and the panel cycles both (clear / overcast / rain / storm, and
day / evening / night) restaging the scene so the change is painted. Both are
unset for players and nothing but the panel writes them.

**The catalogue, for level two.** The offshoot carries 7 battle plates and 4
travel panoramas; the website game has **34 plates and 28 panoramas**, each
0.26–0.48 MB, one `sync_shared.js` entry away. Contact sheets are in
`dist/catalogue/`. On creatures, Hiro was explicit — only reworked art counts.
Four creatures qualify: **wolf** (9 clips / 38 frames, five Hiro pairs including
the two bites), **thorn lurker** (4 / 17, three pairs), **Alpha** (9 / 45, three
pairs in its own atlas) and **cave boar** (5 / 20, animated but **no finishing
move painted**, and currently outside the ship set). Everything else in the game
is plate art and is not offered as an option.

**Tests.** Headless green (sim 16, recruit 9, lifecycle 25, cinematic **6** with
a new full-speed case asserting the body still runs while camera and clocks are
untouched, portal 6, inn 5, registration, contract). `test:restart` **22/0**,
now covering the Full speed toggle, the preview listing every quest, and picking
the city landing in its travel scene. Ship set 18.33 MB of 20.0.

---

## 2026-09-21 — The tutorial teaches during the fight; the city opens

Fable, on two reports from Hiro: *"tutorial is kinda broken, it start after the
3 wolves are killed"* and *"I'm unable to get to the second quest."* Different
bugs, both real.

**The tutorial was starting over the corpses, and the cause was the economy.**
The player began with 0 gold and every skill locked, and `guidePurchase()` ran
at the end of `victory()` — after the payout. So the first purchase could not
happen until a fight had already been won, and the in-fight prompts skip any
skill the player does not own, which left fight one on autopilot with an empty
kit. The pause-and-point machinery Hiro wanted was already built and correct; it
simply never got a turn. Fixes: `X.economy.start` 0 → 20, `guidePurchase()`
moved to the top of `fight()`, and the forward arrow now holds on every tutorial
fight rather than only the first. The road reads buy → fight → hold at half
health → tap → arrow, three times, once per skill. The player reaches the inn
with 110 instead of 90 (Hiro's call). `data.js`, `scene.js`.

**Quest two was unreachable by construction.** `Camp.sanitizeRun` forced
`questId` back to `'road'` whenever `recruitingLocked()` and the quest was not
literally the road — ignoring `X.slice.openQuests` entirely. Embarking on Road
in the Rain worked and was then undone by the next save load. It now tests
`Camp.questOpen(run.questId)`, so an open quest survives sanitation and a locked
one is still pulled back. `campaign.js`.

**The City Watch is open; the night pair is not, and the reason is size.** All
three locked quests already had their character art — the wolf, plant, boar and
Alpha, plus the human foes — so the only thing missing was backgrounds cut
earlier for space. The city's alley plate and panorama (0.66 MB) are back, paid
for by dropping Bram's combat atlas (2.42 MB): he cannot be hired while the inn
is locked, so the package was carrying a companion the player cannot reach. The
marsh and ruins share `night1` (1.00 MB) and need four plates (1.42 MB) — 2.42
against 1.68 MB spare — so they wait for a trim. **Ship set: 18.32 MB of 20.0,
1.68 MB spare**, down from 20.18 MB and failing this morning.

**A new rule, because a missing file does not degrade.** Phaser parks a scene in
`preload` until every queued file arrives, so an absent asset is a black screen,
not a fallback. `X.shipped.actors` now names what the runtime may queue;
`P.needed()` refuses anything outside it, and `Camp.recruitReady` refuses a
recruit whose art the package lacks — which is what stops the dev panel's "Open
every quest" from lifting the lock and sending the loader after Bram. Two
assertions hold the line: every open quest's music, plates and panorama must be
in the ship set, and `X.shipped` must match the package in both directions. That
second one caught a mistake of mine immediately — I had listed the boar, whose
atlas is deliberately off-scope because boars render from the shared plates.

**Tests.** Headless 15 sim / 9 recruit / 25 lifecycle / 5 cinematic / 6 portal /
5 inn / art registration / ship contract. Browser: `test:ship` ok, `test:camera`
6/0 with a finisher kill, `test:restart` **17/0**, including the new regression
for the reported bug — it asserts the first guidance arrives with every enemy
alive and nothing paid out, the skill is owned before any payout, and the fight
holds while enemies are still standing with one at or under half health
(observed: 2 living, 1 at or under half).

Several tests encoded the old economy and the one-open-quest slice and were
updated to state the rule rather than the number — gold is now expressed against
`X.economy.start`, the legacy-save smuggling test names `marsh` (a still-locked
quest) instead of `city`, and the Bram fixtures carry him in `X.shipped` for the
stretch that exercises the future loop. One honest note: `test:restart` timed out
once on a loaded machine before its tight waits were raised, so treat it as
occasionally slow rather than proven stable.

**Not done here.** The `js/data` trim, which is what would pay for the night
pair.

---

## 2026-09-21 — Module spec (§12b), and the trim candidates measured

Fable, design only — no code. Hiro asked whether parts of the game could be
flagged in and out of the build like modules, to tweak the size easily, and
chose "just give me the plan for now".

**§12b added to the GDD.** Three of the four pieces already exist: the ship
manifest plus `size_check`, `test:ship` serving only that set so a cut-but-
referenced file 404s in the tests, and `P.needed()` in `painted.js` as a single
chokepoint for actor atlases. What is missing is a `tools/modules.json` source of
truth, a `build:preset` generator writing `js/expedition/build.js`, per-module
sizes in `size_check`, and the preset printed by `release:check`.

**The safety rule is the load path, not the file system.** Phaser parks a scene
in `preload` until every queued file arrives, so an absent file hangs the game on
a black screen rather than degrading. The build must be *told* what is out, never
discover it. Modules being "off" never deletes anything; the files stay in git.
The one new hazard is a save naming a module that is now out, which must drop the
member with a note rather than crash — it gets its own test.

**Trim candidates, measured against the 182,102-byte overage.** Bram 2.26 MB (a
recruit the slice locks). `js/data` 1.37 MB in the ship set, of which
`voice_manifest.js` alone is 0.42 MB and the website's dialogue tables —
`campaign3_dialogue` 0.18, `dialogue_context` 0.11, `dialogue_bonus` 0.07 — make
up most of the rest; realistic recovery 1.0–1.2 MB. `tavern.webp` 0.28 MB, now
that the inn runs on painted inn art, pending a reachability check. `audio/sfx`
1.04 MB across 42 files, unaudited for what the slice actually triggers. Hiro's
atlas is 4.76 MB at 400 px, where a drop to ~340 px is worth 1.2–1.4 MB but is
Astra's call. Phaser at 1.19 MB could give up perhaps 0.3 MB to a custom build,
which is not worth the risk. Voice at 0.33 MB stays.

**A correction made in the course of measuring.** A first pass reported the five
part sheets (4.40 MB) as back in the ship set; they are not. The grep had matched
`ship_manifest.json`'s `partSheets` block, which `size_check` excludes while the
busts are baked. The plate audit was redone against `shipList()` itself. The real
result: the anime plates in the build total 1.89 MB, the alley, marsh, ruins and
city plates are already out, and `tavern.webp` is the only one the open slice
cannot reach.

**Hiro's direction on the trim:** Bram and the `js/data` trim, with more options
to discuss. Together those are ~3.3–3.5 MB against a 0.18 MB overage, which also
buys room for the unintaken candidates and the Hiro atlas split that load
phasing needs (§12a.3).

Docs committed by path again: the concurrent session's code is still uncommitted.

---

## 2026-09-21 — Doc corrections, and the size gate is failing

Fable, at Hiro's request after the status checklist: *"yea you can update the
stale lines. we do need to know the actual current size of the game got to keep
below 20 or won't meet crazy games mobile requirements."*

**The size, measured rather than quoted.** Last committed state is **17,867,032
bytes / 207 files**, 2.13 MB clear of the gate. The working tree is not: an
**Alpha boss intake landed at 13:57 today** from a concurrent session — page 0
grows 393 KB → 1.89 MB and a 399 KB page 1 is new — which puts the ship set at
**20,182,102 bytes / 210 files, over the 20,000,000-byte gate by 182,102**.
`npm test` fails on it, which is the gate doing its job. Packaged with gzip the
same set is 17.27 MB, but the gate measures served bytes and stays the strict
reading of the platform's 20 MB.

Where it sits: Hiro 4.76 MB, `js` 2.46, music 2.34, Alpha 2.31, Bram 2.26,
plates 1.89, Phaser 1.19, sfx 1.04, wolf 0.63, plant 0.40, inn 0.39, voice 0.33.
Two trims clear it and cost the slice nothing: the `js/data` trim (~1.5 MB, long
on the list) and **Bram's 2.26 MB, which ships for a recruit the slice keeps
locked** — he was taken off the critical path, but he is still inside the
package. Either alone is enough; neither has been done, and this is Hiro's call
to make against the Alpha art he just gained.

**Doc corrections.** Seven passages that the last two days had overtaken:
§12a.1a (the measurement above, replacing 15,650,969 / 195 files), §14's build-
size row (now flagged over), §15's preamble (said every-kill finishing behavior
was retained — it is tap-only since round 3), §15.1's "16.97 MB of 20.0",
§15.3 item 1 (said fourteen Hiro clips were on disk only — superseded by the
09-21 audit; the unintaken set is now the manifest-less candidates), §16's
preamble (said levelling buys the cooldown — it is gone), and §16.10 (finishers
gated to the last enemy — superseded by tap-only, and with no cooldown they can
chain inside a wave).

**Not touched: the code.** A concurrent session is mid-flight in this folder —
`actors.js`, `data.js`, `painted.js`, `scene.js`, `art_registration.js` and
`ship_manifest.json` are all modified and uncommitted at the time of writing,
giving the road's third fight a distinct painted Alpha with its own paired
finishers instead of a dressed-up wolf. Their work builds on this session's
commits and the Finisher cooldown change survived intact. This entry and the GDD
edits were committed **by path** (`docs/` only) so that nothing of theirs was
swept into a commit it did not belong in.

---

## 2026-09-21 — Finisher loses its cooldown

Fable, at Hiro's call: *"can you take the cool down off finisher? It's already
limited by having specific conditions it can be used under anyway."* Right —
the health window is the cost. A second Finisher needs a second enemy softened
below half, which the fight has to produce; a three-turn timer on top of that
mostly meant refusing the tap at the one moment the window finally opened.

`cooldown: 3 / 3 / 2` becomes `0` at all three levels in `js/expedition/data.js`.
That is the whole change: `combat.js` only records a cooldown when the manifest
carries a truthy one, so the HUD's wedge and the "Cooldown n" info chip simply
never fire for Finisher now. Levelling still buys the heal (25/35/50 %) and the
hit (2.4/2.8/3.2); the windows stay flat at 50 % normal, 25 % boss.

Finishes can now chain inside one wave, and the finishing cinematic with them.
That is intended — it is a reward for setting two enemies up — and the camera
test confirms the camera still comes home between them.

**Balance.** Every sim win rate stays 1.00. The measurable effect is the boss
wave with tapped finishers: ~1.8 rounds → ~1.4. Finisher windows seen 183,
fired by request 120, 0 requests dropped, 0 engine errors.

**Tests.** `expedition_sim.js` asserted `cooldown === 3`; it now walks L1–L3 and
asserts there is no cooldown at any level, so it cannot quietly come back.
Headless suite green (sim 14, recruit gate 9, actor lifecycle 25/0, cinematic
scope 5/0, portal readiness 6, inn art 5, art registration, ship budget).
Browser: `test:camera` 6/0 (finisher kill seen), `test:ship` ok, `test:restart`
12/0.

**GDD v0.9:** §7 carries the decision and the reasoning; §7a's real-time table
had Finisher on a 20 s ultimate timer, which now contradicted the rule, so that
row reads "none — the health window is the gate", with the note that if finishes
ever chain too freely in real time the answer is a gap between *cinematics*, not
a cooldown on the skill.

---

## 2026-09-21 — A true restart, and the developer's tools move into the game

Fable. Two things Hiro asked for after the round-3 build: *"yea it should be a
true restart"*, and *"assume that I as the developer will not use these urls,
and will need debug buttons in the game."* Mid-session he set the policy for
those buttons: *"we are still in development so it's ok to show debug tools, we
will just need a flag to hide debug tools after development."*

**Start over is a true restart.** `Run.startOver` used to build a fresh run and
then copy the old one's `tutorial` object into it — `arrowDone`, `finisherDone`,
`used{}`, `inspectDone`, `purchases`, `skipGuide`, `recruitDone`, `embarkDone`.
So a restart handed the player a blank save *and* a retired tutorial: no hand,
no holds, straight into a fight with an unlearned kit. It is now `Run.reset` and
nothing else, which is also exactly what `?fresh=1` builds — one path instead of
two, which is why the suites never caught this (`?fresh=1` had no `prev` to copy
from, so only the in-game button was broken). `js/expedition/run.js`.

**The developer's tools are a panel in the game.** New `js/expedition/dev.js`
(~9 KB) behind a cog in the corner control of every scene: Fresh tutorial, Jump
to the inn (road cleared, 150 g), Boss fight, +100 gold, Unlock every skill,
Open every quest (toggles `X.slice.firstLevelOnly`), Painted art off (toggles
`X.art.hiroSheet` for the A/B against the plates), Clear the save. Every jump
calls `UI.resetCamera` first, so a jump cannot strand a pushed-in camera.
`ui_common.js`'s corner control now exposes `button` and calls `Dev.attach`.

**One flag hides them.** Per Hiro's note, the tools are on by default during
development — no key to remember, and they work on a phone. `Dev.DEV_BUILD =
false` at the top of `dev.js` removes them completely for the CrazyGames
package: no cog, no keyboard shortcut, and nothing a stored setting or a URL can
do about it. For a player's-eye look without editing anything, **Shift+D** hides
and restores them, and `?dev=0` hides them for one session.

**New: `npm run release:check`** (`tools/release_check.js`) — the last gate
before packaging. Fails while `DEV_BUILD` is true, and checks that `Dev.attach`
is actually gated on it, that the build is inside the size budget, that the
busts are baked and that the notices file is there. It changes nothing. It
reports *not ready to ship* today, correctly: the flag is on because we are
still building.

**The URLs still work** for the automated suites, which cannot press buttons
before the scene exists: `?fresh=1` builds a genuinely fresh tutorial run, and
`?at=inn[&gold=N]` now routes through `Dev.innRun(...)`, so the shortcut and the
panel button produce the same run instead of drifting apart. `index.html`.

**New test: `npm run test:restart`** (`test/browser_restart_dev.js`, 12 checks,
all passing). It retires guidance the way play does, presses Start over in the
corner control, and asserts the run *and* the tutorial flags are blank in memory
and on disk and that the hand comes back unaided — the regression for the bug
above. Then the tools: present on a plain load, hidden and restored by Shift+D,
hidden by `?dev=0`, and — serving `dev.js` rewritten to `DEV_BUILD = false`,
which is the shipping build exactly — absent for the cog, the key and `?dev=1`.

**Verification.** Headless suite green (sim 14, recruit gate 9, actor lifecycle
25/0, cinematic scope 5/0, portal readiness 6, inn art 5, art registration, ship
budget contract). Browser: `test:ship` ok, `test:camera` 6/0 with a finisher
kill seen, `test:recruit` ok at 1280 and 375, `test:restart` 12/0. Size gate
17.87 MB of 20.0 MB.

**GDD v0.9:** §7 rewritten on both points, the developer-tools paragraph added,
the test list gained `browser_restart_dev.js`, and **§16.7 is answered** — Start
over resets the tutorial, decided by Hiro, 2026-09-21. The 2026-09-19 design
entry still reads "keeps the tutorial retired"; it is left as written, because
it is a record of what was decided that day, and §7 and §16.7 now carry the
correction.

**Housekeeping.** `dist/xp_sync3.tgz` and `dist/xp_sync4.tgz` are scratch
transfer archives (git-ignored). The sandbox cannot delete files in this folder,
so Hiro can remove those, and the two older ones, by hand.

---

## 2026-09-21 — Round 3: camera comes home, player-spent finishers, Road in the Rain opens

Fable. Hiro's playtest list plus the non-art backlog. Checkpointed first
(`2d14d71`), every suite green, ship set **17.86 MB / 206 files**.

**1. The camera always comes home.** `X.UI.cameraBase` is now a constant — zoom
1, centred — instead of a sample of the live camera. Sampling was the bug: a
baseline captured while a restore pan was still in flight became the next
baseline, so the zoom ratcheted in over a fight and never came back. Added
`X.UI.resetCamera(scene)` and called it on every exit: fight over, victory,
defeat, defeat-card buttons, wave arrow, scene restart, Start over, shutdown.
Files: `ui_common.js`, `scene.js`.

**2. Cinematic rates.** cast 0.50 → **0.70**, kill 0.36 → **0.55**; push-in
240/220 ms → **150/140 ms**. The first pass read as lag rather than drama.
`data.js` (`X.cinematic`).

**3. Finishing moves are player-spent.** Only a kill made with the tapped
Finisher plays a finishing move and the `kill` cinematic; a lethal Katana Slash,
counter, riposte, ally blow or bleed-out is an ordinary death with the normal
hit-stop. Two places were giving finishers away: the `playDowns` path (now takes
a `byFinisher` flag threaded from the step's own choice) and the Katana Slash
branch, which swapped its clip to `finisher` on any lethal hit (removed, as was
the same swap for allies). `beats.js`.

**4. Finisher windows: 50 % normal, 25 % boss, flat.** Was 40/50/60 by level with
no boss case at all. Levelling still buys the heal, the cooldown and the power.
The shared engine exempts bosses from execution and `js/core` is never edited
here, so `Enc.bossExecutable` lifts that exemption for exactly one resolution
when a boss is already under its line and the Finisher is being spent on it —
the engine then runs its own execute path, event, death bookkeeping and heal
included. Measured: boss at 20 % executes, at 40 % takes the hit and lives, flag
restored both times. `X.skillText.finisher` rewritten for a fourth-grade reader.
`data.js`, `encounter.js`.

**5. Road in the Rain is open — and nothing else.** `X.slice.openQuests` is a
whitelist (`['rain']`); `Camp.openQuestIds` / `Camp.questOpen` make city, marsh
and ruins unreachable rather than merely unlisted, and the inn shows the open
quest as a live Embark beside Replay the road. Hiring stays locked, Bram
unwired. `data.js`, `campaign.js`, `scenes_town.js`.

**6. Marsh weather.** `Camp.weatherFor(quest, world, phase)` resolves a quest's
weather once, for battle and travel, deliberately without a `groundId` — the
marsh plate's own `weatherBias: 'rain'` was overruling the quest's declared
clear night (verified in-browser: marsh with groundId resolved `rain`, without
it `clear`). Phase is applied, so a night storm reads as night.

**7. Panorama ambience.** `travel_panorama.js` calls `A.GateAmbience.attach()`
for *every* panorama, gate or not — the module was never synced, so the call
was a silent no-op and the travel scenes ran with no ambience layer. Synced
`js/ui/gate_ambience.js` (20 KB; depends only on already-synced modules), added
to `index.html` and the sync list. Decision recorded in GDD §16.

**8. Load phasing — measured, and it is the largest submission risk.** Throttled
cold starts against the ship allowlist (phone viewport, first fight on screen):
fast 4G **12.2 s**, slow 4G **26.0 s**, 3G did not arrive inside 60 s. The
1.0–1.2 s figure quoted until now is unthrottled and says nothing about a real
player. First cut taken: **Bram's 2 MB no longer loads while hiring is locked**
(`Painted.needed`, reading the run being started, not the one left on the scene
by the previous visit) — critical path 11.89 → **9.69 MB**, fast 4G → **10.1 s**,
3G now arrives at 53 s. Remaining, in order of value: trim `js/data` (~1.5 MB)
and split Hiro's atlas so the first fight loads only its own clips (~2 MB).
Numbers and the plan are in GDD §12a.3.

**9. The inn now waits for late scenery instead of failing.** `InnArt.paint`
returned `Promise.resolve(false)` when its painting had not arrived yet, which
`Painted.present` turned into "Scenery could not load" — on a slow connection
that is a hard failure for a file that was merely still in flight. It now waits
for the loader to finish and retries once. Found by throttling.

**10. Buy refusals name the real reason.** `Camp.buy` checked art readiness
before the slice lock, so with Bram's art deferred a locked-slice purchase was
refused as "art unavailable". Lock first, art second.

**Tests.** New `test/browser_camera_rest.js` (`npm run test:camera`): plays the
road tapping skills so kills happen with and without the Finisher, and asserts
zoom 1 / centred / time scales 1 after every fight and at the completion card —
waiting for the cinematic to close rather than guessing a delay, and mapping game
coordinates through the canvas so it is honest at phone width. Updated for the
new rules: `actor_animation_lifecycle` (an automatic kill is an ordinary death;
a tapped Finisher kill finishes every victim; a bleed-out is not cinematic),
`cinematic_scope` (the contract is "restore to the resting camera", and one
shutdown guard per scene rather than one per cinematic), `expedition_sim` (a new
threshold test; the quest-cycle assertions split across two runs so the locked
and unlocked cases stop sharing state), `expedition_recruit_gate`,
`browser_inn_art` and `browser_recruit_gate`. That last one had rotted unrun —
it referenced `companionFigures`, which the painted inn stopped creating — so it
is now wired to `npm run test:recruit`.

**Results.** `npm test` all green (sim 14, recruit gate 9, actor lifecycle 25,
cinematic scope 5, portal readiness 6, inn art 5, registration, budget). Browser:
ship-only journey ok; camera rest 6/6 with a real Finisher kill, at 1280 and 390;
recruit gate ok at 1280 and 375; skill icons ok; inn art ok at 1280 and 375;
startup and portal-stub findings empty.

**Note for the next session.** Tutorial win rates are now 1.00 across every build
(they were 0.82–0.89 on 2026-09-19) after the v2 roster change to the gray-wolf
leader — the sim floors still assert but no longer discriminate. Worth retuning
when the road's own boss art lands.

## 2026-09-21 — Review-only audit: source art present, intake incomplete

Reviewed the reconciled runtime checkpoint (`f5b7781`) and the Astra v2 source-art
tree after the art workers stopped. This review changed no game code, runtime
assets, gameplay data, original Adventurer files, or source artwork. The runtime
repository is clean at the checkpoint; the previously recorded `npm test` and
`npm run test:ship` gates passed. The measured runtime remains **17,828,737 bytes
/ 205 files**, leaving **2,171,263 bytes** below the strict 20 MB ceiling.

The validated source catalog is still partial: **3 actors, 28 clips, 144 frames,
9 paired finishers, 27 unique source images, and 57,273,763 source bytes**. It
covers the tutorial Alpha plus the approved/reused wolf and plant sets and adds
**0 runtime bytes**. Candidate paintings are present for the planned boar,
Ironback boss, Marsh Alpha, Ruins Alpha, raiders, and town watch, but those new
actor folders do not yet have complete authoritative manifests and therefore are
not included in a strict catalog or ready for Fable intake. No claim is made that
the later levels are playable or that their complete asset pack fits the mobile
budget.

The existing battle plates and travel panoramas remain the intended scenery
reuse; no new background art was generated in this review. The source handoff
continues to document the known marsh-weather and panorama-ambience wiring notes,
the separate boss identities, registration requirements, and the remaining
camera/Finisher/threshold/level-unlock work for Fable. Runtime intake and gameplay
changes remain pending.

---

## 2026-09-20 — Approved Astra v2 integrated; ready to test

Integrated the 16-frame run, sheathed idle, six paired finishers, painted skill
icons and animated solo/Bram inn. Preserved body registration, blade/foot bounds,
single-contact combat events, saved progress and the existing first-road locks.
Updated converter, figure timing, enemy/tier selection, HUD, inn and allowlist.
Superseded runtime finishers are retired; source masters remain outside upload.

Headless checks, two upload-only tutorial clears, all-six-finisher Phaser QA,
icon interactions, inn lifecycle and desktop/emulated-phone startup pass.
Build:17,828,737 bytes / 205 files,2,171,263 bytes below 20 MB. Local test port8742.
[Integration details and evidence](ASTRA_V2_INTEGRATION_20260920.md).
No publication or original Adventurer changes.

---

## 2026-09-20 — Astra: overhead wolf finisher and relaxed run, preview only

The user rejected the wolf iaido and the run's stomach-clutch posture. Source
selection now uses a 12-frame overhead slash, non-gory wolf dissolve, sword
twirl and return to Hiro's existing drawn idle. Locomotion uses 16 new paintings
with an upright chest, one hand resting at the hilt and the other arm swinging.
The plant iaido and all other art selections remain unchanged.

The source gallery supports both two-sheet timelines. Crop regions, body-scale
references, foot registration and zero-based contact/recovery markers accompany
the images. Source checks and review captures live in the source-art folder at
`astra-v2/review/overhead-run-v4/`; details and prompts are linked in
`astra-v2/REVISION_OVERHEAD_RUN_V4.md`. Selected Hiro content totals 64 frames
across eight clips. No game integration or publication occurred.

---

## 2026-09-20 — Astra: integration paused; three source-animation corrections

At Hiro's request, paused runtime intake and changed only the source/preview
selection for wolf horizontal cleave, plant stem cut and locomotion. The wolf
now uses a fast iaido midsection cut with low scabbard hand; the plant shows a
corrected draw, horizontal stem cut and consistent sword-hand recovery. The
walk is replaced by a 16-frame, 800 ms samurai run with the hand at the sheathed
katana. Source regions/ground anchors were measured and the gallery supports
the run's two eight-frame sheets. Other four finishers, icons, idle and inn
compositions are unchanged.

Source index: `../adventurer-expeditions-source-art/astra-v2/manifest.json`.
Preview and details: `astra-v2/index.html` and `REVISION_IAIDO_RUN.md` in that
source directory. Selected Hiro content is now 58 frames across 8 clips; source
validation passes 28 PNG files including 13 reused originals. Runtime remains
15,650,969 bytes / 195 files. Before the pause, only an inn conversion script and
unused inn WebP candidates were created; no loader, scene, HUD or ship-manifest
integration occurred. Those candidates are excluded from the upload.

---

## 2026-09-20 — Astra: art pass 2 delivered; Fable overwrite reconciled

Fable was paused before repair. Restored the painted multiatlas loader,
save normalization, complete Bram readiness checks, scenery/SDK start gating,
paired contact and recoil sequencing, and nested cinematic recovery. Preserved
manual skills, hold-to-read tutorial gates, locked inn options and replay.
The tutorial uses ordinary wolves, thorn lurkers and a gray-wolf leader;
unused later-level assets remain on disk and are excluded from the upload.

Source delivery is complete outside the game: six paired finishers/36 drawings,
a corrected eight-frame walk, four-frame sheathed idle, two inn paintings plus
three transparent four-frame overlays, and four Hiro icons. Existing wolf/plant
13-clip coverage was confirmed. New v2 art is source-only, awaiting intake.

Current package: **15,650,969 bytes / 195 files**, cold gameplay download
**11,931,986 bytes**, after audio **12,976,946 bytes**. Two upload-only tutorial
clears passed with 12 manual casts and 20 cinematic restorations. Desktop and
mobile browser startup plus delayed-scene SDK checks passed. Physical iPhone
and actual CrazyGames portal remain unverified. See
[complete repair and art report](ART_PASS_2_AND_REPAIR_20260920.md) and
[final intake notes](art/astra-v2/ART_INTAKE_NOTES.md).

The Fable notice below is retained as the incident record; its statement that
these integrations are currently absent is superseded by this repair entry.

---

## 2026-09-20 — NOTICE from Fable: my 17:34 commit overwrote concurrent work — read before editing

**Signed: Fable (Claude), 2026-09-20.** For Astra, and for whichever session comes
next. No further changes from me until Hiro says otherwise.

**What happened.** At 17:34 today I force-wrote my working copies of twelve files
into this folder without diffing against the folder first: `js/expedition/scene.js`,
`scenes_town.js`, `hud.js`, `ui_common.js`, `data.js`, `campaign.js`,
`encounter.js`, `beats.js`, `test/expedition_sim.js`, `test/browser_expedition.js`,
`docs/CHANGELOG.md`, `docs/ADVENTURER_EXPEDITIONS_GDD_v0.9.md`. Between my previous
commit (2026-09-19 19:19) and then, another session had edited those same files as
part of the animation-integration pass described in
`docs/ANIMATION_INTEGRATION_REVIEW_20260919.md` (multi-page atlases, victory
holding the sheathed frame, paired-finisher playback, Bram purchasable behind an
art-readiness gate, save validation, HUD portrait cropped from the atlas). **Those
edits to the eight code files and two tests are gone from disk.** The `.git` repo
here has a single commit (2026-09-19 19:48) that predates them, so there is
nothing to restore from. The files I wrote carry my 2026-09-20 changes only
(entry below: "The first five minutes").

**What survived of the other session's work:** `js/expedition/actors.js` (the
rewritten actor), `run.js`, `index.html`, `js/expedition/media_hashes.js`,
`package.json` (its scripts), all of `tools/` (`art_intake_v2.py`,
`build_painted_art.py`, `prepare_art_registration.py`,
`review_art_registration.py`, `build_media_hashes.js`, `art_registration/`,
`ship_manifest.json`, `size_check.js`), the six atlases under
`assets/expedition/{hiro,bram,wolf,boar,plant,alpha}/`, the new tests
(`actor_animation_lifecycle.js`, `art_registration.js`, `expedition_recruit_gate.js`,
`browser_recruit_gate.js`, `browser_startup_budget.js`, `portal_readiness.js`,
`ship_budget_contract.js`, `harness.js` changes), `docs/art/astra-v2/`, and the
review doc. Astra's 17:41 changelog entry above is intact.

**State of the tree right now: inconsistent.** The surviving `actors.js` and tests
expect the other session's `scene.js` / `hud.js` / `campaign.js`; mine are older.
Measured on this machine at 17:5x: `expedition_sim` 13 pass, `art_registration`
pass, `portal_readiness` pass, `ship_budget_contract` pass,
`actor_animation_lifecycle` 15 pass / 1 fail, `expedition_recruit_gate` crashes
(`campaign.js` lacks the readiness gate), `size_check` 19.79 MB of 20.0.
Assume the game does not run cleanly end to end until the two sides are merged.

**Also observed, not mine, flagged for Hiro:** `git status` shows edits to synced
shared copies — `js/core/campaign.js`, `campaign2.js`, `campaign3.js`,
`character.js`, `courtship.js`, `death.js`, `game.js`, `hiro.js`, `housing.js`,
`relationships.js`, `save.js`, `util.js`, `world.js`, `js/ui/anime_identities.js`,
`cutscenes.js`, `dialoguebox.js`, `portal.js`, `test/harness.js`. The next
`node tools/sync_shared.js` will overwrite those (only `js/ui/portal.js` is owned
here). Whoever made them should move the logic into `js/expedition/` or add the
files to `LOCAL` in `tools/sync_shared.js` with a note.

**What has to happen next (Hiro decides who):**
1. Re-apply the other session's edits to the eight code files and two tests
   (from its own workspace if it still has them; otherwise reconstructed from
   `actors.js`, the new tests and the review doc).
2. Merge my 2026-09-20 changes onto that: `X.manualSkills` + `Enc.tapPolicy`,
   `X.UI.splitCameras` + `X.UI.cinematic` and the beat that calls it,
   `X.hudIconR`, hold-to-read `infoChip` + `X.skillText`, per-skill first-use
   gates + `gateUntilInspected`, `X.slice.firstLevelOnly` with the locked inn and
   `replayRoad`, `X.UI.hiroFigure`. Every one is self-contained and marked with a
   2026-09-20 comment in the file; the entry below lists them.
3. Run everything in `package.json`'s `test` plus `test:ship`, then `git add -A
   && git commit` before any further commit from any session.

**Rules from this, effective now:**
- **`git commit` first.** Before writing into this folder, commit the tree as it
  is (`git add -A && git commit -m "pre-<who> <date>"`), so a bad write is one
  `git checkout` away from undone.
- **One session in the folder at a time.** If two must overlap, each edits only
  files the other has not touched that day, and checks `git status` / mtimes
  before every commit. Never force-write a file whose mtime is newer than your
  copy of it.
- **Diff before commit.** A commit that does not show the diff it is about to
  make has not been checked.

— Fable

## 2026-09-20 — Astra art pass 2 source handoff (intake pending)

Six Hiro/wolf-and-plant finisher sheets / 36 paired drawings are source-delivered
and inspected. Existing beast coverage is reused: 13 clips / 55 drawings.
Movement, four icons and inn production status, source hashes, inspection notes,
conditional budget savings and code-reconciliation pointers are in
[`docs/art/astra-v2/ART_INTAKE_NOTES.md`](art/astra-v2/ART_INTAKE_NOTES.md).
Masters stay in the sibling source-art folder. This art pass changes no runtime,
ship manifest, original website or export and preserves concurrent code work.

## 2026-09-20 — The first five minutes: player-fired skills, cinematics, hold-to-read, locked slice

From Hiro's playtest notes (the code side; Astra's list went out separately).
Both suites pass; ship set 16.97 MB.

**Skills no longer auto-fire.** `X.manualSkills`: Hiro's automatic policy may
use only Katana Slash; God Aura, Counter Attack and Finisher fire from a tap
(`Enc.requestSkill`) and nothing else. The headless sim stands in for the
player with `Enc.tapPolicy` (Finisher → Counter → Aura when ready), which
`runToEnd` uses when no policy is given. The "auto" rows of the whole-quest test
now hold the no-purchase floor only — an untapped run is an untapped run.

**Cinematic beats.** `X.UI.cinematic(scene, kind, focus, fn)`: a tapped skill
(`cast`: world at 0.5×, camera 1.16 toward the action) and every killing blow
(`kill`: 0.36×, 1.26) slow tweens, animations and timers and push the main
camera in, then restore. The HUD lives on its own camera now
(`X.UI.splitCameras`: everything at depth ≥ 800 is sorted onto it each frame),
so it neither zooms nor drifts. Values in `X.cinematic`.

**HUD.** Icon radius 18 → 26 (`X.hudIconR`). Skill info opens only on a
3-second hold (`X.infoHoldMs`), stays while held, lingers 3 s after release
(`X.infoLingerMs`); the box is 340 px wide at 16–20 px type and reads
`X.skillText` — four skills rewritten for a fourth-grade reader. A tap on an
icon still fires / unlocks as before.

**Tutorial.** The game holds (no step is taken) the first time *each* bought
skill is ready, pointing at its icon — was Finisher only. After the first
unlock a new hold-to-inspect step (`gateUntilInspected`, a ring that fills over
the hold time) until the info box has opened. Flags: `tutorial.used[id]`,
`tutorial.inspectDone`.

**The slice is the road.** `X.slice.firstLevelOnly`: `Camp.nextQuestId` returns
`road`; the inn shows Hiro from the painted sheet (idle — no sheathed idle
yet), his skills for levelling, *Next quest* and *Unlock a hero* locked, and
*Replay the road*. Recruit busts are not shown (their combat art is the baked
website bust, which the no-placeholder rule forbids). The travel road walks the
painted `walk` loop instead of the plate; with no sheet loaded nothing is drawn
rather than a plate. Flip the flag to reopen the loop.

**Tests.** `browser_expedition.js` reads `X.slice` from the page: in the slice it
plays the road, the inn, Replay, the road again (2 clears) and holds the icon
for the inspect gate (`hold inspect:<id>` in the log); recruit/dialogue
assertions apply only to the open loop. Sim: the quest-cycle assertion respects
the lock. Fixed on the way: Phaser camera effects take `Sine.easeOut`, not
`Sine.Out` (the tween spelling) — a wrong name throws inside the camera update
and freezes the fight.

## 2026-09-19 — GDD v0.9 rev. b: two corrections from Hiro

Same file, same day. (1) **Recruits get full painted sets to Hiro's standard**,
not the six-clip economy set — buying a recruit is buying a character. Bram's
delivered set is used whole; Nyx/Sable/Aera/Ren are not purchasable until theirs
exist. §3, §15.2, §15.3, §16.9 corrected; new §16.13 (which recruits ship painted
inside 20 MB). (2) **No placeholder art anywhere** — where art is missing the
GDD says so instead: new §10.5, the art-gap table. (3) **Finding: Hiro has no
sheathed idle** — after `victory-sheath` he snaps back to the drawn stance;
`idle-sheathed` added to Astra's list (§15.2 item 2a), §19 #14; interim: hold
the last sheath frame. §19 #15 records that today's bar sells recruits whose
combat art is the baked website bust, which the new rule forbids.

## 2026-09-19 — GDD v0.9: review pass after the build

`docs/ADVENTURER_EXPEDITIONS_GDD_v0.9.md` supersedes v0.8 (kept). No design
change and no code change. Sections that still described the pre-build state
were corrected to what shipped: §4 (prices, payouts, auto-fielding, layout),
§7 (Start over / pause / mute and the defeat card marked built), §8 (the inn's
invitation mechanism), §10.2a (intake as built), §12a.1a (where the 16.97 MB
landed against the budget table), §13 (what the suites now prove and their
flags). New **§19 Build review**: thirteen findings with severity and owner —
three submission blockers (no ending, phone layout unverified, load phasing not
started), the plate-vs-sheet Hiro seam, foe overlap at contact, city fourth-clear
at 0.57, the fourteen clips still to intake, Astra's greenlight, the marsh
plate's painted rain, provisional voice IDs, `js/data` headroom, and the bridge's
binary corruption — plus the verified list and a suggested order.

## 2026-09-19 — Build session: loop v1, painted Hiro, size gate (GDD v0.8 §15.3 items 1–4, 6, 7)

Executed in order from the v0.8 handoff. Both suites pass; the build measures
16.97 MB of 20.0 with the gate on. Astra's masters left the deploy folder.

**1. Corner control (§7).** `X.UI.corner` — mute, pause (freezes clock + tweens,
shades the scene), Start over with a ✓/✕ confirm — mounted by the inn, travel
and battle scenes. `Run.startOver` wipes the run but keeps the tutorial
retired. HUD lost its own mute/pause. Files: `js/expedition/ui_common.js`,
`hud.js`, `run.js`, `scene.js`, `scenes_town.js`.

**2. The loop (§1–§5).** `campaign.js` rewritten: `X.quests` (road tutorial +
rain / city / marsh / ruins, each = plates + phase + weather + music + travel
location + three encounters), `X.recruits` (Bram M05, Nyx F07, Sable M11 —
provisional IDs, §16 — Aera F03, Ren M02), `X.party` (field two, prices
60/90/120/150/180), `Camp.nextQuestId` (road once, then the four in sequence),
`Camp.scaleFor` (+30 % enemy hp/atk per clear of that quest, cap ×3.0; +15 % did
not bite in the sweep). `scenes_town.js` rewritten: the inn (Hiro's skills on the
HUD in inn mode, recruits along the bar with price tags, confirm chip, Embark),
the travel scene with outbound / midleg / return legs (panorama at the quest's
phase + weather, banter between fights), hero pick / trainer / blacksmith /
applications / grave gone (`heroes.js` unloaded, kept on disk). Battle scene:
quest phase and weather grade the plate, `tapArrow` → midleg travel, quests pay
per fight, `complete()` counts every clear. Road payout 30/40/50 → 40/50/60 (150)
so the tutorial's three guided unlocks (60) still leave the first recruit's price.
`?at=inn[&gold=N]` dev entry starts a fresh run at the inn with the road behind
it (tests, art review). Save key → `adventurer_expeditions_loop_v1`.

**Defeat card (§7).** A loop-quest defeat offers Again or Back to the inn with
the gold from the fights already won, so a party that embarked under-manned is
never stuck; the tutorial road still just goes again.

**Guidance (§8).** The inn invites over every affordable recruit at once (`UI.invite`,
rings on all, hand sweeping, no blocker), holds on the confirm chip, then points
(never blocks) at Embark so a second recruit or a skill can still be bought first.

**3. Dialogue (§9).** Rotation persists on the run (`Camp.attachVoice`); midleg
banter is one line. Voice synced for all five recruits, loop bands only
(forest/city/marsh/ruins/neutral/midleg/response/hatred/romantic/return win+loss);
funeral, mountain and road bands dropped.

**4. Painted Hiro (§10.3).** `tools/art_intake.py`: keys Astra's gray sheets
(border flood-fill, soft fringe), trims per frame, registers every frame to one
hero canvas (x = centroid of the lower third, y = lowest opaque row; bottom-centre
pivot), packs a WebP atlas ≤ 2048×4096 with a Phaser JSON-hash atlas that carries
`clips` (zero-based contact/release, per-frame ms, loop, impact draft). Nine
clips intaken at 400 px standing height: idle, walk, draw, short-draw, slash-l1,
hit-short, roll, victory-sheath, kneel → `assets/expedition/hiro/hiro.webp`
1.29 MB. `Actor` is Sprite-backed when a sheet is given: idle loop, contact at
frame 0 handled, `onHit(k)` for later contacts, release resolves early, per-frame
durations, drift from `X.impact`. `X.clipFor` maps the director's vocabulary to
clip ids; clips the sheet lacks fall back to placeholder motion. `X.impact` table
in `data.js` (seeded from the manifest's draft, all `greenlit: false`) read by
`beats.impact`. `?sheet=0` A/B. `test/browser_art_review.js` screenshots the
first fight. Companion marks moved right (265/150) and Hiro to x=400 to clear
the HUD.

**7. Size gate (§12a).** `tools/ship_manifest.json` (explicit allowlist +
folders; index.html's scripts/styles/icons implied), `tools/size_check.js`
(per-group totals, largest files, fails over budget, `--zip` builds
`dist/expeditions.zip`), `npm test` runs it after the sim, `npm run test:ship`
serves *only* the ship set so any stray request 404s. Cuts: masters moved to
`../adventurer-expeditions-source-art/astra-v1` (outside deploy); music three
tracks at 48 kbps mono (3.2 MB); voice 64 kbps mono (2.0 MB);
`tools/bake_busts.js` renders the five recruits and seven human foes to
`assets/expedition/busts/` (≈0.6 MB) so the 4.4 MB part sheets never ship
(`X.UI.installBusts` recreates each as a canvas texture with its portrait meta;
`Portraits.key` is routed to the bake for recruits and `expeditionHuman` foes);
cemetery / inn / camp / props_story plates and the road / mountain travel
panoramas dropped from the sync list. `tools/shrink_music.sh` →
`tools/shrink_audio.sh`. Result: **16.97 MB** (shared art 5.3, music 3.2, js 2.7,
voice 2.0, expedition art 1.9, lib 1.1, sfx 1.0).

**Tests.** `expedition_sim.js`: economy assertions follow the new payouts (a second
first-tier unlock now fits in 40 gold), loop test unchanged (first clear ≥ 0.8,
fourth ≥ 0.4; measured rain 1.00/0.97, city 1.00/0.57, marsh 1.00/1.00, ruins
1.00/0.90). `browser_expedition.js`: plays tutorial + one full cycle of the four
loop quests (5 clears) buying recruits at the inn, levelling skills there, taking
the defeat card if it appears; `--ship`, `--at=inn`, `--clears`, `PROBE=<regex>`.
Full run: 17 inn visits, 20 dialogues, 3 recruits, 0 defeats, 0 page errors.

**Working rule learned:** the desktop bridge's file commit converts LF → CRLF, which
corrupts binaries (`.webp`, `.mp3` came back 0.4 % larger with `\r` bytes). Text
files are safe; binaries go over as a base64 `.txt` and are decoded on the
computer (`tr -d '\r' | base64 -d | tar xz`), then md5-verified. This session's
art and audio were re-sent that way and match.

**Not done this session:** §7a real-time port (item 5 — blocked on §16.8),
phone pass (8), load phasing (9), store media (10). See GDD §15.3.

## 2026-09-19 — GDD v0.8: the loop redesign and the size gate

Owner: Claude. Design only — no code changed. v0.7 kept for history.

**The loop.** The demo becomes one repeatable cycle: tutorial → inn → recruit →
level a skill → travel → quest → travel → inn → repeat. **Hiro is the permanent
first member and the only tappable character**; recruits are bought with gold,
ship finished with the gear and skills their design calls for, fight on their own,
and are fielded two at a time from a roster the player can grow. Owning is the
purchase, fielding is free — which makes a five-name roster a real decision and
gives gold somewhere to go after the first two buys.

**Cut, and recorded in the new §18 rather than deleted:** the hero-pick screen,
the trainer, the blacksmith and gear purchasing, party applications and rotating
crews, the rival parties and the ambush, the doomed pass and the grave, and the
lawful/criminal framing. Each row in §18 names the revision it is written up in
and what cutting it cost.

**Content plan (§5): a tutorial plus four repeatable quests on three tracks.**

| # | Quest | Plates | Phase / weather | Track |
|---|---|---|---|---|
| T | The road (tutorial) | deep wood → bandit road → mountain | day / clear | Origin |
| 1 | The road in the rain | same three | day / storm | Origin |
| 2 | The city watch | alley | day / overcast | Origin |
| 3 | The reed marsh | marsh | night / clear | Hunter's Breath |
| 4 | The old ruins | ruins | night / storm | Hunter's Breath |

**The finding that makes four quests affordable:** the shipped art layer already
grades any plate to day / evening / night and overlays clear / overcast / rain /
storm / snow procedurally (`A.Weather`, `A.WeatherFX`, the night grade in
`anime_environments.js`), and the scenes already pass a phase and a weather
override. A night-storm version of a plate we ship anyway is one line of quest
data, not a new painting. Every battle plate and travel panorama in that table is
already synced.

**Music (§5.1).** `edwyn2` confirmed as "Weight of the Quiet Man Edwyn theme 2" —
the shipped `music.js` names it in its own comment — and assigned to the inn.
Origin of the Last Name assigned to the tutorial and quests 1–2; the library holds
both `origin1` (theme) and `battle_origin` (battle arrangement), recommendation is
`battle_origin`. **Hunter's Breath is not in the music folder under that name** and
needs pointing at — `night1` / `night2` are the closest by mood (§16). Flagged
once: three tracks means bosses lose their own music; a fourth costs ~1.1 MB.

**Travel between fights (§5.2).** Travel panorama art now runs between the fights
inside a quest, not only either side of it. The plates are in the build and the
code already scrolls them.

**The size gate (new §12a).** Masters leave the deploy folder; a ship manifest
allowlists what goes into a build, inverting today's ship-everything default; and
`tools/size_check.js` reads the manifest, measures and exits non-zero over budget,
running beside the tests. Budget table totals **20.0 MB** with painted art in.
The largest saving falls out of the redesign rather than compression: **4.4 MB of
head, wardrobe and headgear part sheets exist only to compose arbitrary characters
at runtime**, and a fixed cast can be baked to single WebP busts at ~120 KB each.
Cutting the blacksmith is what makes that legal — gear sets were the reason busts
had to be composed on the fly. Load phasing recorded: a ~6 MB first bundle,
the rest streamed during the inn.

**Also updated:** §3 (roster, with the note that recruits need ~6 clips against
Hiro's 23 — the single largest art saving), §4 (the inn's two spends), §6 and §9a
marked shelved with pointers, §11 (audio, with the per-track and per-voice
arithmetic), §14, §15.2, §15.3 reordered, §16 rewritten to twelve open items.

---

## 2026-09-19 — Astra's first painted delivery (`astra-v1`) recorded

Owner: Astra (delivery) / Claude (recording). No code changed.

- **101 files, 194 MB** arrived in `assets/expedition/astra-v1/`, covering every
  line of the old §15.2 at once: Hiro (23 clips, 128 frames, with a
  `manifest.json`), Bram (31 files including all four finisher silhouette
  classes), beasts (wolf, boar, thorn lurker, Alpha), the shared human set, one
  effects sheet, four icon sheets, and the camp and toll-house-alley backgrounds
  already exported to `.webp`.
- **It is source art, not runtime art.** The manifest says so itself —
  `"status": "source-art-delivery-not-runtime-animation"`, every clip
  `intake-pending`, `greenlit: false`, opaque gray background, no alpha
  extracted, unregistered, unpacked. No code references the folder, so the build
  still runs entirely on placeholders.
- **The manifest is the useful part** and intake should be driven from it: per
  clip it carries frame count, sheet grid, **zero-based contact and release
  frames**, the paired flag, a draft duration, and a pre-populated `impactDraft`
  block (`hitStopMs`, `flash`, `shakeAmplitude`, `drift`) explicitly marked
  ungreenlit — the §10.1 parameter table, filled in and flagged provisional.
- **Recorded as §10.4** with the full inventory, and the consequences: the
  masters sit inside the deploy folder (26 MB → 221 MB) and must move out or be
  excluded before any build measurement means anything; frames are painted at
  768 × 512 while the hero renders ~330 px tall, so halving the long edge at
  intake costs nothing visible and roughly quarters the packed result.
- **§15.2 rewritten** from "still owed (nothing painted yet)" to "delivered as
  source, awaiting intake". What remains for Astra is the greenlight pass — which
  is gated on intake producing registered playback, not on her — and Nyx and
  Sable clip sets if all three heroes ship painted.
- **§15.3 reordered:** the art intake pipeline moves from ninth to second, behind
  only the restart blocker. It was listed ninth on the assumption it would exist
  before the first clip set arrived; it did not, and the clips arrived. The two
  `.webp` backgrounds are the one thing that can go in ahead of it.
- **§16 item 12 sharpened:** the canonical-hero question is overtaken by events —
  Astra painted Hiro and Bram, §10.3's worked example is Nyx, §15.2 proposed
  Bram. Three answers are live and one needs picking.

---

## 2026-09-19 — no way to start over (recorded, not fixed)

Owner: Claude. Design pass only — no code changed.

- **Reported:** the game always resumes where it left off; there is no restart.
  Confirmed. The run saves a checkpoint on every scene change, the boot block
  reads it, and nothing in the game offers a new run. The only path is appending
  `?fresh=1` to the URL (already wired), or clearing the
  `adventurer_expeditions_hiro_preview_v1` key. No player finds either.
- **Root cause is structural, and bigger than the restart.** Pause and mute live
  in `X.Hud`, which only the Expedition scene builds. Inn, Travel and Grave have
  no HUD at all — so **mute is unreachable in exactly the three scenes that play
  the music and the recorded voice.**
- **Recorded in §7** with the proposed fix: one persistent corner control in every
  scene carrying mute, pause and Start over (with a confirm, since the save holds
  the hero, gold and kit), plus a New run button on the grave card — the end of
  the arc being where a player wants to try a different adventurer. Noted that
  §9a (rotating parties) is what makes a second run worth taking.
- **Listed first in §15.3** and called a submission blocker under §14: the
  platform's guidance is explicitly against trapping the player, and a reviewer
  who finishes the demo once hits this immediately.
- One assumption in §16: Start over keeps the tutorial retired rather than
  re-teaching a player who has already seen the hand.

---

## 2026-09-19 — GDD v0.7 §10 expanded: impact, finishers, character brief

Owner: Astra. Design pass only — no code changed, no assets generated;
`../adventurer` and every shared file untouched.

- **§10.1 Impact language**, split by owner. Astra draws the exaggerated contact
  frame (squash and stretch beyond anatomy for 2–3 frames, the *Skullgirls*
  rule), the wind-up that carries the weight, the recovery that overshoots and
  settles, and trailing elements — hair, cloth, straps — a frame or two behind
  the body and swinging opposite it on impact. Fable ships hit-stop, flash,
  shake and drift as multipliers on that drawing. Cited *Dead Cells* for how much
  reads through VFX over few frames and *Hollow Knight* for weight through
  anticipation rather than frame count.
- **The impact numbers get a home.** A per-clip table `X.impact`, beside
  `X.timing` in `js/expedition/data.js`, read by `beats.js` between the
  simulation and `X.Actor`. Today those values are scattered literals in
  `beats.js` (a global 70 ms hit-stop, `shake: 0.004`, `hitStop: true`).
  Defaults stay minimal until painted frames exist; Astra sets each clip's
  numbers at greenlight. Rule recorded: code never invents feel ahead of the art.
- **§10.2 Finishing moves.** Structural rule from *Assassin's Creed* (structure
  only): one clip containing both figures, never two clips side by side. Minimum
  three paired frames — wind-up, contact, aftermath. Paced on the *Hades*
  template: trigger cue 150 ms, camera push 250 ms, wind-up held 500 ms, snap
  80 ms with a doubled 140 ms hit-stop, aftermath held 700 ms — about 1.8 s, so
  finishers are gated to the last enemy of a wave. Four silhouette classes
  (quadruped, plant, human, boss quadruped) cover the slice at 12 paired frames
  for the greenlit hero; Chief and Captain reuse the human set scaled up; the
  Pass Tyrant needs none.
- **Folded into §15.2 at position 3**, after the hero clip set and the beast
  clips, ahead of the shared human set — cheap relative to what it buys for the
  store video.
- **§10.3 Character design brief.** Appealing and distinctive inside PEGI 12
  (§14), with *Skullgirls* as the reference for expressive design at that rating.
  Appeal carried by athletic defined figures, thumbnail-readable silhouette, an
  S-curve line of action, counterpose, confident stance, hair and cloth in
  motion, and fitted clothing that works through cut and drape. Bare arms,
  shoulders, midriff, thighs and back are fine at the rating; what breaches it is
  framing and intent — low camera, hips or chest angled to the lens, clothing
  reading as underwear, a pose that presents rather than stands. Standing camera
  rule: eye-level, three-quarter, full body. Includes a worked prompt for Nyx as
  the template for the rest of the cast.
- Four assumptions logged in §16: which hero is painted first (§15.2 says Bram,
  the §10.3 example is Nyx — they should agree), whether finishers are gated to
  the last enemy of a wave, whether the two human bosses reuse the human paired
  set, and whether Astra owns the impact numbers.

---

## 2026-09-19 — GDD v0.7: real-time combat balance (design only)

Owner: Claude. No code changed; `../adventurer` and every shared file untouched.

- `docs/ADVENTURER_EXPEDITIONS_GDD_v0.7.md` supersedes v0.6, which is kept for
  history. One new section, **§7a Real-time combat balance**, written against the
  live stat table rather than invented numbers.
- **Timing model.** Basic attacks on `14 / spd` seconds, clamped to [0.7, 2.0] —
  beasts and Hiro near 1.0 s, humans and Bram near 1.75 s. Actives on three
  cooldown tiers: light 3–5 s, heavy 8–12 s, ultimate 20–30 s. Every skill in the
  §3 hero table and in Hiro's tutorial kit assigned a tier, a number and a reason.
  Skill tier raises effect size and never cuts cooldown (one shipped exception,
  Smoke Bomb, flagged for override). Perks stay passive; three of them
  (Lightning King, Momentum, Sniper) are worded in turns and need re-expressing,
  not gating.
- **Auto-cast.** Every active fires the moment its cooldown and condition allow,
  priority Ultimate → Heavy → Light → basic, using the `autoOrder` that already
  exists. A tap re-orders and times; it never unlocks. Noted that this raises
  no-tap win rates, so the sim floors have to rise with them.
- **Enemy AI.** Weighted condition lists replace basic-attack spam — 2–4 entries
  each for all twelve enemies in §5, preserving the established behaviours (the
  watch sunders and taunts, the bailiff throws lightning, the cutthroat poisons).
  Boss phase two multiplies that enemy's cooldowns by 0.75 (Tyrant 0.7).
- **Balance consequences recorded.** Damage per second replaces damage per turn,
  which invalidates every `statMult` in §5, the beast/human balance (spd 14 vs 8
  is now a 75% DPS gap), and `BOSS_HIT_PCT`. The Pass Tyrant's ×6/×30/×5 needs
  re-deriving to a 45–60 s wipe, with a method and a verification band.
- **Test plan.** `test/expedition_sim.js` needs a fixed-timestep clock, assertions
  in seconds, a time-to-clear band, kit-coverage and enemy-kit assertions, and a
  survival floor on the pass.
- Seven assumptions logged in §16 rather than decided silently — chiefly whether
  the move to real time is settled, Katana Slash becoming the auto-attack, and
  whether a speed-up button exists.

---

## 2026-09-19 — review pass, no code changes

- Audited the travel banter against the original dialogue system. Findings are
  in GDD v0.6 §9; no code was changed. In short: the demo uses about six of the
  ~113 recorded lines each companion owns, and the round-robin that would vary
  even those is reset every scene.
- **Design decision: parties rotate.** The player applies for a party each
  contract and can be grouped with different people, from a pool of
  personalities, on the shipped `Party.applicationOdds`. Recorded as GDD §9a;
  supersedes the fixed Ren-and-Aera party. Not implemented yet. Checked and
  confirmed: all sixty personalities in the shipped table have complete recorded
  voice sets, so breadth costs build size but no recording.
- **Design rule: guidance never chooses for the player.** It may show how, never
  which. The hero-pick screen breaks this — it rings the middle card and taps the
  hand at it, which reads as "choose the ranger". Recorded in GDD §8 with the fix
  (weight all three cards equally, sweep or centre the hand); listed first in
  §15.3. Not implemented yet.
- Wrote this change log (`docs/CHANGELOG.md`).
- Wrote `docs/ADVENTURER_EXPEDITIONS_GDD_v0.6.md`: the design as actually built,
  the CrazyGames findings, and three status sections (Fable done / Astra owes /
  Fable still to build). v0.5 is kept for history.

---

## 2026-09-18 (evening) — lawful and criminal contracts, rival parties, size trim

**Quests.** The party track became lawful → criminal → doomed. `ruins` was
replaced by two new contracts: `camp` ("The bandit camp", lawful, for the reeve)
and `heist` ("The toll house", criminal, for a fence). `pass` still ends the
demo at the grave. Quests carry `lawful` / `criminal` / `doomed` flags and a
`done` title for the completion card.

**Human enemies.** `X.enemies` gained bandit, bandit_b, cutthroat, hedge_mage,
bandit_chief (boss), town_watch, storm_bailiff, watch_captain (boss). Each has a
fixed `human: {sex, head, set}` look so its bust composes from the four part
sheets already synced; `Enc.humanize` applies it. Humans render as the website's
composed portrait, mirrored, not as a creature frame.

**Rival parties.** `X.rivals`: the Ashen Hand (rogue/mage, 3), the Oakwardens
(ranger/druid, 3), the Gilt Company (tank/healer, 2) — eight NPCs, each party
one class or a pair. They stand in the taproom; a tap names the party and its
members. `Enc.makeRival` builds one as a player-shaped character on the enemy
side. The Ashen Hand ambush the party on the road into the toll house
(`heist_ambush`, `ambush: true`): red flash, camera shake, fast entries, late
draw, banner. Beating them removes them from the inn
(`Camp.rivalsAtInn`).

**Defeat rule changed.** A party loss on an ordinary contract now retries the
same encounter with a new seed ("The party regroups"); only the doomed pass
buries the leader and goes to the grave. Before this, any party loss ended the
run at the grave, which made a single bad seed look like the intended ending.

**Inn moved to the taproom plate** (`tavern`) and the companions were restaged
to the bar. Aera wears Oath Plate (`equippedSet: 'oath'`) — a synced look; her
skills already sit above its floor, so nothing is buffed.

**Balance.** Rival base stats 1.4/1.1 → 1.25/1.0 hp/atk; Ashen Hand per-member
stats eased; Watch Captain 4.5/1.3/1.3 → 3.8/1.15/1.2 hp/atk/def; Nyx 1.1/0.9 →
1.25/1.0 hp/def. Sim floors: marsh 0.85, camp 0.8, heist 0.7 per hero.

**Plates added** (synced from the original): `camp`, `alley`, `tavern`,
`travel/city`, `headgear` (the Plate Harness helm Bram's set needs).

**Build size.** `tools/shrink_music.sh` re-encodes the synced music 112 → 64
kbps; `tools/sync_shared.js` now treats `audio/music/*` as copy-once so a
re-sync does not restore the large originals. Folder 30 MB → 26 MB.

Files: `campaign.js`, `encounter.js`, `beats.js` (`humanAction`, `kitAction`),
`scene.js`, `scenes_town.js`, `heroes.js`, `tools/sync_shared.js`,
`tools/shrink_music.sh`, `test/expedition_sim.js`.

---

## 2026-09-18 (afternoon) — pick-a-hero, trainer, blacksmith, perk icons

**The player stops being Hiro.** The road contract is still Hiro (the tutorial);
at the inn the player picks one of three premades and keeps that hero for the
rest of the demo. `js/expedition/heroes.js` is new and holds all of it.

- Bram (tank/fighter) — Shield Wall, Cleave, Bulwark; Plate Harness.
- Nyx (rogue/ranger) — Venom Fang, Aimed Shot, Opportunist; Hunter's Rig.
- Sable (mage) — Fire Bolt, Spark, Arcane Focus; Adept Robes.

Each keeps to one class or a pair. A picked hero is an ordinary
`Character.makePlayer`, so the shim never touches it — combat, portraits and
tiers are the website's own.

**Shops.** Trainer (learn the third active and up to two more perks, 30g; tutor
a known skill to Intermediate 40g / Advanced 60g) and Blacksmith (the hero's one
gear set, 90g). Demo prices; the website's 150/300/600/800 would take hours.
Both go through the shipped `SkillSys.learn` / tier thresholds / `GEAR_SETS`, so
slot caps (3 actives, 3 perks) and the gear floor behave exactly as on the site.
No grocer, insurance or vault — decided out of scope on 2026-09-18.

**HUD generalised.** Actives on the arc right of the portrait, perks on the arc
left of it, both tap-for-details. Pips show the manifest tier (gear can lift
one). A tap on an unready skill now says why (cooldown / no target / locked).
The Hiro HUD is unchanged for the road contract.

**Starting clothes are cosmetic.** A picked hero starts with `equippedSet: null`
and is *drawn* in travelling clothes, so the blacksmith's set is a real, visible
upgrade rather than a sidegrade. (First pass equipped the starting look, which
floored skills for free; corrected the same day.)

Files: `heroes.js` (new), `hud.js`, `scene.js`, `scenes_town.js`,
`encounter.js`, `campaign.js`, `ui_common.js`, `index.html`,
`test/expedition_sim.js` (+1 check, 13 total).

---

## 2026-09-18 (midday) — skill audit, guided purchases, grave voice, refactor

**The bug behind "I tapped a glowing icon and nothing happened."** A skill
bought between fights was written to `run.levels` but never added to the live
character's kit, so the engine had no such skill to use and the request was
dropped. `Enc.syncKit` now rebuilds the kit on purchase and on encounter
creation; a purchase works in the very next action, mid-quest included. A sim
check covers it.

**Feedback added** so a tap is never silent: the icon presses, a gold ring stays
on it until the skill actually fires, then a streak flies from the icon to the
hero. Aura and Counter got persistent outlines (they had no visible state
before). Counter Attack got a cooldown (2/2/1) so its icon can go dark and come
back.

**Guided purchases.** After each of the first three payouts the hand points at
the next worthwhile buy, then at the chip's ✓. Always skippable; skipping once
turns the guide off for good.

**Grave.** The mourner speaks the `funeral_<tier>` line her standing with the
dead earned, with her recorded clip.

**Refactor.** The gate (blockers + ring + pointing hand), big buttons, gold pill
and texture helpers moved to `js/expedition/ui_common.js`; the HUD and the town
scenes share them.

Files: `encounter.js`, `data.js`, `hud.js`, `actors.js`, `beats.js`, `scene.js`,
`scenes_town.js`, `ui_common.js` (new), `tools/sync_shared.js` (funeral bands),
`test/expedition_sim.js`.

---

## 2026-09-18 (morning) — the inn, travel, the party, the grave

The demo stopped being one quest and became a loop: **inn → travel → three
fights → travel → inn**, with the pass as the ending.

- **InnScene**: solo contract or apply to a party; hand on Apply the first time.
- **TravelScene**: the website's scrolling panorama, the party walking, and
  mood-driven banter through `DialogueBox` with the recorded voice.
- **GraveScene**: the leader's burial, the obituary, back to the inn alone.
- **Party**: Ren (M02, fighter, leader) and Aera (F03, healer) built through
  `Character.makePlayer` inside a small world so `Rel` and the dialogue tables
  work unchanged. They start on bad terms (−55 / −50); shared wins thaw them and
  the banter follows.
- **Quests**: road (solo) then marsh, ruins, pass. The pass tyrant
  (atk ×6, hp ×30, def ×5) is unwinnable by design — 0 wins in 40 seeded runs.

Files: `campaign.js` (new), `scenes_town.js` (new), `run.js`, `scene.js`,
`hud.js`, `beats.js`, `actors.js`, `tools/sync_shared.js`,
`test/expedition_sim.js`, `test/browser_expedition.js`.

---

## 2026-09-18 (early) — HUD consolidation

At the player's request the skill controls moved onto the portrait: three small
icons on an arc instead of a row of cards, and the black bottom bar was removed.
Katana Slash became what Hiro does by default — always owned, never shown, never
bought. The other three start locked and are unlocked, then raised, with gold
(20 / 30 / 40).

Files: `hud.js`, `data.js`, `scene.js`.

---

## 2026-09-18 (early) — the offshoot was moved out of the original folder

The first build wrote files inside `../adventurer`, which broke the rule that the
original game is never touched. Everything was moved to
`adventurer-expeditions/`, the original's `portal.js` and `suites.json` were
restored from git, and the extra files were deleted. `tools/sync_shared.js` now
does a one-way copy of the shared engine and assets from `../adventurer`; the
only file this folder owns a copy of is `js/ui/portal.js` (it carries the
Expedition scene-key hook).

---

## 2026-09-18 — M0/M1: scaffold, sim, director, first fight

- `index.html` boots the shared data/core/UI stack plus `js/expedition/*` and
  starts at the scene `run.phase` names. `?fresh=1`, `&seed=N`, `&renderer=canvas`.
- `data.js` holds every rule this edition changes; `shim.js` is the only hook
  into shared code (a `SkillSys.manifest` wrapper that fires for Hiro alone, the
  `expedition_riposte` skill, `BOSS_HIT_PCT` 0.12 → 0.04 for a solo demo,
  censorship forced on).
- `encounter.js` is the encounter as a pure steppable simulation — no Phaser, no
  DOM — so the browser and the headless tests drive the same object.
- `actors.js` / `beats.js` / `scene.js` are the presentation: every beat is
  driven by the engine's own event stream, never by a parallel guess at the
  outcome.
- Non-verbal guidance (`X.UI.gate`): four blockers around a hole, a pulsing ring,
  a drawn hand, a ✕ to skip. The game does not advance until that one thing is
  tapped.
- Tests: `test/expedition_sim.js` (headless, seeded) and
  `test/browser_expedition.js` (Playwright, plays the whole thing and fails on
  any page error).

Fixes the same day: headless WebGL ran ~10 fps, so the browser test uses
`--disable-gpu` and the Canvas renderer; gate blockers were not hit-testing
(rectangle origin); `execute` events carried no `down`, so downs are synthesised;
a wave double-increment in `travel()`.

**Save key:** `adventurer_expeditions_hiro_preview_v1`, its own LocalStorage
entry. Website saves are never read, written or migrated.
