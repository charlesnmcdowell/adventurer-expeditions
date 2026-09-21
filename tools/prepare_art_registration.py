"""Build explicit intake manifests from authored source metadata; no game-rule changes."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'adventurer-expeditions-source-art/astra-v1'
OUT=ROOT/'tools/art_registration'
OUT.mkdir(exist_ok=True)
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(hero,clips):
    (OUT/(hero+'.json')).write_text(json.dumps(dict(hero=hero,registrationNote='Body-unit scale is clip-authored; crouches, recoil, jumps and weapon extent do not redefine body size.',clips=clips),indent=2),encoding='utf-8')
def common(c,ref):
    c=dict(c)
    if 'grid' in c:c['columns'],c['rows']=c['grid']
    contact=c.get('contact')
    if 'contactFramesZeroBased' not in c:c['contactFramesZeroBased']=[] if contact is None else ([contact] if isinstance(contact,int) else contact)
    c.setdefault('releaseFrameZeroBased',c.get('release') if c.get('release') is not None else c['frames']-1)
    c['registration']=dict(referenceHeight=ref)
    imp=c.get('impactDraft') or {}
    if 'shake' in imp:imp['shakeAmplitude']=imp.pop('shake')
    if 'pixels' in imp.get('drift',{}):imp['drift']['distancePx']=imp['drift'].pop('pixels')
    c['impactDraft']=imp
    return c

hiro=read(SOURCE/'heroes/hiro/manifest.json')
refs={'idle':500,'walk':490,'draw':500,'short-draw':500,'slash-l1':486,'slash-l2':480,'slash-l3':485,'roll':500,'victory-sheath':500,'kneel':500,'aura-l1':493,'aura-l2':495,'aura-l3':495,'intercept':470,'riposte':470,'hit-short':674,'counter-l2':480,'counter-l3':475,'bite-leg-paired':340,'bite-arm-paired':340,'finisher-l1-paired':515,'finisher-l2-paired':515,'finisher-l3-paired':515}
hold={'idle':[280,300,280,300],'walk':[80,80,85,85,80,80,85,85],'draw':[100,90,90,80,65,80,100,180],'short-draw':[100,80,75,150],'slash-l1':[110,100,65,75,90,150],'slash-l2':[120,100,65,75,90,150],'slash-l3':[120,115,65,80,100,170],'roll':[90,80,70,80,100,140],'hit-short':[90,105,155],'intercept':[110,100,75,80,100,160],'riposte':[110,90,65,75,95,150],'victory-sheath':[140,130,115,100,100,110,140,250],'kneel':[180,160,200,500]}
hc=[]
for raw in hiro['clips']:
    c=common(raw,refs[raw['id']])
    if c['id'] in hold:c['durationsMs']=hold[c['id']]
    if c['paired']:
        c['opponentKinds']=['wolf']
        c['registration']['anchorX']=115 if c['id'].startswith('bite') else 218
        c['registration']['groundY']=375 if c['id'].startswith('bite') else 604
        if c['id'].startswith('bite'):
            c['registration']['frames']=[dict(groundY=375 if i<5 else 340) for i in range(c['frames'])]
    hc.append(c)
write('hiro',hc)

b=read(ROOT/'docs/art/astra-v1/bram-clips.json')
regions={s['file']:[f['rect'] for f in s['frames']] for s in read(ROOT/'docs/art/astra-v1/bram-source-regions.json')['sheets']}
refs={'idle':725,'walk':423,'draw':495,'short_draw':613,'slash':490,'hit_short':830,'roll':500,'intercept':490,'riposte':490,'cast':560,'victory':500,'kneel':800,'bite_leg':440,'bite_arm':435,'finisher_quadruped':420,'finisher_plant':420,'finisher_human':420,'finisher_boss':420}
bc=[]
for raw in b['clips']+b['paired']+b['finishers']:
    c=common(raw,refs[raw['id']])
    if c.get('file') in regions:c['regions']=regions[c['file']]
    if c['id']=='roll':c['matteTolerance']=45
    if c['id']=='draw':c['matteTolerance']=45
    if 'files' in raw:
        c['sources']=[]
        for s in raw['files']:
            s=dict(s);s['columns'],s['rows']=s['grid']
            if s['file'] in regions:s['regions']=regions[s['file']]
            if s['file']=='bite_leg_b.png':s['referenceHeight']=445
            c['sources'].append(s)
    c['paired']=raw in b['paired'] or raw in b['finishers']
    if c['paired']:
        c['opponentKinds']=[{'finisher_plant':'plant','finisher_human':'female_street_bandit','finisher_boss':'boss'}.get(c['id'],'wolf')]
        c['registration']['anchorX']=180 if c['id'].startswith('bite') else 230
    if c['id'].startswith('finisher'):
        if c['id']=='finisher_boss':c['regions']=[[2,2,684,720],[692,2,742,720],[1440,2,730,720]]
        elif c['id']=='finisher_quadruped':c['regions']=[[2,2,719,720],[727,2,718,720],[1450,2,720,720]]
        else:c['regions']=[[2,2,719,720],[726,2,719,720],[1450,2,720,720]]
        c['registration']['groundY']=585
    bc.append(c)
write('bram',bc)

e=read(ROOT/'docs/art/astra-v1/beasts-clips.json')
wolfrefs={'idle':475,'run':370,'leap':370,'bite':500,'land_tumble':385,'overshoot_land':500,'land_beside':600,'hit_short':560,'down_fade':510}
wc=[common(c,wolfrefs[c['id']]) for c in e['wolfClips']]
write('wolf',wc)
for hero,creature,refmap in [
 ('boar','cave_boar',{'run':410,'charge':410,'hit_short':570,'down_fade':430}),
 ('plant','thorn_lurker',{'idle':465,'lash':460,'hit_short':650,'down_fade':460}),
 ('alpha','alpha',{'stalk':475,'pounce':420,'hit_heavy':550,'enrage':475,'down_fade':430})]:
    clips=[common(c,refmap[c['id']]) for c in e['secondaryMotionClips'] if c['creature']==creature]
    if hero=='boar':
        p=next(c for c in e['secondaryProofs'] if c['id']=='cave_boar')
        c=common(dict(p,id='idle',frames=1,loop=True,durationsMs=[600]),410)
        c['regions']=[[0,0,512,512]]
        clips.insert(0,c)
    write(hero,clips)
print('Wrote 6 explicit art registration manifests.')
