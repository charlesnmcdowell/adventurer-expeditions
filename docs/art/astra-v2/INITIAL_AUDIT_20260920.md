# Astra v2 intake notes — tutorial art pass

Audit date: 2026-09-20. This is an **art delivery and read-only runtime audit**.
It does not change gameplay, atlases, the upload manifest, other levels, or the
original website game. New source work belongs in the sibling
`../adventurer-expeditions-source-art/astra-v2/`, outside deployment.

## Current scope and delivery status

The current brief overrides the broader v0.9 rev. c roadmap for this pass:
Hiro, ordinary gray wolves, thorn lurkers, and Bram as the only supported recruit.
Other levels, enemies and recruits are on hold. Preserve existing work; do not
replace missing art with temporary bodies, portraits as fighters, rigs or cutouts.

Priority order: three Hiro/wolf finishers and three Hiro/plant finishers; a new
walk cycle; four-frame sheathed idle; solo-Hiro and Hiro/Bram inn vignettes;
confirmation of ordinary enemy fight coverage; four large Hiro skill icons.
Each new paired finisher is one complete timeline with both figures. Use clean,
stylized contact and light dissolution; no blood or exposed anatomy. Keep the
current anime cel-shaded identities and the existing accepted scenery/weather.

**Verified beast reuse:** `astra-v2/beasts/manifest.json` references 13 existing
v1 clips / 55 frames. No beast PNG was generated, copied or repainted.

**New source delivery, intake pending:** six paired Hiro finishers are present
and visually inspected, each six frames in a 2×3 grid at 1254×1254: wolf cleave,
pin and rising cut; plant stem cut, vine pin and crosscut. That is 36 new paired
drawings. See `finisher-source-audit.json` for exact paths, sizes and hashes and
`FINISHER_SOURCE_REVIEW.md` for visual findings. Replacement walk and four-frame
sheathed idle sources are delivered; the walk is still undergoing refinement/
loop review and its final selected count may change from the initial 12 frames.
Four Hiro icons are delivered and producer-reviewed at 64 px. Their
respective movement/icon manifests govern selection. Inn work is being revised
to two high-resolution base paintings plus transparent candle/steam/hearth
overlays; final producer selection remains pending. None of these new files
has been intaken or deployed by this art-only pass.

**Concurrent code work:** these audit observations and the 19,788,571-byte
baseline describe the inspected rev. c build at the start of this art pass.
Another tool subsequently updated gameplay and rewrote the shared GDD/change
log; a later size read returned 19,789,374 bytes. This art audit did not make
those edits or verify their new controls. Preserve that work, use its own tests
for implementation status, and remeasure the integrated build. The separate
`ART_PASS_2_SCOPE.md` preserves the source-delivery scope without overwriting
the other tool's documentation.

### Reconciliation pointers for the concurrent code owner

Compare current code with
[`ANIMATION_INTEGRATION_REVIEW_20260919.md`](../../ANIMATION_INTEGRATION_REVIEW_20260919.md)
and its recorded `test/reports/expedition-current/verification.json`,
`test/reports/startup/cold-start.json`, and
`test/reports/startup/cold-start-portal-stub-delay1800.json`. That prior review
records a five-quest ship-only run, 320 registered frames, actor-lifecycle
coverage, Bram readiness, and scenery/render readiness before SDK start.
Those are previous results, not a test of the newly synchronized code.

Concrete differences observed during this art review: `campaign.js` no longer
contained the earlier `Camp.recruitArt` readiness registry, and `data.js`
changed several creature display heights (boar 190→250, Alpha 260→330).
The new shared change log reported 16.97 MB while the current ship check was
19,789,374 bytes. These indicate different baseline assumptions to reconcile;
they are **not proof of a reproduced gameplay defect**. Preserve the manual
skill/cinematic/tutorial work while comparing the earlier lifecycle/readiness
contracts in `actors.js`, `beats.js`, `campaign.js`, `scene.js`, and
`js/ui/portal.js`. Do not restore whole old files over the new behavior.

Useful focused checks after that reconciliation are
`test/actor_animation_lifecycle.js`, `test/art_registration.js`,
`test/expedition_recruit_gate.js`, `test/browser_recruit_gate.js`,
`test/portal_readiness.js`, `test/ship_budget_contract.js`, and
`test/browser_startup_budget.js` with its
delayed-scenery case. Confirm exact test names in `package.json`. Run the
updated ship-only gameplay flow after code settles. This art pass deliberately
did not start a long gameplay test against actively changing files.

## Corrections to the supplied brief

- Wolf and thorn-lurker sets are already registered, packed and connected to
  actors. They are not waiting for their first intake. GDD §10.5 already records
  this in rev. c; old source-only flags in v1 delivery documents are historical.
- `?sheet=0` is no longer a supported comparison mode. The review script still
  accepts the argument and labels output “plates,” but current scene creation
  always supplies painted sheets. Do not use that label as evidence of an A/B test.
- Victory currently holds its last sheathed frame. A true four-frame sheathed
  idle is still new art; the old snap-to-drawn report predates that hold fix.
- Only Hiro's v1 source folder has a literal `manifest.json`. Other deliveries
  use companion clip/region records. “Same layout” does not mean an identical
  manifest file already exists in every v1 directory.
- The running tutorial still contains a boar in `thicket` and an Alpha in
  `clearing`; the expanded four-quest loop is still available. The new content
  locks and revised enemy composition are **code-side work**, not implemented
  by these art notes. Likewise manual skill use, every-kill finishers, slow-motion
  cameras, three-second skill holds and inn replay behavior remain code-side.

## Existing metadata and source locations

Paths are relative to `adventurer-expeditions` unless prefixed `../`.

| Purpose | Existing record | Shape / authority |
|---|---|---|
| Hiro source delivery | `../adventurer-expeditions-source-art/astra-v1/heroes/hiro/manifest.json` | Top-level `clips`; `id/file/frames/columns/rows/paired`; canonical zero-based contact/release fields. Old `*Proposed` ordinal fields also remain, so do not consume those. |
| Bram source delivery | `docs/art/astra-v1/bram-clips.json` | Separate `clips`, `paired`, `finishers` arrays; `grid`, `contact`, `release`, and some multi-file clips. |
| Bram extraction rectangles | `docs/art/astra-v1/bram-source-regions.json` | Measured per-source cell rectangles. |
| Beast source delivery | `docs/art/astra-v1/beasts-clips.json` | `wolfClips`, `secondaryMotionClips`, `secondaryProofs`; zero-based `contact/release`, `grid`, draft durations. |
| Normalized intake inputs | `tools/art_registration/{hiro,bram,wolf,boar,plant,alpha}.json` | One actor per file, `clips`, canonical zero-based fields, registration reference heights and optional explicit anchors/regions. |
| Actual runtime atlases | `assets/expedition/{actor}/{actor}.json` plus page WebPs | `textures`, `frames`, `canvas.pivot`, `standing`, and `clips` keyed by runtime clip ID. These show what was packed. |
| Measured intake records | `test/reports/registration/{wolf,plant}.json` | Actual source rectangles, foreground bounds, reference heights, anchors and output scale for every frame. |
| v2 reuse handoff | `../adventurer-expeditions-source-art/astra-v2/beasts/manifest.json` | References v1 source PNGs; explicit delivery-to-runtime adopt maps; no duplicated masters. |

`tools/prepare_art_registration.py` currently reads v1 records and hard-coded
actor/clip maps. `tools/build_painted_art.py` invokes it. Merely adding a v2
manifest does not make that pipeline import v2. Fable must deliberately adopt
new clips while preserving the v1 assets still required by the tutorial.

## Wolf and thorn-lurker coverage

All files in this table exist beneath
`../adventurer-expeditions-source-art/astra-v1/beasts/`. The source and runtime
counts agree, and all 55 runtime frame keys exist. Both actors use a 200-pixel
standing reference in the current packed atlases.

| Actor / runtime clip | Source | Grid | Frames | Contact / release, zero-based |
|---|---|---|---:|---|
| wolf / idle | `wolf_idle.png` | 2×2 | 4 | none / 3 |
| wolf / run | `wolf_run.png` | 3×2 | 6 | none / 5 |
| wolf / leap | `wolf_leap.png` | 3×2 | 5 | 3 / 4 |
| wolf / bite | `wolf_bite_v2.png` | 2×2 | 4 | 1 / 3 |
| wolf / land_tumble | `wolf_land_tumble.png` | 3×2 | 5 | none / 4 |
| wolf / overshoot_land | `wolf_overshoot_land.png` | 2×2 | 4 | 1 / 3 |
| wolf / land_beside | `wolf_land_beside.png` | 3×1 | 3 | 1 / 2 |
| wolf / hit_short | `wolf_hit_short.png` | 3×1 | 3 | 0 / 2 |
| wolf / down_fade | `wolf_down_fade.png` | 2×2 | 4 | none / 3 |
| plant / idle | `thorn_lurker_idle.png` | 2×2 | 4 | none / 3 |
| plant / lash | `thorn_lurker_lash.png` | 3×2 | 6 | 3 / 5 |
| plant / hit_short | `thorn_lurker_hit_short.png` | 3×1 | 3 | 0 / 2 |
| plant / down_fade | `thorn_lurker_down_fade.png` | 2×2 | 4 | none / 3 |

Wolf total: **9 clips / 38 frames**. Thorn-lurker total: **4 clips / 17 frames**.
Idle, approach/leap or rooted lash, attack/contact, hit reaction, and defeat are
covered. A separate plant walk cycle is not missing: the plant should remain
rooted. Its six-frame lash already includes coil, extension and recovery.
The director's `lash_back` currently maps to `idle`; the return-to-guard seam is
an intake/playback review item, not proof that a new source clip is needed.
Likewise plant entrance currently maps to idle while its root is moved on entry;
the code owner should stage a rooted plant appropriately.

The existing three Hiro finisher tiers embed a gray wolf. They do not supply
three newly directed variants per species, and cannot represent a thorn lurker
by relabeling metadata. The six requested v2 finishers are separate new work.

## v2 schema and registration contract

Use Hiro v1's normalized structure for new per-folder manifests:
`version`, subject, date, source status, indexing, selected counts, and `clips`.
Each clip needs `id`, `file`, `frames`, `columns`, `rows`, `paired`, `loop`,
`contactFramesZeroBased`, `releaseFrameZeroBased`, and `durationsMs` (one positive
duration per frame). An empty contact array means no artistic contact marker.
All indices are **clip-local, zero-based**, and must be less than `frames`.
Document unused trailing cells; add measured `regions` if the generated grid is
not uniform. Never copy one-based `contactFramesProposed` fields into intake.

New paired clips also require the exact `opponentKinds` identity, shared ground
anchor, reference body height, and any per-frame registration corrections.
Hiro remains on the left, the matching enemy on the right. Neither actor can
change costume/species or be split onto an unrelated timeline. A contact marker
is a presentation cue; it must not apply an additional damage/reward event.

Preserve **body scale**, not total silhouette height. A raised sword, flying
petal or airborne pose must not rescale the character. Record
`registration.referenceHeight` and `anchorX/groundY`, with
`registration.frames` overrides when needed. Hiro currently packs at a
320-pixel reference; beasts at 200. Current full canvases/pivots are Hiro
630×355 at (315,335), wolf 526×233 at (263,230), plant 318×222 at (159,219).
These are reference evidence, not a demand to force new wider choreography
into an old canvas and clip its weapons.

The v2 beast reuse file provides unique delivery IDs plus `actorId`,
`sourceClipId`, `runtimeClipId` and `adoptMap`. Its `file` paths are relative to
`astra-v2/beasts`, e.g. `../../astra-v1/beasts/wolf_idle.png`. They intentionally
cross into the preserved v1 source folder. Each entry is `paired:false` and
includes the prior measured per-frame anchors. Split this mixed-subject manifest
by actor and apply its runtime-ID map before packing; do not pack all 13 entries
under one actor ID. `existingRuntimeVerified` describes v1; `v2RuntimeAdopted`
remains false. No new integration approval is implied.

## Inspection and budget cautions

- `wolf_hit_short.png` is 2032×774, not evenly divisible into three integer-width
  cells. `wolf_land_beside.png` and the plant hit strip are 2172×724. Preserve
  measured extraction boundaries rather than imposing a generic fixed cell size.
- Five-frame wolf sheets have a 3×2 grid with unused cell 5. Existing sources
  have real alpha; newly generated sheets use the brief's neutral gray. Preserve
  fur, steel highlights, translucent particles and dissolve edges during keying.
- Tail tips, paws and vines approach some source cell edges. The companion audit
  lists measured foreground margins. Small alpha bounds can include shadow/glow;
  they are inspection flags, not automatic proof of body cropping. New sheets
  should leave clear room around the entire figure and every blade/tendril.
- Registration boards were visually inspected; source/destination counts and
  source hashes were checked. `node test/art_registration.js` passes all six
  existing atlases. This audit is not a new frame-by-frame gameplay greenlight
  for all timing, paired contact, gait continuity or mobile readability.
- Read-only runtime baseline: **19,788,571 bytes / 212 files**, only **211,429
  bytes** below the 20,000,000-byte ceiling. New PNG masters remain outside the
  upload. The future tutorial-only release must be measured again after actual
  clip adoption and content gating; this delivery does not alter that 19.79 MB
  runtime or remove its other levels.
- Inn vignettes are complete environmental compositions, not ordinary actor
  sprite sheets. Preserve the 1280×760 safe composition, quiet left third and
  bottom-right menu region. State their loop/overlay format explicitly.

See `beast-coverage-audit.json` here for measured source dimensions, hashes,
frame counts, runtime keys, registration and margins. Older v1 reviews remain
unchanged as historical evidence.

## Conditional tutorial-only budget plan

This is a read-only inventory of current shipped bytes. No files, loader
requests, saved quests or ship-manifest entries were changed.

| Candidate exclusion after content/loader gating | Current bytes |
|---|---:|
| Boar and Alpha atlas pages plus JSON | 707,381 |
| Seven human-foe bust WebPs | 361,826 |
| City/marsh/ruins combat plates and travel panoramas | 2,086,420 |
| Night quest music, `audio/music/night1.mp3` | 995,806 |
| **Conditional total** | **4,151,433** |

From the 19,788,571-byte baseline, that would leave 15,637,138 bytes and
4,362,862 bytes of room below the strict ceiling for **net** new art. Replacing
the tavern plate could remove a further 279,194 bytes only after the new inn
vignette covers the actual inn/background/failure path. Exact file lists are in
`tutorial-budget-inventory.json` beside this document.

These exclusions require code work first. `scene.js` currently preloads all
six actor sets; `ui_common.js` accepts every `foe_` bust; `data.js` still places
boar and Alpha in the tutorial; `campaign.js` still cycles later quests and
uses their scenery/night music. Lock/migrate those routes and narrow preloads
before removing their manifest entries. A hidden menu alone is insufficient:
saved runs or the common preloader can still request excluded files.

Retain forest/road/mountain combat plates, forest travel, `battle_origin.mp3`,
`edwyn2.mp3`, and the full approved Bram set. Four unavailable recruit voices
and busts are already excluded, so removing them again saves nothing. Masters
are already off-ship. Do not count their PNG size as a runtime saving. Generic
shared data/scripts remain dependency-sensitive and were not counted as safe
exclusions in this audit.

The three existing Hiro finishers contain nine frames total. Six new
six-frame finishers would contain 36, a net addition of 27 before walk/idle/
icons/inn art. Their raw PNG size or cell dimensions cannot establish the
packed WebP size: registration scale, occupied bounds, alpha and page layout
all matter. Replace the old clips rather than retaining unused alternatives;
pack at the existing 320-pixel hero reference and quality 76 as the first
comparison, then inspect full-size and mobile crops before trading clarity
for compression. Animated inn frames need their own measured budget.

No future package-size or loading pass is claimed. After adoption, run the
strict size check, ship-only browser journey, cold-cache initial transfer test
through the honest SDK start hook, and physical-device/portal QA. Compare
the new six finisher sequences in slow motion; a smaller atlas is not a pass
if it damages anatomy, contact or readability.
