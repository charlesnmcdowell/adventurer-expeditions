"""Targeted technical cleanup. No generated/repainted art. Originals live in Git.

--audit only writes reports. --apply rebuilds plant lash crops, removes the orc
finisher matte, and records the measured Alpha cleave body-scale correction.
Run after upstream art rebuilds; only the three named actors are changed.
"""
from pathlib import Path
import argparse, copy, json, subprocess, hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
from art_intake_v2 import build, discard_neighbor_fragments

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/expedition'
REPORT=ROOT/'test/reports/sprite-cleanup'
BASELINE='a0589af'

def original(rel):
    return subprocess.check_output(['git','show',BASELINE+':'+rel],cwd=ROOT)

def backup():
    for actor in ('plant','orc','alpha'):
        dst=REPORT/'before'/actor;dst.mkdir(parents=True,exist_ok=True)
        rel='assets/expedition/'+actor+'/'
        data=original(rel+actor+'.json');(dst/(actor+'.json')).write_bytes(data)
        doc=json.loads(data)
        for name in doc['meta']['pages']:(dst/name).write_bytes(original(rel+name))

def frame_image(root,actor,doc,name):
    f=doc['frames'][name];r=f['frame']
    return Image.open(root/actor/doc['meta']['pages'][f['page']]).convert('RGBA').crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))

def audit(label):
    rows=[];REPORT.mkdir(parents=True,exist_ok=True)
    for p in sorted(ASSETS.glob('*/*.json')):
        d=json.loads(p.read_text(encoding='utf-8'))
        if not isinstance(d,dict) or 'clips' not in d or 'frames' not in d or 'pages' not in d.get('meta',{}):continue
        pages={i:Image.open(p.parent/n).convert('RGBA') for i,n in enumerate(d['meta']['pages'])}
        for name,c in d['clips'].items():
            suspect=[]
            for fname in c['frames']:
                f=d['frames'][fname];r=f['frame'];a=np.array(pages[f['page']].crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])))
                corners=np.array([a[0,0],a[0,-1],a[-1,0],a[-1,-1]])
                # Heuristic only: legitimate sparks can reach a corner too.
                if np.count_nonzero(corners[:,3]>16)>=2:suspect.append(fname)
            rows.append(dict(actor=p.parent.name,clip=name,frames=len(c['frames']),paired=c.get('paired',False),
                suspectCornerFrames=suspect,registrationRecorded=bool(c.get('sourceRegistration'))))
    (REPORT/(label+'-audit.json')).write_text(json.dumps(rows,indent=2),encoding='utf-8')
    print(label,len(rows),'clips audited;',sum(bool(r['suspectCornerFrames']) for r in rows),'corner-matte flags (review required)')

def clean_orc_matte(image):
    """Segment solid figures with GrabCut; preserve blue FX with soft chroma alpha.

    This targeted mask is for the existing orc sheets, not a universal keyer.
    Requires OpenCV, NumPy, SciPy and Pillow; no generative service is used.
    """
    import sys
    sys.path.insert(0,str(REPORT/'python'))
    import cv2
    a=np.array(image).copy();rgb=a[:,:,:3].astype(float);alpha=a[:,:,3].astype(float)
    chroma=rgb.max(2)-rgb.min(2);value=rgb.mean(2)
    # Seed cutout segmentation with opaque character paint, not the gray board.
    gray=(chroma<34)&(value>75)&(value<210)
    mask=np.full(alpha.shape,cv2.GC_PR_BGD,np.uint8)
    mask[(alpha>215)&~gray]=cv2.GC_PR_FGD
    seeds=(alpha>244)&((chroma>36)|(value<72))
    mask[ndimage.binary_erosion(seeds,iterations=1)]=cv2.GC_FGD
    mask[(alpha<30)|((alpha<180)&gray)]=cv2.GC_BGD
    blue_fx=(rgb[:,:,2]>rgb[:,:,0]+12)&(rgb[:,:,2]>rgb[:,:,1]+3)&(value>105)
    # Colored disintegration is composited separately; it must not teach the
    # body segmenter that the broad translucent effect backdrop is solid skin.
    mask[blue_fx]=cv2.GC_BGD
    mask[:2]=cv2.GC_BGD;mask[-2:]=cv2.GC_BGD;mask[:,:2]=cv2.GC_BGD;mask[:,-2:]=cv2.GC_BGD
    cv2.setRNGSeed(1)
    cv2.grabCut(a[:,:,:3].copy(),mask,None,np.zeros((1,65)),np.zeros((1,65)),4,cv2.GC_INIT_WITH_MASK)
    body=(mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD)
    # Preserve luminous blue/purple effects separately, with soft chroma alpha.
    glow=np.maximum(rgb[:,:,2]-rgb[:,:,0],np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1])
    glow_alpha=np.clip((glow-22)*6,0,255)
    soft=ndimage.gaussian_filter(body.astype(float),.45)*255
    a[:,:,3]=np.minimum(alpha,np.maximum(soft,glow_alpha)).astype(np.uint8)
    a[a[:,:,3]<8]=0
    return Image.fromarray(a)

def apply():
    backup()
    # Orc: preserve every atlas rectangle, pivot, timing and colored effect.
    d=json.loads((REPORT/'before/orc/orc.json').read_text())
    pages={i:Image.open(REPORT/'before/orc'/n).convert('RGBA') for i,n in enumerate(d['meta']['pages'])}
    for cname,c in d['clips'].items():
        if not c.get('paired'):continue
        for name in c['frames']:
            r=d['frames'][name]['frame'];page=pages[d['frames'][name]['page']]
            cell=page.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
            page.paste(clean_orc_matte(cell),(r['x'],r['y']))
    # Lossless keeps unaffected pixels byte-identical after decode.
    for i,im in pages.items():
        name=f'orc-clean-{i}.webp'
        im.save(ASSETS/'orc'/name,lossless=True,method=6)
        d['meta']['pages'][i]=name;d['textures'][i]['image']=name
    (ASSETS/'orc/orc.json').write_text(json.dumps(d,separators=(',',':')),encoding='utf-8')

    # Plant: extended vines/roots do not obey a uniform 3-column grid.
    man=json.loads((ROOT/'tools/art_registration/plant.json').read_text())
    lash=next(c for c in man['clips'] if c['id']=='lash')
    lash['regions']=[[0,0,512,512],[512,0,498,512],[1010,0,526,512],
                     [0,512,612,512],[595,512,515,512],[1090,512,446,512]]
    lash['sourceClipPolygons']=[None,None,None,None,
        [[0,0],[515,0],[515,512],[55,512],[55,420],[0,420]],
        [[22,0],[446,0],[446,512],[22,512],[22,400],[0,330],[0,240],[22,200]]]
    lash['registration']['frames']=[dict(anchorX=x,groundY=y,referenceHeight=460) for x,y in
        [(285,495),(288,503),(350,506),(417,485),(309,487),(270,480)]]
    # Rebuild to scratch, then replace only lash pixels in a repacked atlas.
    # Other plant clips retain their original decoded pixels/registration below.
    scratch=REPORT/'rebuilt'
    rebuilt=build(ROOT.parent/'adventurer-expeditions-source-art/astra-v1/beasts','plant',scratch,
                  height=200,quality=90,manifest=man,clip_ids=['lash'])
    old=json.loads((REPORT/'before/plant/plant.json').read_text())
    pack_plant(old,rebuilt,scratch)

    # Cleave's first standing Hiro is ~245 px tall, not the assumed 320 px.
    # Scale the pair uniformly; do NOT independently warp either character.
    d=json.loads((REPORT/'before/alpha/alpha.json').read_text())
    c=d['clips']['hiro-alpha-cleave-paired']
    c['bodyScale']=320/245
    c['pairTargetDistanceRatio']=.94
    c['cleanupNote']='Measured standing Hiro ~245 source px; previous body reference 320. Uniform correction only; pin/parry proportions still require art review.'
    (ASSETS/'alpha/alpha.json').write_text(json.dumps(d,separators=(',',':')),encoding='utf-8')
    (REPORT/'plant-lash-manifest.json').write_text(json.dumps(man,indent=2),encoding='utf-8')

def pack_plant(old,new,scratch):
    from art_intake_v2 import pack_pages
    frames=[]
    for name,meta in old['frames'].items():
        changed=name.startswith('lash/')
        d=new if changed else old
        im=frame_image(scratch if changed else REPORT/'before','plant',d,name)
        if changed:im=discard_neighbor_fragments(im)
        m=d['frames'][name];pivot=d['canvas']['pivot'];offset=m['spriteSourceSize']
        frames.append(dict(name=name,img=im,ax=pivot['x']-offset['x'],ay=pivot['y']-offset['y']))
    import math
    half=math.ceil(max(max(f['ax'],f['img'].width-f['ax']) for f in frames))+2
    above=math.ceil(max(f['ay'] for f in frames))+2
    below=max(0,math.ceil(max(f['img'].height-f['ay'] for f in frames)))+2
    cw,ch=half*2,above+below
    pages,pos=pack_pages(frames,2048,4096,pad=4)
    images=[Image.new('RGBA',(p['w'],p['h'])) for p in pages]
    old['textures']=[dict(image=f'plant-clean-{i}.webp',format='RGBA8888',size=dict(w=p['w'],h=p['h']),scale=1,frames=[]) for i,p in enumerate(pages)]
    for i,f in enumerate(frames):
        page,x,y=pos[i];im=f['img'];images[page].paste(im,(x,y))
        m=dict(filename=f['name'],frame=dict(x=x,y=y,w=im.width,h=im.height),rotated=False,trimmed=True,
            spriteSourceSize=dict(x=round(half-f['ax']),y=round(above-f['ay']),w=im.width,h=im.height),sourceSize=dict(w=cw,h=ch))
        old['textures'][page]['frames'].append(m);old['frames'][f['name']]={**m,'page':page}
    old['canvas']=dict(w=cw,h=ch,pivot=dict(x=half,y=above))
    old['meta']['pages']=[t['image'] for t in old['textures']]
    old['clips']['lash']['sourceRegistration']=new['clips']['lash']['sourceRegistration']
    for t,im in zip(old['textures'],images):im.save(ASSETS/'plant'/t['image'],lossless=True,method=6)
    (ASSETS/'plant/plant.json').write_text(json.dumps(old,separators=(',',':')),encoding='utf-8')

def contact_sheet(label,root):
    items=[('orc','hiro-finisher-2/'+str(i)) for i in range(6)]+[('plant','lash/'+str(i)) for i in range(6)]
    board=Image.new('RGB',(1200,1800),(37,47,65));draw=ImageDraw.Draw(board)
    for j,(actor,name) in enumerate(items):
        d=json.loads((root/actor/(actor+'.json')).read_text());im=frame_image(root,actor,d,name)
        im.thumbnail((390,400));x=(j%3)*400;y=(j//3)*450
        board.paste(im,(x,y+25),im);draw.text((x+8,y+6),actor+' '+name,fill='white')
    board.save(REPORT/(label+'-contact.jpg'))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');a=p.parse_args()
    REPORT.mkdir(parents=True,exist_ok=True)
    if a.apply:
        apply();audit('after');contact_sheet('before',REPORT/'before');contact_sheet('after',ASSETS)
    else:backup();audit('before');contact_sheet('before',ASSETS)
