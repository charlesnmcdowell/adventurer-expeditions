# Astra v2 integrated — September 20, 2026

The approved art is now in the local Expeditions game:
http://127.0.0.1:8742/index.html?revision=astra-v2
Existing saves are preserved. Use **Replay the road** at the inn to revisit the
tutorial. Nothing was published or changed in the original Adventurer project.

## Changes

- Hiro:175 frames across 27 clips. Replaced the old movement and finisher
  selections with the 16-frame relaxed run, four-frame sheathed idle and six
  wolf/plant finishers; unaffected v1 combat art remains.
- Wolf tier1 uses the approved overhead strike and sword twirl; plant tier1
  uses stem iaido. The other four variants follow enemy identity and skill tier.
  Nonlethal hits never play a dissolving-victim clip; each paired finisher has
  one damage/contact event and waits through recovery.
- Extraction honors authored source polygons, body references and foot anchors,
  preserves alpha/silver blades and removes enclosed gray matte. Poses are not
  independently enlarged to fill their bounding boxes.
- Travel figure timing uses full frame holds consistently with combat.
  Victory settles into the new sheathed-idle loop.
- Inn: solo Hiro or Hiro+Bram painting follows the supported party. Candle,
  steam and hearth animate behind the menus, with pause, readiness and cleanup.
  Duplicate standing figures are removed.
- HUD: three painted manual skill icons and a noninteractive automatic Katana
  Slash badge. Tap, hold-to-read, upgrades and tutorial guidance remain intact.
- Ship allowlist includes Hiro's third atlas page, inn assets and skill icons.
  Raw masters, rejected candidates and review captures remain excluded.

The existing first-road lock remains: Hiro, art-ready Bram, ordinary wolves,
thorn lurkers and the gray-wolf leader. New recruitment/later quests stay gated.
This integration does not expand the agreed demo scope.

## Size and tests

Complete build: **17,828,737 bytes / 205 files**, leaving **2,171,263 bytes** below
the strict20,000,000-byte ceiling. Final cold gameplay download:13,743,116 bytes; 
after audio unlock:14,788,076 bytes. Hiro's three pages+JSON:4,759,828 bytes; 
inn:394,236 bytes;  skill icons+JSON:21,248 bytes.

- `npm test` passes simulation, roster/save guards,24 actor lifecycle checks,
  cinematic restoration, portal readiness, five inn lifecycle checks, atlas
  registration, dependency closure and the strict size boundary.
- Two complete upload-only tutorial clears pass manual skills, upgrades,
  travel, Replay, saved-state agreement and camera/time restoration. This ran
  before the final matte/staging polish; final art was then checked separately.
- Final actual-Phaser test checks all 44finisher frames, one contact per clip,
  permanent defeated-victim hiding, full recovery, fixed scale,16 run frames and
  four sheathed-idle frames. Exact final atlas hashes are recorded.
- Inn checks pass at 1280 px and 375 px: solo/Bram, effects, pause, party changes,
  restart/reentry, cleanup and locked options.
- Icon checks pass tapping, three-second holds, tutorial release, upgrades,
  locked/unlock behavior and missing-art/recruit fallbacks.
- Final startup checks pass desktop 1280x760, emulated phone 390x844 and 844x390,
  with SDK stub and 1800ms scenery delay. No missing assets/browser errors;
  gameplay hooks wait for visible assets and controls.

Evidence lives in `test/reports/astra-v2-journey/`, `astra-v2-startup-final/`,
`art-intake-v2/`, `inn-art/`, `skill-icons/` and `registration/hiro-v2/`.
Physical-phone and actual CrazyGames portal QA remain separate. These local
results do not guarantee platform acceptance.

## Rebuild and retest

```powershell
python tools/build_painted_art.py --actors hiro
python tools/build_inn_art.py
python tools/build_skill_icons.py
npm test
npm run test:ship
npm run test:art-intake
npm run test:inn
npm run test:icons
npm run test:startup
```

Approved masters and exact generation prompts remain in the sibling
`adventurer-expeditions-source-art/astra-v2`. This integration used deterministic
extraction/packing; no new artwork or voice credits were needed.
