"""Conservative read-only asset/disk audit; writes reports, never deletes assets.
Static mentions and observed requests are evidence, not exhaustive reachability.
"""
import collections,csv,datetime,hashlib,json,os,re,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'adventurer-expeditions-source-art'
DATE='20261017'
OUT=ROOT/'docs'/('cleanup-audit-'+DATE)
OUT.mkdir(exist_ok=True)
def run(args,input=None):
 return subprocess.run(args,cwd=ROOT,input=input,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
def text(p):
 try:return p.read_text(encoding='utf-8-sig',errors='replace')
 except OSError:return ''
def walk(root):
 if not root.exists():return
 for base,dirs,files in os.walk(root,followlinks=False):
  dirs[:]=[d for d in dirs if not (Path(base)/d).is_symlink() and not (hasattr(Path(base)/d,'is_junction') and (Path(base)/d).is_junction())]
  for name in files:
   p=Path(base)/name
   if not p.is_symlink():yield p
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def mb(n):return f'{n/1e6:,.2f} MB'
def save(name,data):(OUT/name).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
def csvout(name,rows):
 if not rows:return
 with (OUT/name).open('w',encoding='utf-8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)

print('Inventory and hashes...',flush=True)
plan=json.loads(run(['node','tools/cleanup_package_inventory.cjs']))
save('package-selection.json',plan)
pack=set(plan['files']);ship=set(plan['ship'])
tracked=set(run(['git','ls-files','-z']).decode().split('\0'))
changelog=text(ROOT/'docs/CHANGELOG.md')
inventory=[];totals=collections.Counter()
for group in ['assets','audio','docs/art','dist','test/reports']:
 for p in walk(ROOT/group):
  st=p.stat();rel=p.relative_to(ROOT).as_posix()
  inventory.append(dict(path=rel,bytes=st.st_size,mtime=st.st_mtime,sha256=digest(p),group=group,tracked=rel in tracked))
  totals[group]+=st.st_size
by_path={r['path']:r for r in inventory}
save('disk-inventory.json',inventory)
if not (OUT/'before-inventory.json').exists():save('before-inventory.json',inventory)
dups=collections.defaultdict(list)
for r in inventory:
 if r['group']!='audio':dups[r['sha256']].append(r)
duplicates=[dict(sha256=h,bytes=v[0]['bytes'],redundantBytes=v[0]['bytes']*(len(v)-1),paths=[r['path'] for r in v]) for h,v in dups.items() if len(v)>1]
duplicates.sort(key=lambda r:r['redundantBytes'],reverse=True);save('duplicates.json',duplicates)

# All runtime scripts, CSS, HTML and JSON, including data/voice manifests.
# References are intentionally a superset: an unused function may still mention art.
runtime=[]
for folder in ['js','assets','audio']:
 for p in walk(ROOT/folder):
  if p.suffix.lower() in {'.json','.js','.css','.html','.webmanifest'}:runtime.append(p)
runtime += [ROOT/'index.html',ROOT/'manifest.webmanifest',ROOT/'docs/STORY_CAMPAIGN_PREVIEW.html',ROOT/'docs/STORY_FIGHT_PREVIEW.html',ROOT/'docs/story_preview.js',ROOT/'docs/story_companions.css']
for p in ROOT.glob('*.css'):runtime.append(p)
assetpaths={r['path'] for r in inventory if r['group'] in ['assets','audio']}
byname=collections.defaultdict(list)
for rel in assetpaths:byname[Path(rel).name].append(rel)
refs=collections.defaultdict(set);load_calls=[]
for p in runtime:
 if not p.exists():continue
 rel=p.relative_to(ROOT).as_posix();s=text(p).replace('\\\\','/')
 for n,line in enumerate(s.splitlines(),1):
  if re.search(r'\bload\.(?:image|audio|json|atlas|multiatlas|spritesheet|video|html|bitmapFont)\s*\(',line):load_calls.append(dict(file=rel,line=n,text=line[:500]))
 for token in re.findall(r"[A-Za-z0-9_./\\:-]+\.(?:webp|png|jpe?g|gif|svg|json|mp3|ogg|wav|woff2?|ttf|mp4|webm)",s):
  token=token.replace('\\','/');candidates=[token]
  try:candidates.append((p.parent/token).resolve().relative_to(ROOT).as_posix())
  except (ValueError,OSError):pass
  for c in candidates:
   if c in assetpaths and c!=rel:refs[c].add(rel)
  # A basename reference is evidence but not proof of a live path.
  for c in byname.get(Path(token).name,[]):
   if c!=rel:refs[c].add(rel+' (basename match)')
save('load-calls.json',load_calls)
observed=set();network=[]
for p in (ROOT/'test/reports/cleanup-audit').glob('*requests.jsonl'):
 for line in text(p).splitlines():
  try:r=json.loads(line)
  except ValueError:continue
  network.append(r)
  if isinstance(r['status'],int) and 200<=r['status']<400:observed.add(r['path'])
save('network-requests.json',network)
assets=[]
for rel in sorted(assetpaths):
 r=by_path[rel];actor=re.search(r'^assets/expedition/(?:adult/)?([^/]+)',rel);actor=actor[1].removesuffix('-fatal') if actor else ''
 evidence=sorted(refs[rel]);seen=rel in observed
 if seen:state='observed';proposal='keep'
 elif actor in plan['arcadeOnly'] and rel not in pack:state='arcade-only';proposal='needs Hiro'
 elif evidence:state='referenced';proposal='keep'
 elif rel not in pack and rel not in ship:state='unclear';proposal='needs Hiro'
 else:state='packaged-only / unclear';proposal='needs Hiro'
 # An older atlas page in the same actor folder can be identified precisely,
 # but keep candidate wording: dynamic code or alternate builds still matter.
 if not evidence and not seen and re.search(r'/(?:hiro\.webp|orc-0\.webp|plant-0\.webp)$',rel):state='superseded candidate';proposal='quarantine after approval'
 assets.append(dict(path=rel,bytes=r['bytes'],status=state,proposal=proposal,observed=seen,packaged=rel in pack,ship=rel in ship,references=evidence,sha256=r['sha256']))
save('runtime-assets.json',assets)
csvout('runtime-assets.csv',[{**r,'references':' | '.join(r['references'])} for r in assets])
csvout('never-requested.csv',[dict(path=r['path'],bytes=r['bytes'],status=r['status'],references=' | '.join(r['references'])) for r in assets if not r['observed']])

print('Atlas clip reachability...',flush=True)
retired={'hiro':['plant-stem-cut-paired'],'alpha':['hiro-alpha-pin-paired'],'serpent':['hiro-finisher-2'],'beetle':['hiro-finisher-2'],'goblin':['hiro-finisher-2'],'spider':['hiro-finisher-1']}
atlases=[]
for p in (ROOT/'assets').rglob('*.json'):
 try:d=json.loads(text(p))
 except ValueError:continue
 if not isinstance(d,dict) or not isinstance(d.get('frames'),dict) or not isinstance(d.get('clips'),dict):continue
 frames=d['frames'];allused={f for c in d['clips'].values() for f in c.get('frames',[])}
 deadclips=set(retired.get(d.get('hero'),[]))&d['clips'].keys()
 # Level clips and enrage are review candidates, not automatically dead.
 candidates=[c for c in d['clips'] if re.search(r'-(?:l2|l3)$',c) or (c=='enrage' and d.get('hero') in ['serpent','beetle','moss_giant','goblin','spider'])]
 liveused={f for name,c in d['clips'].items() if name not in deadclips for f in c.get('frames',[])}
 unused=set(frames)-allused;retiredframes=allused-liveused
 pages=[]
 for i,t in enumerate(d.get('textures',[])):
  image=p.parent/t['image'];pageframes=t.get('frames',[]);area=sum(f['frame']['w']*f['frame']['h'] for f in pageframes)
  removed=sum(f['frame']['w']*f['frame']['h'] for f in pageframes if f.get('filename') in unused|retiredframes)
  approx=round(image.stat().st_size*removed/area) if image.exists() and area else 0
  pages.append(dict(path=image.relative_to(ROOT).as_posix(),bytes=image.stat().st_size if image.exists() else 0,occupiedPixels=area,candidatePixels=removed,estimatedBytes=approx))
 if unused or retiredframes or candidates:atlases.append(dict(path=p.relative_to(ROOT).as_posix(),actor=d.get('hero'),unreferencedFrames=sorted(unused),retiredClips=sorted(deadclips),retiredFrames=sorted(retiredframes),reviewClips=candidates,pages=pages,proposal='rebuild atlas after approval',note='Byte estimate is occupied-area proportional, not a measured WebP re-encode saving; direct frame access requires review.'))
save('atlas-candidates.json',atlases)

print('Source provenance (no source writes)...',flush=True)
# Preserve every source file. Exact relative references provide positive evidence;
# lack of evidence is unresolved, never sufficient to label a drawing rejected.
corpus=[]
for folder in ['tools','js','docs']:
 for p in walk(ROOT/folder):
  if p.suffix.lower() in {'.py','.js','.json','.md'} and 'cleanup-audit-' not in p.as_posix() and 'UNUSED_ART_' not in p.name and p.stat().st_size<5e6:corpus.append((p.relative_to(ROOT).as_posix(),text(p).replace('\\\\','/').replace('\\','/')))
sourcefiles=list(walk(SOURCE));sourceDocs=[]
for p in sourcefiles:
 if p.suffix.lower() in {'.json','.md','.py','.js'} and p.stat().st_size<5e6:sourceDocs.append((p.relative_to(SOURCE).as_posix(),text(p).replace('\\\\','/').replace('\\','/')))
source_index=collections.defaultdict(set)
for origin,s in corpus+sourceDocs:
 for tok in re.findall(r"[A-Za-z0-9_./:-]+\.(?:png|webp|jpe?g|json|psd|svg)",s):
  source_index[Path(tok).name].add(origin)
sources=[];sg=collections.Counter()
for p in sourcefiles:
 rel=p.relative_to(SOURCE).as_posix();size=p.stat().st_size;sg[rel.split('/')[0]]+=size
 records=sorted(source_index.get(p.name,[]));protected=bool(re.search(r'prompt|reference|manifest|receipt',p.name,re.I))
 state='protected prompt/reference/manifest' if protected else 'referenced source / keep' if records else 'unresolved provenance / keep'
 sources.append(dict(path=rel,bytes=size,status=state,proposal='keep',references=records[:30],referenceCount=len(records),sha256=digest(p)))
save('source-art.json',sources)
csvout('source-art.csv',[{**r,'references':' | '.join(r['references'])} for r in sources])

reviews=[]
for p in (ROOT/'docs/art').iterdir():
 if not p.is_dir():continue
 rows=[r for r in inventory if r['path'].startswith(p.relative_to(ROOT).as_posix()+'/')]
 citations=[line.strip() for line in changelog.splitlines() if p.name in line]
 reviews.append(dict(path=p.relative_to(ROOT).as_posix(),bytes=sum(r['bytes'] for r in rows),status='approval not established by audit',proposal='needs Hiro',evidence=citations[:8],images=sum(Path(r['path']).suffix.lower() in ['.png','.webp','.jpg'] for r in rows)))
for p in (ROOT/'docs').glob('*REVIEW*'):
 if p.is_file():reviews.append(dict(path=p.relative_to(ROOT).as_posix(),bytes=p.stat().st_size,status='review page / keep',proposal='keep',evidence=[],images=0))
save('reviews.json',reviews)
groups=collections.defaultdict(list)
for r in inventory:
 if r['group'] in ['dist','test/reports']:
  prefix=r['group']+'/';part=r['path'][len(prefix):].split('/')[0];groups[prefix+part].append(r)
outputs=[]
for key,rs in groups.items():
 cited=key in changelog or any(r['path'] in changelog for r in rs)
 outputs.append(dict(path=key,bytes=sum(r['bytes'] for r in rs),files=len(rs),latest=max(r['mtime'] for r in rs),tracked=any(r['tracked'] for r in rs),cited=cited,proposal='keep evidence' if cited else 'needs regenerability check'))
save('generated-groups.json',outputs)

print('Git object inventory...',flush=True)
objs=run(['git','rev-list','--objects','--all','--reflog']).decode().splitlines()
names={line.split(' ',1)[0]:line.split(' ',1)[1] if ' ' in line else '' for line in objs}
batch=run(['git','cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize) %(objectsize:disk)'],input=('\n'.join(names)+'\n').encode()).decode().splitlines()
current={line.split()[2] for line in run(['git','ls-tree','-r','HEAD']).decode().splitlines()}
blobs=[]
for line in batch:
 parts=line.split()
 if len(parts)==4 and parts[1]=='blob':blobs.append(dict(oid=parts[0],path=names[parts[0]],bytes=int(parts[2]),diskBytes=int(parts[3]),current=parts[0] in current))
blobs.sort(key=lambda r:r['diskBytes'],reverse=True);save('git-blobs.json',blobs)
gitbytes=sum(p.stat().st_size for p in walk(ROOT/'.git'))
tempbytes=sum(p.stat().st_size for p in walk(ROOT/'.git/objects') if p.name.startswith('tmp_obj_'))
count=subprocess.run(['git','count-objects','-v'],cwd=ROOT,capture_output=True,text=True)
(OUT/'git-count-objects.txt').write_text(count.stdout+'\n'+count.stderr,encoding='utf-8')
summary=dict(created=datetime.datetime.now(datetime.timezone.utc).isoformat(),commit=run(['git','rev-parse','HEAD']).decode().strip(),drive=shutil.disk_usage(ROOT)._asdict(),totals=dict(totals),sourceTotals=dict(sg),gitBytes=gitbytes,gitTemporaryBytes=tempbytes,historicalBlobDiskBytes=sum(r['diskBytes'] for r in blobs if not r['current']),duplicateBytes=sum(r['redundantBytes'] for r in duplicates),runtimeFiles=len(assets),observedFiles=sum(r['observed'] for r in assets),neverRequestedFiles=sum(not r['observed'] for r in assets),atlasEstimate=sum(p['estimatedBytes'] for a in atlases for p in a['pages']))
save('summary.json',summary)
print(json.dumps(summary,indent=2),flush=True)
