"""Measured Coast pair intake. Masters stay outside runtime and are never overwritten.

Connected drawings are assigned to authored regions, retaining their whole alpha
silhouette instead of clipping at a nominal grid line. Output is review-only until
the gameplay integration explicitly copies accepted atlases.
"""
from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from art_intake_v2 import build

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v5/coast-20261008'
OUT=ROOT/'docs/art/coast-20261008/pairs'

def grid(rows):
    return [[c/2,r/rows,(c+1)/2,(r+1)/rows] for r in range(rows) for c in range(2)]

# Reference heights are Hiro's anatomical standing size in the source image,
# including crouching/airborne poses, not the complete pair's changing bounds.
SETS={
 'crab':[
  ('hiro-finisher-1','crab-vault-eight-draft.png',grid(4),[300,290,300,300,285,250,215,215],4),
  ('hiro-finisher-2','crab-joint-cut-eight-draft.png',grid(4),[300]*8,3),
  ('crab-fatal','crab-fatal-six.png',grid(3),[390]*6,2)],
 'toad':[
  ('hiro-finisher-1','toad-parry-eight-draft.png',grid(4),[330]*8,4),
  ('hiro-finisher-2','toad-intercept-eight-draft.png',grid(4),[330]*8,3),
  ('toad-fatal','toad-fatal-six-corrected.png',grid(3),[430,430,390,430,430,430],3)],
 'vulture':[
  ('hiro-finisher-1','vulture-rising-cut-eight-draft.png',grid(4),[330]*8,3),
  ('hiro-finisher-2','vulture-side-cut-eight-draft.png',grid(4),[330]*8,3),
  ('vulture-fatal','vulture-fatal-six.png',[[0,0,1,.285],[0,.285,1,.55],[0,.55,1,.785],[0,.785,.5,1],[.5,.785,1,1]], [400,400,400,400,400],2)],
 'hydra':[
  ('hiro-finisher-1','hydra-diagonal-six-corrected.png',grid(3),[280,280,280,280,300,330],2),
  ('hiro-finisher-2','hydra-slide-six.png',grid(3),[250,250,250,250,250,250],2),
  ('hydra-fatal','hydra-fatal-six-corrected.png',grid(3),[290]*6,2)]
}

def extract(name, boxes):
    im=Image.open(SRC/name).convert('RGBA');arr=np.array(im);h,w=arr.shape[:2]
    labels,_=ndimage.label(arr[:,:,3]>80);sizes=np.bincount(labels.ravel());sizes[0]=0
    ids=np.where(sizes>24)[0];slices=ndimage.find_objects(labels)
    owners={}
    for label in ids:
        sy,sx=slices[label-1];cx=(sx.start+sx.stop)/2/w;cy=(sy.start+sy.stop)/2/h
        eligible=[i for i,(x0,y0,x1,y1) in enumerate(boxes) if x0<=cx<=x1 and y0<=cy<=y1]
        if not eligible:raise ValueError(f'{name}: component {label} outside authored regions')
        owners[int(label)]=eligible[0]
    seeds=np.isin(labels,ids);distance,nearest=ndimage.distance_transform_edt(~seeds,return_indices=True)
    assigned=labels[nearest[0],nearest[1]]
    result=[]
    for i,b in enumerate(boxes):
        own=[k for k,v in owners.items() if v==i]
        mask=np.isin(assigned,own)&(distance<=18)&(arr[:,:,3]>=8)
        yy,xx=np.where(mask)
        if len(xx)<100:raise ValueError(f'{name}/{i}: empty drawing')
        x0=max(0,int(xx.min())-3);x1=min(w,int(xx.max())+4);y0=max(0,int(yy.min())-3);y1=min(h,int(yy.max())+4)
        crop=arr[y0:y1,x0:x1].copy();crop[~mask[y0:y1,x0:x1]]=0
        # Foot guide starts from the left half of the pair, occupied by Hiro.
        bx0,by0,bx1,by1=b;hx0=round(bx0*w);hx1=round((bx0+(bx1-bx0)*.52)*w)
        hero=mask.copy();hero[:,:hx0]=False;hero[:,hx1:]=False
        hy,hx=np.where(hero & (arr[:,:,3]>96))
        if len(hx)<50:raise ValueError(f'{name}/{i}: missing Hiro region')
        hero_floor=int(np.quantile(hy,.997))+1
        feet=hx[hy>=hero_floor-12]
        anchor=float(np.median(feet)) if len(feet) else float(np.median(hx))
        # Airborne Hiro must stay above a grounded opponent. Register the pair
        # to its lowest substantial painted contact, not Hiro's dangling toe.
        solid_y,_=np.where(mask & (arr[:,:,3]>96))
        floor=int(np.quantile(solid_y,.997))+1
        dest=SRC/'registered-pairs'/Path(name).stem;dest.mkdir(parents=True,exist_ok=True)
        fp=dest/f'{i:02}.png';Image.fromarray(crop).save(fp)
        result.append(dict(file=fp.relative_to(SRC).as_posix(),frames=1,regions=[[0,0,x1-x0,y1-y0]],
                           guide=dict(anchorX=anchor-x0,groundY=floor-y0),sourceBox=[x0,y0,x1-x0,y1-y0]))
    return result

def main():
    OUT.mkdir(parents=True,exist_ok=True); audit=[]
    for actor,sets in SETS.items():
        clips=[]
        for clip,name,boxes,heights,contact in sets:
            frames=extract(name,boxes);fatal=clip.endswith('-fatal');n=len(frames)
            sources=[dict(file=f['file'],frames=1,regions=f['regions'],firstFrameZeroBased=i,
                          sha256=hashlib.sha256((SRC/f['file']).read_bytes()).hexdigest()) for i,f in enumerate(frames)]
            times=([240,130,150,210,160,190,210,330] if n==8 else [240,180,240,250,240,350] if n==6 else [240,220,300,280,420])
            c=dict(id=clip,frames=n,sources=sources,paired=True,loop=False,durationsMs=times,
                   contactFramesZeroBased=[contact],primaryImpactFrameZeroBased=contact,
                   releaseFrameZeroBased=n-1,opponentKinds=['boss' if actor=='hydra' else actor],opponentKeys=[actor],
                   finalState='hiro-down' if fatal else 'hero-standing',pairTargetDistanceRatio=1.0,
                   registration=dict(frames=[dict(**f['guide'],referenceHeight=heights[i]) for i,f in enumerate(frames)]))
            if not fatal:c['victimFullyGoneFrameZeroBased']=n-1
            clips.append(c);audit.append(dict(actor=actor,clip=clip,master=name,sha256=hashlib.sha256((SRC/name).read_bytes()).hexdigest(),frames=frames))
        # Each preview atlas is entirely registered in Hiro body units.
        manifest=dict(actor=actor,authoredFacing=1,clips=clips,status='preview; pair proportions require visual acceptance')
        (OUT/(actor+'-source.json')).write_text(json.dumps(manifest,indent=2),encoding='utf-8')
        build(SRC,actor,OUT,height=300,quality=92,manifest=manifest)
    (OUT/'intake-report.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')

if __name__=='__main__':main()
