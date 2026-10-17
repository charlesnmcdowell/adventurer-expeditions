"""Plan only: stale ignored package, old same-folder byte duplicates, pycache.
No runtime art, review images, source art, tracked output, Git internals or
historical CrazyGames release packages qualify here.
"""
import json,hashlib,subprocess,collections
from pathlib import Path
from windows_streams import named_streams
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/cleanup-audit-20261017'
read=lambda n:json.loads((OUT/n).read_text(encoding='utf-8'))
files=read('before-inventory.json');comparison=read('old-package-comparison.json')
changelog=(ROOT/'docs/CHANGELOG.md').read_text(encoding='utf-8');planned=[]
if not comparison['matchesLiveCommit']:
 for r in files:
  if not r['tracked'] and (r['path'].startswith('dist/site-demo/') or r['path']=='dist/site-demo-verified.json'):
   planned.append({**{k:r[k] for k in ['path','bytes','sha256']},'category':'stale website package'})
grouped=collections.defaultdict(list)
for r in files:
 if r['path'].startswith('test/reports/') and not r['tracked']:
  grouped[(str(Path(r['path']).parent),r['sha256'])].append(r)
for (parent,sha),rows in grouped.items():
 if len(rows)<2:continue
 # Preserve any group cited by the changelog, plus exact paths.
 top='/'.join(rows[0]['path'].split('/')[:3])
 if top in changelog or parent.replace('\\','/') in changelog:continue
 rows.sort(key=lambda r:(r['mtime'],r['path']),reverse=True);keep=rows[0]
 for r in rows[1:]:
  if r['path'] in changelog:continue
  # Only older duplicate outputs of the SAME test folder. Same-age captures
  # may be distinct evidence even when the pixels happen to match.
  if r['mtime']>=keep['mtime'] or keep['mtime']-r['mtime']<86400:continue
  planned.append({**{k:r[k] for k in ['path','bytes','sha256']},'category':'older identical test output','keeper':keep['path']})
for p in (ROOT/'tools').rglob('__pycache__/*.pyc'):
 if p.is_symlink():continue
 planned.append(dict(path=p.relative_to(ROOT).as_posix(),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),category='Python bytecode cache'))
tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0'))
paths=[r['path'] for r in planned]
checked=subprocess.run(['git','check-ignore','--stdin'],cwd=ROOT,input=('\n'.join(paths)+'\n').encode(),capture_output=True)
ignored=set(checked.stdout.decode().splitlines());planned=[r for r in planned if r['path'] in ignored and r['path'] not in tracked and (ROOT/r['path']).is_file() and not named_streams(ROOT/r['path'])]
summary=collections.Counter()
for r in planned:summary[r['category']]+=r['bytes']
result={'baselineCommit':read('summary.json')['commit'],'bytesByCategory':dict(summary),'files':planned,'note':'Regenerable ignored output only; validates hashes again before removal. All runtime/source/review art and old release candidates retained.'}
(OUT/'safe-cleanup-plan.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'files':len(planned),'bytesByCategory':dict(summary)},indent=2))
