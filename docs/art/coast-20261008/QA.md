# Coast combat QA — October 8, 2026

Verdict: technical preview checks pass; visual release approval is withheld.
Scope: four Coast review atlases (116 frames), the scenery preview and the
existing game regression suite. Coast is not a playable quest yet. No gameplay
or art was modified during this QA pass.

## Findings

1. **Hydra neck continuity — release blocker.** Five heads are readable in
   neutral poses, but attack frame 3 and hit frame 2 do not maintain a clearly
   traceable five-head arrangement. Some overlap is natural; the changing neck
   layout is not convincing enough to approve as continuous motion. Review
   these against their adjacent drawings and repair only the affected poses.
   Crop/alpha adjustments cannot invent the missing or obscured anatomy.
2. **Crab attack transition — polish required.** Attack frames 2 → 3 jump from
   a high raised claw to a horizontal extension with little intermediate arc.
   The holds are only 55/45 ms. Add a focused bridge drawing or revise that
   transition; do not regenerate the whole roster. Twelve drawings alone do
   not guarantee smooth motion.
3. **Toad hop registration — polish required.** Approach frame 1 is a springing
   pose, but its registration puts the lowest toe on the same floor as the
   grounded poses. The intake only assigns flight offsets to the vulture.
   Author the toad's hop arc and landing anchors before accepting locomotion.
4. **Review is not an in-game scale check.** The gallery fits each species to
   its own canvas (once across all clips); the toad gets a smaller display
   scale because its tongue extends so far. This avoids crop changes during
   playback but cannot establish final size relative to Hiro or validate
   normal-to-paired-finisher transitions. Those require a combat-stage review.

## Passed

- `npm test`: simulation, art/animation lifecycle, finisher policies/removals,
  shipping closure and existing size checks.
- `node test/browser_coast_combat.js`: four atlases, all 116 frames nonempty,
  frame rectangles inside atlas bounds, valid contact indices, no page/network
  errors in installed Chrome.
- `node test/browser_coast_scenery.js`: three layers, fixed fighting ground,
  moving far/near layers, four sky/weather states, stable update-listener count
  after switching, selected music playback.
- Full contact sheets inspected for all 116 frames. No neighboring-pose
  fragments or rectangular backing observed in the cleaned sheets.
- Per-clip reference height is constant; source extraction records report no
  main silhouette touching the outer source boundary. These are technical
  checks, not proof of stable painted anatomy.
- Attacks have twelve frames, 690 ms total, contact at 325 ms. Their pending
  integration has not changed current live combat timing.

## Evidence and limits

Local captures: `test/reports/coast/qa/{crab,toad,vulture,hydra}-all.jpg`.
Automated results: `test/reports/coast/combat-results.json` and `results.json`.
The full visual review used registered frame contact sheets and timing data;
no claim of a completed Coast encounter or phone-device playtest is made.

Coast Hiro/enemy finishers, travel choreography, quest registration, balance,
and the complete journey remain unfinished and outside this pass's approval.
Keep Coast locked. Repair the three specific animation findings, then review
the actors beside Hiro before spending on broad replacement art.

## October 9 repair follow-up

Three targeted findings addressed in the preview: Hydra attack 3 and hit 2 repainted with five heads; crab bridge inserted (13 attack poses, unchanged 690 ms total and 325 ms contact); toad hop offsets authored. Four atlases now contain 117 frames. Browser checks and npm test pass. Registered adjacent-pose comparison inspected in test/reports/coast/qa/repairs.jpg. This does not approve unfinished pairs or unlock Coast.
