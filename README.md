# Adventurer: Expeditions (CrazyGames edition)

A separate build of Adventurer for CrazyGames, played as an arcade run: Hiro
starts in a guided road ambush that teaches his three skills, then loops the
forest, swamp and city, harder each playthrough, scoring points until he falls.
Every skill is owned from the start at one level; nothing is bought. Fighting is
automatic; the player taps Finisher, God Aura and Counter Attack. A run ends on
the End scene with a top-ten board. Recruitment and companions stay locked for a
later hero pack.

Approved Astra v2 movement, finishers, idle, inn and icons are integrated.
[Current integration and tests](docs/ASTRA_V2_INTEGRATION_20260920.md).
[Design document](docs/ADVENTURER_EXPEDITIONS_GDD_v0.9.md).

**This folder never touches `../adventurer`.** The website game keeps running
from its own folder. Shared engine files are *copied* here by
`node tools/sync_shared.js` (one way: original → here). Everything this edition
adds or changes primarily lives in `js/expedition/` and `index.html`; the shared file
this folder owns its own copy of is `js/ui/portal.js` (it carries the
Expedition scene-key hook and is never overwritten by the sync).

## Play locally

Double-click **Play Expeditions.bat**, then open
http://127.0.0.1:8735/index.html. For PowerShell, run:

```powershell
$env:ADV_PORT = '8735'
node play_local.js
```

Keep the server running while playing. If that port is occupied, use the URL
printed by the server.

- `?fresh=1` wipes this edition's save (key: `adventurer_expeditions_loop_v1`)
- `&seed=N` makes the fight repeatable
- Hiro is permanent and alone. Bram's art stays on disk as the hero-pack test
  fixture; recruitment is locked in the arcade.

## Tests

```powershell
npm test
npm run test:ship
npm run test:startup
node test/browser_startup_budget.js --portal-test --scenery-delay=1800
npm run size
```

Browser tests need Playwright and Chromium. See
[measurement notes](test/STARTUP_MEASUREMENT.md) for methodology and limits.
These checks do not substitute for physical-phone or uploaded-portal QA.

The upload allowlist is `tools/ship_manifest.json`. It must stay strictly below
**20,000,000 bytes**, including every required atlas page. Documents, raw art,
old atlases and test captures are excluded. `npm run zip` packages that set
for transport; extract and upload its contents if the portal requires individual
files. Do not upload the working folder. The checked-in release policy is still
the website preview policy; configure/verify CrazyGames policy before submission.

## Rebuild art

```powershell
python -m pip install -r tools/requirements-art.txt
npm run art:build
npm run media:hashes
```

Masters live outside deployment at
`../adventurer-expeditions-source-art/astra-v1`. The builder creates registration
manifests and six WebP multiatlases, then checks registration and size.
`python tools/build_painted_art.py --help` documents source/actor overrides.
Run browser checks after changing art. Review shared-file imports with
`node tools/sync_shared.js --check` before syncing from the original game.

## Layout

    index.html            entry (the original's data+core script block, a UI subset, then js/expedition/*)
    js/expedition/        quests and the loop, saves and the board, actors, combat presentation, HUD, inn, travel, End
    js/data, js/core      reused engine copies (review changes; do not alter the original for offshoot-only work)
    js/ui/                synced UI helpers + this folder's portal.js
    assets/, audio/, lib/ synced subset actually used by the demo
    tools/                art intake, upload allowlist, size gate, cache-hash generation
    docs/                 GDD v0.9, change log, art contracts and integration review
