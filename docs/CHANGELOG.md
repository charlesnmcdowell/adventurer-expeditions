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
