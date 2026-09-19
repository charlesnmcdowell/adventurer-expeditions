# Adventurer: Expeditions (CrazyGames edition)

A separate build of Adventurer for CrazyGames. The loop: an immediate solo
road contract (two monster groups and a boss, automatic fighting, mini skill
icons around Hiro's portrait, gold-funded unlocks, a forward arrow between
fights) → the inn (solo contract / apply to a party) → travel with mood-driven
banter from the website's personality tables and recorded clips → three party
contracts, the last of which ends at the leader's grave → back to the inn.
Design: `docs/ADVENTURER_EXPEDITIONS_GDD_v0.5.md`.

**This folder never touches `../adventurer`.** The website game keeps running
from its own folder. Shared engine files are *copied* here by
`node tools/sync_shared.js` (one way: original → here). Everything this edition
adds or changes lives in `js/expedition/` and `index.html`; the one shared file
this folder owns its own copy of is `js/ui/portal.js` (it carries the
Expedition scene-key hook and is never overwritten by the sync).

## Play locally

Double-click **Play Expeditions.bat**, or `node play_local.js`, then open
http://127.0.0.1:8735/index.html

- `?fresh=1` wipes the demo save (its own key: `adventurer_expeditions_hiro_preview_v1`)
- `&seed=N` makes the fight repeatable

## Tests

    node test/expedition_sim.js         headless simulation gate (determinism, no-tap win rate, request/purchase integrity)
    node test/browser_expedition.js     Playwright run of the guided first fight with screenshots in test/reports/expedition/
    node tools/sync_shared.js --check   reports shared files that drifted from ../adventurer

## Layout

    index.html            entry (the original's data+core script block, a UI subset, then js/expedition/*)
    js/expedition/        data.js (overrides) · shim.js · encounter.js · campaign.js (quests, party, banter) · run.js · actors.js · beats.js · hud.js · scene.js (combat) · scenes_town.js (inn, travel, grave)
    js/data, js/core      synced copies of the shipped engine (do not edit here; edit the original and re-sync)
    js/ui/                synced UI helpers + this folder's portal.js
    assets/, audio/, lib/ synced subset actually used by the demo
    docs/                 GDD v0.5 and the reuse map
