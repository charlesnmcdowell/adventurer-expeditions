"""Measured wolf-contact repairs; preserve masters, timings and all unrelated frames.
Run after a Hiro/wolf rebuild. Complete master silhouettes are recovered before a dedicated
lossless patch page replaces the reviewed leap and bite cells in the manifests.
"""
import copy,json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
from art_intake_v2 import anchor_x,key_cell
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets/expedition'
def patch(actor):
 folder=DEST/actor;doc=json.loads((folder/(actor+'.json')).read_text())
 page_name=actor+'-contact-clean.webp'
 if page_name in doc['meta']['pages'] and doc['meta'].get('contactRepair')=='20261018-v3':return
 if page_name in doc['meta']['pages']:
  doc['textures']=[t for t in doc['textures'] if t['image']!=page_name]
  doc['meta']['pages'].remove(page_name)
 images=[]
 if actor=='wolf':
  src=ROOT.parent/'adventurer-expeditions-source-art/astra-v1/beasts/wolf_leap.png'
  rgba=np.array(Image.open(src).convert('RGBA'));labels,_=ndimage.label(rgba[:,:,3]>32);sizes=np.bincount(labels.ravel())
  bodies=[(i,s) for i,s in enumerate(ndimage.find_objects(labels),1) if s is not None and sizes[i]>5000]
  assert len(bodies)==5,'source changed: remeasure the five leap poses'
  top=sorted([b for b in bodies if b[1][0].start<500],key=lambda b:b[1][1].start)
  bottom=sorted([b for b in bodies if b[1][0].start>=500],key=lambda b:b[1][1].start)
  for i,(label,sl) in enumerate(top+bottom):
   # Preserve the silhouette's antialias fringe, never neighboring wolf pixels.
   keep=ndimage.binary_dilation(labels==label,iterations=3)&((labels==label)|(labels==0))
   pixels=rgba.copy();pixels[~keep]=0;im=Image.fromarray(pixels);im=im.crop(im.getchannel('A').getbbox())
   im=im.resize((round(im.width*200/370),round(im.height*200/370)),Image.Resampling.LANCZOS)
   frame=copy.deepcopy(doc['frames'][f'leap/{i}']);p=doc['canvas']['pivot']
   frame['spriteSourceSize']={'x':round(p['x']-anchor_x(im,(0,0,*im.size))),'y':p['y']-im.height,'w':im.width,'h':im.height}
   images.append((frame,im))
 else:
  # Whole-figure components recover the boots which crossed equal-grid cells.
  # The arm sheet has one touching pair boundary; split only its measured gap.
  specs={
   'bite-arm-paired':([[3,8],[1],[2],[2],[5],[53],[52],[55,60],[54,57],[56,63]],
      [115,511,900,1278,1689,120,513,868,1265,1660],[382,385,386,393,394,739,733,742,743,743]),
   'bite-leg-paired':([[3,13],[5],[1],[2],[4],[46],[47],[48],[49],[50,52]],
      [115,495,905,1287,1669,115,489,872,1254,1650],[376,377,378,379,377,739,738,740,734,734])}
  import hashlib
  source_contract=json.loads((ROOT/'tools/art_registration/hiro.json').read_text(encoding='utf-8-sig'))
  for clip,(groups,anchors,ground) in specs.items():
   source=ROOT.parent/'adventurer-expeditions-source-art/astra-v1/heroes/hiro'/(clip+'.png')
   contract=next(c for c in source_contract['clips'] if c['id']==clip)
   assert hashlib.sha256(source.read_bytes()).hexdigest()==contract['sha256'],'source changed: remeasure pairs'
   keyed,_=key_cell(Image.open(source).convert('RGBA'));rgba=np.array(keyed);labels,_=ndimage.label(rgba[:,:,3]>32)
   seam=Image.new('1',keyed.size);ImageDraw.Draw(seam).polygon([(0,0),(1170,0),(1170,315),(1153,365),(1144,396),(0,396)],fill=1)
   seam=np.array(seam,dtype=bool)
   for i,labs in enumerate(groups):
    keep=ndimage.binary_dilation(np.isin(labels,labs),iterations=2)&(np.isin(labels,labs)|(labels==0))
    if clip=='bite-arm-paired' and i in [2,3]:keep&=seam if i==2 else ~seam
    pixels=rgba.copy();pixels[~keep]=0;im=Image.fromarray(pixels);box=im.getchannel('A').getbbox();im=im.crop(box)
    scale=320/340;im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    frame=copy.deepcopy(doc['frames'][f'{clip}/{i}']);pivot=doc['canvas']['pivot']
    frame['spriteSourceSize']={'x':round(pivot['x']+(box[0]-anchors[i])*scale),'y':round(pivot['y']+(box[1]-ground[i])*scale),'w':im.width,'h':im.height}
    images.append((frame,im))
 # Keep logical frame rectangles/pivots; add padding without resampling Hiro.
 width=1536;x=y=4;row=0;placements=[]
 for f,im in images:
  if x+im.width+4>width:x=4;y+=row+8;row=0
  placements.append((f,im,x,y));x+=im.width+8;row=max(row,im.height)
 page=Image.new('RGBA',(width,y+row+4));tex={'image':page_name,'format':'RGBA8888','size':{'w':page.width,'h':page.height},'scale':1,'frames':[]}
 changed={f['filename'] for f,im in images}
 for t in doc['textures']:t['frames']=[f for f in t['frames'] if f['filename'] not in changed]
 for f,im,x,y in placements:
  page.alpha_composite(im,(x,y));f['frame']={'x':x,'y':y,'w':im.width,'h':im.height};f.pop('page',None)
  tex['frames'].append(f);doc['frames'][f['filename']]={**f,'page':len(doc['textures'])}
 doc['textures'].append(tex);doc['meta']['pages'].append(page_name)
 doc['meta']['contactRepair']='20261018-v3'
 page.save(folder/page_name,lossless=True,method=6)
 (folder/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
 print(actor,len(images),'repaired frames',page.size)
if __name__=='__main__':
 for name in ['hiro','wolf']:patch(name)
