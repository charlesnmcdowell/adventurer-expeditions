#!/usr/bin/env python3
"""Register each painted sheet in body units, preserve source alpha, pack Phaser multiatlases."""
import argparse, hashlib, json, math, shutil, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import numpy as np
from scipy import ndimage

def discard_neighbor_fragments(img):
    """Discard only tiny edge-connected pieces accidentally crossing sheet cells.

    Main figures and detached interior particles remain. This is crop hygiene,
    not silhouette reshaping; a pose must still have its authored body scale.
    """
    pixels=np.array(img); a=pixels[:,:,3]
    labels,count=ndimage.label(a>32)
    if not count:return img
    sizes=np.bincount(labels.ravel()); sizes[0]=0
    limit=max(128,int(sizes.max()*.015))
    edge=np.unique(np.concatenate([labels[:3].ravel(),labels[-3:].ravel(),labels[:,:3].ravel(),labels[:,-3:].ravel()]))
    remove=[n for n in edge if n and sizes[n]<limit]
    if remove:pixels[np.isin(labels,remove)]=0
    pixels[pixels[:,:,3]<8]=0
    return Image.fromarray(pixels)

def key_cell(cell, tol=22, enclosed_tol=7):
    cell=cell.convert('RGBA'); alpha=cell.getchannel('A')
    if alpha.getextrema()[0]<20 and sum(alpha.histogram()[:20])>cell.width*cell.height*.01:
        return cell,alpha.getbbox()
    w,h=cell.size;px=cell.load()
    border=[px[x,y] for x in range(2,max(3,w-2)) for y in (min(2,h-1),max(0,h-3))]
    border += [px[x,y] for y in range(2,max(3,h-2)) for x in (min(2,w-1),max(0,w-3))]
    bg=tuple(sorted(c[i] for c in border)[len(border)//2] for i in range(3))
    arr=np.array(cell); rgb=arr[:,:,:3].astype(np.int16)
    matte=np.max(np.abs(rgb-np.array(bg)),axis=2)<=tol
    seeds=np.zeros((h,w),dtype=bool)
    seeds[:2]=matte[:2]; seeds[-2:]=matte[-2:]
    seeds[:,:2]=matte[:,:2]; seeds[:,-2:]=matte[:,-2:]
    # Seed only actual matte pixels. Unconditionally clearing the first two
    # rows/columns clips the approved wolf paw and blade tips near cell edges.
    gone=ndimage.binary_propagation(seeds,mask=matte)
    # Flat enclosed matte islands (under an elbow / inside a weapon grip) do
    # not connect to the outer flood. Remove broad near-exact-color patches;
    # retain narrow steel highlights and small painted details.
    near=(np.max(np.abs(rgb-np.array(bg)),axis=2)<=enclosed_tol)&~gone
    labels,count=ndimage.label(near)
    sizes=np.bincount(labels.ravel())
    # An enclosed vine loop is concave and can occupy under30% of its bounding
    # box. Detect a substantial interior patch instead of requiring that a
    # matte island be roughly rectangular. Thin blade glints have no such core.
    cores=np.bincount(labels[ndimage.binary_erosion(near,iterations=3)],minlength=len(sizes))
    for lab,slc in enumerate(ndimage.find_objects(labels),1):
        if slc is None or sizes[lab]<128:continue
        hh=slc[0].stop-slc[0].start;ww=slc[1].stop-slc[1].start
        if min(hh,ww)>6 and (sizes[lab]/(hh*ww)>.3 or cores[lab]>=max(64,sizes[lab]*.25)):
            gone[labels==lab]=True
    # The white boards also contain enclosed negative spaces. Bram's shirt is
    # warm cream; narrow silver detail on gray boards must remain untouched.
    if min(bg)>245:gone|=(rgb.min(axis=2)>247)&(rgb.max(axis=2)-rgb.min(axis=2)<4)
    arr[gone]=0;out=Image.fromarray(arr)
    return out,out.getchannel('A').getbbox()

def clip_polygon(cell,polygon):
    """Apply the authored cell boundary, including overlapping run sheet cells."""
    if not polygon:return cell
    if len(polygon)<3:raise ValueError('A source clip polygon needs at least three vertices')
    if any(len(p)!=2 or not 0<=p[0]<=cell.width or not 0<=p[1]<=cell.height for p in polygon):
        raise ValueError('Source clip polygon lies outside its cell')
    mask=Image.new('L',cell.size,0)
    ImageDraw.Draw(mask).polygon([tuple(p) for p in polygon],fill=255)
    cell=cell.copy();cell.putalpha(ImageChops.multiply(cell.getchannel('A'),mask))
    return cell

def source_frames(c):
    """Yield a validated clip-local timeline, independently of source grid size."""
    sources=c.get('sources') or [dict(file=c['file'],frames=c['frames'],columns=c.get('columns'),rows=c.get('rows'),regions=c.get('regions'))]
    timeline=[]
    for si,s in enumerate(sources):
        first=s.get('firstFrameZeroBased',len(timeline))
        if first!=len(timeline):raise ValueError(c['id']+': noncontiguous source timeline')
        for local in range(s['frames']):timeline.append((si,s,local))
    if len(timeline)!=c['frames']:raise ValueError(c['id']+': source/frame count mismatch')
    for ix,(si,s,local) in enumerate(timeline):
        if c.get('sourceIndices') and c['sourceIndices'][ix]!=si:raise ValueError(c['id']+': inconsistent source index')
        if c.get('frameFiles') and c['frameFiles'][ix]!=s['file']:raise ValueError(c['id']+': inconsistent frame file')
        yield ix,si,s,local

def anchor_x(img,box):
    x0,y0,x1,y1=box;top=y1-max(1,(y1-y0)//5);px=img.load();mass=total=0
    for y in range(top,y1):
        for x in range(x0,x1):
            a=px[x,y][3]
            if a>96:mass+=x*a;total+=a
    return mass/total if total else (x0+x1)/2

def pack_pages(frames,max_w,max_h,pad=2):
    pages=[];positions={}
    for k in sorted(range(len(frames)),key=lambda n:-frames[n]['img'].height):
        w,h=frames[k]['img'].size;w+=pad*2;h+=pad*2
        if w>max_w or h>max_h:raise ValueError('One frame exceeds texture cap')
        placed=False
        for pi,p in enumerate(pages):
            for shelf in p['shelves']:
                if h<=shelf['h'] and shelf['x']+w<=max_w:
                    x,y=shelf['x'],shelf['y'];shelf['x']+=w;p['w']=max(p['w'],shelf['x']);placed=True;break
            if not placed and p['h']+h<=max_h:
                x,y=0,p['h'];p['shelves'].append(dict(x=w,y=y,h=h));p['h']+=h;p['w']=max(p['w'],w);placed=True
            if placed:break
        if not placed:
            pi=len(pages);x=y=0;pages.append(dict(w=w,h=h,shelves=[dict(x=w,y=0,h=h)]))
        positions[k]=(pi,x+pad,y+pad)
    return pages,positions

def build(src,hero,out,height=360,quality=82,manifest=None,clip_ids=None,max_w=2048,max_h=4096,tolerance=22):
    src=Path(src);out=Path(out)/hero
    man=manifest if isinstance(manifest,dict) else json.loads(Path(manifest or src/'manifest.json').read_text(encoding='utf-8-sig'))
    clips=[c for c in man['clips'] if not clip_ids or c['id'] in clip_ids]
    if len({c['id'] for c in clips})!=len(clips):raise ValueError('Duplicate clip id')
    frames=[];audit=[]
    for c in clips:
        reg=c.get('registration',{});sheets={};source_root=Path(c.get('sourceRoot',src))
        guides_list=reg.get('frames') or [{}]*c['frames']
        if len(guides_list)!=c['frames']:raise ValueError(c['id']+': registration/frame count mismatch')
        for ix,si,source,i in source_frames(c):
            if si not in sheets:
                source_path=source_root/source['file']
                expected=source.get('sha256') or (c.get('sha256') if not c.get('sources') else None)
                if expected and hashlib.sha256(source_path.read_bytes()).hexdigest()!=expected:
                    raise ValueError(c['id']+': source hash changed: '+source['file'])
                sheets[si]=Image.open(source_path).convert('RGBA')
            sheet=sheets[si]
            cols=source.get('columns') or c.get('columns');rows=source.get('rows') or c.get('rows')
            if source.get('regions'):x,y,w,h=source['regions'][i]
            elif c.get('regions'):x,y,w,h=c['regions'][ix]
            else:
                if not cols or not rows:raise ValueError(c['id']+': missing source grid or rectangles')
                co=i%cols;r=i//cols;x=round(co*sheet.width/cols);y=round(r*sheet.height/rows)
                w=round((co+1)*sheet.width/cols)-x;h=round((r+1)*sheet.height/rows)-y
            if min(x,y)<0 or min(w,h)<=0 or x+w>sheet.width or y+h>sheet.height:raise ValueError(f'{hero}/{c["id"]}: invalid source rectangle')
            cell=sheet.crop((x,y,x+w,y+h))
            authored_alpha=sum(cell.getchannel('A').histogram()[:20])>w*h*.01
            rgba,box=key_cell(cell,source.get('matteTolerance',c.get('matteTolerance',tolerance)),
                source.get('enclosedMatteTolerance',c.get('enclosedMatteTolerance',7)))
            polygons=source.get('sourceClipPolygons')
            polygon=polygons[i] if polygons else (c.get('sourceClipPolygons') or [None]*c['frames'])[ix]
            # Matte removal precedes this mask: the transparent polygon margin
            # must never trick the alpha test into skipping RGB-board keying.
            rgba=clip_polygon(rgba,polygon)
            if not authored_alpha and not polygon:rgba=discard_neighbor_fragments(rgba)
            box=rgba.getchannel('A').getbbox()
            if not box:raise ValueError(f'{hero}/{c["id"]}/{ix}: empty foreground')
            guides=guides_list[ix]
            ref=guides.get('referenceHeight',source.get('referenceHeight',reg.get('referenceHeight')))
            if not ref or ref<=0:raise ValueError(f'{hero}/{c["id"]}: missing authored body scale')
            scale=height/ref
            ax=guides.get('anchorX',reg.get('anchorX',anchor_x(rgba,box)))
            ay=guides.get('groundY',reg.get('groundY',box[3]))
            crop=rgba.crop(box);sw,sh=crop.size
            crop=crop.resize((max(1,round(sw*scale)),max(1,round(sh*scale))),Image.Resampling.LANCZOS)
            frames.append(dict(clip=c['id'],i=ix,img=crop,ax=(ax-box[0])*scale,ay=(ay-box[1])*scale))
            audit.append(dict(clip=c['id'],frame=ix,source=source['file'],sourceIndex=si,region=[x,y,w,h],
                sourceClipPolygon=polygon,authoredAlpha=authored_alpha,foreground=list(box),referenceHeight=ref,
                scale=scale,anchor=[ax,ay],scaledBodyHeight=height))
        print(f'{hero}/{c["id"]}: {c["frames"]} registered frames',flush=True)
    half=math.ceil(max(max(f['ax'],f['img'].width-f['ax']) for f in frames))+2
    above=math.ceil(max(f['ay'] for f in frames))+2
    below=max(0,math.ceil(max(f['img'].height-f['ay'] for f in frames)))+2
    cw,ch=half*2,above+below
    pages,pos=pack_pages(frames,max_w,max_h)
    images=[Image.new('RGBA',(p['w'],p['h']),(0,0,0,0)) for p in pages]
    textures=[dict(image=f'{hero}-{i}.webp',format='RGBA8888',size=dict(w=p['w'],h=p['h']),scale=1,frames=[]) for i,p in enumerate(pages)]
    all_frames={}
    for k,f in enumerate(frames):
        pi,x,y=pos[k];im=f['img'];images[pi].paste(im,(x,y))
        entry=dict(filename=f'{f["clip"]}/{f["i"]}',frame=dict(x=x,y=y,w=im.width,h=im.height),rotated=False,trimmed=True,
                   spriteSourceSize=dict(x=round(half-f['ax']),y=round(above-f['ay']),w=im.width,h=im.height),sourceSize=dict(w=cw,h=ch))
        textures[pi]['frames'].append(entry);all_frames[entry['filename']]={**entry,'page':pi}
    result_clips={}
    for c in clips:
        n=c['frames'];dur=c.get('durationsMs') or [round(c.get('durationMsDraft',n*100)/n)]*n
        if len(dur)!=n or any(v<=0 for v in dur):raise ValueError(c['id']+': invalid frame holds')
        contacts=c.get('contactFramesZeroBased',[]);release=c.get('releaseFrameZeroBased',n-1)
        if any(v<0 or v>=n for v in contacts+[release]):raise ValueError(c['id']+': invalid contact/release')
        result_clips[c['id']]=dict(frames=[f'{c["id"]}/{i}' for i in range(n)],contact=c.get('contactFramesZeroBased',[]),
            release=c.get('releaseFrameZeroBased',n-1),durationMs=sum(dur),frameDurationsMs=dur,frameMs=round(sum(dur)/n),
            loop=c.get('loop',c['id'] in ('idle','idle-sheathed','walk')),impact=c.get('impactDraft'),paired=bool(c.get('paired')),
            opponentKinds=c.get('opponentKinds',[]),opponentKeys=c.get('opponentKeys',[]),timingGreenlit=False,
            source=c.get('file'),sources=[s['file'] for s in c.get('sources',[])],registrationApproved=False)
        for source_key,output_key in [('primaryImpactFrameZeroBased','primaryImpactFrame'),
                ('victimFullyGoneFrameZeroBased','victimFullyGoneFrame'),('finalState','finalState'),
                ('pairTargetDistanceRatio','pairTargetDistanceRatio'),('footContactFramesZeroBased','footContact'),
                ('flightFramesZeroBased','flight')]:
            if source_key in c:result_clips[c['id']][output_key]=c[source_key]
        ca=[f for f in audit if f['clip']==c['id']]
        result_clips[c['id']]['sourceRegistration']=dict(
            referenceHeights=[f['referenceHeight'] for f in ca],
            maskedFrames=[f['frame'] for f in ca if f['sourceClipPolygon']],
            authoredAlphaFrames=[f['frame'] for f in ca if f['authoredAlpha']])
    out.mkdir(parents=True,exist_ok=True)
    doc=dict(textures=textures,frames=all_frames,meta=dict(app='tools/art_intake_v2.py',multiatlas=True,source=hero,pages=[t['image'] for t in textures]),
             hero=hero,canvas=dict(w=cw,h=ch,pivot=dict(x=half,y=above)),standing=height,clips=result_clips)
    # Complete encoding before replacing the live atlas. Never leave a half
    # written JSON after a failed source validation or WebP encode.
    with tempfile.TemporaryDirectory(prefix=hero+'-intake-') as tmp:
        temp=Path(tmp)
        for tex,im in zip(textures,images):im.save(temp/tex['image'],'WEBP',quality=quality,method=6)
        (temp/f'{hero}.json').write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
        for tex in textures:shutil.copyfile(temp/tex['image'],out/tex['image'])
        shutil.copyfile(temp/f'{hero}.json',out/f'{hero}.json')
    # Remove only obsolete numbered pages from this explicitly resolved actor
    # folder. Source masters, alternate art and other actors are untouched.
    expected_pages={t['image'] for t in textures}
    for old in out.glob(hero+'-*.webp'):
        if old.stem[len(hero)+1:].isdigit() and old.name not in expected_pages:
            if old.resolve().parent!=out.resolve():raise ValueError('Unsafe stale atlas path')
            old.unlink()
    report=Path('test/reports/registration');report.mkdir(parents=True,exist_ok=True)
    (report/f'{hero}.json').write_text(json.dumps(dict(hero=hero,frames=audit,atlasPages=len(pages),standing=height),indent=2),encoding='utf-8')
    print(f'{hero}: {len(frames)} frames, {len(pages)} pages, {sum((out/t["image"]).stat().st_size for t in textures)/1e6:.3f} MB WebP',flush=True)
    return doc

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--src',required=True);p.add_argument('--hero',default='hiro');p.add_argument('--manifest');p.add_argument('--out',default='assets/expedition');p.add_argument('--height',type=int,default=360);p.add_argument('--quality',type=int,default=82);p.add_argument('--clips',default='');p.add_argument('--max-width',type=int,default=2048);p.add_argument('--max-height',type=int,default=4096);p.add_argument('--tolerance',type=int,default=22)
    a=p.parse_args();build(a.src,a.hero,a.out,a.height,a.quality,a.manifest,a.clips.split(',') if a.clips else None,a.max_width,a.max_height,a.tolerance)
