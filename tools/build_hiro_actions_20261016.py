"""Register 32 drawn Iaido/deflect frames and append without repacking old art."""
import json, hashlib, shutil, tempfile
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image
from art_intake_v2 import build, anchor_x
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v10/hiro-actions-20261016'
DEST=ROOT/'assets/expedition/hiro'
def replace_counter_ring(doc):
 """Register the image-generated repair; never erase glow from armor in code."""
 file=SRC/'counter-l3-clean.png'
 if not file.exists():return
 fid='counter-l3/3';old=doc['frames'][fid];im=Image.open(file).convert('RGBA');box=im.getchannel('A').getbbox();assert box
 assert 0<box[0]<box[2]<im.width and 0<box[1]<box[3]<im.height
 im=im.crop(box);height=old['frame']['h'];im=im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
 pivot=doc['canvas']['pivot'];x=round(pivot['x']-anchor_x(im,(0,0,im.width,im.height)));y=pivot['y']-height
 assert x>=0 and y>=0 and x+im.width<=doc['canvas']['w']
 page=Image.new('RGBA',(im.width+8,im.height+8));page.alpha_composite(im,(4,4));page.save(DEST/'hiro-counter-clean.webp',lossless=True)
 old_pages={i for i,t in enumerate(doc['textures']) if t['image']=='hiro-counter-clean.webp'}
 mapping={old:new for new,old in enumerate(i for i in range(len(doc['textures'])) if i not in old_pages)}
 doc['textures']=[t for i,t in enumerate(doc['textures']) if i not in old_pages]
 for t in doc['textures']:t['frames']=[f for f in t['frames'] if f['filename']!=fid]
 doc['frames']={k:{**f,'page':mapping[f['page']]} for k,f in doc['frames'].items() if k!=fid}
 frame={'filename':fid,'frame':{'x':4,'y':4,'w':im.width,'h':im.height},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':x,'y':y,'w':im.width,'h':im.height},'sourceSize':{'w':doc['canvas']['w'],'h':doc['canvas']['h']}}
 doc['frames'][fid]={**frame,'page':len(doc['textures'])}
 doc['textures'].append({'image':'hiro-counter-clean.webp','format':'RGBA8888','size':{'w':page.width,'h':page.height},'scale':1,'frames':[frame]})
 doc['clips']['counter-l3']['repairSource']='counter-l3-clean.png'
CLIPS={'iaido-draw':(['iaido-a.png','iaido-b.png'],[388,375],[90,80,80,90,90,55,40,55,100,100,100,110,120,120,120,140],7),
 'deflect':(['deflect-a.png','deflect-b.png'],[392,368],[55,45,45,45,45,40,35,45,45,45,45,45,45,45,50,65],7)}
def extract(file,reference):
 im=Image.open(SRC/file).convert('RGBA');pixels=np.array(im);a=pixels[:,:,3]
 assert not any(np.any(edge>32) for edge in [a[0],a[-1],a[:,0],a[:,-1]]),(file,'clipped sheet edge')
 labels,_=ndimage.label(a>32);sizes=np.bincount(labels.ravel())
 bodies=[(i,s) for i,s in enumerate(ndimage.find_objects(labels),1) if sizes[i]>3000]
 assert len(bodies)==8,(file,len(bodies))
 bodies.sort(key=lambda item:(item[1][0].start+item[1][0].stop)/2)
 bodies=[item for row in range(4) for item in sorted(bodies[row*2:row*2+2],key=lambda item:item[1][1].start)]
 for lab,sl in bodies:
  mask=ndimage.binary_dilation(labels==lab,iterations=3)&((labels==0)|(labels==lab))
  p=pixels.copy();p[~mask]=0;ys,xs=np.where(mask&(a>0));x0=max(0,int(xs.min())-3);y0=max(0,int(ys.min())-3);x1=min(im.width,int(xs.max())+4);y1=min(im.height,int(ys.max())+4)
  cell=Image.fromarray(p[y0:y1,x0:x1]);yield cell,reference,[x0,y0,x1-x0,y1-y0]
def main():
 clips=[];audit=[]
 for name,(files,refs,durations,contact) in CLIPS.items():
  drawings=[(cell,ref,region,file) for file,ref in zip(files,refs) for cell,ref,region in extract(file,ref)]
  sources=[];guides=[];hashes=[]
  for i,(cell,ref,region,file) in enumerate(drawings):
   out=SRC/'registered'/name/(str(i).zfill(2)+'.png');out.parent.mkdir(parents=True,exist_ok=True);cell.save(out)
   bbox=cell.getchannel('A').getbbox();hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
   sources.append({'file':out.relative_to(SRC).as_posix(),'frames':1,'firstFrameZeroBased':i,'regions':[[0,0,cell.width,cell.height]],'preservePixels':True,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
   guides.append({'referenceHeight':ref,'anchorX':anchor_x(cell,bbox),'groundY':bbox[3]})
   audit.append({'clip':name,'frame':i,'source':file,'region':region})
  assert len(set(hashes))==16
  clips.append({'id':name,'frames':16,'sources':sources,'registration':{'frames':guides},'durationsMs':durations,'contactFramesZeroBased':[contact],'releaseFrameZeroBased':contact,'paired':False,'loop':False})
 manifest={'actor':'hiro-actions','authoredFacing':1,'clips':clips}
 (SRC/'manifest.json').write_text(json.dumps(manifest,indent=2))
 (SRC/'crop-audit.json').write_text(json.dumps(audit,indent=2))
 original=json.loads((DEST/'hiro.json').read_text())
 with tempfile.TemporaryDirectory() as tmp:
  extra=build(SRC,'hiro-actions',tmp,original['standing'],88,manifest)
  # Remove only this tool's previous pages/frames so repeated intake is stable.
  old_indices={i for i,t in enumerate(original['textures']) if t['image'].startswith('hiro-actions-')}
  mapping={old:new for new,old in enumerate(i for i in range(len(original['textures'])) if i not in old_indices)}
  original['textures']=[t for i,t in enumerate(original['textures']) if i not in old_indices]
  original['frames']={key:{**f,'page':mapping[f['page']]} for key,f in original['frames'].items() if f['page'] not in old_indices}
  offset=len(original['textures']);pivot=original['canvas']['pivot'];p=extra['canvas']['pivot']
  for i,t in enumerate(extra['textures']):
   for f in t['frames']:
    f['spriteSourceSize']['x']+=pivot['x']-p['x'];f['spriteSourceSize']['y']+=pivot['y']-p['y']
    f['sourceSize']={'w':original['canvas']['w'],'h':original['canvas']['h']}
    s=f['spriteSourceSize'];assert s['x']>=0 and s['y']>=0 and s['x']+s['w']<=f['sourceSize']['w'] and s['y']+s['h']<=f['sourceSize']['h'],f['filename']
    original['frames'][f['filename']]={**f,'page':offset+i}
   shutil.copyfile(Path(tmp)/'hiro-actions'/t['image'],DEST/t['image'])
  original['textures']+=extra['textures'];original['clips'].update(extra['clips'])
  replace_counter_ring(original)
  original['meta']['pages']=[t['image'] for t in original['textures']]
  (DEST/'hiro.json').write_text(json.dumps(original,separators=(',',':')))
 print('Integrated 16 Iaido and 16 deflect drawings; old frames and pages preserved.')
if __name__=='__main__':main()
