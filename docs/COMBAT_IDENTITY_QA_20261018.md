# Combat identity and sprite QA — October 18, 2026

Local playtest candidate. No publishing or changes to the original Adventurer.

## Findings fixed

| Area | Before | Current behavior |
| --- | --- | --- |
| Winston | Included in the previous spell-only group; green palm cast and shadow projectile | Basic attack, Venom Fang and Ending Cut all use his hooked knife. Ending Cut retains the original skill ID, power, status payload and cooldown; its direct hit is physical/melee. The old magic drawing remains archived in the atlas. |
| Enemy archery | Generic basic attacks walked up and swung | Painted arrows leave the bandit archer's bow, Gbenga's crossbow and the Citadel ranger's bow. Killing Angle uses an arrow. Companion Itsuki and Kaito retain their bow releases; Kaito's Backstab retains his dagger. |
| Enemy magic | Several caster basics looked like melee; Citadel custom skill names missed the effect catalog | Basics use the actor's established fire, frost, lightning, nature or occult theme. Citadel volleys, wards, binding and curses use the existing painted effects. Their simulator power/statuses remain unchanged. |
| Weapon status moves | Some guards/stances showed healing sparkles; two blade users inherited bow presentation | Shields, counters, formations and evasive footwork use weapon/guard/recovery poses. Bahadir's greatsword and the tunnel kobold's hooked blade deliver their source-kit attacks through contact. Shadow abilities use smoke; magical wards remain magical. |
| Release timing | Femi and five Arcade actors recovered before releasing their effect | Femi, Citadel wizard/ranger/enchantress, hag and spider release on zero-based frame **4**, anchored to the painted hand, staff, bow or mouth. Six cast aliases reuse existing attack drawings and timing. No frames repainted. |
| Alpha recovery | Its missing tumble clip fell back to idle, skipping movement home | A looping idle used for recovery now carries the actor back to its own grounded formation slot in **260 ms**. Regression covers all four return aliases. |
| Effect-sheet bleed | Arrow volley contained part of a mark; arcane cascade contained part of a ward | Re-extracted sixteen affected cells from the retained masters with a reviewed seam and padded framing. Original first eight cells of each atlas remain visually identical. Both original atlases and masters remain. |
| Status readability | Single letters and symbols such as F, X, Z | Short labels such as Frozen, Exposed, No heal, Poison and Guard. Labels wrap into centered rows no wider than **180 game pixels**, and clear when their status is removed. No persistent body glow added. |

## Coverage and evidence

- All **59 campaign identities**, including optional branches, plus **18 Arcade enemy identities**: **361 move presentations** exercised through the real browser director and packed art. Hit reactions follow projectile arrival; actors return home; no JavaScript errors. Focused reruns cover every changed guard/shadow action.
- **94 actor idle loops / 553 frames**, including Hiro and companions: registration and root stability checked in the browser. Contact sheets inspected for silhouette, facing, frame bleed and scale. No blanket regeneration or frame-count inflation.
- Both companion archers' basic and aimed shots checked at the painted release, in flight and on recovery. Eight additional campaign caster/crossbow/creature release screenshots checked. Spells, reflected shots and charges pass pause, hit-stop and interruption cleanup tests.
- Twenty status labels checked for readable text, wrapping, overlap and removal. Desktop and portrait viewport screenshots recorded. Portrait currently letterboxes the landscape scene; this is not a physical-phone usability certification.
- `npm test`, `npm run test:story`, `npm run test:ship -- --seed=1`, focused identity checks, 47 actor lifecycle contracts, effect lifecycle checks, caster/weapon/wolf browser checks and bow/status browser checks passed. Ship smoke test completed two quest clears and inn returns.
- Separate Hiwot/Winston balance fixture: **1,082/1,100 wins (98.36%) → 1,087/1,100 (98.82%)**. No stalls or zero-win encounters in either run. The direct-hit classification correction affects defenses; this is not a claim that every party composition has identical balance.

The exhaustive presentation test injects resolved events so every move can be seen. It does not prove that AI chooses every move in normal play. Idle and timing checks also cannot certify a commercial art grade; final aesthetic approval remains the user's playtest. Existing authored animations are retained, so closely related skills may share their character's attack pose. Actors without a dedicated defensive drawing hold their armed idle for guard actions rather than pretending to heal; this pass does not claim a newly painted guard animation for each enemy.

No image generation or voice credits were used. The two replacement effect pages total **1,344,224 bytes**. Rebuild hooks preserve the crop and release repairs; master hashes guard the effect extraction. The legacy Arcade allowlist measures **290.18 MB / 250 MB**, including effects now used by later boards. Existing website/mobile size work is separate and this pass is not a portal clearance.

## Repeat the audit

Run `npm run test:combat-identity` for the roster, delivery contracts, full browser move audit and bow/status checks. Run `node test/browser_idle_roster.js` for all idle loops. Rebuild the diagnostic pose montage with `python tools/review_combat_poses.py`.

Committed summary: `COMBAT_IDENTITY_QA_20261018.json`. Reproducible local screenshots and detailed results: `test/reports/combat-identity/`, `test/reports/idle-roster/`, `test/reports/magic-polish/` and `test/reports/story-projectiles/` (generated outputs, not source art).
