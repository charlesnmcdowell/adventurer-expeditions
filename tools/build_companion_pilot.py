"""Measured connected-figure registration, never equal-grid slicing across limbs."""
import json, hashlib, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
from art_intake_v2 import build, anchor_x
ROOT=Path(__file__).resolve().parents[1]
ACTOR=sys.argv[1] if len(sys.argv)>1 else 'hiwot'
assert ACTOR in ('hiwot','desmond')
KEY='companion_'+('wren_ward' if ACTOR=='hiwot' else 'vess')
HEIGHT=310 if ACTOR=='hiwot' else 325
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v10/companions-hiro-20261015'/ACTOR
SPECS=[('idle','idle.png',308,1600,[],15),('walk','run-v2.png',308,800,[],15),
 ('attack','attack-draft.png',295,960,[7],8),('signature-1','backstab.png',288,1120,[7],8),
 ('signature-2','smoke-bomb.png',303,1200,[],7),('hit','hit.png',306,640,[],7),
 ('knockout','knockout.png',352,1400,[],15),('victory','victory.png',312,1600,[],15)]
if ACTOR=='desmond':
 SPECS=[('idle','idle.png',303,1600,[],15),('walk','walk-v2.png',298,1000,[],15),
 ('attack','attack-draft.png',297,960,[7],8),('signature-1','signature-1.png',289,1200,[],7),
 ('signature-2','signature-2.png',305,1200,[7],7),('hit','hit.png',305,640,[],7),
 ('knockout','knockout.png',336,1400,[],15),('victory','victory.png',307,1600,[],15)]
def main():
 clips=[];audit=[]
 for name,file,ref,duration,contacts,release in SPECS:
  im=Image.open(SRC/file).convert('RGBA');pixels=np.array(im);alpha=pixels[:,:,3]
  labels,count=ndimage.label(alpha>32);sizes=np.bincount(labels.ravel());bodies=[]
  for lab,sl in enumerate(ndimage.find_objects(labels),1):
   if sizes[lab]>3000:
    y,x=sl;bodies.append(dict(label=lab,x=x.start,y=y.start,w=x.stop-x.start,h=y.stop-y.start))
  assert len(bodies)==16,(file,len(bodies))
  # Authoring rows are nonuniform (especially the crouch/down sheet).
  bodies.sort(key=lambda r:r['y']+r['h']/2)
  bodies=[r for row in range(4) for r in sorted(bodies[row*4:row*4+4],key=lambda r:r['x'])]
  sources=[];guides=[];fingerprints=[]
  for i,r in enumerate(bodies):
   body=labels==r['label'];mask=ndimage.binary_dilation(body,iterations=3)
   # Keep antialiased silhouette edges; reject pixels belonging to a neighbor.
   mask&=(labels==0)|(labels==r['label'])
   frame=pixels.copy();frame[~mask]=0
   ys,xs=np.where(mask&(alpha>0));x0=max(0,int(xs.min())-3);x1=min(im.width,int(xs.max())+4);y0=max(0,int(ys.min())-3);y1=min(im.height,int(ys.max())+4)
   cell=Image.fromarray(frame[y0:y1,x0:x1]);box=cell.getchannel('A').getbbox();assert box
   target=SRC/'registered'/name/(str(i).zfill(2)+'.png');target.parent.mkdir(parents=True,exist_ok=True);cell.save(target)
   fingerprints.append(hashlib.sha256(cell.tobytes()).hexdigest())
   sources.append({'file':str(target.relative_to(SRC)).replace('\\','/'),'frames':1,'firstFrameZeroBased':i,'regions':[[0,0,cell.width,cell.height]],'preservePixels':True,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
   guides.append({'referenceHeight':ref,'anchorX':anchor_x(cell,box),'groundY':box[3]})
   audit.append({'clip':name,'frame':i,'source':file,'region':[x0,y0,x1-x0,y1-y0],'bodyComponent':r['label']})
  assert len(set(fingerprints))==16,(name,'duplicate drawing')
  clips.append({'id':name,'frames':16,'sources':sources,'registration':{'frames':guides},'durationMsDraft':duration,'contactFramesZeroBased':contacts,'releaseFrameZeroBased':release,'paired':False,'loop':name in ['idle','walk']})
 manifest={'actor':KEY,'authoredFacing':1,'clips':clips}
 (SRC/'manifest.json').write_text(json.dumps(manifest,indent=2))
 (SRC/'crop-audit.json').write_text(json.dumps(audit,indent=2))
 doc=build(SRC,KEY,ROOT/'assets/expedition',HEIGHT,82,SRC/'manifest.json')
 # Measured spell origin in the registered, unscaled release drawing (not chest).
 anchors={'signature-2':(240,63,.42)} if ACTOR=='hiwot' else {'signature-1':(290,12,.44)}
 for name,(x,y,size) in anchors.items():
  clip=next(c for c in clips if c['id']==name);i=clip['releaseFrameZeroBased'];guide=clip['registration']['frames'][i]
  scale=HEIGHT/guide['referenceHeight'];pivot=doc['canvas']['pivot']
  doc['clips'][name]['releaseAnchor']={'x':round(pivot['x']+(x-guide['anchorX'])*scale,2),'y':round(pivot['y']+(y-guide['groundY'])*scale,2),'sizeRatio':size,'measuredFrame':i}
 (ROOT/'assets/expedition'/KEY/(KEY+'.json')).write_text(json.dumps(doc,separators=(',',':')))
 print('Pilot only: 128 distinct drawings. Runtime approval requires playback review.')
if __name__=='__main__':main()
