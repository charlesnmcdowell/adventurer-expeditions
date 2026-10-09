"""Register Citadel paired sequences without clipping connected silhouettes."""
import json,hashlib
from PIL import Image
import build_coast_pairs as pairs
from art_intake_v2 import build

ROOT=pairs.ROOT
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v5/citadel-20261009'
OUT=ROOT/'docs/art/citadel-20261009/pairs'
ACTORS=['elven_wizard','elven_ranger','dark_swordswoman','enchantress']

def main():
    pairs.SRC=SRC;OUT.mkdir(parents=True,exist_ok=True)
    import sys
    for actor in (sys.argv[1:] or ACTORS):
        clips=[]
        for suffix,clip,contact in [('hiro-one','hiro-finisher-1',3),('hiro-two','hiro-finisher-2',3),('fatal',actor+'-fatal',2)]:
            name=f'{actor}-{suffix}.png'
            if actor=='dark_swordswoman' and suffix=='hiro-two':name=f'{actor}-{suffix}-corrected.png'
            if actor=='elven_wizard' and suffix=='hiro-one':name=f'{actor}-{suffix}-corrected.png'
            fs=pairs.extract(name,pairs.grid(3));h=Image.open(SRC/name).height
            # Anatomical height measured from the first standing Hiro pose;
            # shared across action poses rather than fitting each frame's bounds.
            ratios={'elven_wizard':.265,'elven_ranger':.267,'dark_swordswoman':.275,'enchantress':.273}
            ref=h*ratios[actor]
            if actor=='enchantress' and suffix=='hiro-one':ref=350
            if actor=='elven_wizard' and suffix=='hiro-one':fs[1]['guide']['referenceHeight']=ref*.85
            sources=[dict(file=f['file'],frames=1,regions=f['regions'],firstFrameZeroBased=i,sha256=hashlib.sha256((SRC/f['file']).read_bytes()).hexdigest()) for i,f in enumerate(fs)]
            c=dict(id=clip,frames=6,sources=sources,paired=True,loop=False,durationsMs=[240,180,240,250,240,350],contactFramesZeroBased=[contact],primaryImpactFrameZeroBased=contact,releaseFrameZeroBased=5,opponentKinds=['boss' if actor=='enchantress' else actor],opponentKeys=[actor],finalState='hiro-down' if suffix=='fatal' else 'drawn-idle',pairTargetDistanceRatio=.75,registration=dict(referenceHeight=ref,frames=[f['guide'] for f in fs]))
            if actor=='enchantress' and suffix=='hiro-one':c['pairTargetDistanceRatio']=1.4
            if suffix!='fatal':c['victimFullyGoneFrameZeroBased']=5
            clips.append(c)
        man=dict(actor=actor,clips=clips)
        (OUT/(actor+'-source.json')).write_text(json.dumps(man,indent=2),encoding='utf8')
        build(SRC,actor,OUT,300,92,man)

if __name__=='__main__':main()
