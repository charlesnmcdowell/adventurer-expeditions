# Unused art and cleanup report — 17 October 2026

**No runtime art, source masters, prompts, references, review artwork or Git history has been removed.** The original Adventurer folder, website checkouts, backups and existing `_to_delete` folders are outside cleanup scope. Nothing published or pushed.

[Open the searchable review page](UNUSED_ART_REVIEW_20261017.html). Thumbnails for source art work through `python tools/cleanup_review_server.py` at http://127.0.0.1:8894/docs/UNUSED_ART_REVIEW_20261017.html. Checkboxes prepare an approval message; they do not delete or move anything.

## Findings and limits

- Drive at scan: **63.64 GB free**, 87.5% used. Units below are decimal MB/GB; filesystem allocation and compression can differ.
- SHA-256 default-stream duplicate excess across runtime art, art reviews, builds and reports: **605.73 MB**. This is not an approved deletion total: most copies belong to builds or reviews, and category totals overlap.
- Runtime inventory: **2096 files**, including audio. **168** successfully requested in the recorded browser runs; **1928** not observed. Lack of a request does **not** prove a file is dead.
- Static evidence covers runtime JS/data, story pages, CSS, atlas/voice/campaign manifests and loader calls. Dynamic names, alternate choices, conditional finishers and fallback paths prevent a safe blanket dead-file verdict. Basename matches are labelled and conservative.
- No file is declared definitely dead merely from the old October 9 report. Arcade-only means excluded by the current 14-chapter website packager; it may still be used by the retained Arcade build or tests.
- Source provenance is reported per file. Exact current-clip source matches are stronger evidence than basename matches. Unmatched or draft-named art remains protected pending a human decision; a name such as “draft” is not proof it was rejected.
- Review approval is not inferred from age. The earlier Iaido-cut paintings were approved for reuse as parries; that does not authorize deleting their masters or treating the original draw attack as finished.

## Measured folders

These totals measure ordinary file contents. Remaining NTFS named screenshot streams add 33,376,667 bytes under test/reports, listed separately in named-streams.json. The initial inventory did not capture streams on the seven removed containers.

| Folder | Bytes | Size | Action |
|---|---:|---:|---|
| `assets` | 942,055,122 | 942.06 MB | Keep; review candidates separately |
| `audio` | 14,046,268 | 14.05 MB | Keep; review candidates separately |
| `docs/art` | 565,676,700 | 565.68 MB | Keep; review candidates separately |
| `dist` | 96,033,925 | 96.03 MB | Regenerability / evidence check |
| `test/reports` | 1,305,460,657 | 1,305.46 MB | Regenerability / evidence check |
| `.git` | 1,250,817,280 | 1,250.82 MB | Normal GC only; no rewrite |
| Sibling source art | 3,293,397,814 | 3,293.40 MB | Keep all |

## Runtime classifications

| Classification | Files | Size |
|---|---:|---:|
| referenced | 1719 | 795.01 MB |
| observed | 168 | 70.49 MB |
| packaged-only / unclear | 154 | 13.95 MB |
| arcade-only | 52 | 72.98 MB |
| superseded candidate | 3 | 3.67 MB |

Every file and its reference evidence: [runtime CSV](cleanup-audit-20261017/runtime-assets.csv). Every unobserved file: [never requested CSV](cleanup-audit-20261017/never-requested.csv). Exact package selections: [package selection](cleanup-audit-20261017/package-selection.json). Loader sites: [load calls](cleanup-audit-20261017/load-calls.json).

## Atlas contents

**7 atlases** have unreferenced frames, explicitly retired clips, or level/enrage clips needing review. Occupied-area proportional estimate for unreferenced/retired frames: **3.27 MB**. This is a rough download estimate, not measured savings. WebP encoding and repacking can change the result. No atlas was rebuilt. Level/enrage candidates are excluded from that estimate until their reachability is confirmed.

| Actor | Unreferenced frames | Retired frames | Clips needing review | Estimated bytes |
|---|---:|---:|---|---:|
| alpha | 0 | 6 |  | 520,164 |
| beetle | 0 | 12 | enrage | 664,833 |
| goblin | 0 | 12 | enrage | 490,836 |
| hiro | 0 | 12 | slash-l2, slash-l3, aura-l2, aura-l3, counter-l2, counter-l3 | 532,463 |
| moss_giant | 0 | 0 | enrage | 0 |
| serpent | 0 | 12 | enrage | 598,562 |
| spider | 0 | 12 | enrage | 460,809 |

Frame names and per-page estimates are in [atlas candidates](cleanup-audit-20261017/atlas-candidates.json). Merely belonging to a clip does not establish that the clip is reachable. Direct frame access must also be checked before removal.

## Source art

| Source collection | Size | Action |
|---|---:|---|
| `astra-v1` | 203.08 MB | Keep; provenance inventory supplied |
| `astra-v10` | 503.90 MB | Keep; provenance inventory supplied |
| `astra-v2` | 260.24 MB | Keep; provenance inventory supplied |
| `astra-v3` | 198.39 MB | Keep; provenance inventory supplied |
| `astra-v4` | 198.64 MB | Keep; provenance inventory supplied |
| `astra-v5` | 221.88 MB | Keep; provenance inventory supplied |
| `astra-v6` | 45.11 MB | Keep; provenance inventory supplied |
| `astra-v7` | 168.81 MB | Keep; provenance inventory supplied |
| `astra-v8` | 1,431.60 MB | Keep; provenance inventory supplied |
| `astra-v9` | 33.79 MB | Keep; provenance inventory supplied |
| `bathhouse-preview-20261013` | 9.32 MB | Keep; provenance inventory supplied |
| `retired` | 18.64 MB | Keep; provenance inventory supplied |

[Per-file provenance and hashes](cleanup-audit-20261017/source-art.csv). All prompts, reference records and manifest/receipt files remain protected. Current builders reuse earlier generations; version number is not a deletion criterion.

## Duplicate copies and reviews

| Duplicate set example | Bytes per copy | Copies |
|---|---:|---:|
| `assets/expedition/orc/orc-clean-0.webp` | 4,635,720 | 3 |
| `assets/expedition/story_nettle/story_nettle-1d81ce950731.webp` | 6,728,230 | 2 |
| `assets/expedition/story_umbra_druid/story_umbra_druid-0ac995f8314d.webp` | 6,713,976 | 2 |
| `assets/expedition/story_kobold_shaman/story_kobold_shaman-7f57936197b7.webp` | 6,631,590 | 2 |
| `assets/expedition/story_kobold_chief/story_kobold_chief-faaa56553be0.webp` | 6,503,008 | 2 |
| `assets/expedition/story_consortium_mage/story_consortium_mage-ffb2cacfab47.webp` | 6,493,630 | 2 |
| `assets/expedition/story_thornwise/story_thornwise-47d7917c62a8.webp` | 6,464,926 | 2 |
| `assets/expedition/story_sewer_ogre_mage/story_sewer_ogre_mage-a4af6ae84315.webp` | 6,464,042 | 2 |
| `assets/expedition/story_morrak_cultist/story_morrak_cultist-539961165ecf.webp` | 6,213,402 | 2 |
| `assets/expedition/story_tomb_ghoul/story_tomb_ghoul-810e7629eb90.webp` | 6,129,358 | 2 |
| `assets/expedition/story_palace_doppelganger/story_palace_doppelganger-695734dcf534.webp` | 6,123,332 | 2 |
| `assets/expedition/story_altar_keepers/story_altar_keepers-a299b1f60140.webp` | 6,091,462 | 2 |
| `assets/expedition/story_slave_driver/story_slave_driver-2e63aa002e62.webp` | 6,048,172 | 2 |
| `assets/expedition/story_ravel/story_ravel-04f2610fede3.webp` | 6,016,666 | 2 |
| `assets/expedition/story_wyvern_matriarch/story_wyvern_matriarch-95e7bff2af67.webp` | 6,009,018 | 2 |

[All duplicate paths](cleanup-audit-20261017/duplicates.json). [Review pages and changelog evidence](cleanup-audit-20261017/reviews.json). Review images could later be replaced by references to existing runtime images where byte-identical, preserving page behavior; no such replacement is approved yet.

## Git

Git directory: **1,250.82 MB**; temporary `tmp_obj_*` files: **0.00 MB**. Git manages its own cleanup; no manual object deletion.
Blobs reachable through history/reflogs but absent from the current tree occupy about **167.46 MB** according to `cat-file` disk sizes. That is an upper-bound screening figure for a hypothetical rewrite, not guaranteed recovery: deltas, shared objects, retained refs and compression change it.
There is no reliable read-only forecast of `git gc --aggressive` savings. Normal GC can measure actual repacking savings; aggressive GC was not run. No history rewrite, force-push or reflog expiration was performed.

| Largest stored blob | Disk size | In current tree? |
|---|---:|---|
| `dist/xp_sync.tgz` | 29.22 MB | False |
| `marketing/expeditions-facebook-20260928/Adventurer_Expeditions_Facebook_Reel_70s.mp4` | 25.83 MB | True |
| `marketing/expeditions-facebook-20260928/Adventurer_Expeditions_Facebook_Reel_70s.mp4` | 25.81 MB | False |
| `marketing/expeditions-facebook-20260928/Adventurer_Expeditions_Facebook_Reel_70s.mp4` | 25.50 MB | False |
| `marketing/crazygames-store-20260928/Adventurer_Expeditions_Preview_1920x1080.mp4` | 14.01 MB | False |
| `marketing/crazygames-store-20260928/Adventurer_Expeditions_Preview_1920x1080.mp4` | 13.50 MB | True |
| `marketing/crazygames-store-20260928/Adventurer_Expeditions_Preview_1080x1920.mp4` | 8.81 MB | False |
| `assets/expedition/moss_giant/moss_giant-v7-5c280fb1db04-0.webp` | 8.25 MB | True |
| `marketing/crazygames-store-20260928/Adventurer_Expeditions_Preview_1080x1920.mp4` | 8.13 MB | True |
| `assets/expedition/enchantress/enchantress-v7-33e57c91b0cc-0.webp` | 7.98 MB | True |
| `assets/expedition/elven_wizard/elven_wizard-v7-267b85624f29-0.webp` | 7.56 MB | True |
| `assets/expedition/hydra/hydra-v7-3142de7d4eaa-0.webp` | 7.33 MB | True |
| `assets/expedition/story_nettle/story_nettle-1d81ce950731.webp` | 6.73 MB | True |
| `assets/expedition/story_umbra_druid/story_umbra_druid-0ac995f8314d.webp` | 6.72 MB | True |
| `docs/art/combat-pilot-20261002/smoother-combat.webm` | 6.66 MB | True |
| `assets/expedition/story_kobold_shaman/story_kobold_shaman-7f57936197b7.webp` | 6.63 MB | True |
| `assets/expedition/crab/crab-v7-ac3935b5f183-0.webp` | 6.55 MB | True |
| `assets/expedition/story_kobold_chief/story_kobold_chief-faaa56553be0.webp` | 6.50 MB | True |
| `assets/expedition/story_consortium_mage/story_consortium_mage-ffb2cacfab47.webp` | 6.49 MB | True |
| `assets/expedition/story_thornwise/story_thornwise-47d7917c62a8.webp` | 6.47 MB | True |

## Potential later savings — approval required

| Category | Candidate size / estimate | Important limit |
|---|---:|---|
| Byte-identical review images with a runtime keeper | 521.05 MB | Requires repairing gallery references first; not approved |
| Arcade-only files excluded from story website package | 72.98 MB | Still needed by some retained builds/tests; not approved |
| Superseded runtime candidates | 3.67 MB | Per-file approval and dependency check |
| Unreferenced/retired atlas frames | ~3.27 MB | Rough estimate; do not add to whole-file categories |
| Source drafts | Unknown | No safe rejected-draft total established; preserve all |
| Aggressive Git repack | Unknown | Not run; no reliable read-only forecast |

[Exact review-duplicate list with SHA-256 keepers](cleanup-audit-20261017/review-duplicate-candidates.json). These categories overlap and must not be added together. Quarantine alone frees zero drive space.

[All blobs and object IDs](cleanup-audit-20261017/git-blobs.json).

## Phase 2 — safe cleanup

Removed stale ignored website build and Python caches. Seven old zero-default-byte screenshot containers were also removed; their possible named-stream contents were not captured, so duplicate proof and additional deleted bytes are unknown. See the incident record. All runtime/source/review art remains unchanged. Fresh full-game verification is deferred while the other session edits.

Actual removed files: **1219**; logical bytes removed: **479,295,731**. Normal-GC directory reduction: **17,328,371 bytes**. Build/test regeneration is listed separately, so gross deletion is not presented as net free space.

[Exact cleanup ledger](cleanup-audit-20261017/cleanup-results.json).

**Cleanup exception — Windows screenshot streams:** Seven older ignored test screenshot containers were removed as zero-byte default-stream duplicates before NTFS named streams were checked. Other retained files in that naming pattern contain PNG streams. The deleted stream contents and bytes cannot be recovered from the original inventory; these seven deletions are NOT certified as true byte-identical duplicates. New QA screenshots exist, but are not exact historical replacements. No runtime or source art was removed.

Planner and remover now reject every file with a named stream. Remaining named streams inventoried separately. No further test file removal.

The byte counts above cover default streams only. Unknown bytes from those seven removed containers are not included. The remaining named streams are listed in [named-stream inventory](cleanup-audit-20261017/named-streams.json).

**Preservation verified:** all 11,222 source files and 2,751 runtime/audio/review files match the pre-cleanup SHA-256 inventory. [Hash verification](cleanup-audit-20261017/preservation-check.json).

Test/report output changed by 56.47 MB during verification. The removal totals above are gross logical bytes, not a claim about net C: free space while another session is working. The first scan is preserved in `before-inventory.json`.

Planned safe-output categories (inventory before removal):

- stale website package: 479.16 MB
- older identical test output: 0.00 MB
- Python bytecode cache: 0.13 MB

[Exact removal plan](cleanup-audit-20261017/safe-cleanup-plan.json). Historical release candidates and nonduplicate test evidence are retained.

## Verification

| Gate | Result |
|---|---|
| npm test | PASS before cleanup; concurrent story edits mean this is not a final release certification |
| npm run test:story + request logging | PASS: story/data checks and actual chapter-one guided battle, audio, reload and mobile flow |
| npm run test:ship -- --seed=1 + request logging | PASS: two clears and return to inn on packaged ship list |
| Full 14-chapter site build/verify | DEFERRED by user: other session is still editing; no stale package is presented as verified |
| Additional all-chapter / companion browser suites after cleanup | DEFERRED until concurrent story/party edits settle |
| Audit review page | PASS: runtime/source previews, filtering, sorting and approval-message controls |
| Safe cleanup | EXCEPTION: 7 older screenshot containers removed before named-stream detection. Build/cache checks passed. See cleanup-results.json incident; all further named-stream files are now excluded. |
| git gc | PASS: normal GC only; no forced expiration/history rewrite |
| Named-stream detection regression | PASS: retained screenshot streams are detected; ordinary report file has no named streams |

Browser request records are in [network requests](cleanup-audit-20261017/network-requests.json). A fresh full-game package verification is deferred while the other session edits the story, as requested. When run, that gate opens 55 encounters and checks the password boundary, a companion fight and the ending card; it is not exhaustive playback of every dialogue choice, optional ability or death animation.

## Approval required before any Phase 3 work

- [ ] Review superseded runtime candidates individually; quarantine approved files only.
- [ ] Review Arcade-only sets; keep their engine/test dependencies intact.
- [ ] Repack specifically approved atlases without retired/unreferenced frames.
- [ ] Replace approved completed review copies with smaller previews or runtime references.
- [ ] Review unresolved source drafts individually. Never remove a master used by current art, a prompt, or a reference record.

No quarantine has been created. If approved later, the proposed destination is the sibling `_cleanup_quarantine_20261017` folder, preserving relative paths. Moving files on C: into quarantine recovers **zero drive space** until you empty it yourself. The existing `_to_delete` folders remain untouched.
