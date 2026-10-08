"""Intake the October 8 paired defeats. Preserve masters and generated alpha.

Run --prepare, review the extracted contact sheets, then --apply.
Only writes new adult/<actor>-fatal assets, never existing normal combat art.
"""
import argparse, json, shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from art_intake_v2 import build

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v4/enemy-defeats-20261008'
AUDIT=ROOT/'docs/art/enemy-defeats-20261008'
ACTORS=['wolf','plant','serpent','beetle','moss_giant','hag','goblin','spider','orc']
OMITTED={'serpent':{2},'beetle':{1}}
PACK_TAG=''

def valley(profile,nominal,radius):
    lo=max(0,round(nominal-radius));hi=min(len(profile),round(nominal+radius))
    values=profile[lo:hi];minimum=values.min()
    choices=np.where(values<=minimum+1)[0]+lo
    return int(min(choices,key=lambda x:abs(x-nominal)))

def prepare():
    specs=[]
    for actor in ACTORS:
        p=SRC/(actor+'.png')
        if not p.exists():continue
        a=np.array(Image.open(p).convert('RGBA'));h,w=a.shape[:2]
        # Generated transparent RGB can contain arbitrary matte colors. Do not
        # key gray armor. Remove only nearly invisible alpha noise for packing.
        a[a[:,:,3]<8]=0
        solid=a[:,:,3]>120
        ys=[0]+[valley(solid.sum(1),h*k/3,h*.045) for k in [1,2]]+[h]
        boxes=[];floors=[]
        for row in range(3):
            top,bottom=ys[row:row+2]
            xs=[0]+[valley(solid[top:bottom].sum(0),w*k/4,w*.05) for k in [1,2,3]]+[w]
            yy,_=np.where(solid[top:bottom]);floor=float(np.quantile(yy,.998))+top
            for col in range(4):boxes.append([xs[col],top,xs[col+1],bottom]);floors.append(floor)
        first=a[boxes[0][1]:boxes[0][3],boxes[0][0]:boxes[0][2]]
        rgb=first[:,:,:3].astype(float);xx=np.indices(first.shape[:2])[1]
        hair=(rgb[:,:,0]>rgb[:,:,1]*1.25)&(rgb[:,:,2]>rgb[:,:,1]*1.3)&(rgb.max(2)<180)&(first[:,:,3]>120)&(xx<first.shape[1]*.55)
        yy,x=np.where(hair)
        if len(yy)<50:raise ValueError(actor+': cannot locate Hiro reference; review source')
        hero_top=float(np.quantile(yy,.01));ref=floors[0]-boxes[0][1]-hero_top
        hero_x=float(np.median(x))
        # These raised-sword poses clip the master edge; omit rather than ship.
        indices=[i for i in range(12) if i not in OMITTED.get(actor,set())]
        sources=[];guides=[];contact=4 if actor in ['wolf','beetle','moss_giant','hag','orc'] else 6
        board=Image.new('RGB',(1600,1200),(47,63,76));draw=ImageDraw.Draw(board)
        for k,i in enumerate(indices):
            left,top,right,bottom=boxes[i]
            cell=Image.fromarray(a[top:bottom,left:right]);name=f'{actor}-frame-{k:02}.png';cell.save(SRC/name)
            sources.append(dict(file=name,frames=1,columns=1,rows=1,firstFrameZeroBased=k))
            guides.append(dict(anchorX=hero_x+(i%4)*w/4-left,groundY=floors[i]-top))
            thumb=cell.copy();thumb.thumbnail((395,350));board.paste(thumb,(k%4*400,k//4*400),thumb)
            draw.text((k%4*400+8,k//4*400+370),f'{k} (source {i})',fill='white')
        board.save(SRC/(actor+'-review.jpg'))
        times=[150]*len(indices);times[0]=180;times[-2]=220;times[-1]=400
        c=dict(id=actor+'-fatal',frames=len(indices),sources=sources,paired=True,
            registration=dict(referenceHeight=ref,frames=guides),durationsMs=times,
            contactFramesZeroBased=[indices.index(contact)],releaseFrameZeroBased=len(indices)-1,
            opponentKinds=['hero'],opponentKeys=['hiro'],finalState='hero-down',
            pairTargetDistanceRatio=.73,review=dict(sourceRegions=boxes,sourceIndices=indices,
            note='Visual review required; alpha and grid diagnostics do not prove anatomy.'))
        specs.append(c)
    (SRC/'manifest.json').write_text(json.dumps({'clips':specs},indent=2),encoding='utf-8')

def apply():
    manifest=json.loads((SRC/'manifest.json').read_text(encoding='utf-8'))
    AUDIT.mkdir(parents=True,exist_ok=True)
    for c in manifest['clips']:
        doc=build(SRC,c['id'],ROOT/'assets/expedition/adult',height=320,manifest={'clips':[c]})
        if PACK_TAG:
            out=ROOT/'assets/expedition/adult'/c['id']
            for t in doc['textures']:
                old=t['image'];new=Path(old).stem+'-'+PACK_TAG+'.webp'
                (out/old).rename(out/new);t['image']=new
            doc['meta']['pages']=[t['image'] for t in doc['textures']]
            (out/(c['id']+'.json')).write_text(json.dumps(doc),encoding='utf-8')
    shutil.copyfile(SRC/'manifest.json',AUDIT/'registration.json')
    prompts={a:json.loads((SRC/(a+'-prompt.json')).read_text(encoding='utf-8')) for a in ACTORS if (SRC/(a+'-prompt.json')).exists()}
    (AUDIT/'prompts.json').write_text(json.dumps(prompts,indent=2),encoding='utf-8')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--prepare',action='store_true');p.add_argument('--apply',action='store_true');args=p.parse_args()
    if args.prepare:prepare()
    if args.apply:apply()
