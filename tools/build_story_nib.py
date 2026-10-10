"""Register campaign Nib source art for review. Never enable a draft in gameplay."""
from pathlib import Path
import json, hashlib, sys, shutil
import numpy as np
from PIL import Image
from scipy import ndimage
import build_citadel_combat as extraction
from art_intake_v2 import build

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v8/story-enemies/nib'
OUT=ROOT/'docs/art/story-nib'

def sources(frames):
    return [dict(file=f['file'],frames=1,regions=f['regions'],firstFrameZeroBased=i,
        preservePixels=True,sha256=hashlib.sha256((SRC/f['file']).read_bytes()).hexdigest()) for i,f in enumerate(frames)]

def normal():
    extraction.SRC=SRC
    motion=extraction.extract('nib-motion.png',12)
    attack=extraction.extract('nib-attack.png',12)
    down=extraction.extract('nib-down.png',12)
    # Authored sheets have different density. Match upright anatomy once per
    # sheet, never stretch a crouch or a corpse to the height of a standing man.
    clips=[]
    for name,fs,reference,times,contact in [
        ('idle',motion[:4],445,[160,180,160,180],[]),
        ('approach',motion[4:],445,[65]*8,[]),
        ('attack',attack,345,[130,90,75,65,55,90,125,70,70,80,90,150],[6]),
        ('hit',down[:4],475,[70,100,100,150],[]),
        ('down',down[4:],475,[90,85,85,95,110,130,170,320],[])]:
        # Seed foot anchors are retained for review. Anatomical scale remains
        # fixed across a sheet, including its airborne and prone poses.
        guides=[dict(**f['guide'],referenceHeight=reference) for f in fs]
        clips.append(dict(id=name,frames=len(fs),sources=sources(fs),durationsMs=times,
            contactFramesZeroBased=contact,releaseFrameZeroBased=len(fs)-1,
            loop=name in ['idle','approach'],registration=dict(frames=guides)))
    return clips

def paired(name,files,columns,rows,refs,contacts,fatal=False):
    frames=[];warnings=[]
    for file,ref in zip(files,refs):
        image=Image.open(SRC/file).convert('RGBA');w,h=image.size
        arr=np.array(image);labels,_=ndimage.label(ndimage.binary_erosion(arr[:,:,3]>180,iterations=2))
        sizes=np.bincount(labels.ravel());sizes[0]=0
        owners=np.full(len(sizes),-1,dtype=int)
        for lab in np.where(sizes>600)[0]:
            yy,xx=np.where(labels==lab)
            owners[lab]=min(rows-1,int(np.median(yy)*rows/h))*columns+min(columns-1,int(np.median(xx)*columns/w))
        body=owners[labels]>=0
        distance,near=ndimage.distance_transform_edt(~body,return_indices=True)
        assigned=owners[labels[near[0],near[1]]]
        for n in range(columns*rows):
            x0=round(n%columns*w/columns);x1=round((n%columns+1)*w/columns)
            y0=round(n//columns*h/rows);y1=round((n//columns+1)*h/rows)
            # The paintings are not a mathematically exact grid. Assign whole
            # body components to their pose, retaining overhanging swords/feet
            # instead of slicing them at an idealized rectangular grid line.
            keep=(assigned==n)&(distance<=40)&(arr[:,:,3]>=8)
            yy,xx=np.where(keep)
            if len(xx)<200:raise ValueError('Missing paired pose '+file+'/'+str(n))
            left=max(0,min(x0,int(xx.min())-3));top=max(0,min(y0,int(yy.min())-3))
            right=min(w,max(x1,int(xx.max())+4));bottom=min(h,max(y1,int(yy.max())+4))
            pixels=arr[top:bottom,left:right].copy();pixels[~keep[top:bottom,left:right]]=0
            cell=Image.fromarray(pixels);a=pixels[:,:,3]
            edge=np.concatenate([a[:2].ravel(),a[-2:].ravel(),a[:,:2].ravel(),a[:,-2:].ravel()])
            if (edge>160).sum()>12:warnings.append({'frame':len(frames),'issue':'opaque pixels touch cell boundary'})
            yy,xx=np.where(a>160)
            if len(xx)<200:raise ValueError('Empty paired frame '+file+'/'+str(n))
            p=SRC/'registered-pairs'/name/f'{len(frames):02}.png';p.parent.mkdir(parents=True,exist_ok=True);cell.save(p)
            frames.append(dict(file=str(p.relative_to(SRC)),frames=1,regions=[[0,0,cell.width,cell.height]],
                guide=dict(anchorX=x0+(w/columns)*.27-left,groundY=int(np.quantile(yy,.999))+1,referenceHeight=ref)))
    times=[150,100,100,130,100,90,200,140,140,120,120,130,140,130,140,260]
    clip=dict(id=name,frames=len(frames),sources=sources(frames),durationsMs=times,
        contactFramesZeroBased=contacts,releaseFrameZeroBased=len(frames)-1,paired=True,loop=False,
        registration=dict(frames=[f['guide'] for f in frames]),
        opponentKinds=['story_nib'],opponentKeys=['story:mini:nib'],
        pairTargetDistanceRatio=.72,embeddedBlood=True,preserveTiming=True,
        finalState='hero-defeated' if fatal else 'hero-standing')
    return clip,warnings

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    clips=normal();warnings=[]
    for args in [
        ('hiro-finisher-1',['hiro-overhead-a-v2.png','hiro-overhead-b.png'],2,4,[350,350],[5]),
        ('hiro-finisher-2',['hiro-parry-thrust-v2.png'],4,4,[220],[7])]:
        clip,flags=paired(*args);clips.append(clip);warnings.extend(dict(clip=clip['id'],**f) for f in flags)
    doc=build(SRC,'story_nib',OUT,300,95,dict(clips=clips),lossless=True)
    doc['authoredFacing']=-1
    for name,c in doc['clips'].items():
        if name.startswith('hiro-'):c.update(embeddedBlood=True,preserveTiming=True)
    (OUT/'story_nib/story_nib.json').write_text(json.dumps(doc,separators=(',',':')))
    (SRC/'combat-manifest.json').write_text(json.dumps(dict(actor='story_nib',authoredFacing=-1,clips=clips),indent=2))
    fatal,flags=paired('story_nib-fatal',['nib-fatal-v2.png'],4,4,[225],[5,6],True)
    warnings.extend(dict(clip=fatal['id'],**f) for f in flags)
    fataldoc=build(SRC,'story_nib-fatal',OUT,300,95,dict(clips=[fatal]),lossless=True)
    (SRC/'fatal-manifest.json').write_text(json.dumps(dict(clips=[fatal]),indent=2))
    report=dict(status='review-only',ordinaryFrames=36,hiroFinisherFrames=[16,16],enemyFinisherFrames=16,warnings=warnings)
    (OUT/'registration-report.json').write_text(json.dumps(report,indent=2))
    if '--intake' in sys.argv:
        if warnings:raise ValueError('Resolve frame boundary warnings before intake')
        for actor,directory in [('story_nib','story_nib'),('story_nib-fatal','adult/story_nib-fatal')]:
            source=OUT/actor;target=ROOT/'assets/expedition'/directory;target.mkdir(parents=True,exist_ok=True)
            descriptor=json.loads((source/(actor+'.json')).read_text())
            for t in descriptor['textures']:
                content=(source/t['image']).read_bytes();name=actor+'-'+hashlib.sha256(content).hexdigest()[:12]+'.webp'
                (target/name).write_bytes(content);t['image']=name
            descriptor['meta']['pages']=[t['image'] for t in descriptor['textures']]
            (target/(actor+'.json')).write_text(json.dumps(descriptor,separators=(',',':')))
    print(json.dumps(report))

if __name__=='__main__':main()
