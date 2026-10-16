# Companion production and Hiro voice — approval review

Status: **preflight and five voice auditions complete; companion painting and
full voice production awaiting the review requested in the supplied prompt.**
No gameplay or website files were changed in this preparation pass.

## Confirmed facts and corrections

- All 15 named companions and their listed join chapters match the source.
  Joins remain conditional on choices and company seats. Hiwot joins after
  chapter 1 and can rejoin in chapter 13. Beau/Delphine join at chapter 2's
  arrival, so they do not fight in its earlier encounters.
- Chapter 1 stays solo by design. Hiwot already has a source combat kit; saying
  she has no fighting abilities is not a fact in the data.
- Two ally positions exist. Story combat disables allies in the source adapter,
  encounter construction and scene world. All three paths must change together.
- The source contains **210 choice options / 9,309 characters**. Ten options in
  three legacy finale menus are retired. The current story uses **200 options /
  8,831 characters**, including conditionally inserted finale menus. Preserve
  legacy data, but do not spend credits recording unreachable lines.
- Exact displayed wording stays unchanged. Lines containing character names or
  placeholders need a reviewed name-free spoken variant before full production;
  automatically deleting names can break the sentence. All five auditions use
  exact, name-free source text.
- Some source kits are support-focused. The proposed signatures below retain
  healing/protection rather than inventing damaging skills. Basic attacks still
  deal damage. No new combat skill rules are proposed.
- A story survivor must still be defeatable. Respect the source's nonlethal
  escape/spare result and animation; do not leave the enemy permanently at 1 HP.
- A downed companion is knocked out, never executed. Hiro reaching defeat still
  ends the fight even if an ally is alive; a healthy companion must not turn a
  lost story fight into endless automatic play.

## Proposed weapons and signatures — review before painting

Weapons below are art proposals, not a claim that every weapon is explicitly
specified by the old data. Faces, age, build, skin, hair and clothing identity
come from the existing character portraits. Different weapon forms and attack
choreography distinguish companions even where source skills overlap.

| Joins | Companion | Proposed weapon / visual style | Two source signature moves |
| --- | --- | --- | --- |
| 1, fights from 2 | Hiwot | Short blade and throwing knife; quick low footwork | Backstab; Smoke Bomb |
| 2 | Desmond | Ritual wand; off-balance gestures and coiling spell casts | Ember Lash; Wither Touch |
| 2 | Winston | Hooked knife; short, economical cuts, halfling proportions | Venom Fang; Whisper of Ending |
| 2 | Santiago | Spear and round shield; disciplined defensive guard | Shield Wall; Cleanse |
| 2 arrival | Beau | Broadsword and kite shield; planted weight and broad cuts | Cleave; Sunder |
| 2 arrival | Delphine | Branch staff; controlled druid gestures, mature family-friend identity | Mend; Thorn Skin |
| 3 | Itsuki | Longbow; measured stance and deliberate shots | Aimed Shot; Snare |
| 3 | Bahadır | Two-handed greatsword; powerful ranger swings | Cleave; Defiant Stand |
| 3 | Yasemin | Paired talisman fans; formal frost-binding gestures | Frost Touch; Rime Grasp |
| 3 | Devendra | Hooked wizard staff; sharp, commanding casts | Fire Bolt; Spark |
| 5 | Layla | Priestess's sceptre; restrained draining/curse gestures | Wither Touch; Blood Pact |
| 6 | Kaito | Shortbow and belt dagger; mobile shots and close lunges | Aimed Shot; Backstab |
| 6 | Wanjiru | Thorn/bone ritual gauntlets; forceful close-range druid magic | Thorn Skin; Wither Touch |
| 7 | Dai Morgan | Warhammer and small shield; low, sturdy dwarven stance | Mend; Regenerate |
| 13 | Amara | Twin sabres; temple-trained combinations and parries | Dual Swords; Counter Attack |

The bow users and casters retain different choreography, range priorities and
signature combinations. Wanjiru and Delphine do not require new beast forms for
these selected kits. Bahadır's tiger remains part of his identity; a separately
fighting pet is not included in the requested two-companion system. Existing
Bahadır source art will be checked for reusable poses before commissioning any
matching ones. No copied enemy gore/death clip may serve as a companion knockout.

## Art production and integration

- Eight animation groups each: idle, enter/walk, basic attack, two signatures,
  hit, knockout and victory. Plan **16 distinct drawings per group**, at least
  **1,920 drawings across 15 companions**, plus required projectile/effect art.
  If a particular move is planned with 12 poses, the binding doubled-count rule
  requires 24 instead. Holds never count as extra drawings.
- Start with Hiwot, then the chapter-two five, then later joins. First complete
  one companion through crop/alpha/ground/facing and actual party playback QA
  before expanding the same intake recipe to the roster.
- Companions face right. Hiro remains the only player-controlled fighter and
  the only enemy-finisher target. Signature effects release from painted hand/
  weapon anchors and hit on arrival. Damage-over-time and reflected kills also
  retain story-survival handling.
- Selected pair persists; absent, gone or dead characters are filtered. Use the
  newest eligible recruits only when no valid selection exists, not every time
  a player leaves a slot empty or reopens the picker. Explicit solo/one-ally
  selections must remain valid.
- Unlock presentations are recorded once per companion/save, distinct from
  seating or swapping. Mute, reload and scene cancellation are covered.
- Companions recover from knockout for the next fight. Healing signatures are
  finite/cooldown-controlled; test them against boss sustain and carry-over HP.
- Before/after balance reports will cover solo, one ally and two allies. Keep
  Hiro's intended 3–4-hit danger; companion durability is a proposed 5–6 comparable
  basic hits, subject to actual enemy skill/defence testing. Do not blindly rerun
  the solo scaling generator over party values.
- Measure packed bytes after the first companion, then each batch. The latest
  changelog reports the site at about 0.838 GB; this is a recorded deployment
  figure, not a fresh measurement of available hosting capacity. Twelve of the
  fifteen companions can join by chapter 6. Include only eligible chapter art,
  and stop before publishing an over-budget package. No hosting changes here.

## Hiro audition

Voice ID: `V8MrPOnARtlsjrlxEsE7`, returned by the account as **Zero Vex street
samurai**. Model: `eleven_v3`. Five exact source lines, no retakes. Audio matches
the measured opening Tesfaye clip's loudness (reference −22.87 LUFS; audition
target −22.9 LUFS, peak ceiling −1.5 dBTP). Original audio masters are retained.

Five requests submitted **281 text characters**. Response headers reported
**124 charged credits in total**; the account usage counter had not updated
when checked immediately afterward, so its zero delta is not treated as free
generation. Reserve at least 281 against the **40,000-credit job ceiling** until
usage settles. Full production and the unlock jingle have not been generated.

Open [the listening page](art/companions-hiro-20261015/index.html) for the five
separate clips, scripts and the weapon list. The production prompt explicitly
requires approval of these samples before the full voice batch.

Sources and generation ledger:
`../adventurer-expeditions-source-art/astra-v10/companions-hiro-20261015/`.
Contains the complete choice inventory, raw/normalized audio, request records
and the audition-only generator. No API key is stored there or in this repo.
The generator uses the original tool's credential location, preserves exact
text, resumes saved files and refuses an uncertain paid retry.

## Baseline and remaining work

`npm test` and `npm run test:ship` passed against the latest uncommitted hotfix
tree. Its Iaido Draw 3.6, Snarl retaliation, retry music and site travel packaging
changes are preserved. Empty checkpoint `8e6cf18` marks this baseline; it does
not claim those other-session changes are committed.

Companion art, combat/UI integration, party balance, the unlock jingle and the
remaining voice recordings are **not complete**. This is the approval package,
not a playable companion release. Only this pass's files/changelog hunk will be
committed. No push, publishing or portal export.
