"""Render measured audit findings. No cleanup is performed by this tool."""
import json,collections,re,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/cleanup-audit-20261017'
load=lambda n:json.loads((OUT/n).read_text(encoding='utf-8'))
mb=lambda n:f'{n/1e6:,.2f} MB'
s=load('summary.json');assets=load('runtime-assets.json');sources=load('source-art.json');dups=load('duplicates.json');atlases=load('atlas-candidates.json');reviews=load('reviews.json');blobs=load('git-blobs.json')
counts=collections.Counter();sizes=collections.Counter()
for r in assets:counts[r['status']]+=1;sizes[r['status']]+=r['bytes']
result=load('cleanup-results.json') if (OUT/'cleanup-results.json').exists() else None
gates=load('gates.json') if (OUT/'gates.json').exists() else []
reviewCopies=[]
for d in dups:
 keep=next((p for p in d['paths'] if p.startswith('assets/')),None)
 if keep:
  for p in d['paths']:
   if p.startswith('docs/art/'):reviewCopies.append(dict(path=p,bytes=d['bytes'],keeper=keep,sha256=d['sha256'],proposal='replace gallery copy only after approval and link checks'))
(OUT/'review-duplicate-candidates.json').write_text(json.dumps(reviewCopies,separators=(',',':')),encoding='utf-8')
folderRows=[dict(path=k,bytes=v,status='current measured folder',proposal='keep / see category report') for k,v in s['totals'].items()]
folderRows += [dict(path='../adventurer-expeditions-source-art/'+k,bytes=v,status='protected source collection',proposal='keep') for k,v in s['sourceTotals'].items()]
(OUT/'folder-totals.json').write_text(json.dumps(folderRows),encoding='utf-8')
lines=['# Unused art and cleanup report — 17 October 2026','',
'**No runtime art, source masters, prompts, references, review artwork or Git history has been removed.** The original Adventurer folder, website checkouts, backups and existing `_to_delete` folders are outside cleanup scope. Nothing published or pushed.','',
'[Open the searchable review page](UNUSED_ART_REVIEW_20261017.html). Thumbnails for source art work through `python tools/cleanup_review_server.py` at http://127.0.0.1:8894/docs/UNUSED_ART_REVIEW_20261017.html. Checkboxes prepare an approval message; they do not delete or move anything.','',
'## Findings and limits','',
f'- Drive at scan: **{s["drive"]["free"]/1e9:.2f} GB free**, {100*s["drive"]["used"]/s["drive"]["total"]:.1f}% used. Units below are decimal MB/GB; filesystem allocation and compression can differ.',
f'- SHA-256 default-stream duplicate excess across runtime art, art reviews, builds and reports: **{mb(s["duplicateBytes"])}**. This is not an approved deletion total: most copies belong to builds or reviews, and category totals overlap.',
f'- Runtime inventory: **{s["runtimeFiles"]} files**, including audio. **{s["observedFiles"]}** successfully requested in the recorded browser runs; **{s["neverRequestedFiles"]}** not observed. Lack of a request does **not** prove a file is dead.',
'- Static evidence covers runtime JS/data, story pages, CSS, atlas/voice/campaign manifests and loader calls. Dynamic names, alternate choices, conditional finishers and fallback paths prevent a safe blanket dead-file verdict. Basename matches are labelled and conservative.',
'- No file is declared definitely dead merely from the old October 9 report. Arcade-only means excluded by the current 14-chapter website packager; it may still be used by the retained Arcade build or tests.',
'- Source provenance is reported per file. Exact current-clip source matches are stronger evidence than basename matches. Unmatched or draft-named art remains protected pending a human decision; a name such as “draft” is not proof it was rejected.',
'- Review approval is not inferred from age. The earlier Iaido-cut paintings were approved for reuse as parries; that does not authorize deleting their masters or treating the original draw attack as finished.','',
'## Measured folders','', 'These totals measure ordinary file contents. Remaining NTFS named screenshot streams add 33,376,667 bytes under test/reports, listed separately in named-streams.json. The initial inventory did not capture streams on the seven removed containers.', '', '| Folder | Bytes | Size | Action |','|---|---:|---:|---|']
for k,v in s['totals'].items():lines.append(f'| `{k}` | {v:,} | {mb(v)} | '+('Keep; review candidates separately' if k in ['assets','audio','docs/art'] else 'Regenerability / evidence check')+' |')
lines += [f'| `.git` | {s["gitBytes"]:,} | {mb(s["gitBytes"])} | Normal GC only; no rewrite |',f'| Sibling source art | {sum(s["sourceTotals"].values()):,} | {mb(sum(s["sourceTotals"].values()))} | Keep all |','', '## Runtime classifications','', '| Classification | Files | Size |','|---|---:|---:|']
for k,n in counts.items():lines.append(f'| {k} | {n} | {mb(sizes[k])} |')
lines += ['', 'Every file and its reference evidence: [runtime CSV](cleanup-audit-20261017/runtime-assets.csv). Every unobserved file: [never requested CSV](cleanup-audit-20261017/never-requested.csv). Exact package selections: [package selection](cleanup-audit-20261017/package-selection.json). Loader sites: [load calls](cleanup-audit-20261017/load-calls.json).','',
'## Atlas contents','',f'**{len(atlases)} atlases** have unreferenced frames, explicitly retired clips, or level/enrage clips needing review. Occupied-area proportional estimate for unreferenced/retired frames: **{mb(s["atlasEstimate"])}**. This is a rough download estimate, not measured savings. WebP encoding and repacking can change the result. No atlas was rebuilt. Level/enrage candidates are excluded from that estimate until their reachability is confirmed.','',
'| Actor | Unreferenced frames | Retired frames | Clips needing review | Estimated bytes |','|---|---:|---:|---|---:|']
for a in atlases:lines.append(f'| {a["actor"]} | {len(a["unreferencedFrames"])} | {len(a["retiredFrames"])} | {", ".join(a["reviewClips"])} | {sum(p["estimatedBytes"] for p in a["pages"]):,} |')
lines += ['', 'Frame names and per-page estimates are in [atlas candidates](cleanup-audit-20261017/atlas-candidates.json). Merely belonging to a clip does not establish that the clip is reachable. Direct frame access must also be checked before removal.','',
'## Source art','', '| Source collection | Size | Action |','|---|---:|---|']
for k,v in s['sourceTotals'].items():lines.append(f'| `{k}` | {mb(v)} | Keep; provenance inventory supplied |')
lines += ['', '[Per-file provenance and hashes](cleanup-audit-20261017/source-art.csv). All prompts, reference records and manifest/receipt files remain protected. Current builders reuse earlier generations; version number is not a deletion criterion.','',
'## Duplicate copies and reviews','', '| Duplicate set example | Bytes per copy | Copies |','|---|---:|---:|']
for d in dups[:15]:lines.append(f'| `{d["paths"][0]}` | {d["bytes"]:,} | {len(d["paths"])} |')
lines += ['', '[All duplicate paths](cleanup-audit-20261017/duplicates.json). [Review pages and changelog evidence](cleanup-audit-20261017/reviews.json). Review images could later be replaced by references to existing runtime images where byte-identical, preserving page behavior; no such replacement is approved yet.','',
'## Git','',f'Git directory: **{mb(s["gitBytes"])}**; temporary `tmp_obj_*` files: **{mb(s["gitTemporaryBytes"])}**. Git manages its own cleanup; no manual object deletion.',
f'Blobs reachable through history/reflogs but absent from the current tree occupy about **{mb(s["historicalBlobDiskBytes"])}** according to `cat-file` disk sizes. That is an upper-bound screening figure for a hypothetical rewrite, not guaranteed recovery: deltas, shared objects, retained refs and compression change it.',
'There is no reliable read-only forecast of `git gc --aggressive` savings. Normal GC can measure actual repacking savings; aggressive GC was not run. No history rewrite, force-push or reflog expiration was performed.','',
'| Largest stored blob | Disk size | In current tree? |','|---|---:|---|']
for b in blobs[:20]:lines.append(f'| `{b["path"]}` | {mb(b["diskBytes"])} | {b["current"]} |')
lines += ['', '## Potential later savings — approval required', '', '| Category | Candidate size / estimate | Important limit |','|---|---:|---|',
f'| Byte-identical review images with a runtime keeper | {mb(sum(r["bytes"] for r in reviewCopies))} | Requires repairing gallery references first; not approved |',
f'| Arcade-only files excluded from story website package | {mb(sizes["arcade-only"])} | Still needed by some retained builds/tests; not approved |',
f'| Superseded runtime candidates | {mb(sizes["superseded candidate"])} | Per-file approval and dependency check |',
f'| Unreferenced/retired atlas frames | ~{mb(s["atlasEstimate"])} | Rough estimate; do not add to whole-file categories |',
'| Source drafts | Unknown | No safe rejected-draft total established; preserve all |',
'| Aggressive Git repack | Unknown | Not run; no reliable read-only forecast |',
'', '[Exact review-duplicate list with SHA-256 keepers](cleanup-audit-20261017/review-duplicate-candidates.json). These categories overlap and must not be added together. Quarantine alone frees zero drive space.']
lines += ['', '[All blobs and object IDs](cleanup-audit-20261017/git-blobs.json).','', '## Phase 2 — safe cleanup','']
if result:
 lines += [result.get('note',''),'',f'Actual removed files: **{len(result.get("removed",[]))}**; logical bytes removed: **{result.get("removedBytes",0):,}**. Normal-GC directory reduction: **{int(result.get("gcRecoveredBytes",0)):,} bytes**. Build/test regeneration is listed separately, so gross deletion is not presented as net free space.','', '[Exact cleanup ledger](cleanup-audit-20261017/cleanup-results.json).']
 if result.get('incident'):
  lines += ['', '**Cleanup exception — Windows screenshot streams:** '+result['incident']['description'], '', result['incident']['fix'], '', 'The byte counts above cover default streams only. Unknown bytes from those seven removed containers are not included. The remaining named streams are listed in [named-stream inventory](cleanup-audit-20261017/named-streams.json).']
else:lines += ['Not started. The report is delivered first. Only verified regenerable output will be cleaned; no runtime or source-art candidate will be moved.']
if (OUT/'preservation-check.json').exists():
 proof=load('preservation-check.json');lines += ['',f'**Preservation verified:** all {proof["sourceFilesUnchanged"]:,} source files and {proof["runtimeAudioReviewFilesUnchanged"]:,} runtime/audio/review files match the pre-cleanup SHA-256 inventory. [Hash verification](cleanup-audit-20261017/preservation-check.json).']
if s.get('initialTotals'):
 delta=s['totals']['test/reports']-s['initialTotals']['test/reports'];lines += ['',f'Test/report output changed by {mb(delta)} during verification. The removal totals above are gross logical bytes, not a claim about net C: free space while another session is working. The first scan is preserved in `before-inventory.json`.']

if (OUT/'safe-cleanup-plan.json').exists():
 plan=load('safe-cleanup-plan.json');lines += ['', 'Planned safe-output categories (inventory before removal):', '']
 for category,n in plan['bytesByCategory'].items():lines.append('- '+category+': '+mb(n))
 lines += ['', '[Exact removal plan](cleanup-audit-20261017/safe-cleanup-plan.json). Historical release candidates and nonduplicate test evidence are retained.']
lines += ['', '## Verification','', '| Gate | Result |','|---|---|']
for g in gates:lines.append(f'| {g["name"]} | {g["status"]} |')
if not gates:lines.append('| Browser and package gates | Running; preliminary report |')
lines += ['', 'Browser request records are in [network requests](cleanup-audit-20261017/network-requests.json). A fresh full-game package verification is deferred while the other session edits the story, as requested. When run, that gate opens 55 encounters and checks the password boundary, a companion fight and the ending card; it is not exhaustive playback of every dialogue choice, optional ability or death animation.','',
'## Approval required before any Phase 3 work','',
'- [ ] Review superseded runtime candidates individually; quarantine approved files only.','- [ ] Review Arcade-only sets; keep their engine/test dependencies intact.','- [ ] Repack specifically approved atlases without retired/unreferenced frames.','- [ ] Replace approved completed review copies with smaller previews or runtime references.','- [ ] Review unresolved source drafts individually. Never remove a master used by current art, a prompt, or a reference record.','',
'No quarantine has been created. If approved later, the proposed destination is the sibling `_cleanup_quarantine_20261017` folder, preserving relative paths. Moving files on C: into quarantine recovers **zero drive space** until you empty it yourself. The existing `_to_delete` folders remain untouched.','']
(ROOT/'docs/UNUSED_ART_AND_CLEANUP_REPORT_20261017.md').write_text('\n'.join(lines),encoding='utf-8')
print('Rendered report')
