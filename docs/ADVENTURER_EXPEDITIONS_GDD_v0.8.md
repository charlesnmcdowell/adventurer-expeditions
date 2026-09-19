# Adventurer: Expeditions
## CrazyGames edition — game design document

Version 0.8 · September 19, 2026 · Working title · Design + build status

This revision supersedes v0.7; v0.5 through v0.7 are kept in `docs/` for history.

**What changed since v0.7.** The loop was redesigned to fit a mobile size budget
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

**Art cost per recruit is about six clips** — idle, walk, attack, cast, hit, down —
against Hiro's twenty-three, because only Hiro is tapped and only Hiro needs tier
variants. This is the single largest saving in the redesign.

---

## 4. The inn

Two things to spend gold on, both on one screen, neither a scrolling list.

| Spend | Cost | Effect |
|---|---|---|
| Recruit a member | 60 / 90 / 120 g, rising per recruit owned | Adds them to the roster, finished and ready |
| Raise a skill | 20 / 30 / 40 g per level | Hiro's skills, levels 1–3, exactly as the tutorial teaches |

Recruits appear as busts along the bar; a tap shows the class, the kit and the
price. Skill levelling uses the HUD icons the player already learned in the
tutorial — the same `+` badge and confirm chip — so the inn teaches no new gesture.

Fielding is a tap on an owned recruit to bring them or leave them. The quest
button is the third control and nothing else is on screen.

Contract payouts are 30–80 gold a fight, 120–170 a quest, so one pass through the
loop buys roughly one thing.

---

## 5. Quests, environments and music

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
Tapping is an advantage, not an obligation. §7a defines what that means once the
clock is real rather than turn-based.

**There is no way to start over, and no HUD outside a fight (found 2026-09-19).**
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
| Finisher | Ultimate | 20 s, **starts ready** | An execute should be rare. But fights run 10–20 s, so a cold 20 s timer would mean the tutorial's signature tap never comes up in fight one — it starts off cooldown, and the existing hold-off rule still hands the player the first cast. |

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

All non-verbal, all skippable, never repeated once done. The mechanism is one
piece of code (`X.UI.gate`): four input blockers around a hole, a pulsing ring on
the hole, a drawn hand tapping toward it, and a ✕ to skip. The game does not
advance until that one thing is tapped.

It is used for: the first Finisher window, the first purchase (icon, then the
confirm ✓), the forward arrow, the first affordable shop offer, and Apply to a
party. After three guided purchases the guide retires itself, and skipping once
turns it off for good.

**The rule the hero pick breaks (found 2026-09-19, not yet fixed).** Guidance may
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

### 12a.2 Where the current 26 MB goes, and what this plan deletes

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

Both pass as of 19 September — against the turn-based engine. §7a.4 lists what
the suite needs before it can prove the same claims in real time.

---

## 14. CrazyGames requirements and where the build stands

From the platform's quality guidance, FAQ and Basic Launch metrics:

| Requirement | Target | Now |
|---|---|---|
| Time to gameplay | Immediate; no title or creator screens | ✅ fights in the first seconds |
| Onboarding | Visual, skippable, no wall of text | ✅ hand and ring, always skippable |
| Build size | Under 20 MB | ⚠️ **26 MB** runtime today; §12a budgets the redesign at **20.0 MB** with painted art in, and gates it |
| Load time | Under 10 s cold | To measure in the portal iframe |
| Controls | Large targets, no hover-only info, no Esc / Ctrl+W | ✅ tap targets; needs a phone pass |
| Art and audio | Consistent | ⚠️ placeholder on screen; painted source delivered but not yet integrated (§10.4) |
| Rejection causes | Bugs, no English, clones, **content targeted at kids** | Addressed; see below |
| Conversion at 1 min | 80%+ | Unmeasured |
| Average play time | 10+ min | A repeatable loop with four quests (§5) rather than a fixed arc — this is what the metric actually wants |
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
  masters out of the folder. 16.97 MB of 20.0.
- The encounter simulation, the director, the event → beat mapping, the actor
  layer and the placeholder choreography (kept as the fallback for any clip a
  sheet lacks).
- The HUD: portrait, active arc, tier pips, cooldown wedges, queued ring, fired
  streak, detail chips, refusal reasons, gold, nodes, payout, cards; inn mode.
- Isolation tooling, the sync script, the audio trim, both test suites, the
  change log and this document.

### 15.2 Astra — delivered as source, awaiting intake

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

**Still owed, and neither is blocking:**

1. **The greenlight pass** — Astra setting each clip's real `hitStop`, `flash`,
   `shake` and `drift` numbers. This cannot start until intake produces registered
   playback to judge against, so it is gated on §15.3, not on her.
2. **Recruit clip sets — about six clips each** (idle, walk, attack, cast, hit,
   down) for Nyx, Sable, Aera and Ren. Far smaller than a hero set, because only
   Hiro is tapped and only Hiro needs tier variants (§3). Bram's delivered set
   already exceeds what a recruit needs, so it can be trimmed rather than
   repainted.
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

Items 1–4, 6 and 7 of the previous list shipped on 2026-09-19 (§15.1). What
remains, in order:

**Should happen before submission:**

1. **The rest of the intake backlog (§10.3, §10.4).** Fourteen Hiro clips are
   still on disk only: slash-l2/l3, aura-l1..3, counter-l2/l3, intercept, riposte,
   the three paired finishers and the two paired bites. The unpaired ones are one
   command each (`tools/art_intake.py --clips …`); the paired ones need the
   paired-frame renderer (§10.2), which does not exist yet. Then Bram's set
   trimmed to a recruit's six clips, and the beasts. Budget: about 3 MB left, so
   ~1.5 MB of atlas at the current 400 px height, or lower the height.
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

*Build note, 2026-09-19: to keep moving, the build took a provisional answer on
the items below. Every one is a one-line change; none was decided.* `night1` stands in for Hunter's Breath (1); `battle_origin` is the
Origin slot (2); the loop repeats with +30 % per clear and no ending (4);
five recruits at 60/90/120/150/180, fielding two (5); Bram M05, Nyx F07, Sable
M11 (6); Start over keeps the tutorial retired (7); the turn-based engine stays
(8); Hiro is the intake hero and Bram's set trims to six clips (9); the human
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
7. **Does Start over reset the tutorial (§7)?** Assumed no — a player who
   deliberately restarts has already seen the hand.
8. **Real time — decided, or exploratory (§7a)?** The folder still runs the
   turn-based engine, and the §7a port is the largest item on §15.3.
9. **Which hero is canonical for intake (§10.4)?** Astra painted Hiro and Bram.
   Hiro is now permanent, so he is the obvious first target; Bram becomes the
   first recruit and his delivered set can be trimmed to the six clips a recruit
   needs.
10. **Are finishers gated to the last enemy of a wave (§10.2)?** Assumed yes.
11. **Do the human bosses reuse the human paired set scaled up (§10.2)?** Assumed
   yes.
12. **Does Astra own the impact numbers (§10.1)?** Assumed yes — Fable ships
   conservative defaults, Astra replaces them at greenlight.

---

## 17. Decisions

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
