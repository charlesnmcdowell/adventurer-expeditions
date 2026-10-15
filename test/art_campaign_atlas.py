import json,re,math
from pathlib import Path
from PIL import Image,ImageDraw
root=Path.cwd(); out=root/'test/reports/all-chapter-art';out.mkdir(parents=True,exist_ok=True)
bindings=re.findall(r"S.bindings\['([^']+)'\]=\{actor:'([^']+)'",(root/'js/expedition/story_art.js').read_text(encoding='utf-8',errors='replace'))
print('Bindings',len(bindings))
report=[];tiles=[]
for identity,actor in bindings:
 p=root/'assets/expedition'/actor/(actor+'.json'); d=json.loads(p.read_text(encoding='utf-8',errors='replace')); frames={};errors=[];pages={}
 for page in d['textures']:
  im=Image.open(p.parent/page['image']).convert('RGBA');pages[page['image']]=im
  for f in page['frames']:
   r=f['frame']; x,y,w,h=(r[k] for k in ('x','y','w','h'))
   if x<0 or y<0 or x+w>im.width or y+h>im.height: errors.append('out of atlas '+f['filename'])
   frames[f['filename']]=(im,(x,y,x+w,y+h),f)
 for k,c in d['clips'].items():
  for f in c['frames']:
   if f not in frames: errors.append('missing '+k+':'+str(f))
 tile=Image.new('RGB',(1120,205),'#333d47');draw=ImageDraw.Draw(tile);draw.text((6,4),identity+' / '+actor,fill='white')
 ac=d['clips'].get('attack') or d['clips'].get('cast') or d['clips'].get('slash') or d['clips'].get('bite') or d['clips'].get('lunge'); seq=ac['frames']; selected=[('idle',d['clips']['idle']['frames'][0])]+[(str(i),seq[i]) for i in sorted(set([0,*ac.get('contact',[]),len(seq)//2,len(seq)-1]))]
 for i,(label,name) in enumerate(selected):
  im,box,f=frames[name];crop=im.crop(box);crop.thumbnail((210,166));tile.paste(crop,(i*220+(210-crop.width)//2,28+166-crop.height),crop);draw.text((i*220+6,19),label,fill='#ffffa0')
 tiles.append(tile);report.append({'identity':identity,'actor':actor,'clips':len(d['clips']),'frames':len(frames),'authoredFacing':d.get('authoredFacing'),'errors':errors})
for start in range(0,len(tiles),8):
 page=Image.new('RGB',(1120,205*len(tiles[start:start+8])),'#222222')
 for i,t in enumerate(tiles[start:start+8]):page.paste(t,(0,i*205))
 page.save(out/('attack-contact-%02d.jpg'%(start//8)),quality=92)
(out/'atlas-inventory.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('actors',len(report),'frames',sum(r['frames'] for r in report),'errors',sum(len(r['errors']) for r in report))


