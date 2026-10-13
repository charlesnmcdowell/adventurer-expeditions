# Bathhouse Rest scene — 12 October 2026

The approved painting is integrated as a lazy iframe at `assets/expedition/bathhouse/`. A successful paid Rest in the story inn or retained Arcade inn opens it. The scene itself is silent; existing inn music continues. Return to inn and Escape close it. Pause stops environmental motion; reduced-motion preference starts paused. No new voices or music were generated.

The source master and preview are in the sibling `adventurer-expeditions-source-art/bathhouse-preview-20261013/`. `bathhouse-original.png` retains the first painting; `bathhouse-corrected.png` and the current `bathhouse.png` contain the anatomy correction. The built-in image generator produced the corrected master at `C:/Users/charl/.codex/generated_images/01a08689-8a63-7050-af70-d20000aa6227/exec-51de25fe-7e7b-4c65-813a-ebd708ec39be.png`. It was copied, not redrawn or cropped, into the game. One anatomy edit was generated; existing scene motion was reused.

Edit brief: separate the kneeling East Asian attendant's two knees from Hiro's shin, while preserving the approved adult characters, bathing wraps, composition, room, lighting and environmental-animation alignment. The corrected painting was visually inspected at full scene size.

The 24-second shader loop affects only masked water, falling/pouring highlights, low steam, distant foliage, lantern light and moon glow. Character faces and bodies remain static. `check.cjs` in the source folder checks the loop seam and unchanged face regions against moving water/leaves. The game uses the same shader plus same-origin pause messages from the parent dialog.

Gameplay verification: `node test/browser_story_inn.js` covers chapter-one return, paid healing, reload without double payment, repeated Rest, affordable/unaffordable/full-health states, chapter-two continuation, phone layout, and Arcade input restoration. Screenshots and the report are in `test/reports/story-inn/`. The public chapter-one package is verified separately before staging into the website checkout.
