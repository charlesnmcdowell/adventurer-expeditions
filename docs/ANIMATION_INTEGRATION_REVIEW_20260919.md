# Animation integration and mobile budget — September 19, 2026

Scope: `adventurer-expeditions` only. The original website game is unchanged.
This implements the GDD v0.9 rev. b art-readiness rules and records rev. c.

## What caused Hiro to grow

The old importer scaled every clip using the idle sheet's body height. Idle
was about 498 source pixels tall; short-hit was about 674. A nominal 400-pixel
hero became roughly 541 pixels on damage, about 35% larger. Each clip now has
an authored body scale and ground pivot. Individual poses are not stretched to
a common bounding box: crouches, rolls and recoil remain shorter than standing.

All delivered actor clips are registered and packed: Hiro 128 frames in 23
clips, Bram 96 in 18 clips, and 96 frames across wolf, boar, plant and Alpha.
Multiatlas pages are capped at 2048 × 4096. Hero reference height is 320 pixels,
beast reference height 200; scene display height is independent. Existing source
masters remain intact outside deployment.

## Playback and contact

- Explicit frame holds and contact/release timing. Release no longer ends an
  animation before recovery finishes.
- Interruptions detach stale callbacks. Position, angle and scale reset to an
  absolute baseline instead of accumulating transformations.
- Ground pivots align feet; health plates sit above the painted heads.
- Pause and impact holds freeze frame animation as well as movement.
- Victory holds the final sheathed frame instead of snapping to drawn idle.
- Ordinary hits play beast recoil; death waits for that recoil.
- Paired finishers require a lethal result, the last enemy and matching target
  art. The actor approaches before the separate target disappears. Interrupted
  pairs restore a living target; completed lethal pairs leave it dead.
- Hiro and Bram use painted bodies in battle, travel and the inn. Hiro's HUD
  portrait is cropped from the painted atlas without another download.

No new combat rules or enemy stat reductions were introduced. These are
presentation, asset-readiness, save-validation and loading fixes.

## Inn and saves

Hiro remains permanent. Approved recruits are Bram, Nyx, Sable, Aera and Ren.
**Only Bram is presently purchasable/fieldable**, because his required clips
and frames exist. The other four have named unavailable cards without active
purchase controls or prices. Both buying and fielding enforce art readiness.

Save reload removes unknown identities, rejects old hero overrides, preserves
locked level-zero skills, and retains legitimate unavailable ownership without
fielding unfinished characters. All existing quest identities remain; quests
were not silently removed to conceal missing enemy art.

## Size and loading evidence

Measured on the final September 19 code. MB means 1,000,000 bytes.

| Measurement | Bytes | MB |
|---|---:|---:|
| Complete allowlisted upload, 212 files | 19,788,571 | 19.79 |
| Margin below 20 MB | 211,429 | 0.21 |
| Cold first visible gameplay / first combat step | 13,008,648 | 13.01 |
| After a real tap unlocks audio | 14,053,608 | 14.05 |
| SDK test double with delayed scenery, at gameplayStart | 13,008,651 | 13.01 |

The full-set gate uses a strict decimal limit, not 20 MiB. Missing required
files, directories or atlas pages fail it. Only the required M05 voice lines,
42 sound effects and a compact generated cache-hash table ship. Superseded
Hiro/creature art, unavailable recruit portraits/voices, masters, documents
and test captures are excluded.

Cold tests served only the upload allowlist with caches disabled at 1280×760,
390×844 and 844×390. All three had no missing files, page errors or premature
combat. A controlled 1.8-second scenery delay verified combat and SDK
loadingStop/gameplayStart wait for scenery and a first render. The SDK check
uses a local test double and an in-memory release-policy override, not the
uploaded CrazyGames portal.

Localhost timings are not slow-network measurements. Phone sizes are Chromium
emulation, not physical iPhone/Safari tests. Download size also differs from
memory: actor texture pages alone contain about 107.4 MB of decoded RGBA pixels,
excluding engine, framebuffer, audio and scenery. Device frame-rate and memory
testing remain necessary before submission.

## Validation

- `npm test`: 13 simulation checks, 6 recruitment/save checks, 16 animation
  lifecycle checks, 6 portal-readiness checks, all six actor registration
  contracts, upload-budget contracts and size gate passed.
- `test/browser_recruit_gate.js`: real pointer purchase, reload, travel and
  combat checks passed at 1280×760 and 375×223.
- Cold startup checks passed at all three profiles above; delayed-scenery SDK
  timing check passed.
- Final upload-only browser journey passed all five quests (tutorial, rain,
  city, marsh, ruins): Bram recruited, 16 travel dialogues, 6 inn upgrades,
  4 embarks, no defeats, missing assets, runtime errors or animation hangs.
  It returned to the inn with 440 gold. Desktop 1280×760; evidence is in
  `test/reports/expedition-current/verification.json` and 80 screenshots.

Simulation tests the available Hiro+Bram party. First-clear win rates across
30 seeds: rain 1.00, city 0.97, marsh 1.00, ruins 1.00. Fourth clear with earned
level-3 skills: 1.00, 0.73, 1.00, 0.97. Staying at level 1 instead: 0.80, 0.03,
0.80, 0.57. The test keeps that distinction visible. No enemy balance changes
were made to manufacture these results.

## Remaining work — not claimed complete

- Nyx, Sable, Aera and Ren need full sets before becoming purchasable. With
  only 0.21 MB of whole-build headroom, adding them requires measured savings
  or an explicit later-loading/release plan, not a silent budget increase.
- Human enemy variants still use baked bust art. One delivered human example
  does not cover every watchman, bandit and mage. Those quests remain playable,
  but this still falls short of the GDD's final no-placeholder goal.
- Dedicated sheathed idle is not painted. Victory holds the final frame as an
  interim fix; the inn still uses standing idle.
- Delivered skill icon/effect art is not all wired. Procedural VFX and glyph
  icons remain. Clip-by-clip cinematic art greenlight is still open; metadata
  deliberately retains `registrationApproved: false` and `timingGreenlit: false`.
- Physical phone performance/memory, slow networks, actual portal tests,
  finite-demo ending/progression decisions and final store media remain open.

## Rebuild and recheck

```powershell
python -m pip install -r tools/requirements-art.txt
npm run art:build
npm run media:hashes
npm test
npm run test:ship
npm run test:startup
node test/browser_startup_budget.js --portal-test --scenery-delay=1800
```

`tools/build_painted_art.py` defaults to masters in
`../adventurer-expeditions-source-art/astra-v1`. Registration inputs come from
`tools/prepare_art_registration.py`; intake uses `tools/art_intake_v2.py`.
`tools/review_art_registration.py` writes contact sheets under
`test/reports/registration/`. The ship set comes from
`tools/ship_manifest.json` and entry-page references. Use that allowlist,
not a recursive copy of the development folder, for a release.
