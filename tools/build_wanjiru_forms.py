"""Add measured, isolated painted shapeshift frames without rebuilding approved art."""
import copy, hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v11/wanjiru-forms-20261018'
DEST=ROOT/'assets/expedition/companion_nettle'
SPECS={
 'bear':{'sha256':'da22a38ade42f9551d5ca608b18d82056123033754a1c457d5e884f5d5c7ecea','labels':[1,2,9,19,65,55,63,69,120,134,142,133,193,194,185,186],
  'x':[143,455,764,1081,144,462,757,1080,152,455,768,1080,153,459,780,1104],
  'ground':[310,310,311,310,625,627,624,624,914,920,916,916,1219,1219,1223,1223],
  'reference':278,'ms':[100,100,110,110,90,90,75,110,85,90,100,100,110,100,90,140],
  'travel':[0,0,.04,.15,.38,.65,.86,1,1,.92,.70,.42,.18,0,0,0],
  'lift':[0]*16,'distance':155},
 'eagle':{'sha256':'a10187eb8f283d29b7897635affeb2eca003a096cce5141209ef0c7bc803ff75','labels':[2,3,7,1,38,43,42,39,52,50,54,62,94,91,88,87],
  'x':[147,456,769,1147,185,535,844,1118,178,538,778,1090,183,495,775,1101],
  'ground':[318,317,310,303,619,550,614,631,880,897,899,903,1217,1220,1221,1219],
  'reference':291,'ms':[100,100,110,100,95,95,75,110,85,95,100,100,110,110,90,140],
  'travel':[0,0,.04,.12,.32,.62,.86,1,1,.91,.70,.40,.14,0,0,0],
  'lift':[0,0,.06,.20,.42,.55,.50,.42,.48,.58,.40,.22,.03,0,0,0],'distance':135}
}

def build():
 path=DEST/'companion_nettle.json';doc=json.loads(path.read_text(encoding='utf-8'))
 # Preserve every old atlas pixel, crop, idle registration and signature anchor.
 prefix='companion_nettle-forms-'
 doc['textures']=[t for t in doc['textures'] if not t['image'].startswith(prefix)]
 doc['meta']['pages']=[t['image'] for t in doc['textures']]
 audit=[];frames=[];clips={};source_hashes={}
 pivot=doc['canvas']['pivot'];cw,ch=doc['canvas']['w'],doc['canvas']['h']
 for form,spec in SPECS.items():
  source=SRC/(form+'.png');source_hashes[form]=hashlib.sha256(source.read_bytes()).hexdigest()
  assert source_hashes[form]==spec['sha256'],'Source changed: remeasure registration before rebuilding'
  im=Image.open(source).convert('RGBA');rgba=np.array(im)
  labels,n=ndimage.label(rgba[:,:,3]>64);sizes=np.bincount(labels.ravel())
  assert len([v for v in sizes[1:] if v>7000])==16,'Source changed: remeasure complete figures'
  bodies=np.isin(labels,spec['labels'])
  distance,nearest=ndimage.distance_transform_edt(~bodies,return_indices=True)
  owners=labels[tuple(nearest)]
  clip='form-'+form;names=[]
  for i,label in enumerate(spec['labels']):
   pixels=rgba.copy();pixels[(owners!=label)|(distance>18)|(rgba[:,:,3]<8)]=0
   # Detached ambient flecks below the foot line are not the next pose's boots.
   # Keep the complete high-alpha figure and its antialias fringe.
   pixels[(np.indices(labels.shape)[0]>spec['ground'][i]+3)&(labels!=label)]=0
   cell=Image.fromarray(pixels);box=cell.getchannel('A').getbbox();assert box
   cell=cell.crop(box);scale=doc['standing']/spec['reference']
   cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
   x=round(pivot['x']+(box[0]-spec['x'][i])*scale)
   y=round(pivot['y']+(box[1]-spec['ground'][i])*scale)
   assert x>=0 and y>=0 and x+cell.width<=cw and y+cell.height<=ch,(form,i,x,y,cell.size,doc['canvas'])
   name=clip+'/'+str(i);names.append(name)
   frames.append((name,cell,{'x':x,'y':y,'w':cell.width,'h':cell.height}))
   audit.append({'clip':clip,'frame':i,'source':form+'.png','bodyLabel':label,'sourceBounds':box,'anchor':[spec['x'][i],spec['ground'][i]],'scale':scale})
  clips[clip]={'frames':names,'contact':[7],'release':7,'durationMs':sum(spec['ms']),
   'frameDurationsMs':spec['ms'],'frameMs':100,'loop':False,'paired':False,'contactDistance':spec['distance'],
   'formMotion':[{'forward':x,'lift':y} for x,y in zip(spec['travel'],spec['lift'])],
   'sourceRegistration':{'referenceHeights':[spec['reference']]*16,'authoredAlphaFrames':list(range(16))},
   'source':str(source.relative_to(ROOT.parent)).replace('\\','/'),'sourceSha256':source_hashes[form]}
 # Transparent 4px padding prevents linear filtering into another drawing.
 w=2048;x=y=4;row=0;placed=[]
 for name,cell,source in frames:
  if x+cell.width+4>w:x=4;y+=row+8;row=0
  placed.append((name,cell,source,x,y));x+=cell.width+8;row=max(row,cell.height)
 page=Image.new('RGBA',(w,y+row+4));entries=[]
 for name,cell,source,x,y in placed:
  page.alpha_composite(cell,(x,y))
  entries.append({'filename':name,'frame':{'x':x,'y':y,'w':cell.width,'h':cell.height},'rotated':False,'trimmed':True,'spriteSourceSize':source,'sourceSize':{'w':cw,'h':ch}})
 digest=hashlib.sha256(page.tobytes()).hexdigest()[:12];page_name=prefix+digest+'.webp'
 page.save(DEST/page_name,lossless=True,method=6)
 for entry in entries:doc['frames'][entry['filename']]={**entry,'page':len(doc['textures'])}
 doc['textures'].append({'image':page_name,'format':'RGBA8888','size':{'w':page.width,'h':page.height},'scale':1,'frames':entries})
 doc['clips'].update(clips);doc['meta']['pages'].append(page_name)
 doc['meta']['wanjiruForms']={'version':'20261018-v1','sources':source_hashes,'frames':32}
 path.write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
 (SRC/'registration.json').write_text(json.dumps({'frames':audit,'clips':clips,'page':page_name},indent=2),encoding='utf-8')
 print(page_name,page.size,(DEST/page_name).stat().st_size,'bytes; 32 new drawings')

if __name__=='__main__':build()
