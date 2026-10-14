"""Extract and register the four Citadel combat masters for visual review."""
from pathlib import Path
import json,hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageOps
from art_intake_v2 import build
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v5/citadel-20261009'
OUT=ROOT/'docs/art/citadel-20261009/combat'
ACTORS=['elven_wizard','elven_ranger','dark_swordswoman','enchantress']

def extract(file,count,skip_release=False,seed_alpha=64,seed_erosion=0,seed_cuts=()):
    arr=np.array(Image.open(SRC/file).convert('RGBA'));h,w=arr.shape[:2]
    seed_mask=arr[:,:,3]>seed_alpha
    # Optional seed separation for narrowly touching painted poses. This only
    # separates ownership seeds; the original RGBA pixels are recovered below.
    if seed_erosion:seed_mask=ndimage.binary_erosion(seed_mask,iterations=seed_erosion)
    for x0,y0,x1,y1 in seed_cuts:
        if not (0<=x0<x1<=w and 0<=y0<y1<=h):raise ValueError('Invalid ownership seed cut')
        seed_mask[y0:y1,x0:x1]=False
    labels,_=ndimage.label(seed_mask);sizes=np.bincount(labels.ravel());sizes[0]=0
    boxes=ndimage.find_objects(labels);ids=list(np.where(sizes>5000)[0]);removed=[]
    if skip_release:
        removed=[n for n in ids if .42<(boxes[n-1][0].start+boxes[n-1][0].stop)/2/h<.56]
        ids=[n for n in ids if n not in removed]
    if len(ids)!=count:raise ValueError(f'{file}: {len(ids)} bodies, expected {count}')
    ids.sort(key=lambda n:(boxes[n-1][0].start+boxes[n-1][0].stop)/2)
    ordered=[]
    for row in range(count//4):ordered+=sorted(ids[row*4:row*4+4],key=lambda n:boxes[n-1][1].start)
    seed=np.isin(labels,ids);dist,nearest=ndimage.distance_transform_edt(~seed,return_indices=True)
    assigned=labels[nearest[0],nearest[1]];frames=[]
    for i,n in enumerate(ordered):
        keep=(assigned==n)&(dist<=48)&(arr[:,:,3]>=8)&~np.isin(labels,removed)
        yy,xx=np.where(keep);x0=max(0,int(xx.min())-3);x1=min(w,int(xx.max())+4);y0=max(0,int(yy.min())-3);y1=min(h,int(yy.max())+4)
        crop=arr[y0:y1,x0:x1].copy();crop[~keep[y0:y1,x0:x1]]=0
        sy,sx=np.where(labels==n);floor=int(sy.max())+1;feet=sx[sy>floor-15]
        name=f'registered-combat/{Path(file).stem}/{i:02}.png';dest=SRC/name;dest.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(crop).save(dest)
        frames.append(dict(file=name,frames=1,regions=[[0,0,x1-x0,y1-y0]],height=int(sy.max()-sy.min()+1),guide=dict(anchorX=float(np.median(feet))-x0,groundY=floor-y0)))
    return frames

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    for actor in ACTORS:
        frames=extract(actor+'-combat.png',24,actor=='enchantress')
        # The source's neutral/recovery drawings look right, while its attacks
        # look left. Correct only those poses, never the whole combat sheet.
        if actor=='dark_swordswoman':
            for i in [0,1,2,3,15,19]:
                f=frames[i];p=SRC/f['file'];im=Image.open(p)
                ImageOps.mirror(im).save(p)
                f['guide']['anchorX']=im.width-f['guide']['anchorX']
        ref=frames[0]['height']
        if actor=='enchantress':
            repair=extract('enchantress-attack-release-four.png',4)
            # Repair strip has a different pixel density; match anatomical height
            # using its final neutral pose, preserving its internal shared scale.
            repair_ref=repair[3]['height']
            for f in repair:f['guide']['referenceHeight']=repair_ref
            frames=frames[:12]+repair+frames[12:]
        ranges=[('idle',0,4),('approach',4,8),('attack',8,16),('hit',16,20),('down',20,24)]
        if actor=='enchantress':ranges.append(('enrage',24,28))
        clips=[]
        for name,start,end in ranges:
            fs=frames[start:end];n=len(fs)
            times=([90,75,65,55,90,60,70,100] if name=='attack' else [180]*4 if name=='idle' else [95]*4 if name=='approach' else [90,100,150,220])
            sources=[dict(file=f['file'],frames=1,regions=f['regions'],firstFrameZeroBased=i,sha256=hashlib.sha256((SRC/f['file']).read_bytes()).hexdigest()) for i,f in enumerate(fs)]
            clips.append(dict(id=name,frames=n,sources=sources,durationsMs=times,loop=name in ('idle','approach'),contactFramesZeroBased=[4] if name=='attack' else [],releaseFrameZeroBased=n-1,registration=dict(referenceHeight=ref,frames=[f['guide'] for f in fs])))
        manifest=dict(actor=actor,authoredFacing=-1,clips=clips,status='combat preview; pairs and gameplay pending')
        (OUT/(actor+'-source.json')).write_text(json.dumps(manifest,indent=2),encoding='utf-8')
        doc=build(SRC,actor,OUT,height=300,quality=92,manifest=manifest);doc['authoredFacing']=-1
        (OUT/actor/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')

if __name__=='__main__':main()
