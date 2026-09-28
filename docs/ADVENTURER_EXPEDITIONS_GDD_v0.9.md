# Adventurer: Expeditions
## CrazyGames edition — game design document

**September 28 presentation update:** fixed enemy scale regardless of crowd count; small goblin/spider paired finishers; five inn paintings rotating with completed quests; level swamp causeway and one-shot earth defeat burst. See `INN_SWAMP_POLISH_20260928.md`. No combat balance changes in this art pass.

Version 0.9 · September 19, 2026 (rev. b) · Status reconciled September 20, 2026 · Working title

This revision supersedes v0.8; v0.5 through v0.8 are kept in `docs/` for history.

**Arcade mode — built September 27, balanced September 28, 2026.** Gold is
gone; a run scores points. Every skill is owned from the start at one level
(§7.0); health carries through the run, restored only by the Finisher's kill
heal and a paid Rest at the inn (§4); a fall ends the run on the End scene with
a top-10 board and a name-shaped name (§5.0); from the second playthrough the
monsters shuffle, scale ×1.3 per playthrough and the boss wave can roll a pack
of two or three bosses (§5.0a). The balance pass in `tools/balance_arcade.js`
set two knobs: boss packs share strength and the first quest heals between its
fights (§5.0a, §17). Save key `adventurer_expeditions_arcade_v1`; the game
always opens fresh. Open: the Facebook address and the feedback destination.

**Release polish - September 27, 2026.** All 17 Alpha-and-later finishers now have longer anticipation/contact/recovery holds; mountain and city combat use level fighting surfaces; Bram appears as a seated guest on alternate quest completions without recruitment. See `RELEASE_POLISH_20260927.md` for validation, candidate path and remaining portal QA. This updates presentation only, not the deferred skill/ending redesign.

**Travel presentation — September 27, 2026.** Fast running with three separately scrolling painted layers replaces slow movement across a short plate. Forest/market journeys last 9.67 seconds, rooftop 10.67, swamp 11.67, including transition hold. Four to five seconds of running surround the unchanged 1.49-second obstacle beat. Ground speed is 420 pixels/second; distant landmarks move at 7% of that speed and foreground at 150%. Keep the approved run cadence, weather and obstacle contact animation. Extra scenery loads only when its travel scene is needed. Awaiting the user's playtest of this implementation.

**Current implementation — September 26, 2026.** Three locations, all seven new monsters, 14 new paired finishers, four painted travel beats and location defeat effects are integrated and locally playable. Hiro remains the only hero. See CHANGELOG for verification and delivery paths. Final in-game art approval is pending.

**Earlier status — September 22, 2026.** Hiro, after playing: *"the game is
playing much more smoothly now."*

*Direction, decided 2026-09-22 (§2, §12c).* **Version 1 ships with Hiro as the
only hero.** What remains before submission is two or three new enemy types and
smoother animation. After that the game grows by **updates, not sequels**: each
update is a content pack — a new location, new enemies, or a new hero — loaded
after play has started. The next hero is not designed yet and is Hiro's to
create. **Bram is not the next hero** (he was an AI proposal); his finished art
stays on disk as an archive and as the test case for the hero-pack format.

*Version 1 content, decided 2026-09-24 (§5, §7, §17).* **Three locations, then
the end:** Road in the Rain (forest) → the swamp → the city, and after the city
boss an ending screen announcing **Part 2 with a new protagonist**, with Hiro's
Facebook and a way to send feedback. The old ruins is out of version 1.
**Monsters:** forest — wolf, thorn plant, Alpha boss (built); swamp — serpent,
beetle, moss giant, **hag boss**; city — goblin, spider, **orc boss** (new art).
Every enemy gets **at least two unique Hiro finishing moves**; swamp monsters
**melt into mud** on defeat and city monsters **burn away in blue flame**, where
the forest keeps its sparkle ([ART_STANDARD.md](ART_STANDARD.md) §7). **Skill
levelling is removed:** each skill is unlocked once with gold, each unlock
costing moderately more, and **God Aura now raises attack instead of defense**.
The location/art portion is now built (September 26). Skill-level removal, the God Aura redesign and bespoke Part 2 ending remain planned; current completion returns to the inn.

*Historical pre-v1 loop (superseded by the September 26 status above).* Four levels in a fixed order — **Road in the Rain, the reed marsh,
the city watch, the old ruins** — then round again. "Clear the road" is retired
from the rotation and survives only as a dev-panel preview. A new run starts in
the rain with 20 gold, and the tutorial teaches in the fight: buy a skill, fight,
the game holds the moment a wolf drops to half, tap it, arrow on.

*Creatures.* Wolf, thorn lurker and the Alpha only — the three with reworked,
animated art and Hiro paired finishers. Boars and the human foes are out of
every quest until their art is done. Finishing moves match by **painted set**,
not entity id, so any number of variants of a creature pair correctly (§7).

*Combat.* Skills are **turn-agnostic**: a tap fires as soon as the animation in
play has finished, costs nobody a turn and skips nobody's. God Aura and Counter
Attack recover **on a clock** (10/10/8 s and 5/5/4 s); Finisher has no cooldown
and is gated only by its health window (50 % normal, 25 % boss). Turn gap is a
pause-screen setting — 1 s normal, 2 s slow, 0.5 s fast — beside a Cinematic
camera toggle, which ships off. Status durations are still counted in rounds.

*Fixed 2026-09-22:* **the Finisher misfired on the boss wolves** — it now kills
every boss at or under 25 % with its finishing move, and stays dark above that
line. See §7, "The boss line and the glowing button."

*Developer tools.* An always-present ⚙ while `Dev.DEV_BUILD` is true: preview
any location, cycle weather and time, full speed, jump to the inn, clear the
save. Start over reloads with `?fresh=1` for a true first launch.

*Size.* The whole game is **20.77 MB**, but that is not the number CrazyGames
judges (corrected 2026-09-22, §12a.0). They measure only what downloads before
the first `gameplayStart`: **50 MB or less to be accepted, 20 MB or less to be
eligible for the mobile homepage**. The whole game may be up to 250 MB and 1,500
files. What loads before the first fight was last measured at 9.69 MB
(2026-09-21, before the marsh and ruins opened) and needs re-measuring. `npm run
release:check` still gates on the whole-game total and has to be changed to gate
on the initial download — not built yet.

*Superseded status of September 21, kept for the record:*

**Status — Alpha boss art integrated, September 21, 2026.** The first
road remains the playable slice: Hiro, ordinary wolves, thorn lurkers and the
distinct painted Alpha boss. Bram is the only art-ready companion; new
recruitment and next-quest locks remain. The inn offers Replay. Broader
quests/recruits below remain roadmap/history.

Hiro has 175 runtime frames across 27 clips, including the approved 16-frame
run, four-frame sheathed idle and 64 paired-finisher frames across nine
finishers. Alpha has 45 runtime frames across nine clips, including three
Hiro/Alpha paired finishers; the road leader is keyed as `artActor: alpha` and
`artIdentity: tutorial-alpha`. Wolf tier1 is the overhead strike/twirl; plant
tier1 is stem iaido. Animated inn paintings and four painted skill icons are
integrated. Other combat, enemy art, music and voices are reused. The package
is 19,910,649 bytes / 210 files, 89,351 bytes under the 20 MB ship gate. Local
headless, upload-only journey, all-nine-finisher, inn, HUD and
desktop/emulated-phone tests pass.

See [integration report](ASTRA_V2_INTEGRATION_20260920.md) and
[intake notes](art/astra-v2/ART_INTAKE_NOTES.md). Physical-phone/portal QA remains.
This current status supersedes earlier dated source-only/paused-intake notes
and frame counts preserved below.

**What changed since v0.8 — a review pass, no new design.** The v0.8 loop was
built the same day (CHANGELOG, "Build session"), so this revision corrects every
section that still described the old scenes as present or the loop as planned
(§4, §7, §8, §12a, §13, §15), records the numbers the build actually produced,
and adds **§19, the build review**: what was played, screenshot by screenshot,
what is wrong or unproven, with severity and owner. §16 keeps the open
decisions; the answers the build assumed are listed there and are still Hiro's
to overturn.

**What changed since v0.7 (kept from v0.8).** The loop was redesigned to fit a mobile size budget
and to be a game rather than a sequence of scenes. **Hiro is now the permanent
first member** and the player *recruits* party members with gold instead of
choosing a replacement hero. The trainer, the blacksmith, the hero-pick screen and
the rotating-party application are all **cut from the slice** — recorded as
shelved in §18, not deleted. Skill levelling stays, moved onto the HUD where
Hiro's upgrades already live. Content is now **a tutorial plus four repeatable
quests on three music tracks** (§5), built almost entirely from plates already in
the build by grading them to night and adding weather. And §12a adds the **size
gate** — a ship manifest and a budget check that fails a build over target,
because the art masters that arrived in §10.4 made the old "watch the folder size"
approach untenable.

**What earlier revisions established and this one keeps.** The real-time combat
model (§7a), the impact language and finisher structure (§10), the character
design brief (§10.3), Astra's delivery inventory (§10.4), the dialogue audit (§9),
the isolation rules (§12), and the test suites (§13).---

## 1. What the demo is

A short, action-first slice of *Adventurer* rebuilt for CrazyGames, built around
one loop the player can repeat:

> **tutorial → inn → recruit a member → level a skill → travel → quest → travel →
> inn → repeat**

The player fights immediately as Hiro, is taught by the hand rather than by text,
and comes out of the tutorial with gold. At the inn that gold does two things:
it buys a party member, and it raises a skill. Then a quest — travel out, three
fights with travel between them, travel home — and back to the inn with more gold.
Every pass through the loop the party is bigger or sharper than it was.

**Hiro is permanent.** He is the first member of every party and the only
character the player taps; recruits fight on their own. That is what makes the
purchase legible — you can see what you bought standing next to you.

**No story in this slice.** No grave, no leader's death, no faction framing. The
quests are contracts and the loop is the game.

---

## 2. Scope lock (revised 2026-09-19)

**Current override, 2026-09-24 (Hiro), adds to the one below.** Version 1 is
three locations — forest, swamp, city — ending after the city boss with the
Part 2 announcement (§5.0). The old ruins leaves version 1. Skill levelling is
removed from version 1 (§7.0).

**Current override, 2026-09-22 (Hiro), supersedes the one below.** Version 1
is Hiro alone — no hiring, no second hero — with the four open levels, the wolf,
thorn lurker and Alpha, plus two or three new enemy types and smoother
animation. Recruitment stays locked in version 1 rather than being deleted:
new heroes arrive later as update content packs (§12c). Hiro: *"so instead of
new game, we make new updates and we keep adding heroes and locations?"* — yes,
because an update keeps the listing, its players and ratings, and CrazyGames'
size rule allows it (§12a.0).

**Current override, 2026-09-20 (superseded):** first tutorial only, then the inn and Replay;
Hiro and Bram are the supported heroes. Keep the broader loop below as the
roadmap while the first five minutes are polished. Do not re-enable it merely
because older quest data or art remains on disk.

**In.** Hiro as the permanent, tappable first member. A recruitable roster bought
with gold. Skill levelling on the HUD. A tutorial quest plus four repeatable
quests (§5). Travel scenes with mood banter, between the inn and the quest **and
between the fights inside it**. Three music tracks. A size gate (§12a).

**Cut from the slice, recorded in §18.** The hero-pick screen. The trainer. The
blacksmith and gear-set purchasing — premades ship with the gear and skills their
design calls for. Applying for parties and rotating crews. Story, the doomed pass
and the grave.

**Out, as before.** A character creator. A grocer, insurance desk or vault. A
quest board. Inventory management.

---

## 3. The roster

**2026-09-22: no recruits in version 1.** Hiro is the only hero at launch. The
recruit table below is history: the five names and kits were proposed by an AI
during design, not by Hiro, and none of them is committed. In particular **Bram
is not the next hero** — Hiro: *"it was something ai came up with, I haven't
really thought up the next character yet."* Bram's finished atlas, bust, inn
painting and voice stay on disk, out of the package, as an archive and as the
fixture that proves a hero pack loads and plays (§12c). The party mechanics
below — owning, fielding two — remain the design a future hero plugs into.

**Hiro** is the player's character in every run. He keeps the kit the tutorial
teaches — Katana Slash by default, God Aura, Counter Attack and Finisher unlocked
and raised with gold — and he is the only character whose icons the HUD shows and
the only one the player taps. Nothing about the website's Hiro changes; his four
skills still resolve through the override table in `data.js`.

**Recruits** are bought at the inn and fight on their own. Each ships finished:
the gear its design calls for, the skills its design calls for, no shopping. They
keep to one class or a pair, as before.

| Recruit | Class | Kit | Personality (voice) |
|---|---|---|---|
| **Bram**, Shieldbearer | tank / fighter | Shield Wall, Cleave, Taunt · Bulwark | — |
| **Nyx**, Poacher | rogue / ranger | Venom Fang, Aimed Shot, Snare · Opportunist | — |
| **Sable**, Hedge Mage | mage | Fire Bolt, Spark, Frost Touch · Arcane Focus | — |
| **Aera**, Field Healer | healer | Mend, Guardian Ward · Devoted | F03 |
| **Ren**, Free Sword | fighter | Cleave, Defiant Stand · Momentum | M02 |

Each recruit needs a distinct personality ID so travel banter varies as the roster
grows — that is what replaces the rotating-party fix from v0.7 (§9a, now shelved).
Bram, Nyx and Sable need theirs assigned; Aera and Ren already have voiced sets in
the build.

**Party size: Hiro plus two in the field.** The combat staging already places
exactly two companions, so this costs no new marks. The player may *own* more than
two, and chooses which two ride along — owning is the purchase, fielding is free.
That turns a roster of five into a real decision and gives gold somewhere to go
after the first two buys.

**Recruits are heroes, art-wise (corrected 2026-09-19, Hiro).** Every recruit the
player can buy carries a full painted clip set to Hiro's standard — the same
idle, walk, draw, attacks, cast, hit, roll, victory and kneel, with the paired
frames its kit calls for — not the six-clip economy set v0.8 proposed. Buying a
recruit is buying a character, and a character with placeholder motion beside a
painted Hiro is not one. Bram's delivered set is therefore used whole, not
trimmed. The consequence is that a recruit costs what Hiro cost to paint and
about 1.3 MB of atlas at today's height, which §12a and §16.13 take up: not every
recruit can ship painted inside 20 MB, so **the slice ships the recruits that
have full art and lists the rest as not yet purchasable** rather than shipping
them unpainted.

**No placeholder art, anywhere (rule, 2026-09-19).** The demo no longer stands in
for missing art with plates, composed busts moving as actors, or tweened
placeholder motion presented as a character. Where a thing has no painted art the
GDD says so (the list is §10.5) and the build either omits the thing or shows it
in a way that is honest about being unfinished. The placeholder choreography in
`actors.js` stays in the code as the director's fallback for a clip a sheet
lacks, but nothing in the shipped slice should be reaching it.

---

## 4. The inn

**Arcade, as built (2026-09-27).** *Supersedes the gold economy below, which is
kept for history.* The inn is three buttons and a health bar. **Rest** (☾)
restores Hiro to full health for **1,000 points, doubling each use in the run**
(1,000 → 2,000 → 4,000 …), and is refused at full health — the label shows the
price or *full health*. **High scores** opens the top-10 board (§5.0).
**Embark** goes to the next open quest in order (forest → swamp → city, then
round again). Nothing is bought and nothing is levelled: every skill is owned
from the first fight (§7.0), and recruiting stays locked for version 1. The
score pill replaces the gold purse everywhere.

*Balance finding (2026-09-28, `tools/balance_arcade.js`).* Rest rarely pays:
runs end in burst waves — a pack of bosses, three shuffled monsters on the
third playthrough — not from attrition, and the Finisher's kill heal (35 % then, 25 % since the second pass) keeps
a tapping player healthy between fights. Over 150 simulated runs a player who
never Rests clears as many quests as one who Rests below half health, and
keeps the points. Rest stays as Hiro designed it — a safety the player can buy
— and the price is a knob (`X.rest`) if play shows it should be cheaper.

*History — the gold inn (2026-09-19 to 09-26).* Two things to spend gold on,
both on one screen, neither a scrolling list.

| Spend | Cost | Effect |
|---|---|---|
| Recruit a member | 60 / 90 / 120 g, rising per recruit owned | Adds them to the roster, finished and ready |
| Raise a skill | 20 / 30 / 40 g per level | Hiro's skills, levels 1–3, exactly as the tutorial teaches. *Superseded 2026-09-24: no levels — each skill is unlocked once, each unlock costing more (§7.0).* |

Recruits appear as busts along the bar; a tap shows the class, the kit and the
price. Skill levelling uses the HUD icons the player already learned in the
tutorial — the same `+` badge and confirm chip — so the inn teaches no new gesture.

Fielding is a tap on an owned recruit to bring them or leave them; if the party
is empty when Embark is tapped, the first two owned recruits ride along, so nobody
walks into a loop quest alone by accident. The quest button is the third control
and nothing else is on screen.

**Locked for the slice (Hiro, 2026-09-20).** While the first five minutes are
being finished, the inn shows Hiro (painted idle; Astra's table vignette replaces
it after intake), his skills for levelling, *Next quest* and *Unlock a hero*
locked, and *Replay the road*. New recruitment is disabled by scope, not because
Bram lacks runtime art. Existing Bram ownership is preserved and fielded only
when his painted art passes readiness; unsupported actors remain unavailable.
`X.slice.firstLevelOnly` must stay true during this pass; turning it off would
reopen the broader historical loop below.

**As built (2026-09-19).** Prices are 60 / 90 / 120 / 150 / 180 for the five
recruits in the order bought; skills 20 / 30 / 40 per level. The tutorial road
pays 40 / 50 / 60 = 150, so the three guided unlocks (60) leave 90: the first
recruit and change. Loop quests pay per fight as well, and a defeat in one offers
*Back to the inn* keeping that gold, which is what stops a solo or under-levelled
party from being stuck (§7). Layout: Hiro at x 240, the five busts from x 470 at
118 px pitch, Embark bottom-right at 200 × 100. Hiro's skill icons are the combat
HUD in *inn mode* (portrait and icons only).

---

## 5. Quests, environments and music

### 5.0 Version 1 — three locations and an ending (decided 2026-09-24)

*Hiro, 2026-09-24. Supersedes the four-level order below for version 1; not built.*

| # | Location (today's quest) | Regular monsters | Boss | Defeat effect | Music |
|---|---|---|---|---|---|
| 1 | Forest — Road in the Rain | Dire wolf, thorn plant | Alpha | Sparkle (built) | Origin of the Last Name |
| 2 | Swamp — the reed marsh | Serpent, beetle, moss giant | **Hag** | **Melt into mud** | Hunter's Breath (night) |
| 3 | City | Goblin, spider | **Orc** | **Blue magical flame** | Origin of the Last Name |
| — | Ending screen | | | | |

The monster designs, skills and roars come from the original game — river
serpent, iron beetle, moss giant, mire hag, goblin, crystal spider, orc king —
listed with their data in [ART_STANDARD.md](ART_STANDARD.md) §7.1. Every
monster needs at least two unique Hiro finishing moves before it can be
fielded (ART_STANDARD §7.2). The old ruins is out of version 1; its data and
art stay on disk. Astra's delivered but unused boss art (Ironback boar, Marsh
Alpha, Ruins Alpha) and the cave boar also stay on disk, unused.

**The ending.** After the city boss falls, the game ends on a screen that:
thanks the player; announces **Part 2, featuring a new protagonist — stay
tuned**; invites the player to **follow Hiro on Facebook**; and asks them to
**send feedback**.

**CrazyGames rule that shapes the ending** (gameplay requirements, read
2026-09-24): *"The game should not include cross-promotions for external or
internal games/platforms,"* but *"Community links (discord, dev website, ...)
are allowed on the game menu only as long they don't lead directly to a
playable web version,"* and links between games in the same series are
allowed. So **the Facebook and feedback links live in the game menu** (the
pause/settings menu), and the ending screen names them and points the player
there rather than carrying a link itself. Announcing Part 2 is fine; a link to
it is allowed once it exists, as the same series.

**After the ending (Hiro, 2026-09-24): back to the inn, and replay.** The
player returns to the inn with all three locations open to play again.

**Part 2 is an add-on at a future date** (Hiro, 2026-09-24): new content added
to this game on the same CrazyGames listing, as a content pack (§12c), not a
separate game.

Open: the Facebook page address, and where feedback goes (a form, an email, or
Facebook messages).

**As built — the End scene (2026-09-27).** Every run ends on one screen, the
End scene, whether the city boss fell, Hiro fell, or the player chose *End run*
in the pause menu (one confirm: *End this run and score it?*). It shows the
score and the playthrough reached, the top-10 board, and — when the score
makes the board — a name field. **A name is required, blank by default, 25
characters at most, and must read like a name** (Hiro, 2026-09-27): no spaces;
letters, digits and `# ! _ - . @ $`; starts with a letter; at least three
letters and a vowel; no more than three consonants in a row; no letter three
times in a row. `tyler#2`, `tyler12`, `tylertheman!` pass; `12345`, `2838`,
`@#$skfsal`, `adfskdlsfosl`, `uislllslsl@#@11221` are refused with a hint.
The board (`X.Board`) keeps ten rows on this device under its own storage
key, a tie sitting below the older run. That storage is the browser's own —
CrazyGames does not keep it — so a cleared browser, a strict private window or
another device starts from nothing. The **permanent board** (Hiro, 2026-09-28)
answers that: `X.board.hall` ships rows with the game, merged with the local
ten, best first, a permanent row winning a tie; the End scene asks players who
make the top ten to send a screenshot to Hiro on Facebook, and their scores are
added to `hall` by hand at the next update. Only this device's rows are ever
written to storage. The footer carries the announcement:
*Part 2 with a new hero is coming — stay tuned. Follow Hiro on Facebook and
send feedback from the pause menu.* **Play again** starts a fresh run. The
pause screen carries those two links (`X.links`: Hiro on Facebook and
Neverendingnarratives, the website game's support pages) as of 2026-09-28,
under a "Feedback and news" row. CrazyGames allows community links on the
game menu only and never a cross-promotion, so the ending points at the menu
and carries no link itself, and the website's donate link is left out. The
game always opens fresh (Hiro): a save survives only a reload mid-run, and a
reload after a fall lands back on the End scene. The Facebook link and the
feedback destination are still open (§16).

**Open as of 2026-09-21: the road, Road in the Rain, and the City Watch.** A
quest opens when the package carries everything it needs, and two separate
things had been keeping the loop shut. The first was a bug: `sanitizeRun` pulled
any run whose quest was not literally `road` back to the tutorial whenever
recruiting was locked, ignoring the open-quest whitelist — so embarking on the
rain worked and was then undone on the next save load, which is why quest two
was unreachable. It now tests `Camp.questOpen`.

The second was size, not art. The city's foes are the human set, its beasts are
the wolf, plant and Alpha atlases already in the build; only the alley plate and
the city panorama were missing, cut earlier to save space. They are back, paid
for by dropping Bram's combat atlas (2.42 MB) — he cannot be hired while the inn
is locked, so the package was carrying a companion the player could not reach.
The marsh and the ruins stay shut on budget alone: they share `night1` (1.00 MB)
and need four plates (1.42 MB), which is 2.42 MB against 1.68 MB spare. They
open when a trim pays for them (§12a, §12b).

**Nothing may be open without its art.** `X.shipped.actors` names what the
runtime is allowed to queue, and `test/expedition_sim.js` asserts both that every
open quest's music, plates and panorama are in the ship set and that `X.shipped`
matches the package exactly, in both directions. A missing file does not
degrade — Phaser parks the scene in preload — so this is a gate, not a nicety.

**Scope note, round 3 (2026-09-21):** the slice opens one quest at a time.
`X.slice.openQuests` is the whitelist — today `['rain']`, so the tutorial hands
off to **Road in the Rain** and stops there; the city, marsh and ruins are
unreachable rather than merely unlisted (`Camp.questOpen`). Hiring stays locked
for the whole slice, and the inn offers Replay the road beside the open quest.
The rest of this section records the broader loop design; the live tutorial uses
wolves, thorn lurkers and the gray-wolf leader, and scenery and music are reused.

A tutorial plus **four repeatable quests**, on **three music tracks**. Each quest
is three fights with a travel beat before, between and after.

**Almost none of this needs new art.** The shipped art layer grades any plate to
`day`, `evening` or `night` and overlays weather — `clear`, `overcast`, `rain`,
`storm`, `snow` — procedurally (`A.Weather`, `A.WeatherFX`, and the night grade in
`anime_environments.js`). The scenes already pass a phase and a weather override.
So a night-storm version of a plate we ship anyway is **one line of quest data**,
not a new painting. That is what makes four quests affordable.

| # | Quest | Battle plates | Phase / weather | Enemies | Track | Travel |
|---|---|---|---|---|---|---|
| **T** | The road (tutorial, Hiro alone) | deep wood → bandit road → mountain | day / clear | dire wolves → wolf, boar, lurker → **Alpha** | Origin | forest, road |
| **1** | The road in the rain | deep wood → bandit road → mountain | day / **storm** | boars → bandits, cutthroat → **boar boss** | Origin | forest, road |
| **2** | The city watch | alley | day / overcast | watch ×2 → watch, bailiff → **watch captain** | Origin | city |
| **3** | The reed marsh | marsh | **night** / clear | wolves → lurkers, wolves → **Alpha** | Hunter's Breath | marsh |
| **4** | The old ruins | ruins | **night** / **storm** | boars, lurkers → bandits, hedge mage → **alpha-2** | Hunter's Breath | ruins |

Quest 1 reuses the tutorial's three plates under storm and swaps the mob table, so
the player's second outing is familiar ground made strange — and it costs nothing.
Quests 3 and 4 are the night pair: one clear sky, one storm.

Every battle plate and every travel panorama in that table is **already synced into
the build**: deep wood, bandit road, mountain, alley, marsh, ruins for fights;
forest, road, city, marsh, ruins for travel.

### 5.0a Scoring and the loop (arcade, built 2026-09-27; balanced 2026-09-28)

**Score** (`X.scoring`). A fallen regular monster pays **100**, a boss **500**,
a kill by the Finisher **+50**, a clean wave (Hiro ends it at ≥ 75 % health)
**+50**, and a cleared quest **+300** on top of its waves. Every payment is
multiplied by the playthrough bonus **1 + 0.25 × (playthrough − 1)**. A wave
pays once; a restarted fight cannot pay twice. Points are also the currency of
Rest (§4). Nothing else spends them.

**Playthroughs.** The three open quests are one playthrough; the run is on
playthrough 2 once all three have been cleared once, and so on, without limit.
From the second playthrough:

- **Monsters shuffle.** Regular waves draw from the whole pool — dire wolf,
  thorn lurker, serpent, beetle, moss giant, goblin, spider — seeded from the
  run (`run.seed`), so a reload replays the same waves. Wave sizes stay the
  quest's own.
- **Everything is stronger.** Enemy health and attack scale **×1.3 per
  playthrough, compounding, uncapped**: ×1.3 on the second, ×1.69 on the
  third, ×2.20 on the fourth.
- **The boss wave is a pack, guaranteed** (Hiro, 2026-09-28, after playing to
  a fourth playthrough without meeting one under the old odds). **2nd
  playthrough: always two bosses** — two of the own boss or the own boss plus
  another location's, 50 / 50. **3rd and later: always three** (own plus two
  from anywhere), and three is the most a boss wave holds. Was 60 / 20 / 20 / 0,
  40 / 25 / 25 / 10, then 25 / 25 / 25 / 25. Crowded waves are placed by
  painted width and shrunk a little, never below 0.82, so three bosses stand in
  a line.
- **Bosses join the regular waves** from the third playthrough
  (`Camp.waveBossOdds`, odds of none / one / two): **3rd 70 / 30 / 0; 4th and
  later 55 / 30 / 15.** The boss comes from any location and stands at the
  front. A wave never holds more than four monsters (`Camp.maxWave`) — the
  regulars make room — and at least one regular always stays.
- **Defeat effects stay where they belong.** A swamp boss in the forest still
  melts into mud; the effect follows the monster, not the location (Hiro).

**Balance pass (2026-09-28, `tools/balance_arcade.js`).** The probe plays whole
runs headlessly — Hiro alone, health carrying, Rest by a simple rule — for a
player who never taps, one who taps only what the tutorial asks, a casual one
who notices a ready skill half the time, and one who taps every skill the
moment it is ready. Two findings, two knobs:

| Finding, as rolled | Knob | After |
|---|---|---|
| A two-boss wave was won 40 / 12 / 4 % (forest / swamp / city) by the best player, a three-boss wave never; no run reached a fourth playthrough | `X.bossShare = {2: 0.7, 3: 0.5}` — every boss of a pack is scaled by the pack's share, on top of the loop scale | two-boss waves 92 / 80 / 36 %, three-boss ~10 %; a good player's median run is two full playthroughs (≈ 11,400 points), half reach the third, a few the fourth |
| A player who tapped only what the hand asked reached the first boss at ~10 hp and lost 57 % of the time | `X.tutorialHeals = true` — on the first quest of a run every fight opens at full health; from the second quest on, health carries exactly as designed | the tutorial follower clears the forest every time and meets the swamp with a full bar |

**Second pass (Hiro, 2026-09-28).** The first playthrough is tuned harder and
every later playthrough compounds on it (`X.monsterMult`, applied under the
loop scale): every monster's attack **×1.1**, bosses' health and attack
**×1.25**; the Finisher's kill heal **35 % → 25 %**. With the guaranteed packs
above, the probe now reads (100 runs, before in parentheses): no taps ~300
(500); tutorial taps only ~400 (1,400); casual median 4,200 (7,550), most runs
ending on the second playthrough; the every-skill player median 5,850
(11,200), 99 % ending on the second playthrough and over half of those on the
forest's two-boss wave; a mixed board's #10 6,000 (14,000). No simulated
player reaches the third playthrough; Hiro reached the fourth under the old
rules, so his playtest decides whether `X.bossShare[2]` or the boss
multiplier should ease. The numbers below are from the first pass.

Reference numbers after the first pass, 150 runs each: no taps at all ends in the
swamp's first fight with ~500 points; the casual player ends on the second
playthrough with ~7,500; the best player's tenth-best of 150 runs is ≈ 14,500,
a mixed board's #1 ≈ 18,000. Regular waves hold up: on the third playthrough a
three-monster wave is won 70 % of the time at full health, a two-monster wave
97 %. Rest did not move any of these (§4). Both knobs are one line in
`js/expedition/data.js` to revert.

### 5.1 Music

Three tracks, one slot each.

| Slot | Track | Used by |
|---|---|---|
| Quest A | **Origin of the Last Name** — `battle_origin.mp3` | Tutorial, quest 1, quest 2 |
| Town | **Weight of the Quiet Man** (Edwyn theme 2) — `edwyn2.mp3` | The inn |
| Quest B | **Hunter's Breath** (zero dark thirty) — *file to confirm* | Quests 3 and 4 |

`edwyn2` is confirmed: the shipped `music.js` names it "Weight of the Quiet Man
Edwyn theme 2" in its own comment. For Origin, the library holds both `origin1`
(the theme, in the quest pool) and `battle_origin` (the battle arrangement); since
a quest is mostly fighting and one track covers the whole of it, `battle_origin` is
the pick — `origin1` is the alternative if the travel beats should breathe.
**Hunter's Breath is not in the game's music folder under that name** and needs
pointing at; `night1` and `night2` are the closest matches by mood and would suit
the two night quests (§16).

**Three tracks means boss fights lose their own music.** Today every boss
encounter sets `music: 'boss1'`. Under this plan a boss keeps the quest's track.
That costs real punch at the moment the quest peaks; a fourth track is about
1.1 MB (§12a), which is the honest price of getting it back.

### 5.2 Travel between fights

Travel art now runs **between the fights inside a quest**, not only between the inn
and the quest. Today the walk to the next wave scrolls the next battle plate in;
instead it should use the travel panorama for that quest's location, the same view
the outbound leg uses, with the party walking. The plates are already in the build
and the code already knows how to scroll them, so this is presentation wiring
rather than new work, and it makes a three-fight quest feel like a journey instead
of three arenas.

---

## 6. Rival parties — shelved

Cut from the slice with the party-application system (§18). The three parties and
their eight NPCs are written up in v0.7 §6 and the scripted road ambush in v0.7 §5;
the busts they used are the same composed portraits the recruits use, so nothing is
wasted by shelving them.

The one piece worth keeping in view: the ambush was the demo's best surprise. If a
later pass wants one beat of spectacle back, it is a single encounter definition
with `ambush: true` and a rival's member list — the code for it is written.

---

## 7. Combat, presentation and the HUD

### 7.0 Skill levelling removed; God Aura changes job (decided 2026-09-24)

*Hiro, 2026-09-24: skill levelling "doesn't really add much to the game."*
**Built 2026-09-27, as the arcade** (the unlock-for-gold plan below was
overtaken the same week): every skill is **owned from the first fight at its
one level**, nothing is bought, and the HUD shows the three icons lit with no
pips, plus or lock. Values as shipped: Katana Slash ×1.3; **God Aura attack
×1.35 for 3 rounds, no defense, no evasion**, 10 s recovery; **Counter Attack**
answers 2 attacks for 2 rounds, 5 s recovery; **Finisher** power 2.8, windows
51 % (regular) / 25 % (boss), heals 25 % of full health on a kill (35 % until
the second balance pass of 2026-09-28), no cooldown.
The tutorial teaches **Finisher (fight 1) → Counter Attack (fight 2) → God Aura
(boss)** and holds only on the first quest. Hiro's unused level-2/3 clips ship
as random variety. Everything below that describes levels 1–3 or unlock prices
is history.

- **One level per skill.** Finisher, God Aura and Counter Attack are each
  unlocked once with gold and never raised. Katana Slash stays Hiro's default,
  never bought. The HUD's `+` badge and level chip go; the inn shows unlock
  prices instead.
- **Each unlock costs moderately more than the one before.** Proposed: **20,
  then 35, then 50 gold**, whichever skill is bought in which order. Checked
  against the road: the player starts with 20 and fights pay 40 / 50 / 60, so
  all three unlocks fit inside the tutorial road (20 → 0; +40 → 35 → 5; +50 →
  50 → 5; +60 → 65 at the inn). To confirm in play.
- **God Aura looks the same but raises attack instead of defense.** Today it
  gives attack ×1.2–1.4 **and** defense ×1.2–1.4 plus evasion. New: **no
  defense, no evasion, attack moderately higher** — proposed **×1.35** for the
  aura's duration (today's level-2 attack was ×1.3). Counter Attack already
  covers defense. The skill's info text changes from "a glowing shield … takes
  less damage" to raising Hiro's attack.
- **Proposed single values for the rest,** taken from today's middle level:
  Counter Attack answers 2 attacks; Finisher power 2.8 and heals 35 % on a kill,
  keeping its 50 % / 25 % windows and no cooldown; God Aura recovers in 10 s and
  Counter Attack in 5 s.
- **Art.** God Aura keeps its current look. Hiro's level-2 and level-3 clips for
  slash, aura and counter lose their purpose; they can stay as random variety
  or be left out of the package.
- **Tutorial.** It still teaches buying a skill, then using it; the steps that
  taught raising a skill go.

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

**The fight no longer runs itself (Hiro, 2026-09-20).** Hiro swings Katana Slash
on his own; God Aura, Counter Attack and Finisher fire only when the player taps
them, and a tapped skill is a cinematic: the world slows and the camera pushes
toward the action while it plays. The HUD sits on its own camera and stays still.
A run with purchases and no taps is exactly as strong as a run with neither, and
the sim's "auto" rows now measure that. §7a's real-time model is unchanged by
this; it only moves the tap to a clock.

**A finishing move is something the player spends, not something the game gives
(Hiro, round 3, 2026-09-20).** Only a kill made *with the tapped Finisher* plays
a finishing move and the heavier `kill` cinematic. A lethal Katana Slash, a
counter, a riposte, a companion's blow or a bleed-out is an ordinary death: the
normal clip, the normal hit-stop, no slow motion and no push-in. The rule lives
in one place (`beats.js`: a `byFinisher` flag threaded from the step's own
choice), so nothing else can quietly opt in.

**The windows: half for a normal enemy, a quarter for a boss.** The Finisher
takes an ordinary enemy at 50 % health or less and a boss at 25 % or less, flat
at every level — levelling buys the heal and the size of the hit, not a wider
window, because one number the player can hold in their head beats three they
cannot.

**The boss line and the glowing button — a bug, diagnosed and fixed 2026-09-22.** Hiro:
*"finisher is not working on dire wolf, it's not doing the finishing move
animations or killing him ... it's working on regular wolfs and plants though."*
Measured by firing the Finisher at every creature at 45 %, 30 % and 20 %: every
ordinary wolf and plant dies at all three; **both boss wolves — the Alpha in the
rain and the Alpha on the later levels — survive at 45 % and 30 %**, taking about
22 damage, and only execute at 20 %. The cause is a mismatch between two numbers.
Execution respects the boss line: a boss is unmasked for execution only at or
under 25 %. But *readiness* — what lights the button — uses the ordinary line
(`requireBelowPct 0.51`) for every enemy, boss included. So the button promises
a kill at 51 % that the game will not deliver until 25 %. With no kill,
`opts.lethal` is false and `Actor.canPair` correctly refuses the paired clip, so
the missing animation and the missing kill are one bug, not two.
It is worse in the later boss waves, where the Alpha fights beside a wolf. With
both at 40 %, the Finisher aimed at the Alpha three times in five — the boss is
in the valid-target pool and threat targeting prefers it — and **nobody died**,
though a finishable wolf was standing beside it. The fix is to build the
Finisher's target pool with each target's own line (50 % ordinary, 25 % boss), so
an Alpha above 25 % is never offered: the button then glows only when a kill is
real, and in a mixed wave it always takes the wolf. **Fixed as proposed** (Hiro:
*"Keep bosses at 25% and make the changes to fix this bug"*): `Enc.skillState`
filters the Finisher's pool by each target's own line.
Fixing the kill exposed a second, separate cause for the missing animation. Hiro
borrows the Alpha's sheet — where the paired Alpha frames live — before playing
his finisher, but only did so for the exact identity `tutorial-alpha`. The rain
boss (`road_wolf_leader`) happens to pair from Hiro's own sheet, but the Alpha on
the marsh, city and ruins (`alpha_2`) died with a plain `down`. The borrow now
keys on the painted set the target is drawn from (`X.paintedActorOf`), the same
rule the pairing check already used. Guarded by two sim tests and a browser test,
`npm run test:finishers`, that finishes a wolf, a plant and the boss on every open
level and requires both the kill and a paired clip.

**And no cooldown at all** (Hiro, 2026-09-21: *"it's already limited by having
specific conditions it can be used under anyway"*). The health window is the
cost: a second Finisher needs a second enemy softened below half, which the
fight has to produce. A timer stacked on top of that took the tap away at the
exact moment the window finally opened — the worst time to be told no — so the
three-turn cooldown is gone at every level (`cooldown: 0`). The engine treats a
falsy cooldown as none, so nothing else changed: the HUD's wedge and the
"Cooldown n" chip simply never fire for it. Back-to-back finishes are now
possible in a crowded wave, and that is the intent — the cinematic is a reward
for setting two enemies up, not a rationed effect. The shared engine exempts bosses from execution outright and
`js/core` is never edited here, so the boss case is resolved in the Expedition
layer (`Enc.bossExecutable`): when a boss is already under its line and the
Finisher is what is being spent on it, the engine's own execute path is allowed
to run, giving the same event, death bookkeeping and heal. Above the line the
Finisher is still a heavy hit.

**Cinematic rates (round 3).** A tapped skill runs the world at 0.70 and pushes
to 1.16 over 150 ms; a Finisher kill runs at 0.55 and 1.26 over 140 ms. The
first pass (0.50 / 0.36 over 240 / 220 ms) read as lag rather than drama. Every
exit — fight over, defeat, restart, Start over, scene shutdown — snaps the
camera back to zoom 1, centred, with time scales at 1 (`X.UI.resetCamera`). The
baseline is a constant, not a sample of the live camera: sampling let a restore
that was still in flight become the next baseline, which is why the zoom used to
ratchet in over a fight and never come home. `test/browser_camera_rest.js`
(`npm run test:camera`) asserts it after every fight and at the completion card.

**Icons and the info box (2026-09-20).** Icons are 52 px across (were 36).
Skill text shows only on a three-second hold, stays while held and fades three
seconds after release; the box is wide enough to read on a phone and its text
is written for a fourth-grade reader (`X.skillText`): what the skill does, one
or two short sentences, no numbers.

**Start over, pause and mute everywhere — built 2026-09-19.** `X.UI.corner`
mounts mute, pause and Start over (with a ✓/✕ confirm) in the inn, the travel
scene and the battle; Start over wipes the run **and the first five minutes
with it** — a blank save, the guidance re-armed, the hand back on the first
skill (corrected 2026-09-21; it used to carry the retired tutorial flags across,
so a restart dropped the player into an unguided fight). `Run.startOver` is now
`Run.reset` and nothing else, which makes it the same run a new player gets and
the same one `?fresh=1` builds — one path, so a bug in it cannot hide in the
difference between the two. `test/browser_restart_dev.js` holds it there.
The defeat card is also new: the tutorial road goes again on a loss, a loop quest
offers *Again* or *Back to the inn* with the gold from fights already won. The
paragraphs below are the finding as it stood before the fix, kept for the record.

**The developer's tools live in the game, not in the URL — built 2026-09-21.**
Hiro plays this build the way a player does, so the shortcuts that used to be
URL parameters are a panel behind a ⚙ in the corner control of every scene:
*Fresh tutorial*, *Jump to the inn* (road cleared, 150 g), *Boss fight*, *+100
gold*, *Unlock every skill*, *Open every quest* (lifts the slice lock), *Painted
art off* (the A/B against the plates) and *Clear the save*. Any jump resets the
camera first, so it can never strand a pushed-in one.

The tools are simply on while the game is in development — no key to remember,
and they work on a phone, which is where most of the testing happens. Two ways
to look at the game as a player will: **Shift+D** hides and restores them
without a reload, and `?dev=0` hides them for one session. One line ships the
game without them: `Dev.DEV_BUILD = false` at the top of `js/expedition/dev.js`,
after which no cog, no key and no URL brings them back. `npm run release:check`
refuses to bless a package while that flag is still on, and checks the size
budget, the baked busts and the notices file at the same time, so the flag
cannot be the thing that slips out the door.

**There was no way to start over, and no HUD outside a fight (found 2026-09-19).**
The run saves a checkpoint on every scene change and the page resumes into it, so
a player who has finished the demo — or who simply wants a different hero —
reopens it at the inn they left, with no control anywhere that says *begin again*.
It is not a hard softlock (solo contracts remain available), but the arc is spent
and there is no forward action. Restarting today means appending `?fresh=1` to the
URL, which no player will discover.

The cause is structural: pause and mute live in `X.Hud`, and only the Expedition
scene builds one. The Inn, Travel and Grave scenes have no HUD at all — which also
means **mute is unreachable in the three scenes that play the music and the
recorded voice.** The fix is one persistent corner control present in every scene,
carrying mute, pause and Start over; the CrazyGames guidance against trapping the
player (§14) is the reason this is a submission blocker rather than a nicety.

Where *Start over* belongs: in that corner control everywhere, and as a second
button on the grave card — the end of the arc is exactly where a player wants to
try a different adventurer, and today that card offers only "Back to the inn". It
confirms before wiping, because the save holds the hero, the gold and the kit.
§9a makes this worth more than it looks: once parties rotate, a second run is a
genuinely different run.

---

## 7a. Real-time combat balance (design pass, 2026-09-19)

Combat is no longer turn-based. Two things break immediately: skills that had no
cooldown in a turn economy now fire every frame, and enemies fall back on basic
attacks because nothing tells them when to use a kit. This section defines the
timing model, the auto-cast rule, per-enemy AI, and what it does to the numbers.

**Nothing here is built.** The folder still runs the turn-based `Combat` loop; the
values below are targets for the port, not a description of the current build.

**Patterns borrowed.** *Firestone Idle RPG*: per-skill cooldowns drawn as radial
wedges, auto-cast the moment they come up, a manual tap to time them instead — our
HUD already draws that wedge (§7), so the visual contract exists and only the
clock behind it changes. *Rumble Heroes*: a small ability set that stays readable
at phone size, and an auto-attack whose interval comes from attack speed — which
is why the three-active cap in §3 survives the port unchanged. *Dota Underlords*
and auto-battler AI generally: units fire abilities on a resource and a condition,
never on a coin flip — we substitute a cooldown for the mana bar and keep the
condition, because a second resource bar per enemy is unreadable at this size.
*Diablo Immortal*: cooldown tiering is what makes a rotation feel like a rotation
— light skills come back before you miss them, ultimates are rare enough that
landing one is an event.

### 7a.1 Timing model

**Basic attacks** fire on an interval derived from `spd`:

> `interval = 14 / spd` seconds, clamped to [0.7 s, 2.0 s]

Against the live stat spread that gives: beasts and Hiro at spd 14–13 swing about
once a second; Nyx (13) 1.08 s; Sable (10) 1.40 s; Bram and every human (8) 1.75 s.
A 1.75× spread between the slowest and fastest reads on screen without turning spd
into the only stat that matters. The clamp keeps later stat inflation from
producing a strobe.

This promotes `spd` from a turn-order tiebreak to a damage stat. §7a.4 says what
that invalidates.

**Actives** run on individual cooldowns in three tiers:

| Tier | Cooldown | What belongs here |
|---|---|---|
| Light | 3–5 s | The rotation filler — a strike or bolt the player expects back almost immediately |
| Heavy | 8–12 s | Control, party buffs, damage negation — things that would trivialise a fight on a light timer |
| Ultimate | 20–30 s | Executes and self-revives — once a fight, and the fight turns on it |

**Hiro's tutorial kit:**

| Skill | Tier | Proposed | Reasoning |
|---|---|---|---|
| Katana Slash | — | *is* the basic attack (1.08 s at spd 13) | Always owned, never shown, never bought (§3). In real time the thing he does by default is the auto-attack; its levels raise power and bleed rather than granting a castable. |
| — L3 sweep | Light | 5 s | L3 currently retargets to `allEnemies`. Free AoE every 1.08 s is not a purchase, it is a different game; the sweep becomes a timed cast and the basic stays single-target. |
| God Aura | Heavy | 10 s, 5 s duration | A party-wide atk/def/evade buff at 50% uptime is a decision about *when*, not a permanent stat line. |
| Counter Attack | Light | 5 s, 4 s window | Reactive and short-lived; the player should be able to answer a second incoming burst in the same fight. |
| Finisher | Ultimate | **none — the health window is the gate** | Matches the turn-based build after 2026-09-21 (§7). The execute is already rare because it needs a target under its line; a timer on top of that would, in a 10–20 s fight, mostly mean refusing the tap at the one moment it was earned. If real-time play shows finishes chaining too freely, the answer is a short global gap between *cinematics*, not a cooldown on the skill. |

**The three heroes (§3):**

| Hero | Skill | Tier | Proposed | Reasoning |
|---|---|---|---|---|
| Bram | Cleave | Light | 4 s | Row damage is his rotation filler; nothing in it snowballs. |
| Bram | Sunder | Heavy | 8 s | The armour cut lasts the battle, so re-casting it adds nothing — a light timer would just be wasted taps. |
| Bram | Shield Wall | Heavy | 10 s, 3 s duration | Full damage negation with reflect. Any faster and a tank is unkillable in a ten-minute slice. |
| Bram | Taunt | Heavy | 9 s | Forcing every enemy onto him is the strongest single button he owns; it should lapse and need re-establishing. |
| Bram | Stand Fast | Ultimate | 25 s | A self-revive. One per fight is the point. |
| Nyx | Venom Fang | Light | 4 s | Poison and bleed both stack — frequent application is the design. |
| Nyx | Aimed Shot | Light | 5 s | Her ranged filler; slightly slower than the melee light because it costs no exposure. |
| Nyx | Snare | Heavy | 8 s | Control. Constant uptime on a delay/lose-action effect removes the enemy from the fight. |
| Nyx | Smoke Bomb | Light | 5 s | Evade plus stealth is an escape, not a filler — the low end of light. |
| Sable | Fire Bolt | Light | 4 s | Highest single-target power in his kit; the anchor of the rotation. |
| Sable | Spark | Light | 4 s | Shock raises all incoming damage, so it wants to be up often. |
| Sable | Frost Touch | Heavy | 8 s | Freeze is hard control and already has a re-freeze lockout. |
| Sable | Ember Lash | Light | 5 s | Less bite than Fire Bolt; the burn is the point and burns overlap. |

**Perks stay passive and need no gating.** Bulwark, Arena Champion, Opportunist,
Marksman, Septic Sanguine, Arcane Focus and Pyromaniac are all continuous or
trigger on an event that already has its own rate limit. Three are worded in turns
and must be re-expressed, not gated:

| Perk | Turn wording | Real-time expression |
|---|---|---|
| Lightning King | "two turns every round" | An attack-speed multiplier (halve the basic interval), not an extra action |
| Momentum | "each consecutive attacking turn" | Consecutive basic attacks, with the stack decaying after ~3 s without one |
| Sniper | "one extra ranger-skill use" | One charge: a second use of a ranger active before its cooldown starts |

**Tier changes effect size, not cooldown.** Basic → Intermediate → Advanced raises
power, status strength, targets hit and duration; the cooldown stays where the
table above puts it. Two reasons: the HUD's pips already communicate *stronger*
and would have to communicate *faster* as well, and letting tier cut cooldowns
compounds with gear (which floors skills to Intermediate for free) into a rotation
the balance pass never sees. One exception exists in the shipped data — Smoke
Bomb's tiers reduce its cooldown 3 / 2 / 0 turns — and the recommendation is to
override that in the Expedition table so the rule holds without exception (§16).

### 7a.2 Auto-cast

The demo stays completable without tapping (§7). A hero left alone must show the
whole kit, not just swing.

The rule: **every active auto-casts the moment its cooldown is up and its
condition is satisfiable**, in a fixed priority order — the hero's `autoOrder`,
which already exists. Priority is by tier, longest first: Ultimate → Heavy →
Light → basic attack. A skill whose targeting can't resolve (Finisher with nobody
under the threshold, Cleave with one enemy left) is skipped without consuming its
cooldown, and the next one down is tried.

**Tapping re-orders and times; it never unlocks.** A tap moves that skill to the
front of the queue for its next legal window — the same one-request model already
in `encounter.js`, which revalidates at the moment it fires. Tapping a skill on
cooldown shows the remaining time (the HUD already does this) rather than queuing
it, so a mis-tap costs nothing. The player's advantage is *when*, not *whether*:
holding Finisher for the boss instead of spending it on a wolf, dropping God Aura
before the Alpha's enrage rather than after.

One consequence worth stating: with auto-cast at full priority an untapped run
uses more of the kit than the old turn-based auto policy did, so the no-tap win
rates in §13 will rise. The floors in the sim should rise with them, or they stop
proving anything.

### 7a.3 Enemy AI

Each enemy gets a weighted priority list. An entry is a **condition**, a
**cooldown** and a **weight**. Every tick the enemy collects entries whose
condition holds and whose cooldown is ready, then picks among them by weight — so
behaviour is condition-driven with a little variety on top, never a coin flip and
never a spam loop. Basic attack is always the last entry, which is what an enemy
does when nothing else is available.

| Enemy | Entry | Condition | Cooldown | Weight |
|---|---|---|---|---|
| Dire wolf | Pack Snap | target has fewer than 3 bleed stacks | 6 s | 3 |
| | basic | — | interval | 1 |
| Cave boar | Tusk Gore | target is not already pulled/bleeding | 7 s | 3 |
| | basic | — | interval | 1 |
| Thorn lurker | Thorn Lash | target not poisoned | 6 s | 4 |
| | Thorn Lash | any target | 6 s | 1 |
| | basic | — | interval | 1 |
| Bandit | Scout's Cut | target below 60% hp | 6 s | 3 |
| | Scout's Cut | any target | 6 s | 1 |
| | basic | — | interval | 1 |
| Cutthroat | Venom Fang | target carries no poison | 5 s | 4 |
| | Venom Fang | any target | 5 s | 2 |
| | basic | — | interval | 1 |
| Hedge mage | Frost Touch | the party's fastest living member is not frozen | 9 s | 3 |
| | Aimed Cantrip | any target | 5 s | 2 |
| | basic | — | interval | 1 |
| Town watch | Taunt | no mark from this unit is active | 10 s | 4 |
| | Sunder | target not yet sundered | 7 s | 3 |
| | basic | — | interval | 1 |
| Storm bailiff | Spark | target not shocked | 5 s | 4 |
| | Spark | any target | 5 s | 2 |
| | basic | — | interval | 1 |
| Alpha | Cleave | two or more heroes alive | 8 s | 3 |
| | Pack Snap | target below 50% hp | 6 s | 3 |
| | basic | — | interval | 1 |
| Bandit Chief | Smoke Bomb | self below 50% hp, once per phase | 14 s | 4 |
| | Scout's Cut | target below 60% hp | 6 s | 3 |
| | basic | — | interval | 1 |
| Watch Captain | Taunt | no mark from this unit is active | 10 s | 4 |
| | Sunder | target not yet sundered | 6 s | 3 |
| | basic | — | interval | 1 |
| Pass Tyrant | Cleave | two or more heroes alive | 5 s | 4 |
| | Pack Snap | any target | 4 s | 3 |
| | basic | — | interval | 2 |

The established behaviours survive: the watch sunders and taunts, the bailiff
throws lightning, the cutthroat poisons, the boar charges, the lurker roots.

**Phase two** (bosses at their `phase2At` threshold) multiplies that enemy's
cooldowns by 0.75 — the Alpha, the Chief and the Captain all get visibly more
aggressive without a second table. The Tyrant uses 0.7, because the pass is meant
to close.

### 7a.4 Balance consequences

**Damage per second replaces damage per turn.** An actor's threat is now
`atk × (1/interval) × ability uptime` rather than `atk` once per round. That
invalidates three things in the current numbers:

- **Every `statMult` in §5.** They were set so a fight ran 2–5 rounds. Rounds no
  longer exist; the same multipliers now produce whatever time-to-kill the
  intervals happen to give.
- **The beast/human balance.** Beasts sit at spd 14 and humans at spd 8. At equal
  atk the beasts now deal 75% more damage per second — a gap that did not exist
  when everyone acted once per round. The human contracts (camp, toll house) will
  read as easier than the beast ones unless their atk or hp is re-derived.
- **`BOSS_HIT_PCT = 0.04`** (the shim's solo-demo tuning). It is a percentage of
  max HP *per hit*, and hits are now frequent — it has silently become a
  per-second drain that scales with the boss's attack speed. Re-express it as a
  share of max HP per second and set it from that.

**The Pass Tyrant's ×6 / ×30 / ×5 must be re-derived.** Those numbers produced
0 wins in 40 runs under the old model, and that result no longer transfers: at
spd 14 with a 5 s Cleave the Tyrant would wipe the party in a few seconds. The
demo needs the *right kind* of loss — the player watches their kit work, gets a
phase-two escalation, and still goes down. Method:

1. Set the target: the pass should last **45–60 s** and end in a wipe.
2. Measure from the sim, not by hand: party effective DPS (all three, full kit,
   auto-cast) and party effective HP pool including heals and mitigation.
3. Solve `tyrant_hp` so party DPS × 60 s stays clearly under it — the party must
   never be able to finish it even with perfect tapping.
4. Solve `tyrant_dps` so party effective HP ÷ tyrant DPS lands near 50 s, then
   split that between basic attacks and the Cleave/Pack Snap entries above.
5. Verify: 0 wins in 40 seeded runs for each hero at full kit, **and** a median
   survival time of 45–60 s with no run under 30 s. A fast wipe is as much a
   failure as a win.

**What `test/expedition_sim.js` needs.** The suite currently steps turns and
asserts on `enc.st.round`; both go away. To keep proving what it claims:

- A **fixed-timestep clock** — 100 ms ticks driving cooldowns, attack intervals
  and status durations — so runs stay deterministic and seeded.
- **Assertions in seconds, not rounds.** Every existing round assertion becomes
  an elapsed-time assertion.
- **A time-to-clear band per fight** (proposal: 12–35 s). A win that takes three
  minutes is a balance failure that the current assertions would pass.
- **A kit-coverage assertion**: in a no-tap run, every active in the hero's kit
  fires at least once. This is what proves §7a.2 — that an untapped player still
  sees the whole kit.
- **An enemy-kit assertion**: every enemy with a kit uses at least one non-basic
  entry per fight. This is what proves §7a.3 and catches a condition that can
  never be satisfied.
- **The pass assertion gains a floor**: 0 wins in 40, and median survival in the
  45–60 s band.
- Raised no-tap win floors, per §7a.2.

---

## 8. Guidance

**Buy, fight, use it, move on — corrected 2026-09-21.** Hiro: *"the tutorial is
kinda broken, it starts after the 3 wolves are killed."* He was right, and the
cause was the economy rather than the guidance. The player began with no gold
and every skill locked, so the guided purchase — which ran after the payout —
could not happen until a fight had already been won, and the in-fight prompts
skip any skill the player does not own. The first fight was therefore played
with an empty kit, on autopilot, and the tutorial only began over the corpses.

Three changes put it in the intended order. The purse opens at 20 gold
(`X.economy.start`), enough for the first unlock. `guidePurchase()` moved from
the end of `victory()` to the start of `fight()`, so each road fight is preceded
by its purchase — Finisher first, then God Aura, then Counter Attack, each paid
for by the previous fight's payout. And the forward arrow holds on every
tutorial fight rather than only the first, so the beat repeats.

The road now reads: **buy Finisher → fight → the game holds the moment a wolf
drops to half health and points at the icon → tap it → arrow to the next area**,
then the same for the other two skills. `test/browser_restart_dev.js` asserts the
first guidance arrives with every enemy still alive and nothing paid out, that
the skill is owned before any payout, and that the fight's hold comes up while
enemies are still standing and one is at or under half.

All non-verbal, all skippable, never repeated once done. The mechanism is one
piece of code (`X.UI.gate`): four input blockers around a hole, a pulsing ring on
the hole, a drawn hand tapping toward it, and a ✕ to skip. The game does not
advance until that one thing is tapped.

It is used for: the first time *each* bought skill is ready (the game holds — no
step is taken — until it is tapped), the first purchase (icon, then the confirm
✓), a hold-to-read step on the first unlocked skill (a ring fills over the hold
time until the info box opens), the forward arrow, and — at the inn — the first
recruit. After three guided purchases the guide retires itself, and skipping once
turns it off for good. (Hiro, 2026-09-20: every guided tap pauses the game.)

**At the inn, as built.** A second mechanism, `X.UI.invite`, rings *every*
affordable recruit at once with the hand sweeping the row and no blockers; the
confirm chip is then a normal hold; Embark is only *pointed at* (`block: false`)
so a second recruit or a skill can still be bought first. This is the rule below
applied: the screen shows how to recruit and never whom.

**The rule the hero pick broke (found 2026-09-19; the screen is gone, the rule stays).** Guidance may
teach *how* to do a thing; it must never make a choice that belongs to the player.
The pick screen currently rings the middle card and taps the hand at it, which
reads as "choose the ranger" — Nyx is not a recommendation, and the screen should
not imply one. All three cards are live (there are no blockers there), so this is
purely a reading problem, and it is the only screen in the demo where the guidance
points at something optional.

The fix is to weight the three equally: every card pulses alike, and the hand
either sweeps the row or sits under the title rather than under one card. Nothing
else on this screen changes. Listed in §15.3.

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

## 9a. Rotating parties — shelved 2026-09-19 (see §18)

**Shelved with the party-application system (§18).** The redesign reaches the same
end by a different road: a growing roster of recruits, each with its own
personality ID, means more voices as the run goes on rather than different voices
each quest. The economics below still hold and are why the roster approach works —
sixty personalities, every one fully recorded — so this section is kept as the
reference for both.

**The original reasoning.** Every contract, the player applies for a party and may
be grouped with different people.

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

**Art standard, 2026-09-24:** [ART_STANDARD.md](ART_STANDARD.md) is now the
binding reference for new art. Its core rule: because Hiro is the only playable
character, non-interactive scenes (inn, travel) are painted with Hiro inside
them; fights keep separate sprites. It records how the inn and travel are built
today and what Astra delivers for new painted travel beats.

Unchanged from v0.5 and still binding. The painted illustration style is kept at
full fidelity. Animation is **frame-based**: Astra paints full key frames at plate
fidelity; Fable plays them as limited animation with holds, smears, ease curves,
camera and effects carrying the rest. **No rigs, cutouts or part-based puppets** —
tried on another project, rejected, not revisited.

Everything on screen today is placeholder: busts composed from the website's part
sheets, beast frames cut from `creatures_1.webp`, and code-drawn effects. The
choreography, contact timing and clip names are all real, so painted frames drop
into a running fight clip by clip.

### 10.1 Impact language

What sells a collision is split between the two owners, and neither half works
alone. *Dead Cells* is the proof that a very small number of frames can hit hard
when the effects layer carries the rest; *Hollow Knight* is the proof that the
opposite lever — anticipation and recovery, not frame count — is what sells
weight. We are using both, because our frame budget forces it.

**Astra owns the drawing:**

| Element | What it means in a frame |
|---|---|
| Exaggerated contact frame | On the frame of contact, the striking limb stretches along its path and the struck body squashes against it, **beyond anatomical correctness**, for 2–3 frames. This is the *Skullgirls* rule: the distortion is the impact. A correctly proportioned contact frame reads as a near miss. |
| Wind-up carries the weight | The pose before the strike tells the player how hard it will land. A heavy attack winds up further and holds longer; a light one barely coils. Weight is decided here, not at contact. |
| Recovery overshoots and settles | The limb passes its resting position, then comes back. Two frames: overshoot, settle. Without the overshoot the attack stops rather than finishes. |
| Trailing elements | Hair, cloth, straps, fur and quiver cords are drawn **1–2 frames behind the main pose**, and on the contact frame they swing *opposite* the body's direction. This is the single strongest readability cue we have, and it costs nothing but attention — again *Skullgirls*, which is the benchmark for it. |

**Fable owns the code:** hit-stop (the freeze at contact), impact flash, screen
shake, and knockback drift. These are multipliers on the drawing. They cannot
rescue a flat contact frame, and they will wreck a good one if they are set too
high.

**The parameter table.** Those four code values ship as a per-clip table,
`X.impact`, beside `X.timing` in `js/expedition/data.js`, read by the beats layer
(`js/expedition/beats.js`) that sits between the simulation and the actor layer
(`X.Actor`). Today the same values are scattered as literals in `beats.js` — a
global 70 ms hit-stop, a `shake: 0.004` here, a `hitStop: true` there — and
consolidating them is part of the port.

| Parameter | Unit | Who sets the number |
|---|---|---|
| `hitStop` | ms frozen at contact | Astra, at clip greenlight |
| `flash` | overlay alpha and colour | Astra |
| `shake` | camera amplitude | Astra |
| `drift` | knockback distance and ease | Astra |

**Values stay minimal until painted frames exist.** Fable ships conservative
defaults so the placeholder build is legible, and Astra replaces them clip by
clip as the art lands. The rule behind it: **code never invents feel ahead of the
art.** A hit-stop tuned against a placeholder rectangle is a number that will have
to be thrown away, and worse, it trains everyone's eye on the wrong timing.

### 10.2 Finishing moves

**Current rule, round 3 (2026-09-20):** a finishing move plays only when the
player spent the Finisher on the kill (§7). Any other lethal blow — Katana
Slash, a counter, a riposte, an ally, a bleed-out — is an ordinary death. The
enemy must also be under the Finisher's window: 50 % for a normal enemy, 25 %
for a boss. The last-enemy-only restriction and the 1.8-second target below are
historical. Runtime slow motion lengthens the older clips; review final pacing
after v2 intake. Pair eligibility must match the actual painted victim identity, not
merely a broad silhouette class: do not show a wolf in place of a boar, tinted
wolf or plant. The new source delivery provides three wolf and three plant
finishers, each six frames (§10.5).

**Structural rule: a finisher is one clip containing both figures, choreographed
together.** Never two clips played side by side and hoped into alignment. This is
the *Assassin's Creed* lesson — structural only, nothing about the look — that
paired animation is the only way contact lands where the drawing says it does.
Two separately drawn figures will always read as two figures near each other.

**Minimum ask per finisher: three paired frames.**

| Frame | Contains |
|---|---|
| Wind-up | Both figures. Hero committing, victim already reacting to what is coming. |
| Contact | Both figures, distorted per §10.1. The frame the whole clip exists for. |
| Aftermath | Both figures. Hero's follow-through, victim falling or dissolving. |

**Pacing, on the *Hades* template.** A cinematic kill is not a fast clip; it is a
slow one with a fast frame in the middle.

| Beat | Time | What happens |
|---|---|---|
| Trigger cue | ~150 ms | The game has decided. A tell — desaturation, a held note — so the player knows before it starts. |
| Camera push | ~250 ms | Zoom in, ease out, background drops back. |
| Wind-up | ~500 ms | Held on the wind-up frame. This is the anticipation; it is deliberately slower than any other beat in the game. |
| Snap | ~80 ms + 140 ms hit-stop | Contact frame at full speed, then frozen. Double the ordinary hit-stop. Flash and heavy shake here only. |
| Aftermath | ~700 ms | Held on the aftermath frame, camera drifting back, victim resolving into the stylized defeat light. |

About **1.8 seconds** of screen time. That is why finishers are gated to the last
enemy of a wave rather than every execute — three of them in one fight would eat a
third of it.

**Who gets one, and what is shared.** A paired frame contains the hero, so a
finisher set belongs to a hero-and-silhouette pair, not to an enemy. Four
silhouette classes cover the whole slice:

| Class | Covers | Paired sets |
|---|---|---|
| Quadruped | dire wolf, cave boar (and their level-2 variants) | 1 |
| Plant | thorn lurker — rooted, no lunge, its own shape | 1 |
| Human | every bandit, cutthroat, hedge mage, watchman, bailiff and rival | 1 |
| Boss quadruped | Alpha, boar boss, at boss scale | 1 |

Four sets × three frames = **12 paired frames per hero**. The Bandit Chief and
Watch Captain reuse the human set scaled up. The Pass Tyrant needs none — it
cannot be killed.

Only the greenlit hero needs them, so the slice's real cost is 12 frames.
**In §15.2 this sits at position 3**, after the hero's own clip set (which it
depends on) and the beast clips (which make the majority of fights legible), and
ahead of the shared human set — because it is the single clip most likely to
carry the store video, and twelve frames is cheap for that.

### 10.2a Intake, as built (2026-09-19)

**Superseded implementation notes:** the current player uses authored canvas
pivots and registered standing heights, honors individual frame durations, and
settles its playback promise after recovery rather than at release. Paired
rendering is present and guarded; missing painted variants use safe painted
fallbacks rather than distorting an entire sprite. The following paragraph
records the earlier nine-clip intake and is not the current renderer contract.

`tools/art_intake.py` reads Astra's `manifest.json`, keys each cell by flood-filling
the border gray (soft fringe on the boundary), trims per frame, and registers every
frame to **one hero canvas** — x anchor at the centroid of the figure's lower third
(the feet, not the sword), y anchor at the lowest opaque row, bottom-centre pivot —
so origin (0.5, 1) holds across clips. It packs a WebP atlas capped at 2048 × 4096
(the mobile texture limit) with a Phaser JSON-hash atlas carrying `clips`:
zero-based contact and release, per-frame ms from `durationMsDraft`, loop policy,
and the impact draft untouched. The Actor is Sprite-backed when a sheet is given:
idle loops; `onContact` fires at the first contact frame (frame 0 included),
`onHit(k)` at later ones; the promise resolves at the release frame while the
frames run out; drift comes from `X.impact[clip]`. `X.clipFor` maps the
director's names (`slash` → `slash-l1`…) and anything a sheet lacks falls back to
the placeholder motion, so partial deliveries play. Nine clips are in; the paired
clips wait on the renderer in §10.2. Review findings on the result are in §19.

### 10.3 Character design brief

The slice is rated **PEGI 12** (§14). The target inside that is *appealing and
distinctive*, not neutral — the reference for both at once is *Skullgirls*, which
is expressive and stylish and still sits at a T rating, because its appeal comes
from draughtsmanship rather than from exposure.

**What carries appeal:**

- Athletic, defined figures — muscle and posture that say what the character does.
- A silhouette readable in solid black at thumbnail size.
- A clear **line of action**: an S-curve running through the spine, never a
  straight vertical.
- **Counterpose** — shoulders rotated against the hips, weight on one leg.
- A confident stance. Chin level, spine long, shoulders open.
- Hair and cloth caught in motion, mid-settle rather than at rest.
- Fitted clothing that shows the figure through *shape* — cut, drape and seam
  lines doing the work.

**Coverage that is fine at this rating:** bare arms, shoulders, midriff, thighs,
back. None of these is a rating problem on its own.

**What pushes past it:** a camera angled up at the figure, or the figure angled
toward the lens at hips or chest; clothing that reads as underwear or swimwear
rather than as an outfit; framing centred on chest or hips; a pose that presents
rather than stands. **Rating pressure comes from framing and intent far more than
from coverage** — a character in a full coat can breach it and a character in
hunting leathers and bare arms can sit comfortably inside it.

**Standing camera rule for character art: eye-level, three-quarter view, full
body.** No low angles, no crops at the waist, no limbs or weapons cut by the
frame edge. This is also what the composition pipeline needs, so it is not purely
an editorial rule.

**Worked example — Nyx, the Poacher.** The brief applied, as the template for the
rest of the cast:

> Full-body character sheet, eye-level camera, three-quarter view, standing at
> rest. Nyx, a poacher in her twenties: athletic and wiry, defined rather than
> heavy. Deep brown skin; locs to the shoulder with gold beads, a few swept
> across one eye. Line of action — a soft S-curve through the spine, weight on
> the back foot, shoulders rotated against the hips. One hand rests on a quiver
> strap, the other hangs loose near a poison-stained knife at her belt. Fitted
> green hunting leathers with a fur-trimmed collar, cropped at the midriff; bare
> arms, wrapped forearms, tall boots. Straps and hair caught mid-settle, as if
> she has just stopped walking. Confident, unbothered expression, chin level,
> looking at the viewer. Painted illustration in the same hand and lighting as
> the existing Adventurer plates. Flat neutral background. No crop of limbs or
> weapon.
>
> Avoid: camera below eye level; hips or chest angled toward the lens; clothing
> that reads as swimwear or underwear; a pose that presents rather than stands.

Every other character prompt keeps that skeleton — camera, build, line of action,
counterpose, what the hands are doing, the outfit by cut, what is in motion, the
expression, then the medium and the negatives.

### 10.4 Delivery status — `astra-v1`, 2026-09-19

The first painted delivery landed in `assets/expedition/astra-v1/`: **101 files,
194 MB**, covering essentially every line of §15.2 at once. It is **source art,
not runtime art** — the manifest states it plainly (`"status":
"source-art-delivery-not-runtime-animation"`, every clip `intake-pending`,
`greenlit: false`). Nothing in the code references the folder, so the build still
runs entirely on placeholders.

| Folder | Contents |
|---|---|
| `heroes/hiro/` | 23 clips, **128 frames**, plus `manifest.json` — idle, walk, draw, short draw, slash L1–L3, roll, victory sheath, kneel, aura L1–L3, bite-leg and bite-arm paired, finisher L1–L3 paired, intercept, riposte, hit short, counter L2–L3 |
| `heroes/bram/` | 31 files — the same clip vocabulary, plus all four finisher classes (quadruped, plant, human, boss) per §10.2 |
| `beasts/` | 28 files — wolf (full set), boar, thorn lurker, Alpha (stalk, pounce, enrage, hit heavy, down fade) |
| `humans/` | 5 source sheets — bandit approach, slash, cast, hit, down: the shared human set |
| `backgrounds/` | Bandit camp and toll-house alley, **already exported to `.webp`** (~600 KB each) |
| `icons/` | 4 source sheets — Hiro tiers, Bram, Nyx, Sable |
| `effects/` | 1 combined source sheet |

**The manifest is the good news.** `heroes/hiro/manifest.json` carries per clip:
frame count, sheet grid (columns × rows), **zero-based contact and release
frames**, the paired flag, a draft duration, and an `impactDraft` block holding
`hitStopMs`, `flash`, `shakeAmplitude` and `drift` with `greenlit: false` — the
§10.1 parameter table, pre-populated and explicitly marked provisional. Intake can
be driven from this file rather than from eyeballing sheets.

**What is not done.** The frames are on an opaque neutral gray with no alpha
extracted, untrimmed, unregistered to a pivot or ground line, and unpacked. That
is the intake pipeline (§15.3), which §10 said should exist *before* the first
clip set landed. It did not, and the clips landed.

**Two consequences for the size budget (§14).** The masters are inside the folder
that deploys — 26 MB became 221 MB — so the source tree needs to move out or be
excluded before any build is measured. And the frames are painted at 768 × 512
(or 384 × 512) while the hero renders about 330 px tall; halving the long edge on
intake costs nothing visible and roughly quarters the packed result. Even so, 128
frames for Hiro alone, against a 20 MB target, makes the packing strategy — atlas
layout, WebP quality, trim tightness — the thing that decides whether the slice
ships.

**Drop-in today:** the two backgrounds. They are already `.webp` at the right
size and need no pipeline.


---

### 10.5 What has no painted art (the list the no-placeholder rule points at)

**Status, 2026-09-21 (audited).** The validated source catalogue now includes
the tutorial Alpha alongside the approved wolf and plant sets. Runtime carries
six intaken atlases (Hiro, Bram, wolf, boar, plant, alpha). Candidate paintings
exist for the boar, an Ironback boss, the Marsh Alpha, the Ruins Alpha, raiders
and the town watch, but those folders carry no authoritative manifest yet, so
they are **not ready for intake** and the quests that would need them stay shut
(§5). The road's third fight is now a real boss: `road_wolf_leader` uses the
Alpha atlas, `boss: true`, `artActor: alpha`, `artIdentity: tutorial-alpha`, and
its own idle, approach, attack, hit, enrage, down and three paired Hiro
finishers.

Updated 2026-09-20. Distinguish assets already playing from new source awaiting
intake. The selected v2 masters live in the sibling
`../adventurer-expeditions-source-art/astra-v2/`, outside the ship set. See the
[final delivery and repair report](ART_PASS_2_AND_REPAIR_20260920.md).

| Thing | Status | Where it shows |
|---|---|---|
| Hiro — v1 ordinary combat/movement set, higher tiers, aura, counter, intercept, riposte | **Painted and integrated**; frame timing, scale and recovery safeguards restored | battle and travel |
| Hiro — v1 paired wolf finishers and bites | **Integrated**; exact art identity, resolved lethal outcome, approach, hidden-target retirement and interruption restoration guarded | battle; every resolved kill may finish, not just the last enemy |
| Hiro — v2 paired finishers | **Integrated:64 frames** — wolf12/6/6, plant8/6/6 and Alpha8/6/6 | enemy identity and skill tier; lethal outcomes only |
| Hiro — replacement walk and sheathed idle | **Integrated** — run16 frames, sheathed idle4 | travel/approach and victory rest |
| Hiro — inn and road figure | **Painted runtime figures restored**, no old head/body plate assembly | inn and travel; seated inn paintings are integrated |
| Bram — full painted set | **Integrated**; legacy ownership/save readiness requires the supported art set | only supported recruit; new purchases remain locked in this first-level pass |
| Nyx, Sable, Aera, Ren — clip sets | **Not painted** | not purchasable until they are |
| Ordinary wolf and thorn lurker | **Integrated: 13 clips / 55 frames** reused from v1; no new ordinary-beast painting needed | current tutorial; Alpha is a separate boss identity |
| Tutorial Alpha | **Integrated: 9 clips / 45 frames**, including three paired Hiro finishers | road fight 3 boss |
| Boar, later Alpha variants, human foes and other recruits | Historical assets/data retained, **outside current slice** | locked broader-quest roadmap; not substituted into the tutorial |
| Four new Hiro skill icons | **Integrated** | three manual buttons and automatic-slash portrait badge |
| Inn vignettes | **Integrated** — solo Hiro and Hiro+Bram base paintings, plus candle, steam and hearth effects (4 frames each) | quiet menu regions retained; new art is now the live inn |
| General v1 effect textures | Source retained; no new runtime adoption claimed in this pass | current code-side VFX remains |
| Plates and panoramas | Website art, graded to night + weather | all scenes — accepted, not placeholder |

---

## 11. Audio

**Three music tracks** (§5.1), the shared SFX set, and the recruits' recorded
voice. No new recording is planned; §9 explains why none should be needed.

Music is the largest single audio cost and the easiest knob. The source masters
are 112 kbps stereo; the build re-encodes (`tools/shrink_audio.sh`). At 48 kbps
mono a ~190-second track is about 1.1 MB, so three tracks are ~3.4 MB and each
extra track costs ~1.1 MB. The sync script treats `audio/music/*` as copy-once so
a re-sync cannot restore the masters.

Voice is per personality: the demo uses 18 bands, about 1 MB per character at the
source 128 kbps mono and half that re-encoded. A five-recruit roster with Hiro
therefore costs roughly 3 MB of voice at 64 kbps — the number to hold against
§12a.

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

## 12a. The size gate

The build must fit a mobile budget, and "watch the folder" stopped working the
moment 194 MB of art masters landed inside it (§10.4). Three mechanisms, and the
third is the one that actually holds.

**Masters leave the deploy folder.** `assets/expedition/astra-v1/` moves to a
sibling directory that is never deployed. Source art is not build input; only
intake output is.

**A ship manifest.** An explicit allowlist of what goes into a build. This inverts
today's model, where everything in the folder ships by default and bloat arrives
silently. Anything not named does not ship.

**`tools/size_check.js`.** Reads the manifest, measures, and exits non-zero over
budget. It runs beside the tests, so it fails the first time someone adds a 2 MB
sheet rather than at submission.

### 12a.0 What CrazyGames actually measures (corrected 2026-09-22)

From CrazyGames' technical requirements
(<https://docs.crazygames.com/requirements/technical/>, read 2026-09-22):

| Rule | Limit |
|---|---|
| Initial download, to be accepted | 50 MB or less |
| Initial download, to be eligible for the mobile homepage | 20 MB or less |
| Whole game | 250 MB and 1,500 files at most |

With the SDK integrated — it is, through `js/ui/portal.js` — the initial
download is measured from the start of loading to the first `gameplayStart`
event, and anything loaded after that does not count. Without the SDK, the whole
game counts.

**What this corrects.** This document and `tools/size_check.js` have treated
20 MB as a cap on the whole package, so the 20.77 MB total read as a blocking
overage. It is not. The 20 MB applies to what arrives before the first fight,
measured at 9.69 MB on 2026-09-21 (§12a.3). The whole-game total is still worth
watching as housekeeping and for load time, but it is not a submission rule. The
§12a.1 budget table below is therefore a planning split, not a limit.

**What has to change (not built).**
1. Re-measure the initial download against the current build: everything
   requested before `gameplayStart`, with all four levels open.
2. `size_check` reports two numbers — initial download against 20 MB, whole
   game against 250 MB and 1,500 files — and `release:check` gates on the first.
3. Confirm `gameplayStart` fires at the honest moment, when the first fight is
   playable (§15.3 item 4).
4. Anything the first fight does not need loads after `gameplayStart` (§12a.3,
   §12c).

**What still counts against the 20 MB** is everything the first fight needs:
Phaser and the scripts, Hiro's whole atlas unless it is split, the tutorial
road's creatures unless the later waves stream, the road's plates, the battle
track and the sound effects. So **extra Hiro frames for smoother animation cost
initial download directly**; new enemies and locations do not, provided they
stream.

### 12a.1 The budget

| Category | Budget | Notes |
|---|---|---|
| Phaser + code | 4.0 MB | `js/data` trimmed to what the demo references (~1.5 MB recoverable) |
| Hiro painted frames | 2.5 MB | 128 frames, long edge halved at intake, WebP |
| Recruit frames | 1.5 MB | ~6 clips each; the §3 saving |
| Beasts + humans | 2.0 MB | |
| Busts + plates | 3.0 MB | see below |
| Music | 3.5 MB | 3 tracks at 48 kbps mono |
| SFX | 1.0 MB | |
| Voice | 2.5 MB | 18 bands per character at 64 kbps mono |
| **Total** | **20.0 MB** | |

### 12a.1a Where it landed (build of 2026-09-19)

**Current measurement, 2026-09-21 (re-measured after Alpha intake and WebP
retune).** The ship set is **19,910,649 bytes / 210 files — 89,351 bytes under
the 20,000,000-byte gate**. Packaged with gzip it is smaller still, but the gate
measures served bytes and this strict reading is the one we hold. The Alpha
atlas intake is 45 frames across two WebP pages; quality was lowered only enough
to clear the gate while preserving the painted runtime set. The two earlier trim
candidates — the `js/data` subset and Bram's locked 2.26 MB atlas — remain
available if later content needs more headroom. Browser cold-start and actual
portal/mobile-device behavior still need a final measurement.

Browser cold start was **11,931,986 bytes**, or **12,976,946 after audio
unlock**, in the desktop/mobile checks (measured before the Alpha intake). These are distinct measurements: package bytes are not initial network
bytes. New v2 masters are excluded and must be remeasured after intake. Actual
portal/mobile-device behavior is still unverified. The following 16.97 MB result
is retained as the September 19 historical baseline.

`node tools/size_check.js` → **16.97 MB of 20.0**, ship set 248 files: shared art
5.3, music 3.2, js 2.7, voice 2.0, expedition art 1.9 (Hiro's nine clips 1.29 +
twelve baked busts 0.6), lib 1.1, sfx 1.0. Every row of the plan above was taken
except `js/data` trimming. Against the budget table: Hiro's frames are on course
(nine of 23 clips = 1.29 MB at 400 px standing height; the full set at that height
would land near 3 MB, so either the remaining clips go in at ~340 px or the
1.5 MB `js/data` trim pays for them); busts came in far under (0.6 MB for twelve,
not 1 MB for eight) because the human foes were baked too; voice is under because
only the loop's eleven bands ship. `npm run test:ship` serves nothing outside the
manifest, so a stray request for a part sheet fails the run rather than the
player's load.

### 12a.2 Where the 26 MB of v0.8 went, and what the plan deleted

| | Now | After |
|---|---|---|
| `assets/anime` | 12.0 MB | **~3 MB** |
| `audio/music` | 6.0 MB | 3.5 MB |
| `js` | 2.9 MB | ~1.5 MB |
| `audio/vo` | 2.1 MB | 2.5 MB (more characters, half the bitrate) |
| `audio/sfx` | 1.2 MB | 1.0 MB |
| `lib` | 1.2 MB | 1.2 MB |

**The biggest single win is a consequence of the redesign, not a compression
trick.** 4.4 MB of the art budget is head, wardrobe and headgear part sheets that
exist only to compose arbitrary characters at runtime. With a fixed cast — Hiro
plus five named recruits plus a known enemy list — every bust can be **baked to a
single WebP** at roughly 120 KB. Eight baked busts are about 1 MB. Cutting the
blacksmith is what makes this legal: gear sets were the reason busts had to be
composed on the fly.

### 12a.3 Load phasing

CrazyGames measures time to gameplay, not total size. Ship a first bundle of about
6 MB — Hiro's frames, the wolf set, the tutorial's plates, one track — and stream
the rest during the inn. That makes the 10-second target comfortable at any total
inside the budget, and it means `gameplayStart` can be sent honestly.

**Measured, 2026-09-21 — this is now the largest submission risk.** Throttled
cold starts against the exact ship allowlist, phone viewport, first fight on
screen:

| Connection | Before round 3 | After deferring Bram | Bytes |
|---|---|---|---|
| Fast 4G (9 Mbps, 85 ms) | 12.2 s | **10.1 s** | 9.69 MB |
| Slow 4G (4 Mbps, 150 ms) | 26.0 s | **21.6 s** | 9.69 MB |
| 3G (1.6 Mbps, 300 ms) | did not arrive inside 60 s | **53.0 s** | 9.69 MB |
| Unthrottled (the number quoted until now) | 1.0–1.2 s | 1.0–1.2 s | 13.77 MB |

The unthrottled figure is the one previous reports quoted; it says nothing about
a real player. What must arrive before the first fight is **9.69 MB**: expedition
art 5.73, js 2.35, Phaser 1.14, plates 0.47. Deferring Bram (2.2 MB, and he
cannot be in the party while hiring is locked) was the first cut and is done.
The two that remain, in order of value: **trim `js/data`** to what the demo
actually references (~1.5 MB; the sync copies the whole folder today), and
**split Hiro's atlas** so the first fight loads only the clips it uses — idle,
walk, draw, slash, hit, roll — with finishers, auras and counters streamed during
the first travel beat (~2 MB). Together those put the critical path near 6 MB,
which is the bundle this section always assumed. Until then the 10-second target
holds only on a fast connection.

---

## 12b. Modules — flagging content in and out of the build (spec, 2026-09-21)

*Design only; nothing below is built. Hiro's ask: "are we able to flag portions
of the game for back up and removal to easily remove from the game and re add
to the game, sorta like modules, so we can tweak the size easily?" The answer is
yes, and three of the four pieces already exist.*

**What exists.** `tools/ship_manifest.json` and `tools/size_check.js` decide what
is in the package. `npm run test:ship` serves only that set, so anything cut but
still referenced 404s during the tests instead of in front of a player.
`P.needed()` in `painted.js` is already a single chokepoint deciding which actor
atlases get queued — it is how Bram's 2.26 MB stays off the critical path, and
the Alpha was added to it the same way. Placeholder choreography is already the
fallback for any clip a sheet lacks. What is missing is one source of truth
joining those three, and one safety rule.

**The safety rule, which is the reason to build this deliberately.** Phaser's
loader parks a scene in `preload` until every queued file arrives. A file absent
from the package does not degrade gracefully — it hangs the game on a black
screen before `create()` runs. So the build must never *discover* that a module
is missing; it has to be told in advance. A generated flag file, read at the
queue points, is the mechanism. 404-tolerance is the backstop, never the plan.

**The design.**

1. `tools/modules.json` is the single source of truth. Each module carries an
   id, a label, the files and folders it owns, `core: true` for anything that can
   never come out, `requires` for dependencies (a recruit needs his baked bust),
   and one line of plain English naming what the player loses without it. Sizes
   are computed from disk, never hand-entered, so the file cannot lie.
2. `npm run build:preset <name>` writes a generated `js/expedition/build.js`
   declaring which modules are present. That generated file is the only thing
   runtime code consults — no probing, no try/catch around a load.
3. `size_check.js` reads the same manifest, applies the active preset, and prints
   per-module megabytes with what each toggle buys, so the trade is visible
   before it is made.
4. Runtime gates sit at the chokepoints that already exist: `P.needed()` for art,
   the inn's buy path (a recruit whose module is out reads "not in this build"
   rather than presenting a dead button), and the music picker falling back to an
   included track.
5. `release:check` prints the active preset, the total and what is off, so a
   package cannot be submitted without its contents being stated.

**Nothing is deleted.** A module being off is a flag; the files stay in the
folder and in git, and re-adding is one command. That is what makes the lever
safe to pull repeatedly — and it is required anyway, since the sandbox that
edits this folder cannot delete files in it.

**The one new hazard is saves.** A save naming a module that is now out — Bram
in the roster — must drop him with a note rather than crash. That is the failure
a player would actually hit after a preset changes between builds, so it gets a
test of its own.

**Tests to hold it.** Per preset: boot headless, play a fight, reach the inn,
assert zero 404s and zero missing-texture warnings. Plus a contract test that
every file in an on-module exists and nothing references an off-module.

**Starting modules, with measured weights (2026-09-21).** `core` (index, `js`,
Phaser, HUD, Hiro's atlas, wolf, plant, the road's plates, sfx) is never
removable. Then `bram` 2.26 MB, `alpha` 2.31 MB, `music` as full-versus-single
-battle-track (~1.0 MB swing), `voice` 0.33 MB, and the `js/data` trim (1.37 MB
in the ship set, of which `voice_manifest.js` alone is 0.42 MB) as a build step
on the same lever. Roughly 7 MB of adjustable weight.

**What this does not do.** Bram and the Alpha cost within 0.05 MB of each other,
so the system makes that choice one command instead of a manifest edit — it does
not manufacture space. The overage still has to be paid by a real cut.
*(2026-09-22: the whole-game overage is not a submission rule — see §12a.0.
Modules remain the mechanism for content packs, §12c.)*

---

## 12c. Content packs and the update roadmap (plan, 2026-09-22)

*Plan only; nothing below is built.* Hiro, 2026-09-22: *"so instead of new game,
we make new updates and we keep adding heroes and locations?"* Yes. Version 1
ships; the game then grows through updates on the same CrazyGames listing, which
keeps its players, ratings and history, where a sequel would start from zero and
be reviewed again. A separate game still makes sense later for a different
premise, not just a new character.

**Version 1.** Hiro alone; the four open levels; wolf, thorn lurker and Alpha
plus two or three new enemy types; smoother animation. The tutorial road loads
before the first fight, and everything else streams after `gameplayStart`.

**A content pack** is a §12b module with a loading rule: one folder plus one
manifest entry, loaded after gameplay has started, so it never counts against the
20 MB initial download. Two kinds:

| Pack | Carries |
|---|---|
| Location | battle plates, travel road, the encounters, their music, any new enemies with Hiro's finishers against them |
| Hero | painted clip set, paired finishers against each enemy, bust, voice, kit and stats, inn art |

A hero pack is generic; nothing is built around Bram. The recruit and party code
already exists, locked, so a new hero unlocks and fills it rather than building
it.

**The cost that grows: finishing moves.** Every hero needs paired finishers
against every enemy, so painted work grows as heroes × enemies — three heroes and
eight enemies would be 24 paired sets for Astra. How to contain that is open
(§16.14).

**Streaming.** A player who reaches a pack before it has finished downloading
needs a short, honest loading beat, not a missing texture. The §12b contract test
(zero 404s, zero missing textures) applies to every pack.

**Bram as the test fixture.** His finished art proves a hero pack end to end —
loaded after start, shown at the inn, fighting, finishing — before the next
hero's art exists. He does not ship in version 1.

---

## 13. Testing

`test/expedition_sim.js` — 13 headless checks against the real engine: shim scope
(a website Hiro is provably untouched), determinism, no-tap completion, skill
request integrity, purchase integrity, every reachable build clearing the road,
banter bands following relationship tier, and **the loop**: the roster maths (the
road funds the first recruit), the quest cycle order, and every loop quest
winnable with two recruits at Intermediate — first clear ≥ 0.8, fourth clear
≥ 0.4 and never above the first. Measured: rain 1.00 / 0.97, city 1.00 / 0.57,
marsh 1.00 / 1.00, ruins 1.00 / 0.90. `npm test` runs the size gate after it.

`test/browser_expedition.js` — Playwright plays like a beginner: taps whatever the
hand points at, glowing icons, chips and the arrow; at the inn buys a recruit when
it can afford one, levels a skill otherwise, then embarks; takes *Again* on a
defeat card. Passes when the tutorial plus one full cycle of the four loop quests
(five clears) returns to the inn with at least one recruit bought and travel
dialogue seen, and on no page error. Flags: `--ship` (serve only the manifest),
`--at=inn --gold=N` (skip the road), `--clears=N`, `--width=375`, `PROBE=<regex>`
(print who requested a matching URL). Last full run: 17 inn visits, 20 dialogues,
3 recruits, 0 defeats, 0 errors.

`test/browser_art_review.js` — screenshots the first fight every N ms with the
painted sheet on or off (`--sheet=0`) for Astra's review (§10.1 greenlight).

`test/browser_restart_dev.js` (`npm run test:restart`) — the restart contract and
the developer's tools. Retires guidance the way play does, presses Start over in
the corner control, and asserts the run *and* the tutorial flags are blank in
memory and on disk and that the hand comes back on its own. Then: the cog is
there on a plain load, Shift+D hides and restores it, `?dev=0` hides it, and —
serving `dev.js` rewritten to `DEV_BUILD = false`, which is the shipping build —
nothing appears for the cog, the key or `?dev=1`. Last run: 12 passed, 0 failed.

`tools/bake_busts.js` and `tools/art_intake.py` are build steps, not tests, but
both fail loudly (a placeholder still pending, an atlas over 4096 px).

All pass as of 19 September — against the turn-based engine. §7a.4 lists what
the suite needs before it can prove the same claims in real time.

---

## 14. CrazyGames requirements and where the build stands

From the platform's quality guidance, FAQ and Basic Launch metrics:

| Requirement | Target | Now |
|---|---|---|
| Time to gameplay | Immediate; no title or creator screens | ✅ fights in the first seconds |
| Onboarding | Visual, skippable, no wall of text | ✅ hand and ring, always skippable |
| Initial download | 20 MB or less for the mobile homepage, 50 MB or less to be accepted; whole game 250 MB and 1,500 files (corrected 2026-09-22, §12a.0) | 9.69 MB before the first fight when last measured (2026-09-21); re-measure with all four levels open. Whole game 20.77 MB / 214 files |
| Load time | Under 10 s cold | Desktop/mobile browser byte checks and SDK-stub delayed-scenery check passed; actual portal timing unverified |
| Controls | Large targets, no hover-only info, no Esc / Ctrl+W | Desktop/mobile browser checks passed; physical phone QA remains |
| Art and audio | Consistent | Four painted runtime actors restored; v2 finishers, movement, inn and icons await intake and visual timing review (§10.5) |
| Rejection causes | Bugs, no English, clones, **content targeted at kids** | Addressed; see below |
| Conversion at 1 min | 80%+ | Unmeasured |
| Average play time | 10+ min historical planning target | Unmeasured; current scope is the first tutorial plus Replay, with the broader loop locked |
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

**Current reconciliation, 2026-09-22:** the status at the top of this document
is authoritative. Since the 2026-09-20 note below: all four levels are open in
order and the tutorial road is retired; creatures are limited to the reworked
wolf, plant and Alpha; finishers match by painted set; skills fire between turns
with clock-based recovery; turn pacing and the cinematic camera are pause-screen
settings; the dev panel is always present in a development build; Start over is
a true reload. The Finisher's boss-line bug (§7) was fixed the same day. Open:
re-measuring the initial download against the corrected size rule (§12a.0), and
status durations still in rounds. Direction for version 1 and after is §2 and
§12c.

**Reconciliation, 2026-09-20 (superseded):** §10.5 and
[ART_PASS_2_AND_REPAIR_20260920.md](ART_PASS_2_AND_REPAIR_20260920.md) supersede the
September 19 backlog below. The current code restores the four-actor loader,
Bram purchase/save readiness, authored frame timing, stable body scale and
pivots, recoil/recovery, paused animation, safe paired targets and nested
cinematic cleanup. Manual skills are retained; **finishing moves now play only
from a player-tapped Finisher** (2026-09-21, §7) — the every-kill behavior this
line used to describe is gone.
The first tutorial and inn Replay stay locked; the four-quest roadmap does not
reopen as part of this repair. New v2 art is delivered but not yet intaken.

### 15.1 Fable (Claude) — finished

- **The v0.8 loop, built (2026-09-19 build session; CHANGELOG has the detail).**
  Tutorial road → inn → recruit with gold → level Hiro's skills on the HUD →
  travel with banter → three fights with the panorama between → travel → inn →
  the next of four repeatable quests, enemies climbing +30 % per clear. Hero pick,
  trainer, blacksmith, applications and the grave are gone; `heroes.js` is
  unloaded, not deleted.
- The corner control (mute, pause, Start over with confirm) in every scene; the
  defeat card (Again / Back to the inn keeping the gold won).
- Guidance at the inn per §8: an invitation over every affordable recruit, a hold
  on the confirm, a pointer (not a hold) on Embark.
- Dialogue rotation persisted on the run; five recruits voiced for the loop's
  bands only.
- **Painted Hiro on screen.** `tools/art_intake.py` and the Sprite-backed Actor
  (§10.3): nine of Astra's clips keyed, registered, packed and playing with
  zero-based contact/release marks, per-frame durations and drift from the
  `X.impact` table. `?sheet=0` shows the old plates for comparison.
- **The size gate holds (§12a):** manifest + `tools/size_check.js` in `npm test`,
  `npm run test:ship` serving only the ship set, busts baked, audio re-encoded,
  masters out of the folder. (That session measured 16.97 MB of 20.0; the current
figure is in §12a.1a and the gate is failing as of 2026-09-21.)
- The encounter simulation, the director, the event → beat mapping, the actor
  layer and the placeholder choreography (kept as the fallback for any clip a
  sheet lacks).
- The HUD: portrait, active arc, tier pips, cooldown wedges, queued ring, fired
  streak, detail chips, refusal reasons, gold, nodes, payout, cards; inn mode.
- Isolation tooling, the sync script, the audio trim, both test suites, the
  change log and this document.

### 15.2 Astra — delivered as source, awaiting intake

**Final v2 source delivery, 2026-09-20:** six paired finishers / 36 frames,
selected eight-frame walk, four-frame sheathed idle, two high-resolution inn
baseplates with three transparent four-frame effect loops, and four Hiro skill
icons. These are selected source assets, not deployed animations. Ordinary wolf
and thorn-lurker coverage is reused and already runtime-ready (13 clips / 55
frames). The current remaining work is deliberate v2 intake, registration and
visual/impact timing approval, followed by the size and gameplay gates. The
older v1 inventory and requests below are preserved as history; the sheathed
idle and inn art are no longer missing source deliveries.

**The first delivery landed 2026-09-19** (`astra-v1`, 101 files, 194 MB —
inventory and manifest detail in §10.4). It covers every line of the previous
list, and over-delivers on the first: two heroes arrived rather than one.

| Was owed | Now |
|---|---|
| 1. The picked hero's clip set | **Delivered ×2** — Hiro (23 clips / 128 frames, with a manifest) and Bram |
| 2. Beast clips | **Delivered** — wolf, boar, thorn lurker, Alpha |
| 3. Finisher paired frames (§10.2) | **Delivered** — Bram carries all four silhouette classes; Hiro has three paired finisher tiers |
| 4. One human combat set | **Delivered** — bandit approach, slash, cast, hit, down |
| 5. Effect textures | **Delivered** — one combined source sheet |
| 6. Skill icons | **Delivered** — Hiro tiers, Bram, Nyx, Sable source sheets |
| 7. Backgrounds | **Delivered** — camp and toll-house alley, already `.webp` |

Everything is painted to the impact language in §10.1 and the manifest carries
the §10.1 parameter block per clip, pre-populated and marked `greenlit: false`.

**September 19 outstanding list (historical; current overrides above and §10.5):**

1. **The greenlight pass** — Astra setting each clip's real `hitStop`, `flash`,
   `shake` and `drift` numbers. This cannot start until intake produces registered
   playback to judge against, so it is gated on §15.3, not on her.
2. **Recruit clip sets — full sets, to Hiro's standard (§3, corrected)** for Nyx,
   Sable, Aera and Ren. Bram's delivered set is complete and is used whole. Until
   a recruit's set is delivered and intaken that recruit is not purchasable in
   the slice (§10.5).
2a. **Hiro's sheathed idle (found 2026-09-19).** `victory-sheath` ends with the
   katana sheathed, but the only idle is the drawn stance, so after the sheath
   he snaps back to a drawn sword. Needed: `idle-sheathed` (4 frames, the walk
   sheet's sheathed hip carry, same registration), used after a win, at the inn
   and on the road; the existing `draw` then bridges sheathed → drawn at the
   start of a fight, which is exactly what it was painted for.
3. **Nothing for environments.** Four quests come from plates already in the
   build, graded to night and given weather (§5). If any plate looks weak at night
   under storm, a graded variant is a touch-up, not a repaint.

**The concern from v0.6 is resolved in the wrong direction.** It warned that three
heroes plus humans plus rivals multiplied the art surface, and proposed one hero
and one shared human set as the mitigation. Two heroes were painted instead. That
is not a problem for the art, but it is 194 MB of masters against a 20 MB build
target, and it means the intake pipeline now has to prove itself on a backlog
rather than on a single clip. See §10.4.

### 15.3 Fable (Claude) — still to build

**Current priorities, 2026-09-20:** integrate the selected v2 sources without
discarding required v1 clips; review contact, loops and readability at runtime
size; rerun the package/network gates; complete physical-device and actual
CrazyGames-portal QA. Existing beast/Hiro/Bram runtime intake and the paired
renderer are already present. The next list is the September 19 backlog, retained
for context rather than an instruction to rebuild those completed pieces or
unlock additional quests.

Items 1–4, 6 and 7 of the previous list shipped on 2026-09-19 (§15.1). What
remains, in order:

**Should happen before submission:**

1. **The rest of the intake backlog (§10.3, §10.4).** *Superseded by the
   2026-09-21 audit in §10.5: Hiro's fourteen clips, the paired finishers and the
   paired-frame renderer all landed, and the road's Alpha boss was intaken on
   2026-09-21. What remains unintaken are the candidate paintings with no
   authoritative manifest — the boar, the Ironback, the Marsh and Ruins Alphas,
   the raiders and the town watch — which is why the quests needing them stay
   shut. The September 19 text follows.* Fourteen Hiro clips are
   still on disk only: slash-l2/l3, aura-l1..3, counter-l2/l3, intercept, riposte,
   the three paired finishers and the two paired bites. The unpaired ones are one
   command each (`tools/art_intake.py --clips …`); the paired ones need the
   paired-frame renderer (§10.2), which does not exist yet. Then Bram's full
   set, and the beasts. Budget: about 3 MB left, so ~1.5 MB of atlas at the
   current 400 px height, or lower the height; §16.13 decides who ships painted.
2. **The greenlight loop with Astra (§10.1).** `X.impact` carries her draft
   numbers unchanged and `greenlit: false`; `npm run art:review` gives her frames
   to judge against.
3. **Phone pass.** Layout, tap targets, a real device. `browser_expedition.js
   --width=375` exists; it has not been run to green.
4. **Load phasing and a cold-cache measurement** in the portal iframe, plus the
   `gameplayStart` call at the honest moment.
5. **Store media** from the build once the finisher plays painted (§10.2).
6. **Real-time combat port (§7a)** — only if §16.8 is decided in its favour.

**Nice to have, in order:**

7. Skill icons wired to Astra's art.
8. `js/data` trimmed to what the demo references (~1.5 MB recoverable; the
   sync copies the whole folder today).
9. A fourth music track for bosses (§5.1) if the budget allows.
10. The rival ambush back as one scripted beat (§6).
11. Retention instrumentation.

## 16. Open decisions for Hiro

**Arcade (2026-09-28).** The **Facebook page address** and **where feedback
goes** — a form, an email, or Facebook messages; the End scene footer and the
pause menu name them but carry no link yet. Whether the high-score board
should ever sync through the CrazyGames data API (version 1 is per device).
Whether a pack of bosses deserves a short intro beat (today they walk in like
any wave). End-scene background art (Astra; today a plain dark panel). The
score icon ★ is a placeholder for Astra (ART_STANDARD). The two balance knobs
(§5.0a) were set by simulation, not play — worth a look after the first real
runs, together with the Rest price.

**Astra v3 implementation assumptions (2026-09-26), subject to playtest:** city outbound/early travel uses the market vault; late/return travel uses the rooftop route. Swamp uses the log slide for its travel legs. Two new paired finishers alternate independently of skill level. Hag/orc use one enrage tell at half HP. Existing encounter IDs are preserved for save compatibility; their displayed creatures are replaced. These choices do not implement the separate planned economy/ending redesign.


*Round 3 answers (2026-09-21), from Hiro unless marked.* The Finisher's windows
are **50 % for a normal enemy, 25 % for a boss, flat at every level** — levelling
buys the heal and the hit (assumption: 50/25 was given without a per-level curve,
so flat; a three-line change if it should scale). **The Finisher has no cooldown
at all** (Hiro, 2026-09-21): the health window is the only gate. The slice opens
**Road in the Rain** and nothing else. Hiring stays locked; Bram is not wired.
Finishing moves play **only** from a tapped Finisher. Decided here, not by Hiro:
`js/ui/gate_ambience.js` is now synced (20 KB) because `travel_panorama.js` calls
its `attach()` for every panorama, gate or not — without it the travel scenes ran
with no ambience layer at all; and **Bram's 2 MB of art no longer loads while
recruiting is locked**, which took 2.2 MB off the critical path (§12a.3).*

*Build note, 2026-09-19: to keep moving, the build took a provisional answer on
the items below. Every one is a one-line change; none was decided.* `night1` stands in for Hunter's Breath (1); `battle_origin` is the
Origin slot (2); the loop repeats with +30 % per clear and no ending (4);
five recruits at 60/90/120/150/180, fielding two (5); Bram M05, Nyx F07, Sable
M11 (6); Start over is a true restart (7, decided 2026-09-21); the turn-based engine stays
(8); Hiro is the intake hero and Bram's set is used whole (9); the human
foes' busts are baked from the part sheets like the recruits' (new).

1. **Which file is "Hunter's Breath (zero dark thirty)" (§5.1)?** It is not in the
   game's music folder under that name. `night1` and `night2` are the closest by
   mood and both suit the night pair. Point at the file, or pick one of those.
2. **`battle_origin` or `origin1` for the Origin slot (§5.1)?** Assumed
   `battle_origin`, the battle arrangement, because one track covers a quest that
   is mostly fighting. `origin1` is the quieter theme if the travel beats matter
   more.
3. **Do bosses keep a track of their own (§5.1)?** Three tracks means they do not.
   A fourth costs about 1.0 MB at 48 kbps mono; 3.0 MB is spare today.
4. **What ends the loop?** Still unanswered, and it now matters more: with the
   grave gone there is no ending at all. Options: the loop simply repeats with
   rising difficulty; a fifth quest acts as a wall; or the demo caps at four
   quests and offers a summary. A CrazyGames demo wants a reason to stop as much
   as a reason to continue.
5. **Roster size and prices (§3, §4).** Five recruits at 60 / 90 / 120 g rising,
   fielding two, is the proposal. Fewer recruits means gold runs out of purpose by
   the third quest; more means more clip sets.
6. **Personality IDs for Bram, Nyx and Sable (§3).** They need distinct voiced
   sets or the roster's travel banter repeats — Aera and Ren already have theirs.
7. **Does Start over reset the tutorial (§7)?** ~~Assumed no~~ — **decided yes,
   2026-09-21 (Hiro): "it should be a true restart."** Start over is `Run.reset`
   and nothing more, so a restart is indistinguishable from a first launch. The
   assumption had been costing the one thing a restart is for — seeing the
   opening again.
8. **Real time — decided, or exploratory (§7a)?** The folder still runs the
   turn-based engine, and the §7a port is the largest item on §15.3.
9. **Which hero is canonical for intake (§10.4)?** Astra painted Hiro and Bram.
   Hiro is now permanent, so he is the obvious first target; Bram is the first
   recruit and his delivered set is used whole (§3, corrected 2026-09-19).
10. **Are finishers gated to the last enemy of a wave (§10.2)?** ~~Assumed yes~~
   — **superseded 2026-09-21.** They are not gated by position in the wave at
   all: a finishing move plays whenever a player-tapped Finisher is the killing
   blow, and never from an automatic kill. With the cooldown also gone, finishes
   can chain inside one wave.
11. **Do the human bosses reuse the human paired set scaled up (§10.2)?** Assumed
   yes.
12. **Does Astra own the impact numbers (§10.1)?** Assumed yes — Fable ships
   conservative defaults, Astra replaces them at greenlight.
13. **Which recruits ship painted in the slice (§3, §12a)?** Full sets cost about
   1.3 MB each at 400 px; with 3 MB spare today and Hiro's own fourteen clips
   still to land, the budget holds Hiro complete plus Bram, or Hiro complete plus
   two recruits at ~320 px, or more if `js/data` is trimmed and the height drops.
   The honest slice may be Hiro + Bram + one more; the rest appear at the bar
   once their art exists. Hiro to choose the order (Nyx is the worked example in
   §10.3 and the natural second). *Superseded 2026-09-22: no recruits in
   version 1 (§2); future heroes arrive as packs (§12c).*
14. **How are finishing moves contained as heroes and enemies grow (§12c)?**
   Every hero against every enemy is a paired set. Options: signature finishers
   only for chosen pairings, with a well-made generic finisher for the rest; or
   each new hero pairs only with the enemies released alongside it. Open.
15. **Which two or three new enemy types for version 1?** Open — Hiro to
   choose. *Decided 2026-09-24: §5.0.* Each needs its animated set and Hiro's paired finisher before it can
   be fielded.
16. **Who is the next hero?** Open — Hiro is designing one. Not Bram.
17. **Smoother animation: more frames, or better timing?** More Hiro frames count
   against the 20 MB initial download (§12a.0); retiming and easing cost
   nothing. Open — Hiro and Astra.
18. **Facebook page address and feedback destination for the menu (§5.0).**
   Open — Hiro.
19. **After the ending — replay, or back to the inn with all three locations
   open (§5.0)?** *Decided 2026-09-24: back to the inn, and replay.*
20. **Part 2 — an update to this listing (§12c) or a separate game in the same
   series?** *Decided 2026-09-24: an add-on to this game at a future date.*
21. **Confirm the proposed numbers in §7.0** — unlocks 20 / 35 / 50 gold, God
   Aura attack ×1.35. To tune in play.

---

## 17. Decisions

**2026-09-28 (balance knobs).** Fable, from `tools/balance_arcade.js`, flagged
for Hiro's review: boss packs share strength (`X.bossShare` 0.7 for two, 0.5
for three) and the first quest heals between its fights (`X.tutorialHeals`).
Reasons and numbers in §5.0a. Rest left as designed.

**2026-09-27 (arcade mode).** Hiro, from the reviewed plan. **Score replaces
gold**: regular 100, boss 500, Finisher kill +50, clean wave +50, quest clear
300, ×1.25 per extra playthrough. **All skills unlocked from the start, no
levels**; God Aura raises attack ×1.35 only. Tutorial order **Finisher →
Counter Attack → God Aura**. **Health carries through the run**; only the
Finisher heal and Rest restore it. **Rest** at the inn: full heal for 1,000
points, doubling each use, never at full health. **Defeat ends the run**; an
**End run** button sits in the pause menu behind one confirm. **Top-10 board**
stored on the device; **name required, blank by default, 25 characters,
name-shaped** (tyler#2, tyler12, tylertheman! in; 12345, 2838, @#$skfsal,
adfskdlsfosl, uislllslsl@#@11221 out). **The game always starts fresh.** From
the second playthrough monsters shuffle, enemies are ×1.3 stronger per
playthrough with no cap, and the boss wave can be two of the own boss, the own
boss plus one from another area, or from the third playthrough up to three
bosses (odds §5.0a). Defeat effects stay location-specific and play on any
monster. Hiro's unused L2/L3 clips ship as variety. After the ending, back to
the inn and replay; Part 2 is a future add-on to this game.

**2026-09-24 (version 1 content and skills).** Hiro. Version 1 is **forest,
swamp, city, then an ending** announcing Part 2 with a new protagonist, with
Facebook and feedback links in the game menu (§5.0). Swamp: serpent, beetle,
moss giant, hag boss, **melt into mud** on defeat. City: goblin, spider, orc
boss, **burn away in blue magical flame**. Forest keeps its sparkle. Every enemy
gets **at least two unique Hiro finishing moves**. The old ruins leaves version
1. **Skill levelling is removed**: each skill is unlocked once, each unlock
costing moderately more. **God Aura raises attack, not defense**; Counter
Attack handles defense (§7.0). After the ending the player goes back to the
inn and can replay; **Part 2 is a future add-on to this game**, not a separate
game.

**2026-09-24 (art standard).** Hiro. The inn stays as built; the Bram inn
painting appears at random, now and then, on return from a quest (not built;
frequency open). Travel is to be repainted as run-through scenes with Hiro
painted into them — vaulting, sliding, climbing — on the method in
[ART_STANDARD.md](ART_STANDARD.md) §5, starting with a one-beat test. **Enemies
are monsters only**, which keeps dismemberment and disintegration finishes off
human characters and inside the PEGI 12 target.

**2026-09-22 (version 1 and the update model).** Hiro. Version 1 ships with
**Hiro as the only hero**: no hiring, the four open levels, two or three new enemy
types, smoother animation. The game then grows by **updates on the same
listing** — location packs and hero packs loaded after gameplay starts (§12c) —
rather than by sequels. **Bram is not the next hero**; the next hero is Hiro's to
design. **The size rule was misread and is corrected (§12a.0):** CrazyGames'
20 MB is the initial download for mobile-homepage eligibility (50 MB for
acceptance), not a cap on the whole game (250 MB, 1,500 files). **Bosses keep the
25 % Finisher line**, and the boss Finisher bug is fixed (§7).

**2026-09-19 (loop and size).** The demo becomes a loop: tutorial → inn →
recruit → level a skill → travel → quest → travel → inn → repeat. **Hiro is the
permanent first member and the only tappable character**; recruits are bought with
gold, ship finished, fight on their own, and are fielded two at a time from a
roster the player can grow. **Cut from the slice:** the hero-pick screen, the
trainer, the blacksmith and gear purchasing, party applications and rotating
crews, and story — all recorded as shelved in §18 rather than deleted. Content is
**a tutorial plus four repeatable quests on three tracks** (§5), built from plates
already in the build by grading them to night and adding weather, with travel art
now running between fights as well as either side of a quest. Music: Origin of the
Last Name for the tutorial and quests 1–2, Weight of the Quiet Man (Edwyn 2) for
the inn, Hunter's Breath for the two night quests. **§12a adds the size gate** —
masters out of the deploy folder, a ship manifest, and a budget check beside the
tests — with a 20.0 MB budget whose largest single saving is baking the busts and
dropping 4.4 MB of runtime composition sheets, which cutting the blacksmith makes
possible. Design only — no code written.

**2026-09-19 (art delivered).** Astra's first painted delivery landed as
`astra-v1` — 101 files, 194 MB, covering every §15.2 line, with two heroes rather
than one and a per-clip manifest carrying zero-based contact frames and a
pre-populated, ungreenlit §10.1 impact block. It is source art: gray background,
no alpha, unregistered, unpacked, and unreferenced by the code. The art intake
pipeline is therefore promoted from ninth to second on §15.3, the masters must
leave the deploy folder before the build is measured again, and painted frames
should be halved on the long edge at intake. Recorded, not integrated — no code
written.

**2026-09-19 (restart).** The demo needs a way to begin again. The run resumes
from its checkpoint with no control that starts a new one, and pause and mute
exist only inside a fight because only the Expedition scene builds a HUD. One
persistent corner control in every scene — mute, pause, Start over with a confirm
— plus a New run button on the grave card. Start over keeps the tutorial retired.
Design only — no code written.

**2026-09-19 (art).** Owner: Astra. Impact is split — Astra draws the
exaggerated contact frame, the weighted wind-up, the overshoot-and-settle
recovery and trailing elements a frame or two behind the body; Fable ships
hit-stop, flash, shake and drift as a per-clip table (`X.impact`, beside
`X.timing`) whose numbers Astra sets at greenlight, so code never invents feel
ahead of the art. **A finisher is one clip containing both figures** — minimum
three paired frames, wind-up / contact / aftermath — paced on the Hades template
at about 1.8 s, gated to the last enemy of a wave. Four silhouette classes cover
the slice at 12 paired frames for the greenlit hero. **Character design brief:**
appealing and distinctive inside PEGI 12, carried by line of action, counterpose,
silhouette and motion; bare arms, shoulders, midriff, thighs and back are fine;
rating pressure comes from framing and intent, not coverage; character art is
eye-level, three-quarter, full body. Design only — no code, no assets generated.

**2026-09-19 (combat).** Combat moves to real time. Basic attacks run on
`14 / spd` seconds; actives run on three cooldown tiers (light 3–5 s, heavy
8–12 s, ultimate 20–30 s); skill tier raises effect size, never cuts cooldown;
every active auto-casts on priority so an untapped hero still shows the whole
kit, and a tap re-orders and times rather than unlocks; enemies run weighted
condition lists instead of basic-attack spam. Damage per second replaces damage
per turn as the balance unit, which invalidates the §5 multipliers, the solo boss
rider and the Pass Tyrant's numbers (§7a.4). Design only — no code written.

**2026-09-19.** Change log started. **Guidance never chooses for the player:** it
may show how, never which. The hero pick breaks this today and is to be corrected
(§8). Dialogue audit recorded; fixes deferred, not dismissed. GDD split into built / owed / to-build. **Parties rotate:** the player
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

---

## 18. Shelved for the slice

Cut from this demo, kept here so the work is not lost. Each is written up in full
in the revision named, and each is a system the full game may still want.

| System | Where it lives | Why it was cut | What it cost to cut |
|---|---|---|---|
| **Hero pick** — one of three premades, hand-guided | v0.7 §3, §8 | Hiro permanent makes the purchase legible and settles the canonical-hero question | The pick screen's art is reused as the recruit list |
| **Trainer** — learn actives and perks, tutor to tier | v0.7 §4 | A scrolling text list is the worst possible phone screen | Skill levelling survives on the HUD |
| **Blacksmith** — one gear set per hero | v0.7 §4 | Gear sets were the reason busts had to be composed at runtime; cutting them frees 4.4 MB (§12a.2) | Recruits ship with their design's gear instead |
| **Party applications and rotating crews** | v0.7 §9a | Recruiting reaches the same variety by growing the roster | The §9a economics remain the reference for voice coverage |
| **Rival parties and the road ambush** | v0.7 §5, §6 | Story-adjacent, and the slice has no story | One encounter definition brings the ambush back (§6) |
| **The doomed pass and the grave** | v0.7 §5, §12 | No story in this slice | `Cutscenes.grave` and the funeral voice bands are built and synced |
| **Lawful / criminal framing** | v0.7 §5 | Framing is story | The `travel_law` and `travel_criminal` voice bands stay unused for now (§9) |

None of this is deleted from the build; it is unreferenced. When the full game
wants any of it, the code and the written design are both there.

---

## 19. Build review — current reconciliation and historical findings

### 19.1 Current result — September 20, 2026

Approved v2 art is integrated. See the current status at the top and the
[final integration/test report](ASTRA_V2_INTEGRATION_20260920.md). The earlier
[repair report](ART_PASS_2_AND_REPAIR_20260920.md) records the baseline before
this intake. Existing first-road locks and manual skill controls remain.
Physical-device and actual CrazyGames portal testing are still outstanding.

### 19.2 Historical review — 2026-09-19, after the build session

The findings and next-session order below describe that dated build. They are
kept for traceability; §19.1 and §10.5 govern current status. In particular the
missing beast/Bram intake, old inn/travel plate, nine-clip limit and missing
sheathed-idle source are no longer current findings. Broader-quest balance and
retention findings are deferred while the first-level lock is active.

What was played (headless Chromium, 1280 × 760 and the full loop; art review at
250 ms cadence) and what the screenshots and logs say. Severity: **A** blocks
submission, **B** a player will notice, **C** polish. Owner: F = Fable/Claude,
A = Astra, H = Hiro (a decision).

| # | Finding | Sev | Owner |
|---|---|---|---|
| 1 | **Hiro's inn and travel figure is the old plate** (faceless head plate over the outfit plate) while the battle uses the painted sheet. The mismatch is now the most visible art seam in the game. Fix: draw the inn/travel Hiro from the sheet's idle frame (and the walk loop on the road) — one texture, no new art. | B | F |
| 2 | **Recruit busts arrived as "Loading art…" placeholders** on the first inn visit before the bake (seen in the first screenshots). The baked busts are now preloaded, so in principle the window is gone; it has not been re-checked on a cold cache or a slow connection. | C | F |
| 3 | **Foes overlap Hiro at contact.** Wolves leap to `target.x − 120`, which on the painted Hiro puts the wolf on his sword arm (human foes reach to −150 on their slash). The placeholder blocking was tuned for the plates. Re-tune reach per actor width once the beasts are painted; until then push contact to about −170. | C | F |
| 4 | **City quest fourth clear is 0.57** against a 0.4 floor — the watch captain at ×1.9 hp/atk is the loop's hardest fight (the other three sit at 0.90–1.00). Either cap city scaling lower (×2.2) or let the fourth clear pay more. Decide with real players after the phone pass. | B | H |
| 5 | **Only nine of Hiro's 23 clips are in.** Aura, counter stance, intercept, riposte and the higher slash tiers still play as placeholder motion on a painted sprite, which reads as the sprite "sliding". The unpaired ten are one intake command; the paired five need the §10.2 renderer. | B | F |
| 6 | **Impact numbers are Astra's draft, not greenlit.** `X.impact` carries `greenlit: false` on every row; `npm run art:review` produces the frames she needs to judge slash-l1 and hit-short. Nothing else can be tuned until she has. | B | A |
| 7 | **The marsh plate shows rain streaks at "night, clear".** They are painted into the plate itself, not weather FX (the travel leg was fixed to ignore the ground bias). Either accept — a marsh drips — or ask for a dry grade of the plate. | C | H |
| 8 | **No ending.** The loop repeats with +30 % per clear and a ×3 cap, which a strong party reaches by the third cycle; after that every quest is the same fight. §16.4 is still open and is now the most important design decision left. | A | H |
| 9 | **Phone layout unverified.** `--width=375` exists and has not been run to green; the inn's five busts at 118 px pitch and the corner control at W − 190… were laid out for 1280. | A | F |
| 10 | **`js/data` ships whole (1.4 MB)** though the demo references a fraction; the sync copies the folder. The 1.5 MB is the cheapest headroom left for the remaining clips. | C | F |
| 11 | **Voice IDs for Bram, Nyx and Sable are provisional** (M05 / F07 / M11). They sound fine in the loop bands and are wired end to end; changing them is a three-line edit plus a re-sync. | C | H |
| 12 | **The desktop bridge corrupts binaries** (LF → CRLF on commit). Every `.webp` and `.mp3` this session went over as base64 text and was checksum-verified; the rule is in the CHANGELOG. Not a game bug, but the next session must know it. | — | F |
| 13 | **Load phasing not started.** 17 MB loads in one go; the CrazyGames 10-second target is unmeasured. §12a.3 stands. | A | F |
| 14 | **Hiro has no sheathed idle** (Hiro, 2026-09-19). After `victory-sheath` the sprite returns to the drawn-sword idle, so the sheath is undone a frame later. Needs an `idle-sheathed` clip (§15.2 item 2a); until it exists the win should hold the last sheath frame instead of looping idle. | B | A (paint) / F (hold frame) |
| 15 | **Recruits are being treated as a cheaper class of character** — six clips, busts composed from the website's parts. Corrected in §3: every purchasable recruit gets a full set to Hiro's standard, and the slice sells only the recruits that have it. Today that is nobody (Bram is delivered but not intaken), so the bar currently sells characters whose combat art is the baked website bust — which the no-placeholder rule forbids. | A | F (intake Bram) / A (the rest) / H (§16.13) |

What was verified and needs no action: the loop closes end to end with no page
errors (five clears, three recruits, twenty dialogues); the size gate holds at
16.97 MB and `test:ship` proves nothing outside the manifest is requested; the
painted Hiro keys cleanly, stands on the ground line and holds registration across
idle, slash, hit, roll, victory and kneel; recruit banter no longer repeats within
a quest; Start over, pause and mute reach every scene; a loop defeat cannot trap
the player; all 103 committed files match by checksum on Hiro's computer and the
sim passes there.

**Order for the next session:** 15 (intake Bram; hide the unpainted recruits) →
8 (a decision, then a day of work at most) → 14 (hold the sheath frame) → 9 → 13
→ 1 → 5 → 2 → 3, with 6 and the sheathed idle running in parallel on Astra's side.
