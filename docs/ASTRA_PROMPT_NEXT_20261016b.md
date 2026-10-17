Polish and prove the companion release of Adventurer: Expeditions, then prepare the next website package (16 October 2026, after the live companion release).

PROJECT AND RULES
- Project: C:\Users\charl\The Sorcerer Sword ARPG\adventurer-expeditions. Local work only: no publishing or pushing. Hiro (or the other session) publishes the website.
- The original game in C:\Users\charl\The Sorcerer Sword ARPG\adventurer is read-only, along with the synced shared files (js/core, js/data, js/ui).
- Read first: the top of docs/CHANGELOG.md, especially "Website: companions, welcome and Iaido art published (live)" and your two companion entries before it.
- Keep working everything that's live:
  - companions on (S.Companions.enabled=true), knocked out not finished, Hiro-only defeat;
  - the sliding welcome with Accept, and the party check;
  - Hiro's voiced choices and the 560-segment companion dialogue;
  - Counter (2 blocks, deflects projectiles), Iaido Draw (3.6, 22 s) and its new art;
  - the per-opponent hit scale and +25% enemy HP per ally;
  - the tutorial in the first two fights won;
  - Retry keeping its music;
  - the password gate (chapter 1 free, "Hiro" opens 2–6).
- Player-facing text sounds casual and plain, not like AI. Hiro (the character) uses no "cyber" and no "purple" glows.

WHAT'S LIVE NOW (charlesnmcdowell.github.io/audiobook2-audio, commit 15625c2, 0.479 GB of 1 GB)
The package built from 9f623e3 has companions, the welcome, the party check, and Iaido and deflect art. Your draw-cut correction (checkpoint fcc1a67) isn't in it.

1. FINISH THE HIRO DRAW-CUT ART CORRECTION
   - Complete the Iaido Draw correction you checkpointed at fcc1a67.
   - Keep 16+ distinct drawings, contact and release at the blade-clear frame, body registration, and a white or steel streak across the enemy line.
   - Re-check it against three enemies and with a deflected bolt in real fights.

2. PARTY FORMATION ON SCREEN (seen in the live chapter-two fight)
   - With two companions, both stand bunched just behind Hiro. The rear companion's feet sit behind the bottom-left skill buttons (the HUD icons occupy roughly x < 300, y > 500 on the 1280×760 stage).
   - Give the party a readable formation:
     - Hiro in front;
     - companions staggered behind and slightly up-stage, with clear space between bodies;
     - nobody's feet, weapon or HP bar under the HUD buttons, the portrait or the hand prompt.
   - Check at 1280×760 and 390×844, and with every pair of body sizes (tall Bahadır or Beau with short Winston, a wide caster pose, a bow at full draw).
   - Companions keep their body scale; never shrink them to fit.
   - Add a browser check that fails if any party member's visible bounds overlap the HUD buttons or each other's bodies by more than a small margin.

3. PROVE THE FULL FLOW IN REAL PLAY (fresh save, no dev jump for the first part)
   - Play the end of chapter 1 into chapter 2: inn, road trip, title card, Hiwot's welcome (slide, jingle, styled name, hook, Accept), **the party check**, then the first fight with Hiwot beside Hiro.
   - Then a later chapter-2 recruit's welcome, and the party check before chapter 3, including a swap.
   - Screenshot the party check itself. An outside live check didn't detect it, so confirm it really appears at every chapter start from 2 on, and after each welcome.
   - Use the dev chapter jump to spot-check chapters 4, 6, 9, 12 and 14:
     - the default pair;
     - one companion who has left or died, who must not appear;
     - one with a knockout, back next fight.

4. BALANCE PASS WITH COMPANIONS
   - The default party wins 1,081/1,100. The finale (chapter 14, encounter 3) is the weakest at 11/20.
   - Run a short attrition check: a chapter played fight to fight on carried health without resting, chapters 2, 6 and 10.
   - Raise the finale only if needed; don't nerf Hiro's 3–4-hit rule.
   - Report before and after.

5. WEBSITE PACKAGE: PREPARE, DON'T PUBLISH
   - Rebuild and verify the package with your art correction and the formation fix (SITE_THROUGH 6, chapter 1 public, password to 6).
   - The verify must include the party check and the formation bounds check.
   - Also build and verify a **SITE_THROUGH 14** candidate in a separate output folder. Your projection is 814 MB of the 1 GB, and Hiro may want the whole campaign behind the password. Report its size and verify result.
   - **Staging note:** `site_demo.js stage` refuses the demo checkout because of README.md, .nojekyll and the untracked `_to_delete` folder (Hiro's audio chunks; never delete them). Teach `stage` to leave those three alone and to remove only files from a previous package that the new receipt doesn't list. Test that before Hiro's next publish.

DONE MEANS
- Screenshots in test/reports/:
  - the corrected Iaido Draw;
  - the party formation with three different pairs, desktop and phone;
  - the party check;
  - the full chapter 1 → 2 → 3 flow.
- `npm test`, `npm run test:ship`, `npm run test:story`, `node test/story_balance.js --gate` and all story and companion browser tests pass. Both site verifies (6 and 14) pass.
- A dated CHANGELOG entry: what changed, how it was verified, sizes, and what's left.
- Commit only your own files after checking git status. Nothing is published.
