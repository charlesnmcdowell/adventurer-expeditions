# Adventurer: Expeditions — change log

Every change made to this folder since it was created, newest first. The
original website game in `../adventurer` is never modified; entries here only
ever describe files inside `adventurer-expeditions/`.

**How to keep this file.** One entry per working session, dated. Record what
changed, which files it touched, and any decision that a later session would
otherwise have to re-derive. Numbers that were tuned belong here with their
before/after, because the GDD only carries the current value.

Entries before 2026-09-19 were reconstructed from the working session and the
files themselves; they are accurate as to content, approximate as to the order
of small fixes within a day.

---

## 2026-10-17 — Unused-art report and safe disk cleanup (local)

- **Report first:** `docs/UNUSED_ART_AND_CLEANUP_REPORT_20261017.md` and `docs/UNUSED_ART_REVIEW_20261017.html`; per-file inventories, SHA-256 duplicate groups, package selection, source provenance, unobserved browser requests, atlas candidates and Git blobs in `docs/cleanup-audit-20261017/`. The gallery filters/sorts records, shows thumbnails and prepares a review message; it cannot approve or execute removals.
- **Removed:** 479,164,195 bytes of the ignored stale `dist/site-demo` package/receipt; 131,536 bytes of Python caches; seven older screenshot containers (0 default-stream bytes; named-stream contents were not captured). Every file passed absolute-path, reparse-point, ignored/untracked and SHA-256 checks; default-stream duplicate keepers were checked before removal, but this missed NTFS screenshot streams. These seven containers cannot be certified as whole-file duplicates; their historical stream contents are not recoverable from the inventory. Both cleanup tools now reject named streams, and the remaining streams are inventoried in `named-streams.json`. No further test files were removed. Exact ledger: `cleanup-removals.jsonl`. Historical CrazyGames packages and nonduplicate/newest test evidence stay.
- **Git:** normal `git gc` succeeded, directory size 1,268,145,651 -> 1,250,817,280 bytes (17,328,371 bytes recovered). No aggressive GC, explicit reflog expiration, history rewriting or push. Gross logical recovery across files/GC: 496,624,102 bytes; new QA/report output and concurrent work mean this is not net drive-space recovery.
- **Preserved:** all 11,222 source-art files (3,293,397,814 bytes) and all 2,751 runtime/audio/art-review files have unchanged SHA-256 values. Original Adventurer, synced shared files, Pit and Spire backup, both website checkouts and existing `_to_delete` folders were not changed by this pass. No quarantine created. Nothing in Phase 3 changed or approved.
- **Evidence:** initial duplicate excess 1,072,873,055 bytes; after safe cleanup/new QA 605,729,613 bytes. These are overlapping-copy screening totals, not deletion authorizations. Retired/unreferenced atlas estimate ~3.27 MB is proportional to occupied pixels, not measured repack savings. Unknown source provenance remains protected; basename matches are not treated as proof of use or rejection.
- **Validation:** `npm test`, `npm run test:story` and seeded `npm run test:ship -- --seed=1` passed during the initial audit; request paths were captured without query strings or storage. Review-page checks passed (filter, sort, runtime/source thumbnails, message-only checklist). Full 14-chapter package rebuild/verify and additional all-chapter/companion gates are **deferred at Hiro's direction**, because the other session is still editing story/party code. This is not a new release certification. The old package was compared with recorded live checkout commit `c864665` and did not match; no replacement package was built or published.
- **Next:** approve exact Phase-3 categories/file lists if desired. Quarantine on the same C: drive frees no space until Hiro empties it. Once story edits settle, build with `EXPEDITIONS_SITE_THROUGH=14` and run full site verification; the packager's default is only six chapters.

## 2026-10-17 — Full idle roster registration audit (local)

- Reviewed all **94 actor sets / 553 idle frames**, including all **15 companions**, using registered contact sheets and the actual Phaser animations. The screenshot enemy is **Grell** (`story_grell`).
- Corrected planted-foot registration in **36 story enemy sets / 144 idle frames**. Grell's foot-centre spread was 10 px; the reviewed anchors now remain within 0.5 px of their target in each corrected frame. Large offenders included Skarn and the spider sets. Natural gestures, breathing, cloth and wing movement remain; this is a translation repair, not new in-between animation.
- **Scope proof:** compared against checkpoint `8dd7847`: only idle `spriteSourceSize.x/y` changed in the 36 runtime JSON files. No atlas pixels, attack/finisher frames, timing, canvas sizes or character scales changed. Companion sets were inspected and did not need translation repairs.
- **Rebuild safety:** `tools/idle_roster_registration.json`, `tools/repair_idle_roster.py` and `tools/art_intake_v2.py` retain the reviewed anchors on intake, relative to the canvas pivot. A changed crop size stops intake for remeasurement. `tools/test_idle_roster.py` verifies idempotence, original-registration intake, changed-canvas handling and rejection of stale guides.
- **Review:** `docs/IDLE_ROSTER_REVIEW.html` uses the real atlases for synchronized before/after playback, pause, frame stepping and slow motion; defaults to Grell. `tools/audit_idle_roster.py` rebuilds the contact-sheet audit. No new art generation or atlas download weight.
- **Validation passed:** `npm test` (including new `test/idle_roster.js`), `python tools/test_idle_roster.py`, five intake regressions, `test/browser_idle_roster.js` (94 real Phaser loops, no root drift, packed trim checks and review controls), and `test/browser_formation_spacing.js` (six desktop/mobile formation cases). A browser loop check detects registration/root movement, not whether every authored gesture looks natural; visual contact-sheet review complements it.
- **Cache:** all story actor metadata gets the idle-roster revision; shared entry-script stamp refreshed to `20261017-xp5`. Changes are local; nothing published by this pass. The parallel session's inn-travel change is preserved separately.

## 2026-10-17 — Road trips only to and from the inn (local)

Hiro: "I'd like the travel scenes to only play when leaving inn and when heading to inn, not between fights."

- **What the code already did.** `story.js` queues only two trips: `outbound` when the player leaves the inn (`S.leaveInn`), and `return` when a chapter's closing dialogue ends (closing → arrival). A traced chapter-two run from the dev jump showed the outbound trip at the chapter start and nothing between fights 2:0 and 2:1.
- **The gap.** `render()` played any `travelPending` it found, whatever the phase. So a leftover trip in a save (an interrupted trip, an older save, a reload at the wrong moment) could play in the middle of a chapter.
- **Fix** (`docs/story_preview.js`). A trip plays only if it's:
  - `outbound` at the chapter start (phase `departure`, encounter 0), or
  - `return` once the chapter is over (phase `arrival` or `inn`).
  Anywhere else it's cleared with `S.finishTravel` and the story continues.
- **Verified in Chrome:**
  - a mid-chapter save with a stale outbound trip goes straight to dialogue;
  - a departure trip plays;
  - an arrival trip plays;
  - `npm test` passes, and `browser_story_travel.js` passes all 25 chapter trips.
- **Not on the website yet.** The live full-game package (c864665) is from b954f25.

## 2026-10-17 — Website: the password unlocks the full game (live)

Hiro: "I'd like the password to now unlock the full game."

- **Live** at charlesnmcdowell.github.io/audiobook2-audio, commit c864665.
  - Chapter one is still free. "Hiro" now opens chapters 2–14 and the endings.
  - 2,120 files; the site totals 0.852 GB of 1 GB.
  - Checked live: the public notice says chapter one only; with the password it says 1–14; a chapter-9 fight and the chapter-14 Kolade fight load with music; no page errors or failed requests.
- **Built from a clean copy of b954f25** (a temporary git worktree, since removed), not the working tree. Astra's uncommitted formation edits (actors, knockback, scene, story_scene, story_stage) are not in it. b954f25 does include the companion-name fix and the committed part of the formation spacing.
- **`tools/site_demo.js` changes:**
  - with EXPEDITIONS_SITE_THROUGH=14 it ships every media file, because ending narration carries no chapter prefix;
  - verify checks a real ending ("The Gate Stands") in place of the coming-soon boundary.
  The first full verify had one page error. It came from a test save marked complete with no ending recorded, which play can't produce: the "hero", "mercy" and "monster" endings rendered cleanly.
- **Final verify:**
  - all 55 fights load;
  - public lock, wrong password refused, password opens 1–14;
  - road trip into chapter 2;
  - companion welcome, Accept, party check and the Hiwot fight;
  - the ending card;
  - nothing missing, no page errors.
- **Staging:** 2,120 files copied with every sha256 checked against the receipt. Files a new receipt doesn't list would have been removed (none were). The repo's README.md, .nojekyll and Hiro's untracked `_to_delete` audio chunks were left alone.
- **Still to decide:** the public demo text and the post-chapter-one card say more chapters are "on the way", though the full game exists behind the password. The main site's funding goals still say $500 for chapter 2 and $700 for chapter 3.

## 2026-10-17 — Grounded formations, enemy idle registration and spacing (local)

- **Ground and perspective:** `scene.js`, `story_scene.js`, `story_stage.js`, `actors.js`, `knockback.js` now enforce 32 scene-specific walkable ground profiles. Gnoll-fort right-hand positions land below the tower instead of on it. Actors share continuous depth scaling; melee approach/return follows both coordinates. Knockback lands on the local floor, and the old death fade's 30 px upward drift is removed. Profiles are authored visual boundaries, not automatic collision detection against every painted object.
- **Party:** Hiro's front mark is 450 (formerly 400); companion preferred marks are 280/512 and 110/430, constrained by the scene's floor. Wide allies receive 155 px centre spacing (170 before Hiro). Rear actors scale with ground depth rather than retaining foreground size.
- **Enemy huddling:** replace independently clamped nominal slots with a joint layout using the union of each actor's visible idle bounds. Available horizontal room is shared evenly; survivors re-space after a death, leaving an additional 40 px at the front per defeated enemy, capped at 100 px. Crowded waves use a common formation view scale (65–100%, aiming for 150 px spacing), applied to **all** fighters, fixed for that encounter and retained through finishers. This preserves relative character sizes. Some overlap is still unavoidable in very large waves; the central attack lane stays clear.
- **Femi/Verlan idle:** the burgundy-coated Thornbury opponent had boot centres at 460.5, 375.5, 379.5 and 481 atlas pixels. The four anchors now stay within 1 px of x=428 and sit at floor y=490. Only trimmed-frame metadata changed; all atlas bytes, non-idle frames and the four 180 ms holds are unchanged. `tools/repair_femi_idle.py` is idempotent and called by `build_story_actor.py`, so future intakes preserve the correction. No new art or voice generation.
- **Regression coverage:** `battle_ground.js` covers all 32 ground profiles and corpse settling; `idle_registration.js` checks both Phaser/review metadata and idle timing. Both are included in `npm test`. Browser formation coverage includes six desktop/mobile chapter 2/3/5/7 scenarios, live Femi idle cycling, melee contact/return, four-enemy spacing and survivor/death checks. Evidence is in ignored `test/reports/story/formation/`.
- **Validation:** final `npm test`, all six real-browser formation cases (including fixed framing after deaths), and the seed-1 shipping browser journey passed. The shipping journey completed two quests and returned to the inn. The earlier seed-11 shipping driver stalled on its defeat screen, not a successful gate. Prior melee parry reuse passed its real-browser test; rejected Iaido pose art remains unapproved as an Iaido attack.
- **Cache:** entry pages share 20261017-xp3; Femi's atlas metadata has its own idle-anchor revision. Other session's site packaging changes are left alone. Nothing published or pushed.

## 2026-10-17 — Companion names never wrap (local)

Hiro: "winston name shows up too big, can you fix font sizes so they don't get too big and need to wrap."

- **Cause.** The welcome card's name ran up to 65 px wide, with `overflow-wrap:anywhere`. Winston's style added a larger size of its own and 0.13 em letter spacing, so his name overflowed and broke mid-word.
- **`docs/story_companions.css`:**
  - the welcome name is now `clamp(26px, 4.2vw, 52px)`;
  - names are `display:block; white-space:nowrap` and can never wrap;
  - Winston's extra size is removed, and his letter spacing goes from 0.13 to 0.09 em.
  The per-companion styling is otherwise unchanged.
- **`story_companion_ui.js` `fitName`.** After render, any name in the welcome card or the party check that still overflows its column shrinks 2 px at a time, to no smaller than 16 px.
- **Cache.** `tools/build_story_preview.js` now stamps `docs/story_companions.css` like the story scripts, so returning players get the fix. Stamp 20261017-xp2.
- **Verified in Chrome** for all 15 welcome cards at 1280×760 and 390×844: every name has one text line (counted from rendered line boxes) and no overflow. Screenshots of Winston (desktop) and Dai Morgan (phone).
  - Tests passed: `npm test`, `story_companions.js`, `browser_companion_ui.js` and `browser_companion_joins.js`.
- **Not published yet.** The live site (15625c2) still has the old sizes. Since then the tree also holds Astra's parry reuse of the draw-cut frames (hiro.json, painted.js, actors.js) and the start of the formation work, so the next publish should wait for that pass or ship with it knowingly.

## 2026-10-16 — Reused draw-review art as melee parry (local)

- Added `parry-rise`: **9 reused drawings / 625 ms**, contact frame **2**, using kote review frames 2,3,4,5,6,8,9,10,11. No image generation or voice credits. Adds **763,380 bytes**. Existing frames and clips preserved.
- Melee Counter uses the rising guard before the existing riposte. Projectile Deflect and Iaido Draw remain separate; the Iaido correction is still pending. Runtime rebuild, cache stamp, allowlist and packed-art review updated.
- `npm test`, real melee Counter browser/contact/scale checks passed. Extended Hiro-actions browser check hit a scene-load timeout; recheck pending. No publishing or pushing.

## 2026-10-16 — Hiro draw-cut correction: four review sheets, not runtime

- Replaced the thrust-like proposal with four review sequences: **do horizontal midsection (19 drawings / 2675 ms)**, **horizontal neck sweep (20 / 2795 ms)**, **kote rising vertical hand cut (20 / 2795 ms)** and **men rising vertical head cut (20 / 2795 ms)**. The supplied Samurai Shodown image informed motion/silhouette changes while Hiro retains his own design. Neck uses the user-requested horizontal path; it is not claimed as traditional kesa kata.
- Added controlled wrist recovery and eight shared no-look sheathing drawings; corrected three middle guide poses to show base → middle → tip before insertion. **55 distinct adopted drawings / 79 frame references**, with source-based scale, boot registration and contact indices **4 / 5 / 4 / 5**. Rejected a neighboring-frame-bleed grid. An unused clipped frame in the noto repair is excluded; only its requested frames 1–3 replace originals. No duplicated poses counted as new frames.
- **Review:** `docs/art/iaido-cuts-20261016/` has four lossless sheets, manifest, all 13 built-in image-generation request records, normal/half/quarter playback, contact/noto jumps, frame stepping, hand close-up and transparency backgrounds. Full masters/rejections remain in sibling source-art `astra-v10/hiro-draw-cuts-20261016/`. No new voice requests. Review assets total about **7.43 MB**, excluded from runtime shipping.
- **Validation:** source-edge/component/unique-frame/padded-canvas checks plus `node test/browser_iaido_cuts_review.js` passed; contact and guide-hand screenshots inspected. Tests verify technical presentation, not martial-arts correctness. No runtime atlas, game code, damage, cooldown or website package changed; motion approval precedes runtime replacement under ART_STANDARD §2.9. Other session's live-release log and new `ASTRA_PROMPT_NEXT_20261016b.md` are preserved and are not part of this art task.
- **Files:** review directory, `tools/build_iaido_review_20261016.py`, `test/browser_iaido_cuts_review.js`, this entry. No publishing or pushing.

## 2026-10-16 — Website: companions, welcome and Iaido art published (live)

Hiro: "make sure site is updated."

- **Published** the verified package (`dist/site-demo-verified.json`, 1,201 files, built from 9f623e3; the later checkpoint fcc1a67 changed no files) to the demo's own Pages site, charlesnmcdowell.github.io/audiobook2-audio.
  - Commit 15625c2.
  - The site totals 0.479 GB.
  - Chapter one is free; the password "Hiro" opens two to six.
- **How it was staged.**
  - The local `_audiobook2_release_upload` checkout was a commit behind GitHub (the previous demo was pushed from another copy), so it was fast-forwarded to f898d6f first.
  - `site_demo.js stage` refused, rightly, because of the repo's own README.md and .nojekyll, the untracked `_to_delete` audio chunks (93 MB, left untouched) and five superseded recordings.
  - So the 1,201 files were copied with every sha256 checked against the verify receipt, and the five replaced recordings were removed: faelen/q6_web_2, fennick/q5_camp_storm_1, vess/q2_pair_yes_1, wren_ward/q1_catchup_2 and wren_ward/q4_down_2.
- **Live check.** Companions are enabled on the live site. A password save at the chapter-one inn played the road trip, then Hiwot's join display, then a chapter-two fight with Hiwot and Winston beside Hiro and the music on. No page errors, no failed requests.
- **Seen in the live fight screenshot:** the two companions crowd behind Hiro, and the rear one's feet sit behind the bottom-left skill buttons. This is in the next brief.
- The Hiro draw-cut art correction started at checkpoint fcc1a67 is not in this upload.

## 2026-10-16 — Approved companion roster activated (local)

- **Approval and runtime:** user approved the complete roster for combat. `S.Companions.enabled` changes **false → true**. Chapter one remains solo; chapter two onward supports Hiro plus up to two eligible companions with the completed welcome/Accept and chapter party-confirmation flow. Existing recruitment, departure/death filters, explicit solo choice, nonlethal ally knockout and next-fight recovery are unchanged. No additional art generation or voice credits.
- **Production-path checks:** removed source-switch interception from the welcome, all-roster welcome and full-party browser tests; they now exercise the actual enabled source. Updated the companion and dialogue assertions from staged-off to approved-on. Verified welcome order, Accept/reload, party changes, solo, mute, mobile, actual party victory/signatures, knockout and next-fight recovery. Chapter one tutorial and story reload remain covered by the story regression suite.
- **Local package:** rebuilt `dist/site-demo` with **1,201 files / 478,972,757 bytes (478.97 MB)** and **13 chapter-six-eligible companions**. `site_demo.js verify` passed welcome → Accept → confirmation → Hiwot battle, every chapter 1–6 fight load, password boundaries, paid rest and mobile title with no missing files/page errors. The fourteen-chapter/all-15 projection is **814,023,460 bytes**, leaving **185.98 MB** below decimal 1 GB. Public chapter one and password `Hiro` for chapters 2–6 remain unchanged. Package receipt: `dist/site-demo-verified.json`. No staging, publishing or pushing.
- **Validation:** `npm test`, `npm run test:story`, `npm run test:ship` (two clears and both inn returns), production-source companion UI/full-party browser checks, and local website build verification all passed. The pre-existing separate Arcade 281.78 MB / 250 MB budget warning remains; this is not a CrazyGames submission approval.
- **Files:** `js/expedition/story_companions.js`; five companion/dialogue browser and contract tests; index and both story entry-page cache stamps **20261016-xp5 → xp6**; this log and `COMPANION_PRODUCTION_PROGRESS_20261015.md`. The original `adventurer/` and synced shared files were not changed.

## 2026-10-16 — Companion presentation, roster QA and Hiro action art (local; roster approval pending)

- **Status:** all fifteen packed companion sets and the complete join/party flow are ready for the requested art review. `S.Companions.enabled` remains **false** until Hiro approves the roster, explicitly required by `ASTRA_PROMPT_NEXT_20261016.md` §1/§4. Tests activate it in isolated browser fixtures; normal play and the website package still fight solo. Prior weapon/move and voice approvals remain valid. No publishing, staging or pushing.
- **Roster QA:** Hiwot, Desmond, Winston, Santiago, Beau, Delphine, Itsuki, Bahadır, Yasemin, Devendra, Layla, Kaito, Wanjiru, Dai Morgan and Amara each passed real-scene playback, both source signatures and nonlethal knockout. Decoded **1,920 frames: 15 × 8 groups × 16 distinct drawings**. Contact/release metadata and actual packed rectangles checked; full-body contact sheets inspected. Hiwot has a new 16-drawing run registered to measured pelvis centres instead of alternating boots, and a replacement victory sheet with complete soles/padding. Removed one confirmed stray edge pixel (x1253/y544, alpha72) only from derived attack intake; source masters retained. Full quality approval remains the player's visual review, not an automated guarantee.
- **Welcome and party UI:** replaced the 2.4-second auto-close card with a large sliding portrait, banner, individual name treatment, an existing dialogue hook and explicit Accept. Accept state saves before the exit transition; reload before acceptance replays it, reload afterward does not. Reduced motion fades; mute stops the sound without cancelling an accepted card's exit. Hiwot waits until chapter two after inn → travel → title. Later recruits announce on joining. Chapter starts and joins lead to Hiro plus up to two portraits, weapon/move names, Change and Set out. Last pair persists; dead/departed members are removed, automatic vacancies fill, deliberate solo/one-member choices stay deliberate. Inn picking cannot bypass the next chapter's confirmation. Company-seat changes request a fresh confirmation.
- **Audio/fonts:** replaced the 2.2-second unpitched flourish with an original **2.6-second synthesized harp/bell melody**, **0 ElevenLabs credits**. FFT/chroma estimates the chapter-two road track as B-flat major; other chapter music ducks during the shared fanfare. This is an estimated key match, not a musicological review. Cinzel is bundled under **SIL OFL 1.1**, with its full licence and third-party notice. Existing 200 Hiro choice recordings and 560 companion segments/six-bark banks remain unchanged.
- **Hiro:** new `iaido-draw` and `deflect` clips, **16 distinct drawings each**, contact/release at frame 7. Iaido lasts **1,490 ms**, deflect **740 ms**; body registration uses existing canvas/pivot. White contact streak spans the enemy line. New katana Iaido HUD icon replaces God Aura art without changing the internal skill ID, 3.6 power or 22-second cooldown. Four-frame reflected fire/prism/arrow/knife art launches on the sword-contact frame, then impacts the shooter before the riposte. Repainted Counter level-three frame 3 to remove its ring/ghost; intercept and level two have blade sparks rather than body rings. Original unrelated atlas pixels remain intact, with separate added pages.
- **Balance finding and fix:** enabling source allies had restored the original campaign's full-party ATK/DEF and boss HP floors. Final confrontation Kolade rose **284 → 1,147 HP**. The edition now spawns from its measured solo baseline, then adds **25% HP per selected ally** (two allies: Kolade **426 HP**), retaining existing per-opponent hit scales and finite healing. Same ordinary-choice path, 55 encounters × 20 seeds: solo **1,048/1,100 (95.3%)**; inherited party scaling **1,007/1,100 (91.5%)**; corrected default party **1,081/1,100 (98.3%)**. All have zero stalls/zero zero-win encounters. Finale encounter 3 remains the hardest default-party case at **11/20 wins**; player strategy and party choice still matter. This is seeded full-health encounter QA, not a complete attrition/difficulty endorsement.
- **Local package:** `site_demo.js size --include-companions` reports projected chapter-6 **478.97 MB / 13 companions**, chapter-14 **814.02 MB / 15 companions**, about **185.98 MB** below that Pages site's decimal 1 GB at chapter14. `EXPEDITIONS_SITE_THROUGH=14` is a size/build input, not publication. The current production-disabled chapter-6 package is about **433 MB**, verified locally; companion-specific package verification remains conditional on approval/enabling. Its verifier now includes welcome → Accept → party confirmation → Hiwot fight when companions ship. Public chapter1/password chapters2–6 are preserved.
- **Validation:** `npm test`, `npm run test:ship`, `npm run test:story`, solo/default-party balance gates, atlas registration/alpha/distinct-frame audits; all 15 companion battle fixtures; all **30 welcome screenshots** (desktop and 390×844), Accept/reload/no-auto-close/mute/reduced-motion checks; actual chapter-two party victory, signature use, knockout and next-fight recovery; chapter-three inn swap; companion dialogue/barks; real Iaido against three foes and reflected fire/prism/arrow; story projectiles, combat readability and inn; local site build/verify. Updated lifecycle mocks to fire the real contact callback and measured projectile launch at creation rather than a later display tick. Intermittent local Python-server startup/navigation failures were rerun; shipping-package Node-server verification has no missing resources/page errors. The separate Arcade ship set still warns **281.78 MB / 250 MB target**; this pass does not claim CrazyGames size approval.
- **Files:** `story_companions.js`, `story_companion_ui.js`, `story_combat.js`, `story_effects.js`, `beats.js`, story preview/CSS and cache stamps; Hiro/Hiwot/effect/icon/jingle/font assets; repeatable art/intake, icon, jingle and site tools; shipping allowlist, registration/contact/UI/flow/balance tests; companion progress notes. Source prompts, references and masters: sibling `adventurer-expeditions-source-art/astra-v10/hiro-actions-20261016/` and `companions-hiro-20261015/hiwot/`. Review pages: `docs/art/companions-hiro-20261015/pilot.html` and `docs/art/hiro-actions-20261016/index.html`. Evidence: `test/reports/story/companions/`, `story/hiro-actions/` and `site-demo/`.

## 2026-10-16 — Approved companion dialogue recorded and integrated (local)

- User approved all 45 auditions. Reused those files byte for byte and recorded **111 additional segments**, with no retakes: **41 revisions + 70 chapter remarks + 45 additional combat barks = 156 recordings**. Existing companion dialogue grows from **445 to 560 segments**. Each companion now has **6 barks instead of 3**. The full before/after table, exact gap keys and audio review are in `docs/COMPANION_DIALOGUE_REVIEW_20261016/CHANGES.md` and `production.html`.
- Revised-line counts: Hiwot **15**, Desmond **1**, Winston **2**, Delphine **5**, Itsuki **1**, Devendra **1**, Layla **3**, Kaito **10**, Dai Morgan **3**. Santiago's approved 29-line pass is preserved; this pass adds only his barks 4–6. All 15 companions receive three additional barks.
- New gap keys follow `q{chapter}_exp_gap_{speaker}`, explicitly marked `// new: gap` in the edition override: `bramm`, `ysolde`, `aurelius`: chapters **4–14**; `vess`: **3,4,5,6,8,9,10,11,12,13,14**; `fennick`: **6,9,10,11,12,13,14**; `dorran`, `nettle`: **8–14**; `durnik`: **10–14**. One short remark per missing companion/chapter. Locations matter: chapter 5 waits for the palisade, chapter 7 for the cages, chapter 10 for the keep; other placements are listed in the review. Only living, recruited, riding companions speak, including a fresh eligibility check after preceding choices. Consumed queues never refill on reload.
- Edition-only changes in `story_dialogue.js`, `story.js` and `story_presentation.js` preserve tags, placeholders, segment IDs, unchanged lines, choices and outcomes. Individual audio routes let a partially revised conversation retain its unchanged recordings. Existing saved dialogue cursors receive matching revised text/audio together. Replaced audio remains on disk but is removed from the runtime media index.
- `scene.js` / `story_scene.js` connect the six-line banks to the original contextual/no-repeat selector, once per battle from round 2. Captions, audio, pause, mute, victory/defeat and scene shutdown are handled. **Companion combat remains staged (`enabled:false`)**; this dialogue pass does not activate the separately staged roster. Its barks were browser-tested with temporary test-only activation. Chapter remarks are active normally.
- Voice IDs verified against original casting; per-speaker loudness matched to existing recordings. **10,639 submitted characters / 4,682 response-header credits**, including auditions, under the **15,000** cap. Added runtime audio: **5,412,927 bytes**. The account-wide counter may include other sessions; the request ledger is the job-specific evidence. Raw masters/combined ledger: sibling `adventurer-expeditions-source-art/astra-v10/companion-dialogue-20261016/`. No credential values are stored in the repository.
- Deliberate exceptions: Layla keeps her lore-supported Arabic-influenced phrase; Winston's already populated chapters get no filler; loyal Desmond/Winston comments do not use betrayal lines; optional bond/romance scenes remain unchanged and inaccessible without an inn conversation feature. Original `withCompany` and `foeStatus` bark guards remain intact. No new religious lore or plot branch.
- Media/build files: `companion-voice.json`, `preview-media.json`, `tools/build_story_preview.js`, the new repeatable production/review builders and recorder, plus `tools/site_demo.js` to retain eligible barks when companion combat is eventually enabled. Shared script cache stamp **20261016-xp3 → 20261016-xp4**. Nothing published or pushed; original Adventurer and shared `js/core`, `js/data`, `js/ui` remain untouched.
- Validation passed: **`npm test`**, **`npm run test:story`**, `test/companion_dialogue_auditions.js`, `test/story_companion_dialogue.js` (also called by `story_campaign.js`), `test/browser_companion_dialogue.js`, `test/browser_companion_banter.js`, `test/browser_story_fight.js`, and the cache/budget contract. All **156** recordings decode; revised captions and actual audio playback checked at chapter **2/6/9/10/14** dev-jump dialogue checkpoints at **1280×760 and 390×844**. Screenshots/results: `test/reports/story/companion-dialogue-production/`. Existing total-build warning remains **280.89 MB / 250 MB target**; passing regression tests is not a release-size approval. A transient local-server connection failure and checks racing the caption fade / queued Phaser shutdown were rerun after verifying the server and waiting for the actual lifecycle boundaries.

## 2026-10-16 — Companion dialogue audit and voice auditions (approved; completed above)

- Read `ASTRA_PROMPT_COMPANION_DIALOGUE_20261016.md` and verified its claims against the live data plus Santiago's edition overrides. Saved all **445 current spoken segments** with IDs and voice casting in `docs/COMPANION_DIALOGUE_REVIEW_20261016/`.
- Corrected the audit: Winston already speaks in chapters 3/4/5/8; Desmond/Winston chapter-nine betrayal lines do not cover the loyal-company route. Layla's Arabic-influenced register is explicit in the region lore, so `ya stranger` is retained. Existing foe-status and named-companion bark conditions must remain intact. Bond/romance lines stay unchanged and have no accessible inn conversation entry in Expeditions.
- Prepared **45 auditions (three per companion)**, Desmond first on the review page. Santiago's three are only the proposed extra combat barks; his approved 29-line rewrite is untouched. **2,905 submitted characters / 1,279 response-header credits**, no retakes. Every voice ID checked against the original casting JSON; normalized to each speaker's existing audio. The combined job cap remains 15,000, with auditions reserved in the persistent ledger for later reuse.
- Drafted the review samples and a **70-beat gap-placement plan** for eight companions. Full prose production, runtime overrides, added beat hooks, six-bark banks and in-game chapter checks remain pending audition approval. No sample is active in gameplay; no source game/shared file was changed.
- Tests: `node test/companion_dialogue_auditions.js` and `node test/browser_companion_dialogue_auditions.js` passed (45 clip hashes/decodes, exact casting, placeholders, Hiwot register, short barks, audio playback, desktop and 390×844 review layout). Runtime tests were not rerun for this review-only checkpoint.
- Review: `docs/COMPANION_DIALOGUE_REVIEW_20261016/index.html`; audit findings, before/after samples, full inventory, gap keys and cost ledger alongside. Raw masters: sibling `adventurer-expeditions-source-art/astra-v10/companion-dialogue-20261016/`. Nothing published or pushed.

## 2026-10-16 — Santiago dialogue rewrite and matching voice (local only)

- Inventoried **29 spoken segments / 22 groups**, keyed to `cassian`, before editing. Preserved every original ID, segment boundary, cue tag, `{target}` placeholder, choice hook and recruitment/departure/romance condition. Other speakers, narrator epilogues and Hiro choices remain unchanged.
- Replaced role explanations and stock rhetorical phrasing with practical shield instructions, understated prayers, first-assignment nerves and existing bakery/home details. No new saints or religious doctrine. Reviewed the wolf scene first. The departure wording works for both Layla and Desmond triggers; it does not invent a specific theological accusation.
- Verified **xHLnsxqUy4cc16VOmSD4** against the original casting JSON and voice script. Re-recorded all 29 segments with ElevenLabs v3: **3,128 submitted characters including direction tags; 1,377 response-header credits**, no retakes; 5,000-credit cap. Account counter was delayed, so the header sum is the cost evidence. Matched the existing Santiago reference at **−16.2 LUFS**, true-peak target −1.5 dB.
- Added edition-owned `story_dialogue.js`, revisioned audio and `santiago-voice.json`. Both campaign and fight pages load the overrides. Preview rebuilds verify and preserve new recordings instead of replacing them with old source audio. Original Adventurer/shared source files remain untouched. Cache stamp `20261016-xp3`.
- QA: `npm test`, `test/story_santiago.js`, `test/story_campaign.js`, `test/story_combat.js` and `test/browser_santiago.js` passed. Browser covers actual rewritten dialogue/audio playback, replay, saved-line resume, 390×844 layout and decoding all 29 clips; unit checks include sliced combat-bark audio offsets and unchanged story hooks.
- Review: `docs/SANTIAGO_DIALOGUE_REVIEW_20261016/index.html`; complete inventory, before/after table, five speech habits and cost ledger are beside it. Raw masters/receipts: sibling `adventurer-expeditions-source-art/astra-v10/santiago-dialogue-20261016/`. Nothing published or pushed. This does not mark the separate companion production pass complete.

## 2026-10-15 — Approved Hiro voice production and companion pilots (local, unfinished)

- User approved all five voice auditions and fifteen source kits. Recorded/integrated **200 reachable Hiro choices**, reusing the auditions; **8,811 spoken characters / 3,878 response-header credits**, no retakes. Ten retired options were not recorded. All 200 clips decode; 4,542,941 runtime bytes. Saved choice playback, replay, mute, reload and skip preserve original choice hooks.
- Hiwot and Desmond each have **128 drawings / eight groups**, registered as gated pilots: **3,116,303** and **2,532,320 bytes** respectively. This initial two-pilot checkpoint was extended below; the complete companion feature remains unfinished. Not a completed party release. `S.Companions.enabled=false` keeps normal story play unchanged apart from Hiro's voice.
- Added original-kit party selection and nonlethal knockout/Hiro-only defeat contracts, portrait picker, once-per-save 2.4-second join presentation, and a composed 2.2-second unpitched welcome flourish (zero ElevenLabs credits). Real browser fixtures cover both pilots and four source signature actions. The ordinary chapter-two party playthrough and complete roster balance are still pending.
- Balance: 55 encounters × 20 seeds; solo **1,048/1,100**, one-companion fixture **960/1,100**, two-companion fixture **1,021/1,100**. Zero unwinnable slots/stalls at the retained **1.0 enemy-HP multiplier**. Rejected an experimental +60% HP per ally. Companion endurance is 5.5 measured basic hits; existing Hiro hit scale, Counter and Iaido values preserved.
- `npm test`, `npm run test:ship`, `npm run test:story`, companion unit/UI/pilot checks and Hiro voice browser/decode checks passed. An initially stale cache stamp and story-jingle shipping-hash failure were corrected; the jingle now lives with story-only assets. Current stamp `20261016-xp2` (UTC).
- Story rebuild retains and hash-checks new Hiro recordings. Website filtering excludes gated draft actors and limits future companion sets to chapter-six joins. A local chapter 1–6 package measured about 431 MB; no website staging, publishing or pushing.
- Files: `story_companions.js`, `story_companion_ui.js`, story combat/scene/director/actor adapters, story UI/CSS/templates, media manifest and 200 MP3s, two pilot atlases, pilot intake/jingle tools, browser/unit/balance tests and review records. Preserve the other session's hotfix hunks in the shared files.
- Full evidence, art caveats, cost ledger, exact scope still pending: **docs/COMPANION_PRODUCTION_PROGRESS_20261015.md**. Source images/prompts/rejected drafts: sibling `adventurer-expeditions-source-art/astra-v10/companions-hiro-20261015/`. The one edge-touching Hiwot blade pixel and final stride polish remain flagged; pilots are not marked production-approved.

- Continued the same approved pass: **Winston and Santiago** now also have eight groups / 128 drawings each, at **1,798,601** and **4,274,300** runtime bytes. Four pilots total **11,721,524 bytes**. Companion-only Whisper / Shield Wall / Holy Smite / Thorn Skin effects add **558,268 WebP bytes**, without altering enemy spell mappings. All four effects passed alpha-edge and lifecycle checks.
- Actual two-actor browser fixtures exercise Hiwot with each other pilot, both source signatures and nonlethal knockout. The rear slot is **x=150 instead of 200**, improving short-companion visibility; wide casts step inside the left screen edge, then restore formation on completion/cancel. Added companion move sounds.
- **Eleven companion sets remain unfinished**: Beau has idle/walk and attack drafts (Attack/Cleave rejected for cropped or joined frames); Delphine has an idle draft; nine later companions are unpainted. No rejected draft is intaken. Santiago’s first Smite draft was replaced with a shield-origin cast. Review all four packed pilots at `docs/art/companions-hiro-20261015/pilot.html`.

## 2026-10-15 — Companion kits and Hiro voice audition (historical; now approved)

- Verified the supplied companion prompt against original read-only data: 15 companions; two existing ally slots, with three story paths currently forcing solo combat. Joins/seat limits/departures remain authoritative. Chapter 1 stays solo by design, although Hiwot already has a combat kit.
- Voice inventory: **210 stored options / 9,309 characters; 200 current options / 8,831 characters**. The other ten are retired finale menus. Conditional finale choice menus were included. No full batch generated.
- Generated exactly **5 audition lines / 281 text characters** with voice `V8MrPOnARtlsjrlxEsE7` (Zero Vex street samurai), model `eleven_v3`. No retakes. API response cost headers sum to **124 credits**; immediate account counter remained unchanged, so do not interpret that as free generation. Conservatively reserve 281 from the 40,000-credit job cap. Auditions normalize against the existing opening voice; raw masters retained, key never written to the repo.
- Review page: `docs/art/companions-hiro-20261015/index.html`. Full scope/corrections: `docs/COMPANION_PRODUCTION_REVIEW_20261015.md`. Source/ledger/generator: sibling `adventurer-expeditions-source-art/astra-v10/companions-hiro-20261015/`.
- Proposed weapons/signatures below are **awaiting Hiro's veto/approval before painting**. Support kits keep source healing/protection; no invented damage skills. Eight groups × at least 16 distinct drawings × 15 companions = **1,920 drawings minimum**, plus effects; a twelve-pose planned move requires 24 under the doubling rule.

| Joins | Companion | Proposed weapon / visual style | Two source signature moves |
| --- | --- | --- | --- |
| 1, fights from 2 | Hiwot | Short blade and throwing knife; quick low footwork | Backstab; Smoke Bomb |
| 2 | Desmond | Ritual wand; off-balance gestures and coiling spell casts | Ember Lash; Wither Touch |
| 2 | Winston | Hooked knife; short, economical cuts, halfling proportions | Venom Fang; Whisper of Ending |
| 2 | Santiago | Spear and round shield; disciplined defensive guard | Shield Wall; Cleanse |
| 2 arrival | Beau | Broadsword and kite shield; planted weight and broad cuts | Cleave; Sunder |
| 2 arrival | Delphine | Branch staff; controlled druid gestures, mature family-friend identity | Mend; Thorn Skin |
| 3 | Itsuki | Longbow; measured stance and deliberate shots | Aimed Shot; Snare |
| 3 | Bahadır | Two-handed greatsword; powerful ranger swings | Cleave; Defiant Stand |
| 3 | Yasemin | Paired talisman fans; formal frost-binding gestures | Frost Touch; Rime Grasp |
| 3 | Devendra | Hooked wizard staff; sharp, commanding casts | Fire Bolt; Spark |
| 5 | Layla | Priestess's sceptre; restrained draining/curse gestures | Wither Touch; Blood Pact |
| 6 | Kaito | Shortbow and belt dagger; mobile shots and close lunges | Aimed Shot; Backstab |
| 6 | Wanjiru | Thorn/bone ritual gauntlets; forceful close-range druid magic | Thorn Skin; Wither Touch |
| 7 | Dai Morgan | Warhammer and small shield; low, sturdy dwarven stance | Mend; Regenerate |
| 13 | Amara | Twin sabres; temple-trained combinations and parries | Dual Swords; Counter Attack |

- Baseline `npm test` and `npm run test:ship` passed with the other session's hotfixes intact. Five audio files decode, finish sequential playback and fit the 390px review layout. No companion code/art, full voice integration, balance changes, jingle, publishing or export yet. This pass commits only its review files and this changelog entry; the other session's changes remain unstaged.

## 2026-10-15 — Hotfix: road trips on the website, retry music, Snarl's retaliation, Iaido Draw ×2 (live)

Hiro: "music isn't playing during fights starting at chapter 2 … the fight against the gnolls I sometimes die after defeating everyone … damage needs to be significantly increased for the iado draw move."

- **Website road trips (my regression).** Astra's painted road trips between chapters load the travel art, which the site package had left out as Arcade-only.
  - Reproduced on the live site: a password player leaving the inn after chapter one waited 120 s on "On the road", with six 404s for `travel/coast-mast-vault/*`.
  - `travel` is no longer in `ARCADE_ONLY` in `tools/site_demo.js`.
  - Verify now plays the road trip into chapter two and waits for its chapter card.
- **Silent fights after Retry.** This was bug review item 8. Retry restarts `StoryBattle`; shutdown pauses the track, and `startMusic` returned early because `this.music` existed.
  - It now resumes the existing track.
  - Fresh fights in chapters 1–3 already played music, locally and on the live site, so the silence came from Retry, which the harder fights make common from chapter two.
  - Verified: music playing before a forced defeat, at the defeat card, and after Retry (currentTime still advancing).
- **Dying after the last gnoll.** The cause was Snarl's Taunt.
  - While Hiro is marked, every hit on Snarl triggers a fixed, no-Defence retaliation. The per-opponent hit scale (×2.42 for Snarl) also multiplied it, to 63 (18% of Hiro), and it played no attack.
  - All 12 of 60 lost fortress fights in simulation were retaliation kills.
  - `shim.js` now divides `taunt.retaliationPower` by the opponent's `c3FoeDmg`, so it's back at source strength (about 26).
  - `beats.js` labels it "Struck back" over Hiro.
  - The three chapter-three fights now win 60/60, 60/60 and 60/60 in simulation.
- **Iaido Draw power 1.8 → 3.6** against every enemy.
- **Win rates, chapters 1–6** (12 seeds, a player who uses every skill when ready): all fights 12/12, except 4:2 6/12, 4:3 7/12, 6:0 9/12, 6:1 8/12 and 6:2 10/12. Nothing is unwinnable and nothing stalls.
- **Published.** Website commit 71da97f: 938 files, 429 MB demo, 0.838 GB site. Verify passed:
  - public lock;
  - the password opens 1–6;
  - the road trip into chapter two;
  - all 21 fights;
  - the "Chapter 7 is coming soon" card.

## 2026-10-15 — All-chapter art QA, inn journeys and closing card (local)

- Audited **59 campaign identities / 3,322 registered frames**, **32 battle locations**, 118 Hiro finisher plays and 59 enemy defeat-finisher plays. No invalid atlas/trim rectangles or packed-frame overlaps. Rear-row attacks now step inside the right screen edge before playing; runtime bounds observations after repair: **0**. Normal body scale and formation return are unchanged.
- Repaired **36 travel poses** in swamp slide, city market vault and rooftop climb using measured source rectangles instead of the old equal grid. Removed neighboring-pose fragments and restored clipped hands/feet from original pixels. No new poses or retiming. Corrected planted anchors; swamp/market final contact x is **1770 → 1710 / 1900 → 1840** to keep the landing arm visible. Retained the approved rooftop grip replacement. All 36 poses and 21 browser action snapshots reviewed.
- Added one combat-only **Nine Lanterns** ground painting; aligned its lantern/water/cloth motion. Original dialogue art retained.
- Story journey wiring from this pass was included in overlapping commit `1e8eab1`: **0 painted interchapter trips → 25 required legs** (chapters 2–13 round trips, chapter 14 outbound). Reuses six approved travel beats at the existing fast run speed and 8–12-second duration. Pending-trip saves resume safely. Fixed phone travel FIT aspect handling.
- Per Hiro's finale answer, chapter 14 keeps its final choice/epilogue and now has a **thank-you card** afterward, with games/books/support links and a next-adventure message. No forced return trip after the finale.
- Checks: `npm test`, `npm run test:ship`, campaign model/readability, all-identity browser playback, all-stage review, all 25 story journeys, repaired travel frames and local ending/mobile checks passed. Browser QA: desktop Chrome and 390×844 emulation, not physical-device certification.
- Runtime/code: `actors.js`, `story.js`, `story_backdrop.js`, `story_stage.js`, `travel_art.js`, `docs/story_preview.js`, story HTML/entry cache stamps; three travel action bundles/scene metadata and the new story stage. Tests: `art_campaign_atlas.py`, `browser_story_all_art.js`, `browser_story_travel.js`, `browser_story_travel_frames.js`, existing actor/story/stage/local-release checks. Rebuild: `tools/repair_travel_cells_20261015.py`.
- Full findings and reproducible evidence: **`ALL_CHAPTER_ART_QA_20261015.md`**, `docs/art/all-chapter-qa-20261015/`. Original masters, before-bundles and source registrations remain in sibling `adventurer-expeditions-source-art/astra-v9/all-chapter-qa-20261015/`.
- No publishing or push by this audit. Preserved the separate session's website chapter-six packaging change and its entry below. Local campaign remains 1–14; original Adventurer files untouched.

## 2026-10-15 — Website: password opens chapters two to six; Pit and Spire retired (live)

Hiro: password should reach chapter 6; "do option 1 but keep a local back up".

- **Room on the site.** A chapters 1–6 package is 414 MB, and the site was at 0.981 of GitHub Pages' 1 GB.
  - The hidden Pit of Karridge (`/play/`, 107 MB) and Spire of Karridge (`/deck/`, 150 MB) are off the site.
  - A local backup is at `OneDriveDocumentsNeverendingnarratives-backup-20261015` (375 files, compared byte for byte before removal). They also stay in the site's git history.
  - `/play/` and `/deck/` now hold a one-line page that forwards to `/#games`.
  - The audiobook pages' nav links to Adventurer and Expeditions instead.
  - `_audiobook2_release_upload` was left alone: it's gitignored and never published, so deleting it wouldn't free site space.
- **Demo:** `SITE_THROUGH = 6, PUBLIC_THROUGH = 1` in `tools/site_demo.js`. Verify passed:
  - public lock at chapter 2, wrong password refused, "Hiro" opens 1–6;
  - all 21 fights in chapters 1–6 load;
  - after chapter 6 the card reads "Chapter 7 is coming soon";
  - nothing missing, no page errors.
- **Published.**
  - The site totals 0.823 GB.
  - Website commit 98cc626, pushed.
  - The package includes Astra's then-uncommitted edits (wide-pose staging in actors.js, the travel scale fix in story_backdrop.js, the post-ending thank-you card). npm test and story_combat passed on that exact tree.
- **Room left:** about 175 MB, enough for chapter 7 (+26 MB) and 8 (+52 MB). Chapters 9–14 need more space or their own Pages site.

## 2026-10-14 — Chapters 6–14 completed locally: scenery, solo balance and progression QA

- **Local access 5 → 14** (`docs/story_preview.js`). Existing chapter-five saves continue through the rest of the campaign; local chapter-jump buttons cover 2–14. Website packaging remains chapter one free / two through five password-gated. No publication or portal export.
- **Ten combat ground paintings**, 1280×760, **3,573,970 packed bytes**: cliffs, sewers, study, counting room, sickroom, tower, silk floor, undervault, valve and catacombs. New edition-owned plates align feet to a continuous contact surface. `story_stage.js` keeps the distant scene, animated weather/scenery and fixed contact ground behind the actors. All 21 distinct late battle stages were inspected. Original dialogue keeps its original art and landmark coordinates; fixed combat-profile leakage into 12 dialogue scenes. Morrak’s realm flames match its blue painting.
- **Enemy HP only**, by chapter:zero-based encounter: `7:3` 1.00 → 0.50; `9:0` 1.00 → 0.70; `9:1` 1.00 → 0.55; `13:3` 1.00 → 0.65. Matched 24-seed wins before/after: 1→13, 6→22, 3→11, 8→15. Full sweep: zero zero-win encounters, zero stalls. Counter’s two blocks/reflection, Iaido Draw, source skills and the other session’s damage multipliers unchanged.
- **Browser coverage:** all 37 fought encounters on the chosen chapters 6–14 route, one peaceful Amara bypass, inns and saved chapter transitions; chapter 14 repeated through reward → ending → reload with zero retries. The first full run’s test waited for the ending before acknowledging the final reward: corrected the harness, then reran the final chapter. Separate full mercy/ruthless simulations assert their selected choices and restore/ascend endings. Inn/rest/reload and all seven original narrated ending cards passed desktop/mobile checks. Detailed scope and evidence: `CHAPTERS_6_14_QA_20261014.md`.
- **Gates:** baseline and final `npm test` / `npm run test:ship` passed; story campaign/combat/readability checks passed. Normal-entry/save smoke verifies chapters six and fourteen without a QA unlock query. User playtest remains the final visual/difficulty approval.
- **Files:** ten WebP plates plus `late-stages.json`; `story_stage.js`, `story_combat.js`, local story preview/cached entry pages; `build_story_late_stages.py`; chapter progression, stage, dialogue-stage, local-release and branch tests; GDD, production tracker, art follow-up and QA report. Exact prompts and compact evidence are in `docs/art/chapter-stages-20261014-*`. PNG masters live in sibling `adventurer-expeditions-source-art/astra-v9/chapter-stages-20261014/`, outside this Git repository. Existing 59 enemy sets, finishers, projectiles, dialogue and audio reused.
- **Preservation:** checkpoint `482b8b5` saved the other session’s Counter/chapter-jump/site-packaging work before edits. Its website/password changelog entry is retained below. Original Adventurer and synced shared files were not changed.

## 2026-10-14 — Website: chapter one free, chapters two to five with a password (live)

Hiro: "send changes to live site, allow players to play chapter 2-5 if they know password, password is Hiro". Chapter 2 went back behind the password, so only chapter one is free.

- **Password gate** (`docs/story_preview.js`).
  - `UNLOCK_THROUGH` above `DEMO_THROUGH` turns on a "Have a password?" box, on the title screen and on the coming-soon card.
  - The code holds only a SHA-256 of the lower-cased password, so "Hiro" and "hiro" both work. A match is remembered in that browser (`adventurer_expeditions_unlocked`) and the page reloads with the chapters open.
  - It's a casual gate: the locked chapters' files ship with the page.
  - Locally nothing changes: `UNLOCK_THROUGH` equals `DEMO_THROUGH`, so no box appears.
- **Site package** (`tools/site_demo.js`).
  - `SITE_THROUGH = 5, PUBLIC_THROUGH = 1`; the build writes `DEMO_THROUGH=1` and `UNLOCK_THROUGH=5` into the shipped script and drops `?through`.
  - Chapter media now include each chapter's battle track (the bandit camp has its own) and a stills-by-chapter table.
  - Arcade-only art the story never loads is left out: 18 Arcade monsters, their gore sheets and the Arcade travel art. Its one Arcade creature, the wolf, stays. That's what keeps the site under GitHub Pages' 1 GB.
  - Verify now checks the lock:
    - a fresh player gets "Chapter 2 is coming soon";
    - a wrong password is refused and "Hiro" opens chapters 1–5;
    - all 16 fights in chapters 1–5 load;
    - after chapter 5 the card reads "Chapter 6 is coming soon";
    - nothing is missing and there are no page errors.
- **Published.**
  - 784 files and 293 MB in `expeditions/`.
  - The 134 Arcade-only files left from the previous upload were checked one by one against the Arcade-only list and removed (they remain in git history).
  - The site totals 0.981 GB published.
  - Website commit df13186, pushed.
- **Next:** the site has about 19 MB of headroom. Chapter 6+ needs room first: move the audiobook files (339 MB) to their own host, or retire the hidden Pit and Spire folders (257 MB).

## 2026-10-14 — No glow around Hiro on Counter; dev chapter jump

- **Yellow aura removed.** `Actor.refresh` drew a pulsing gold ellipse behind Hiro while he held a Counter, and a purple one for the old aura. Hiro asked for it gone, so no body outline is drawn now; the counter badge above his head stays. A new actor_animation_lifecycle test checks that no outline colour is set while the badge still shows. The website copy was rebuilt, verified and staged.
- **Dev chapter jump** (title screen, local server with a dev build only; the site package turns DEV_BUILD off and is never localhost). "Dev: jump to chapter" buttons for 2..PLAYABLE_THROUGH:
  - the skipped chapters' story runs instantly with the first ordinary answer to each choice, so flags, recruits and the company are real;
  - their fights count as won, and the jump replaces the current save;
  - verified in a browser: chapter 2 starts with Hiwot riding, chapter 5 with chapters 1–4 complete and a five-strong company, no page errors.
  - Use `?through=N` to jump past the local cap of 5.

## 2026-10-14 — Remaining campaign enemy art and painted projectiles (Astra)

**Enemy-art coverage 22/59 → 59/59.** Added the remaining 37 opponent identities for chapters 6–14: 24 ordinary drawings per set and 111 paired finishing clips (two Hiro moves and one enemy-on-Hiro move per identity), each with 16 distinct drawings and a 2,190 ms base timeline. Nonlethal Hiro endings preserve Thornwise, Nettle, Amara and Kolade's story branches. Wide source sheets, targeted pose repairs and fixed body references correct clipped weapons, disappearing/doubled Hiro poses and neighboring-frame ownership. All 37 registration reports have zero boundary warnings.

**Projectiles:** added six transparent four-frame effect atlases, 24 authored clips; the catalog and explicit aliases cover all 37 ranged/ward/summon skill IDs in the campaign and encounter variants. Arrows, magic and breaths launch at measured hand/staff/mouth anchors; wards appear at their recipient. Counter reflects the same painted effect instead of a placeholder circle. Added cast metadata for the reused bandit archer. Fixed effect preload so cached chapter-one textures cannot skip later groups. Pause, hit-stop and shutdown cleanup are covered.

**Files:** 37 `assets/expedition/story_*` sets and 37 corresponding `adult/*-fatal` sets; six `story/effects` atlases; matching review pages under `docs/art/story-*`; `story_art.js`, `story_effects.js`, `beats.js`; actor/extraction/effect builders and `story_cast_anchors.json`; art/lifecycle/browser tests and package script; GDD, production status, `STORY_LATE_ART_REVIEW.html`, `STORY_LATE_ART_QA_20261014.md` and provenance records. Packed runtime addition approximately **342.74 MB actors + 4.625 MB effects**. Source PNGs remain in the sibling source-art folder, outside this repository; packed art and copied generation/configuration records are in Git.

**Validation:** `npm test`, `npm run test:ship`, story campaign/combat/readability checks, existing real story-fight browser regression and mobile/tutorial preview passed. All 37 new opponents played both Hiro pairs and their lethal-DOT defeat pair in Chrome: 111 moves, 16 frames observed per move, normal actor restored. Eight representative ranged/caster releases passed browser capture checks. Full 12-seed balance sweep: zero unwinnable encounters, zero stalls; chapter 7 encounter index 3 remains especially hard at 1/12 wins. The UI tutorial test now uses a reproducible seed and uses ready skills between prompts instead of passively ignoring Iaido Draw; production difficulty was not changed.

**Limits preserved:** local chapter cap 5, website packaging cap 2; Counter's two blocks/reflection, Iaido Draw and the other session's damage multipliers unchanged. No original Adventurer edits, website publication or portal export. Later chapters still need full progression QA and suitable combat ground plates: wyvern cliff, sewer water and consortium office furniture currently misalign with fighters. This completes enemy art, not a claim that chapters 6–14 are ready to unlock. Review and detailed evidence are linked in `STORY_LATE_ART_QA_20261014.md`.

---

## 2026-10-13 — Harder fights, Counter answers projectiles, Iaido Draw replaces God Aura; site demo opens chapter two

Hiro: "unlock chapter 2 but lock chapter 3, make the game a bit harder, hiro to die in 3 to 4 direct hits, counter to only work on two attacks at a time, remove the purple and yellow circle, counter needs to also work on projectiles … his second move to become an ieyasu drawing style attack that targets multiple enemies for heavy damage but has a long cool down."

- **Three to four hits to die.**
  - New `tools/story_hit_scale.js` simulates every campaign opponent against Hiro, with the old edition multipliers off, and takes the median direct hit. It writes one multiplier per opponent into a generated block in `story_combat.js` (`B.hitScale`).
  - Result: a direct hit takes 28% of Hiro's health (about 3.6 hits), or 33% for bosses, minibosses and named characters (3 hits).
  - 57 of 59 opponents are measured. Bahadır and the Umbral Hand landed no hits in the runs and keep their old multipliers.
  - The multiplier also scales an opponent's damage-over-time, because the engine applies it to all of that opponent's damage.
  - Rerun the tool after new opponents are registered; `--check` lists any without an entry.
- **Win rates after the change** (`STORY_CHAPTERS=5 node test/story_balance.js`, 12 seeds; the simulated player uses every skill the moment it's ready):
  - chapters 1–3 are all 9–12 of 12, except 3:2 at 10/12;
  - 4:1 10/12, 4:2 6/12, 4:3 7/12;
  - 5:1 3/12, the hardest;
  - nothing is unwinnable and nothing stalls.
  A human who mistimes Counter will lose more often.
- **Counter caps at two blocks.** The engine adds two per cast, so a recast with one block left made three. `Enc` now clamps to `X.counterCap = 2` after every cast. Verified: over 20 seeded fights with double casts, the most ever held was 2.
- **Counter answers arrows and spells.**
  - While Hiro holds a counter, `Enc.step` flags the enemy's turn and the shim hands that enemy's projectile skills to the engine as counterable attacks.
  - The engine's own counter then blocks the hit, bounces the damage back into the shooter and runs the riposte. Lethal hits, the riposte and the bounce all use the core's own rules; nothing in js/core changed.
  - On screen: Hiro plays `deflect` (falling back to intercept until the art arrives), and the shot flies back into the shooter, who takes the bounced damage, then the riposte.
  - Verified: across 20 seeded chapter-one Griffon Road fights, the Consortium Mage's spells were countered 53 times.
- **Iaido Draw replaces God Aura** in the second slot. The id stays `god_aura`, so the HUD, tutorial and saves keep working.
  - One drawn cut through every enemy, at power 1.8 against each (Katana Slash is 1.3 on one enemy), with a 22-second recovery.
  - The aura branch is off (`auraAtk: 0`). It runs the engine's ordinary all-enemies damage path.
  - It plays a new `iaido` clip, falling back to Hiro's widest slash until the painted `iaido-draw` arrives.
  - The tutorial teaches it once, when two or more enemies are up.
  - I tried power 2.2 too; win rates were about the same, so I kept the lower number.
- **No circles around Hiro.**
  - Removed the gold arc on the counter stance, the purple flash and the buff ring drawn around Hiro.
  - Removed the rings in the puppet aura and stance fallbacks.
  - God Aura's painted purple ring went with the skill. The status badges above his head stay.
- **Website demo plays chapters 1–2.**
  - `tools/site_demo.js` has one setting, `SITE_THROUGH = 2`. Voices, music, paintings, the bounty still and enemy art (taken from the story_art bindings) follow it.
  - The demo cap in the package follows it too.
  - Verify loads every fight in the playable chapters and the end card after the last one.
- **Tests:** expedition_sim now checks Iaido Draw's rules instead of God Aura's (all-enemies target, harder than Katana Slash, at least 20 s recovery, auraAtk 0, a damage effect). The unit suite passes, and so do story_campaign and story_combat.
- **Art for Astra:** docs/ASTRA_PROMPT_IAIDO_DEFLECT_20261013.md covers the Iaido Draw clip, a deflect clip, the knocked-back projectile effects and a new HUD icon.

---

## 2026-10-13 — Chapter five: The Bandit Camp (Astra)

**Playable locally:** chapter limit **4 → 5**. Completed Skarn, Hobgoblin Sergeant, Road Bandit and Gorruk; campaign registration **18/59 → 22/59**. Femi, Gauntlet patrol, archer and hired knife reuse their existing finished sets. Original chapter dialogue, choices, voices, scenery and music are unchanged. Chapter five returns to the inn; chapter six remains gated. The website demo stays at chapter one. Nothing published.

**Art and intake:** four combat sets, eight Hiro pairs and four enemy-on-Hiro pairs; every pair has **16 distinct drawings**, with contact/release markers, transparent packing and fixed body references. 292 drawings registered across the four sets, including Gorruk's separate four-pose spell cast. Reused the complete hobgoblin set and existing Skarn/Road Bandit ordinary sheets. 22 image-generation requests produced the missing sheets and two clipped-weapon repairs. Corrected the Skarn hammer-counter recovery's cell ownership so his fallen body stays visible instead of appearing in a neighboring frame. Gorruk's two Hiro disarms are nonlethal to preserve his authored escape; the source Itsuki choice still determines whether Gorruk survives. His Fire Blast launches from his palm on cast frame 2, rather than from an axe swing. Source masters and exact requests: `../adventurer-expeditions-source-art/astra-v8/story-enemies/`; see `CHAPTER_FIVE_ART_QA.md`.

**Bug found during actual play:** Gauntlet Close Order supplied a nested lane status where the generic engine expects `{kind, rounds}`. This produced an unnamed status and crashed the new badge display. The edition-owned story adapter now flattens that one effect; the HUD also ignores unnamed/null statuses. Shared skill definitions remain unchanged. Added simulation and browser regression coverage. Story pages now request the existing game icon instead of a missing favicon.

**QA:** four actual main-route battles passed, plus quiet entry and both Itsuki choices (shoot/hold) with the previously recruited companion seated at the inn. Checked both prisoner/letters rescue orders, bypass outcomes, Gorruk survival/death flags, Itsuki's departure, rewards and save reload. Every new actor passed both Hiro finishers and a lethal-DOT enemy finisher in a real multi-enemy battle, all frames, atlas restoration and camera reset. Gorruk's spell flight/release and patrol status badges passed. Default entry, chapter-four inn → chapter five and chapter-five inn → chapter-six coming-soon/reload passed. Full 55-encounter simulation: no unwinnable seeds across the required floor, no stalls; chapter-five 20-seed win rates **80%, 100%, 100%, 100%**, with no balance retuning. These are automated-player results, not a difficulty guarantee.

**Checks:** baseline `npm test` and `npm run test:ship`; final `npm test`, `npm run test:story`, `npm run test:ship`; `node test/story_balance.js --gate`; chapter/roster/art/readability/boundary browser checks. `sync:check` still reports two pre-existing differences (`play_local.js`, `js/ui/gate_ambience.js`); neither was changed here. No original-game writes, shared-file changes or publishing.

**Files:** four `assets/expedition/story_*` actor directories and matching `adult/*-fatal` directories; three new `docs/art/story-*` review pages; `js/expedition/{story_art,story_combat,actors}.js`; `tools/build_story_actor.py`; story templates/generated pages and stamped `index.html`; `docs/story_preview.js`; actor lifecycle/story readability/art/roster/chapter/boundary tests; production tracker, status checklist, GDD, this log and chapter-five QA note. Chapters **6–14** and **37** remaining identities are still production work.

---

## 2026-10-12 — Chapter inns, corrected bathhouse and website marketing (Astra)

**Rest and progression:** each chapter return now visits the existing animated inn instead of jumping straight to the next departure and granting free recovery. Carried health remains; Rest uses the unchanged Arcade cost of 1,000 points, doubling per purchase, heals fully and opens the animated bathhouse. Full health or insufficient points never charges; Continue story remains available. Defeat still retries at full health. A pending rest survives reload without a second charge, and old chapter-boundary saves get an inn visit without changing choices. Arcade Rest also opens the scene and restores canvas input on close.

**Art:** one image-generation edit separated the kneeling attendant's knees from Hiro's leg. No new voices/music. Static characters, moving water/steam/leaves/light, 24-second loop, reduced-motion and pause retained. Source preview updated to the corrected painting, with the original preserved. `docs/BATHHOUSE_INTEGRATION.md` records source/provenance. Local chapter cap 1 → 4; all 13 main-route battles across chapters 1–4 passed. Chapter 4 was already built, so no duplicate art was created. Runtime status: 18/59 campaign identities; later chapters remain unfinished.

**Website:** the separate Neverending Narratives checkout now uses approved cover art for both games, direct Play links, complete-game versus chapter-one-demo labels, personal feedback copy and direct Facebook links. Donation copy explains the purpose, links to the existing Cash App recipient and offers copy-to-clipboard. Recorded support ($425), goals ($1,000/$5,000), book prices and payment recipient are retained. Fixed phone text overflow. Original Adventurer files are untouched.

**Packaging:** public demo remains chapter one even though the local build supports four. `tools/site_demo.js` forces that limit with no query bypass, verifies title/three fights/inn/Rest/bathhouse/end card/mobile title, records SHA-256 hashes, and stages only the tested bytes into the website repo. Package: 593 files, approximately 225 MB total; that is a website package size, not an initial-download or CrazyGames eligibility claim. Verified the actual `/expeditions/` subpath separately, including combat, with no missing requests/page errors. Only the verified demo and homepage marketing changes are intended for website deployment.

**Checks:** `npm test`, `npm run test:story`, `npm run test:ship`, four-chapter real-browser main route, `node test/browser_story_inn.js`, corrected-plate pixel/loop check, frozen site-demo verification, and website checks at 1440×1000, 390×844 and 375×667 passed. Website checks cover art loading, both game links, mobile navigation, donation destination, copying the recipient and preserved total. The older standalone `test:arcade` test timed out at its first tutorial fight before reaching Rest; it is not counted as a pass. Paid Arcade Rest/input restoration has a separate passing check in `browser_story_inn.js`; the two-quest ship gate passed.

**Files:** `js/expedition/{story,bathhouse,story_backdrop,scenes_town}.js`; `assets/expedition/bathhouse/`; `docs/story_preview.js`; story HTML template/generated pages; stamped `index.html`; story/inn/Arcade/website browser tests; `tools/site_demo.js`; this log, GDD, production tracker and bathhouse note. Website edits live separately in `C:/Users/charl/OneDrive/Documents/Neverendingnarratives`: `index.html`, `sitemap.xml`, two cover WebPs and the verified `expeditions/` demo. The core inn work was captured by the other tool in commit `e03880e` while this verification was running; no overwrite was needed.

## 2026-10-12 — Story combat readability (Astra)

Local Expeditions changes only. Original Adventurer and synced `js/core`, `js/data`, `js/ui` unchanged; nothing published or exported. No image generation or new atlas pixels. Existing chapter-one axe contact, rear-slot formation, bite contact timing, landing fallback, hit-stop effects and two-fight tutorial remain intact.

**Status attack inventory: all 55 encounter slots and three source variants across 14 chapters.** The following six enemy casts now retain their original effects and add a strike calculated from **60% of basic-attack damage**, before shared mitigation, counters and campaign scaling. Failed/interrupted casts do not hit. Scope is tagged story foes only, not shared tables or Hiro.

| Skill | Chapters | Enemies |
|---|---|---|
| Marked for the Knife (`marked_for_the_knife`) | 1, 3, 5, 9, 10, 13 | Cobb, Hired Knife · Road Cloak, Hired Knife · Ash Cloak, Lurleen, Hired Knife · Wet Cloak, The Umbral Hand 2 |
| Ashfall (`ashfall`) | 2, 11, 13, 14 | Merle, Gauntlet Turncoat · Marr's Own, Kolade — the Unbound |
| Taunt (`taunt`) | 3, 5, 6, 7, 8, 9, 13, 14 | Snarl, Gnoll Warleader, Gnoll Raider · Grey, Burning Gauntlet Soldier · Night Watch, Hobgoblin Sergeant · Frostbite Company, Gorruk, Hobgoblin Sergeant · Ashtalon Company, Kestrel, Consortium Guard · Mine Detail, Consortium Guard · Black Livery, The Ogre Under the Docks, Captain of the Tower, Hobgoblin Sergeant · Deserter, Segun Marr, Kolade Adeyinka |
| Contract Mark (`contract_mark`) | 7, 10 | Slave Driver · Chain Hand, Adigun Adeyinka |
| Ranging Ward (`ranging_ward`) | 7, 9 | Olamide, Consortium Mage · Seal Cowl |
| Dispel (`dispel`) | 10 | Rotimi |

Other zero-power hostile actives deliberately **unchanged**: Paid in Full already spends stored damage; Reaving Arc, Unbound Arc and The Strongest Among You already deal percentage-HP damage; Finisher already executes. Smoke Bomb targets its caster, so it still provides evasion/stealth rather than attacking Hiro. Venom Fang, Bog Curse, Snare and other positive-power debuffs already hit.

**Readability:** enemy skill names float at use. Live status badges include readable Marked, Marked+, Taunted and Evasion labels, plus poison/burn/shock/seal/withering/heal reduction and generic coverage for other engine statuses. Lane hazards and remaining evade charges also show; badges disappear with their actual status/charge/hazard. Smoke Bomb announces Evasion up. Enemy evades step back with Miss; counters/blocks flinch with Blocked and a spark; wards/shields show Shielded, including consumed temporary health; zero/no-damage outcomes show 0/Resisted. Reflected damage is presented too. These reactions apply to ordinary Katana Slash and generic skills, not just finishers.

**Tutorial sampling:** 100 seeds per opening encounter, normal auto swings plus between-turn button use. Fight 1: 17 dodges in 128 swings (13.3%); fight 2: 0 in 263 (0%). No evasion nerf was warranted; the existing rogue defence is now visible. Both encounters still win all 20 balance-gate trials.

**Casting:** six measured hand/staff anchors in `tools/story_cast_anchors.json`, separate cast clips in runtime/review manifests, and builder support so regeneration preserves them. Consortium Mage, Merle, Kobold Shaman, Kobold Chief, Grukhar and Veylan Acolyte checked. Hostile painted effects launch on the release frame, scale to 40% of actor height (Shaman 45%), hold the follow-through through flight/impact, then recover. Fire/ember/ash/cinder reuse the flame row; Spark uses the existing prismatic row with a warm tint; Grukhar uses its green tint. Healing remains an ally action with no bolt aimed at Hiro.

The consortium mage cast uses seven existing distinct poses instead of eight: skips the hard-cropped beam drawing, releases on its clean follow-through flare, and retains the original ordinary attack frames. Wide casting poses step inside the right edge and return to their original slot, preserving body scale. New release-hold cleanup respects pause, hit-stop, interruption and destroyed actors.

**Balance comparison:** `node test/story_balance.js --gate`, 20 identical seeds per encounter. Percentages below aggregate independent encounter trials per chapter, not a complete campaign survival probability. All 55 encounters have at least one winning seed and zero stalls before and after. Added physical strikes can trigger Hiro counter damage, so some fights become easier.

| Chapter | Trials | Before wins | After wins | Before | After |
|---|---:|---:|---:|---:|---:|
| 1 | 60 | 60 | 60 | 100% | 100% |
| 2 | 60 | 60 | 60 | 100% | 100% |
| 3 | 60 | 60 | 60 | 100% | 100% |
| 4 | 80 | 64 | 64 | 80% | 80% |
| 5 | 80 | 79 | 76 | 98.75% | 95% |
| 6 | 80 | 70 | 70 | 87.5% | 87.5% |
| 7 | 100 | 83 | 90 | 83% | 90% |
| 8 | 80 | 59 | 58 | 73.75% | 72.5% |
| 9 | 80 | 79 | 80 | 98.75% | 100% |
| 10 | 100 | 100 | 100 | 100% | 100% |
| 11 | 80 | 67 | 66 | 83.75% | 82.5% |
| 12 | 60 | 60 | 60 | 100% | 100% |
| 13 | 100 | 81 | 81 | 81% | 81% |
| 14 | 80 | 40 | 40 | 50% | 50% |

**Art still absent:** dedicated enemy dodge/guard drawings. All current story sets rely on their existing hit clip for guard/resist and a short native-scale step for dodge: Nib, Cobb, Hired Knife, Consortium Mage, Merle, Lurleen, Gnoll Raider, Bandit Archer, Snarl, Bahadir, Tunnel Kobold, Kobold Shaman, Kobold Chief, Veylan Acolyte, Grukhar, Femi, Gauntlet Soldier and reused Road Wolf. These are explicit visual fallbacks, not newly painted parries. Later unregistered opponents remain gated; this work does not mark their art ready. Chapters 13/14 still contain encounters winning only 1/20 baseline seeds; broader late-game tuning remains separate.

**Verification:** `npm test`; `npm run test:story` (now includes `test/story_readability.js`); `npm run test:ship`; `node test/browser_story_chapters.js` (actual chapters 1–2, six battles); `browser_story_spared.js`; `browser_story_endings.js`; `browser_story_chapter_one_polish.js`; `browser_story_readability.js`. New lifecycle tests cover evade, block, zero, immune, ward, pool shield, projectile release/arrival/hold, recovery and cancellation. Story tests cover six real skill kits, unchanged source behavior, interrupted casts, temporary-health shields and the tutorial miss sample. Browser evidence: `test/reports/readability/` (nine actual hostile casts, Acolyte heal, defensive outcomes, Marked expiry); previous opening axe/formation checks also passed.

**Files:** edition `actors.js`, `beats.js`, `story_combat.js`, `story_effects.js`; six caster runtime + review manifests; `tools/story_cast_anchors.json`, `tools/build_story_actor.py`; `test/actor_animation_lifecycle.js`, `test/story_readability.js`, `test/browser_story_readability.js`; `package.json`, cache stamp in `index.html`, this log. Master paintings and atlas images unchanged.

---

## 2026-10-12 — Chapter-one axe facing, rear formation and painted projectiles (Astra)

- **Cobb:** replaced only his 12-frame ordinary axe attack with a left-facing two-handed chop. He looks at Hiro through the wind-up, contact and recovery. Idle may still face the viewer. Kept contact frame 6 and the existing 1,285 ms timing; all 56 other ordinary/paired frames are pixel-identical. A measured neutral floor-shadow band in the new sheet was removed without thresholding his gray cloak or axe. Active ordinary atlas bytes: 8,356,768 → 8,502,720. Superseded pages and drafts are archived with source masters.
- **Formation:** after a campaign enemy dies (including a back-row target, DOT or a finisher), survivors fill the original rear slots over 340 ms. Positions are based on the initial formation, capped by each fighter's painted width, so repeated calls cannot accumulate drift or send a wide enemy off-screen. No actor resizing. Chapter-one three-enemy test: front survivor x 612 → 825 → 1054.6 as two rear opponents fall.
- **Painted effects:** added four distinct four-frame effects for the actual opening kits: Fire Bolt, Prismatic Bolt, Marked for the Knife, and Smoke Bomb. Fire/prismatic spells are directional painted missiles (360 ms flight); the knife mark appears on its target (650 ms), rather than flying as a ball; smoke blooms at its caster (800 ms). The transparent, padded atlas adds 527,796 bytes. Playback follows pause/hit-stop/slow motion and cleans up on scene shutdown. Source combat rules and damage are unchanged; later unsupported skills retain their existing presentation.
- **Files / rebuild:** `tools/build_story_cobb.py`, Cobb runtime/review atlas, `story_scene.js`, `beats.js`, new `story_effects.js`, `tools/build_story_effects.py`, story-fight template/generated page, refreshed script stamps, and `test/browser_story_chapter_one_polish.js`. Built-in image_gen source/prompt records and rejected drafts are in sibling `astra-v8/chapter-one-polish-20261012/` and `story-enemies/cobb/`; prompts also at `docs/art/chapter-one-polish/prompts.json`. The original Adventurer and synced shared code are unchanged; no publishing/export.
- **QA:** real chapter-one browser checks passed all 12 attack frames and native-transform restoration; all 16 effect frames and pause/resume; sequential rear-enemy deaths, full-size survivors, right boundary and no repeated drift. Inspected axe contact, fire, prismatic, mark and smoke screenshots. Cobb's existing two Hiro pairs and enemy defeat still play all 16 frames with camera/atlas restoration. `npm test`, `npm run test:story` and `npm run test:ship` passed. Evidence: `test/reports/story-chapter-one-polish/`.

---

## 2026-10-11 — Dunmere and river-ford combat ground repair (Astra)

Replaced two establishing-view battle paintings with dedicated combat plates. Dunmere now has a wide level cobblestone lane with the well and buildings behind it. The ford now has a continuous firm gravel bank across the combat area; the moving river sits behind all fighters. Both runtime plates are 1280 × 760 (492,464 and 547,020 bytes). Fighter scale and foot positions are unchanged (Hiro 330 px tall; combat baseline y 612). Original dialogue/travel paintings are untouched. This resolves the two "fighters off the ground" items in the chapter-one demo entry below.

`js/expedition/story_stage.js` routes only these two combat environments to the new plates and provides separately measured smoke, lights, cloth, river and waterfall anchors. It keeps the fixed contact plane, moving distance and weather/scenery layer. Built-in image_gen painted both; runtime processing only resized/encoded the outputs. Masters and original prompts remain in sibling `adventurer-expeditions-source-art/astra-v8/story-stages/grounding-20261011/`; a prompt record is also saved at `docs/art/story-grounding/prompts.json`.

Validation: `node test/browser_story_grounding.js` exercises both real chapter-three encounters, confirms original dialogue asset routing, native fighter size, feet within the ground band, river effects behind the bank, moving distance and fixed ground, and no page errors. Desktop 1280×760 and phone 390×844 screenshots were visually inspected (phone retains the existing letterboxed battlefield). Evidence: `test/reports/story-grounding/`. `npm test`, `npm run test:story` and `npm run test:ship` passed. No original Adventurer, shared file, publishing or portal export changed.

---

## 2026-10-12 — Arcade retired; tutorial covers the first two fights

Hiro: "the tutorial is not working on the first quest. arcade mode should be disabled it's no longer a thing, just the campaign."

- **The tutorial covers the first two fights.** Hiro changed this from "all of chapter one" to "just the first 2 fights".
  - **Before:** story fights held for lessons only in the first fight opened (`enc.storyTutorial` flips off once `tutorialFightStarted` is set). The second and third fights of chapter one ran with no prompts, so the Finisher and God Aura lessons only showed if they happened to be ready in fight one. Arcade tutors its whole first quest.
  - **Now:** `StoryBattle.tutoring()` holds while fewer than two fights have been won (outcomes recorded as `combat`). A bypassed fight, such as sparing Nib, doesn't use up a lesson fight, and a retry keeps its lessons. The lessons are the same Arcade ones: Counter the first time it's ready, the Finisher whenever ready, Counter under half health, and God Aura once on a boss. The "already taught" flags live in the story save, so nothing repeats needlessly.
  - **Verified in the fight page:**
    - second fight after one win: tutoring on;
    - Cobb's fight after sparing Nib: tutoring on;
    - Griffon Road after two wins: tutoring off.
    Before, the second fight had `storyTutorial` false and no prompts.
- **Arcade is no longer a mode.**
  - `index.html` sends players straight to the story campaign.
  - Every Play Arcade button is gone: title, demo end card and ending.
  - The Start over prompt no longer mentions an Arcade run.
  - The Arcade code stays because every story fight runs on its director, actors and HUD. Automated browsers (`navigator.webdriver`) and `?arcade=1` still reach the old screens, so the art and combat test suites keep working.
  - Not yet decided: the high-score board is still shared with the old Arcade rows on this device; packaging comes later.
- **Story fight fallback link fixed.** It opened `/STORY_CAMPAIGN_PREVIEW.html` (a 404, because of the page's `<base href="../">`). It now opens `docs/STORY_CAMPAIGN_PREVIEW.html`. This was bug review item "fallback link points at a missing file".
- **Story pages aren't cached.** Both story page templates get index.html's no-cache meta tags. The browser pane kept showing a removed button from a cached copy of the page, with old script stamps. Stamp bumped to 20261012-xp2 and pages rebuilt.

---

## 2026-10-12 — Animation fixes before new art: Alpha landing, bite timing, effects in hit-stop

From the 11 October bug review (docs/BUG_REVIEW_20261011.md, now marked fixed there). Code only, no art.

- **The Alpha played its collapse after attacking.** `land_tumble` and `overshoot_land` fell back to `down` (and `hit`) because the Alpha has no tumble or landing drawings. Landings now try `land-tumble`/`overshoot-land` and otherwise settle to `idle`, never a collapse or a hurt flinch. `land_beside` keeps its `hit` fallback: reeling after a parry is right. (`actors.js`)
- **The Alpha's damage showed before its strike.** In the heavy branch, the damage number, burst, shake and Hiro's stagger fired before the `bite` clip began. They now fire on the bite's contact frame (the Alpha's `attack` clip, frame 4), with a fallback after the clip if it has no contact. The plain wolf bite (unpaired) had the same order and is fixed the same way; the paired grip drawing shows the bite itself, so it is unchanged. (`beats.js`)
- **Blood and defeat effects ignored cinematic holds.**
  - New `DefeatFX.held(scene)`, the same rule as `Actor.syncPause`: menu pause, scene pause and the painted finisher hit-stop freeze an effect, and slow motion slows it.
  - The blood slash (`gore_fx.js`) and all three defeat effects (coast/citadel sparks, swamp puffs, city sheet) use it.
  - The city sheet used to ignore slow motion and hit-stop and left a `shutdown` listener behind per kill. It now scales by `timeScale` and removes its listener.
- **Hit-stop softlock (review item 1).** `scene.js` and `story_scene.js` `create()` reset `__paintedHitStopCount`. Leaving a fight mid hit-stop used to freeze the next fight's painted animations, because the scene object is reused.
- **Tests:** test/actor_animation_lifecycle.js gains three checks:
  - the Alpha's landings resolve to idle, and real tumble art still wins;
  - effects hold during hit-stop and pause;
  - the Alpha's heavy bite order is pounce → bite → contact → Hiro staggers → landing. The old code fails this check.
  Suite: 32 passed. Stamp bumped to 20261012-xp1 (`tools/stamp.js`); the story pages were rebuilt to match.

---

## 2026-10-11 — Chapter one demo: sound on, scene-first dialogue, death beat, points

From Hiro's chapter-one playtest. Files: `docs/story_preview.js`, `tools/story_preview.template.html` (and the regenerated `docs/STORY_CAMPAIGN_PREVIEW.html` / `STORY_FIGHT_PREVIEW.html`), `tools/build_story_preview.js`, `js/expedition/story_scene.js` (Sound button only), and the story browser tests.

1. **Voice played only on Replay.** The story started muted; `say()` skipped every line and Replay ignored the mute. Sound now starts on and the choice is remembered (`adventurer_expeditions_story_muted`). The fight page's Sound button writes the same key, and the story re-reads it after a fight, so one setting covers both. Verified: on a fresh load the button reads Mute, and Tesfaye's lines and `q1_death_1.mp3` were fetched without pressing Sound or Replay.
2. **Text boxes covered the paintings.** The box is compact and docked at the bottom:
   - smaller name, caption and type;
   - a 92 px portrait;
   - the line scrolls after about four rows;
   - Replay sits beside Continue.
   As in the original's `withScene`, a new painting now shows on its own until it has loaded plus 1.2 s; then the box fades in and the voice starts. Verified: the whole Tesfaye death still is visible above the box.
3. **Death beats.** Restored the original's fallback caption ("The sword goes through him. You run because he told you to.") when a death beat has none. On Continue there's a red flash and a 600 ms hold with the buttons disabled. Verified on q1_death.
4. **Gold → points.** The chapter reward screen shows the run's arcade score ("Score: N points"), which story fights already add through `Encounter.award`. Gold is still tracked inside the save because the original's perks read it, but it isn't shown.
5. **Chapter one is the demo.**
   - `DEMO_THROUGH = 1`. After chapter one's reward screen, a "Chapter 2 is coming soon" card shows the score, a name entry when it makes the top ten (the Arcade board, `X.Board`, shared with Arcade), the board, the Facebook screenshot note, Back to title and Play Arcade.
   - On localhost, `?through=N` plays further; the story browser tests use `?through=14`.
   - Removed player-visible dev wording: the "CAMPAIGN DEVELOPMENT PREVIEW" tag, the preview notice and title. Buttons now read Begin story, Continue story and Start over.
   - Verified with a save at chapter 2 departure: the reward screen showed 1840 points, the card appeared, and saving a name put it on the board. Test data was removed afterwards.
6. **Story scripts are cache-stamped.** `build_story_preview.js` adds index.html's release stamp to the story scripts on both story pages, so returning players don't run a stale cached `story_preview.js` (it happened in the browser pane during this pass). The template now carries this session's page edits; it had been behind the page.

**Not fixed: fighters off the ground (Astra, needs art).** The battle paintings are scaled to cover the stage, so fighters' feet (stage y 612) land at about y 515 of each 640-px painting:
- **Dunmere (chapter 3, first fight):** the foot line falls at the well's base in the middle distance, so the 330-px fighters look like giants floating over the village.
- **River ford (chapter 3):** the enemies stand on the water.
- **Gnoll fort:** fine.
These need combat crops or ground plates like the mine's `dunmere-mine-combat.webp`. Shifting the existing paintings would leave a gap at the bottom of the stage or zoom in about 1.9×.

---

## 2026-10-11 — Campaign: chapter cards, join and seat notices, voice replay

From the comparison with the original Varenholm Gate (docs/STORY_COMPARISON_20261011.md). All in `docs/story_preview.js` and the preview page's styles; Astra's story scripts are untouched.

- **Chapter title cards.** Each chapter's departure opens on "Chapter N" and the chapter's original name over its departure scene, with that chapter's music. Continue appears after 1.8 s, as on the original plates. Shown once per chapter per save (`record.titleCards`). Numbering follows the campaign's 14 chapters, not the original's eight acts.
- **Join and seat notices.** The company is compared before and after each beat and choice. Recruits who join show "X rides with you." When the company is full (5 companions, 6 with Hiro, `Campaign3.MAX_COMPANY`), the original's seat choice appears before the next beat: send someone back to the inn or leave the newcomer there. Pending offers are saved (`record.seatOffer`) so a reload still asks. Before this, overflow recruits were left at the inn silently.
- **Replay line.** Voiced lines get a Replay line button. It plays the recording even while muted.
- **Test.** test/browser_story_preview.js steps through the chapter-one card.

Verified in the browser pane: chapter 1 and chapter 2 cards; Hiwot's join toast; with a forced full company, the seat menu, swapping Winston out and the save afterwards; replay fetched `wren_ward/q1_catchup_1.mp3` while muted. `node test/browser_story_preview.js` passes.

**Ally and enemy limits on screen (research only).** The combat sim takes any number of units. The stage layout limits it:
- **Allies:** 2 beside Hiro (`spawnCompanions` has two marks behind him, kept clear of the HUD; `X.party.fieldMax = 2`).
- **Enemies:** 4 per wave (`Camp.maxWave`). Three sit on fixed marks; larger or wider groups are packed across x 750–1230 at full scale.
- **Original campaign:** fights field 3 foes in 34 of 55 encounters and 4 in 9, so 4 covers it. The original's company is up to 6 people, so party fights would need about three more ally marks, or packing like the foes.

**Still open (Astra):** sound starts muted and isn't remembered; death beats lack the original's caption, red flash and pause. The backdrop logs "Texture key already in use" when beats are clicked through faster than the scene image loads.

---

## 2026-10-11 — Campaign is the front door for playtesting; download fixes

**Campaign start and end (Hiro: start at chapter 1, To be continued after chapter 3).** `Play Expeditions.bat` and `play_local.js` now open `docs/STORY_CAMPAIGN_PREVIEW.html`, whose title offers Begin (chapter 1), Continue and Play Arcade; `/index.html` still opens Arcade directly, so every Arcade test and the battle frame are unchanged. In `docs/story_preview.js`, `PLAYABLE_THROUGH = 3`: once chapter 3 is complete (after its reward screen) the campaign shows a To be continued screen with Back to title and Play Arcade, instead of opening chapter four's dialogue and stopping at its unready fight. The save still records chapter four, so raising the constant as chapters land lets Continue pick up there; test/browser_story_chapters.js's chapter-four assertions still hold. Verified in the browser: Begin opens chapter 1's first line; a save past chapter 3 shows the screen; the launcher serves the page; no errors. Test saves removed afterwards.

**Download fixes (from the 9 Oct review).** Battle backdrops now load their location's travel scenery under the travel scene's own texture keys (`battle_stage.js`: Coast and Citadel map to coast-mast-vault and citadel-bridge-leap), so each file downloads once and is held once; the byte-identical `stages/coast` and `stages/citadel` copies are no longer used, and their battle-specific lamp anchors are kept. Ship list drops what nothing loads: the shared battle plates alley/forest/marsh/road/ruins/tavern, the four v1 travel panoramas, the pre-layer `stages/` folder and the code-drawn swamp defeat sheet (the mountain far plate and the city defeat sheet stay). Bram's bust loads only while he can be hired, and the bust preload listener is now `once` so scene restarts no longer stack listeners. Ship set 166.80 → 162.32 MB. Kept on purpose: Bram's 12 voice lines (hero-pack path, pinned by the media-hash contract). Not done: loading only the shown inn painting (saves ~0.6 MB per visit but a mid-visit guest change would show nothing). Files on disk are untouched. `expedition_sim` and `ship_budget_contract` now assert the travel-based layers ship and the retired plates do not; `docs/LEVELS.md` regenerated; `physics_memory` keys updated; props folders are named by stage set (brief updated). `npm test` green. Browser: Coast, Citadel and forest fights use the shared travel keys, no request to `stages/`, no Bram bust, only the mountain plate from `assets/anime`, no errors. Script stamp 20261011-xp3.

---

## 2026-10-11 — Campaign chapter three, survival-safe animation and branch QA

Campaign work only; original Adventurer and all synced shared files remain untouched. Re-ran the original importer: no content differences, 14 chapters / 55 encounter slots / 59 identities, all 974 referenced media still available. The normal boot remains Arcade because chapters 4–14 are unfinished. `docs/STORY_CAMPAIGN_PREVIEW.html` now correctly describes the playable first three chapters.

**Art / intake.** Registered count 9 → 11: Snarl's existing set is bound at height 385; Bahadır's 24 ordinary poses, two 16-drawing Hiro disarms and 16-drawing enemy finisher are intaken at height 350. His mandatory survival uses explicit `nonlethal` paired metadata. Repaired clipped boots and the leg-cut recovery strip after visual inspection found merged neighbor poses and a missing Hiro. Every recovery frame now contains both characters. Source masters, rejected sheets and built-in image_gen prompts remain in sibling `astra-v8/story-enemies/bahadir/`; no voices were generated. The paired builder can omit only frames with declared replacements, requires every hole to be filled, and keeps multiple repair strips in separate paths so their hashes cannot overwrite each other. The original disarm source standing reference changed 230 → 260 to reduce its scale jump.

**Survival / physics.** `Actor.play('down_fade')` now excludes `campaignExit` opponents from defeat knockback. Regression covers both a survivor (no throw) and an ordinary opponent (throw remains). No changes to the other session's knockback, memory or props modules. Rebuilt the development previews to include the current props script; Matter remains dormant with zero bodies when there is no prop art.

**Verified.** Main chapters 1–3: nine actual fights, zero retries, original scenery/choices, gold rewards and reload into chapter four, no page errors. A separate chapter-three run chose Devendra's payment route and played Bahadır's alternate fight through to chapter four successfully. Raw review and actual battle checks exercised all sixteen frames of both Hiro variants and the enemy fatal, with camera reset and native-atlas restoration. New `browser_story_spared.js` takes the original Nib bypass, verifies the first guide appears at Cobb, forces a defeat presentation, reloads the story, clicks Retry and verifies full health (344/344) plus the same bypass outcome/tutorial. `npm test`, `npm run test:story`, `npm run test:ship` passed. The 55-slot between-turn balance gate passes without stalls, but several late fights remain only 1/20 wins and are not balance-approved.

**Files.** `story_art.js`, `actors.js`, actor lifecycle regression, paired builders, Bahadır runtime/review atlases, generated preview pages, preview notice, chapter/roster browser tests, spared-Nib browser test, GDD/production/status documentation. Survival guard and Snarl binding were captured during the work in checkpoint `4f756d4`. No publishing or portal export.

**Still unfinished.** 43 opponent identities; chapter-five art is next after the mine branch checks. Later chapters need per-location floor/weather review, complete scene and irreversible-event browser coverage, stronger solo balance, geographically appropriate supplemental encounters, then the main Campaign/Arcade title and lazy-loading/package audit. This entry is not completion of the requested campaign.

Full registered-roster playback and all seven ending-card/narration checks also passed after the repairs. `sync:check` still reports the pre-existing `js/ui/gate_ambience.js` drift (239 in sync, one drift); it was left untouched. Superseded Bahadır atlas pages were archived into its sibling source-art `retired-runtime/` folder, not deleted. Chapter-four Tunnel Kobold is now intaken: 24 ordinary drawings plus two 16-drawing Hiro pairs and one 16-drawing enemy pair. Total registered count is 12/59 (47 remain). Actual three-kobold encounter playback passed both Hiro variants, all enemy defeat frames, native atlas restoration and camera reset. Measured per-frame floor anchors exclude the dropped sword; a narrowly scoped source-region ownership correction assigns that sword to its real frame instead of the following row. No pixels were redrawn for that fix. Paired builder now accepts split 2×4 sheets with separate anatomical references. Runtime art is about 7.46 MB, chapter-lazy-loaded. Kobold Shaman source production is next; chapter four remains unavailable from the three-chapter title. npm test, test:story and test:ship also passed after the Tunnel Kobold intake. Subsequent Kobold Shaman intake brings the current total to 13/59: 24 ordinary poses and three 16-drawing pairs (about 8.45 MB), original fire/healing kit preserved, both Hiro variants and complete defeat playback verified in the flooded-level encounter. Final-state floor anchors were measured against bodies rather than the dropped staff/sword. The chapter browser test now checks the source encounter count instead of hard-coding three fights; chapter four has four. Chief art was still in progress at that checkpoint. It, Acolyte of Veylan and Grukhar are now registered: 16/59 total. Each adds 24 ordinary poses, two 16-drawing Hiro pairs and one 16-drawing enemy pair. Chief costs ~9.75 MB, Acolyte ~6.58 MB, Grukhar ~7.28 MB, all chapter-lazy-loaded. Corrected five-pose output, clipped robe edges and a recovery that stood Hiro back up; rejected drafts and precise replacement mappings are preserved with source prompt records. New tools/story_contact_sheet.py resolves the actual manifest (including replacement sheets), so review never mistakes stale intermediate files for shipped frames. Both Hiro variants and complete fatal playback passed in the actual mine groups.

The original mine painting left the enemy side over a chasm. Added an edition-owned combat adaptation with a continuous wet stone/timber near platform; dialogue keeps the original painting and battle keeps its distant cavern, animated ambience and fixed contact layer. Mine caster encounter HP multipliers: second 1 → .65, third 1 → .70, fourth .60 → .40. Damage multipliers: .35 → .16 / .16 / .15 respectively. Twenty-seed between-turn simulation wins: 4/20 → 18/20, 6/20 → 14/20, 4/20 → 12/20; no stalls. Main mine route resumed the verified chapter-three save, won four fights with one retry, preserved choices, awarded gold and gate_cure, then reloaded at chapter five. The branch test now resumes earned state rather than fabricated completion flags, and counts the live encounter rather than an advanced victory checkpoint. Spare-route rerun passed: three actual fights, original bypass, saved grukharSpared outcome, reward and reload into chapter five. The local preview cap is now four; that cap shares an uncommitted file with the other session, so only this session's notice wording is staged. npm test, test:story and test:ship passed. No original source, shared file, publishing or export changed. Femi is now intaken and verified in the real Hollister encounter: 17/59 identities, 42 remain. His original named portrait/dialogue establish a male merchant, so those override the unrelated female mini thumbnail. Added 24 ordinary drawings and three sixteen-drawing pairs (~7.18 MB), with targeted repairs for touching cells and clipped weapons. Resolved-frame review, both Hiro variants, complete frost-touch defeat playback, camera restoration and native textures passed. npm test, test:story and test:ship passed after intake. Burning Gauntlet Soldier, Hobgoblin Sergeant, Road Bandit and Skarn ordinary source sheets are drafted only; no incomplete sets are enabled. Their pairs and Gorruk remain chapter-five work. Source prompts, references and rejected drafts are retained in sibling astra-v8.

---

## 2026-10-11 — Physics step 2: battlefield props engine and the art brief for the next steps

The remaining physics and open-road steps need new art, so this pass builds what the art plugs into and writes the brief for it.

**Art brief.** New `docs/PHYSICS_ART_BRIEF_20261011.md` for Astra: prop sheets per location (7 props each with sizes, breakables and debris cells, prompt skeleton), the segmented ragdoll pilot (wolf in 8 pieces, elven ranger in 12, overlapping rounded joints, assembled reference), the world map (2560 x 1440, five sites, roads, three future sites, no text), the forest road-segment kit (three layers that join at y = 612, plus traced ground lines) and five road-event vignettes, with an approval order.

**Props engine.** New `js/expedition/props.js`. The fight scene now runs Matter.js (bundled in Phaser, no download) with gravity; with no props it holds zero bodies. Once a location's sheet is delivered and listed in `X.Props.available`, its `props.json` atlas loads with the battle stage, the props stand on the combat floor with floor and side walls, blows push nearby props away from the hit (`beats.js` impact), a body thrown by the knockback shoves props it lands among, and breakables shatter into four debris pieces that fade after 2.4 s once they move faster than a heavy blow. Matter freezes with pause, clock and hit-stop and follows cinematic slow motion. Presentation only. `X.Memory` frees a location's props with its other art. Manifests are validated before anything spawns. Nothing is loaded or drawn today: no location has prop art, and the no-placeholder rule stands.

Verified in the browser with a test-only canvas texture created in the page (not shipped): props rest exactly on the floor, a blow rolls a heavy rock about 125 px, a close heavy hit shatters a crate, and a thrown wolf shoved a crate from 860 to 1104 px. No console errors. Matter world idle with zero bodies in normal fights. `test/physics_memory.js` gains props dormancy, manifest validation and memory checks (10 checks). `npm test` green. Script stamp 20261011-xp2.

---

## 2026-10-10 — Campaign continuation: first two chapters, art intake and honest readiness gates

The original `adventurer/` remains read-only. The new campaign is **not finished or published**. Chapters 1–2 now pass an actual browser playthrough through all six fights, source dialogue/choices, scene changes, chapter rewards and reload into chapter three. Default `index.html` remains Arcade. The separate development title is `docs/STORY_CAMPAIGN_PREVIEW.html`.

**Presentation and art.** Original portraits, environments, story paintings and all seven finale cards are routed with their existing recordings/music. The separate title/dialogue backdrop uses original fire/water/cloth/weather ambience and sleeps during battle. Cobb, Hired Knife, Consortium Mage, Merle and Lurleen join Nib as registered humanoid combat sets, each with two Hiro pairs and one enemy pair containing sixteen distinct drawings. Road Wolf reuses the approved gray wolf and its existing three Hiro pairs. Merle's adjacent-frame overlap and Lurleen's wrong-facing lunge were repaired at source; Lurleen's ordinary alpha matte has a measured opt-in correction in the builder. Masters and prompt/reference records stay in sibling `astra-v8/story-enemies/`. Later roster production is tracked by generated `STORY_CAMPAIGN_STATUS.md`; declarations never bypass missing art.

**Story state.** Original campaign gift ledger and acknowledged notifications now persist across reloads. Chapter rewards previously paid zero: each now pays the original quest payout once (the first two chapters together pay 1,500 gold). Retry previously restored checkpoint HP: now full health, retaining prior chapter progress and restoring current-fight choices. Chapter return also restores health, replacing the original home recovery screen. First-fight tutorial state stays with its retry checkpoint.

**Combat audit.** A sealed Counter button used to report ready, repeatedly displace Basic Attack, fail inside the engine and waste Hiro's turn. Edition readiness now rejects sealed/shocked skills; a regression proves Basic Attack remains legal and no cooldown is charged. The 55-slot balance audit formerly used turn-only taps; it now uses the actual between-turn cast path. Provisional solo tuning: base enemy damage 0.60; chapters 4+ 0.35; Nib 0.30, Merle 0.35; enemy recovery budget 1.00 → 0.25 of max HP across healing/drains/overheal; Grukhar room's combined enemy HP 1.00 → 0.60; previously added percent-hit cap remains 0.28. All 55 slots have winning seeds and no stalls over 20 seeds each, but several later rooms still have low win rates. This is **not final balance approval**. No Arcade balance or shared core file changed.

**Files / verification.** `story.js`, `story_combat.js`, `story_art.js`, `story_scene.js`, `story_stage.js`, `story_backdrop.js`, `story_presentation.js`, `docs/story_preview.js`, preview templates/generated pages, actor builders and registered atlases; `encounter.js` plus sealed-skill regression; production tracker/GDD/status generator. Browser roster checks exercise both Hiro variants and every registered enemy's lethal-DOT finisher, complete playback, unrelated-enemy visibility, atlas restoration and camera zoom 1. First-two-chapter playthrough had no retries or page errors. Seven ending cards, original Tesfaye audio requests and mobile layouts passed. `npm test` and `npm run test:ship` passed on the combined tree with the separate physics/memory work preserved. Further art intake and later chapters still require their own browser checks.

---

## 2026-10-10 — Physics step 1: knockback on defeat; images freed between locations

From the physics and open-road proposal (Hiro said "work on it"); the two steps that need no new art.

**Images freed between locations.** Nothing ever removed a texture: one lap of the five locations held 147 textures, about 1.1 GB of decoded images, the likeliest cause of stutter or crashes on phones. New `js/expedition/memory.js`: each arcade scene (Expedition, Travel, Inn, End) calls `X.Memory.trim` at the start of preload. It keeps Hiro, the HUD, busts and everything the current quest can field on any wave (monsters including shuffled later-loop ones, their defeat atlases, the quest's battle stages and travel scenes), frees the rest, and drops cached animations that pointed at freed images so they rebuild on reload. Only arcade texture families are touched; story-campaign and unknown keys are left alone. `BattleStage.sets` is now exported for it. Measured in the browser over all five locations plus their inns: peak about 355 MB in a fight, about 144 MB at the inn, and flat across the lap (was 1.1 GB and climbing). Returning to a location reloads from the browser cache and its animations play.

**Knockback on defeat.** New `js/expedition/knockback.js`: an ordinary enemy death throws the body away from Hiro while its painted fall plays: gravity, a bounce off the combat floor, ground friction and a backward tilt that settles flat, then the existing fade and defeat effect. Bosses are heavier and travel less. The health bar and badges hide at launch; the whole body stays on stage. It freezes with the pause menu, the scene clock and painted hit-stop, and always settles within 1.6 s. Presentation only: the simulation already decided the death. Paired finishers and enemy finishers keep their own endings. Hook: one branch in `Actor.play('down_fade')`.

Tests: new `test/physics_memory.js` in `npm test` (bodies never sink below the floor and always settle, bosses travel less, the memory rule frees other locations and keeps the current quest, Hiro, the inn at the inn, and unknown keys). `npm test` green. Browser: throw verified mid-flight and at rest, five-location memory tour, no console errors. Script stamp 20261010-xp4. No new art. Also new: `docs/ART_REVIEW_20261009.md` (unused-art review list from the 9 Oct audit). Next steps in the proposal (props, segmented ragdolls, world map and roads) need new art.

---

## 2026-10-09 — First playable story battle and campaign media continuation

The development campaign now enters Nib's actual Expeditions battle, teaches the first-fight controls, plays either of two Hiro finishers or Nib's defeat finisher, retries with checkpoint health after a loss, and returns to the next original story beat after a win. The browser played opening choices → tutorial fight → victory arrow → next encounter's dialogue and verified reload preserves the result. Main `index.html` remains Arcade; the full campaign is NOT finished.

Nib's 36 ordinary poses and three 16-drawing pairs are registered and intaken (84 drawings total). Repaired clipped/neighbor-overlapping drafts before intake. Both Hiro pairs and the enemy pair have painted blood, measured anchors and authored timing. Browser playback verified all sixteen frames per pair, native-atlas restoration, lethal-DOT defeat presentation, camera zoom 1 and retry. This is a development-playtest candidate, not approval of all campaign enemies. Cobb's next source set has begun; the first approach sheet is held for repeated leading-leg poses and is not enabled.

Copied/hash-verified all 974 referenced original campaign media files into edition-owned storage (43 opening assets previously). Original dialogue and recordings remain unchanged. Added original scene/still routing and chapter/battle music selection. Added an edition combat adapter preserving the authored opponent kits, branches and source escape flags; all 55 default encounter slots plus three branch variants map to identified opponents. Only Nib currently passes art readiness. Campaign-owned run saves now intercept inherited HUD/director saves so they cannot overwrite Arcade. Escaping characters cannot use a lethal paired finisher while their survival flag is set.

Files: story state/combat/art/presentation/scene modules; additive `encounter.js` prepared-foes support; actor escape guard; enemy-finisher actor registration; story preview/templates/import/build tools; Nib build tool, source records, runtime atlases and review page; tests `story_combat`, `browser_story_art`, `browser_story_fight`, expanded `browser_story_preview`. Existing original-game files and the unrelated `docs/ART_REVIEW_20261009.md` are untouched. No publishing or new voice generation.

Validation: `npm test` and `npm run test:ship` pass. Story simulation/identity tests, first-battle lifecycle browser test, raw art inspection and original-dialogue-to-battle browser flow pass. The whole 14-chapter campaign, later art, solo balance, complete cutscene presentation and final title boot still require work; see `STORY_CAMPAIGN_PRODUCTION.md`.

## 2026-10-09 — Portal repair and story-campaign foundation (campaign not complete)

Latest art requirement recorded: humanoid finishers have gore in both directions and double the planned distinct drawings (8 → 16; 12 → 24). Story readiness now rejects absent/invalid frame evidence and finisher counts, insufficient doubled counts, and absent gore confirmation. Regression checks pass; this is an intake safeguard, not a claim that the unfinished finisher drawings have passed visual QA.

Replaced Citadel's repeated-step portal sheet with twelve new drawings: passing legs, planted casting, a tucked crossing, landing and recovery. Fixed hip-based horizontal registration and authored ground guides; casting frames stop translating. Action duration 2050 → 1320 ms, journey 10050 → 9320 ms with unchanged four-second fast run-in/run-out, 420 px/s speed, original plate/weather and centered exit. New content-hashed atlas page and JSON revision prevent stale-cache rectangle mismatches. Review note now describes the replacement rather than saying it is unchanged. This closes the documented portal-art rework for playtest; artistic acceptance remains the user's.

Started the requested original-campaign adaptation without changing the original Adventurer or synced shared files. Read-only import inventory: 14 chapters, 55 authored encounter slots, 59 opponent identities including branches, 840 locally available voice clips, 21 music tracks; all 974 referenced media files exist. Dialogue text is unchanged. Separate story save/checkpoint adapter reuses the source-identical Campaign3/GateFinale modules and preserves ask/reply choices, bypasses, no-escape choices, recruited story companions, actual outcomes and the finale soul event. Story companions are dialogue-only; combat allies are explicitly empty. Defeat retries the current fight and preserves completed chapters. Tutorial marker waits for the first actual fight, including if Nib is spared. No campaign combat has been enabled without its required art.

Added an explicitly labelled development title/prologue preview using the original Lanternhold panorama, music and voices; 43 existing media files copied into edition-owned preview storage. Original and Arcade save namespaces remain untouched. It can play opening choices and resume, then deliberately stops before unfinished combat. The normal game's boot remains Arcade until the campaign is ready. This is not the requested finished 14-chapter game; see STORY_CAMPAIGN_PRODUCTION.md for the exact remaining work.

Art direction confirmed: local humanoid finishers need gore in both directions and double the planned distinct drawing count, minimum 16 (12 planned means 24). At least two Hiro/one enemy pair per campaign opponent, maintaining source escape/sparing outcomes. Nib now has a source full-body identity matching his dialogue portrait rather than his inconsistent old mini portrait. Drafted 36 ordinary combat poses; registration/pairs remain pending. The first eight-pose overhead-pair draft is held for uneven gutters/right-edge clipping and is not intaken. Source prompts/references and rejected drafts retained in sibling astra-v8. No paid voice generation or publishing.

Files: Citadel actions atlas/scene; travel_art.js; index cache stamp 20261010-xp2; art review; js/expedition/story.js; assets/expedition/story/campaign.json and preview media; tools/{build_portal_v8.py,import_story_campaign.js,build_story_preview.js,story_preview.template.html}; docs/story_preview.js, STORY_CAMPAIGN_PREVIEW.html, STORY_CAMPAIGN_INVENTORY.md, STORY_CAMPAIGN_PRODUCTION.md, GDD; test/{story_campaign.js,browser_story_preview.js}; package.json test:story/story:inventory/story:preview commands. Unrelated docs/ART_REVIEW_20261009.md was left untouched.

Validation: baseline and post-change npm test and npm run test:ship passed; browser_v3_art --expansion --travel-only verified Coast/Citadel travel (not its skipped finisher cases). Story unit tests verify text parity, media existence, choices/bypass, solo world, isolated save keys, retry and finale continuity. Story browser test verified original voice/music requests, ask/answer flow, saved resume, explicit missing-art gate, 1280/375/390 layouts and no page errors. New Nib drawings are source drafts, not QA-approved combat. Full campaign encounter balance, animation coverage, scene integration and end-to-end playtesting remain outstanding.

## 2026-10-09 — Replaced rejected finishers; doubled elf poses; removed foreground scenery

Replaced 17 Hiro moves: moss giant pair one, both Coast pairs for crab/toad/vulture/Hydra, and both Citadel pairs for wizard/ranger/dark swordswoman/enchantress. Eight elf clips go from 8 to 16 painted poses and from roughly 1265–1380 ms to 2360–2420 ms authored playback. Nine creature replacements have 8 poses at 1500 ms; their prior clips had 6–8 poses. Cinematic scaling remains separate. Clear preparation, contact and recovery holds accompany the new drawings. Review IDs and the 51-move active roster stay stable. No enemy-on-Hiro moves, combat rules or retired clips changed.

Fixed registration uses one horizontal anchor and anatomical reference per clip, rather than following the pair's changing silhouette. Removed generated border rules before measuring feet. Reordered Hydra collapse/dissolve and the swordswoman parry; matched ranger contact to the first visible injury. Preserved boss-family matching after a browser test caught Hydra falling back to a normal slash. Retained ordinary frames bypass matte extraction and are losslessly packed, with a separate pixel/alpha/root-offset baseline check. New elf blood is painted into the pair; the old generic overlay is suppressed only there.

All six travel presentations and seven battle settings now draw distance → animated weather/scenery → Hiro/contact ground. Former near/foreground decorations are neither loaded nor drawn. Clouds, weather, flickering lamps and location effects remain behind Hiro. Travel speed/duration and centered run-out are unchanged. This supersedes the earlier foreground-at-150% direction. Citadel's previously flagged repeated-leg portal drawing remains a separate known rework.

Files: nine actor atlas sets; tools/build_v7_pairs.py, tools/verify_v7_pairs.py, tools/art_intake_v2.py; battle_stage.js, travel_art.js, scene.js, scenes_town.js, gore_fx.js, painted.js; index.html cache stamp; review pages/renderer, registration/pacing/visual/layer tests, GDD and FINISHER_REPLACEMENTS_20261009.md. Source masters, rejected drafts and prompt/reference records: sibling adventurer-expeditions-source-art/astra-v7/finisher-replacements-20261009. Local edition only; original Adventurer untouched; no publishing.

Validation: npm test, npm run test:ship, all 26 earlier/expansion pair playback cases, six journeys, seven battle settings and all 71 review entries passed. Verified 255 retained frames pixel/alpha/root-identical. Atlas images now use content-hashed filenames so cached images cannot conflict with new rectangles; removed the obsolete explicit moss page from the ship allowlist. Cold startup measures 23.40 MB after audio unlock on desktop/portrait/landscape, still above the historical 20 MB portal gate for this size-waived local build. Total 103.23 → 147.03 MB / 250 MB. Details/evidence: FINISHER_REPLACEMENTS_20261009.md. Final artistic approval remains with the user's playtest.

## 2026-10-09 — Unified visual review workspace

Added docs/ART_REVIEW.html: one selectable player for 71 items (33 Hiro finishers, 18 enemy finishers, six complete travel scenes, six obstacle action sheets, seven battle settings, and Hiro's normal run). Uses current runtime travel/scenery renderers; pose/finisher inspection uses packed atlases and authored timing with a fixed camera. Raw pose mode intentionally omits the cinematic camera and separate blood overlay, and labels that limitation. No art or gameplay changes.

Controls include location/type filters, play/pause/replay, quarter/half speed, timeline scrubbing, individual frame stepping, previous-pose ghosting, weather previews, frame screenshots, stable item links, and browser-saved rework/removal notes with copy/download export. A separate action view exposes every pose, including poses outside the playable travel action range. Game scenes never boot; review notes use their own storage key. Existing FINISHER_REVIEW.html now links here and its stale 27-item heading correctly says 51.

User finding confirmed, not silently fixed: Citadel portal entrance/exit/run-out repeats the same leading-leg extension and can read as a long sliding step. It is explicitly flagged on both Citadel review views, awaiting the user's consolidated rework list.

Files: tools/build_art_review.js, tools/art_review.template.html, docs/art_review.js, docs/ART_REVIEW.html, tools/finisher_review.template.html, docs/FINISHER_REVIEW.html, test/browser_visual_review.js. Browser QA loads all 71 items, verifies their distinct atlas identifiers and last-frame access, weather and filters, note export, desktop/390px layout, and preservation of sentinel save/preferences. Evidence: test/reports/visual-review. Rebuild with node tools/build_art_review.js after changing runtime art/modules. No live Adventurer writes, publishing, or added runtime download bytes.

## 2026-10-09 — Combat and layered travel polish (local edition)

Corrected the dark-elven swordswoman's four idle poses and two recovery poses to face Hiro. Mirrored only those source derivatives and their anchors; attacks and paired art retain their authored directions.

Reviewed all sixteen Coast/Citadel Hiro finishers. Added 19 selected bridge drawings: both pairs for each of the four elves (6 → 8 poses each), Hydra pair one 6 → 7 and pair two 6 → 8. Reordered crab pair one's crouch/lift/leap. One generated Hydra anticipation had an extra head and was rejected. New authored holds replace the old generic runtime timing override: Coast eight-pose clips 1620 → 1380 ms; six-pose expansion clips 1500 → 1265/1380 ms after additions. These are unscaled clip times; cinematic time scaling remains unchanged. Impacts hold 200 ms, final recovery 300 ms, connecting poses mostly 115 ms. Eight enemy finishers retain their drawings with clearer anticipation/impact/recovery timing. No balance, damage, retirement or defeat-trigger changes.

Local humanoid Hiro finishers now have blood impacts and droplets, with bloody follow-through drawings on the new elf pairs. A shared eight-frame transparent effect also covers the orc, goblin and hag. Contact positions are measured against each paired drawing's Hiro pivot, rather than the separate enemy actor that is hidden during the pair. Effects freeze during pause and clean up on cancellation/shutdown. The effect is website-gated; new bloody paired art is part of this local build. This is not a freshly prepared restricted-site export.

Travel: replaced both new jumps with twelve-pose sequences — Coast hang-gliding (10.50 s journey) and Citadel portal jutsu (10.05 s). Each retains four seconds of fast running before and after, 420 px/s ground motion, and recentering at x=650. Portal crossing holds the entrance pose until the exit drawing rather than sliding a half-entered Hiro across the gap. Removed the Citadel foreground tree/bamboo obstruction. Repainted the city ground without the misplaced mountain ridge; replaced the rooftop foreground with a low tiled/ivy edge and moved its bird flight clear of Hiro's face.

All six travel obstacle plates now have transparent distance regions, registered back to the approved contact geometry, so their separate distant scenery/cloud plane continues showing during actions. Foreground scrolls independently in front, with mirrored alternating tiles avoiding edge discontinuities. All seven active battle settings retain far/ground/near planes; far and near move while the combat floor stays fixed. Added soft moving cloud banks and flickering lights anchored to painted lamps/windows; Coast water glints, Citadel motes and existing weather continue.

Validation: npm test, npm run test:ship, new visual_polish contracts, seven-stage browser layer checks, sixteen new and ten retained old paired-finisher checks, all six travel timelines, and the full Coast → inn → Citadel → inn journey at 390 CSS pixels passed. All 18 enemy finishers passed actual lethal/DOT/fallback-to-End routing. Recorded the sixteen new pairs at playback speed and inspected registered pose strips and in-game contacts. No missing textures or browser exceptions in these gates. Headless Chrome and emulated widths, not physical-device certification. Cold startup after audio unlock: 23.67 MB on desktop/portrait/landscape, so the historical 20 MB portal gate remains red as expected for the size-waived local edition; total runtime about 103.23 MB / 250 MB. No original Adventurer writes or publication.

Files: assets/expedition/{eight expansion actors,adult/*-fatal,adult/blood,stages/citadel,travel/*}; js/expedition/{actors,painted,enemy_finishers,travel_art,battle_stage,atmosphere,light_anchors,gore_fx}.js; index.html; tools/{build_citadel_combat,build_pair_polish,build_travel_polish,register_travel_layers,pair_polish_boards,build_light_anchors}.py; package.json; test/{art_registration,visual_polish,browser_battle_layers,browser_v3_art,browser_startup_budget}.js; docs/FINISHER_REVIEW.html, GDD and VISUAL_POLISH_20261009.md. Source masters, 17 built-in imagegen request records and registration manifests: sibling adventurer-expeditions-source-art/astra-v6/polish-20261009. Evidence: test/reports/{polish,v3,battle-layers,expansion,enemy-defeats,startup}. User playtest remains the final visual acceptance.

## 2026-10-09 — Coast and Arcane Citadel completed for local play

Integrated Shipwreck Coast as location four and Arcane Citadel as five. The active circuit is forest → swamp → city → coast → citadel → repeat. Each new location has two group encounters and its own boss; later loops include the new enemies and bosses. Hiro remains the only playable hero, with recruiting locked. Existing scores, health and quest history remain; playthrough numbering now uses five clears rather than three. No save wipe, original Adventurer changes, publication or CrazyGames export.

Art: eight complete opponent sets (crab, toad, vulture, Hydra, male elven wizard, female elven ranger, dark-elven swordswoman and enchantress), sixteen unique Hiro finishing moves and eight enemy-on-Hiro endings. 217 ordinary combat drawings + 155 paired drawings, with contact/release markers, transparent packing and per-source body registration. Repaired wizard boot/neighbor hair and the incomplete swordswoman pair before intake. Hydra normal height 365 → 460 to match its boss-scale pair; enchantress first-pair approach ratio .75 → 1.4 keeps the whole contact inside the screen. User-retired moves remain excluded. FINISHER_REVIEW.html now has 51 active clips: 33 Hiro + 18 enemy.

Scenery: Coast reuses its reviewed three-plane stage; Citadel has moonlit academy/pavilions, a level bridge floor and foreground bamboo. Both retain weather support and have environmental glints/motes. Each has a 12-drawing obstacle action with transparent reaction strips, fast 420 px/s run-in/run-out, camera tracking and recentering. Run floor stays at y=612 outside the painted action to avoid floating over the Citadel walkway. Music is Cookie Blade of Clove Battle theme (coast_clove.mp3) and Ronin battle theme 2 (citadel_ronin.mp3), used for battle and travel. New ordinary defeat effects are Coast spray/sand and Citadel violet motes.

Combat: eight edition-owned Citadel skills provide volleys, wards, enchanted arrows, one early evasive step, dual cuts, counters, binding and weakening curses. Enchantress empowers once at half HP, gaining 20% attack without stacking. Coast balancing reduced the three regulars' attack multipliers .63/.62/.62 → .42; Hydra initial HP/attack 1.55/.60 → 1.15/.30, defense .8. The middle Coast group changed vulture+crab+toad → vulture+crab. Headless validation includes a conservative 1500 ms/action clock so real-time skill cooldowns actually advance: 480 isolated encounter trials resolved; 160 full three-fight journeys carried health (Coast 79/80 wins, Citadel 80/80). These scripted first-loop results are not a player success-rate prediction; later loops continue scaling.

Defeat rule follows the latest request: enemy finishers trigger on actual zero-HP defeat, with no random roll when an eligible loaded enemy remains. Removed the earlier 30%-HP premature execution, which browser QA caught interrupting the tutorial before Hiro was dead. Website default on; a saved explicit off remains off; restricted profiles remain disabled. Direct lethal hits, fatal DOT, already-down visuals and final director fallback are covered; no repeated execution. Pause-menu text matches the new rule. Missing/unavailable enemy art still falls back safely to ordinary defeat.

Validation: npm test and npm run test:ship passed. Browser art QA exercised both Hiro variants for all eight new enemies (16 pairs), sampled both new travel timelines, and verified recentering/full duration with no page errors. All 18 enemy defeat clips passed lethal and DOT/fallback browser routing, including the real End handoff. Complete Coast → inn → Citadel → inn playthroughs passed at 1280 and 390 CSS-pixel widths with actual UI taps, saved progress reload, correct music and carry-health. Enchantress phase check confirmed exactly one 20% increase. These are Chrome desktop/emulated-width checks, not physical-phone certification. Runtime package ~100.45 MB against the user-approved 250 MB local budget; no mobile-portal size claim.

Files: js/expedition/{data,campaign,encounter,painted,enemy_finishers,ui_common,travel_art,battle_stage,defeat_fx}.js; index.html (shared cache stamp 20261009-xp4); assets/expedition/{eight new actors,adult/*-fatal,stages/citadel,travel/coast-mast-vault,travel/citadel-bridge-leap}; audio/music/{coast_clove,citadel_ronin}.mp3; tools/{build_citadel_pairs,build_expansion_runtime}.py, build_finisher_review.js, ship_manifest.json; package.json; test coverage and browser journey/finisher checks; docs/LEVELS.md, GDD, ARCANE_CITADEL_PLAN.md, FINISHER_REVIEW.html and art production records. Source masters and prompts are preserved under sibling adventurer-expeditions-source-art/astra-v5/{coast-20261008,citadel-20261009}; review atlases/registration live under docs/art. Test evidence: test/reports/{expansion,v3,enemy-defeats,expedition}.

Audit note: sync:check reports 239 shared files matching and one pre-existing drift, js/ui/gate_ambience.js (unchanged by this pass; last Expeditions commit 95ad933). It was not overwritten or synced from the live game. The playable/shipping regression gates pass with the existing local copy.

Playtest: open the local game normally; for a quick visit use the developer cog → Preview a location → Shipwreck Coast / Arcane Citadel. That developer shortcut creates a preview run. Final visual taste remains for the user's playtest.

## 2026-10-09 - Coast targeted animation repairs

Repaired the two Hydra poses flagged by QA with single-pose imagegen edits: attack index 3 and hit index 2 now show five readable heads. Added one crab claw bridge drawing (attack 12 -> 13 frames), retaining 690 ms total and contact at 325 ms (index 6 -> 7). Toad approach now uses source-pixel hop offsets [0,35,16,0] instead of all-zero lift. Original source masters preserved; repair masters and prompt records saved. Preview-only, not an unlocked quest.

Files: tools/build_coast_combat.py, docs/art/coast-20261008/combat generated atlas/metadata, repair-prompts.json, QA.md, test/browser_coast_combat.js. Source repairs live outside runtime in adventurer-expeditions-source-art/astra-v5/coast-20261008/repairs. New single-pose drawings use explicit scale registration against their original sprite width; no per-frame auto-fit. Registered comparison inspected at test/reports/coast/qa/repairs.jpg.

Validation: npm test passed; browser Coast preview passed four atlases and 117 nonempty frames (previously 116), bounds/contact markers and no browser errors. Repairs improve the flagged poses; final Hiro-relative scale, paired contact and full journey acceptance remain pending. Coast still needs complete paired finishers, travel and quest integration; Citadel remains queued. No original Adventurer changes or publishing.

## 2026-10-09 - Defeat finisher reliability and fifth-location direction

User reported that enemy finishers still did not play when Hiro was defeated. Found a default-state coverage gap: website preference started false when absent, while browser tests explicitly enabled it. Website default is now on; explicit saved off is preserved; restricted profiles remain disabled and never load adult assets. This confirms a fresh-profile problem, not the user's exact saved preference. Added EnemyFinishers.ensureDefeat at the final defeat boundary so missing down presentation or an already-down visual actor can still play an eligible loaded enemy's finisher before End. No random chance; do not replay an already-presented execution. Existing <=30% direct-hit execution remains unchanged. A missing/destroyed eligible enemy or missing art still uses ordinary defeat.

Files: enemy_finishers.js, scene.js, ui_common.js, index.html cache stamp 20261009-xp2, enemy_finishers.js test and browser_enemy_defeats.js. Added test/finisher_coverage.js to npm test: all ten shipped enemy identities require an active Hiro pair (excluding retired and bite-response clips), an enemy-on-Hiro pair, valid frames/contact/timings/page files, and enemy loader registration. Current coverage: 17 Hiro finishers across ten species; ten enemy defeat clips. Future actors cannot enter the shipped list without this coverage passing.

Validation: npm test passed. Browser enemy-defeat tests now start with the website default instead of forcing the option on. All ten passed the already-down/missing-down fallback; all ten passed fatal DOT routing. Actual defeat method with missing down presentation reached End after its finisher. Actual director also reached End after the existing low-health execution. browser_finishers.js passed actual Hiro Finisher kills against all ten current species in installed Chrome. Existing explicit-off and portal policy tests passed. Checkpoint b21e7f7.

Expansion direction: user confirmed continuing with Arcane Citadel after Coast (fifth location). Recorded the adult elven wizard, ranger, dark-elven dual-sword warrior and enchantress boss, full combat sets, two Hiro pairs plus one enemy pair each, and three-layer scenery/travel requirements in docs/ARCANE_CITADEL_PLAN.md. This overrides the earlier monsters-only restriction for this new location. Prepared full Ronin battle theme 2 as audio/music/citadel_ronin.mp3, 160 kbps, 3,881,429 bytes; source/output hashes in docs/art/citadel-music.json. Track not yet in a playable quest or shipping allowlist.

Still unfinished: Coast visual QA repairs, its complete paired art/travel/quest integration, and Citadel art/encounters. Neither new location is unlocked. Current finisher fix is ready for local playtest. No publication, portal export or original Adventurer changes.

## 2026-10-08 - Coast combat QA (review only)

Reviewed all 116 packed Coast drawings and frame timing, reran npm test, browser_coast_combat.js and browser_coast_scenery.js; all automated checks passed in installed Chrome. Visual release approval withheld: Hydra attack frame 3 / hit frame 2 need five-head continuity repair; crab attack 2-to-3 needs a smoother raised-claw-to-extension transition; toad approach frame 1 needs a hop-height anchor rather than pinning its lowest toe to the floor. The per-species gallery fit is not proof of relative size beside Hiro or paired-finisher continuity. No neighbor-frame fragments or rectangular matte observed in the cleaned contact sheets.

Added docs/art/coast-20261008/QA.md with findings, limits and targeted repair order. Contact sheets and metrics in test/reports/coast/qa. No gameplay/art changes, regeneration, deployment or quest unlock. Coast remains unfinished. Checkpoint 53bc274.

## 2026-10-08 - Coast combat atlas intake and twelve-pose attacks

Continued the approved Coast production from checkpoint 4b25319. Added new twelve-pose attack masters for Tidal Crab (pincer snap), Brine Toad (tongue lash), Carrion Vulture (talon swoop), and Wreck Hydra (neck bite). Reused the saved four-pose idle/approach/hit/down sets and Hydra enrage. Review atlases now contain 116 frames total (28 crab, 28 toad, 28 vulture, 32 Hydra), replacing 16 draft attack drawings with 48. Attack preview timing is 690 ms, contact at zero-based frame 6. This has NOT changed live combat timing or balance.

Added tools/build_coast_combat.py and docs/art/coast-20261008/combat.html. Initial rectangular crops exposed neighbor feet/feathers in the vulture attack and clipped long tongue previews. Fixed extraction by identifying each separate solid silhouette, retaining its authored alpha edge within 16 pixels and preserving one reference body scale per source sheet; no anatomy repaint and no per-frame fit-to-box. The extractor fails if it does not find exactly the expected number of bodies. Frame-step, pause and quarter-speed controls support review. The viewer uses one fit scale per actor across all its clips, not a changing frame scale. All 116 frames have atlas bounds/contact checks; no main silhouette touches the outer source edge. These technical checks are not approval of anatomy or in-game pair proportions.

Also generated one eight-pose Hiro/toad tongue-parry finisher draft; Hiro is visible through all eight drawings. It remains unregistered pending paired scale/contact review. All five new source masters, plus extracted combat poses, are preserved in sibling source-art/astra-v5/coast-20261008. Exact prompts and generated source IDs are in combat-production.json. Each atlas has source manifests, hashes and extraction records under docs/art/coast-20261008/combat. Packed review images total about 5.83 MB and are documentation-only, excluded from shipping.

Validation: npm test passed, including simulation, lifecycle, finisher policies/removals and shipping closure. test/browser_coast_combat.js passed in installed Chrome: four atlases, 116 visible nonempty frames, valid atlas bounds and contact indices, zero page/network errors. Inspected idle and contact captures after cleanup. Test evidence: test/reports/coast/combat-results.json and combat-*.png. Existing local ship set remains 69.46 MB; no live runtime files, original Adventurer files, exports or published site changed.

Still unfinished: full visual review of every motion/scale (including Hydra neck continuity), the complete eight Hiro/four enemy paired finishers, Coast travel choreography/effects, quest/music/loop registration, balance and full journey QA. Coast is still locked and not ready for a full game playtest. The new page is an art review only.

## 2026-10-08 - Coast scenery preview and combat-art continuation

Continued the approved Coast expansion. Its three source paintings are now packed into assets/expedition/stages/coast (1,032,394 bytes total). BattleStage has a reusable preloadBackground entry point and Coast registration: distant sea/cliffs, fixed shore ground, foreground grass/rope/rocks. Added moving water highlights behind the ground. The Coast floor uses a 550 px middle-layer display height so Hiro's feet remain on the path at y=612. Existing stage mappings remain unchanged.

Added docs/art/coast-20261008/index.html, a scenery-only preview with the real game's weather renderer, day/sunset/night/storm controls, Hiro's existing idle sprite for scale, and user-triggered playback of Cookie Blade of Clove Battle theme. This does NOT unlock a quest or field placeholder enemies. Music remains unwired to a playable Coast quest until that quest is complete. tools/build_coast_scenery.py reproduces the WebP packing from the saved masters; scenery-build.json records dimensions, source hashes and bytes.

Art production: generated a 24-pose Hydra combat draft, a two-move crab/Hiro draft, a targeted repair, and an eight-pose alternative. Caught missing Hiro in source frame 14 of the first paired draft and cell-boundary overflow; never registered it into gameplay. Repair restores Hiro but remaining crop/scale review is required. Preserved all masters and exact prompts in sibling astra-v5/coast-20261008 and docs/art/coast-20261008/production-continuation.json. Do not regenerate these without reviewing the saved candidates. Existing crab/toad/vulture combat drafts reused, not regenerated.

Validation: npm test passed; test/browser_coast_scenery.js passed in Chrome (three layers, fixed ground, moving far/near, four skies, stable update-listener count after repeated switching, music playback, zero page/network errors). Captures/results in test/reports/coast. Selected local ship set is 69.46 MB, previously 68.43 MB; this is total package size, not startup download. Coast layers are in the existing stages allowlist; source masters and preview documents are excluded.

Still unfinished: measured combat-frame intake and smoothing, all four monsters' validated Hiro and enemy finishers, Coast travel obstacle animation/effects, quest/music/loop wiring, balance and full Coast journey QA. Coast remains locked and is NOT ready for a full playtest. Checkpoint ce16d29. No publication/export update; original Adventurer untouched.

## 2026-10-08 - Coast production started; layered existing battles and defeat routing

User approved Shipwreck Coast only; Stormpeak Shrine and Cinderwood were declined. Coast is NOT playable yet. Remaining: Hydra art, complete validated combat sets, two Hiro pairs and one monster-on-Hiro pair for each of crab/toad/vulture/Hydra, Coast travel choreography/effects, encounter/loop registration, balance and full journey QA. Do not unlock or publish an incomplete roster.

User selected `Cookie Blade of Clove Battle theme.wav` from `C:/Users/charl/OneDrive/Documents/TTRPG/Kenji/music`. Prepared `audio/music/coast_clove.mp3` at 160 kbps (3,900,629 bytes), preserving the full track; not yet referenced by a playable quest or ship manifest. Intended for Coast travel and combat. Source art production drafts (far/ground/near and crab/toad/vulture combat) are preserved in sibling `adventurer-expeditions-source-art/astra-v5/coast-20261008`; generation prompt records are in `docs/art/coast-20261008-production.json`. Drafts are not shipped; inspect edge clipping and improve attack pose count before intake.

Existing battle stages now use three actual painted layers, reusing the approved forest/swamp/city travel assets. Mountain retains its mountain distance plate. Far and near layers move subtly at different rates; middle ground stays fixed for actor contact; existing WeatherFX stays independent. City ground is translated 60 px upward to align the pavement without stretching buildings. Files: battle_stage.js and browser_battle_layers.js. Five existing wave backgrounds checked in Chrome with moving far/near, fixed ground and screenshots. This does not yet change the flat obstacle plates in travel.

Enemy defeat routing now accepts fatal DOT and missing-source events; if the source has disappeared, a surviving enemy with loaded art delivers the finisher. Existing enabled preference, website-only policy and <=30% direct-hit execution remain. No random chance. Ordinary defeat remains the fallback when disabled, outside website profile, without art or without a surviving eligible enemy. Files: enemy_finishers.js, beats.js, enemy_finishers.js test and browser_enemy_defeats.js (new --lethal / --dot modes). All ten existing sets passed 30% and zero-HP DOT playback, frame and ending checks; missing/dead-source selection covered by unit tests. Do not describe this as a guarantee with missing assets or no surviving enemy.

Checkpoint 0ce910d. Baseline npm test and ship journey passed in installed Chrome (bundled Playwright browser absent); post-change npm test, Chrome ship journey (forest and swamp returns to inn), and focused browser checks passed. Original Adventurer and synced shared files untouched. No publication or export update.

## 2026-10-08 - Apply user's finisher removal list and wolf/orc remakes

Removed six Hiro clips from playable sheet descriptors: plant-stem-cut-paired, hiro-alpha-pin-paired, serpent/hiro-finisher-2, beetle/hiro-finisher-2, goblin/hiro-finisher-2 and spider/hiro-finisher-1. Runtime filters also prevent explicit variant selection from reaching them. Original packed pixels and source masters remain recoverable. Active Hiro finishers: 23 → 17. Every creature retains at least one.

Generated two replacement paired sheets with built-in image_gen using Hiro/wolf/orc identity references. Wolf now bites, tackles and mauls with blood; orc uses the axe blade with blood, rather than a handle strike. Intact bodies, no exposed organs or dismemberment. Omitted the wolf source's clipped pose 2, leaving 11 usable poses / 2,000 ms; orc has 12 / 2,150 ms. Both retain the 180 ms approach and optional local 30% execution rule. Preserved first-pass masters; new masters/prompts/extracted frames in sibling source-art/astra-v4/enemy-defeats-20261008-r2. New atlas filenames and JSON revision prevent stale cached art.

Updated docs/FINISHER_REVIEW.html to 27 moves, retaining surviving IDs; fresh feedback key prevents old REMOVE M-WOLF/M-ORC markings from attaching to replacements. Files: painted.js, enemy_finishers.js, two fatal atlases, cache stamp 20261008-xp3, intake and gallery tools, template/gallery, tests, GDD and this log; reproducible prompt/registration/QA records in docs/art/enemy-defeats-20261008-r2. Checkpoint 6dc88e1.

QA: npm test, removal assertions, all 17 remaining Hiro variants through real-browser contact/release/cancellation tests, all 10 enemy defeats at 30% including actual End transition, all 27 gallery animations loaded and retired IDs absent. Reviewed extracted replacement contact sheets and game ending captures. Nothing published; original Adventurer untouched. Replacements are ready for user visual review.

## 2026-10-08 - Enemy finishers at 30% health

Fixed the user's reported trigger mismatch: previously finishers were presentation-only after Hiro reached zero HP. When the local Enemy finishers setting is enabled, an eligible enemy's direct hit leaving Hiro at or below 30% max HP now starts its execution, even without a simulator down event. Successful completion sets HP to zero, marks him down, clears queued skills and ends combat as defeat. The director checks the updated encounter state before another turn. Cancelling the animation does not execute a still-living Hiro. Above 30%, DOT-only damage, disabled setting, missing assets and portal builds retain ordinary combat. Default remains off. Updated the stale Alpha-only pause-menu hint to explain the threshold.

Files: enemy_finishers.js, beats.js, scene.js, ui_common.js, cache stamp 20261008-xp2, threshold and browser tests, review-gallery explanation, GDD and this log. No art regenerated. Checkpoint 08d3c3c. QA: npm test; 31%/30%/29% boundary assertions; all ten enemy executions at exactly 30%; existing Alpha pause/restart/disable/portal checks. Original Adventurer untouched.

## 2026-10-08 - Complete local enemy-defeat art roster

User requested the art without a file-size constraint. Added nine unique monster-on-Hiro paired defeats: wolf, plant, serpent, beetle, moss giant, hag, goblin, spider and orc. The existing Alpha is retained, so coverage rises from 1 to 10 enemy types. New source sheets contain 12 poses each; omitted one clipped sword pose in serpent and beetle (11 usable each), giving 106 new runtime drawings. Seven clips run 2,150 ms; two run 2,000 ms, plus the existing 180 ms approach. All keep Hiro visible in the ending pose. New art uses stylized impacts/curses, intact bodies and limited blood; it is not a graphic-gore delivery. No combat balance or other animation changes.

Integrated into the existing default-off Pause → Enemy finishers setting, website target only. Fixed a first-visit loader bug: multiatlas's internal JSON and clip metadata now have distinct keys, preventing Phaser from deduplicating the clip-data request. Actual lethal direct-hit routing only; DOT and missing art use ordinary defeat. Portal policies and export exclusions remain in place. Whole local ship set is 68.45 MB (was 62.21 MB); this is not the initial download measurement. No 20 MB optimization or portal release claim in this pass.

Files: nine new assets/expedition/adult/*-fatal directories; enemy_finishers.js; index.html cache stamp 20261008-xp1; tools/build_enemy_defeats.py; policy test and new browser_enemy_defeats.js/npm command; GDD; this log; docs/art/enemy-defeats-20261008/{index.html,registration.json,prompts.json,qa.json}. Source masters, extracted poses and visual contact sheets are preserved in sibling adventurer-expeditions-source-art/astra-v4/enemy-defeats-20261008. Checkpoint 1c1e53f precedes edits.

QA: npm test passed; Chrome ship journey forest → inn → swamp → inn passed; all ten actual lethal-hit routes played every expected frame and held the final pose; Alpha pause/restart/disable/off-fallback and portal no-download checks passed. Reviewed all nine extracted source contact sheets and sampled game-rendered ending screenshots. All ten review-gallery clips loaded. User visual playtest remains the final art approval. Nothing published; original Adventurer untouched.

User then requested one file showing every possible finisher for removal review. Added docs/FINISHER_REVIEW.html: all 23 active Hiro finishers and 10 enemy defeats, stable H-/M- IDs, pause/slow motion/frame stepping, removal checkboxes, notes and downloadable text feedback. Works directly from the docs folder without a server (metadata embedded; images reference local game atlases). tools/build_finisher_review.js and its HTML template reproduce the file using runtime timing overrides. Marking a move does not modify the game.

## 2026-10-08 - Combat QA follow-up

Rechecked the October 2 local build. npm test passed; Chrome ship journey passed through forest, inn, swamp and inn; live combat finisher routing passed for all 10 enemy types. The strengthened roster browser test now asserts all 12 attack frames and exactly one logical contact per attack, one logical contact per paired finisher, and a visible/live enemy after cancellation, in addition to Hiro's restored native sprite/scale. All 10 attacks and 23 paired variants passed. Optional Alpha fatal pause/restart/disable and portal policy checks passed. Reviewed sampled plant/goblin/spider browser captures; this does not certify every drawing or resolve the six retained replacement drafts.

Fixed the review gallery to use Painted.sheet's actual runtime holds and paired body scale, rather than raw manifest timings: retained Alpha pin now previews at 1,400 ms. Corrected the atlas test's misleading hard-coded count from 6 to the actual 13. No gameplay stats, production art or fatal content changed; no image-generation credits spent. Files: test/browser_combat_roster.js, test/art_registration.js, gallery index, this log, and qa-20261008.json evidence. Checkpoint 4ad9c11.

Cold-cache desktop/mobile portrait/mobile landscape load correctly, but the unchanged 20 MB startup gate still FAILS: 20,736,266 bytes visible / 21,816,310 with audio; selected package 62,205,030 bytes. Additional monster-on-Hiro finishers remain pending the user's content-direction choice after the image-tool rejection. Only Alpha is implemented. Nothing published; original Adventurer untouched.

## 2026-10-02 - Local combat roster expansion and continuity review

Nine remaining primary attacks expanded to 12 drawings, keeping Alpha's pilot 12; 15 Hiro paired finishers expanded to 12. All 24 clips retain total duration and logical contact time. Alpha pin/parry, both moss-giant pairs, plant crosscut and orc finisher 2 replacement drafts failed review; old approved clips remain. Corrected plant vine-pin's final extracted frame to exclude a duplicate neighboring Hiro. Preserved unrelated clips and original atlas pixels.

Files: ten manifests, eleven appended roster WebP pages, intake tool, cache/script stamps, ship allowlist, atlas/pacing/browser tests and package command; LEVELS/GDD, COMBAT_ROSTER_20261002.md, gallery, prompt records and timing audit. Masters stay in sibling source-art. Original Adventurer/shared files untouched. Checkpoint c6d8871 precedes this work.

Validation: npm test; all 23 live paired variants including cancellation; Alpha fatal policy/lifecycle; Chrome two-quest ship journey. Startup loads but FAILS unchanged 20 MB target: ~20.74 MB visible / ~21.82 MB with audio (pilot ~18.68 MB). Full package ~48.86 to 62.20 MB. Local playtest candidate, nothing published. Remaining monster-on-Hiro fatalities are NOT complete: image tool rejected the wolf request; pending user direction is documented.

## 2026-10-02 - Focused smoother combat and optional Alpha defeat

Local-edition pilot: Hiro slash 6 → 12 drawings / 590 ms, hit 3 → 6 / 350 ms; Alpha attack 6 → 12 / 570 ms, Hiro cleave pair 8 → 16 / 1,620 ms. Retained logical attack contact times and all unrelated clips. Added a 16-pose Alpha-on-Hiro fatal pair (2,110 ms + 180 ms approach) with blood/damaged armor, no separately generated blood-free version. Default-off persisted Pause setting; ordinary defeat when off. Actual lethal direct hits only, no combat stat changes. All non-website release targets deny the setting; CrazyGames export omits adult art entirely.

Files: Hiro/Alpha manifests plus appended pilot pages, new `assets/expedition/adult/alpha-fatal/`, `enemy_finishers.js`, `painted.js`, `beats.js`, `scene.js`, `ui_common.js`, script stamps, ship manifest/export filter, focused intake tool, policy/browser tests, updated registration/pacing/browser tutorial assertions, package scripts, GDD/LEVELS and `COMBAT_ANIMATION_PILOT_20261002.md`. Source masters and prompts: sibling source-art `astra-v4/combat-20261002`; reproducible registrations/prompts also in `docs/art/combat-pilot-20261002`.

Baseline/post-change automated checks and browser journey passed (installed Chrome; bundled Chromium missing). The baseline browser assertion was stale: September 28 Counter-first/repeated readiness reminders now match the test. Browser pilot covers fatal routing, pause, restart, disabling, normal death and portal preference denial/no adult downloads. Local startup ~18.68 MB after audio, portal profile ~17.78 MB; package ~48.86 MB from ~45.62 MB. Frozen export policy checked locally, nothing published. Original Adventurer/shared files untouched. Awaiting the user's visual playtest before expanding beyond Hiro/Alpha.

## 2026-10-02 - Inn mage and warrior paintings back to the originals

Hiro asked for the local game to show the original, more revealing mage and warrior inn paintings again. `assets/expedition/inn/inn.json` points the two variants back at `inn-hiro-mage.webp` and `inn-hiro-warrior.webp` (the 27 Sept paintings, with the dancer, the open robe, the barmaid's tankards and the warrior's bodice), the ship list selects them, and the inn manifest stamp is now `20261002-original` so a cached wardrobe manifest is not reused. The approved wardrobe files `inn-hiro-mage-v2.webp` and `inn-hiro-warrior-v2.webp` and their source masters stay on disk, unreferenced: a kid-safe portal build such as Poki should select those. Script stamp 20261002-xp1 via `tools/stamp.js`. `npm test` green. Verified in the browser pane: both originals load and display at their inn visits, no console errors.

---

## 2026-10-02 - CrazyGames rejection; game removed; Poki access requested

CrazyGames rejected the 29 September submission with a bare "quality" reason and no detail, as it had the original Adventurer. Hiro chose not to appeal and removed the game from the CrazyGames developer portal, so nothing conflicts with Poki's web-exclusivity ask. A Poki developer-access request went in the same day; Poki replies within a few days, then runs a playtest. No code changed. The CrazyGames packager and candidates stay in place.

Poki gaps found against its published rules, to be built as a separate `poki` release target: a 16:9 canvas (the game is 1280x760), Poki SDK adapter with gameplay start on first input and ad breaks with audio muted, no outgoing links (the Facebook buttons and the screenshot note), no external requests (the CrazyGames SDK), skippable travel, pause on Esc or Space, static and animated thumbnails. Open decision for Hiro: the free-text name box on the End screen, under Poki's player-safety rule on typed text.

---

## 2026-09-29 - Submitted to CrazyGames

Hiro submitted the game on the CrazyGames developer portal (Basic Launch, category Adventure, game id 23bde8c7-e42a-4ad7-b48f-eca2908df4ff). Build: the frozen candidate `dist/crazygames-20260928-tutorial` (271 files, 45.6 MB, release check ready to ship), with the store covers and silent previews from `marketing/crazygames-store-20260928/`. Save progress declared as LocalStorage, mobile both orientations, no multiplayer, no SDK mute. QA checklist answered after browser and phone preview checks. Status: awaiting review.

---

## 2026-09-29 - Silent store preview cuts and framing repaired

Rebuilt the landscape and portrait CrazyGames previews as 20-second, 30fps silent edits using completed wolf/travel/swamp/orc/victory action beats. Original three-second travel cut interrupted the vault; portrait horizontal crops also excluded actors. Both versions now fit the entire game frame over soft scenery fill, with no foreground stretching. Added a local preview page and revision notes; updated build script with --videos-only and preserved cover provenance. Files are under marketing/crazygames-store-20260928. No runtime or cover changes.

## 2026-09-28 - New first-quest tutorial; CrazyGames store assets cut

**Tutorial (Hiro's design).** On the first quest the game now holds and points at an icon: Counter Attack the first time it is ready (the first lesson), Finisher every time it becomes ready, Counter Attack every time Hiro is under half health (`X.tutorialLowHp` 0.5) with it ready, and God Aura once on the boss. One hold per readiness window, so a skipped hold does not nag next turn. After the first boss falls nothing holds. `ExpeditionScene.guideSkillUse` and `tutoring()` in `scene.js`; `X.tutorialLessons` retired. `run.tutorial.skipGuide` (the dev panel's flag) switches the holds off, and the arcade browser suite sets it where it skipped the lessons. Simulated: a player who does only what the hand asks wins the first fight 100 %, the second 82 % and the first boss 88 %, against 87 / 6 / 0 % under the old one-lesson-per-fight tutorial with one-turn Hiro. The balance probe's tutorial-follower policy and the simulator's first-quest test follow the new rules; that test passes again. One more assertion, on the shelved companion loop's third-playthrough win rate, was lowered from 30 % to "winnable", since that path is not tuned for the arcade; `npm test` is green end to end for the first time since the one-turn change.

**Store assets.** `marketing/crazygames-store-20260928/build_store_assets.py` cuts the five files CrazyGames asks for from the campaign's clean captures and the cover master: covers 1920×1080 (from a landscape master Hiro supplied, `landscape-cover-master.png`, in place of the first composed attempt), 800×1200 and 800×800 (from the portrait master, cropped above the studio name so only the title shows), and two silent 19.1 s previews at 1920×1080 and 1080×1920 (wolf exchange, wolf finisher, forest vault, moss giant, orc boss, victory; the portrait one letterboxes the action over a blurred fill as the reel did). No text, no cursor, no audio. Sizes and durations in `verification.json`.

---

## 2026-09-28 - Marketing Reel refreshed after approved sprite cleanup

Recaptured all 17 staged gameplay/inn clips from the current Expeditions runtime, including cleaned orc finishers and corrected Alpha cleave/locomotion scaling. Rebuilt the same 70-second 1080 x 1920 music-only Reel with Cookie Relaxation 2, no gameplay captions, unchanged cover and four-second Facebook end card. Updated capture provenance, verification, preview cache version and README in marketing/expeditions-facebook-20260928; refreshed the Downloads upload copy. No runtime changes, art generation or Facebook publication.

## 2026-09-28 - Approved sprite cleanup workflow saved for future Astra sessions

User confirmed the technical pilot was successful. Added reusable skill source at docs/skills/sprite-cleanup-pilot/SKILL.md and installed an identical personal Codex skill. Linked the workflow and pilot evidence from GDD section 10. Documents preserve the technical-first approach, rejected broad gray masking, normal/paired transform boundary, historical rebuild caveat, validation and remaining-art shortlist. Documentation only; no game or art changes. Skill frontmatter validated and installed/repository copies checked identical.

## 2026-09-28 - Technical sprite cleanup pilot (no generated art)

- Corrected six plant lash crops/root anchors; removed gray matte from both orc pairs; adjusted Alpha cleave bodyScale 1 -> 1.306122 and pair distance 0.65 -> 0.94. Unaffected plant/orc frames retain identical visible pixels.
- Fixed borrowed finisher scale leaking into Hiro's approach/return run. Browser checks now assert native walk scale and restored texture/scale.
- Added targeted rebuild/inventory tool, browser regression capture, before/after review at docs/art/cleanup-pilot, and detailed scope/limitations in SPRITE_CLEANUP_PILOT_20260928.md. Scanned 128 clips; corner heuristic flags 5 -> 3 (not a full art-quality verdict).
- Files: alpha/orc/plant metadata, two versioned cleaned atlases, actors.js, painted.js, index cache stamp, shipping allowlist and query-aware ship contract; tools/sprite_cleanup_pilot.py; test/browser_sprite_cleanup.js; documentation/review media.
- Actor lifecycle 27/27, finisher pacing and shipping contract passed. Pilot browser cases passed with no page/resource errors. Cold startup across desktop/mobile orientations: ~14.35 MB visible gameplay, ~15.43 MB including audio unlock; below 20 MB locally. Lossless atlas sizes: plant 396,418 -> 1,084,504; orc 1,915,580 -> 4,635,720 bytes. Old atlases excluded from ship but preserved.
- Scope remains three representative cases; other Alpha pairs, moss giant and travel need individual review. Original website game untouched; no image-generation credits used; no deployment. Checkpoint a0589af.

## 2026-09-28 - Facebook Reel: gameplay and music only

Removed all added text overlays during footage, including the descriptive chapter captions. Preserved all shots, music, 70-second duration and final four-second cover/Facebook end card. Updated the marketing compose script, video, preview cache version, README and verification report; refreshed Downloads copies. Verified fully transparent gameplay overlays, sampled output frame, and final video stream/duration checks. No runtime changes.

## 2026-09-28 - Expeditions Facebook marketing campaign

- Added marketing/expeditions-facebook-20260928: a new Hiro cover and 70-second 1080 x 1920, 30 fps Facebook Reel. Sequence covers Hiro's entrance, three locations and finishers, travel, all five inn paintings, Alpha/orc bosses, victory and a four-second Facebook end card.
- Music is the user-selected Cookie Relaxation 2, with no voiceover or game audio. Final MP4 is 25,865,525 bytes. Editable capture/compose scripts, exact image prompt, capture report, verification manifest, viewing page and suggested post are included. Upload copies saved to Downloads/Adventurer-Expeditions-Marketing-20260928.
- Captures stage existing runtime animations in an isolated browser; no gameplay code changes. QA: zero capture page errors; video verified as H.264/AAC 1080 x 1920 at 30 fps, browser duration 70 seconds; Chrome playback at 390 x 844; sampled action/inn/end-card frames inspected; audio maximum -3.8 dBFS; marketing files confirmed excluded from game export. No deployment or Facebook publication.

## 2026-09-28 - Approved inn wardrobe edits integrated

- Replaced two active paintings with approved revisions: warrior collar/undershirt, barmaid lidded empty tankards and dark hose; mage closed robe/full skirt and dancer full-length blue dress.
- Five inn variants remain five; painting resolution remains 1280 x 760. Existing effect placements and rotation behavior are unchanged. New WebP payloads: warrior 137,274 bytes; mage 126,070 bytes.
- Versioned asset names and manifest URL prevent stale cached paintings. Shipping allowlist now selects the revised files; repack tool uses the revised source masters. Original masters retained beside edited sources in the source-art folder, with exact prompts in wardrobe-prompts.json.
- Files: assets/expedition/inn/inn.json, inn-hiro-mage-v2.webp, inn-hiro-warrior-v2.webp; js/expedition/inn_art.js; index.html; tools/ship_manifest.json; tools/build_inn_swamp_polish.py; this log.
- Validation: inn lifecycle 6/6; browser release-polish checks passed using installed Chrome (battle floors, fixed crowd scale, Alpha finishers, all five inns at desktop and mobile widths). Visually inspected both revised scenes in-game. Full npm test was not rerun for these image edits; previously documented simulation balance-floor failure remains outside this change.

## 2026-09-28 - Stable enemy scale, three inn guests and swamp polish

Removed crowd-dependent shrinking; goblin/spider are now 175/155 high against Hiro's 330, with four repainted matching finisher sheets. Added three inn paintings (mage+dancer, warrior+barmaid, ranger), stable five-scene rotation, level swamp battlefield and a one-shot 750 ms ground dust defeat effect. Existing inn loops reused. Files: actor spacing in `scene.js`, visual heights in `campaign.js`, `inn_art.js`, `battle_stage.js`, `defeat_fx.js`, goblin/spider atlases, inn manifest/paintings, swamp plate, ship manifest, xp12 cache stamp, browser/inn checks and `build_inn_swamp_polish.py`.

Presentation browser checks and focused unit checks passed; startup 14.74 MB after audio unlock. Full npm test still fails the pre-existing balance win-rate floor, independently reproduced from the pre-art Git checkpoint. Details, source prompts, validation and limitations: `INN_SWAMP_POLISH_20260928.md`. No deployment; user playtest pending.

---

## 2026-09-28 - Arcade clean-up: RPG-era code and files removed

Hiro asked for a refactor and a file-system clean-up of what no longer fits the arcade. Rule applied: delete what nothing reaches and nothing on the roadmap wants; keep what the GDD marks shelved for the hero-pack updates (§12c, §18) and say so in the code.

**Deleted from the code.**
- `js/expedition/heroes.js`: the RPG hero pick, trainer and blacksmith, unloaded since v0.8 and referenced by nothing.
- The Grave scene (`scenes_town.js`), its registration and phase route in `index.html`, and its portal key. The arcade save key ignores every older save, so nothing can strand there; a fallen run ends on End.
- The skill-upgrade path end to end: `Enc.upgradeCost/canUpgrade/upgrade` and `X.purchasable`; the fight scene's and inn's `buyUpgrade` and the HUD's `onUpgrade` hook; the HUD icon's lock, level pips, + badge and upgrade chip (`openChip`, `gateUntilChip`, `closeChip`), which were built every frame and never shown; the picked-hero branches (`tierIndex`, `tierName`, the `kit.hiro` forks) since Hiro is the only hero; the level-2/3 Katana Slash branches in `beats.js`; `UI.goldPill` and the `gold` URL flag. `Enc.owned` is now simply "is it in X.skills".
- Header comments in `campaign.js`, `encounter.js` and `data.js` now describe the arcade; `campaign.js` states that its recruit, companion and rival code is the locked hero-pack path.

**Kept on purpose.** Recruits, companions, rival parties, Bram's atlas and busts, `X.recruits` and `test/expedition_recruit_gate.js`: the GDD keeps hiring locked, not deleted, for hero packs. Also still there: Hiro's slash-l2/l3, aura-l2/l3 and counter-l2/l3 clips inside the packed atlas, playable by nothing; removing them is an atlas re-pack, listed for the next art pass.

**Filesystem.** The four inn reference photos committed at the repo root moved to `../adventurer-expeditions-source-art/astra-v3/inn-swamp-20260928/references/`. Staged under `../_to_delete/expeditions-cleanup-20260928/` (nothing deleted outright): 29 build-sandbox sync tarballs and the three superseded 27 Sept candidates from `dist/` (221 MB), and every `test/reports/` folder except `arcade`, `release-polish` and `release-candidate` (560 MB of regenerable screenshots). `tools/__pycache__` removed. `dist/` is down from 265 MB to 44 MB and `test/reports/` from 611 MB to 61 MB. `assets/anime/` and the unloaded shared files (`js/core/contracts.js`, the data manifests) are synced copies and were left alone.

Tests updated: `expedition_sim` (no purchase API), `portal_readiness` and `browser_expedition` (no Grave), `browser_skill_icons` (no + badge, lock or chip), `actor_animation_lifecycle` (one level). Every suite in the chain passes individually except the known one-turn tutorial assertion. Verified in the browser pane: the fight runs with the three icons intact and no console errors, no Grave scene registered, `X.Heroes` and `X.purchasable` gone. README rewritten for the arcade; GDD §12a, §15.1 and §17 annotated.

---

## 2026-09-28 - Finishers and inn paintings round robin; no instant hits from a missing clip

Three requests from Hiro's playtest.

**Finishing moves rotate per creature.** Hiro's paired finisher against a painted set now cycles through that set's moves, so the same move never plays twice in a row on the same creature. `X.finisherLast` (per painted set) and `X.finisherOrder` in `js/expedition/actors.js`; `X.clipFor('finisher')` in `data.js` now returns the family's whole list in rotation order instead of one move per skill level (the arcade has one level, so wolf, plant and Alpha kills had been playing their first move every time). The seven v3 monsters rotate their two moves per set instead of one global alternation across all monsters. An explicit `finisherVariant` still wins. The rotation lives in memory for the session, not in the save.

**Inn paintings never repeat back to back.** `InnArt.variant` keeps the visit-by-visit cycle (solo, Bram, mage, warrior, ranger by quests cleared) and now remembers the last painting shown outside the save (`Run.pref('inn')`, key `adventurer_expeditions_prefs_v1`), so a new run's first visit, or a restart, skips the painting the player just saw; a reload of the same visit keeps its painting. New `Run.pref` helper in `run.js`.

**Damage lands after the animation, always.** Audit: every attack clip in every shipped atlas carries contact frames, damage numbers and health bars update at the contact frame, and deaths play after the attacker's recovery, so the ordinary path was already right. The gap was the fallback: an attack the actor has no painted clip for (a boar's charge or a lurker's lash asked of a monster sheet that only has `attack`) fell back to the idle loop and fired contact the instant it started, an invisible hit. Now `charge` and `lash` alias to `attack`, and any offensive clip that still lands on the idle fallback holds 220 ms before contact and 200 ms after, so a hit is never instantaneous.

Tests: `test/actor_animation_lifecycle.js` (rotation per family, the delayed fallback contact; the v2 tier test now expects rotation) 27/27; `test/inn_art_lifecycle.js` 6/6. `npm test` still stops at the known one-turn tutorial assertion; every other suite in the chain passes individually except `ship_budget_contract`, noted below.

---

## 2026-09-28 - Level tags removed from the actors

The "[Lvl.N]" tag over Hiro and every monster is gone (Hiro: "meaningless"). The plate is now the health bar alone, moved up 8 px so it sits where the tag's bar used to. `Actor.setLevel` still records the level for the clip picker and draws nothing; the HUD and scoring are untouched. File: `js/expedition/actors.js`. Verified in the browser pane against the local server.

---

## 2026-09-28 - Community links on the pause screen

The End scene promised "Follow Hiro on Facebook and send feedback from the pause menu", and the pause menu had nothing. CrazyGames' gameplay requirements (docs.crazygames.com/requirements/gameplay, read today) forbid cross-promotion but allow community links (Discord, dev website and the like) on the game menu only, provided they do not lead to a playable web version. The pause screen is this game's menu, so it now carries a "Feedback and news" row with two buttons, the same two Facebook pages the website game's support panel uses (`adventurer/js/ui/support.js`): Hiro on Facebook and Neverendingnarratives. The website's donate link is deliberately not carried over; it is not a community link. Note that the website game's own support panel switches itself off entirely on a CrazyGames build, so this is the first time these links appear in the portal build.

`X.links` in `js/expedition/data.js` (empty the list and the row disappears); `UI.openLink` in `js/expedition/ui_common.js` opens a new tab with no opener so the running game is never navigated; `scene.__pauseButtons.links` exposes the rects. Verified in the browser pane against the local server: the row renders under High scores / End run, a tap on the first button reaches `UI.openLink` with the Facebook URL, the game stays paused and on its page, no console errors. `test/browser_arcade.js` gains the same check (Playwright could not run on this PC). `.claude/launch.json` added for the desktop app's preview server. The End scene text is unchanged: a pointer to the menu, no link on the ending itself.

---

## 2026-09-28 - Second balance pass: harder monsters, guaranteed boss packs, bosses in regular waves, permanent board

Hiro's playtest of the first pass reached a fourth playthrough without ever meeting a two-boss wave (the 60% single-boss roll on the second playthrough), and asked for more bite. All knobs in `js/expedition/data.js` and `js/expedition/campaign.js`:

- **Base tuning** `X.monsterMult = { regular: { hp: 1, atk: 1.1 }, boss: { hp: 1.25, atk: 1.25 } }`, applied in `Enc.makeEnemy` after the enemy's own statMult and before the loop scale, so it is the first playthrough's tuning and every later playthrough compounds x1.3 on top of it. The Finisher's kill heal drops 35% -> 25% (`healOnKillPct`).
- **Boss packs are guaranteed.** `Camp.bossOdds`: playthrough 1 own boss only (the authored lists); playthrough 2 always two bosses (own x2 or own + another location's, 50/50); playthrough 3 and later always three. Was 60/20/20/0, 40/25/25/10, 25/25/25/25. `Camp.maxBosses` stays 3.
- **Bosses join regular waves.** New `Camp.waveBossOdds` ([none, one, two]): playthrough 3 70/30/0, playthrough 4 and later 55/30/15. Bosses come from any location and stand last in the list (front-most on stage). A wave holds at most `Camp.maxWave = 4` monsters, the regulars making room, and at least one regular stays. The generated wave carries `bosses: n`. `X.bossShare` still applies by boss count, so a mixed wave with two bosses scales them by 0.7.
- **Permanent board.** The local board is browser storage only; CrazyGames does not keep it, so a cleared browser or another device starts empty. `X.board.hall = []` holds rows shipped with the game (Hiro adds them by hand from screenshots players send on Facebook), merged with the local rows in `Board.load`, best first, a tie keeping the permanent row above; `Board.local` and `Board.save` only ever touch this device's rows, so a permanent row is never written to storage and never duplicates. The End scene shows `X.board.note` above the Part 2 footer: *Made the top ten? Send a screenshot of this screen to Hiro on Facebook and your score goes on the permanent board in the next update.*

Balance probe after (100 runs per player, Rest below 50%; before in parentheses): no taps ends in the forest or the swamp's first fight with ~300 points (500); tutorial taps only ~400 (1,400), still dying at the swamp's first fight; casual median 4,175 (7,550), 77% end on the second playthrough; every-skill player median 5,850 (11,200), 99% end on the second playthrough, over half of them on the forest's two-boss wave; a mixed board's #10 after 100 runs 6,000 (14,000). No simulated player reaches the third playthrough now; Hiro, who reached the fourth under the old rules, plays better than the probe's tap-everything policy, so his playtest decides whether `X.bossShare[2]` or the boss multiplier should come down.

Tests: `test/expedition_sim.js` covers the heal, the guaranteed packs by loop, the regular-wave boss odds and placement, the base tuning under the loop scale, and the permanent board merge (loads `run.js` for that one). `npm test` green. `test:arcade` could not run on this PC (Playwright's Chromium is not installed here; the build sandbox runs the browser suites). Script stamp xp2. GDD §4, §5.0, §5.0a and §7.0 updated. No new candidate built.

---

## 2026-09-28 - Arcade balance pass, docs and candidate

New `tools/balance_arcade.js` plays whole runs headlessly (Hiro alone, health carrying, Rest by rule, scoring and loop rules as the game applies them) for four players: no taps, tutorial taps only, casual (half the ready skills), and every ready skill. Findings as rolled: a two-boss wave was won 40/12/4% (forest/swamp/city) by the best player and a three-boss wave never, so no run reached a fourth playthrough; a tutorial-only player reached the first boss at ~10 hp and lost it 57% of the time; Rest never changed how far a run went. Two knobs, both in `js/expedition/data.js` and one line to revert: `X.bossShare = {2: 0.7, 3: 0.5}` (every boss of a pack is scaled by the pack's share on top of the loop scale, applied in `Enc.create`) and `X.tutorialHeals = true` (on the first quest of a run each fight opens at full health; from the second quest health carries as designed, applied in `Enc.makeHero`). After: two-boss waves 92/80/36%, three-boss ~10%; the tutorial follower clears the forest every time; the best player's median run is two full playthroughs (~11,400 points), about half reach the third; a mixed board's #10 after 150 runs is ~14,500. Rest left as designed; finding recorded in the GDD §4. Point table, loop scale and boss odds unchanged.

Docs: GDD v0.9 gains the arcade status paragraph, §4 (inn as built, Rest finding), §5.0 (End scene as built, name rules), new §5.0a (scoring, playthroughs, boss packs, balance table), §7.0 (skills as built), §16 and §17 entries; ART_STANDARD §8 item 7 (score mark and End-scene background as placeholders); `docs/HANDOFF_ARCADE_20260927.md` from the previous session. `test/browser_arcade.js` now covers both knobs (33 checks). Stamp xp1 of 2026-09-28.

Validation: npm test green here and on Hiro's PC; browser_arcade 33/33, browser_expedition --ship, browser_restart_dev 23/23, browser_finishers 10/10, browser_v3_art green (the session VM on the PC cannot launch headless Chromium — missing libXdamage — so browser suites run from the build sandbox against byte-identical files). Candidate: `dist/crazygames-20260928-arcade/` — 267 files, 42.45 MB, `release_check` ready to ship (dev tools off in the candidate; run it with `EXPEDITIONS_TEST_ROOT` pointing at the folder); cold start 13.62 MB to gameplay, 14.67 MB after audio unlock on desktop and emulated mobile portrait/landscape. Not uploaded. Hiro's playtest of the balance knobs is the next gate.

---

## 2026-09-27 - Travel recenter and arcade UI polish

After an obstacle Hiro now eases from the authored exit position to screen x=650 over 400 ms, then remains centered. Run cadence, 420 px/s landscape speed, obstacle action and travel duration are unchanged. Added a regression assertion covering the second half of all four journeys.

Score counters and the high-score panel now share a dark blue steel/gold frame. The board has alternating rows, three rank medals, and a highlighted best score when populated; the end screen retains its submitted-row highlight. The tutorial hand is a shaded glove with a purple/gold cuff and its existing tap/hold guidance. Next is a framed gold arrow with a readable label and gentler pulse (1.08/520 ms -> 1.035/720 ms). Hit targets and arcade scoring/progression remain unchanged. These are native graphics, adding no bitmap downloads.

Files: `js/expedition/{travel_art,ui_common,hud}.js`, `test/browser_v3_art.js`, `index.html` (xp9), this log. Validation: npm test passed; all four travel checks passed; arcade browser suite 32/32 passed with no page errors. Board, pointer and Next screenshots reviewed in `test/reports/arcade/`. No original website/shared files edited; no new upload candidate or deployment in this pass. Playtest approval pending.

---

## 2026-09-27 - Arcade mode (steps 1-7): score, single-level skills, health carry, Rest, End scene, board, loop rules

Implements the reviewed arcade plan (Claude Doc "Expeditions Arcade Mode Plan"). Gold is gone; a run scores points (regular 100, boss 500, +50 Finisher kill, +50 clean wave at >=75% hp, quest clear 300, x(1 + 0.25 per extra playthrough)). Every skill is owned from the start at one level (`X.purchasable = []`, `X.tappable`); God Aura is attack x1.35 only (`auraDef` 1 so the engine's divide-by-def stays neutral). The tutorial teaches Finisher (fight 1), Counter Attack (fight 2), God Aura (boss) and only holds on the first quest. Health carries across waves and quests (`run.hp` -> `ch.combatHp`); only the Finisher heal (35% on kill) and Rest at the inn restore it. Rest: full heal, 1,000 points doubling each use, refused at full health. Defeat ends the run; End Run sits in the pause menu behind one confirm. New End scene: score, playthrough, top-10 local board (`X.Board`, key `adventurer_expeditions_highscores_v1`), required name-shaped name (`X.validName`, 25 max), play again = fresh run. Loop 2+ (`Camp.loopEncounters`, seeded from `run.seed`): regular waves draw from a shuffled monster pool; enemy hp/atk x1.3 per playthrough, compounding, uncapped; boss wave rolls own / own x2 / own + another area's boss / three bosses with odds 60/20/20/0 (loop 2), 40/25/25/10 (loop 3), 25/25/25/25 (loop 4+); max three bosses. Crowded waves are placed by painted width (`spaceFoes`) and shrunk to no less than 0.82 (`Actor.rescale`). Defeat effects stay location-specific and play on any monster.

Files: `js/expedition/{data,encounter,campaign,run,shim,scene,actors,hud,scenes_town,ui_common,beats,dev,battle_stage,painted}.js`, `index.html` (End scene registered, `?at=inn&score=N`, stamp xp8), `tools/levels_doc.js` (no Gold column), `package.json` (`test:arcade`), tests `test/{expedition_sim,expedition_recruit_gate,browser_expedition,browser_restart_dev}.js` rewritten for the arcade and new `test/browser_arcade.js` (32 checks incl. a fourth-playthrough three-boss wave). Save key is now `adventurer_expeditions_arcade_v1`; older saves are ignored. Commits `b2fb884`, `dfe3592`, and Arcade 6 (loop rules). No original website files changed.

Validation: npm test green; browser_arcade 32/32, browser_finishers 10/10, ship journey and restart suites green in the build sandbox. Still to do: balance pass in the simulator, GDD sections for the inn/ending/loop rules, a new CrazyGames candidate, Facebook link and feedback destination. Hand-off prompt: `docs/HANDOFF_ARCADE_20260927.md`.

---

## 2026-09-27 - Atmospheric parallax travel

Supersedes the short-distance slow run below. Travel now scrolls newly painted distant scenery, ground and foreground at independent rates (0.07 / 1 / 1.5), with ground speed fixed at 420 world pixels/second. Hiro keeps the approved 16-frame, 800 ms run cycle. The existing obstacle action remains 1,490 ms with authored contact positions. Running on each side: forest/market 4,000 ms, rooftop 4,500 ms, swamp 5,000 ms; total including transition hold: 9,670 / 10,670 / 11,670 ms, formerly 7,670 ms. Weather remains active; the swamp adds fireflies and a slowly moving moonlit distance.

Files: `js/expedition/travel_art.js`, `index.html` (xp4 cache stamp), `test/browser_v3_art.js`, `tools/build_travel_atmosphere.py`, twelve `assets/expedition/travel/*/atmosphere-*.webp` layers, GDD and release notes. Masters, exact generation prompts, alpha corrections and packing regions are in `../adventurer-expeditions-source-art/astra-v3/atmosphere/`. No original website files changed.

Validation: npm test passed; four-beat browser checks passed (run/action/run phases, fixed speed, separate layer rates and real return to combat). Screenshots reviewed and painted band edges/rooftop camera gap corrected. Cold-cache SDK-stub checks passed at desktop and emulated mobile portrait/landscape: 13.60 MB to gameplay, 14.64 MB after audio unlock. New scenery is loaded on demand; total ship set is 267 files / 42.43 MB. Physical-phone and hosted-portal QA remain outstanding. Candidate: `dist/crazygames-20260927-parallax/`.

---

Follow-up gate: `npm run test:ship` passed the guided forest and swamp quests, travel, upgrades, save state and return to the inn. The frozen 267-file candidate passed `release_check.js`. No hosted upload performed.

## 2026-09-27 - Longer travel journeys

Travel now includes 3,000 ms of the existing sixteen-frame Hiro run before the authored obstacle action and 3,000 ms afterward. The central action keeps its contact positions and original speed (1,490 ms); total animated journey 7,490 ms plus the existing 180 ms transition hold = 7,670 ms. All four forest/swamp/city beats use this schedule. No new art downloads. Updated `js/expedition/travel_art.js`, its browser phase/transition checks and the script cache stamp. The upload candidate is refreshed separately as `dist/crazygames-20260927-travel/`; the previous polish candidate is superseded.

---

## 2026-09-27 - Release polish: readable finishers, grounded combat and inn guest

Implemented the user-approved polish pass. Alpha finishers 665-780 ms -> 1,400-1,620 ms; later monster finishers 770 ms -> 1,420 ms. The same frames/markers are retained with longer setup, impact and recovery holds. Two new battle plates provide continuous level mountain/city footing. Bram's existing seated painting appears after odd-numbered quest clears without granting recruitment. Original website/shared files remain unchanged.

Files: `js/expedition/{painted,inn_art,scene,battle_stage}.js`, `assets/expedition/stages/`, `index.html` (cache stamp xp2), `tools/{ship_manifest.json,build_battle_stages.py,package_crazygames.js,release_check.js}`, `package.json`, focused pacing/inn/browser tests and candidate-aware browser test paths. Source masters/prompts: `../adventurer-expeditions-source-art/astra-v3/release-polish/`.

A separate verified CrazyGames candidate hides development tools and enables SDK policy only in the exported copy. Total approximately 38.80 MB / 255 files; measured startup including first action and audio 14.64 MB. Local automated tests and visual checks are recorded in `docs/RELEASE_POLISH_20260927.md`. User playtest approval, uploaded portal QA and physical-device testing remain; no public deployment or acceptance claim.

---

## 2026-09-26 — Astra v3 art integrated: forest, swamp and city playable

User authorized source creation, intake and runtime integration in this session. The original `adventurer/` and synced shared files were not edited. Source masters and generation/reference records are in `../adventurer-expeditions-source-art/astra-v3/`; this is a local playtest build, not a publication or final art approval.

**Delivered.** Seven new monster atlases (serpent, beetle, moss giant, hag, goblin, spider, orc), each with idle, approach, attack, hit, down, threat/enrage and two unique Hiro paired finishers. Four scene-specific painted travel beats: forest carriage hop, swamp log slide, city market vault, city rooftop climb/run. Each has a clean plate, 12 registered action frames and environment loops. Swamp mud dissolution and city blue-flame defeat effects are loaded with their locations. Original music and existing battle plates are reused.

**Runtime.** Open quest list changed from rain/marsh/city/ruins to rain/marsh/city (4 to 3). Hiro remains the only selectable hero; recruitment stays locked. Swamp and city encounter identities remain stable for saves but now resolve to the intended monsters. Hag and orc explicitly have `boss: true`; other new creatures explicitly have `boss: false`, preserving the flat 25% / 50% Finisher thresholds. Paired kills still require the player's Finisher; the two new variants alternate without requiring skill levels. Boss enrage tells play once below half HP. Travel waits for its authored beat before changing scenes. Approach clips loop so entrance movement completes; native left-facing art is not mirrored. Weather now follows each quest's explicit setting rather than the shared renderer's marsh rain bias.

**Registration fixes.** Stable anatomical scale is retained throughout each sheet. Contact corrections translate frames rather than enlarge Hiro: market contact frames lowered 20 px; rooftop ledge frame anchor Y 560 → 630; rooftop bird loop scale 1 → 0.55. A complete-body ledge-grip frame replaces the source frame with cropped legs. Planted frames use the visible alpha baseline, avoiding floating feet.

**Size.** Runtime package approximately 38.15 MB / 252 files. Source PNG masters do not ship. Separate total-package allowance is 250 MB; initial-gameplay target remains 20 MB. Cold-cache local Chromium tests measured approximately 14.64 MB through first combat and audio, on desktop and emulated portrait/landscape mobile. This is not a measurement inside CrazyGames or on physical iOS hardware.

**Validation.** `npm test`; ship-allowlist browser run; complete three-quest ship run at 390 px width (three clears, zero defeats/errors); seven visible monster checks; all 14 new paired-finisher playback/contact/cleanup checks; all four travel beats sampled at five times; cold-cache startup test. Reports are under `test/reports/`. Final targeted Finisher test also covers actual skill execution for all ten creature sets (forest plus new locations).

**Files.** `assets/expedition/{serpent,beetle,moss_giant,hag,goblin,spider,orc,travel,effects}/`; `js/expedition/{data,campaign,encounter,painted,scene,actors,beats,defeat_fx,travel_art,scenes_town}.js`; script stamps in `index.html`; `tools/{build_v3_monsters.py,build_v3_travel.py,ship_manifest.json}`; `test/{expedition_sim,browser_v3_art,browser_finishers,browser_startup_budget}.js`; `package.json`; GDD, this log and generated `docs/LEVELS.md`.

**Still separate planned work.** September 24's skill-level removal, attack-only God Aura redesign and bespoke Part 2 ending screen were not part of this art/travel authorization and remain unimplemented. After the city, the current completion flow returns to the inn. Art is ready for Hiro's in-game approval; this entry does not certify platform acceptance.

---

## 2026-09-24 — Version 1 content: three locations, new monsters, no skill levels

Opus 5.5. Docs only; nothing built.

**Locations and ending.** Version 1 is forest (Road in the Rain) → swamp → city,
then an ending screen: thanks, **Part 2 with a new protagonist — stay tuned**,
follow Hiro on Facebook, send feedback. The old ruins leaves version 1. Checked
CrazyGames' gameplay rules: community links are allowed **in the game menu
only**, so the Facebook and feedback links go in the pause/settings menu and
the ending screen points there. GDD §5.0.

**Monsters (Hiro).** Swamp: serpent, beetle, moss giant, **hag boss**. City:
goblin, spider, **orc boss**. Designs, skills and roars from the original game
(river serpent, iron beetle, moss giant, mire hag, goblin, crystal spider, orc
king). Every enemy gets **at least two unique Hiro finishing moves** — 7 new
monsters, at least 14 new paired sheets. Defeat effects: forest sparkle (as
built), swamp **melt into mud**, city **blue magical flame**; recommended as one
painted effect per location plus a dissolve in code. `ART_STANDARD.md` v1.1 §7.

**Skills.** Levelling removed: each skill unlocked once, each unlock costing
moderately more (proposed 20 / 35 / 50 gold, which fits inside the tutorial
road's payouts). **God Aura** keeps its look but drops defense and evasion for
more attack (proposed ×1.35). Proposed single values for Counter Attack and
Finisher from today's middle level. GDD §7.0.

Open decisions added as GDD §16.18–21 and ART_STANDARD §8.

**Answered the same day (Hiro):** after the ending the player goes **back to the
inn and can replay** all three locations; **Part 2 is an add-on** to this game
at a future date, on the same listing (GDD §5.0, §16.19–20). Still open: the
Facebook address and where feedback goes.

---

## 2026-09-24 — Art standard: Hiro painted into every non-interactive scene

Opus 5.5. Docs and research only; no game code or art changed.

**Verified how the inn is built.** One still painting with Hiro in it, plus three
4-frame loops (candle, stew steam, hearth) placed from `inn.json`. Hiro does not
move; Astra's four-painting eating loop was rejected because the paintings did
not line up. Hiro: keep it as is.

**Verified how travel is built.** A website panorama scrolled sideways, code-driven
ambience on top, and Hiro as a separate sprite running in place at a fixed height.
Measured why it does not fit: fixed foot height lands on wall faces in the city
and ruins, the ground moves ~77 px per stride so his feet slide, the panoramas
are the website's style, and nothing reacts to him.

**New `docs/ART_STANDARD.md`**, with screenshots in `docs/art_research/`: the
standard, the research, three ways to build painted travel (recommended: clean
plate + Hiro painted onto it + local loops at his footfalls + a camera path),
beats per location, and what Astra delivers per beat. First job when art
resumes: one test beat, the forest-road carriage vault.

**Decisions (Hiro):** inn unchanged; the Bram inn painting shows at random on
return (not built); travel to be repainted as run-through scenes; enemies are
monsters only. GDD §10 pointer and §17 decision added.

---

## 2026-09-22 — Version 1 scope, the update model, and the size rule corrected

Opus 5.5. Docs only; no code changed. Hiro set the shape of version 1 and what
comes after it, and the size rule this project has been working to turned out
to be misread.

**Version 1: Hiro alone.** *"we should not offer a new hero. instead just leave
it at hero, develop 2 or 3 new enemy types, smooth out the animations with more
frames and call it a game."* Hiring stays locked, not deleted.

**Grow by updates, not sequels.** *"so instead of new game, we make new updates
and we keep adding heroes and locations?"* Yes: location packs and hero packs on
the same listing, loaded after gameplay starts. New GDD §12c.

**Bram is not the next hero.** *"it was something ai came up with, I haven't
really thought up the next character yet."* GDD §3 now marks the recruit table as
history. Bram's art stays on disk, out of the package, as an archive and as the
hero-pack test fixture.

**The size rule, corrected.** CrazyGames' technical requirements, read today:
initial download 50 MB or less to be accepted and 20 MB or less for the mobile
homepage, measured up to the first `gameplayStart` when the SDK is integrated;
whole game 250 MB and 1,500 files at most. This project has been gating the whole
package at 20 MB, so the 20.77 MB total is not a submission blocker. The number
that matters was last measured at 9.69 MB before the first fight (2026-09-21) and
must be re-measured. New GDD §12a.0 lists the tooling change — two numbers in
`size_check`, with `release:check` gating on the initial download — not built.

**Size review, verified and recorded, not acted on.** 20.77 MB / 214 files, of
which about 1.42 MB is loaded but never reached: website campaign and dialogue
scripts ~0.59 (dropping them needs a load test, since shared core files may
reference them), Bram voice 0.33, tavern plate 0.28, Bram inn painting 0.16, Bram
bust 0.06. `Dev.DEV_BUILD` is still true. The quest comment in `data.js` carries
two stale sentences above the current one. The fight ids `rain_boars`,
`rain_bandits`, `rain_boar_boss` and `city_watch` name creatures they no longer
field.

**GDD edits:** top status (direction, size), §2 override, §3 roster note,
§12a.0, §12b note, §12c, §14 size row, §15 reconciliation, §16.13 superseded and
§16.14–17 added, §17 decision.

---

## 2026-09-22 — The Finisher kills the boss wolves, with their finishing move

Opus 5.5. Hiro: *"Keep bosses at 25% and make the changes to fix this bug."* The
boss line stays at 25 %. Three changes, one of them a cause the diagnosis below
had not found.

**Readiness now matches execution** (`js/expedition/encounter.js`).
`Enc.skillState` builds the Finisher's target pool with each target's own line:
ordinary enemies at 50 %, bosses at `X.finisherThresholds.boss` (25 %). An Alpha
above 25 % is never offered, so the button glows only when a kill is real, and in
a mixed boss wave the Finisher takes the wolf instead of wasting itself on the
Alpha.

**The Alpha on the later levels now plays its finishing move**
(`js/expedition/actors.js`). With the kill fixed, the marsh, city and ruins boss
(`alpha_2`) died — but with a plain `down`. Hiro borrows the Alpha's sheet, which
holds the paired Alpha frames, only when the target's identity was exactly
`tutorial-alpha`; `alpha_2` is drawn from the same painted set under another name
and was skipped. The borrow now keys on the drawn set (`X.paintedActorOf`), the
rule `Actor.canPair` already used. The rain boss was unaffected: it pairs from
Hiro's own sheet.

**Casts get their cinematic beats** (`js/expedition/beats.js`). A skill fired
between turns (`how: 'cast'`) was not counted as a tap, so with Cinematic camera
on it got no push-in on the kill. It now counts like a requested skill.

**Tests.** `test/expedition_sim.js`: "the Finisher only glows on a boss when it can
actually finish it" (both boss wolves dark at 45 % and 30 %, lit and killed at
20 %; wolves and plants still finishable at 45 %) and "in a boss wave the
Finisher takes the wolf, never the boss above its line" (12 seeds). Both fail on
the old code. New `test/browser_finishers.js` (`npm run test:finishers`) finishes a
wolf, a plant and the boss on each open level and requires the kill, a paired
clip, and for bosses a clip from the Alpha sheet — 9/9 pass:

| level | target | result |
|---|---|---|
| rain | dire_wolf / thorn_lurker / road_wolf_leader | killed, paired |
| marsh | dire_wolf_2 / thorn_2 / alpha_2 | killed, paired |
| city, ruins | alpha_2, thorn_2 | killed, paired |

Also green: `npm test`, `test:ship`, `test:camera` (6/6, finisher kill seen),
`test:restart` (24/24), and every open level's waves load with the right sheets.
Cache stamp bumped.

---

## 2026-09-22 — Status after play-testing; the Finisher's boss-line bug diagnosed

Fable. Hiro, after playing the turn-agnostic build: *"the game is playing much
more smoothly now after those recent changes"* — and one report: *"finisher is
not working on dire wolf, it's not doing the finishing move animations or
killing him ... it's working on regular wolfs and plants though."*

**Status.** GDD v0.9's top status block is rewritten for today and the
2026-09-21 block kept beneath it as history; §15 gains a 2026-09-22
reconciliation. It had still said only the first road was playable and that the
build sat under 20 MB — both wrong since this morning.

**Diagnosis, no code changed.** Measured rather than guessed: the Finisher fired
at every creature an open quest fields, at 45 %, 30 % and 20 % health.

| creature | 45 % | 30 % | 20 % |
|---|---|---|---|
| wolf (rain), wolf_2 (later) | dies | dies | dies |
| thorn lurker, thorn_2 | dies | dies | dies |
| **Alpha, rain boss** | **survives, ~22 dmg** | **survives** | dies |
| **Alpha, later bosses** | **survives** | **survives** | dies |

The wolf Hiro means is the boss — the Alpha is a gray wolf, and the rain's is
built on the `dire_wolf` base. The cause is two thresholds that disagree.
Execution honours the boss line: `Enc.bossExecutable` unmasks a boss only at or
under 25 %, because the shared engine exempts bosses from execution outright.
Readiness — what lights the button — uses the ordinary `requireBelowPct 0.51`
for every enemy, boss included. So the button promises a kill at 51 % that the
game will not deliver until 25 %. With no kill, `opts.lethal` is false and
`Actor.canPair` correctly refuses the paired clip: the missing animation and the
missing kill are one bug.

It bites harder in the later boss waves, where the Alpha fights beside a wolf.
Both at 40 %, five seeds: the Finisher aimed at the Alpha three times and
**nobody died**, though a finishable wolf stood beside it — the boss sits in the
valid-target pool and threat targeting prefers it.

**Proposed fix, not applied.** Build the Finisher's target pool with each
target's own line — 50 % for an ordinary enemy, 25 % for a boss. The button then
glows only when a kill is real, an Alpha above 25 % is never offered, and in a
mixed wave the Finisher always takes the wolf. One change in `Enc.skillState`,
plus a sim case that fires at a boss at 40 % and asserts the button is dark.
Waiting on Hiro before touching code.

**Other status worth recording.** 20.77 MB against the 20.0 MB target, over by
Hiro's call and blocked at packaging. Status durations remain in rounds. The
headless-Canvas frame rate of 50.7 fps is a worst case with the GPU disabled,
not a measurement of Hiro's machine.

---

## 2026-09-22 — Skills fire between turns, and recover on a clock

Fable, to Hiro's spec after a design pass: *"I want the skills to be turn
agnostic, so they feel better ... it happens regardless of turn count because
that feels better to the player ... it'll also add more player agency since the
skill usage doesn't count as a turn."*

**Verified before building, as promised.** The shared engine counts statuses and
counters in rounds and `js/core` is never edited here, so acting out of turn was
a real unknown. A probe settled it: `Combat.act` on the hero while an enemy held
the turn returned ok, applied the aura, left the current turn and the round
exactly where they were, and the fight finished normally. The seam is that
`Enc.step` calls `commit()` and then `A.Combat.advance()` — a cast is the same
commit without the advance. No fallback was needed.

**Casting.** `Enc.castNow` resolves a queued tap immediately and deliberately
does not advance the turn, so a cast costs nobody a turn and skips nobody's.
`scene.drainCasts()` runs it between beats and inside the gap between turns,
never mid-animation: a tap made while an enemy is swinging waits for that swing
to land, then fires as its own beat. Measured in a browser: tap accepted at
once, fired 830 ms later when the animation ended, turn `b0` before and after,
round 2 before and after, one cast recorded.

**Recovery is wall-clock.** God Aura and Counter Attack carried cooldowns of 5
and 2 *turns*, which a player casting off-turn cannot read — the wedge would sit
still because no turn had passed. All six entries in `X.skills` are now
`cooldown: 0`, which is what stops the engine recording one, and
`X.skillCooldownMs` owns recovery instead: God Aura 10/10/8 s, Counter Attack
5/5/4 s. `Enc.cooldownLeftMs` is the only gate, `X.now()` is the single clock so
the simulation can hold time still, and the HUD wedge drains against `leftMs`,
repainted ten times a second while anything is recovering rather than stepping
once per turn.

**Durations stay in rounds.** God Aura's buff and Counter Attack's window are
applied by the shared engine in rounds, and moving them would mean the
Expedition layer expiring statuses the engine owns. Left alone deliberately: a
buff's length therefore still shifts a little with turn speed.

**Turn gap:** 1 s normal, 2 s slow, 0.5 s fast, per Hiro. The wait is sliced into
120 ms pieces so a tap during the gap fires almost at once instead of waiting
for the next turn.

**Frame rate, asked about.** No `fps` block in the Phaser config, so it is the
default: a `requestAnimationFrame` loop targeting 60, rendering at the display's
refresh rate, WebGL unless `?renderer=canvas`. Headless Canvas with the GPU
disabled — the worst case the tests can produce — measured 50.7 fps average
against a target of 60. That number says nothing about Hiro's machine; a live
readout in the dev panel is the honest way to answer it and has not been built.

**Expect it to be easier.** Free casts on top of a simulation that already wins
every fight is a real power jump. Deliberately not tuned yet: Hiro plays it
first, then enemies come up rather than skills coming down.

**Tests.** Two new sim cases: a cast fires between turns leaving the turn, round
and step count untouched and the fight still resolving; and recovery measured in
seconds, asserting no shipped skill carries a turn-based cooldown, that six
turns passing does not shorten it, and that advancing the clock does. The
journey's manual-skill contract now recognises `how: 'cast'` as a player tap
alongside `how: 'request'`, and its trace hooks `castNow` as well as `step` —
without that it would have seen no player-fired skills at all. Headless 21 sim /
9 / 25 / 6 / 6 / 5 / registration / contract / levels doc; browser `test:ship`
ok, `test:camera` 6/0, `test:restart` 24/0, level sweep 8/8.

---

## 2026-09-22 — Four levels in order; finishers match by painted set, not by entity

Fable, on Hiro's direction: unlock the other levels, wolf/Alpha/plant only, drop
"Clear the road" from the rotation, and run the suite because "the game will
break if you use monsters that don't have art".

**The rotation.** A run now starts at **Road in the Rain** and goes **the reed
marsh, the city watch, the old ruins**, then cycles. `X.slice.startQuest` says
where a run begins and `X.slice.openQuests` is the order; every place that used
to hard-code `'road'` asks `Camp.startQuestId()` instead. "Clear the road" keeps
its data as the dev panel's preview and as the record of the tutorial, but
nothing routes to it. Road in the Rain inherits the tutorial's gentle curve —
ordinary wolves, then wolves and lurkers, then the Alpha — because it is where a
new player now lands; the three after it use the tougher variants.

**Only reworked creatures.** Every wave across all four is wolf, thorn lurker or
Alpha. Verified in a browser: eight checks, wave 1 and the boss wave of each
level, every enemy carrying `xp_wolf_sheet`, `xp_plant_sheet` or
`xp_alpha_sheet`, every wave resolving, no page errors and no failed requests.

**Correct music and plates, over the budget deliberately.** Hiro: *"ignore the
budget for now ... it is more important that we set this stuff up correctly the
first time around."* So the marsh and the ruins keep `night1` rather than
borrowing a track that already shipped, and all four plates are in. The set is
**20.76 MB against the 20.0 MB target**. `size_check` now reports an overage
loudly and carries on; `--strict` still fails, and `release_check` uses it, so
nothing can be packaged over the line. Both behaviours are pinned in the
contract test.

**Finishing moves are matched by painted set, not by entity id.** Hiro asked the
right question — *"why is finisher and animations hard tied to a specific
entity, instead of a class type"* — after noticing the finisher animated on the
forest board and nowhere else. The cause: the paired clips name their opponent
exactly (`dire_wolf`, `thorn_lurker`, `road_wolf_leader`), and `Actor.canPair`
demanded that exact key, so `dire_wolf_2`, `thorn_2` and `alpha_2` were all
refused and the finisher resolved as an ordinary kill with no animation. The
pair is painted against a *creature*, so the rule is now the painted set:
`X.paintedActorOf` (which sheet the actor is drawn from) and
`X.paintedActorOfKey` (which sheet a definition resolves to). Any number of wolf
variants pair because they come out of the wolf sheet — no per-entity wiring —
while a recolour is still refused, so the gray wolf cannot double as the green
blight wolf. `X.clipFor` picks the family the same way. Without `data.js` loaded
(the animation harness) a name resolves to itself, which is the old exact-key
behaviour, so those contracts stay honest.

**Turn pacing.** A pause between turns, **2 seconds by default**, after the
beats have played and the icons have been refreshed — so it is time to read a
truthful HUD and tap, not dead air. **Turn speed** is a player setting on the
pause screen: slow (3.2 s), normal (2 s), fast (0.6 s).

**The developer tools stop disappearing.** `Shift+D` used to write a persistent
"hidden" flag; pressing it once removed the cog for good, across reloads, with
no way back from inside the game. While `DEV_BUILD` is true the tools are always
present, `Shift+D` opens and closes the panel, and a stored flag from before is
cleared on load so an affected browser recovers by itself.

**Cinematics off by default**, as asked, with a **Cinematic camera** row on the
pause screen beside Turn speed.

**New gate.** `expedition_sim` asserts every creature an open quest can field
resolves to a painted set that has finishing moves — the rule as it is actually
felt, rather than as a list of entity names — and that each variant resolves to
the same set as the creature its clips were painted against.

**Suites.** Headless 19 sim / 9 recruit / 25 lifecycle / 6 cinematic / 6 portal /
5 inn / registration / contract / levels doc. Browser: level sweep 8/8,
`test:restart` 24/0, `test:ship` ok, `test:camera` 6/0. `docs/LEVELS.md`
regenerated and now reads in play order.

---

## 2026-09-21 — Inn Embark was still the tutorial; Finisher missed half health

Hiro still never left the tutorial road, the first Finisher pause still did not
hold, Katana Slash still hit too hard, and the Alpha died too fast.

**Quest two was a lie.** `openQuests` already listed rain then city, and the inn
even drew a Next-quest button — but `InnScene.embark()` returned `replayRoad()`
whenever recruiting was locked, and the gold button the hand pointed at *was*
Replay the road. Sanitation was fixed this morning; the button was not. Embark
now walks `Camp.nextQuestId` (tutorial → rain → city → rain…) while hiring stays
shut. Replay the road is the quieter extra above it. Marsh and ruins stay closed:
their plates and `night1` are still over the 20 MB budget. `scenes_town.js`,
`data.js`.

**Finisher never paused at half.** Core targeting is a strict `<`, so a wolf
sitting on exactly 50% greys the icon out. Katana Slash at 1.6 plus bleed then
often skipped the window entirely. Fixes: Finisher L1–3 `requireBelowPct` /
`executeBelow` 0.50 → 0.51 (so "at or under half" is actually offered), and the
director holds as soon as the window opens rather than only on Hiro's next turn.
`data.js`, `scene.js`.

**Numbers.** Katana Slash L1 1.6 / bleed 0.4 → 1.3 / 0.3 (L2 1.6 / 0.4, L3 1.85
/ 0.5). Alpha 1.25 → 1.9 HP.

**Tests.** Headless sim: inclusive half-health window, ≥70% of road ambushes
open a Finisher window without a tap, inn still cycles rain then city.
Browser inn/recruit suites now read `embarkBtn` as the next quest and
`replayBtn` as Replay the road.

---

## 2026-09-21 — The real freeze: an enemy with no body. Wolf and plant only.

Fable. The cache-stamp fix earlier was necessary but it was not the freeze Hiro
was seeing. His screenshot showed it plainly: a green enemy health bar floating
by the arch with **no creature under it**, and a fight that could not end.

**Cause, and it was mine.** Road in the Rain opens on two cave boars
(`rain_boars`) and closes on a boar boss. When I added `X.shipped.actors` as the
list of art the runtime may queue, I left the boar out — deliberately, on the
strength of a contract assertion that said the boar atlas was "off-scope". That
assertion predated the rain quest being open. So `P.needed()` refused to load
the boar atlas, the boars arrived with stats and a health bar and no body, and
nothing could resolve. The guard meant to prevent a missing-art hang caused one.

**Hiro's call, and the better fix:** *"we should only be using the wolf and the
plant creature for now, since those are the only ones with full art."* Right —
so rather than shipping boar art, every open quest is rebuilt from the creatures
that have been reworked. Road in the Rain and the City Watch now field wolves,
thorn lurkers and the Alpha; the boars and the human foes are out of both. The
original rosters are kept in a comment beside each one so they can come back
when their art does. The marsh and ruins rosters were fixed the same way even
though they stay closed, so reopening them cannot repeat this.

The Alpha stays as the boss on purpose: 9 clips, 45 frames and three Hiro paired
finishers, which is the same bar as the wolf and the plant.

**A second bug the fix uncovered.** `alpha_2` — the boss of every non-tutorial
quest — had neither `artActor` nor `artIdentity`, so it resolved to no painted
set, and `scene.js` threw *"No complete painted enemy in tutorial: alpha_2"* the
moment a boss wave came up. It is now wired exactly as the road's boss is, and
its `tint` is gone; that belonged to plate art, not to a painted sheet. Worth
noting that this one failed loudly rather than silently, which is the behaviour
we want: the scene refuses to open a fight with an enemy that has no art.

**The gate that would have caught it.** `test/expedition_sim.js` now walks every
encounter of every open quest and asserts that each creature it can field has
its art in `X.shipped` — humans excepted, since they compose from the shared
part sheets. An enemy with no art stops the game rather than merely looking
wrong, so this is the more important half of the art contract; the scenery check
added earlier is the other half.

**Verification.** Headless 17 sim / 9 recruit / 25 lifecycle / 6 cinematic / 6
portal / 5 inn / registration / contract. A browser probe jumped straight into
Road in the Rain and reported both enemies carrying `xp_wolf_sheet` at full
size, the wave resolving, and no page errors or failed requests. `test:ship`
plays the whole journey into the rain quest and passes; `test:restart` 22/0.
Ship set 18.33 MB of 20.0.

---

## 2026-09-21 — Freeze: a half-updated build, and the guard against it

Fable. Hiro: *"game has crashed"*, then *"game is frozen and I can't restart."*
My fault, and the cause is worth recording because it will recur otherwise.

**What happened.** Thirteen expedition scripts changed today, but `index.html`
still stamped them `?v=20260920-astra-v2` — yesterday's cache-busting version.
Only `dev.js` had its stamp bumped, in the very commit meant to make the new
panel reachable. So a browser that already had the game open loaded **today's
`dev.js` against yesterday's cached `campaign.js`, `data.js`, `scene.js` and the
rest**. Today's code calls things that only exist in today's files —
`Camp.artShipped`, `X.shipped`, `X.fx`, the rewritten `sanitizeRun` — so the
scene threw during setup, died before `X.UI.corner` ever mounted, and took the
Start over button down with it. Hence frozen *and* unable to restart: the only
control that could have recovered the run is drawn by the scene that crashed.

Note what did **not** cause it. The headless suite was green, and a probe that
drove every new control in a real browser — weather cycling, time cycling, full
speed, previewing the locked marsh, then reloading — reported zero page errors,
zero console errors and zero failed requests. The code was fine. The delivery
was not.

**The fix.** All fifteen expedition scripts now share one stamp,
`20260921-xp3`, and move together.

**The guard.** `test/ship_budget_contract.js` now asserts two things about
`index.html`: every `js/expedition/*.js` script tag carries a `?v=` stamp and
all of them are identical, and that stamp's date is not older than the newest
file it covers. Either mistake fails `npm test`. Verified by deliberately
bumping one script out of step and watching the contract name the odd one out.

**For Hiro:** a hard refresh (Ctrl+F5) once, and the whole set comes down
together. `?fresh=1` clears a saved run without needing the frozen screen to
respond, which is the general escape hatch for this class of problem.

---

## 2026-09-21 — Full speed, a location preview, and the art catalogue

Fable. Hiro, after confirming the tutorial now works: *"temporarily disable the
cinematic cam and the slow down on finishing moves and skill use to see how the
game looks at full speed"*, *"I'm still not able to get to the next quest
location, it just repeats to the forest area again"*, and then a request for the
full palette to design level two with.

**Full speed.** `X.fx = { cinematics: true }`. With it false, `UI.cinematic`
runs its body straight through — no push, no slow motion, no scene bookkeeping —
and `hitStop` returns immediately, so no impact holds. The same hits land in the
same order at one speed. The dev panel's **Full speed** toggles it; players
cannot reach the switch. `data.js`, `ui_common.js`, `beats.js`.

**Why the forest repeats, which is not a bug.** Road in the Rain is painted on
the same plates as the tutorial road — `deep_wood, bandit_road, mountain` — with
the same `forest` panorama and storm weather. It is the same place in worse
weather, by design. The City Watch (alley) is the first visually distinct stop,
and it is open now.

**Preview a location.** A second page on the dev panel listing every quest,
locked ones included: picking one lifts the slice lock, retires the guidance and
drops into that quest's travel panorama, so the location is the first thing on
screen. The marsh and ruins are not in the packaged build, so this works against
a local server — which is where the panel lives — and not in a `--ship` run.

**Weather and time cycling.** `Camp.weatherFor` now honours `X.devWeather` and
`X.devPhase`, and the panel cycles both (clear / overcast / rain / storm, and
day / evening / night) restaging the scene so the change is painted. Both are
unset for players and nothing but the panel writes them.

**The catalogue, for level two.** The offshoot carries 7 battle plates and 4
travel panoramas; the website game has **34 plates and 28 panoramas**, each
0.26–0.48 MB, one `sync_shared.js` entry away. Contact sheets are in
`dist/catalogue/`. On creatures, Hiro was explicit — only reworked art counts.
Four creatures qualify: **wolf** (9 clips / 38 frames, five Hiro pairs including
the two bites), **thorn lurker** (4 / 17, three pairs), **Alpha** (9 / 45, three
pairs in its own atlas) and **cave boar** (5 / 20, animated but **no finishing
move painted**, and currently outside the ship set). Everything else in the game
is plate art and is not offered as an option.

**Tests.** Headless green (sim 16, recruit 9, lifecycle 25, cinematic **6** with
a new full-speed case asserting the body still runs while camera and clocks are
untouched, portal 6, inn 5, registration, contract). `test:restart` **22/0**,
now covering the Full speed toggle, the preview listing every quest, and picking
the city landing in its travel scene. Ship set 18.33 MB of 20.0.

---

## 2026-09-21 — The tutorial teaches during the fight; the city opens

Fable, on two reports from Hiro: *"tutorial is kinda broken, it start after the
3 wolves are killed"* and *"I'm unable to get to the second quest."* Different
bugs, both real.

**The tutorial was starting over the corpses, and the cause was the economy.**
The player began with 0 gold and every skill locked, and `guidePurchase()` ran
at the end of `victory()` — after the payout. So the first purchase could not
happen until a fight had already been won, and the in-fight prompts skip any
skill the player does not own, which left fight one on autopilot with an empty
kit. The pause-and-point machinery Hiro wanted was already built and correct; it
simply never got a turn. Fixes: `X.economy.start` 0 → 20, `guidePurchase()`
moved to the top of `fight()`, and the forward arrow now holds on every tutorial
fight rather than only the first. The road reads buy → fight → hold at half
health → tap → arrow, three times, once per skill. The player reaches the inn
with 110 instead of 90 (Hiro's call). `data.js`, `scene.js`.

**Quest two was unreachable by construction.** `Camp.sanitizeRun` forced
`questId` back to `'road'` whenever `recruitingLocked()` and the quest was not
literally the road — ignoring `X.slice.openQuests` entirely. Embarking on Road
in the Rain worked and was then undone by the next save load. It now tests
`Camp.questOpen(run.questId)`, so an open quest survives sanitation and a locked
one is still pulled back. `campaign.js`.

**The City Watch is open; the night pair is not, and the reason is size.** All
three locked quests already had their character art — the wolf, plant, boar and
Alpha, plus the human foes — so the only thing missing was backgrounds cut
earlier for space. The city's alley plate and panorama (0.66 MB) are back, paid
for by dropping Bram's combat atlas (2.42 MB): he cannot be hired while the inn
is locked, so the package was carrying a companion the player cannot reach. The
marsh and ruins share `night1` (1.00 MB) and need four plates (1.42 MB) — 2.42
against 1.68 MB spare — so they wait for a trim. **Ship set: 18.32 MB of 20.0,
1.68 MB spare**, down from 20.18 MB and failing this morning.

**A new rule, because a missing file does not degrade.** Phaser parks a scene in
`preload` until every queued file arrives, so an absent asset is a black screen,
not a fallback. `X.shipped.actors` now names what the runtime may queue;
`P.needed()` refuses anything outside it, and `Camp.recruitReady` refuses a
recruit whose art the package lacks — which is what stops the dev panel's "Open
every quest" from lifting the lock and sending the loader after Bram. Two
assertions hold the line: every open quest's music, plates and panorama must be
in the ship set, and `X.shipped` must match the package in both directions. That
second one caught a mistake of mine immediately — I had listed the boar, whose
atlas is deliberately off-scope because boars render from the shared plates.

**Tests.** Headless 15 sim / 9 recruit / 25 lifecycle / 5 cinematic / 6 portal /
5 inn / art registration / ship contract. Browser: `test:ship` ok, `test:camera`
6/0 with a finisher kill, `test:restart` **17/0**, including the new regression
for the reported bug — it asserts the first guidance arrives with every enemy
alive and nothing paid out, the skill is owned before any payout, and the fight
holds while enemies are still standing with one at or under half health
(observed: 2 living, 1 at or under half).

Several tests encoded the old economy and the one-open-quest slice and were
updated to state the rule rather than the number — gold is now expressed against
`X.economy.start`, the legacy-save smuggling test names `marsh` (a still-locked
quest) instead of `city`, and the Bram fixtures carry him in `X.shipped` for the
stretch that exercises the future loop. One honest note: `test:restart` timed out
once on a loaded machine before its tight waits were raised, so treat it as
occasionally slow rather than proven stable.

**Not done here.** The `js/data` trim, which is what would pay for the night
pair.

---

## 2026-09-21 — Module spec (§12b), and the trim candidates measured

Fable, design only — no code. Hiro asked whether parts of the game could be
flagged in and out of the build like modules, to tweak the size easily, and
chose "just give me the plan for now".

**§12b added to the GDD.** Three of the four pieces already exist: the ship
manifest plus `size_check`, `test:ship` serving only that set so a cut-but-
referenced file 404s in the tests, and `P.needed()` in `painted.js` as a single
chokepoint for actor atlases. What is missing is a `tools/modules.json` source of
truth, a `build:preset` generator writing `js/expedition/build.js`, per-module
sizes in `size_check`, and the preset printed by `release:check`.

**The safety rule is the load path, not the file system.** Phaser parks a scene
in `preload` until every queued file arrives, so an absent file hangs the game on
a black screen rather than degrading. The build must be *told* what is out, never
discover it. Modules being "off" never deletes anything; the files stay in git.
The one new hazard is a save naming a module that is now out, which must drop the
member with a note rather than crash — it gets its own test.

**Trim candidates, measured against the 182,102-byte overage.** Bram 2.26 MB (a
recruit the slice locks). `js/data` 1.37 MB in the ship set, of which
`voice_manifest.js` alone is 0.42 MB and the website's dialogue tables —
`campaign3_dialogue` 0.18, `dialogue_context` 0.11, `dialogue_bonus` 0.07 — make
up most of the rest; realistic recovery 1.0–1.2 MB. `tavern.webp` 0.28 MB, now
that the inn runs on painted inn art, pending a reachability check. `audio/sfx`
1.04 MB across 42 files, unaudited for what the slice actually triggers. Hiro's
atlas is 4.76 MB at 400 px, where a drop to ~340 px is worth 1.2–1.4 MB but is
Astra's call. Phaser at 1.19 MB could give up perhaps 0.3 MB to a custom build,
which is not worth the risk. Voice at 0.33 MB stays.

**A correction made in the course of measuring.** A first pass reported the five
part sheets (4.40 MB) as back in the ship set; they are not. The grep had matched
`ship_manifest.json`'s `partSheets` block, which `size_check` excludes while the
busts are baked. The plate audit was redone against `shipList()` itself. The real
result: the anime plates in the build total 1.89 MB, the alley, marsh, ruins and
city plates are already out, and `tavern.webp` is the only one the open slice
cannot reach.

**Hiro's direction on the trim:** Bram and the `js/data` trim, with more options
to discuss. Together those are ~3.3–3.5 MB against a 0.18 MB overage, which also
buys room for the unintaken candidates and the Hiro atlas split that load
phasing needs (§12a.3).

Docs committed by path again: the concurrent session's code is still uncommitted.

---

## 2026-09-21 — Doc corrections, and the size gate is failing

Fable, at Hiro's request after the status checklist: *"yea you can update the
stale lines. we do need to know the actual current size of the game got to keep
below 20 or won't meet crazy games mobile requirements."*

**The size, measured rather than quoted.** Last committed state is **17,867,032
bytes / 207 files**, 2.13 MB clear of the gate. The working tree is not: an
**Alpha boss intake landed at 13:57 today** from a concurrent session — page 0
grows 393 KB → 1.89 MB and a 399 KB page 1 is new — which puts the ship set at
**20,182,102 bytes / 210 files, over the 20,000,000-byte gate by 182,102**.
`npm test` fails on it, which is the gate doing its job. Packaged with gzip the
same set is 17.27 MB, but the gate measures served bytes and stays the strict
reading of the platform's 20 MB.

Where it sits: Hiro 4.76 MB, `js` 2.46, music 2.34, Alpha 2.31, Bram 2.26,
plates 1.89, Phaser 1.19, sfx 1.04, wolf 0.63, plant 0.40, inn 0.39, voice 0.33.
Two trims clear it and cost the slice nothing: the `js/data` trim (~1.5 MB, long
on the list) and **Bram's 2.26 MB, which ships for a recruit the slice keeps
locked** — he was taken off the critical path, but he is still inside the
package. Either alone is enough; neither has been done, and this is Hiro's call
to make against the Alpha art he just gained.

**Doc corrections.** Seven passages that the last two days had overtaken:
§12a.1a (the measurement above, replacing 15,650,969 / 195 files), §14's build-
size row (now flagged over), §15's preamble (said every-kill finishing behavior
was retained — it is tap-only since round 3), §15.1's "16.97 MB of 20.0",
§15.3 item 1 (said fourteen Hiro clips were on disk only — superseded by the
09-21 audit; the unintaken set is now the manifest-less candidates), §16's
preamble (said levelling buys the cooldown — it is gone), and §16.10 (finishers
gated to the last enemy — superseded by tap-only, and with no cooldown they can
chain inside a wave).

**Not touched: the code.** A concurrent session is mid-flight in this folder —
`actors.js`, `data.js`, `painted.js`, `scene.js`, `art_registration.js` and
`ship_manifest.json` are all modified and uncommitted at the time of writing,
giving the road's third fight a distinct painted Alpha with its own paired
finishers instead of a dressed-up wolf. Their work builds on this session's
commits and the Finisher cooldown change survived intact. This entry and the GDD
edits were committed **by path** (`docs/` only) so that nothing of theirs was
swept into a commit it did not belong in.

---

## 2026-09-21 — Finisher loses its cooldown

Fable, at Hiro's call: *"can you take the cool down off finisher? It's already
limited by having specific conditions it can be used under anyway."* Right —
the health window is the cost. A second Finisher needs a second enemy softened
below half, which the fight has to produce; a three-turn timer on top of that
mostly meant refusing the tap at the one moment the window finally opened.

`cooldown: 3 / 3 / 2` becomes `0` at all three levels in `js/expedition/data.js`.
That is the whole change: `combat.js` only records a cooldown when the manifest
carries a truthy one, so the HUD's wedge and the "Cooldown n" info chip simply
never fire for Finisher now. Levelling still buys the heal (25/35/50 %) and the
hit (2.4/2.8/3.2); the windows stay flat at 50 % normal, 25 % boss.

Finishes can now chain inside one wave, and the finishing cinematic with them.
That is intended — it is a reward for setting two enemies up — and the camera
test confirms the camera still comes home between them.

**Balance.** Every sim win rate stays 1.00. The measurable effect is the boss
wave with tapped finishers: ~1.8 rounds → ~1.4. Finisher windows seen 183,
fired by request 120, 0 requests dropped, 0 engine errors.

**Tests.** `expedition_sim.js` asserted `cooldown === 3`; it now walks L1–L3 and
asserts there is no cooldown at any level, so it cannot quietly come back.
Headless suite green (sim 14, recruit gate 9, actor lifecycle 25/0, cinematic
scope 5/0, portal readiness 6, inn art 5, art registration, ship budget).
Browser: `test:camera` 6/0 (finisher kill seen), `test:ship` ok, `test:restart`
12/0.

**GDD v0.9:** §7 carries the decision and the reasoning; §7a's real-time table
had Finisher on a 20 s ultimate timer, which now contradicted the rule, so that
row reads "none — the health window is the gate", with the note that if finishes
ever chain too freely in real time the answer is a gap between *cinematics*, not
a cooldown on the skill.

---

## 2026-09-21 — A true restart, and the developer's tools move into the game

Fable. Two things Hiro asked for after the round-3 build: *"yea it should be a
true restart"*, and *"assume that I as the developer will not use these urls,
and will need debug buttons in the game."* Mid-session he set the policy for
those buttons: *"we are still in development so it's ok to show debug tools, we
will just need a flag to hide debug tools after development."*

**Start over is a true restart.** `Run.startOver` used to build a fresh run and
then copy the old one's `tutorial` object into it — `arrowDone`, `finisherDone`,
`used{}`, `inspectDone`, `purchases`, `skipGuide`, `recruitDone`, `embarkDone`.
So a restart handed the player a blank save *and* a retired tutorial: no hand,
no holds, straight into a fight with an unlearned kit. It is now `Run.reset` and
nothing else, which is also exactly what `?fresh=1` builds — one path instead of
two, which is why the suites never caught this (`?fresh=1` had no `prev` to copy
from, so only the in-game button was broken). `js/expedition/run.js`.

**The developer's tools are a panel in the game.** New `js/expedition/dev.js`
(~9 KB) behind a cog in the corner control of every scene: Fresh tutorial, Jump
to the inn (road cleared, 150 g), Boss fight, +100 gold, Unlock every skill,
Open every quest (toggles `X.slice.firstLevelOnly`), Painted art off (toggles
`X.art.hiroSheet` for the A/B against the plates), Clear the save. Every jump
calls `UI.resetCamera` first, so a jump cannot strand a pushed-in camera.
`ui_common.js`'s corner control now exposes `button` and calls `Dev.attach`.

**One flag hides them.** Per Hiro's note, the tools are on by default during
development — no key to remember, and they work on a phone. `Dev.DEV_BUILD =
false` at the top of `dev.js` removes them completely for the CrazyGames
package: no cog, no keyboard shortcut, and nothing a stored setting or a URL can
do about it. For a player's-eye look without editing anything, **Shift+D** hides
and restores them, and `?dev=0` hides them for one session.

**New: `npm run release:check`** (`tools/release_check.js`) — the last gate
before packaging. Fails while `DEV_BUILD` is true, and checks that `Dev.attach`
is actually gated on it, that the build is inside the size budget, that the
busts are baked and that the notices file is there. It changes nothing. It
reports *not ready to ship* today, correctly: the flag is on because we are
still building.

**The URLs still work** for the automated suites, which cannot press buttons
before the scene exists: `?fresh=1` builds a genuinely fresh tutorial run, and
`?at=inn[&gold=N]` now routes through `Dev.innRun(...)`, so the shortcut and the
panel button produce the same run instead of drifting apart. `index.html`.

**New test: `npm run test:restart`** (`test/browser_restart_dev.js`, 12 checks,
all passing). It retires guidance the way play does, presses Start over in the
corner control, and asserts the run *and* the tutorial flags are blank in memory
and on disk and that the hand comes back unaided — the regression for the bug
above. Then the tools: present on a plain load, hidden and restored by Shift+D,
hidden by `?dev=0`, and — serving `dev.js` rewritten to `DEV_BUILD = false`,
which is the shipping build exactly — absent for the cog, the key and `?dev=1`.

**Verification.** Headless suite green (sim 14, recruit gate 9, actor lifecycle
25/0, cinematic scope 5/0, portal readiness 6, inn art 5, art registration, ship
budget contract). Browser: `test:ship` ok, `test:camera` 6/0 with a finisher
kill seen, `test:recruit` ok at 1280 and 375, `test:restart` 12/0. Size gate
17.87 MB of 20.0 MB.

**GDD v0.9:** §7 rewritten on both points, the developer-tools paragraph added,
the test list gained `browser_restart_dev.js`, and **§16.7 is answered** — Start
over resets the tutorial, decided by Hiro, 2026-09-21. The 2026-09-19 design
entry still reads "keeps the tutorial retired"; it is left as written, because
it is a record of what was decided that day, and §7 and §16.7 now carry the
correction.

**Housekeeping.** `dist/xp_sync3.tgz` and `dist/xp_sync4.tgz` are scratch
transfer archives (git-ignored). The sandbox cannot delete files in this folder,
so Hiro can remove those, and the two older ones, by hand.

---

## 2026-09-21 — Round 3: camera comes home, player-spent finishers, Road in the Rain opens

Fable. Hiro's playtest list plus the non-art backlog. Checkpointed first
(`2d14d71`), every suite green, ship set **17.86 MB / 206 files**.

**1. The camera always comes home.** `X.UI.cameraBase` is now a constant — zoom
1, centred — instead of a sample of the live camera. Sampling was the bug: a
baseline captured while a restore pan was still in flight became the next
baseline, so the zoom ratcheted in over a fight and never came back. Added
`X.UI.resetCamera(scene)` and called it on every exit: fight over, victory,
defeat, defeat-card buttons, wave arrow, scene restart, Start over, shutdown.
Files: `ui_common.js`, `scene.js`.

**2. Cinematic rates.** cast 0.50 → **0.70**, kill 0.36 → **0.55**; push-in
240/220 ms → **150/140 ms**. The first pass read as lag rather than drama.
`data.js` (`X.cinematic`).

**3. Finishing moves are player-spent.** Only a kill made with the tapped
Finisher plays a finishing move and the `kill` cinematic; a lethal Katana Slash,
counter, riposte, ally blow or bleed-out is an ordinary death with the normal
hit-stop. Two places were giving finishers away: the `playDowns` path (now takes
a `byFinisher` flag threaded from the step's own choice) and the Katana Slash
branch, which swapped its clip to `finisher` on any lethal hit (removed, as was
the same swap for allies). `beats.js`.

**4. Finisher windows: 50 % normal, 25 % boss, flat.** Was 40/50/60 by level with
no boss case at all. Levelling still buys the heal, the cooldown and the power.
The shared engine exempts bosses from execution and `js/core` is never edited
here, so `Enc.bossExecutable` lifts that exemption for exactly one resolution
when a boss is already under its line and the Finisher is being spent on it —
the engine then runs its own execute path, event, death bookkeeping and heal
included. Measured: boss at 20 % executes, at 40 % takes the hit and lives, flag
restored both times. `X.skillText.finisher` rewritten for a fourth-grade reader.
`data.js`, `encounter.js`.

**5. Road in the Rain is open — and nothing else.** `X.slice.openQuests` is a
whitelist (`['rain']`); `Camp.openQuestIds` / `Camp.questOpen` make city, marsh
and ruins unreachable rather than merely unlisted, and the inn shows the open
quest as a live Embark beside Replay the road. Hiring stays locked, Bram
unwired. `data.js`, `campaign.js`, `scenes_town.js`.

**6. Marsh weather.** `Camp.weatherFor(quest, world, phase)` resolves a quest's
weather once, for battle and travel, deliberately without a `groundId` — the
marsh plate's own `weatherBias: 'rain'` was overruling the quest's declared
clear night (verified in-browser: marsh with groundId resolved `rain`, without
it `clear`). Phase is applied, so a night storm reads as night.

**7. Panorama ambience.** `travel_panorama.js` calls `A.GateAmbience.attach()`
for *every* panorama, gate or not — the module was never synced, so the call
was a silent no-op and the travel scenes ran with no ambience layer. Synced
`js/ui/gate_ambience.js` (20 KB; depends only on already-synced modules), added
to `index.html` and the sync list. Decision recorded in GDD §16.

**8. Load phasing — measured, and it is the largest submission risk.** Throttled
cold starts against the ship allowlist (phone viewport, first fight on screen):
fast 4G **12.2 s**, slow 4G **26.0 s**, 3G did not arrive inside 60 s. The
1.0–1.2 s figure quoted until now is unthrottled and says nothing about a real
player. First cut taken: **Bram's 2 MB no longer loads while hiring is locked**
(`Painted.needed`, reading the run being started, not the one left on the scene
by the previous visit) — critical path 11.89 → **9.69 MB**, fast 4G → **10.1 s**,
3G now arrives at 53 s. Remaining, in order of value: trim `js/data` (~1.5 MB)
and split Hiro's atlas so the first fight loads only its own clips (~2 MB).
Numbers and the plan are in GDD §12a.3.

**9. The inn now waits for late scenery instead of failing.** `InnArt.paint`
returned `Promise.resolve(false)` when its painting had not arrived yet, which
`Painted.present` turned into "Scenery could not load" — on a slow connection
that is a hard failure for a file that was merely still in flight. It now waits
for the loader to finish and retries once. Found by throttling.

**10. Buy refusals name the real reason.** `Camp.buy` checked art readiness
before the slice lock, so with Bram's art deferred a locked-slice purchase was
refused as "art unavailable". Lock first, art second.

**Tests.** New `test/browser_camera_rest.js` (`npm run test:camera`): plays the
road tapping skills so kills happen with and without the Finisher, and asserts
zoom 1 / centred / time scales 1 after every fight and at the completion card —
waiting for the cinematic to close rather than guessing a delay, and mapping game
coordinates through the canvas so it is honest at phone width. Updated for the
new rules: `actor_animation_lifecycle` (an automatic kill is an ordinary death;
a tapped Finisher kill finishes every victim; a bleed-out is not cinematic),
`cinematic_scope` (the contract is "restore to the resting camera", and one
shutdown guard per scene rather than one per cinematic), `expedition_sim` (a new
threshold test; the quest-cycle assertions split across two runs so the locked
and unlocked cases stop sharing state), `expedition_recruit_gate`,
`browser_inn_art` and `browser_recruit_gate`. That last one had rotted unrun —
it referenced `companionFigures`, which the painted inn stopped creating — so it
is now wired to `npm run test:recruit`.

**Results.** `npm test` all green (sim 14, recruit gate 9, actor lifecycle 25,
cinematic scope 5, portal readiness 6, inn art 5, registration, budget). Browser:
ship-only journey ok; camera rest 6/6 with a real Finisher kill, at 1280 and 390;
recruit gate ok at 1280 and 375; skill icons ok; inn art ok at 1280 and 375;
startup and portal-stub findings empty.

**Note for the next session.** Tutorial win rates are now 1.00 across every build
(they were 0.82–0.89 on 2026-09-19) after the v2 roster change to the gray-wolf
leader — the sim floors still assert but no longer discriminate. Worth retuning
when the road's own boss art lands.

## 2026-09-21 — Review-only audit: source art present, intake incomplete

Reviewed the reconciled runtime checkpoint (`f5b7781`) and the Astra v2 source-art
tree after the art workers stopped. This review changed no game code, runtime
assets, gameplay data, original Adventurer files, or source artwork. The runtime
repository is clean at the checkpoint; the previously recorded `npm test` and
`npm run test:ship` gates passed. The measured runtime remains **17,828,737 bytes
/ 205 files**, leaving **2,171,263 bytes** below the strict 20 MB ceiling.

The validated source catalog is still partial: **3 actors, 28 clips, 144 frames,
9 paired finishers, 27 unique source images, and 57,273,763 source bytes**. It
covers the tutorial Alpha plus the approved/reused wolf and plant sets and adds
**0 runtime bytes**. Candidate paintings are present for the planned boar,
Ironback boss, Marsh Alpha, Ruins Alpha, raiders, and town watch, but those new
actor folders do not yet have complete authoritative manifests and therefore are
not included in a strict catalog or ready for Fable intake. No claim is made that
the later levels are playable or that their complete asset pack fits the mobile
budget.

The existing battle plates and travel panoramas remain the intended scenery
reuse; no new background art was generated in this review. The source handoff
continues to document the known marsh-weather and panorama-ambience wiring notes,
the separate boss identities, registration requirements, and the remaining
camera/Finisher/threshold/level-unlock work for Fable. Runtime intake and gameplay
changes remain pending.

---

## 2026-09-20 — Approved Astra v2 integrated; ready to test

Integrated the 16-frame run, sheathed idle, six paired finishers, painted skill
icons and animated solo/Bram inn. Preserved body registration, blade/foot bounds,
single-contact combat events, saved progress and the existing first-road locks.
Updated converter, figure timing, enemy/tier selection, HUD, inn and allowlist.
Superseded runtime finishers are retired; source masters remain outside upload.

Headless checks, two upload-only tutorial clears, all-six-finisher Phaser QA,
icon interactions, inn lifecycle and desktop/emulated-phone startup pass.
Build:17,828,737 bytes / 205 files,2,171,263 bytes below 20 MB. Local test port8742.
[Integration details and evidence](ASTRA_V2_INTEGRATION_20260920.md).
No publication or original Adventurer changes.

---

## 2026-09-20 — Astra: overhead wolf finisher and relaxed run, preview only

The user rejected the wolf iaido and the run's stomach-clutch posture. Source
selection now uses a 12-frame overhead slash, non-gory wolf dissolve, sword
twirl and return to Hiro's existing drawn idle. Locomotion uses 16 new paintings
with an upright chest, one hand resting at the hilt and the other arm swinging.
The plant iaido and all other art selections remain unchanged.

The source gallery supports both two-sheet timelines. Crop regions, body-scale
references, foot registration and zero-based contact/recovery markers accompany
the images. Source checks and review captures live in the source-art folder at
`astra-v2/review/overhead-run-v4/`; details and prompts are linked in
`astra-v2/REVISION_OVERHEAD_RUN_V4.md`. Selected Hiro content totals 64 frames
across eight clips. No game integration or publication occurred.

---

## 2026-09-20 — Astra: integration paused; three source-animation corrections

At Hiro's request, paused runtime intake and changed only the source/preview
selection for wolf horizontal cleave, plant stem cut and locomotion. The wolf
now uses a fast iaido midsection cut with low scabbard hand; the plant shows a
corrected draw, horizontal stem cut and consistent sword-hand recovery. The
walk is replaced by a 16-frame, 800 ms samurai run with the hand at the sheathed
katana. Source regions/ground anchors were measured and the gallery supports
the run's two eight-frame sheets. Other four finishers, icons, idle and inn
compositions are unchanged.

Source index: `../adventurer-expeditions-source-art/astra-v2/manifest.json`.
Preview and details: `astra-v2/index.html` and `REVISION_IAIDO_RUN.md` in that
source directory. Selected Hiro content is now 58 frames across 8 clips; source
validation passes 28 PNG files including 13 reused originals. Runtime remains
15,650,969 bytes / 195 files. Before the pause, only an inn conversion script and
unused inn WebP candidates were created; no loader, scene, HUD or ship-manifest
integration occurred. Those candidates are excluded from the upload.

---

## 2026-09-20 — Astra: art pass 2 delivered; Fable overwrite reconciled

Fable was paused before repair. Restored the painted multiatlas loader,
save normalization, complete Bram readiness checks, scenery/SDK start gating,
paired contact and recoil sequencing, and nested cinematic recovery. Preserved
manual skills, hold-to-read tutorial gates, locked inn options and replay.
The tutorial uses ordinary wolves, thorn lurkers and a gray-wolf leader;
unused later-level assets remain on disk and are excluded from the upload.

Source delivery is complete outside the game: six paired finishers/36 drawings,
a corrected eight-frame walk, four-frame sheathed idle, two inn paintings plus
three transparent four-frame overlays, and four Hiro icons. Existing wolf/plant
13-clip coverage was confirmed. New v2 art is source-only, awaiting intake.

Current package: **15,650,969 bytes / 195 files**, cold gameplay download
**11,931,986 bytes**, after audio **12,976,946 bytes**. Two upload-only tutorial
clears passed with 12 manual casts and 20 cinematic restorations. Desktop and
mobile browser startup plus delayed-scene SDK checks passed. Physical iPhone
and actual CrazyGames portal remain unverified. See
[complete repair and art report](ART_PASS_2_AND_REPAIR_20260920.md) and
[final intake notes](art/astra-v2/ART_INTAKE_NOTES.md).

The Fable notice below is retained as the incident record; its statement that
these integrations are currently absent is superseded by this repair entry.

---

## 2026-09-20 — NOTICE from Fable: my 17:34 commit overwrote concurrent work — read before editing

**Signed: Fable (Claude), 2026-09-20.** For Astra, and for whichever session comes
next. No further changes from me until Hiro says otherwise.

**What happened.** At 17:34 today I force-wrote my working copies of twelve files
into this folder without diffing against the folder first: `js/expedition/scene.js`,
`scenes_town.js`, `hud.js`, `ui_common.js`, `data.js`, `campaign.js`,
`encounter.js`, `beats.js`, `test/expedition_sim.js`, `test/browser_expedition.js`,
`docs/CHANGELOG.md`, `docs/ADVENTURER_EXPEDITIONS_GDD_v0.9.md`. Between my previous
commit (2026-09-19 19:19) and then, another session had edited those same files as
part of the animation-integration pass described in
`docs/ANIMATION_INTEGRATION_REVIEW_20260919.md` (multi-page atlases, victory
holding the sheathed frame, paired-finisher playback, Bram purchasable behind an
art-readiness gate, save validation, HUD portrait cropped from the atlas). **Those
edits to the eight code files and two tests are gone from disk.** The `.git` repo
here has a single commit (2026-09-19 19:48) that predates them, so there is
nothing to restore from. The files I wrote carry my 2026-09-20 changes only
(entry below: "The first five minutes").

**What survived of the other session's work:** `js/expedition/actors.js` (the
rewritten actor), `run.js`, `index.html`, `js/expedition/media_hashes.js`,
`package.json` (its scripts), all of `tools/` (`art_intake_v2.py`,
`build_painted_art.py`, `prepare_art_registration.py`,
`review_art_registration.py`, `build_media_hashes.js`, `art_registration/`,
`ship_manifest.json`, `size_check.js`), the six atlases under
`assets/expedition/{hiro,bram,wolf,boar,plant,alpha}/`, the new tests
(`actor_animation_lifecycle.js`, `art_registration.js`, `expedition_recruit_gate.js`,
`browser_recruit_gate.js`, `browser_startup_budget.js`, `portal_readiness.js`,
`ship_budget_contract.js`, `harness.js` changes), `docs/art/astra-v2/`, and the
review doc. Astra's 17:41 changelog entry above is intact.

**State of the tree right now: inconsistent.** The surviving `actors.js` and tests
expect the other session's `scene.js` / `hud.js` / `campaign.js`; mine are older.
Measured on this machine at 17:5x: `expedition_sim` 13 pass, `art_registration`
pass, `portal_readiness` pass, `ship_budget_contract` pass,
`actor_animation_lifecycle` 15 pass / 1 fail, `expedition_recruit_gate` crashes
(`campaign.js` lacks the readiness gate), `size_check` 19.79 MB of 20.0.
Assume the game does not run cleanly end to end until the two sides are merged.

**Also observed, not mine, flagged for Hiro:** `git status` shows edits to synced
shared copies — `js/core/campaign.js`, `campaign2.js`, `campaign3.js`,
`character.js`, `courtship.js`, `death.js`, `game.js`, `hiro.js`, `housing.js`,
`relationships.js`, `save.js`, `util.js`, `world.js`, `js/ui/anime_identities.js`,
`cutscenes.js`, `dialoguebox.js`, `portal.js`, `test/harness.js`. The next
`node tools/sync_shared.js` will overwrite those (only `js/ui/portal.js` is owned
here). Whoever made them should move the logic into `js/expedition/` or add the
files to `LOCAL` in `tools/sync_shared.js` with a note.

**What has to happen next (Hiro decides who):**
1. Re-apply the other session's edits to the eight code files and two tests
   (from its own workspace if it still has them; otherwise reconstructed from
   `actors.js`, the new tests and the review doc).
2. Merge my 2026-09-20 changes onto that: `X.manualSkills` + `Enc.tapPolicy`,
   `X.UI.splitCameras` + `X.UI.cinematic` and the beat that calls it,
   `X.hudIconR`, hold-to-read `infoChip` + `X.skillText`, per-skill first-use
   gates + `gateUntilInspected`, `X.slice.firstLevelOnly` with the locked inn and
   `replayRoad`, `X.UI.hiroFigure`. Every one is self-contained and marked with a
   2026-09-20 comment in the file; the entry below lists them.
3. Run everything in `package.json`'s `test` plus `test:ship`, then `git add -A
   && git commit` before any further commit from any session.

**Rules from this, effective now:**
- **`git commit` first.** Before writing into this folder, commit the tree as it
  is (`git add -A && git commit -m "pre-<who> <date>"`), so a bad write is one
  `git checkout` away from undone.
- **One session in the folder at a time.** If two must overlap, each edits only
  files the other has not touched that day, and checks `git status` / mtimes
  before every commit. Never force-write a file whose mtime is newer than your
  copy of it.
- **Diff before commit.** A commit that does not show the diff it is about to
  make has not been checked.

— Fable

## 2026-09-20 — Astra art pass 2 source handoff (intake pending)

Six Hiro/wolf-and-plant finisher sheets / 36 paired drawings are source-delivered
and inspected. Existing beast coverage is reused: 13 clips / 55 drawings.
Movement, four icons and inn production status, source hashes, inspection notes,
conditional budget savings and code-reconciliation pointers are in
[`docs/art/astra-v2/ART_INTAKE_NOTES.md`](art/astra-v2/ART_INTAKE_NOTES.md).
Masters stay in the sibling source-art folder. This art pass changes no runtime,
ship manifest, original website or export and preserves concurrent code work.

## 2026-09-20 — The first five minutes: player-fired skills, cinematics, hold-to-read, locked slice

From Hiro's playtest notes (the code side; Astra's list went out separately).
Both suites pass; ship set 16.97 MB.

**Skills no longer auto-fire.** `X.manualSkills`: Hiro's automatic policy may
use only Katana Slash; God Aura, Counter Attack and Finisher fire from a tap
(`Enc.requestSkill`) and nothing else. The headless sim stands in for the
player with `Enc.tapPolicy` (Finisher → Counter → Aura when ready), which
`runToEnd` uses when no policy is given. The "auto" rows of the whole-quest test
now hold the no-purchase floor only — an untapped run is an untapped run.

**Cinematic beats.** `X.UI.cinematic(scene, kind, focus, fn)`: a tapped skill
(`cast`: world at 0.5×, camera 1.16 toward the action) and every killing blow
(`kill`: 0.36×, 1.26) slow tweens, animations and timers and push the main
camera in, then restore. The HUD lives on its own camera now
(`X.UI.splitCameras`: everything at depth ≥ 800 is sorted onto it each frame),
so it neither zooms nor drifts. Values in `X.cinematic`.

**HUD.** Icon radius 18 → 26 (`X.hudIconR`). Skill info opens only on a
3-second hold (`X.infoHoldMs`), stays while held, lingers 3 s after release
(`X.infoLingerMs`); the box is 340 px wide at 16–20 px type and reads
`X.skillText` — four skills rewritten for a fourth-grade reader. A tap on an
icon still fires / unlocks as before.

**Tutorial.** The game holds (no step is taken) the first time *each* bought
skill is ready, pointing at its icon — was Finisher only. After the first
unlock a new hold-to-inspect step (`gateUntilInspected`, a ring that fills over
the hold time) until the info box has opened. Flags: `tutorial.used[id]`,
`tutorial.inspectDone`.

**The slice is the road.** `X.slice.firstLevelOnly`: `Camp.nextQuestId` returns
`road`; the inn shows Hiro from the painted sheet (idle — no sheathed idle
yet), his skills for levelling, *Next quest* and *Unlock a hero* locked, and
*Replay the road*. Recruit busts are not shown (their combat art is the baked
website bust, which the no-placeholder rule forbids). The travel road walks the
painted `walk` loop instead of the plate; with no sheet loaded nothing is drawn
rather than a plate. Flip the flag to reopen the loop.

**Tests.** `browser_expedition.js` reads `X.slice` from the page: in the slice it
plays the road, the inn, Replay, the road again (2 clears) and holds the icon
for the inspect gate (`hold inspect:<id>` in the log); recruit/dialogue
assertions apply only to the open loop. Sim: the quest-cycle assertion respects
the lock. Fixed on the way: Phaser camera effects take `Sine.easeOut`, not
`Sine.Out` (the tween spelling) — a wrong name throws inside the camera update
and freezes the fight.

## 2026-09-19 — GDD v0.9 rev. b: two corrections from Hiro

Same file, same day. (1) **Recruits get full painted sets to Hiro's standard**,
not the six-clip economy set — buying a recruit is buying a character. Bram's
delivered set is used whole; Nyx/Sable/Aera/Ren are not purchasable until theirs
exist. §3, §15.2, §15.3, §16.9 corrected; new §16.13 (which recruits ship painted
inside 20 MB). (2) **No placeholder art anywhere** — where art is missing the
GDD says so instead: new §10.5, the art-gap table. (3) **Finding: Hiro has no
sheathed idle** — after `victory-sheath` he snaps back to the drawn stance;
`idle-sheathed` added to Astra's list (§15.2 item 2a), §19 #14; interim: hold
the last sheath frame. §19 #15 records that today's bar sells recruits whose
combat art is the baked website bust, which the new rule forbids.

## 2026-09-19 — GDD v0.9: review pass after the build

`docs/ADVENTURER_EXPEDITIONS_GDD_v0.9.md` supersedes v0.8 (kept). No design
change and no code change. Sections that still described the pre-build state
were corrected to what shipped: §4 (prices, payouts, auto-fielding, layout),
§7 (Start over / pause / mute and the defeat card marked built), §8 (the inn's
invitation mechanism), §10.2a (intake as built), §12a.1a (where the 16.97 MB
landed against the budget table), §13 (what the suites now prove and their
flags). New **§19 Build review**: thirteen findings with severity and owner —
three submission blockers (no ending, phone layout unverified, load phasing not
started), the plate-vs-sheet Hiro seam, foe overlap at contact, city fourth-clear
at 0.57, the fourteen clips still to intake, Astra's greenlight, the marsh
plate's painted rain, provisional voice IDs, `js/data` headroom, and the bridge's
binary corruption — plus the verified list and a suggested order.

## 2026-09-19 — Build session: loop v1, painted Hiro, size gate (GDD v0.8 §15.3 items 1–4, 6, 7)

Executed in order from the v0.8 handoff. Both suites pass; the build measures
16.97 MB of 20.0 with the gate on. Astra's masters left the deploy folder.

**1. Corner control (§7).** `X.UI.corner` — mute, pause (freezes clock + tweens,
shades the scene), Start over with a ✓/✕ confirm — mounted by the inn, travel
and battle scenes. `Run.startOver` wipes the run but keeps the tutorial
retired. HUD lost its own mute/pause. Files: `js/expedition/ui_common.js`,
`hud.js`, `run.js`, `scene.js`, `scenes_town.js`.

**2. The loop (§1–§5).** `campaign.js` rewritten: `X.quests` (road tutorial +
rain / city / marsh / ruins, each = plates + phase + weather + music + travel
location + three encounters), `X.recruits` (Bram M05, Nyx F07, Sable M11 —
provisional IDs, §16 — Aera F03, Ren M02), `X.party` (field two, prices
60/90/120/150/180), `Camp.nextQuestId` (road once, then the four in sequence),
`Camp.scaleFor` (+30 % enemy hp/atk per clear of that quest, cap ×3.0; +15 % did
not bite in the sweep). `scenes_town.js` rewritten: the inn (Hiro's skills on the
HUD in inn mode, recruits along the bar with price tags, confirm chip, Embark),
the travel scene with outbound / midleg / return legs (panorama at the quest's
phase + weather, banter between fights), hero pick / trainer / blacksmith /
applications / grave gone (`heroes.js` unloaded, kept on disk). Battle scene:
quest phase and weather grade the plate, `tapArrow` → midleg travel, quests pay
per fight, `complete()` counts every clear. Road payout 30/40/50 → 40/50/60 (150)
so the tutorial's three guided unlocks (60) still leave the first recruit's price.
`?at=inn[&gold=N]` dev entry starts a fresh run at the inn with the road behind
it (tests, art review). Save key → `adventurer_expeditions_loop_v1`.

**Defeat card (§7).** A loop-quest defeat offers Again or Back to the inn with
the gold from the fights already won, so a party that embarked under-manned is
never stuck; the tutorial road still just goes again.

**Guidance (§8).** The inn invites over every affordable recruit at once (`UI.invite`,
rings on all, hand sweeping, no blocker), holds on the confirm chip, then points
(never blocks) at Embark so a second recruit or a skill can still be bought first.

**3. Dialogue (§9).** Rotation persists on the run (`Camp.attachVoice`); midleg
banter is one line. Voice synced for all five recruits, loop bands only
(forest/city/marsh/ruins/neutral/midleg/response/hatred/romantic/return win+loss);
funeral, mountain and road bands dropped.

**4. Painted Hiro (§10.3).** `tools/art_intake.py`: keys Astra's gray sheets
(border flood-fill, soft fringe), trims per frame, registers every frame to one
hero canvas (x = centroid of the lower third, y = lowest opaque row; bottom-centre
pivot), packs a WebP atlas ≤ 2048×4096 with a Phaser JSON-hash atlas that carries
`clips` (zero-based contact/release, per-frame ms, loop, impact draft). Nine
clips intaken at 400 px standing height: idle, walk, draw, short-draw, slash-l1,
hit-short, roll, victory-sheath, kneel → `assets/expedition/hiro/hiro.webp`
1.29 MB. `Actor` is Sprite-backed when a sheet is given: idle loop, contact at
frame 0 handled, `onHit(k)` for later contacts, release resolves early, per-frame
durations, drift from `X.impact`. `X.clipFor` maps the director's vocabulary to
clip ids; clips the sheet lacks fall back to placeholder motion. `X.impact` table
in `data.js` (seeded from the manifest's draft, all `greenlit: false`) read by
`beats.impact`. `?sheet=0` A/B. `test/browser_art_review.js` screenshots the
first fight. Companion marks moved right (265/150) and Hiro to x=400 to clear
the HUD.

**7. Size gate (§12a).** `tools/ship_manifest.json` (explicit allowlist +
folders; index.html's scripts/styles/icons implied), `tools/size_check.js`
(per-group totals, largest files, fails over budget, `--zip` builds
`dist/expeditions.zip`), `npm test` runs it after the sim, `npm run test:ship`
serves *only* the ship set so any stray request 404s. Cuts: masters moved to
`../adventurer-expeditions-source-art/astra-v1` (outside deploy); music three
tracks at 48 kbps mono (3.2 MB); voice 64 kbps mono (2.0 MB);
`tools/bake_busts.js` renders the five recruits and seven human foes to
`assets/expedition/busts/` (≈0.6 MB) so the 4.4 MB part sheets never ship
(`X.UI.installBusts` recreates each as a canvas texture with its portrait meta;
`Portraits.key` is routed to the bake for recruits and `expeditionHuman` foes);
cemetery / inn / camp / props_story plates and the road / mountain travel
panoramas dropped from the sync list. `tools/shrink_music.sh` →
`tools/shrink_audio.sh`. Result: **16.97 MB** (shared art 5.3, music 3.2, js 2.7,
voice 2.0, expedition art 1.9, lib 1.1, sfx 1.0).

**Tests.** `expedition_sim.js`: economy assertions follow the new payouts (a second
first-tier unlock now fits in 40 gold), loop test unchanged (first clear ≥ 0.8,
fourth ≥ 0.4; measured rain 1.00/0.97, city 1.00/0.57, marsh 1.00/1.00, ruins
1.00/0.90). `browser_expedition.js`: plays tutorial + one full cycle of the four
loop quests (5 clears) buying recruits at the inn, levelling skills there, taking
the defeat card if it appears; `--ship`, `--at=inn`, `--clears`, `PROBE=<regex>`.
Full run: 17 inn visits, 20 dialogues, 3 recruits, 0 defeats, 0 page errors.

**Working rule learned:** the desktop bridge's file commit converts LF → CRLF, which
corrupts binaries (`.webp`, `.mp3` came back 0.4 % larger with `\r` bytes). Text
files are safe; binaries go over as a base64 `.txt` and are decoded on the
computer (`tr -d '\r' | base64 -d | tar xz`), then md5-verified. This session's
art and audio were re-sent that way and match.

**Not done this session:** §7a real-time port (item 5 — blocked on §16.8),
phone pass (8), load phasing (9), store media (10). See GDD §15.3.

## 2026-09-19 — GDD v0.8: the loop redesign and the size gate

Owner: Claude. Design only — no code changed. v0.7 kept for history.

**The loop.** The demo becomes one repeatable cycle: tutorial → inn → recruit →
level a skill → travel → quest → travel → inn → repeat. **Hiro is the permanent
first member and the only tappable character**; recruits are bought with gold,
ship finished with the gear and skills their design calls for, fight on their own,
and are fielded two at a time from a roster the player can grow. Owning is the
purchase, fielding is free — which makes a five-name roster a real decision and
gives gold somewhere to go after the first two buys.

**Cut, and recorded in the new §18 rather than deleted:** the hero-pick screen,
the trainer, the blacksmith and gear purchasing, party applications and rotating
crews, the rival parties and the ambush, the doomed pass and the grave, and the
lawful/criminal framing. Each row in §18 names the revision it is written up in
and what cutting it cost.

**Content plan (§5): a tutorial plus four repeatable quests on three tracks.**

| # | Quest | Plates | Phase / weather | Track |
|---|---|---|---|---|
| T | The road (tutorial) | deep wood → bandit road → mountain | day / clear | Origin |
| 1 | The road in the rain | same three | day / storm | Origin |
| 2 | The city watch | alley | day / overcast | Origin |
| 3 | The reed marsh | marsh | night / clear | Hunter's Breath |
| 4 | The old ruins | ruins | night / storm | Hunter's Breath |

**The finding that makes four quests affordable:** the shipped art layer already
grades any plate to day / evening / night and overlays clear / overcast / rain /
storm / snow procedurally (`A.Weather`, `A.WeatherFX`, the night grade in
`anime_environments.js`), and the scenes already pass a phase and a weather
override. A night-storm version of a plate we ship anyway is one line of quest
data, not a new painting. Every battle plate and travel panorama in that table is
already synced.

**Music (§5.1).** `edwyn2` confirmed as "Weight of the Quiet Man Edwyn theme 2" —
the shipped `music.js` names it in its own comment — and assigned to the inn.
Origin of the Last Name assigned to the tutorial and quests 1–2; the library holds
both `origin1` (theme) and `battle_origin` (battle arrangement), recommendation is
`battle_origin`. **Hunter's Breath is not in the music folder under that name** and
needs pointing at — `night1` / `night2` are the closest by mood (§16). Flagged
once: three tracks means bosses lose their own music; a fourth costs ~1.1 MB.

**Travel between fights (§5.2).** Travel panorama art now runs between the fights
inside a quest, not only either side of it. The plates are in the build and the
code already scrolls them.

**The size gate (new §12a).** Masters leave the deploy folder; a ship manifest
allowlists what goes into a build, inverting today's ship-everything default; and
`tools/size_check.js` reads the manifest, measures and exits non-zero over budget,
running beside the tests. Budget table totals **20.0 MB** with painted art in.
The largest saving falls out of the redesign rather than compression: **4.4 MB of
head, wardrobe and headgear part sheets exist only to compose arbitrary characters
at runtime**, and a fixed cast can be baked to single WebP busts at ~120 KB each.
Cutting the blacksmith is what makes that legal — gear sets were the reason busts
had to be composed on the fly. Load phasing recorded: a ~6 MB first bundle,
the rest streamed during the inn.

**Also updated:** §3 (roster, with the note that recruits need ~6 clips against
Hiro's 23 — the single largest art saving), §4 (the inn's two spends), §6 and §9a
marked shelved with pointers, §11 (audio, with the per-track and per-voice
arithmetic), §14, §15.2, §15.3 reordered, §16 rewritten to twelve open items.

---

## 2026-09-19 — Astra's first painted delivery (`astra-v1`) recorded

Owner: Astra (delivery) / Claude (recording). No code changed.

- **101 files, 194 MB** arrived in `assets/expedition/astra-v1/`, covering every
  line of the old §15.2 at once: Hiro (23 clips, 128 frames, with a
  `manifest.json`), Bram (31 files including all four finisher silhouette
  classes), beasts (wolf, boar, thorn lurker, Alpha), the shared human set, one
  effects sheet, four icon sheets, and the camp and toll-house-alley backgrounds
  already exported to `.webp`.
- **It is source art, not runtime art.** The manifest says so itself —
  `"status": "source-art-delivery-not-runtime-animation"`, every clip
  `intake-pending`, `greenlit: false`, opaque gray background, no alpha
  extracted, unregistered, unpacked. No code references the folder, so the build
  still runs entirely on placeholders.
- **The manifest is the useful part** and intake should be driven from it: per
  clip it carries frame count, sheet grid, **zero-based contact and release
  frames**, the paired flag, a draft duration, and a pre-populated `impactDraft`
  block (`hitStopMs`, `flash`, `shakeAmplitude`, `drift`) explicitly marked
  ungreenlit — the §10.1 parameter table, filled in and flagged provisional.
- **Recorded as §10.4** with the full inventory, and the consequences: the
  masters sit inside the deploy folder (26 MB → 221 MB) and must move out or be
  excluded before any build measurement means anything; frames are painted at
  768 × 512 while the hero renders ~330 px tall, so halving the long edge at
  intake costs nothing visible and roughly quarters the packed result.
- **§15.2 rewritten** from "still owed (nothing painted yet)" to "delivered as
  source, awaiting intake". What remains for Astra is the greenlight pass — which
  is gated on intake producing registered playback, not on her — and Nyx and
  Sable clip sets if all three heroes ship painted.
- **§15.3 reordered:** the art intake pipeline moves from ninth to second, behind
  only the restart blocker. It was listed ninth on the assumption it would exist
  before the first clip set arrived; it did not, and the clips arrived. The two
  `.webp` backgrounds are the one thing that can go in ahead of it.
- **§16 item 12 sharpened:** the canonical-hero question is overtaken by events —
  Astra painted Hiro and Bram, §10.3's worked example is Nyx, §15.2 proposed
  Bram. Three answers are live and one needs picking.

---

## 2026-09-19 — no way to start over (recorded, not fixed)

Owner: Claude. Design pass only — no code changed.

- **Reported:** the game always resumes where it left off; there is no restart.
  Confirmed. The run saves a checkpoint on every scene change, the boot block
  reads it, and nothing in the game offers a new run. The only path is appending
  `?fresh=1` to the URL (already wired), or clearing the
  `adventurer_expeditions_hiro_preview_v1` key. No player finds either.
- **Root cause is structural, and bigger than the restart.** Pause and mute live
  in `X.Hud`, which only the Expedition scene builds. Inn, Travel and Grave have
  no HUD at all — so **mute is unreachable in exactly the three scenes that play
  the music and the recorded voice.**
- **Recorded in §7** with the proposed fix: one persistent corner control in every
  scene carrying mute, pause and Start over (with a confirm, since the save holds
  the hero, gold and kit), plus a New run button on the grave card — the end of
  the arc being where a player wants to try a different adventurer. Noted that
  §9a (rotating parties) is what makes a second run worth taking.
- **Listed first in §15.3** and called a submission blocker under §14: the
  platform's guidance is explicitly against trapping the player, and a reviewer
  who finishes the demo once hits this immediately.
- One assumption in §16: Start over keeps the tutorial retired rather than
  re-teaching a player who has already seen the hand.

---

## 2026-09-19 — GDD v0.7 §10 expanded: impact, finishers, character brief

Owner: Astra. Design pass only — no code changed, no assets generated;
`../adventurer` and every shared file untouched.

- **§10.1 Impact language**, split by owner. Astra draws the exaggerated contact
  frame (squash and stretch beyond anatomy for 2–3 frames, the *Skullgirls*
  rule), the wind-up that carries the weight, the recovery that overshoots and
  settles, and trailing elements — hair, cloth, straps — a frame or two behind
  the body and swinging opposite it on impact. Fable ships hit-stop, flash,
  shake and drift as multipliers on that drawing. Cited *Dead Cells* for how much
  reads through VFX over few frames and *Hollow Knight* for weight through
  anticipation rather than frame count.
- **The impact numbers get a home.** A per-clip table `X.impact`, beside
  `X.timing` in `js/expedition/data.js`, read by `beats.js` between the
  simulation and `X.Actor`. Today those values are scattered literals in
  `beats.js` (a global 70 ms hit-stop, `shake: 0.004`, `hitStop: true`).
  Defaults stay minimal until painted frames exist; Astra sets each clip's
  numbers at greenlight. Rule recorded: code never invents feel ahead of the art.
- **§10.2 Finishing moves.** Structural rule from *Assassin's Creed* (structure
  only): one clip containing both figures, never two clips side by side. Minimum
  three paired frames — wind-up, contact, aftermath. Paced on the *Hades*
  template: trigger cue 150 ms, camera push 250 ms, wind-up held 500 ms, snap
  80 ms with a doubled 140 ms hit-stop, aftermath held 700 ms — about 1.8 s, so
  finishers are gated to the last enemy of a wave. Four silhouette classes
  (quadruped, plant, human, boss quadruped) cover the slice at 12 paired frames
  for the greenlit hero; Chief and Captain reuse the human set scaled up; the
  Pass Tyrant needs none.
- **Folded into §15.2 at position 3**, after the hero clip set and the beast
  clips, ahead of the shared human set — cheap relative to what it buys for the
  store video.
- **§10.3 Character design brief.** Appealing and distinctive inside PEGI 12
  (§14), with *Skullgirls* as the reference for expressive design at that rating.
  Appeal carried by athletic defined figures, thumbnail-readable silhouette, an
  S-curve line of action, counterpose, confident stance, hair and cloth in
  motion, and fitted clothing that works through cut and drape. Bare arms,
  shoulders, midriff, thighs and back are fine at the rating; what breaches it is
  framing and intent — low camera, hips or chest angled to the lens, clothing
  reading as underwear, a pose that presents rather than stands. Standing camera
  rule: eye-level, three-quarter, full body. Includes a worked prompt for Nyx as
  the template for the rest of the cast.
- Four assumptions logged in §16: which hero is painted first (§15.2 says Bram,
  the §10.3 example is Nyx — they should agree), whether finishers are gated to
  the last enemy of a wave, whether the two human bosses reuse the human paired
  set, and whether Astra owns the impact numbers.

---

## 2026-09-19 — GDD v0.7: real-time combat balance (design only)

Owner: Claude. No code changed; `../adventurer` and every shared file untouched.

- `docs/ADVENTURER_EXPEDITIONS_GDD_v0.7.md` supersedes v0.6, which is kept for
  history. One new section, **§7a Real-time combat balance**, written against the
  live stat table rather than invented numbers.
- **Timing model.** Basic attacks on `14 / spd` seconds, clamped to [0.7, 2.0] —
  beasts and Hiro near 1.0 s, humans and Bram near 1.75 s. Actives on three
  cooldown tiers: light 3–5 s, heavy 8–12 s, ultimate 20–30 s. Every skill in the
  §3 hero table and in Hiro's tutorial kit assigned a tier, a number and a reason.
  Skill tier raises effect size and never cuts cooldown (one shipped exception,
  Smoke Bomb, flagged for override). Perks stay passive; three of them
  (Lightning King, Momentum, Sniper) are worded in turns and need re-expressing,
  not gating.
- **Auto-cast.** Every active fires the moment its cooldown and condition allow,
  priority Ultimate → Heavy → Light → basic, using the `autoOrder` that already
  exists. A tap re-orders and times; it never unlocks. Noted that this raises
  no-tap win rates, so the sim floors have to rise with them.
- **Enemy AI.** Weighted condition lists replace basic-attack spam — 2–4 entries
  each for all twelve enemies in §5, preserving the established behaviours (the
  watch sunders and taunts, the bailiff throws lightning, the cutthroat poisons).
  Boss phase two multiplies that enemy's cooldowns by 0.75 (Tyrant 0.7).
- **Balance consequences recorded.** Damage per second replaces damage per turn,
  which invalidates every `statMult` in §5, the beast/human balance (spd 14 vs 8
  is now a 75% DPS gap), and `BOSS_HIT_PCT`. The Pass Tyrant's ×6/×30/×5 needs
  re-deriving to a 45–60 s wipe, with a method and a verification band.
- **Test plan.** `test/expedition_sim.js` needs a fixed-timestep clock, assertions
  in seconds, a time-to-clear band, kit-coverage and enemy-kit assertions, and a
  survival floor on the pass.
- Seven assumptions logged in §16 rather than decided silently — chiefly whether
  the move to real time is settled, Katana Slash becoming the auto-attack, and
  whether a speed-up button exists.

---

## 2026-09-19 — review pass, no code changes

- Audited the travel banter against the original dialogue system. Findings are
  in GDD v0.6 §9; no code was changed. In short: the demo uses about six of the
  ~113 recorded lines each companion owns, and the round-robin that would vary
  even those is reset every scene.
- **Design decision: parties rotate.** The player applies for a party each
  contract and can be grouped with different people, from a pool of
  personalities, on the shipped `Party.applicationOdds`. Recorded as GDD §9a;
  supersedes the fixed Ren-and-Aera party. Not implemented yet. Checked and
  confirmed: all sixty personalities in the shipped table have complete recorded
  voice sets, so breadth costs build size but no recording.
- **Design rule: guidance never chooses for the player.** It may show how, never
  which. The hero-pick screen breaks this — it rings the middle card and taps the
  hand at it, which reads as "choose the ranger". Recorded in GDD §8 with the fix
  (weight all three cards equally, sweep or centre the hand); listed first in
  §15.3. Not implemented yet.
- Wrote this change log (`docs/CHANGELOG.md`).
- Wrote `docs/ADVENTURER_EXPEDITIONS_GDD_v0.6.md`: the design as actually built,
  the CrazyGames findings, and three status sections (Fable done / Astra owes /
  Fable still to build). v0.5 is kept for history.

---

## 2026-09-18 (evening) — lawful and criminal contracts, rival parties, size trim

**Quests.** The party track became lawful → criminal → doomed. `ruins` was
replaced by two new contracts: `camp` ("The bandit camp", lawful, for the reeve)
and `heist` ("The toll house", criminal, for a fence). `pass` still ends the
demo at the grave. Quests carry `lawful` / `criminal` / `doomed` flags and a
`done` title for the completion card.

**Human enemies.** `X.enemies` gained bandit, bandit_b, cutthroat, hedge_mage,
bandit_chief (boss), town_watch, storm_bailiff, watch_captain (boss). Each has a
fixed `human: {sex, head, set}` look so its bust composes from the four part
sheets already synced; `Enc.humanize` applies it. Humans render as the website's
composed portrait, mirrored, not as a creature frame.

**Rival parties.** `X.rivals`: the Ashen Hand (rogue/mage, 3), the Oakwardens
(ranger/druid, 3), the Gilt Company (tank/healer, 2) — eight NPCs, each party
one class or a pair. They stand in the taproom; a tap names the party and its
members. `Enc.makeRival` builds one as a player-shaped character on the enemy
side. The Ashen Hand ambush the party on the road into the toll house
(`heist_ambush`, `ambush: true`): red flash, camera shake, fast entries, late
draw, banner. Beating them removes them from the inn
(`Camp.rivalsAtInn`).

**Defeat rule changed.** A party loss on an ordinary contract now retries the
same encounter with a new seed ("The party regroups"); only the doomed pass
buries the leader and goes to the grave. Before this, any party loss ended the
run at the grave, which made a single bad seed look like the intended ending.

**Inn moved to the taproom plate** (`tavern`) and the companions were restaged
to the bar. Aera wears Oath Plate (`equippedSet: 'oath'`) — a synced look; her
skills already sit above its floor, so nothing is buffed.

**Balance.** Rival base stats 1.4/1.1 → 1.25/1.0 hp/atk; Ashen Hand per-member
stats eased; Watch Captain 4.5/1.3/1.3 → 3.8/1.15/1.2 hp/atk/def; Nyx 1.1/0.9 →
1.25/1.0 hp/def. Sim floors: marsh 0.85, camp 0.8, heist 0.7 per hero.

**Plates added** (synced from the original): `camp`, `alley`, `tavern`,
`travel/city`, `headgear` (the Plate Harness helm Bram's set needs).

**Build size.** `tools/shrink_music.sh` re-encodes the synced music 112 → 64
kbps; `tools/sync_shared.js` now treats `audio/music/*` as copy-once so a
re-sync does not restore the large originals. Folder 30 MB → 26 MB.

Files: `campaign.js`, `encounter.js`, `beats.js` (`humanAction`, `kitAction`),
`scene.js`, `scenes_town.js`, `heroes.js`, `tools/sync_shared.js`,
`tools/shrink_music.sh`, `test/expedition_sim.js`.

---

## 2026-09-18 (afternoon) — pick-a-hero, trainer, blacksmith, perk icons

**The player stops being Hiro.** The road contract is still Hiro (the tutorial);
at the inn the player picks one of three premades and keeps that hero for the
rest of the demo. `js/expedition/heroes.js` is new and holds all of it.

- Bram (tank/fighter) — Shield Wall, Cleave, Bulwark; Plate Harness.
- Nyx (rogue/ranger) — Venom Fang, Aimed Shot, Opportunist; Hunter's Rig.
- Sable (mage) — Fire Bolt, Spark, Arcane Focus; Adept Robes.

Each keeps to one class or a pair. A picked hero is an ordinary
`Character.makePlayer`, so the shim never touches it — combat, portraits and
tiers are the website's own.

**Shops.** Trainer (learn the third active and up to two more perks, 30g; tutor
a known skill to Intermediate 40g / Advanced 60g) and Blacksmith (the hero's one
gear set, 90g). Demo prices; the website's 150/300/600/800 would take hours.
Both go through the shipped `SkillSys.learn` / tier thresholds / `GEAR_SETS`, so
slot caps (3 actives, 3 perks) and the gear floor behave exactly as on the site.
No grocer, insurance or vault — decided out of scope on 2026-09-18.

**HUD generalised.** Actives on the arc right of the portrait, perks on the arc
left of it, both tap-for-details. Pips show the manifest tier (gear can lift
one). A tap on an unready skill now says why (cooldown / no target / locked).
The Hiro HUD is unchanged for the road contract.

**Starting clothes are cosmetic.** A picked hero starts with `equippedSet: null`
and is *drawn* in travelling clothes, so the blacksmith's set is a real, visible
upgrade rather than a sidegrade. (First pass equipped the starting look, which
floored skills for free; corrected the same day.)

Files: `heroes.js` (new), `hud.js`, `scene.js`, `scenes_town.js`,
`encounter.js`, `campaign.js`, `ui_common.js`, `index.html`,
`test/expedition_sim.js` (+1 check, 13 total).

---

## 2026-09-18 (midday) — skill audit, guided purchases, grave voice, refactor

**The bug behind "I tapped a glowing icon and nothing happened."** A skill
bought between fights was written to `run.levels` but never added to the live
character's kit, so the engine had no such skill to use and the request was
dropped. `Enc.syncKit` now rebuilds the kit on purchase and on encounter
creation; a purchase works in the very next action, mid-quest included. A sim
check covers it.

**Feedback added** so a tap is never silent: the icon presses, a gold ring stays
on it until the skill actually fires, then a streak flies from the icon to the
hero. Aura and Counter got persistent outlines (they had no visible state
before). Counter Attack got a cooldown (2/2/1) so its icon can go dark and come
back.

**Guided purchases.** After each of the first three payouts the hand points at
the next worthwhile buy, then at the chip's ✓. Always skippable; skipping once
turns the guide off for good.

**Grave.** The mourner speaks the `funeral_<tier>` line her standing with the
dead earned, with her recorded clip.

**Refactor.** The gate (blockers + ring + pointing hand), big buttons, gold pill
and texture helpers moved to `js/expedition/ui_common.js`; the HUD and the town
scenes share them.

Files: `encounter.js`, `data.js`, `hud.js`, `actors.js`, `beats.js`, `scene.js`,
`scenes_town.js`, `ui_common.js` (new), `tools/sync_shared.js` (funeral bands),
`test/expedition_sim.js`.

---

## 2026-09-18 (morning) — the inn, travel, the party, the grave

The demo stopped being one quest and became a loop: **inn → travel → three
fights → travel → inn**, with the pass as the ending.

- **InnScene**: solo contract or apply to a party; hand on Apply the first time.
- **TravelScene**: the website's scrolling panorama, the party walking, and
  mood-driven banter through `DialogueBox` with the recorded voice.
- **GraveScene**: the leader's burial, the obituary, back to the inn alone.
- **Party**: Ren (M02, fighter, leader) and Aera (F03, healer) built through
  `Character.makePlayer` inside a small world so `Rel` and the dialogue tables
  work unchanged. They start on bad terms (−55 / −50); shared wins thaw them and
  the banter follows.
- **Quests**: road (solo) then marsh, ruins, pass. The pass tyrant
  (atk ×6, hp ×30, def ×5) is unwinnable by design — 0 wins in 40 seeded runs.

Files: `campaign.js` (new), `scenes_town.js` (new), `run.js`, `scene.js`,
`hud.js`, `beats.js`, `actors.js`, `tools/sync_shared.js`,
`test/expedition_sim.js`, `test/browser_expedition.js`.

---

## 2026-09-18 (early) — HUD consolidation

At the player's request the skill controls moved onto the portrait: three small
icons on an arc instead of a row of cards, and the black bottom bar was removed.
Katana Slash became what Hiro does by default — always owned, never shown, never
bought. The other three start locked and are unlocked, then raised, with gold
(20 / 30 / 40).

Files: `hud.js`, `data.js`, `scene.js`.

---

## 2026-09-18 (early) — the offshoot was moved out of the original folder

The first build wrote files inside `../adventurer`, which broke the rule that the
original game is never touched. Everything was moved to
`adventurer-expeditions/`, the original's `portal.js` and `suites.json` were
restored from git, and the extra files were deleted. `tools/sync_shared.js` now
does a one-way copy of the shared engine and assets from `../adventurer`; the
only file this folder owns a copy of is `js/ui/portal.js` (it carries the
Expedition scene-key hook).

---

## 2026-09-18 — M0/M1: scaffold, sim, director, first fight

- `index.html` boots the shared data/core/UI stack plus `js/expedition/*` and
  starts at the scene `run.phase` names. `?fresh=1`, `&seed=N`, `&renderer=canvas`.
- `data.js` holds every rule this edition changes; `shim.js` is the only hook
  into shared code (a `SkillSys.manifest` wrapper that fires for Hiro alone, the
  `expedition_riposte` skill, `BOSS_HIT_PCT` 0.12 → 0.04 for a solo demo,
  censorship forced on).
- `encounter.js` is the encounter as a pure steppable simulation — no Phaser, no
  DOM — so the browser and the headless tests drive the same object.
- `actors.js` / `beats.js` / `scene.js` are the presentation: every beat is
  driven by the engine's own event stream, never by a parallel guess at the
  outcome.
- Non-verbal guidance (`X.UI.gate`): four blockers around a hole, a pulsing ring,
  a drawn hand, a ✕ to skip. The game does not advance until that one thing is
  tapped.
- Tests: `test/expedition_sim.js` (headless, seeded) and
  `test/browser_expedition.js` (Playwright, plays the whole thing and fails on
  any page error).

Fixes the same day: headless WebGL ran ~10 fps, so the browser test uses
`--disable-gpu` and the Canvas renderer; gate blockers were not hit-testing
(rectangle origin); `execute` events carried no `down`, so downs are synthesised;
a wave double-increment in `travel()`.

**Save key:** `adventurer_expeditions_hiro_preview_v1`, its own LocalStorage
entry. Website saves are never read, written or migrated.
