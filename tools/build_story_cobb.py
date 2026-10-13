"""Review-only Cobb registration. Source masters and rejected drafts are retained."""
from pathlib import Path
import json, hashlib, sys
import numpy as np
from PIL import Image
from art_intake_v2 import build, key_cell, discard_neighbor_fragments
import build_story_nib as pair_builder

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v8/story-enemies/cobb'
OUT=ROOT/'docs/art/story-cobb'

def cells(file,cols,rows):
    im=Image.open(SRC/file).convert('RGBA');frames=[]
    for i in range(cols*rows):
        x0=round(i%cols*im.width/cols);x1=round((i%cols+1)*im.width/cols)
        y0=round(i//cols*im.height/rows);y1=round((i//cols+1)*im.height/rows)
        cell,box=key_cell(im.crop((x0,y0,x1,y1)),tol=12,enclosed_tol=3)
        if file=='cobb-attack-left-20261012.png':
            cell=discard_neighbor_fragments(cell)
            # The new sheet paints a neutral gray floor shadow between the
            # brown boots. Remove only that ten-pixel foot band, never cloak,
            # axe steel, or the rest of the gray palette.
            a=np.array(cell);rgb=a[:,:,:3].astype(int);yy=np.indices(a.shape[:2])[0]
            boot=(a[:,:,3]>200)&(yy>cell.height*.65)&(rgb[:,:,0]>rgb[:,:,1]+8)&(rgb[:,:,1]>rgb[:,:,2]+3)
            if boot.any():
                floor=np.where(boot)[0].max()
                shadow=(yy>=floor-10)&(np.ptp(rgb,axis=2)<7)&(rgb.min(2)>55)&(rgb.max(2)<170)
                a[shadow,3]=0;cell=Image.fromarray(a)
        cell=discard_neighbor_fragments(cell);box=cell.getchannel('A').getbbox()
        if not box:raise ValueError('Empty pose '+file+'/'+str(i))
        p=SRC/'registered-combat'/Path(file).stem/f'{i:02}.png';p.parent.mkdir(parents=True,exist_ok=True);cell.save(p)
        frames.append(dict(file=str(p.relative_to(SRC)),frames=1,preservePixels=True,regions=[[0,0,cell.width,cell.height]],
            sha256=hashlib.sha256(p.read_bytes()).hexdigest(),guide=dict(anchorX=cell.width*.5,groundY=box[3]),height=box[3]-box[1]))
    return frames

def main():
    motion=cells('cobb-motion-draft.png',3,4)[:4]
    run=cells('cobb-run.png',4,2)
    # October 12: authored left-facing shoulders/head throughout the axe chop.
    # Original front-facing attack master remains in source art for rollback.
    attack=cells('cobb-attack-left-20261012.png',3,4)
    down=cells('cobb-down.png',4,3)
    clips=[]
    for name,frames,ref,times,contact in [
        ('idle',motion,motion[0]['height'],[180]*4,[]),
        ('approach',run,run[0]['height']*1.12,[70]*8,[]),
        ('attack',attack,attack[0]['height'],[120,90,90,110,85,60,180,90,90,100,110,160],[6]),
        ('hit',down[:4],down[0]['height'],[70,100,100,150],[]),
        ('down',down[4:],down[0]['height'],[90,100,110,110,120,140,180,300],[])]:
        sources=[{k:v for k,v in f.items() if k not in ['guide','height']}|dict(firstFrameZeroBased=i) for i,f in enumerate(frames)]
        clips.append(dict(id=name,frames=len(frames),sources=sources,durationsMs=times,loop=name in ['idle','approach'],
            contactFramesZeroBased=contact,releaseFrameZeroBased=len(frames)-1,registration=dict(referenceHeight=ref,frames=[f['guide'] for f in frames])))
    warnings=[];pair_builder.SRC=SRC
    for id,file,ref,contact in [('hiro-finisher-1','hiro-diagonal-v3.png',188,[6]),('hiro-finisher-2','hiro-bind-thrust-v2.png',182,[7,8])]:
        pair,flags=pair_builder.paired(id,[file],4,4,[ref],contact)
        pair.update(opponentKinds=['story_cobb'],opponentKeys=['story:mini:cobb'])
        clips.append(pair);warnings.extend(dict(clip=id,**f) for f in flags)
    manifest=dict(actor='story_cobb',clips=clips,status='review only; not enabled in campaign',authoredFacing=-1)
    OUT.mkdir(parents=True,exist_ok=True)
    (SRC/'combat-manifest.json').write_text(json.dumps(manifest,indent=2))
    doc=build(SRC,'story_cobb',OUT,300,95,manifest,lossless=True);doc['authoredFacing']=-1
    (OUT/'story_cobb/story_cobb.json').write_text(json.dumps(doc,separators=(',',':')))
    for name,c in doc['clips'].items():
        if name.startswith('hiro-'):c.update(embeddedBlood=True,preserveTiming=True)
    (OUT/'story_cobb/story_cobb.json').write_text(json.dumps(doc,separators=(',',':')))
    if (SRC/'cobb-fatal.png').exists():
        fatal,flags=pair_builder.paired('story_cobb-fatal',['cobb-fatal.png'],4,4,[196],[5,6],True)
        fatal.update(opponentKinds=['story_cobb'],opponentKeys=['story:mini:cobb'])
        warnings.extend(dict(clip=fatal['id'],**f) for f in flags)
        build(SRC,'story_cobb-fatal',OUT,300,95,dict(clips=[fatal]),lossless=True)
        (SRC/'fatal-manifest.json').write_text(json.dumps(dict(clips=[fatal]),indent=2))
    (OUT/'registration-report.json').write_text(json.dumps(dict(warnings=warnings,status='review-only'),indent=2))
    if '--intake' in sys.argv:
        if warnings:raise ValueError('Resolve boundary warnings before intake')
        for actor,directory in [('story_cobb','story_cobb'),('story_cobb-fatal','adult/story_cobb-fatal')]:
            source=OUT/actor;target=ROOT/'assets/expedition'/directory
            descriptor=json.loads((source/(actor+'.json')).read_text());target.mkdir(parents=True,exist_ok=True)
            for t in descriptor['textures']:
                content=(source/t['image']).read_bytes();name=actor+'-'+hashlib.sha256(content).hexdigest()[:12]+'.webp'
                (target/name).write_bytes(content);t['image']=name
            descriptor['meta']['pages']=[t['image'] for t in descriptor['textures']]
            (target/(actor+'.json')).write_text(json.dumps(descriptor,separators=(',',':')))
    print(json.dumps(dict(warnings=warnings,status='review-only')))

if __name__=='__main__':main()
