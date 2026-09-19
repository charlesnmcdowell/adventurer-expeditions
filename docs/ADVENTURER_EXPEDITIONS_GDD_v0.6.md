# Adventurer: Expeditions
## CrazyGames edition — game design document

Version 0.6 · September 19, 2026 · Working title · Design + build status

This revision supersedes v0.5. v0.5 is kept in `docs/` for history.

**What changed since v0.5.** v0.5 described a single solo Hiro quest that had not
been built yet. The demo now exists and is playable start to finish: an inn, a
hero the player picks, two shops, four contracts across a lawful → criminal →
doomed arc, human enemies, three rival parties, a scripted road ambush, and the
ending at the party leader's grave. This document describes the game **as built**,
records the decisions taken on 18–19 September, folds in the CrazyGames research,
and ends with three status sections (§15) saying exactly what is finished, what
Astra still owes, and what is still to build.

A running change log now lives beside this file at `docs/CHANGELOG.md`. The GDD
carries current values; the change log carries how they got there.

---

## 1. What the demo is

A short, action-first slice of *Adventurer* rebuilt for CrazyGames. The player
fights immediately, is taught by the hand rather than by text, picks a hero,
spends gold between fights, joins a party, and is finally handed a defeat that
was always going to happen — a hook, not a failure.

Roughly ten to fourteen minutes of guided play, in five scenes:

**Road (tutorial, as Hiro).** A wolf ambush already underway. Three fights —
wolves, a mixed group, an Alpha — with gold, guided purchases and a forward
arrow between them. This is the only part the player spends as Hiro; it exists to
teach tapping, buying and moving on before any choice is asked of them.

**Inn.** Pick one of three adventurers. From here the player *is* that hero. The
taproom holds the trainer, the blacksmith, two contracts, and the parties drinking
along the back wall — the player applies to one for each contract and does not
always get the same crew (§9a).

**Contracts.** The reed marsh (beasts, lawful), the bandit camp (humans, lawful,
for the reeve), the toll house (humans, criminal, for a fence — with the Ashen
Hand jumping the party on the road in). Each is three fights with travel either
side, banter on the road, and a payout card at the end.

**The high pass.** The same shape, an enemy that cannot be beaten. This is the
intended ending of the slice.

**Grave.** The leader is buried, the mourner speaks the line her standing with him
earned, and the hero walks back to an inn with no party in it.

---

## 2. Scope lock (revised 2026-09-18)

Confirmed in the scoping interview, after the CrazyGames research in §14:

**In.** Three premade heroes, chosen with one tap. Trainer and blacksmith.
Four contracts plus the tutorial road. Human and beast enemies. Three rival
parties (eight NPCs) and one scripted ambush. A party applied for each contract,
with a chance of different crewmates (§9a). The grave.

**Out, deliberately.** A character creator (no top adventure game on the platform
opens with one). A grocer, an insurance desk or a vault. A quest board. Inventory
management. Recruitment. Twenty NPCs and seven rival parties — both were on the
table and both were cut as slice-inappropriate. Story beyond the arc above.

**Out for now, cheap to add later.** More contracts using the same encounter
tables; more heroes using the same `X.heroes` shape; a second ambush.

---

## 3. The heroes

Each hero keeps to one class or a pair — the "stick to a theme" rule. They are
built by `Character.makePlayer` with a fixed seed, so a picked hero is an
ordinary website character: combat, portraits, skill tiers and gear all behave
exactly as they do on the site, and the Expedition shim never touches them.

| Hero | Class | Starts with | Trainer can add | Blacksmith set | Stat bias (hp/atk/def/spd) |
|---|---|---|---|---|---|
| **Bram**, Shieldbearer | tank / fighter | Shield Wall, Cleave, Bulwark | Taunt, Sunder, Stand Fast, Momentum, Arena Champion | Plate Harness | 1.6 / 1.1 / 1.4 / 0.9 |
| **Nyx**, Poacher | rogue / ranger | Venom Fang, Aimed Shot, Opportunist | Snare, Smoke Bomb, Marksman, Sniper, Septic Sanguine | Hunter's Rig | 1.25 / 1.4 / 1.0 / 1.4 |
| **Sable**, Hedge Mage | mage | Fire Bolt, Spark, Arcane Focus | Frost Touch, Ember Lash, Pyromaniac, Lightning King | Adept Robes | 1.0 / 1.5 / 0.8 / 1.2 |

Slots are the website's: **three actives, three perks**. A hero starts with two
actives and one perk, so there is always something to buy and never enough gold
for everything.

Starting clothes are cosmetic only — a picked hero owns no gear set until the
blacksmith sells them one, so the set is a visible upgrade (new bust, and the
website's gear floor lifts matching skills to Intermediate) rather than a
sidegrade.

Hiro keeps his own kit for the tutorial road: Katana Slash by default, and God
Aura, Counter Attack and Finisher unlocked with gold. His four skills still
resolve through the override table in `data.js`; nothing about the website's Hiro
changes.

---

## 4. The shops

Both stalls are the shipped systems at demo prices. The website's 150 / 300 /
600 / 800 would take hours of quests to reach; these are tuned so a player who
finishes a contract can buy roughly one thing.

| Stall | Offer | Price | Mechanism |
|---|---|---|---|
| Trainer | Learn an active or a perk from the hero's list | 30 g | `SkillSys.learn` — real slot caps, real capacity refusal |
| Trainer | Raise a known skill to Intermediate | 40 g | tier threshold 10 |
| Trainer | Raise it to Advanced | 60 g | tier threshold 25 |
| Blacksmith | The hero's one gear set | 90 g | `GEAR_SETS`; floors matching skills, changes the bust |

Contract payouts are 30–80 gold per fight, 120–170 per contract.

A tap on a row explains what the skill does. Affordable offers put a green dot on
the stall's button, so the player never has to open a shop to learn there is
nothing in it.

---

## 5. Contracts and enemies

The party track runs **lawful → criminal → doomed**, so the demo shows two kinds
of work and one consequence without any narration.

| Contract | Track | Fights | Enemies | Plates |
|---|---|---|---|---|
| Clear the road | solo (tutorial) | 3 | dire wolves, boar, thorn lurker, Alpha | deep wood, bandit road, mountain |
| The reed marsh | party, lawful | 3 | wolves, lurkers, boar boss | marsh |
| The bandit camp | party, lawful | 3 | bandits, cutthroat, hedge mage, Bandit Chief | deep wood, camp |
| The toll house | party, criminal | 3 | **the Ashen Hand (ambush)**, town watch, Watch Captain + storm bailiff | bandit road, alley |
| The high pass | party, doomed | 3 | wolves, boars, **Pass Tyrant** | mountain |

Human enemies are the website's own enemy types (bandit, cutthroat, hedge mage,
town watch, storm bailiff) with a fixed look — sex, head and outfit — so every
bust composes from part sheets already in the build. They render as composed
portraits, mirrored to face the party, and fight with their real kits: the watch
sunders and taunts, the bailiff throws lightning, the cutthroat poisons.

**The Pass Tyrant** is atk ×6, hp ×30, def ×5. It survived 40 of 40 seeded runs
against every hero at full kit. It is not a difficulty spike; it is the ending.

**Defeat elsewhere is not the ending.** Losing an ordinary contract regroups the
party and retries the same fight with a new seed. Only the pass buries anyone.

---

## 6. Rival parties

Three parties drink in the taproom. Each keeps to one class or a pair, like the
heroes. A tap names the party, its theme and its members.

| Party | Theme | Members |
|---|---|---|
| The Ashen Hand | rogue / mage | Corin, Maud, Tobin |
| The Oakwardens | ranger / druid | Hesk, Wynn, Perrin |
| The Gilt Company | tank / healer | Aldous, Ilse |

The Ashen Hand ambush the party on the road into the toll house: red flash,
camera shake, three fast entries, a late draw and a banner. They are built as
player-shaped characters on the enemy side, so they fight with real kits and real
perks. After the player beats them they are no longer at the inn — the only piece
of persistent world state the demo carries besides gold, kit and regard.

---

## 7. Combat, presentation and the HUD

One simulation, one director, one actor layer — unchanged from v0.5 §6 and worth
restating because everything else depends on it. `js/expedition/encounter.js` is
the encounter as a pure, steppable simulation with no Phaser and no DOM; the
browser scene and the headless tests drive the same object. Every beat the player
sees is produced from the engine's own event stream. Nothing is animated from a
parallel guess at the outcome, which is why the tests can prove what the player
will see.

**The HUD.** Portrait bottom-left. Actives on an arc to its upper right, perks on
an arc to its upper left, all small, all tappable. Gold top-left, three encounter
nodes top-centre, mute and pause top-right, forward arrow on the right edge after
a win. No bottom bar.

An active icon glows when it can be used, shows a cooldown wedge when it cannot,
and shows pips for the tier it currently manifests at. A tap on a glowing icon
queues the skill for the hero's next action and marks it with a ring until it
fires, then throws a streak from the icon to the hero. A tap on a dark icon says
why it is dark — cooldown, no target, locked. A tap on a perk explains what it
does. Nothing in the HUD is ever silent on a tap; that was the single most
important fix of the 18th.

**The fight runs itself.** The whole demo is completable without tapping a skill.
Tapping is an advantage, not an obligation.

---

## 8. Guidance

All non-verbal, all skippable, never repeated once done. The mechanism is one
piece of code (`X.UI.gate`): four input blockers around a hole, a pulsing ring on
the hole, a drawn hand tapping toward it, and a ✕ to skip. The game does not
advance until that one thing is tapped.

It is used for: the first Finisher window, the first purchase (icon, then the
confirm ✓), the forward arrow, the hero pick, the first affordable shop offer,
and Apply to a party. After three guided purchases the guide retires itself, and
skipping once turns it off for good.

---

## 9. Companion dialogue — audit finding, 2026-09-19

**Symptom reported:** party members repeat the same travel lines.

**They are using the original system — but only a sliver of it.** `Camp.banter`
picks bands the same way `Travel.dialogue` does and speaks them through the same
`util.speakEx` and `DialogueBox`, with the recorded clip. The problem is which
bands it reaches and what it forgets between scenes. Three causes, stacked:

**1. Travel bands hold one line each.** In the shipped table every personality
has 55 bands and 113 lines, all of them recorded. But each `travel_*` band holds
exactly **one** line (`travel_response` holds two). The website hides this with
scale: dozens of locations, a changing roster, sixty personalities. A demo with
two fixed companions and six locations hits the same handful of lines constantly.

**2. The rotation is reset every scene.** `speakEx` keeps its round-robin on the
*character object* (`lastVariantUsed`, `dialogueRotation`). `Camp.buildWorld`
rebuilds Ren and Aera from scratch for every scene, so the rotation is empty each
time and the picker always returns index 0. Even the two-line band never
advances. Measured: with a fresh world per leg the responder said the same line
eight times out of eight; with the companions kept alive it alternated.

**3. The clean-line retry collapses the responder onto one line.** Ren and Aera
start on bad terms, so the responder's band is `travel_hatred` — whose single
line contains masked profanity, which the younger-audience wrapper rejects. It
falls back to `travel_response`, and cause 2 pins that to index 0. That is the
line the player heard over and over.

**What is sitting unused, already recorded, no new voice work:**

| Band | Lines each | Status |
|---|---|---|
| `travel_law`, `travel_criminal` | 1 each | Never used — and the contracts are now explicitly lawful and criminal |
| `travel_midleg` | 1 | Never used; the Travel scene only runs outbound and return |
| `general`, `friendly`, `hatred`, `romantic` | 5–6 each | Never used |
| `general_response`, `friendly_response`, `hatred_response`, `romantic_response` | 6–12 each | Never used |
| `dismissal_response`, `inquiry_response` | 3 each | Never used |

That is roughly **sixty voiced lines per companion** the demo has never played,
against the six it cycles. `js/core/conversation.js` — which does the robust part:
a line carries a *family* (greeting, inquiry, dismissal), and the listener replies
from the matching response family via `replyFamilies`, with relationship score
choosing where the rotation starts — is already loaded in `index.html` and never
called.

**Fixes, cheapest first (not yet implemented, §15.3):**

1. Keep the rotation across scenes — either build the world once and carry it, or
   persist `dialogueRotation` into the save. No new content, fixes the literal
   repeat.
2. Use `travel_law` / `travel_criminal` per contract and add a mid-leg beat that
   fires `travel_midleg`. Three more voiced lines per companion per journey.
3. Use `Talk.exchange` at the inn and on the road for the second exchange, so the
   response comes from the 6–12-line reply families instead of the 1–2-line travel
   bands. This is the system the question was really about.
4. Only if it still feels thin: new lines, which means new recordings. Avoid for
   this slice — there is an order of magnitude of unused voiced content first.

One related note: `world.questClock` is hardcoded to 0 in the town scene stubs, so
anything keyed to it never advances. Worth fixing at the same time as (1).

---

## 9a. Rotating parties (decision 2026-09-19)

**The strongest fix for repetition is not more lines per companion — it is more
companions.** Every contract, the player applies for a party and may be grouped
with different people.

**Why it works, in numbers.** Each personality in the shipped table owns a
complete recorded set, and there are **sixty of them, every one with audio**. The
demo ships two (M02, F03) and plays about six of their lines. A pool of eight
means eight voices, eight sets of location lines, and a journey that never sounds
the same twice — without recording anything.

**What it reuses.** The application is already written and unused here:
`Party.applicationOdds` weighs role demand (a party short a healer or a tank
wants that seat badly), reputation, a hatred block and the persuade perk;
`Party.pickMember` fills seats by role; `Party.hatredConflict` keeps two enemies
out of one party. This is the same machinery the website uses.

**How it plays.** At the inn, applying shows the parties taking applications, what
each is short of, and the odds. One tap to apply. Accepted → travel with that
crew. Refused → apply elsewhere, or take the solo contract, which already exists.
Regard persists per NPC in the save, so riding with the same people twice warms
them and falling out cools them — which is how the `hatred` and `romantic` bands
finally become reachable. They are recorded; today the demo can never legitimately
arrive at them. And at the pass, the leader who dies is the leader of the party
the player actually joined, so the grave is personal and different between runs.

**Cost.** Voice is ~58 KB a clip at the original's 128 kbps mono, ~29 KB
re-encoded to 64 kbps. The demo uses 18 bands per companion.

| Pool | Clips | At 128 kbps | At 64 kbps |
|---|---|---|---|
| 2 (today) | 36 | 2.1 MB | 1.1 MB |
| 6 | 108 | 6.3 MB | 3.1 MB |
| 8 | 144 | 8.4 MB | 4.2 MB |

A pool of eight costs about **+2 MB net** once the voice set is re-encoded to 64
kbps — affordable, but only alongside the size work in §15.3, since the build is
26 MB against a 20 MB target. (`inn.webp` is dead weight already: the taproom
plate replaced it. 264 KB, one line in the sync list.)

**Breadth and depth compete.** Eight personalities with the travel set, or three
with the full conversation set from §9 (67 more clips each) — not both inside the
budget. For a ten-minute slice breadth wins: the player hears about four lines a
journey, so eight voices saying one thing each is more varied than three voices
with deep reply families. Fixes 1 and 2 in §9 are still worth doing on top; fix 3
becomes optional.

Two consequences that need a call — see §16.

---

## 10. Art direction and animation method

Unchanged from v0.5 and still binding. The painted illustration style is kept at
full fidelity. Animation is **frame-based**: Astra paints full key frames at plate
fidelity; Fable plays them as limited animation with holds, smears, ease curves,
camera and effects carrying the rest. **No rigs, cutouts or part-based puppets** —
tried on another project, rejected, not revisited.

Everything on screen today is placeholder: busts composed from the website's part
sheets, beast frames cut from `creatures_1.webp`, and code-drawn effects. The
choreography, contact timing and clip names are all real, so painted frames drop
into a running fight clip by clip.

---

## 11. Audio

Music, voice and effects are all reused from the website. Five tracks (road
battle, boss, inn, forest, grave), the shared SFX set, and the companions'
recorded lines — 113 clips each for M02 and F03, one per line, plus the four
funeral bands.

Music is re-encoded to 64 kbps for the build (`tools/shrink_music.sh`); the sync
script treats `audio/music/*` as copy-once so a re-sync cannot restore the large
originals.

No new recording is planned for the slice. §9 explains why none should be needed.

---

## 12. Architecture and isolation

The original game at `../adventurer` is never modified. This is a hard rule and it
has been broken once (18 September, corrected the same day — see the change log).

- `tools/sync_shared.js` does a one-way copy of shared engine files and assets
  from `../adventurer`. `--check` reports drift. The only shared file this folder
  owns a copy of is `js/ui/portal.js`, which carries the Expedition scene key.
- Everything this edition changes lives in `js/expedition/`: `data.js` (rules),
  `shim.js` (the only hooks into shared code), `encounter.js` (the simulation),
  `heroes.js`, `campaign.js`, `run.js`, `ui_common.js`, `hud.js`, `actors.js`,
  `beats.js`, `scene.js`, `scenes_town.js`.
- `shim.js` is deliberately tiny: a `SkillSys.manifest` wrapper that fires only
  for an Expedition Hiro, the `expedition_riposte` skill as a new id,
  `BOSS_HIT_PCT` lowered for a solo demo, censorship forced on, and a clean-line
  preference in the voice picker. Nothing under `js/data/` or `js/core/` is
  edited.
- Save key `adventurer_expeditions_hiro_preview_v1`, its own LocalStorage entry.
  Website saves are never read, written or migrated.

---

## 13. Testing

`test/expedition_sim.js` — 13 headless checks against the real engine: shim scope
(a website Hiro is provably untouched), determinism, no-tap completion, skill
request integrity, purchase integrity including the buy-mid-quest case, every
reachable build clearing the road, party contracts winnable, the pass unwinnable,
banter bands following relationship tier, and all three heroes clearing marsh,
camp and heist while the pass kills them.

`test/browser_expedition.js` — Playwright plays the entire campaign like a
beginner: taps whatever the hand points at, taps glowing icons, confirms chips,
buys what it can afford, screenshots every beat, and fails on any page error or if
the run does not reach the grave and return to the inn.

Both pass as of 19 September.

---

## 14. CrazyGames requirements and where the build stands

From the platform's quality guidance, FAQ and Basic Launch metrics:

| Requirement | Target | Now |
|---|---|---|
| Time to gameplay | Immediate; no title or creator screens | ✅ fights in the first seconds |
| Onboarding | Visual, skippable, no wall of text | ✅ hand and ring, always skippable |
| Build size | Under 20 MB | ⚠️ **26 MB** (was 30) |
| Load time | Under 10 s cold | To measure in the portal iframe |
| Controls | Large targets, no hover-only info, no Esc / Ctrl+W | ✅ tap targets; needs a phone pass |
| Art and audio | Consistent | ⚠️ placeholder art throughout |
| Rejection causes | Bugs, no English, clones, **content targeted at kids** | Addressed; see below |
| Conversion at 1 min | 80%+ | Unmeasured |
| Average play time | 10+ min | ~10–14 min of content exists |
| D1 retention | 10–15% | Unmeasured |

**Audience decision, revised.** v0.5 aimed "preteen-friendly". The platform lists
*content targeted for kids* as a rejection cause and rates at PEGI 12. The target
is therefore **PEGI 12**: no swearing, no gore, no cruelty, stylized reactions —
but not styled *for children*. The profanity mask stays on and the line picker
prefers clean lines.

**The top adventure games on the platform are auto-battlers** (AFK Dungeon 9.0,
Rumble Heroes 9.1, Firestone 8.6) with tap skills, hero collection, gear tiers and
a visible progression loop. None opens with a character creator. The demo's shape
— fights itself, tap to intervene, buy between fights, pick a hero, upgrade gear —
was chosen to match this, and should keep matching it.

---

## 15. Status

### 15.1 Fable (Claude) — finished

- The whole playable loop: inn → hero pick → shops → travel → three fights →
  travel → inn, four contracts, the ambush, the grave, and the return.
- The encounter simulation, the director, the event → beat mapping, the actor
  layer and every clip listed in §5.4 of v0.5 as placeholder choreography.
- Pick-a-hero with three premades; trainer and blacksmith on the shipped
  `SkillSys` / `GEAR_SETS`; slot caps, tier thresholds and the gear floor all real.
- The HUD: portrait, active arc, perk arc, tier pips, cooldown wedges, queued
  ring, fired streak, detail chips, refusal reasons, gold, nodes, payout, cards.
- Non-verbal guidance and the tutorial state that retires it.
- Human enemies and rival parties as composed busts with real kits; the scripted
  road ambush; rivals leaving the inn once beaten.
- Companions, relationship movement across contracts, travel banter (with the
  limits in §9), and the funeral line at the grave.
- Balance: every hero clears marsh, camp and heist above the floor across 30–40
  seeded runs; the pass kills all three at full kit in 40 of 40.
- Isolation tooling, the sync script, the music trim, both test suites, and now
  the change log and this document.

### 15.2 Astra — still owed (nothing painted yet)

Everything on screen is placeholder. The frame budget in v0.5 §5.4 still stands
and has grown with scope. In priority order:

1. **The picked hero's clip set** — idle, walk, draw, short draw, slash, hit,
   roll, intercept, riposte, cast, victory, kneel. One hero first (Bram is the
   simplest silhouette), so one full set proves the pipeline before three exist.
2. **Beast clips** — dire wolf (idle, run, leap, bite, land tumble, overshoot
   land, land beside, hit, down fade), then boar and thorn lurker, then the Alpha
   at boss scale.
3. **One human combat set** — a single set of human clips (approach, slash, cast,
   hit, down) that every bandit, watchman and rival reuses under a different bust.
   This keeps the human roster from multiplying the frame count.
4. **Effect textures** — katana arcs, afterimage, aura ring, bolts for fire / ice
   / lightning, Bleed and Poison badges, dust, spark, the stylized defeat light.
5. **Skill icons** — the HUD currently draws glyphs. Icons for the heroes' actives
   and perks, and the tier ring around them.
6. **Backgrounds** — the demo runs on the website's plates. Original plates for
   the camp and the toll-house alley would sell the new contracts.

**One concern, stated once:** going from "Hiro alone" to three heroes plus human
enemies plus rivals multiplied the art surface. Items 1 and 3 above are the
mitigation — one hero set and one shared human set carry the whole slice; the
other two heroes can stay placeholder until the first is proven and greenlit.

### 15.3 Fable (Claude) — still to build

**Should happen before submission:**

1. **Rotating parties (§9a).** Apply for a party each contract, be grouped with
   different people from a pool of eight, on the shipped `Party.applicationOdds`.
   Persist per-NPC regard so repeat crews warm or sour. This is the main fix for
   voice repetition and it needs no new recording.
2. **Dialogue depth (§9).** Persist the rotation across scenes; use `travel_law` /
   `travel_criminal` / `travel_midleg`. Route the second exchange through
   `Talk.exchange` only if §9a leaves it feeling thin. No new audio needed.
3. **Build size.** 26 MB against a 20 MB target, and §9a adds ~2 MB of voice.
   Cuts: re-encode the voice set to 64 kbps mono (−1 MB today, and it halves the
   cost of every added companion), drop `inn.webp` and any part sheet the demo
   never composes from.
4. **Phone pass.** Layout, tap-target sizes and a real device check. Claimed but
   not verified.
5. **Load phasing and a cold-cache measurement** in the portal iframe, plus the
   `gameplayStart` call at the honest moment.
6. **Art intake pipeline** — briefs, keying, trimming, registration, packing,
   contact tagging — ready before Astra's first clip set lands, so the first
   painted frames go in the same day they arrive.

**Nice to have, in order:**

7. A second ambush, or a rival that shows up on a later contract, so the rivals
   pay off more than once.
8. Skill icons wired to Astra's art when it exists.
9. A short "what you kept" beat after the grave — kit and gear survive, the party
   does not — to make the ending read as a hook rather than a wall.
10. Retention instrumentation: where players stop, how many buy, how many reach
    the pass.

---

## 16. Open decisions for Hiro

1. **Does the slice end at the grave, or at the inn afterwards?** Currently the
   inn, with no party available. A card that names what the player keeps would
   read better.
2. **Three heroes at launch, or one?** If art time is short, shipping Bram alone
   with the other two visible-but-locked is cheaper and still shows the system.
3. **Is 26 MB acceptable to try?** The 20 MB target is a guideline; the honest
   options are ship-and-see or cut the voice clip set down.
4. **Who is in the applicant pool (§9a)?** The eight NPCs already standing in the
   taproom are the obvious answer — it reuses their busts, their party themes and
   the three-rival-parties decision. Ren and Aera then become one crew among
   several rather than *the* party, and their scripted −55 / −50 feud becomes one
   possible starting condition instead of the demo's spine. The alternative is a
   separate applicant pool, which costs eight more busts to look at.
5. **Can the player be refused twice running (§9a)?** A real refusal makes the
   application mean something; two in a row stalls a ten-minute slice.
   Recommendation: never refuse the first contract, allow refusal after that, and
   always leave the solo contract as the way forward.

---

## 17. Decisions

**2026-09-19.** Change log started. Dialogue audit recorded; fixes deferred, not
dismissed. GDD split into built / owed / to-build. **Parties rotate:** the player
applies for a party each contract and can be grouped with different people, from a
pool of personalities, on the shipped application odds (§9a). A fixed two-companion
party is no longer the design.

**2026-09-18.** Player picks one of three premade heroes, not a creator — three
premades, one tap, no stat sliders. Shops limited to trainer and blacksmith; no
grocer, insurance or vault. Three rival parties and eight NPCs, not seven and
twenty. One scripted ambush. NPCs keep to a single class or a pair. Contracts run
lawful → criminal → doomed. A party loss retries; only the pass is fatal. Audience
target moved from "preteen-friendly" to PEGI 12. Katana Slash is Hiro's default,
never bought, never shown. Skills consolidated onto the portrait; bottom bar
removed. The offshoot lives in its own folder and the original is never modified.

**Superseded from v0.5.** "Hiro alone" as the player character beyond the tutorial
road; three encounters as the whole demo; the four-card upgrade row; `ruins` as a
party contract; any party loss ending at the grave; "preteen-friendly" as the
audience target; `expedition.html` as the entry point (it is `index.html` in its
own folder).

**Superseded within v0.6 (2026-09-19).** One fixed party of Ren and Aera for every
contract, and the Apply button as a formality that always succeeds — replaced by
§9a.
