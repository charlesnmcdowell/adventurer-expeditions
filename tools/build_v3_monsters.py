"""Intake authored v3 source sheets; no procedural character drawing.

One fixed anatomical scale per sheet, never normalize each action's bounds.
Source poses remain left-facing; paired clips remain Hiro-right-facing.
"""
from pathlib import Path
import json, hashlib
from PIL import Image
from art_intake_v2 import build, key_cell

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / 'adventurer-expeditions-source-art/astra-v3/monsters'
IDS = ['serpent','beetle','moss_giant','hag','goblin','spider','orc']

def regions(path, cols, rows, indices):
    w,h=Image.open(path).size
    return [[round(i%cols*w/cols),round(i//cols*h/rows),
             round((i%cols+1)*w/cols)-round(i%cols*w/cols),
             round((i//cols+1)*h/rows)-round(i//cols*h/rows)] for i in indices]

def intake(actor):
    src=SRC/actor
    clips=[]
    def clip(name,file,cols,rows,indices,holds,paired=False):
        path=src/file
        rs=regions(path,cols,rows,indices)
        w,h=rs[0][2:]
        # Measure neutral once. Recoil, leap and prone frames keep this scale.
        if paired:
            ref=h*.80; ax=w*.28; ground=h*.94
        else:
            sheet=Image.open(path)
            neutral=regions(path,cols,rows,[0 if file=='combat.png' else 4])[0]
            x,y,nw,nh=neutral
            rgba,box=key_cell(sheet.crop((x,y,x+nw,y+nh)))
            ref=box[3]-box[1]; ax=w*.5; ground=h*.94
        c=dict(id=name,file=file,frames=len(indices),columns=cols,rows=rows,
               regions=rs,durationsMs=holds,loop=name in ('idle','approach'),paired=paired,
               contactFramesZeroBased=[2] if name=='attack' or paired else [],
               releaseFrameZeroBased=len(indices)-1,
               registration=dict(referenceHeight=ref,anchorX=ax,groundY=ground),
               sha256=hashlib.sha256(path.read_bytes()).hexdigest())
        if paired:
            c.update(opponentKinds=['boss' if actor in ('hag','orc') else actor],
                     opponentKeys=[actor],primaryImpactFrameZeroBased=2,
                     victimFullyGoneFrameZeroBased=5,finalState='victim-gone',
                     pairTargetDistanceRatio=.7)
        clips.append(c)
    for name,inds,holds in [('idle',range(4),[180]*4),
                            ('approach',range(4,8),[90]*4),
                            ('attack',range(8,12),[130,110,90,160]),
                            ('hit',range(12,16),[65,75,100,100])]:
        clip(name,'combat.png',4,4,list(inds),holds)
    clip('down','down-enrage.png',4,2,list(range(4)),[100,100,140,200])
    clip('enrage','down-enrage.png',4,2,list(range(4,8)),[130,130,200,130])
    for n in (1,2):
        clip('hiro-finisher-'+str(n),'hiro-finisher-'+str(n)+'.png',2,3,list(range(6)),[110,100,90,130,160,180],True)
    man=dict(version=3,actor=actor,authoredFacing=-1,clips=clips)
    (src/'manifest.json').write_text(json.dumps(man,indent=2),encoding='utf-8')
    doc=build(src,actor,ROOT/'assets/expedition',height=300,quality=80,manifest=man)
    doc['authoredFacing']=-1
    (ROOT/'assets/expedition'/actor/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')

if __name__=='__main__':
    import sys
    for actor in sys.argv[1:] or IDS:intake(actor)
