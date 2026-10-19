"""Register additive entrance sheets without touching approved combat atlases.

Connected figures, not guessed equal crops, own their pixels. Detached weapons
and effects use the nearest figure. One body scale per sheet, grounded soles,
lossless packing with transparent gutters. Masters and audit records retained.
"""
import json,hashlib,sys
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw
GAME=Path(__file__).resolve().parents[1]
SRC=GAME.parent/'adventurer-expeditions-source-art/astra-v12/entrances-20261019'
OUT=GAME/'assets/expedition/entrances'
def extract(actor,count):
 image=Image.open(SRC/(actor+'-entrance.png')).convert('RGBA');a=np.array(image)
 labs,n=ndimage.label(a[:,:,3]>96);areas=np.bincount(labs.ravel());areas[0]=0
 ids=sorted(np.argsort(areas)[-count:].tolist());assert len(ids)==count and min(areas[ids])>2500,(actor,'missing body',areas[ids])
 centres={i:np.mean(np.argwhere(labs==i),axis=0) for i in ids}
 ys=np.array([centres[i][0] for i in ids]);rows=count//4;cy=np.linspace(ys.min(),ys.max(),rows)
 for _ in range(12):
  groups=np.abs(ys[:,None]-cy[None,:]).argmin(axis=1)
  cy=np.array([ys[groups==j].mean() for j in range(rows)])
 ordered=[]
 for j in np.argsort(cy):
  group=[i for k,i in enumerate(ids) if groups[k]==j];assert len(group)==4,(actor,'row components',group)
  ordered.extend(sorted(group,key=lambda i:centres[i][1]))
 distance,near=ndimage.distance_transform_edt(~np.isin(labs,ids),return_indices=True);owner=labs[tuple(near)]
 cells=[];audit=[]
 for i,label in enumerate(ordered):
  pixels=a.copy();pixels[(owner!=label)|(a[:,:,3]<8)]=0
  # No RGB from a transparent backdrop enters the atlas gutter.
  pixels[pixels[:,:,3]==0]=0
  im=Image.fromarray(pixels);box=im.getbbox();assert box
  yy,xx=np.where(labs==label);floor=int(yy.max());feet=xx[yy>floor-14];anchor=float((feet.min()+feet.max())/2)
  if actor=='story_silksa' and i<4:anchor=float(centres[label][1])
  if actor=='story_wyvern_matriarch' and i<6:anchor=float((xx.min()+xx.max())/2)
  cells.append((im.crop(box),box,anchor,floor));audit.append(dict(index=i,label=int(label),box=box,anchor=anchor,ground=floor,bodyHeight=int(yy.max()-yy.min()+1)))
 return cells,audit
def build(p):
 actor=p['actor'];count=p['frames'];cells,audit=extract(actor,count)
 base=GAME/'assets/expedition'/actor;old=json.loads((base/(actor+'.json')).read_text())
 f=old['frames'][old['clips']['idle']['frames'][0]];idleH=f['spriteSourceSize']['h']
 ref=count-1 if count==12 or actor in ['alpha','hydra'] else 0
 # The matching standing pose determines the scale ONCE. Never independently
 # inflate a crouch, wingbeat or raised hand to the standing height.
 reference=audit[ref]['bodyHeight'];standing=reference*old['standing']/idleH
 w,h=1600,1100;pv={'x':800,'y':1000};entries=[];placed=[];x=y=4;row=0;pageW=2048
 for i,(im,box,anchor,floor) in enumerate(cells):
  if x+im.width+4>pageW:x=4;y+=row+8;row=0
  ss=dict(x=round(pv['x']+box[0]-anchor),y=round(pv['y']+box[1]-floor),w=im.width,h=im.height)
  assert ss['x']>=0 and ss['y']>=0 and ss['x']+ss['w']<w and ss['y']+ss['h']<h,(actor,i,ss)
  name='entrance/'+str(i);entries.append(dict(filename=name,frame=dict(x=x,y=y,w=im.width,h=im.height),rotated=False,trimmed=True,spriteSourceSize=ss,sourceSize=dict(w=w,h=h)));placed.append((im,x,y));x+=im.width+8;row=max(row,im.height)
 page=Image.new('RGBA',(pageW,y+row+4))
 for im,x,y in placed:page.alpha_composite(im,(x,y))
 dest=OUT/actor;dest.mkdir(parents=True,exist_ok=True);filename='entrance-'+hashlib.sha256(page.tobytes()).hexdigest()[:12]+'.webp';page.save(dest/filename,lossless=True,method=6)
 times=[160,140,160,200,260,180,180,240] if count==8 else [110,100,110,140,150,170,210,230,300,180,160,210]
 d=dict(actor=actor,authoredFacing=-1,standing=standing,canvas=dict(w=w,h=h,pivot=pv),textures=[dict(image=filename,format='RGBA8888',size=dict(w=page.width,h=page.height),scale=1,frames=entries)],frames={e['filename']:{**e,'page':0} for e in entries},clips={'entrance':dict(frames=[e['filename'] for e in entries],frameDurationsMs=times,durationMs=sum(times),paired=False,loop=False,contact=[],release=count-1)},meta=dict(source=str((SRC/(actor+'-entrance.png')).relative_to(GAME.parent)),sha256=hashlib.sha256((SRC/(actor+'-entrance.png')).read_bytes()).hexdigest(),pages=[filename],registration=dict(referenceFrame=ref,referenceHeight=reference,idlePixelHeight=idleH,originalStanding=old['standing'])))
 (dest/(actor+'.json')).write_text(json.dumps(d,separators=(',',':')),encoding='utf-8')
 (SRC/(actor+'-registration.json')).write_text(json.dumps(audit,indent=2),encoding='utf-8')
 preview=Image.new('RGB',(1200,((count+3)//4)*350),'#305979');draw=ImageDraw.Draw(preview)
 for i,(im,box,anchor,floor) in enumerate(cells):
  scale=min(.65,285/max(c[0].width for c in cells),300/max(c[0].height for c in cells));tile=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);dx=round(150+(box[0]-anchor)*scale);dy=round(330+(box[1]-floor)*scale);preview.paste(tile,((i%4)*300+dx,(i//4)*350+dy),tile);draw.text(((i%4)*300+5,(i//4)*350+5),str(i),fill='white')
 preview.save(SRC/(actor+'-registered.jpg'),quality=94)
 print(actor,count,'drawings;',page.size,flush=True)
 return d
def main():
 plan=json.loads((SRC/'plan.json').read_text(encoding='utf-8'));failed=[];built=[]
 for p in plan:
  if not p['newArt']:continue
  if len(sys.argv)>1 and p['actor'] not in sys.argv[1:]:continue
  if not (SRC/(p['actor']+'-entrance.png')).exists():continue
  try:build(p);built.append(p['actor'])
  except Exception as e:failed.append(dict(actor=p['actor'],error=str(e)));print(p['actor'],'REVIEW REQUIRED',e,flush=True)
 (SRC/'intake-status.json').write_text(json.dumps(dict(built=built,failed=failed),indent=2),encoding='utf-8')
 if failed:raise SystemExit(1)
if __name__=='__main__':main()
