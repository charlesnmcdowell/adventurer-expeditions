"""Register a reviewed 24-pose campaign actor and its three authored pairs.

Source art/configuration stays in sibling source-art. No runtime mutation unless
--intake is supplied, every pair exists, and boundary checks are clean.
"""
from pathlib import Path
import argparse, hashlib, json
import numpy as np
from PIL import Image
import build_citadel_combat as extraction
import build_story_nib as pairs
from art_intake_v2 import build

ROOT = Path(__file__).resolve().parents[1]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('--intake', action='store_true')
    args = ap.parse_args()
    src = ROOT.parent/'adventurer-expeditions-source-art/astra-v8/story-enemies'/args.source
    cfg = json.loads((src/'registration.json').read_text())
    actor = cfg['actor']; out = ROOT/'docs/art'/('story-'+args.source)
    out.mkdir(parents=True, exist_ok=True)
    extraction.SRC = src; pairs.SRC = src
    combat_file = cfg.get('combatFile','combat.png')
    # Opt-in correction for a measured translucent matte. Preserve source
    # masters and every visible RGB value; never threshold coat/armor color.
    # The high-alpha silhouette is unchanged, only low-alpha backing fades.
    if cfg.get('combatAlphaFloor'):
        floor,full=cfg['combatAlphaFloor'];arr=np.array(Image.open(src/combat_file).convert('RGBA'))
        alpha=arr[:,:,3].astype(float)
        arr[:,:,3]=np.where(alpha>=full,alpha,np.clip((alpha-floor)/(full-floor),0,1)*full).astype('uint8')
        combat_file='combat-alpha-clean.png';Image.fromarray(arr).save(src/combat_file)
    fs = extraction.extract(combat_file,24,seed_alpha=cfg.get('seedAlpha',64))
    ref = cfg['bodyReferenceHeight']
    clips=[]; warnings=[]
    for name,start,end in [('idle',0,4),('approach',4,8),('attack',8,16),('hit',16,20),('down',20,24)]:
        poses=fs[start:end]
        times={'idle':[180]*4,'approach':[85]*4,'attack':[120,100,100,85,150,100,120,180],
               'hit':[80,100,130,180],'down':[140,180,200,300]}[name]
        clips.append(dict(id=name,frames=len(poses),sources=[dict(file=f['file'],frames=1,
            regions=f['regions'],firstFrameZeroBased=i,preservePixels=True,
            sha256=hashlib.sha256((src/f['file']).read_bytes()).hexdigest()) for i,f in enumerate(poses)],
            durationsMs=times,loop=name in ['idle','approach'],contactFramesZeroBased=cfg.get('attackContacts',[4]) if name=='attack' else [],
            releaseFrameZeroBased=len(poses)-1,registration=dict(referenceHeight=cfg.get('clipBodyReferences',{}).get(name,ref),frames=[f['guide'] for f in poses])))
    fatal=None
    for spec in cfg['pairs']:
        clip,flags=pairs.paired(spec['id'],[spec['file']],4,4,[spec['hiroReferenceHeight']],spec['contacts'],spec.get('fatal',False))
        clip.update(opponentKinds=[actor],opponentKeys=['story:'+cfg['identity']])
        warnings.extend(dict(clip=spec['id'],**f) for f in flags)
        if spec.get('fatal'):fatal=clip
        else:clips.append(clip)
    if len(clips)!=7 or fatal is None:raise ValueError('Need two Hiro pairs and one enemy pair')
    manifest=dict(actor=actor,authoredFacing=-1,clips=clips,status='registered review; visual approval required')
    (src/'combat-manifest.json').write_text(json.dumps(manifest,indent=2))
    doc=build(src,actor,out,300,95,manifest,lossless=True);doc['authoredFacing']=-1
    for c in doc['clips'].values():
        if c.get('paired'):c.update(embeddedBlood=True,preserveTiming=True)
    (out/actor/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')))
    fatalid=actor+'-fatal'
    build(src,fatalid,out,300,95,dict(clips=[fatal]),lossless=True)
    (src/'fatal-manifest.json').write_text(json.dumps(dict(clips=[fatal]),indent=2))
    report=dict(actor=actor,ordinaryFrames=24,hiroFinisherFrames=[16,16],enemyFinisherFrames=16,warnings=warnings)
    (out/'registration-report.json').write_text(json.dumps(report,indent=2))
    template=(ROOT/'docs/art/story-nib/index.html').read_text(encoding='utf-8')
    (out/'index.html').write_text(template.replace('Nib',cfg['name']).replace('story_nib',actor),encoding='utf-8')
    if args.intake:
        if warnings:raise ValueError('Resolve frame-boundary warnings before intake')
        for aid,directory in [(actor,actor),(fatalid,'adult/'+fatalid)]:
            source=out/aid; target=ROOT/'assets/expedition'/directory;target.mkdir(parents=True,exist_ok=True)
            doc=json.loads((source/(aid+'.json')).read_text())
            for t in doc['textures']:
                content=(source/t['image']).read_bytes();name=aid+'-'+hashlib.sha256(content).hexdigest()[:12]+'.webp'
                (target/name).write_bytes(content);t['image']=name
            doc['meta']['pages']=[t['image'] for t in doc['textures']]
            (target/(aid+'.json')).write_text(json.dumps(doc,separators=(',',':')))
    print(json.dumps(report))

if __name__=='__main__': main()
