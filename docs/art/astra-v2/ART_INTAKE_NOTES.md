# Astra v2 intake notes — runtime integration complete

Approved artwork was integrated September 20, 2026. The playable build and final
test/size evidence are in [the integration report](../../ASTRA_V2_INTEGRATION_20260920.md).
The notes below record the source handoff before approval; their paused/pending
status and 15.65 MB baseline are historical. Current build:17,828,737 bytes / 205 files.

# Historical source-delivery notes

Revised 2026-09-20. Runtime integration is paused at the user's request. The wolf now uses an overhead slash and sword twirl; the 16-frame run has an open torso and free swinging arm. Plant iaido is retained. See `../adventurer-expeditions-source-art/astra-v2/REVISION_OVERHEAD_RUN_V4.md` relative to the project root.
The separately authorized repair of Fable's overwritten integrations is complete.
The original website game was not changed.

The authoritative source index is
`../adventurer-expeditions-source-art/astra-v2/manifest.json` (relative to the
Expeditions project). Open `astra-v2/index.html` through an HTTP server for the
review gallery. The source directory must stay outside deployment.

## Selected art

| Delivery | Selected source | Status |
|---|---|---|
| Hiro/wolf finishers | Overhead slash/twirl 12 frames; boot pin 6; rising cut 6 | Source preview; runtime intake paused |
| Hiro/plant finishers | Iaido stem cut 8 frames; vine pin 6; crosscut 6 | Source reviewed; runtime intake pending |
| Hiro samurai run | 16 frames across two 8-frame sheets; 800 ms | Registered loop reviewed; game integration paused |
| Hiro sheathed idle | 4 frames, 2 × 2 grid | Source reviewed; draw/sheath transition check pending |
| Inn | 2 base paintings; candle, steam and hearth loops, 4 frames each | Composite source preview reviewed; runtime menu composition pending |
| Hiro skills | Katana Slash, God Aura, Counter Attack, Finisher | Four distinct icons reviewed at 64 px; runtime UI intake pending |
| Existing enemies | Wolf 9 clips/38 frames; plant 4 clips/17 frames | Complete fight coverage already intaken in v1; v2 references those originals |

New selected masters: **16 PNG files / 30,262,179 bytes**. Hiro has 8 new clips /
64 frames in total. The 13 reused beast PNGs remain in v1. No unrelated hero,
enemy or level is added. Hiro is permanent and Bram is the only supported recruit;
new recruitment stays locked during this first-road pass.

## Manifests and review

Within the source-art v2 folder:

- `heroes/hiro/manifest.json` combines the current movement and finisher selections.
- `heroes/hiro/movement-manifest.json` contains per-frame reference heights,
  anchors, gait review and the selected 16-frame run. The old eight-frame walk and rejected twelve-frame
  candidates are evidence only.
- `heroes/hiro/finisher-manifest.json` contains paired timeline contacts, release,
  dissolution and measured grid regions. Six clips, 44 selected drawings. The overhead wolf clip uses two six-frame sheets; one impact at frame 3, wolf fully gone from frame 5, recovery release at frame 11. Rejected wolf iaido sources are no longer selected.
- `backgrounds/inn-manifest.json` selects high-resolution bases and real-alpha
  overlays. Earlier full-scene loop attempts are explicitly not selected.
- `icons/icons-manifest.json` defines icon cells and usable bounds.
- `beasts/manifest.json` records zero-based markers and existing actor/runtime maps.
- `delivery-validation.json` records the selected 29-file structural check;
  rerun it with `python validate_delivery.py` from the source-art v2 directory.

The inn paintings depict Hiro eating alone or sharing the table with Bram. The
moving elements are flame and steam, not animated chewing or hand motion. Menus
belong in the reserved left third and bottom-right area.

All animation contacts/releases are clip-local, zero-based. A visual contact is
not another damage event. Six paired finishers keep Hiro and the matching enemy
on one timeline; do not mix these with Alpha or unrelated enemy identities.
The combined hero manifest also supplies `opponentKinds` for code-side mapping.

## Registration and integration cautions

- Keep actor body scale stable, irrespective of the total weapon/particle/airborne
  silhouette. Honor per-frame `referenceHeight`, `anchorX` and `groundY` guides.
- The selected run has 16 frames in two source images. Use their explicit per-row
  regions and global registration array. The 800 ms loop was previewed; world
  movement speed still needs matching during runtime intake.
- Finisher sources have neutral gray backgrounds and some 1–15 px margins.
  Preserve boots, roots and silver weapon highlights; inspect seam fragments,
  especially the rising-cut sheet, after extraction. See `FINISHER_SOURCE_REVIEW.md`.
- The sheathed idle is a three-quarter resting pose, while walk is side-on.
  Validate its bridge through draw/victory-sheath at runtime before sign-off.
- Inn overlays have true alpha. Preserve it. Frame/placement timing is draft;
  validate the composition behind the real menu at desktop and phone scale.
- Reuse beast extraction regions and per-frame guides. Some original strip
  dimensions do not divide evenly into equal integer-width cells.
- Never pack rejected candidates, screenshots or review video by folder glob.

## Runtime repair and measured budget

See [Art pass 2 and repair report](../../ART_PASS_2_AND_REPAIR_20260920.md) for
actual faults, repairs, tests and remaining work. It supersedes the initial
read-only audit's code status and hypothetical exclusion plan.

Current package: **15,650,969 bytes / 195 files**, leaving **4,349,031 bytes**
below the strict 20,000,000-byte ceiling. Cold gameplay transfer is 11,931,986
bytes;  after audio it is 12,976,946. New v2 sources are **not included**.

Tutorial-only loader/save gating and ship exclusions are now implemented.
Boar, Alpha, later-quest scenery and unused night music are retained on disk but
excluded from the tutorial package. Two upload-only tutorial clears and desktop/
mobile browser startup checks pass, including a delayed SDK/scenery test. Actual
portal and physical-device testing remain outstanding.

After v2 adoption, remeasure the packed result. Use existing body-resolution
settings as the starting point, replace superseded clips, and inspect contact
and readability before reducing quality to meet size. Keep the actual build
under 20 MB rather than treating source size or projected savings as proof.

The preserved [initial audit](INITIAL_AUDIT_20260920.md),
`beast-coverage-audit.json`, `finisher-source-audit.json` and
`tutorial-budget-inventory.json` document the pre-repair state. They are
historical evidence, not current runtime status.
