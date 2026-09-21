# Art pass 2 — tutorial scope and source handoff

2026-09-20. This addendum preserves the Astra art scope and delivery record
alongside concurrent gameplay work. It supersedes broader art-production lists
for this pass, but does not replace that work or certify its implementation.

## Active scope

The first five minutes only: Hiro versus ordinary gray wolves and thorn
lurkers, then the inn. Bram is the only recruit with a completed painted set
in scope. Other levels, enemies and recruits are on hold. Preserve their work
for later; do not build substitute fighters or expand production to fill them.
Reuse accepted scenery, music, voices and underlying systems. Keep the original
website game and exports separate.

Finishers use one paired timeline containing Hiro and the exact victim.
Provide at least three variants for each of the two species. Keep the existing
cel-shaded identities, purposeful contact and clean light disintegration, with
no blood or exposed anatomy. No rigs, hinged cutouts or placeholder fighters.

## Delivery status

| Item | Source status | Runtime status |
|---|---|---|
| Wolf cleave, pin, rising cut | Three paired sheets, six poses each; independently inspected | Intake/registration/timing pending |
| Plant stem cut, vine pin, crosscut | Three paired sheets, six poses each; independently inspected | Intake/registration/timing pending |
| Hiro walk | Replacement source delivered; gait refinement may change final frame count | Replacement intake and loop review pending |
| Hiro sheathed idle | Four-frame source delivered | Intake and loop review pending |
| Hiro skill icons | Four delivered; producer-reviewed at 64 px | Crop/pack/HUD adoption pending |
| Inn environment | Being revised to solo-Hiro and Hiro+Bram high-resolution paintings with transparent candle/steam/hearth overlays | Final producer selection and integration pending |
| Ordinary wolf set | Nine clips / 38 drawings, reused by reference | Already present in the inspected v1 runtime |
| Ordinary thorn-lurker set | Four clips / 17 drawings, reused by reference | Already present in the inspected v1 runtime |

New finishers total **36 paired drawings**: six 1254×1254 sheets in 2×3 grids.
See [the source review](FINISHER_SOURCE_REVIEW.md) and
[exact dimensions/hashes](finisher-source-audit.json). Margins are tight in
several poses; preserve full cell extents before keying, then register by body
scale and ground anchors rather than overall silhouette height. No major
body/costume/species error was found in that source inspection. This does not
approve animation playback, tap-camera timing or mobile readability.

Source root: `../adventurer-expeditions-source-art/astra-v2/`.
The beast manifest references exact files under `astra-v1/beasts/` with SHA-256
hashes and per-frame registration. It has 13 clip entries, 55 reused drawings,
zero new beast PNGs and `paired:false`. Split its entries by actor and use
`adoptMap` before intake; it is not one 55-frame creature atlas.

Use canonical zero-based, clip-local `contactFramesZeroBased` and
`releaseFrameZeroBased`, explicit grids/actual counts/unused cells, duration
drafts and grounded registration. Paired clips require opponent identity.
Preserve `timingGreenlit:false` until adopted playback has been reviewed.
Older one-based proposed markers are not safe aliases. Producer manifests
govern final chosen revisions; never package every trial PNG.

## Separate code responsibilities

The brief requests player-triggered skills, cinematic camera/slow motion,
every-kill finishers, larger icons, three-second hold descriptions, guided
tap pauses, an inn replay flow and locks on later content. Those are code-side
features, not consequences of source-art delivery. Concurrent Sep20 changes
claim some of this implementation; this art audit did not validate those
changes. Reconcile against the completed rev. c registration, actor lifecycle,
recruit readiness and SDK/scenery work before rerunning gameplay checks.

At the original audit, the code still included boar/Alpha in tutorial waves and
loaded six actor atlases. Subsequent locking changes must also reconcile actual
encounters, existing saves and shared loaders before assets can be excluded.
A locked menu alone does not prove nothing requests a resource. Plant lash
already includes recovery; inspect that playback before commissioning missing
recovery art. Rooted plants need intentional entrance staging.

The brief's `?sheet=0` comparison and “beasts not intaken” statements were stale
at audit time: v1 Hiro, Bram and all four beast sets had been integrated, with
320 frames passing registration checks. Use explicit runtime verification if
concurrent changes affect that status. Preserve prior reviews as history.

## Budget, verification and remaining work

Read-only initial baseline: **19,788,571 bytes / 212 files**. A later concurrent
code update measured **19,789,374 bytes**; this art pass changed neither runtime
nor ship manifest. Conditional exclusions total **4,151,433 bytes** after the
matching content/save/loader changes: boar/Alpha 707,381; human-foe busts 361,826;
later city/marsh/ruins scenery 2,086,420; night1 music 995,806. See the exact
[inventory](tutorial-budget-inventory.json). Keep tutorial forest/road/mountain
plates, forest travel, battle_origin/edwyn2 and Bram. The old tavern plate is
another 279,194 bytes only if its replacement covers every inn path.

The original conditional retained base is 15,637,138 bytes, leaving 4,362,862
for net new assets; it must be recalculated after current code and real v2
packing. Nine old finisher frames become 36; walk/idle/icons and inn art add
their own costs. Raw PNG bytes cannot predict compressed atlas cost. No future
sub-20MB or mobile-quality pass is promised.

After final source selection: key/crop/register, pack only selected art, update
explicit loaders/adopt maps, then run registration and animation lifecycle
checks, size gate, ship-only gameplay, honest cold-start transfer tests and
physical-device/portal QA. Source masters never ship. No new actual gameplay
greenlight is implied by the source review.
