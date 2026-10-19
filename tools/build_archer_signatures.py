"""Add archer signatures; preserve existing pixels, expand only logical canvases."""
import json,copy,hashlib
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v11/archer-signatures-20261019'
SPECS={
 'ithrel':dict(file='itsuki-sky-volley.png',clip='sky-volley',labels=[2,4,3,1,11,12,10,9,13,14,15,16,19,22,20,21],ref=330,lift=[0]*16,back=[0]*16,release=8,points={8:[250,827]},ms=[95,85,85,95,100,100,120,160,150,100,100,95,95,90,90,130]),
 'faelen':dict(file='kaito-flip-burst.png',clip='flip-burst',labels=[1,9,3,2,16,18,39,17,50,51,53,52,96,97],ref=288,lift=[0,0,40,90,130,85,0,0,0,0,0,0,0,0],back=[0,0,-5,-15,-25,-30,-30,-30,-30,-30,-30,-30,-30,-30],release=13,points={9:[710,669],11:[1475,669],13:[739,885]},ms=[100,100,80,85,90,85,100,100,110,100,110,100,110,130,120,160])}

def build(cid):
 spec=SPECS[cid];actor='companion_'+cid;dest=ROOT/'assets/expedition'/actor;path=dest/(actor+'.json');d=json.loads(path.read_text(encoding='utf-8'));prefix=actor+'-archer-'
 # Larger logical canvas accommodates full bows and the flip without altering
 # any existing drawing size or anchor. Every trim and firing point shifts equally.
 dx=350-d['canvas']['pivot']['x'];dy=500-d['canvas']['pivot']['y']
 if dx or dy:
  for t in d['textures']:
   for f in t['frames']:f['spriteSourceSize']['x']+=dx;f['spriteSourceSize']['y']+=dy;f['sourceSize']={'w':700,'h':550}
  for f in d['frames'].values():f['spriteSourceSize']['x']+=dx;f['spriteSourceSize']['y']+=dy;f['sourceSize']={'w':700,'h':550}
  for c in d['clips'].values():
   if c.get('releaseAnchor'):c['releaseAnchor']['x']+=dx;c['releaseAnchor']['y']+=dy
  d['canvas']={'w':700,'h':550,'pivot':{'x':350,'y':500}}
 d['textures']=[t for t in d['textures'] if not t['image'].startswith(prefix)];d['meta']['pages']=[t['image'] for t in d['textures']]
 a=np.array(Image.open(SRC/spec['file']).convert('RGBA'));labels,n=ndimage.label(a[:,:,3]>64)
 dist,near=ndimage.distance_transform_edt(~np.isin(labels,spec['labels']),return_indices=True);owners=labels[tuple(near)]
 frames=[];audit=[];anchors={};scale=d['standing']/spec['ref']
 for i,label in enumerate(spec['labels']):
  ys,xs=np.where(labels==label);ground=int(ys.max());anchor=float(np.median(xs[ys>ground-5]))
  # Both soles define the grounded body's centre. The lowest-pixel median
  # alternates between left/right boots and made repeated kneeling shots jump.
  if cid=='faelen':
   feet=xs[ys>ground-14];anchor=float((feet.min()+feet.max())/2)
  if cid=='faelen' and i in [2,3,4,5]:anchor=(xs.min()+xs.max())/2
  pixels=a.copy();pixels[(owners!=label)|(dist>3)|(a[:,:,3]<8)]=0;im=Image.fromarray(pixels);box=im.getbbox();im=im.crop(box);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
  x=round(350+(box[0]-anchor)*scale+spec['back'][i]);y=round(500+(box[1]-ground)*scale-spec['lift'][i]);assert x>=0 and y>=0 and x+im.width<700 and y+im.height<550,(i,x,y,im.size)
  name=spec['clip']+'/'+str(i);frames.append((name,im,dict(x=x,y=y,w=im.width,h=im.height)))
  audit.append(dict(frame=i,label=label,box=box,ground=ground,anchor=anchor,scale=scale,lift=spec['lift'][i],back=spec['back'][i]))
  if i in spec['points']:
   px,py=spec['points'][i];anchors[str(i)]=dict(x=round(350+(px-anchor)*scale+spec['back'][i]),y=round(500+(py-ground)*scale-spec['lift'][i]),sizeRatio=.22,measuredFrame=i)
 w=2048;x=y=4;row=0;placed=[]
 for name,im,ss in frames:
  if x+im.width+4>w:x=4;y+=row+8;row=0
  placed.append((name,im,ss,x,y));x+=im.width+8;row=max(row,im.height)
 page=Image.new('RGBA',(w,y+row+4));entries=[]
 for name,im,ss,x,y in placed:
  page.alpha_composite(im,(x,y));entries.append(dict(filename=name,frame=dict(x=x,y=y,w=im.width,h=im.height),rotated=False,trimmed=True,spriteSourceSize=ss,sourceSize=dict(w=700,h=550)))
 name=prefix+hashlib.sha256(page.tobytes()).hexdigest()[:12]+'.webp';page.save(dest/name,lossless=True,method=6)
 for f in entries:d['frames'][f['filename']]={**f,'page':len(d['textures'])}
 d['textures'].append(dict(image=name,format='RGBA8888',size=dict(w=page.width,h=page.height),scale=1,frames=entries));d['meta']['pages'].append(name)
 order=list(range(len(frames)))+([1,0] if cid=='faelen' else [])
 d['clips'][spec['clip']]=dict(frames=[frames[i][0] for i in order],durationMs=sum(spec['ms']),frameDurationsMs=spec['ms'],loop=False,paired=False,contact=[9,11] if cid=='faelen' else [],release=spec['release'],releaseAnchor=anchors[str(spec['release'])],releaseAnchors=anchors,sourceRegistration=dict(referenceHeights=[spec['ref']]*16,authoredAlphaFrames=list(range(16))),sourceSha256=hashlib.sha256((SRC/spec['file']).read_bytes()).hexdigest())
 idle=d['clips']['idle']
 if cid=='faelen':
  idle['frames']=idle['frames'][:4];idle['frameDurationsMs']=[500,350,350,500];idle['release']=3
  for k in ['sources']:
   if k in idle:idle[k]=idle[k][:4]
  sr=idle.get('sourceRegistration',{});sr['referenceHeights']=sr.get('referenceHeights',[])[:4]
  for k in ['maskedFrames','authoredAlphaFrames']:
   if k in sr:sr[k]=[v for v in sr[k] if v<4]
  idle['technicalCalmLoop']=True
 else:idle['frameDurationsMs']=[210 if i not in [2,10] else 90 for i in range(16)]
 idle['durationMs']=sum(idle['frameDurationsMs'])
 d['meta']['archerPolish']=dict(version='20261019-v1',source=spec['file'],uniqueNewDrawings=len(frames),idleNote='calm planted shortbow breathing' if cid=='faelen' else 'longbow sentry breathing with brief blinks')
 path.write_text(json.dumps(d,separators=(',',':')),encoding='utf-8');(SRC/(cid+'-registration.json')).write_text(json.dumps(dict(frames=audit,clip=d['clips'][spec['clip']]),indent=2),encoding='utf-8')
 # Keep the existing roster evidence and root-registration contract in sync.
 rp=ROOT/'docs/IDLE_ROSTER_REVIEW.json';roster=json.loads(rp.read_text());r=next(r for r in roster if r['id']==actor);r['canvas']=d['canvas'];r['times']=idle['frameDurationsMs'];r['frames']=[f for f in r['frames'] if f['name'] in idle['frames']];r['pages']=['assets/expedition/'+actor+'/'+t['image'] for t in d['textures']]
 for f in r['frames']:f['after']=d['frames'][f['name']]['spriteSourceSize']
 rp.write_text(json.dumps(roster,separators=(',',':')),encoding='utf-8')
 gp=ROOT/'tools/idle_roster_registration.json';guides=json.loads(gp.read_text());g=guides['actors'].get(actor)
 if g:g['targetX']+=dx;g['targetY']+=dy;gp.write_text(json.dumps(guides,indent=2),encoding='utf-8')
 print(actor,name,len(frames),'unique drawings')
if __name__=='__main__':
 for cid in SPECS:build(cid)
