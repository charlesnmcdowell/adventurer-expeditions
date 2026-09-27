# Hand-off — Arcade mode, 2026-09-27 (end of Fable session)

Paste the block below into a new session as the opening prompt. Everything it
refers to is committed in this folder; nothing lives only in a sandbox.

---

## Prompt for the next session

You are continuing work on **Adventurer: Expeditions**, the CrazyGames edition of
Hiro's Adventurer browser RPG, in `C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions\`
(device shell path `$HOME/mnt/The Sorcerer Sword ARPG/adventurer-expeditions`).

Standing rules (do not relax any of them):
- Never modify `..\adventurer` (the live website game) or any shared file. `js/core`
  and `js/ui` are never edited except `js/ui/portal.js`. `js/expedition/*`, `tools`,
  `test`, `docs` are offshoot-owned.
- One session in the folder at a time. Before editing run `git status` / `git log`;
  if another session left uncommitted work, checkpoint it first. Commit before
  writing. Move stale `.git/index.lock` / `.git/HEAD.lock` into `.git/stale_locks/`
  before each git command ("unable to unlink index.lock" warnings are harmless).
- Never read or commit `game3d/tools/openai_key.txt` or `xai_key.txt`.
- Astra (Codex) owns art. Do not paint; do not touch `assets/` except via approved
  intake tools.
- When Hiro says "don't make changes / just brainstorming", discuss only.
- All `js/expedition/*.js` script tags share one `?v=` cache stamp:
  `node tools/stamp.js` after any change (currently `20260927-xp8`).
- Commit trailer: `Co-Authored-By: <your model> <noreply@anthropic.com>` plus the
  session link.

**Read first:** `docs/CHANGELOG.md` (top entries), `docs/ADVENTURER_EXPEDITIONS_GDD_v0.9.md`,
this file, and the arcade plan (Claude Doc "Expeditions Arcade Mode Plan",
https://claude.ai/code/artifact/b5ad15b1-dfcb-49b1-a760-fc8462d0cc6a).

### What the arcade mode is (all decided by Hiro, all built)
Score replaces gold (regular 100, boss 500, +50 Finisher kill, +50 clean wave at
≥75 % hp, quest clear 300, ×(1 + 0.25·(loop−1))). Every skill owned from the start,
no levels. God Aura = attack ×1.35 only. Tutorial teaches Finisher (fight 1) →
Counter Attack (fight 2) → God Aura (boss). Health carries through the run; only the
Finisher heal (35 % on kill) and Rest at the inn restore it. Rest = full heal for
1,000 points, doubling each use, refused at full health. Defeat ends the run; End
Run sits in the pause menu behind one confirm. End scene: score, playthrough, top-10
local board (`X.Board`, key `adventurer_expeditions_highscores_v1`), name entry
required and name-shaped (`X.validName`: no spaces, letters/digits/`# ! _ - . @ $`,
starts with a letter, ≥3 letters, a vowel, ≤3 consonants in a row, no letter 3× in
a row, 25 max). Play again = fresh start. Loop 2+: monsters shuffled per quest from
a seeded pool, enemy hp/atk ×1.3 per playthrough compounding, boss waves roll
own / own×2 / own+other / three (odds loop 2: 60/20/20/0, loop 3: 40/25/25/10,
loop 4+: 25/25/25/25; max 3 bosses). Defeat effects stay location-specific and play
on any monster. Ending footer: Part 2 with a new hero is coming; follow Hiro on
Facebook; feedback from the pause menu (address/destination still open).

### Where the code is
`js/expedition/data.js` (scoring, rest, board, name rules, skills), `encounter.js`
(pure sim: wavePoints/award/rest/rememberHp), `campaign.js` (loopOf, scaleFor,
loopPool, bossOdds, loopEncounters(seeded), questEncounters(q, run)), `run.js`
(Run + Board), `scene.js` (fight director; endRun; spaceFoes), `actors.js`
(`rescale(k)` for crowded waves), `scenes_town.js` (Inn Rest/High scores/Embark;
`EndScene`), `hud.js` (score pill, payout), `ui_common.js` (boardList/boardPanel,
endRun, pause End run + High scores), `dev.js`.

### Tests (all green at hand-off)
`npm test` (sim 24, recruit gate 9, lifecycle 25, cinematic 6, portal 6, inn art 6,
ship contract, size, levels_doc --check, finisher pacing); browser:
`npm run test:arcade` (32 checks incl. a fourth-playthrough three-boss wave),
`test:ship -- --ship`, `test:finishers` (10), `test:restart`, `test:v3`, `test:startup`,
`test:polish`. Browser tests need Playwright + Chromium.

Device commits: `b2fb884` (Arcade 1–3), `dfe3592` (Arcade 4, 5, 7), then Arcade 6
(this hand-off's commit: loop rules, boss rolls, width-based spacing + rescale).

### What is left (in order)
1. **Verify on the PC**: `npm test`, `npm run test:arcade`, `npm run test:ship -- --ship`,
   `npm run test:v3`, `npm run test:restart`. Expect green; if `docs/LEVELS.md` is
   stale, `node tools/levels_doc.js` and commit it.
2. **Balance pass (plan #50)** in `test/expedition_sim.js` / a scratch script: how far
   a no-tap run gets vs a good player (tap Finisher at ≤51 %, Aura on bosses, Counter
   before big hits); typical score at defeat; whether Rest at 1,000/2,000/4,000 is
   worth it; whether ×1.3 per loop is too steep or too soft by loop 4. Tune
   `X.scoring`, `X.rest`, `Camp.scaleFor` only with Hiro's OK; record before/after in
   the CHANGELOG and the GDD.
3. **Docs (plan #51)**: GDD v0.9 — §4 inn (Rest, High scores), §5.0 ending → End
   scene and board, new §5.1 loop rules (pool, odds table, scaling, spacing), §7.0
   skills (single level, Aura attack-only), §16 open questions (Facebook URL,
   feedback destination, End-scene art, per-device board only), §17 decisions.
   `docs/ART_STANDARD.md`: note that the score icon (★) is a placeholder for Astra.
4. **Candidate**: `npm run package:crazygames` → `dist/crazygames-<date>-arcade/`, then
   `node tools/release_check.js` on it and the startup-size check (must stay ≤20 MB to
   first gameplay on mobile, ≤50 MB desktop; last measured 14.64 MB).
5. **Optional polish**: End scene background art (ask Astra), a little fanfare on a
   new top-10 place, End-scene name field on mobile keyboards (DOM input overlay is
   positioned over the canvas — check it on a real phone).

### Open questions for Hiro
- Facebook page URL and where "send feedback" should go (mailto? form? CrazyGames comments?).
- Whether the high-score board should ever sync (CrazyGames data API) — v1 is per device.
- Whether three-boss waves should also get a short intro beat (currently they just walk in).
