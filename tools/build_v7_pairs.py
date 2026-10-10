"""Replace rejected pairs without re-importing or changing ordinary combat art.

Source masters and generation records live in the sibling astra-v7 directory.
Fixed per-clip anatomical scale and horizontal anchor; measured foot floor only.
Never anchor paired art to the changing combined enemy/effect bounding box.
"""
from pathlib import Path
import json, copy, sys, hashlib
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from art_intake_v2 import build, key_cell, discard_neighbor_fragments

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v7/finisher-replacements-20261009'
ACTORS=['crab','toad','vulture','hydra','elven_wizard','elven_ranger','dark_swordswoman','enchantress','moss_giant']

def remove_grid_rules(img):
    """Remove detached, long straight cell-border rules, never figure highlights."""
    a=np.array(img);h,w=a.shape[:2]
    # A horizontal and vertical rule can join into an L-shaped component.
    # Identify only long neutral straight spans in the 16px border margin.
    rgb=a[:,:,:3].astype(int)
    neutral=(rgb.min(2)>130)&(rgb.max(2)-rgb.min(2)<14)&(a[:,:,3]>20)
    for y in list(range(min(16,h)))+list(range(max(0,h-16),h)):
        if neutral[y].sum()>w*.75:a[y,neutral[y]]=0
    for x in list(range(min(16,w)))+list(range(max(0,w-16),w)):
        if neutral[:,x].sum()>h*.75:a[neutral[:,x],x]=0
    labels,_=ndimage.label(a[:,:,3]>20)
    for lab,s in enumerate(ndimage.find_objects(labels),1):
        if s is None:continue
        y,x=s;hh=y.stop-y.start;ww=x.stop-x.start
        horizontal=ww>w*.75 and hh<=12 and (y.start<16 or y.stop>h-16)
        vertical=hh>h*.75 and ww<=12 and (x.start<16 or x.stop>w-16)
        if horizontal or vertical:a[labels==lab]=0
    return Image.fromarray(a)

def original(actor):
    backup=SRC/'baseline'/actor
    if not backup.exists():
        import shutil
        shutil.copytree(ROOT/'assets/expedition'/actor,backup)
    return backup,json.loads((backup/(actor+'.json')).read_text())

def version_pages(actor,doc):
    """Version the image pages as well as JSON; browsers cache them separately."""
    folder=(ROOT/'assets/expedition'/actor).resolve();keep=set()
    for i,t in enumerate(doc['textures']):
        old=folder/t['image'];digest=hashlib.sha256(old.read_bytes()).hexdigest()[:12]
        name=f'{actor}-v7-{digest}-{i}.webp';new=folder/name
        if old!=new:
            if old.resolve().parent!=folder or new.resolve().parent!=folder:raise ValueError('Unsafe atlas path')
            old.replace(new)
        t['image']=name;keep.add(name)
    doc['meta']['pages']=[t['image'] for t in doc['textures']]
    for stale in folder.glob(actor+'-v7-*.webp'):
        if stale.name not in keep:
            if stale.resolve().parent!=folder:raise ValueError('Unsafe stale page')
            stale.unlink()

def retained(actor,folder,doc,replace):
    clips=[]
    for ident,c in doc['clips'].items():
        if ident in replace:continue
        dest=SRC/'retained'/actor/ident;dest.mkdir(parents=True,exist_ok=True)
        sources=[];guides=[]
        for i,name in enumerate(c['frames']):
            f=doc['frames'][name];r=f['frame'];ss=f['spriteSourceSize'];pivot=doc['canvas']['pivot']
            im=Image.open(folder/doc['textures'][f['page']]['image']).crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
            p=dest/f'{i:02}.png';im.save(p)
            sources.append(dict(file=str(p),frames=1,columns=1,rows=1,firstFrameZeroBased=i,preservePixels=True))
            guides.append(dict(anchorX=pivot['x']-ss['x'],groundY=pivot['y']-ss['y'],referenceHeight=300))
        clips.append(dict(id=ident,frames=len(sources),sources=sources,registration=dict(frames=guides),durationsMs=c['frameDurationsMs'],contactFramesZeroBased=c['contact'],releaseFrameZeroBased=c['release'],paired=c.get('paired',False),loop=c.get('loop',False)))
    return clips

def new_clip(actor,variant,suffix='',fixed_reference=None):
    master=SRC/f'{actor}-{variant}{suffix}.png';sheet=Image.open(master).convert('RGBA');w,h=sheet.size
    frames=[];floors=[];tops=[];dest=SRC/'cells'/f'{actor}-{variant}{suffix}';dest.mkdir(parents=True,exist_ok=True)
    for i in range(8):
        x0=round((i%2)*w/2);y0=round((i//2)*h/4);x1=round((i%2+1)*w/2);y1=round((i//2+1)*h/4)
        # Grid borders are outside the drawings, not part of the animation.
        cell=sheet.crop((x0+3,y0+3,x1-3,y1-3))
        rgba,_=key_cell(cell,tol=28,enclosed_tol=10)
        rgba=remove_grid_rules(rgba)
        rgba=discard_neighbor_fragments(rgba)
        a=np.array(rgba);alpha=a[:,:,3];yy,xx=np.where((alpha>180)&(np.indices(alpha.shape)[1]<cell.width*.45))
        if len(xx)<100:raise ValueError(f'{master.name}/{i}: missing hero')
        # Hero alone defines floor. Enemy, sword trail and dissolving particles
        # cannot raise/lower the root. Fixed X never follows the swinging feet.
        floors.append(int(np.quantile(yy,.998))+1)
        purple=(a[:,:,2].astype(int)>a[:,:,1].astype(int)*1.18)&(a[:,:,0]>38)&(a[:,:,3]>180)
        purple[:,int(cell.width*.43):]=False
        py,px=np.where(purple)
        tops.append(int(np.quantile(py,.02)) if len(py)>20 else int(yy.min()))
        frames.append(rgba)
    # A clip's body reference never follows crouching or airborne bounds.
    ref=fixed_reference or floors[0]-tops[0]
    anchor=frames[0].width*.25
    overrides=SRC/'registration-overrides.json'
    custom=json.loads(overrides.read_text()).get(f'{actor}-{variant}',{}) if overrides.exists() else {}
    ref=custom.get('referenceHeight',ref);anchor=custom.get('anchorX',anchor);floors=custom.get('floors',floors)
    sources=[];guides=[]
    for i,im in enumerate(frames):
        p=dest/f'{i:02}.png';im.save(p)
        sources.append(dict(file=str(p),frames=1,columns=1,rows=1,firstFrameZeroBased=i))
        guides.append(dict(anchorX=anchor,groundY=floors[i],referenceHeight=ref))
    (dest/'registration.json').write_text(json.dumps(dict(master=master.name,referenceHeight=ref,anchorX=anchor,floors=floors,heads=tops),indent=2))
    c=dict(id='hiro-finisher-'+str(variant),frames=8,sources=sources,registration=dict(frames=guides),durationsMs=[220,160,100,230,140,170,160,320],contactFramesZeroBased=[3],primaryImpactFrameZeroBased=3,releaseFrameZeroBased=7,victimFullyGoneFrameZeroBased=7,paired=True,loop=False,opponentKeys=[actor],opponentKinds=[actor],pairTargetDistanceRatio=1,finalState='hero-standing')
    if actor=='hydra' and variant==1:
        # The slumped body precedes its spray/dissolve drawing.
        order=[0,1,2,3,5,4,6,7]
        c['sources']=[sources[i].copy() for i in order]
        c['registration']['frames']=[guides[i] for i in order]
        for i,s in enumerate(c['sources']):s['firstFrameZeroBased']=i
    if not suffix and (SRC/f'{actor}-{variant}-between.png').exists():
        b=new_clip(actor,variant,'-between',ref)
        order=[(kind,i) for i in range(8) for kind in (0,1)]
        if actor=='dark_swordswoman' and variant==1:
            order=[(0,0),(1,0),(0,1),(1,1),(1,2),(0,2),(1,3),(0,3),(1,4),(0,4),(1,5),(0,5),(1,6),(0,6),(0,7),(1,7)]
        pool=[copy.deepcopy(c),b];contact=order.index((0,3))
        if actor=='elven_ranger' and variant==1:contact=5
        c['sources']=[];c['registration']['frames']=[]
        for index,(kind,i) in enumerate(order):
            s=copy.deepcopy(pool[kind]['sources'][i]);s['firstFrameZeroBased']=index;c['sources'].append(s)
            c['registration']['frames'].append(pool[kind]['registration']['frames'][i])
        holds=[180,100,150,100,90,80,140,140,110,110,160,140,150,150,180,280]
        holds[contact]=240
        c.update(frames=16,durationsMs=holds,contactFramesZeroBased=[contact],primaryImpactFrameZeroBased=contact,releaseFrameZeroBased=15,victimFullyGoneFrameZeroBased=15)
    return c

def main():
    for actor in sys.argv[1:] or ACTORS:
        variants=[1] if actor=='moss_giant' else [1,2]
        folder,old=original(actor);ids=['hiro-finisher-'+str(v) for v in variants]
        clips=retained(actor,folder,old,ids)+[new_clip(actor,v) for v in variants]
        for c in clips:
            if c['id'] in ids:
                c['opponentKinds']=old['clips'][c['id']]['opponentKinds']
        doc=build(SRC,actor,ROOT/'assets/expedition',300,95,dict(clips=clips),lossless=True)
        version_pages(actor,doc)
        doc['authoredFacing']=old.get('authoredFacing',-1)
        for ident,c in doc['clips'].items():
            if ident not in ids:
                # Preserve all lifecycle metadata, only new packed names differ.
                c.update(copy.deepcopy(old['clips'][ident]))
            else:
                c.update(preserveTiming=True,sourceRevision='v7-complete-replacement',embeddedBlood=actor.startswith('elven_') or actor in ['dark_swordswoman','enchantress'],registrationApproved=False)
        (ROOT/'assets/expedition'/actor/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')),encoding='utf8')
        (SRC/(actor+'-manifest.json')).write_text(json.dumps(dict(clips=clips),indent=2),encoding='utf8')

if __name__=='__main__':main()
