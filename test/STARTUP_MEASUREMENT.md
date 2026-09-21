# Startup and upload budget checks

Run from the Expeditions folder with Node and Playwright available:

```powershell
node tools/size_check.js
node test/ship_budget_contract.js
node test/browser_startup_budget.js
node test/browser_startup_budget.js --portal-test
node test/browser_startup_budget.js --portal-test --scenery-delay=1800
node test/browser_expedition.js --ship
```

The size gate counts the complete uncompressed upload allowlist, including every
multiatlas page. It requires **less than 20,000,000 bytes**, using decimal MB. It
fails before packaging when required files/directories are missing or the limit
is reached. Generated art masters and superseded atlas pages are not uploaded.

The startup test serves only that same allowlist. It opens fresh, cache-disabled
Chromium contexts at 1280×760, 390×844 and 844×390, using mobile device settings
for the latter two. It records network response bytes at visible gameplay, the
first combat step, and after a real pointer action unlocks audio. Required
scenery, actors and HUD must exist before the visible-gameplay milestone.

`--portal-test` changes the served release configuration in memory and substitutes
a small local SDK test double. This checks the actual adapter's `gameplayStart`
timing without changing the checked-in release policy. The hook must not fire
before required scenery and controls are ready. **This is not an uploaded
CrazyGames preview test.** SDK network bytes are explicitly excluded. Run the
real portal QA before making platform loading-time or SDK-integration claims.
The optional scenery delay holds the initial forest image response and asserts
that neither combat nor either SDK completion/start hook advances during it.

Results and screenshots are written to `test/reports/startup/`. The JSON reports
include file totals, per-profile milestones, requested URLs/bytes, browser errors,
and limitations. Mobile is Chromium emulation, not a physical iPhone/Safari test.
Local HTTP bodies are uncompressed; CDP counts include HTTP response overhead,
but not TLS/IP overhead. Localhost timings do not predict slow-network timings.

The five-clear `--ship` browser run separately checks the tutorial, four repeatable
quests, recruitment, travel, dialogue, upgrades and the return to the inn while
refusing requests for anything outside the upload allowlist.
