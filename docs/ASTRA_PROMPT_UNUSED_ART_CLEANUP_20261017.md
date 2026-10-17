Report every piece of unused art in Adventurer: Expeditions and clean up the filesystem to free disk space, report first and nothing irreversible (17 October 2026).

WHY
Hiro's C: drive is 89% full (about 55 GB free of 475 GB). Measured today:
| Location | Size | Notes |
|---|---:|---|
| `adventurer-expeditions/` (total) | 4.6 GB | |
| `.git` | 1.2 GB | history includes art iterations |
| `test/reports/` | 1.2 GB | screenshots and evidence from test runs |
| `assets/` | 904 MB | the game's runtime art; `story/` 213 MB, `adult/` 142 MB |
| `dist/` | 554 MB | built website packages (regenerable) |
| `docs/` | 546 MB | 542 MB of it is `docs/art/` review pages |
| `adventurer-expeditions-source-art/` | 3.1 GB | prompts, masters and rejected drafts: astra-v1…v10, `astra-v8` alone 1.4 GB |
| `The Sorcerer Sword ARPG/_to_delete/` | 1.2 GB | already set aside earlier |
| `adventurer/` (the original game) | 5.5 GB | **read-only: never touch** |

RULES (binding)
- **The original game folder `C:\Users\charl\The Sorcerer Sword ARPG\adventurer` and the synced shared files (js/core, js/data, js/ui) are never changed, moved or deleted.**
- **Report first.** Phase 1 changes nothing. Phase 2 removes only what's regenerable or a duplicate. Phase 3 needs Hiro's written approval, item by item or by category.
- **Nothing is permanently deleted by you.** Anything that isn't plainly regenerable goes into a dated quarantine folder outside the repo, for example `C:\Users\charl\The Sorcerer Sword ARPG\_cleanup_quarantine_20261017\`, keeping its original relative path. Hiro empties it himself after checking.
- Never touch:
  - `adventurer-expeditions-source-art/` masters that a shipped asset was made from;
  - any prompt or reference record;
  - `OneDrive\Documents\Neverendingnarratives-backup-20261015\` (Hiro's Pit and Spire backup);
  - the website checkouts, `OneDrive\Documents\Neverendingnarratives\` and its `_audiobook2_release_upload\` (including `_to_delete\` there);
  - anything in another project.
- No git history rewriting (no filter-repo, BFG or force-push) without Hiro's explicit go-ahead. Running `git gc` is fine.
- The game must still build, test and package exactly as before.

PHASE 1: UNUSED ART REPORT (changes nothing)
1. **Runtime assets under `assets/`.** For every file, decide whether the game can load it. Trace references from:
   - the story pages and `index.html`;
   - `tools/ship_manifest.json` and the site package (`tools/site_demo.js` with EXPEDITIONS_SITE_THROUGH=14);
   - atlas JSON (including frames inside atlases that no clip uses);
   - story_art.js and story_companions.js bindings;
   - campaign.json, preview-media.json, voice and companion manifests;
   - CSS (fonts and images);
   - every `load.*` call.
   Also confirm by playing: run the full-game site verify and the story browser tests with request logging, and list every file never requested.
   - Mark each unused file **dead**, **arcade-only** (Arcade is retired, but its engine still runs story fights, so check before calling anything dead), **superseded** (an older version replaced by a newer one, such as the old voice lines replaced in the companion rewrite), or **unclear**.
   - Include unused frames inside used atlases: retired finishers, Hiro level 2/3 clips, enrage poses on regular monsters (see docs/ART_REVIEW_20261009.md). Report how many bytes rebuilding the atlas without them would save. Don't rebuild yet.
2. **Duplicates.** The same bytes stored twice (by sha256) anywhere in `assets/`, `docs/art/`, `dist/` and `test/reports/`.
3. **Source art** (`adventurer-expeditions-source-art/`): for each astra-vN folder, which masters fed something that ships today; which are rejected drafts; which are superseded iterations of something later redone. List sizes. Change nothing.
4. **Review pages** (`docs/art/`, `docs/*_REVIEW*`): which reviews are finished and approved, and which still await Hiro (for example `docs/art/iaido-cuts-20261016/` awaits his pick). A finished review's heavy images could be replaced by small thumbnails, or moved to source art.
5. **Regenerable output:** `test/reports/`, `dist/`, caches and temp folders. Group by test or run and by date. Note which reports the CHANGELOG cites as evidence.
6. **Git:** what's taking the 1.2 GB (largest blobs and paths over history). Estimate what `git gc --aggressive` would save. Separately, estimate what a history rewrite would save, as information only.

Deliver the report as `docs/UNUSED_ART_AND_CLEANUP_REPORT_20261017.md` plus a review page, `docs/UNUSED_ART_REVIEW_20261017.html`:
- totals per category and per folder, sortable, with thumbnails for art;
- a column saying what you propose (keep / remove regenerable / quarantine / rebuild atlas / needs Hiro);
- expected space recovered per category;
- a checklist at the top, so Hiro can approve categories in one go.

PHASE 2: SAFE CLEANUP (no approval needed: only things that can be rebuilt exactly)
- `test/reports/`: keep the newest run of each test, plus any report the CHANGELOG cites as evidence for a release or a current decision. Remove older duplicates of the same test. Remove only report files that git ignores; if any are tracked, list them instead.
- `dist/`: keep `dist/site-demo` and its receipt only if they match the live site's commit. Otherwise remove them; `node tools/site_demo.js build` recreates them.
- Remove stray build caches and temp files the tools recreate.
- Run `git gc` (not `--aggressive` without saying so first).
- Record exactly what was removed and the bytes recovered.

PHASE 3: AFTER HIRO APPROVES (quarantine, never delete)
For the categories Hiro ticks:
- **dead and superseded runtime files:** move them to the quarantine and drop them from manifests and the ship list;
- **unused atlas frames:** rebuild those atlases without the unused frames using the existing intake tools, keeping every used frame pixel-identical and every clip's timing the same;
- **finished review pages:** thin them out;
- **rejected source drafts:** quarantine them.
Each change has to leave `npm test`, `npm run test:story`, `npm run test:ship`, the story and companion browser tests, and the full-game site verify passing.

DONE MEANS
- Phase 1: the report and review page delivered, Phase 2 done and logged, and nothing in Phase 3 touched until Hiro approves.
- A dated CHANGELOG entry: bytes recovered by category, where the quarantine is, what still awaits Hiro, and that the original game and the backups were untouched.
- Every gate above passes after the cleanup.
- Commit only your own files after checking git status. Nothing is published or pushed.
