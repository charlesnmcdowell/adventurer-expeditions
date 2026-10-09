"""Add selected authored bridge poses; preserve original art and event order."""
from pathlib import Path
import json,copy
import build_coast_pairs as pairs
from art_intake_v2 import build
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v6/polish-20261009'
ACTORS=['crab','toad','vulture','hydra','elven_wizard','elven_ranger','dark_swordswoman','enchantress']
BRIDGE_REF={'dark_swordswoman':445,'elven_wizard':440,'elven_ranger':440,'enchantress':450,'hydra':280}

def absolute(c,root):
    c=copy.deepcopy(c)
    for s in c.get('sources',[]):s['file']=str(root/s['file'])
    return c

def main():
    import sys
    pairs.SRC=SRC
    for actor in sys.argv[1:] or ACTORS:
        loc='coast-20261008' if actor in ACTORS[:4] else 'citadel-20261009'
        old=ROOT.parent/'adventurer-expeditions-source-art/astra-v5'/loc
        review=ROOT/'docs/art'/loc
        normal=json.loads((review/'combat'/(actor+'-source.json')).read_text())
        paired=json.loads((review/'pairs'/(actor+'-source.json')).read_text())
        clips=[absolute(c,old) for c in normal['clips']]
        bridges=pairs.extract(actor+'-bridges.png',pairs.grid(2)) if actor in BRIDGE_REF else None
        for raw in paired['clips']:
            c=absolute(raw,old)
            if c['id'].endswith('-fatal'):continue
            n=c['frames'];contact=c['contactFramesZeroBased'][0]
            entries=[(s,c['registration']['frames'][i]) for i,s in enumerate(c['sources'])]
            order=list(range(n))
            if bridges:
                variant=0 if c['id'].endswith('-1') else 1
                for j in [variant*2,variant*2+1]:
                    b=bridges[j];guide=dict(**b['guide'],referenceHeight=BRIDGE_REF[actor])
                    entries.append((dict(file=str(SRC/b['file']),frames=1,regions=b['regions']),guide))
                # A generated hydra anticipation had six heads: rejected, never
                # intaken. Its valid five-headed follow-through still bridges fall.
                if actor=='hydra':order=[0,1,2,n+1,3,4,5] if variant==0 else [0,1,n,2,n+1,3,4,5]
                elif actor in ('elven_wizard','enchantress') and variant==0:order=[0,1,2,3,n,n+1,4,5]
                else:order=[0,1,2,n,3,n+1,4,5]
            elif actor=='crab' and c['id'].endswith('-1'):
                # Crouch must precede the lift, then the leap. The old ordering
                # raised the blade, crouched again, then teleported into the air.
                order=[0,2,1,3,4,5,6,7]
            c['sources']=[];guides=[]
            for i,index in enumerate(order):
                s,g=copy.deepcopy(entries[index]);s['firstFrameZeroBased']=i;c['sources'].append(s);guides.append(g)
            c['registration']['frames']=guides;c['frames']=len(order)
            c['contactFramesZeroBased']=[order.index(contact)]
            c['primaryImpactFrameZeroBased']=order.index(contact)
            c['releaseFrameZeroBased']=len(order)-1;c['victimFullyGoneFrameZeroBased']=len(order)-1
            # Fast connecting poses, readable impact and recovery. No 250 ms
            # holds on every intermediate pose; no uniform slow-motion stretch.
            holds=[210]+[115]*(len(order)-2)+[300]
            holds[order.index(contact)]=200
            holds[-2]=210;c['durationsMs']=holds
            clips.append(c)
        doc=build(SRC,actor,ROOT/'assets/expedition',300,92,dict(clips=clips))
        doc['authoredFacing']=-1
        for c in doc['clips'].values():
            if c.get('paired'):c['preserveTiming']=True
        (ROOT/'assets/expedition'/actor/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')),encoding='utf8')
        (SRC/(actor+'-polished-manifest.json')).write_text(json.dumps(dict(clips=clips),indent=2),encoding='utf8')
        # Enemy-on-Hiro clips retain their drawings and defeat routing. Tune
        # the metadata only: preserve the impact and give death a readable hold.
        fatal=ROOT/'assets/expedition/adult'/(actor+'-fatal')/(actor+'-fatal.json')
        d=json.loads(fatal.read_text());c=d['clips'][actor+'-fatal'];n=len(c['frames'])
        holds=[220]+[140]*(n-2)+[400]
        for i in c['contact']:holds[i]=220
        c.update(frameDurationsMs=holds,durationMs=sum(holds),frameMs=round(sum(holds)/n),preserveTiming=True)
        fatal.write_text(json.dumps(d,separators=(',',':')),encoding='utf8')

if __name__=='__main__':main()
