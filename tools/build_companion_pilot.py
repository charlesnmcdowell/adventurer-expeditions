"""Measured connected-figure registration, never equal-grid slicing across limbs."""
import json, hashlib, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
from art_intake_v2 import build, anchor_x
ROOT=Path(__file__).resolve().parents[1]
ACTOR=sys.argv[1] if len(sys.argv)>1 else 'hiwot'
ACTORS={'hiwot':('wren_ward',310),'desmond':('vess',325),'winston':('fennick',220),'santiago':('cassian',340),'beau':('dorran',350),'delphine':('selene',320),'itsuki':('ithrel',330),'yasemin':('ysolde',315),'devendra':('aurelius',345),'bahadir':('bramm',365),'layla':('ilvara',320),'kaito':('faelen',320),'wanjiru':('nettle',310),'dai-morgan':('durnik',245),'amara':('amara',330)}
assert ACTOR in ACTORS
IDENTITY,HEIGHT=ACTORS[ACTOR]
KEY='companion_'+IDENTITY
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v10/companions-hiro-20261015'/ACTOR
SPECS=[('idle','idle.png',308,1600,[],15),('walk','run-v3.png',308,800,[],15),
 ('attack','attack-draft.png',295,960,[7],8),('signature-1','backstab.png',288,1120,[7],8),
 ('signature-2','smoke-bomb.png',303,1200,[],7),('hit','hit.png',306,640,[],7),
 ('knockout','knockout.png',352,1400,[],15),('victory','victory-v2.png',290,1600,[],15)]
if ACTOR=='desmond':
 SPECS=[('idle','idle.png',303,1600,[],15),('walk','walk-v2.png',298,1000,[],15),
 ('attack','attack-draft.png',297,960,[7],8),('signature-1','signature-1.png',289,1200,[],7),
 ('signature-2','signature-2.png',305,1200,[7],7),('hit','hit.png',305,640,[],7),
 ('knockout','knockout.png',336,1400,[],15),('victory','victory.png',307,1600,[],15)]
elif ACTOR=='winston':
 SPECS=[('idle','idle.png',300,1600,[],15),('walk','walk.png',300,800,[],15),
 ('attack','attack.png',300,960,[6],8),('signature-1','signature-1.png',300,1120,[7],8),
 ('signature-2','signature-2.png',294,1200,[],7),('hit','hit.png',294,640,[],7),
 ('knockout','knockout.png',301,1400,[],15),('victory','victory.png',300,1600,[],15)]
elif ACTOR=='santiago':
 SPECS=[('idle','idle.png',251,1600,[],15),('walk','walk.png',254,1000,[],15),
 ('attack','attack.png',243,1040,[7],8),('signature-1','signature-1.png',254,1280,[],7),
 ('signature-2','signature-2-v2.png',218,1280,[],7),('hit','hit.png',260,640,[],7),
 ('knockout','knockout.png',284,1500,[],15),('victory','victory.png',256,1600,[],15)]
elif ACTOR=='beau':
 SPECS=[('idle','idle.png',276,1600,[],15),('walk','walk.png',283,1000,[],15),
 ('attack',[('attack-a.png',295,2),('attack-b.png',246,2)],None,1120,[7],8),
 ('signature-1',[('signature-1-a.png',231,2),('signature-1-b.png',251,2)],None,1280,[6],7),
 ('signature-2','signature-2.png',250,1280,[7],8),('hit','hit.png',281,640,[],7),
 ('knockout','knockout.png',320,1600,[],15),('victory','victory.png',274,1600,[],15)]
elif ACTOR=='delphine':
 SPECS=[('idle','idle.png',285,1600,[],15),('walk','walk.png',285,1000,[],15),
 ('attack','attack-v2.png',275,1120,[8],8),('signature-1','signature-1.png',285,1280,[],7),
 ('signature-2','signature-2.png',290,1280,[],7),('hit','hit.png',306,640,[],7),
 ('knockout','knockout.png',346,1600,[],15),('victory','victory.png',296,1600,[],15)]

elif ACTOR=='itsuki':
 SPECS=[('idle','idle.png',344,1600,[],15),('walk','walk.png',345,1000,[],15),
 ('attack','attack.png',341,1120,[],7),('signature-1','signature-1.png',340,1280,[],7),
 ('signature-2','signature-2.png',344,1280,[],7),('hit','hit.png',348,640,[],7),
 ('knockout','knockout.png',405,1600,[],15),('victory','victory-v2.png',335,1600,[],15)]
elif ACTOR=='yasemin':
 SPECS=[('idle','idle.png',304,1600,[],15),('walk','walk.png',306,1000,[],15),
 ('attack','attack.png',310,1120,[7],7),
 ('signature-1',[('signature-1-v2-a.png',352,2),('signature-1-v2-b.png',331,2)],None,1280,[],7),
 ('signature-2',[('signature-2-v2-a.png',360,2),('signature-2-v2-b.png',334,2)],None,1280,[],7),
 ('hit','hit.png',309,640,[],7),('knockout','knockout.png',398,1600,[],15),('victory','victory-v2.png',290,1600,[],15)]
elif ACTOR=='devendra':
 SPECS=[('idle','idle.png',310,1600,[],15),('walk','walk.png',313,1000,[],15),
 ('attack','attack.png',310,1120,[7],7),('signature-1','signature-1.png',293,1280,[],7),
 ('signature-2',[('signature-2-v2-a.png',352,2),('signature-2-v2-b.png',331,2)],None,1280,[],7),
 ('hit','hit.png',317,640,[],7),('knockout','knockout.png',369,1600,[],15),('victory','victory.png',308,1600,[],15)]

elif ACTOR=='bahadir':
 SPECS=[('idle','idle.png',305,1600,[],15),
 ('walk',[('walk-v3-a.png',285,2),('walk-v3-b.png',296,2)],None,1000,[],15),
 ('attack','attack.png',288,1120,[7],7),
 ('signature-1',[('signature-1-v2-a.png',296,2),('signature-1-v2-b.png',295,2)],None,1280,[4],4),
 ('signature-2','signature-2.png',305,1280,[],7),('hit','hit-v2.png',270,640,[],7),
 ('knockout','knockout-v2.png',334,1600,[],15),('victory','victory-v2.png',284,1600,[],15)]
elif ACTOR in ['layla','kaito','wanjiru','dai-morgan','amara']:
 refs={'layla':[298,308,274,297,310,306,363,310],
       'kaito':[294,299,263,289,317,305,357,308],
       'wanjiru':[279,290,283,280,287,309,360,291],
       'dai-morgan':[284,291,257,285,293,290,321,287],
       'amara':[290,298,268,290,330,303,362,294]}[ACTOR]
 names=['idle','walk','attack','signature-1','signature-2','hit','knockout','victory']
 durations=[1600,1000,1120,1280,1280,640,1600,1600]
 contacts={'layla':{2:[7],3:[7]},'kaito':{4:[6]},'wanjiru':{2:[6],4:[6]},
           'dai-morgan':{2:[6]},'amara':{2:[6],3:[6,10],4:[6]}}[ACTOR]
 SPECS=[(n,n+'.png',refs[i],durations[i],contacts.get(i,[]),8 if ACTOR=='kaito' and i==3 else 7) for i,n in enumerate(names)]
 if ACTOR=='amara':
  SPECS[4]=('signature-2',[('signature-2-v2-a.png',342,2),('signature-2-v2-b.png',332,2)],None,1280,[6],6)

def extract(file,ref,columns):
 """Silhouette extraction; wider half-sheets keep long weapons inside a pose."""
 im=Image.open(SRC/file).convert('RGBA');pixels=np.array(im);alpha=pixels[:,:,3]
 # A single reviewed brush trace beyond the complete blade, not blade steel.
 # Source stays intact; remove only this exact pixel in the derived intake.
 if ACTOR=='hiwot' and file=='attack-draft.png':
  assert int(alpha[544,1253])==72
  pixels[544,1253]=0
 labels,count=ndimage.label(alpha>32)
 # Frame 13's staff is separated by a two-pixel transparent gap. Retain it
 # with its owner rather than dropping a weapon or guessing cell boundaries.
 if ACTOR=='delphine' and file=='signature-1.png':labels[labels==26]=27
 sizes=np.bincount(labels.ravel());bodies=[]
 for lab,sl in enumerate(ndimage.find_objects(labels),1):
  if sizes[lab]>3000:
   y,x=sl;bodies.append(dict(label=lab,x=x.start,y=y.start,w=x.stop-x.start,h=y.stop-y.start))
 assert len(bodies)==columns*4,(file,len(bodies))
 edge_mask=np.zeros(alpha.shape,dtype=bool);edge_mask[0]=True;edge_mask[-1]=True;edge_mask[:,0]=True;edge_mask[:,-1]=True
 edge_pixels=np.argwhere(edge_mask&(alpha>32))
 assert not len(edge_pixels),(file,'clipped outer edge')
 bodies.sort(key=lambda r:r['y']+r['h']/2)
 bodies=[r for row in range(4) for r in sorted(bodies[row*columns:(row+1)*columns],key=lambda r:r['x'])]
 for r in bodies:
  body=labels==r['label'];mask=ndimage.binary_dilation(body,iterations=3)
  mask&=(labels==0)|(labels==r['label'])
  frame=pixels.copy();frame[~mask]=0
  ys,xs=np.where(mask&(alpha>0));x0=max(0,int(xs.min())-3);x1=min(im.width,int(xs.max())+4);y0=max(0,int(ys.min())-3);y1=min(im.height,int(ys.max())+4)
  yield Image.fromarray(frame[y0:y1,x0:x1]),ref,{'source':file,'region':[x0,y0,x1-x0,y1-y0],'bodyComponent':r['label']}

def main():
 clips=[];audit=[]
 for name,file,ref,duration,contacts,release in SPECS:
  sheets=file if isinstance(file,list) else [(file,ref,4)]
  drawings=[drawing for source,height,columns in sheets for drawing in extract(source,height,columns)]
  assert len(drawings)==16,(name,len(drawings))
  sources=[];guides=[];fingerprints=[]
  for i,(cell,reference,record) in enumerate(drawings):
   box=cell.getchannel('A').getbbox();assert box
   target=SRC/'registered'/name/(str(i).zfill(2)+'.png');target.parent.mkdir(parents=True,exist_ok=True);cell.save(target)
   fingerprints.append(hashlib.sha256(cell.tobytes()).hexdigest())
   sources.append({'file':str(target.relative_to(SRC)).replace('\\','/'),'frames':1,'firstFrameZeroBased':i,'regions':[[0,0,cell.width,cell.height]],'preservePixels':True,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
   x=anchor_x(cell,box)
   if ACTOR=='hiwot' and name=='walk':
    # Belt/pelvis centres measured on run-v3. A foot-centroid anchor jumps
    # sideways as the forward boot changes; the torso should stay in its lane.
    x=[174,501,810,1137,168,495,807,1136,180,506,810,1144,177,500,811,1147][i]-record['region'][0]
   guides.append({'referenceHeight':reference,'anchorX':x,'groundY':box[3]})
   audit.append({'clip':name,'frame':i,**record})
  assert len(set(fingerprints))==16,(name,'duplicate drawing')
  clips.append({'id':name,'frames':16,'sources':sources,'registration':{'frames':guides},'durationMsDraft':duration,'contactFramesZeroBased':contacts,'releaseFrameZeroBased':release,'paired':False,'loop':name in ['idle','walk']})
 manifest={'actor':KEY,'authoredFacing':1,'clips':clips}
 (SRC/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
 (SRC/'crop-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
 doc=build(SRC,KEY,ROOT/'assets/expedition',HEIGHT,82,SRC/'manifest.json')
 # Measured spell origin in the registered, unscaled release drawing (not chest).
 anchors={'hiwot':{'signature-2':(240,63,.42)},'desmond':{'signature-1':(290,12,.44),'signature-2':(218,68,.38)},
 'winston':{'signature-2':(240,95,.32)},
 'santiago':{'signature-1':(160,130,.4),'signature-2':(152,137,.4)},'beau':{},
 'delphine':{'signature-1':(221,64,.35),'signature-2':(225,88,.4)},
 'itsuki':{'attack':(231,131,.22),'signature-1':(242,150,.22),'signature-2':(206,256,.35)},
 'yasemin':{'signature-1':(348,77,.32),'signature-2':(320,118,.4)},
 'devendra':{'signature-1':(223,98,.35),'signature-2':(283,64,.32)},
 'bahadir':{'signature-2': (143, 146, 0.34)},'layla':{'signature-1':(238,76,.38),'signature-2': (222, 112, 0.32)},'kaito':{'attack': (213, 99, 0.22), 'signature-1': (224, 82, 0.22)},'wanjiru':{'signature-1': (168, 132, 0.32),'signature-2':(207,77,.40)},'dai-morgan':{'signature-1': (123, 115, 0.32), 'signature-2': (193, 139, 0.34)},'amara':{'signature-2': (350, 109, 0.25)}}[ACTOR]
 for name,(x,y,size) in anchors.items():
  clip=next(c for c in clips if c['id']==name);i=clip['releaseFrameZeroBased'];guide=clip['registration']['frames'][i]
  scale=HEIGHT/guide['referenceHeight'];pivot=doc['canvas']['pivot']
  doc['clips'][name]['releaseAnchor']={'x':round(pivot['x']+(x-guide['anchorX'])*scale,2),'y':round(pivot['y']+(y-guide['groundY'])*scale,2),'sizeRatio':size,'measuredFrame':i}
 (ROOT/'assets/expedition'/KEY/(KEY+'.json')).write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
 if ACTOR=='wanjiru':
  from build_wanjiru_forms import build as add_wanjiru_forms
  add_wanjiru_forms()
 print('Pilot only: 128 base drawings plus any approved extensions. Runtime approval requires playback review.')
if __name__=='__main__':main()
