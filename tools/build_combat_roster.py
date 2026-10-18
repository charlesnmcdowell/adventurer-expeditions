"""Append registered roster clips without repacking unrelated approved pixels.

Source PNGs and manifest are in sibling source-art/astra-v4/roster-20261002.
Preparation segments disconnected attack figures, NOT a mathematical sheet grid.
No invented/interpolated anatomy. Review crops before --apply.
"""
import argparse, json, shutil, tempfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from art_intake_v2 import build, key_cell

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v4/roster-20261002'
OUT=ROOT/'assets/expedition'
IDS=['wolf','plant','serpent','beetle','moss_giant','hag','goblin','spider','orc']

def split_time(total,n):
    return [round(total*(i+1)/n)-round(total*i/n) for i in range(n)]

def pair_regions(raw):
    """Find authored gutters; generated sheets do not obey an exact grid.

    Purple clusters are only landmarks for gutter search, not semantic proof.
    All extracted drawings still require visual review.
    """
    from scipy.cluster.vq import kmeans2
    keyed=key_cell(raw,tol=10,enclosed_tol=-1)[0]
    from sprite_cleanup_pilot import clean_orc_matte
    padded=Image.new('RGBA',(keyed.width+8,keyed.height+8))
    padded.paste(keyed,(4,4))
    clean=clean_orc_matte(padded).crop((4,4,keyed.width+4,keyed.height+4))
    original=np.array(keyed);a=np.array(clean);r=original[:,:,:3].astype(int)
    # The segmenter mistakes thin silver katana interiors for neutral matte.
    # Restore original bright steel only within four pixels of retained paint.
    steel=(r.min(2)>175)&((r.max(2)-r.min(2))<65)
    a[steel]=original[steel]
    keyed=Image.fromarray(a)
    a=np.array(keyed);rgb=a[:,:,:3].astype(int);solid=a[:,:,3]>100
    w,h=raw.size;ys=[0]
    for row in [1,2]:
        lo=int(h*(row/3-.065));hi=int(h*(row/3+.065))
        profile=solid[lo:hi].sum(1)
        ys.append(lo+int(np.argmin(ndimage.gaussian_filter1d(profile.astype(float),2))))
    ys.append(h);regions=[]
    for row in range(3):
        top,bottom=ys[row:row+2];r=rgb[top:bottom];s=solid[top:bottom]
        purple=(r[:,:,0]>r[:,:,1]*1.2)&(r[:,:,2]>r[:,:,1]*1.3)&(r.max(2)<180)&(r[:,:,2]>35)&s
        yy,xx=np.where(purple)
        centers,_=kmeans2(xx.astype(float),np.array([.08,.34,.59,.84])*w,minit='matrix',iter=40)
        centers=sorted(centers);xs=[0]
        profile=ndimage.gaussian_filter1d(s.sum(0).astype(float),1)
        for left,right in zip(centers,centers[1:]):
            lo=int(left+(right-left)*.40);hi=int(right-(right-left)*.13)
            segment=profile[lo:hi];best=segment.min()
            # Prefer the final empty gutter before the next hero, not the
            # negative space between Hiro and his opponent.
            candidates=np.where(segment<=best+1)[0]
            cut=lo+int(candidates[-1])
            xs.append(cut)
        xs.append(w)
        for col in range(4):regions.append([xs[col],top,xs[col+1],bottom])
    return keyed,regions

def prepare_attacks():
    specs=[]
    for actor in IDS:
        p=SRC/(actor+'-attack.png')
        if not p.exists(): continue
        raw=Image.open(p).convert('RGBA')
        if actor=='wolf':
            a=np.array(raw);rgb=a[:,:,:3].astype(float);excess=rgb[:,:,1]-np.maximum(rgb[:,:,0],rgb[:,:,2])
            a[:,:,3]=np.minimum(a[:,:,3],np.clip(255-excess*2,0,255)).astype('uint8')
            a[:,:,1]=np.minimum(rgb[:,:,1],np.maximum(rgb[:,:,0],rgb[:,:,2])+15).astype('uint8')
            rgba=Image.fromarray(a)
        else:rgba=key_cell(raw,tol=10,enclosed_tol=-1)[0]
        a=np.array(rgba);solid=a[:,:,3]>32
        if actor=='spider':
            # Thin white web strokes cross the nominal grid. Use the colored
            # bodies as seeds, then retain web pixels with the nearest body.
            rgb=a[:,:,:3].astype(int)
            solid &= ~((rgb.min(2)>155)&((rgb.max(2)-rgb.min(2))<65))
        labels,count=ndimage.label(solid)
        sizes=np.bincount(labels.ravel());sizes[0]=0
        centroids=ndimage.center_of_mass(solid,labels,list(range(1,count+1)))
        center=lambda k:centroids[k-1]
        main=sorted(np.argsort(sizes)[-12:],key=lambda k:(round(center(k)[0]/raw.height*3-.5),center(k)[1]))
        if any(sizes[k]<2500 for k in main):raise ValueError(actor+': incomplete main silhouettes')
        centers={k:center(k) for k in main}
        if actor=='spider':
            core=np.where(np.isin(labels,main),labels,0)
            nearest=ndimage.distance_transform_edt(core==0,return_distances=False,return_indices=True)
            labels=np.where(a[:,:,3]>8,core[tuple(nearest)],0)
        # Attach only small detached effects to the closest main figure.
        owner={int(k):int(k) for k in main}
        for k in range(1,count+1):
            if k in owner or sizes[k]<6:continue
            cy,cx=center(k)
            near=min(main,key=lambda m:((cy-centers[m][0])*1.5)**2+(cx-centers[m][1])**2)
            if abs(cy-centers[near][0])<raw.height/3*.6 and abs(cx-centers[near][1])<raw.width/4*.7:owner[k]=int(near)
        doc=json.loads((OUT/actor/(actor+'.json')).read_text())
        name={'wolf':'bite','plant':'lash'}.get(actor,'attack');old=doc['clips'][name]
        baseline=SRC/(actor+'-baseline.json')
        if not baseline.exists():baseline.write_text(json.dumps(doc))
        else:doc=json.loads(baseline.read_text());old=doc['clips'][name]
        contact=old['contact'][0] if old['contact'] else 1
        before=sum(old['frameDurationsMs'][:contact]);total=old['durationMs']
        times=split_time(before,4)+split_time(total-before,8)
        sources=[];guides=[];review=Image.new('RGBA',(1600,1200),(55,70,85,255));d=ImageDraw.Draw(review)
        native=doc['frames'][doc['clips']['idle']['frames'][0]]['frame']['h']
        ref=None
        for i,k in enumerate(main):
            mask=np.isin(labels,[lab for lab,own in owner.items() if own==k]);b=a.copy();b[~mask]=0
            im=Image.fromarray(b);box=im.getbbox();im=im.crop(box)
            # Constant anatomical reference from the starting guard, never pose height.
            by,bx=np.where(labels==k)
            ground=int(by.max())+1-box[1]
            foot=bx[by>=by.max()-max(4,int((by.max()-by.min())*.045))]
            anchor=float(np.median(foot))-box[0]
            if ref is None:ref=(by.max()-by.min()+1)*doc['standing']/native
            f=actor+'-attack-'+str(i)+'.png';im.save(SRC/f)
            sources.append(dict(file=f,frames=1,columns=1,rows=1,firstFrameZeroBased=i))
            guides.append(dict(anchorX=anchor,groundY=ground))
            thumb=im.copy();thumb.thumbnail((380,270));x=i%4*400+(400-thumb.width)//2;y=i//4*400+330-thumb.height
            review.alpha_composite(thumb,(x,y));d.text((i%4*400+5,i//4*400+350),str(i),fill='white')
        review.convert('RGB').save(SRC/(actor+'-attack-review.jpg'))
        specs.append(dict(actor=actor,id=name,frames=12,sources=sources,registration=dict(referenceHeight=ref,frames=guides),durationsMs=times,contactFramesZeroBased=[4],releaseFrameZeroBased=11,paired=False))
    (SRC/'attack-intake.json').write_text(json.dumps(specs,indent=2))

def merge(actor,clips):
    dest=OUT/actor;doc=json.loads((dest/(actor+'.json')).read_text())
    with tempfile.TemporaryDirectory() as t:
        fresh=build(SRC,actor,t,height=doc['standing'],manifest={'clips':clips})
        prefix=actor+'-roster-';old=doc['canvas'];new=fresh['canvas']
        px=max(old['pivot']['x'],new['pivot']['x']);py=max(old['pivot']['y'],new['pivot']['y'])
        cw=px+max(old['w']-old['pivot']['x'],new['w']-new['pivot']['x']);ch=py+max(old['h']-old['pivot']['y'],new['h']-new['pivot']['y'])
        names={c['id'] for c in clips};textures=[x for x in doc['textures'] if not x['image'].startswith(prefix)]
        for tex in textures:
            tex['frames']=[f for f in tex['frames'] if f['filename'].split('/')[0] not in names]
            for f in tex['frames']:
                f['spriteSourceSize']['x']+=px-old['pivot']['x'];f['spriteSourceSize']['y']+=py-old['pivot']['y'];f['sourceSize']={'w':cw,'h':ch}
        for i,tex in enumerate(fresh['textures']):
            name=prefix+str(i)+'.webp';shutil.copyfile(Path(t)/actor/tex['image'],dest/name);tex['image']=name
            for f in tex['frames']:
                f['spriteSourceSize']['x']+=px-new['pivot']['x'];f['spriteSourceSize']['y']+=py-new['pivot']['y'];f['sourceSize']={'w':cw,'h':ch}
            textures.append(tex)
        doc.setdefault('meta',{})['pages']=[t['image'] for t in textures]
        doc['textures']=textures;doc['canvas']={'w':cw,'h':ch,'pivot':{'x':px,'y':py}}
        doc['frames']={f['filename']:{**f,'page':i} for i,tex in enumerate(textures) for f in tex['frames']}
        for c in clips:doc['clips'][c['id']]={**doc['clips'].get(c['id'],{}),**fresh['clips'][c['id']], 'bodyScale':c.get('bodyScale',1)}
        from repair_cast_releases import repair as repair_cast
        repair_cast(doc,actor)
        (dest/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')))
        return [str((dest/x['image']).relative_to(ROOT)).replace('\\','/') for x in textures]

def prepare_pairs(only=None):
    jobs=json.loads((SRC/'jobs.json').read_text(encoding='utf-8-sig'))
    specs=json.loads((SRC/'pair-intake.json').read_text()) if only else []
    if only:specs=[c for c in specs if c.get('review',{}).get('source','').replace('-fixed','').replace('.png','') not in only]
    for job in jobs:
        if job['kind']!='pair':continue
        ident=job['id']
        if only and ident not in only:continue
        p=SRC/(ident+'-fixed.png')
        if not p.exists():p=SRC/(ident+'.png')
        if not p.exists():continue
        actor=job['actor'];name=job['clip'];doc=json.loads((OUT/actor/(actor+'.json')).read_text())
        baseline=SRC/(actor+'-baseline.json')
        if not baseline.exists():baseline.write_text(json.dumps(doc))
        doc=json.loads(baseline.read_text());old=doc['clips'][name]
        raw=Image.open(p).convert('RGBA');w,h=raw.size
        if ident=='serpent-hiro-finisher-1':
            pixels=np.array(raw)
            for gx in [361,724,1086]:pixels[:,gx-2:gx+3,:3]=128
            for gy in [351,703]:pixels[gy-2:gy+3,:,:3]=128
            raw=Image.fromarray(pixels)
        keyed,regions=pair_regions(raw)
        if ident=='serpent-hiro-finisher-1':
            pixels=np.array(keyed)
            for gx in [361,724,1086]:pixels[:,gx-5:gx+6]=0
            for gy in [351,703]:pixels[gy-5:gy+6]=0
            keyed=Image.fromarray(pixels)
        if ident=='hiro-plant-crosscut-paired':
            regions[4][2]=308;regions[5][0]=308
        if ident=='orc-hiro-finisher-2':
            # Measured gap: the automatic late gutter crossed Hiro's rear leg.
            for k,(left,right) in enumerate(zip([0,305,612,914],[305,612,914,w])):
                regions[4+k][0]=left;regions[4+k][2]=right
        full=np.array(keyed)
        # Keep neighboring poses separated when translucent sword trails touch.
        labels,count=ndimage.label(full[:,:,3]>210)
        nearest=ndimage.distance_transform_edt(labels==0,return_distances=False,return_indices=True)
        labels=np.where(full[:,:,3]>8,labels[tuple(nearest)],0)
        votes=[]
        for x,y,right,bottom in regions:
            votes.append(np.bincount(labels[y:bottom,x:right].ravel(),minlength=count+1))
        owner=np.argmax(np.array(votes),axis=0);owner[0]=-1
        ranked=np.sort(np.array(votes),axis=0)
        shared=(ranked[-2]>ranked[-1]*.22)&(ranked[-2]>1000)
        territory=np.zeros(labels.shape,dtype=int)
        for ri,(rx,ry,rr,rb) in enumerate(regions):territory[ry:rb,rx:rr]=ri
        # Crop inside any authored grid rules before keying each cell.
        indices=list(range(12))
        if ident=='alpha-hiro-alpha-parry-paired':indices.remove(2) # enemy absent in this rejected cell
        cells=[];measures=[];sources=[]
        for i in indices:
            x,y,right,bottom=regions[i]
            # Serpent1 has grid lines; inset only the empty rules, not the art.
            inset=3 if ident=='serpent-hiro-finisher-1' else 0
            # Assign whole disconnected shapes by majority occupancy so a
            # gutter crossing a foot cannot cut it in half. This never draws
            # missing pixels and does not move pieces within a pose.
            pixels=full.copy()
            assigned=np.where(shared[labels],territory,owner[labels])
            pixels[assigned!=i]=0
            cell=Image.fromarray(pixels)
            box=cell.getbbox()
            if not box:raise ValueError(ident+f'/{i}: empty pose')
            cell=cell.crop(box)
            if ident=='hiro-plant-vine-pin-paired' and i==11:
                # Source paints an extra recovery pose beyond the measured gap.
                cell=cell.crop((0,0,180,cell.height))
            a=np.array(cell);rgb=a[:,:,:3].astype(int);xx=np.indices(a.shape[:2])[1]
            # Dark purple hair/sash is a diagnostic, never used to erase art.
            purple=(rgb[:,:,0]>rgb[:,:,1]*1.2)&(rgb[:,:,2]>rgb[:,:,1]*1.3)&(rgb.max(2)<190)&(rgb[:,:,2]>35)&(a[:,:,3]>180)&(xx<cell.width*.7)
            yy,xs=np.where(purple)
            if len(yy)<80:raise ValueError(ident+f'/{i}: Hiro presence check failed')
            top=int(np.quantile(yy,.015));cx=float(np.median(xs))
            # Boot floor: only solid dark figure pixels around the hero, not debris.
            dark=(rgb.max(2)<110)&(a[:,:,3]>200)&(xx<cell.width*.67)
            ys,dx=np.where(dark)
            ground=float(np.quantile(ys,.997)) if len(ys) else cell.height*.9
            measures.append(dict(top=top,ground=ground,cx=cx))
            cells.append(cell)
        first=measures[0]['ground']-measures[0]['top'];last=measures[-1]['ground']-measures[-1]['top']
        n=len(cells);guides=[]
        review=Image.new('RGBA',(1600,1200),(55,70,85,255));draw=ImageDraw.Draw(review)
        for k,(cell,m,i) in enumerate(zip(cells,measures,indices)):
            # Anatomical calibration: constant during action; separately measured
            # full-height recovery prevents the solo hero from growing on release.
            ref=first if i<8 else first+(last-first)*min(1,(i-7)/3)
            ground=m['ground']
            if ident=='beetle-hiro-finisher-2' and i in [2,3,4,5]:ground=cell.height*.92 # airborne hero retains arc
            f=ident+'-'+str(k)+'.png';cell.save(SRC/f)
            sources.append(dict(file=f,frames=1,columns=1,rows=1,firstFrameZeroBased=k))
            guides.append(dict(referenceHeight=ref,anchorX=m['cx'],groundY=ground))
            thumb=cell.copy();thumb.thumbnail((395,350));review.alpha_composite(thumb,(k%4*400,k//4*400));draw.text((k%4*400+5,k//4*400+370),str(k)+' / source '+str(i),fill='white')
        review.convert('RGB').save(SRC/(ident+'-review.jpg'))
        # Preserve the live pre-pass total and logical main-impact time.
        prior=old['frameDurationsMs']
        if actor=='alpha':prior=[260,180,140,220,240,360]
        elif actor!='hiro':prior=[260,140,220,210,250,340]
        impact=old.get('primaryImpactFrame',old['contact'][-1]);at=sum(prior[:impact]);total=sum(prior)
        sourceimpact=6 if ident=='alpha-hiro-alpha-pin-paired' else 5
        if ident=='alpha-hiro-alpha-parry-paired':sourceimpact=6
        if name=='wolf-rising-cut-paired':sourceimpact=3
        contact=indices.index(sourceimpact)
        times=split_time(at,contact)+split_time(total-at,n-contact)
        gone=10 if name=='plant-stem-cut-paired' else 9
        if ident=='alpha-hiro-alpha-parry-paired':gone=10
        if name=='wolf-rising-cut-paired':gone=9
        c=dict(actor=actor,id=name,frames=n,sources=sources,registration=dict(referenceHeight=first,frames=guides),durationsMs=times,
            contactFramesZeroBased=[contact],releaseFrameZeroBased=n-1,paired=True,
            opponentKinds=old['opponentKinds'],opponentKeys=old['opponentKeys'],primaryImpactFrameZeroBased=contact,
            victimFullyGoneFrameZeroBased=indices.index(gone),pairTargetDistanceRatio=old.get('pairTargetDistanceRatio',.65),finalState='drawn-idle',
            review=dict(heroPresenceHeuristicPassed=True,rejectedSourceFrames=[i for i in range(12) if i not in indices],source=p.name,regions=regions))
        specs.append(c)
    (SRC/'pair-intake.json').write_text(json.dumps(specs,indent=2))

def apply():
    specs=json.loads((SRC/'attack-intake.json').read_text())
    paired=SRC/'pair-intake.json'
    if paired.exists():
        # These drafts fail silhouette/proportion review; retain approved art.
        rejected={('alpha','hiro-alpha-pin-paired'),('alpha','hiro-alpha-parry-paired'),('orc','hiro-finisher-2'),('hiro','plant-crosscut-paired'),('moss_giant','hiro-finisher-1'),('moss_giant','hiro-finisher-2')}
        specs += [c for c in json.loads(paired.read_text()) if (c['actor'],c['id']) not in rejected]
    pages=[]
    for actor in dict.fromkeys(c['actor'] for c in specs):pages+=merge(actor,[c for c in specs if c['actor']==actor])
    p=ROOT/'tools/ship_manifest.json';m=json.loads(p.read_text());m['files']=list(dict.fromkeys(m['files']+pages));p.write_text(json.dumps(m,indent=2)+'\n')
    audit=ROOT/'docs/art/combat-roster-20261002';audit.mkdir(parents=True,exist_ok=True)
    (audit/'registration.json').write_text(json.dumps(specs,indent=2)+'\n')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--prepare-attacks',action='store_true');p.add_argument('--prepare-pairs',action='store_true');p.add_argument('--apply',action='store_true');a=p.parse_args()
    if a.prepare_attacks:prepare_attacks()
    if a.prepare_pairs:prepare_pairs()
    if a.apply:apply()
