# Local combat animation pilot — October 2, 2026

Ready for an in-game art playtest after technical verification. This is a focused Hiro/Alpha pass, not a claim that every monster has been redrawn.

## Changes

| Clip | Drawings before → after | Playback duration |
|---|---:|---:|
| Hiro Katana Slash, level 1 | 6 → 12 | 590 ms, unchanged |
| Hiro short hit reaction | 3 → 6 | 350 ms, unchanged |
| Alpha attack | 6 → 12 | 570 ms, unchanged |
| Hiro cleave against Alpha | 8 → 16 | 1,620 ms, unchanged from the existing runtime hold override |
| Alpha defeats Hiro | new, 16 | 2,110 ms + 180 ms approach |

The normal slash and Alpha attack retain their original logical contact times (210 ms and 200 ms). The cleave's contact remains at 520 ms, now frame 6; the wolf disappears by frame 11. Camera slow motion still applies to Hiro's tapped finisher. The Alpha's fatal sequence uses the normal scene clock, with no additional slow-motion multiplier. Pause freezes it.

New art was generated using the built-in image tool and existing Hiro/Alpha references. Wide-pose registration, uneven source gutters, green-screen removal for the hit sheet, and fixed anatomical body references are recorded in `docs/art/combat-pilot-20261002/registration.json`. No optical-flow limb morphing or frame duplication was used to claim extra drawings.

## Enemy finisher behavior

- Pause → **Enemy finishers** enables the Alpha pilot. Default off; saved separately from a run, so Start over preserves the preference.
- Only a direct, already-lethal Alpha hit on Hiro can trigger it. It adds no damage or execute threshold. Poison/bleed deaths, other enemies, and surviving hits retain the ordinary presentation.
- Stylized blood and damaged armor; no dismemberment. This was the conservative art choice where the requested gore level was unspecified. The image-generation capability test succeeded; later bespoke scenes still require their own art review.
- Turning it off uses the existing ordinary defeat. There is no separately generated blood-free monster finisher.
- Only the trusted `website` release target allows it. CrazyGames, Poki, and unknown targets cannot enable it, including from a saved preference. The CrazyGames export excludes the entire `assets/expedition/adult/` tree. A future Poki packager must retain the same exclusion.
- Cancellation/scene shutdown settle pending playback and remove the paired image. The normal defeat flow skips a second kneeling animation after the fatal tableau.

## Rebuild and source preservation

Run `python tools/build_combat_pilot.py` from the Expeditions repository. It rebuilds only these clips, appends versioned pilot texture pages, and rebases atlas canvas offsets while retaining unrelated frames and original texture page pixels. Do not run the historical full art rebuild over these manifests.

Masters: `../adventurer-expeditions-source-art/astra-v4/combat-20261002/`. Prompt/reference records also live in `docs/art/combat-pilot-20261002/prompts.json`. Source masters are outside the runtime repository; runtime atlases, reproducible intake code and registration records are in Git. Old generated drafts remain in the Codex image output folder and are not shipped.

Original `../adventurer/` and synced shared files were not edited. Existing local inn wardrobe changes were checkpointed separately at `a6e14ae`.

## Verification

- Baseline `npm test` passed. The browser gate initially expected the September 27 tutorial; current code/documentation uses September 28 readiness-window reminders. Updated the assertion, preserving first-use order and one God Aura lesson. Baseline and post-change two-quest ship-allowlist journeys passed in installed Chrome. Bundled Playwright Chromium is missing on this machine; tests used `channel: chrome`.
- `npm test`: simulation, actor lifecycle, camera restoration, atlas closure, registration, shipping budget, pacing and enemy-finisher policy checks.
- `node test/browser_combat_pilot.js`: live clip capture, actual menu toggle, lethal death routing, pause/resume, cancellation on scene restart and on disabling the setting, normal off-state death, portal preference denial, absent portal menu row and zero adult asset requests.
- Cold-cache local: about 17.60 MB to visible gameplay, 18.68 MB after audio unlock. Portal-policy test: about 16.70 MB and 17.78 MB respectively. Desktop plus emulated phone portrait/landscape, no findings. These are local HTTP/profile measurements, not an uploaded portal or physical-phone certification.
- Test-only frozen export: `dist/crazygames-combat-pilot-policy-20261002`; verified no adult art directory and a locked portal target. This is policy evidence, **not** a submitted or content-reviewed release candidate.
- Local package approximately 48.86 MB vs 45.62 MB before this pass. Most later-location art still loads on demand. Original atlas pages retain unrelated frames, so the pilot intentionally trades some package bytes for safe rollback.

Playtest the visual transitions, especially the Alpha's scale at the start of paired clips, blade readability, and the new defeat. Approval is still the user's judgment. Other enemies and the Alpha's pin/parry finishers remain outside this pilot; do not expand the art spend until this pass is accepted.
