"""Chapter 10 art intake; additive lossless pages, preserved masters and old clips."""
import hashlib,json,copy
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v11/chapter10-polish-20261019'
SPECS={
 'entrance':('grell-entrance.png',[2,3,4,1,7,8,10,9,15,16,13,14],325),
 'kneel-shot':('grell-kneel.png',[1,2,3,4,5,7,8,6,12,11,10],364)
}
def repair(doc,actor,dest):
 if actor!='story_grell':return
 dest=Path(dest);prefix='story_grell-ch10-'
 doc['textures']=[t for t in doc['textures'] if not t['image'].startswith(prefix)]
 doc['meta']['pages']=[t['image'] for t in doc['textures']]
 cw,ch=doc['canvas']['w'],doc['canvas']['h'];pv=doc['canvas']['pivot'];frames=[];clips={};audit=[];sources={}
 for clip,(name,ids,reference) in SPECS.items():
  path=SRC/name;sources[name]=hashlib.sha256(path.read_bytes()).hexdigest();a=np.array(Image.open(path).convert('RGBA'))
  labels,n=ndimage.label(a[:,:,3]>64);distance,nearest=ndimage.distance_transform_edt(~np.isin(labels,ids),return_indices=True);owners=labels[tuple(nearest)]
  names=[]
  for i,label in enumerate(ids):
   ys,xs=np.where(labels==label);ground=int(ys.max());foot=xs[ys>=ground-5];anchor=float(np.median(foot));scale=doc['standing']/reference
   pixels=a.copy();pixels[(owners!=label)|(distance>3)|(a[:,:,3]<8)]=0
   cell=Image.fromarray(pixels);box=cell.getbbox();cell=cell.crop(box);cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
   x=round(pv['x']+(box[0]-anchor)*scale);y=round(pv['y']+(box[1]-ground)*scale)
   assert min(x,y)>=0 and x+cell.width<cw and y+cell.height<ch,(clip,i,box,x,y)
   key=clip+'/'+str(i);names.append(key);frames.append((key,cell,dict(x=x,y=y,w=cell.width,h=cell.height)))
   audit.append(dict(clip=clip,index=i,label=label,ground=ground,anchor=anchor,scale=scale,box=box))
  if clip=='kneel-shot':
   # The later source row changes drawing scale. Recover using the complete
   # initial poses in reverse instead; never stretch a kneeling torso upright.
   order=list(range(11))+[2,1,0];ms=[90,90,95,110,110,130,180,80,110,95,90,90,95,120]
  else:order=list(range(12));ms=[110,100,100,110,120,140,150,130,100,100,110,180]
  clips[clip]=dict(frames=[names[i] for i in order],frameDurationsMs=ms,durationMs=sum(ms),loop=False,paired=False,contact=[],sourceRegistration=dict(referenceHeights=[reference]*len(order),authoredAlphaFrames=list(range(len(order)))),source=str(path.relative_to(ROOT.parent)),sourceSha256=sources[name])
 # Pack trimmed rectangles with transparent gutters.
 w=2048;x=y=4;row=0;placed=[]
 for key,cell,ss in frames:
  if x+cell.width+4>w:x=4;y+=row+8;row=0
  placed.append((key,cell,ss,x,y));x+=cell.width+8;row=max(row,cell.height)
 page=Image.new('RGBA',(w,y+row+4));entries=[]
 for key,cell,ss,x,y in placed:
  page.alpha_composite(cell,(x,y));entries.append(dict(filename=key,frame=dict(x=x,y=y,w=cell.width,h=cell.height),rotated=False,trimmed=True,spriteSourceSize=ss,sourceSize=dict(w=cw,h=ch)))
 filename=prefix+hashlib.sha256(page.tobytes()).hexdigest()[:12]+'.webp';page.save(dest/filename,lossless=True,method=6)
 for e in entries:doc['frames'][e['filename']]={**e,'page':len(doc['textures'])}
 doc['textures'].append(dict(image=filename,format='RGBA8888',size=dict(w=page.width,h=page.height),scale=1,frames=entries));doc['meta']['pages'].append(filename)
 # Full-body standing and aiming references use one scale per source sheet.
 shot=clips['kneel-shot'];shot.update(contact=[6],release=6)
 measurement=audit[12+6];scale=measurement['scale']
 shot['releaseAnchor']=dict(x=round(pv['x']+(639-measurement['anchor'])*scale),y=round(pv['y']+(459-measurement['ground'])*scale),sizeRatio=.4)
 doc['clips'].update(clips);doc['clips']['cast']=copy.deepcopy(shot)
 # These two original frames keep the hood off, with only a restrained breath.
 idle=doc['clips']['idle'];idle['frames']=idle['frames'][:2];idle['frameDurationsMs']=[550,550];idle['durationMs']=1100
 for field in ['sources']:
  if field in idle:idle[field]=idle[field][:2]
 if 'sourceRegistration' in idle:
  sr=idle['sourceRegistration'];sr['referenceHeights']=sr.get('referenceHeights',[])[:2]
  for k in ['authoredAlphaFrames','maskedFrames']:
   if k in sr:sr[k]=[v for v in sr[k] if v<2]
 doc['meta']['chapter10Polish']=dict(version='20261019-v1',sources=sources,entranceFrames=12,shotDrawings=11,shotSteps=14)
 (SRC/'registration.json').write_text(json.dumps(dict(frames=audit,clips=clips,page=filename),indent=2),encoding='utf-8')
 # A whole-figure contact sheet makes registration and kneeling easy to review.
 review=Image.new('RGB',(1000,((len(frames)+4)//5)*330),'#707b7c');draw=ImageDraw.Draw(review)
 for i,(key,cell,ss) in enumerate(frames):
  x=(i%5)*200;y=(i//5)*330;small=cell.copy();small.thumbnail((195,300));review.paste(small,(x+(200-small.width)//2,y+310-small.height),small);draw.text((x+5,y+3),key,fill='white')
 review.save(SRC/'registered-contact.jpg')
 print(filename,page.size)

def effects():
 dest=ROOT/'assets/expedition/story/effects';im=Image.open(SRC/'shadow-rise-draft.png').convert('RGBA')
 # Ground aperture was painted at different heights in each row. Register it
 # to y=300 in a padded 400x384 cell; soft alpha and debris remain intact.
 ground=[185]*4+[218]*4+[242]*4+[196]*4
 out=Image.new('RGBA',(1600,1536))
 for i in range(16):
  cell=im.crop(((i%4)*384,(i//4)*256,(i%4+1)*384,(i//4+1)*256))
  # Smooth transparent perimeter prevents neighboring smoke showing at edges.
  a=np.array(cell);yy,xx=np.indices((256,384));edge=np.minimum.reduce([xx,383-xx,yy,255-yy]);a[:,:,3]=(a[:,:,3]*np.clip(edge/8,0,1)).astype('uint8')
  out.alpha_composite(Image.fromarray(a),((i%4)*400+8,(i//4)*384+300-ground[i]))
 name='shadow-rise-'+hashlib.sha256(out.tobytes()).hexdigest()[:12]+'.webp';out.save(dest/name,lossless=True,method=6)
 data=dict(image=name,frameWidth=400,frameHeight=384,frames=16,groundY=300,sourceSha256=hashlib.sha256((SRC/'shadow-rise-draft.png').read_bytes()).hexdigest(),registration=dict(ground=ground),skill='shadow_rise')
 (dest/'resurrection.json').write_text(json.dumps(data,indent=2),encoding='utf-8',newline='\n');print(name)
if __name__=='__main__':
 dest=ROOT/'assets/expedition/story_grell';path=dest/'story_grell.json';doc=json.loads(path.read_text());repair(doc,'story_grell',dest);path.write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8');effects()
