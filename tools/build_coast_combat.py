"""Measured preview intake of Coast masters; never registers an unfinished quest.

Uses authored alpha and shared anatomical scale, extracting connected drawings
rather than assuming generated drawings obey a perfectly even grid.
No pose synthesis, per-frame resizing, or alterations to source masters.
"""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image
from art_intake_v2 import build

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / 'adventurer-expeditions-source-art/astra-v5/coast-20261008'
OUT = ROOT / 'docs/art/coast-20261008/combat'
ACTORS = {'crab': 5, 'toad': 5, 'vulture': 5, 'hydra': 6}


def isolated_intake(actor, rows):
    """Isolate each connected drawing instead of slicing through uneven grids."""
    from scipy import ndimage
    audits=[]
    def extract(kind, cols, count):
        file=actor+('-combat-draft.png' if kind=='base' else '-attack-twelve-draft.png')
        arr=np.array(Image.open(SRC/file).convert('RGBA'))
        labels,_=ndimage.label(arr[:,:,3]>32)
        sizes=np.bincount(labels.ravel());sizes[0]=0
        ids=np.where(sizes>1000)[0]
        if len(ids)!=count:
            raise ValueError(f'{file}: expected {count} separate bodies, found {len(ids)}; manual review required')
        boxes=ndimage.find_objects(labels)
        ids=sorted(ids,key=lambda n:(boxes[n-1][0].start+boxes[n-1][0].stop)/2)
        ordered=[]
        for row in range(count//cols):
            ordered.extend(sorted(ids[row*cols:(row+1)*cols],key=lambda n:(boxes[n-1][1].start+boxes[n-1][1].stop)/2))
        seeds=np.isin(labels,ids)
        distances,nearest=ndimage.distance_transform_edt(~seeds,return_indices=True)
        assigned=labels[nearest[0],nearest[1]]
        destination=SRC/'registered-combat'/actor;destination.mkdir(parents=True,exist_ok=True)
        frames=[];audit=[]
        for index,label in enumerate(ordered):
            keep=(assigned==label)&(distances<=16)&(arr[:,:,3]>=8)
            yy,xx=np.where(keep)
            x0=max(0,int(xx.min())-2);x1=min(arr.shape[1],int(xx.max())+3)
            y0=max(0,int(yy.min())-2);y1=min(arr.shape[0],int(yy.max())+3)
            crop=arr[y0:y1,x0:x1].copy();crop[~keep[y0:y1,x0:x1]]=0
            name=f'registered-combat/{actor}/{kind}-{index:02}.png'
            Image.fromarray(crop).save(SRC/name)
            sy,sx=np.where(labels==label)
            foot=sx[sy>=sy.max()-max(4,(sy.max()-sy.min())*.12)]
            guide=dict(anchorX=float(np.median(foot))-x0,groundY=int(sy.max())+1-y0)
            if actor=='vulture':
                lift=([0,0,0,25,40,55,30,50,40,25,0,0][index] if kind=='attack'
                      else ([20,45,35,20][index%4] if 4<=index<12 else 0))
                guide['groundY']+=lift
            frames.append(dict(file=name,frames=1,regions=[[0,0,x1-x0,y1-y0]],guide=guide,
                               bodyHeight=int(sy.max()-sy.min()+1)))
            audit.append(dict(frame=index,sourceBox=[x0,y0,x1-x0,y1-y0],solidPixels=int(sizes[label]),
                              sourceEdgeContact=bool(np.any(sx==0)|np.any(sx==arr.shape[1]-1)|np.any(sy==0)|np.any(sy==arr.shape[0]-1))))
        audits.append(dict(file=file,sha256=hashlib.sha256((SRC/file).read_bytes()).hexdigest(),
                           extraction='Connected silhouette plus nearest authored alpha within 16px; no repaint',frames=audit))
        return frames
    base=extract('base',4,rows*4);attack=extract('attack',3,12);clips=[]
    for row,name in enumerate(['idle','approach','attack','hit','down','enrage'][:rows]):
        frames=attack if name=='attack' else base[row*4:row*4+4]
        reference=(attack if name=='attack' else base)[0]['bodyHeight']
        sources=[dict(file=f['file'],frames=1,regions=f['regions'],firstFrameZeroBased=i,
                      sha256=hashlib.sha256((SRC/f['file']).read_bytes()).hexdigest()) for i,f in enumerate(frames)]
        clips.append(dict(id=name,frames=len(frames),sources=sources,
            durationsMs={'idle':[180]*4,'approach':[100]*4,'attack':[80,65,55,45,40,40,65,45,45,55,65,90],
                         'hit':[65,75,100,100],'down':[100,130,170,250],'enrage':[130,140,230,160]}[name],
            contactFramesZeroBased=[6] if name=='attack' else [],releaseFrameZeroBased=len(frames)-1,
            loop=name in ('idle','approach'),registration=dict(referenceHeight=reference,frames=[f['guide'] for f in frames])))
    manifest=dict(actor=actor,authoredFacing=-1,clips=clips,status='preview-only; anatomy/scale review and finishers pending')
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/(actor+'-source.json')).write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    doc=build(SRC,actor,OUT,height=300,quality=92,manifest=manifest);doc['authoredFacing']=-1
    (OUT/actor/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
    return dict(actor=actor,frames=rows*4+8,sources=audits)


if __name__=='__main__':
    report=[isolated_intake(actor,rows) for actor,rows in ACTORS.items()]
    (OUT/'intake-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
