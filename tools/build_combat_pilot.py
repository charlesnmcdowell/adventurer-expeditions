"""Focused 2026-10-02 intake. Append pages; preserve all unrelated atlas pixels.

Source masters stay in the sibling source-art folder. Run from the repo root.
Re-running replaces only pilot pages/frames and keeps other art revisions.
"""
import copy, json, shutil, tempfile
from pathlib import Path
from PIL import Image
import numpy as np
from art_intake_v2 import build

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v4/combat-20261002'
OUT=ROOT/'assets/expedition'

def clip(id,file,n,cols,rows,ref,ax,ground,durations,contact=None,**extra):
    return dict(id=id,file=file,frames=n,columns=cols,rows=rows,
        registration=dict(referenceHeight=ref,anchorX=ax,groundY=ground),
        durationsMs=durations,contactFramesZeroBased=contact or [],releaseFrameZeroBased=n-1,**extra)

def merge(actor,clips):
    dest=OUT/actor
    doc=json.loads((dest/(actor+'.json')).read_text())
    with tempfile.TemporaryDirectory() as t:
        fresh=build(SRC,actor,t,height=doc['standing'],manifest={'clips':clips})
        prefix=actor+'-pilot-'
        oldcanvas=doc['canvas'];newcanvas=fresh['canvas']
        px=max(oldcanvas['pivot']['x'],newcanvas['pivot']['x'])
        py=max(oldcanvas['pivot']['y'],newcanvas['pivot']['y'])
        cw=px+max(oldcanvas['w']-oldcanvas['pivot']['x'],newcanvas['w']-newcanvas['pivot']['x'])
        ch=py+max(oldcanvas['h']-oldcanvas['pivot']['y'],newcanvas['h']-newcanvas['pivot']['y'])
        textures=[x for x in doc['textures'] if not x['image'].startswith(prefix)]
        names={c['id'] for c in clips}
        for tex in textures:
            tex['frames']=[f for f in tex['frames'] if f['filename'].split('/')[0] not in names]
        for tex in textures:
            for f in tex['frames']:
                f['spriteSourceSize']['x']+=px-oldcanvas['pivot']['x']
                f['spriteSourceSize']['y']+=py-oldcanvas['pivot']['y']
                f['sourceSize']={'w':cw,'h':ch}
        for i,tex in enumerate(fresh['textures']):
            filename=prefix+str(i)+'.webp'
            shutil.copyfile(Path(t)/actor/tex['image'],dest/filename)
            tex['image']=filename
            for f in tex['frames']:
                f['spriteSourceSize']['x']+=px-newcanvas['pivot']['x']
                f['spriteSourceSize']['y']+=py-newcanvas['pivot']['y']
                f['sourceSize']={'w':cw,'h':ch}
            textures.append(tex)
        doc['textures']=textures
        doc['frames']={f['filename']:{**f,'page':i} for i,tex in enumerate(textures) for f in tex['frames']}
        doc['canvas']={'w':cw,'h':ch,'pivot':{'x':px,'y':py}}
        for c in clips:
            old=doc['clips'][c['id']]
            doc['clips'][c['id']]={**old,**fresh['clips'][c['id']]}
            doc['clips'][c['id']]['bodyScale']=1
        (dest/(actor+'.json')).write_text(json.dumps(doc,separators=(',',':')),encoding='utf8')
        return [str((dest/x['image']).relative_to(ROOT)).replace('\\','/') for x in textures]

def main():
    # Explicit chroma matte: green only; black armor and purple hair are retained.
    im=np.array(Image.open(SRC/'hiro-hit.png').convert('RGBA'))
    rgb=im[:,:,:3].astype(float);excess=rgb[:,:,1]-np.maximum(rgb[:,:,0],rgb[:,:,2])
    im[:,:,3]=np.minimum(im[:,:,3],np.clip(255-excess*2,0,255)).astype('uint8')
    im[:,:,1]=np.minimum(rgb[:,:,1],np.clip(np.maximum(rgb[:,:,0],rgb[:,:,2])+15,0,255)).astype('uint8')
    Image.fromarray(im).save(SRC/'hiro-hit-alpha.png')

    slash=clip('slash-l1','hiro-slash.png',12,4,3,286,155,442,
        [55,55,50,50,32,33,37,38,45,45,75,75],[4])
    # Authored rows are uneven; do not cut at mathematical thirds.
    slash['regions']=[];guides=[]
    for i in range(12):
        row=i//4;col=i%4;y=[0,480,840][row];end=[480,840,1254][row]
        x=round(col*1254/4);right=round((col+1)*1254/4)
        slash['regions'].append([x,y,right-x,end-y])
        guides.append(dict(referenceHeight=286,anchorX=155,groundY=[442,800,1185][row]-y))
    # Keep extending blade tips without admitting neighboring bodies.
    slash['regions'][5][2]=379;slash['regions'][6][2]=379
    polygons=[None]*12
    polygons[5]=[[0,0],[314,0],[314,165],[379,190],[379,218],[314,205],[314,360],[0,360]]
    polygons[6]=[[0,0],[314,0],[314,215],[379,250],[379,275],[314,260],[314,360],[0,360]]
    slash['sourceClipPolygons']=polygons;slash['registration']['frames']=guides
    hit=clip('hit-short','hiro-hit-alpha.png',6,3,2,478,270,490,[45,45,52,53,77,78])
    hit['registration']['frames']=[dict(groundY=490 if i<3 else 484) for i in range(6)]
    pages=merge('hiro',[slash,hit])
    attack=clip('attack','alpha-attack.png',12,4,3,230,180,346,
        [60,60,40,40,32,33,40,40,47,48,65,65],[4])
    # Remove only empty sheet-grid gutters, never an opaque creature pixel.
    attack['regions']=[[i%4*362+4,i//4*362+4,354,354] for i in range(12)]
    attack['registration']['anchorX']=176;attack['registration']['groundY']=342
    cleave=clip('hiro-alpha-cleave-paired','alpha-cleave.png',16,4,4,220,90,303,
        [180,60,65,65,75,75,130,80,80,80,95,95,105,105,110,220],[6],
        paired=True,opponentKinds=['wolf','boss'],opponentKeys=['road_wolf_leader'],
        primaryImpactFrameZeroBased=6,victimFullyGoneFrameZeroBased=11,pairTargetDistanceRatio=.65,finalState='drawn-idle')
    cleave['registration']['frames']=[dict(referenceHeight=220 if i<11 else 250,
        anchorX=90 if i<11 else 130,groundY=[303,300,298,284][i//4]) for i in range(16)]
    pages+=merge('alpha',[attack,cleave])
    adult=clip('alpha-fatal','enemy-alpha.png',16,4,4,212,100,310,
        [180,90,80,100,110,110,150,100,100,100,170,110,110,100,140,360],[6,10],paired=True,
        opponentKinds=['hero'],opponentKeys=['hiro'])
    adult['registration']['frames']=[dict(groundY=[310,309,288,270][i//4]) for i in range(16)]
    # Painted columns do not land on a mathematical 313.5-pixel grid.
    # Boundaries follow the empty gutters; otherwise a rear paw is clipped and
    # reappears at the left edge of the next pose.
    bounds=[[0,325,628,941,1254],[0,326,640,941,1254],
            [0,331,642,943,1254],[0,327,636,941,1254]]
    adult['regions']=[]
    for i in range(16):
        row,col=divmod(i,4);x=bounds[row][col];y=round(row*1254/4)
        adult['regions'].append([x,y,bounds[row][col+1]-x,round((row+1)*1254/4)-y])
        adult['registration']['frames'][i]['anchorX']=100+round(col*1254/4)-x
    build(SRC,'alpha-fatal',OUT/'adult',height=320,manifest={'clips':[adult]})
    manifest=ROOT/'tools/ship_manifest.json';m=json.loads(manifest.read_text())
    m['files']=list(dict.fromkeys(m['files']+pages))
    m['dirs']=list(dict.fromkeys(m['dirs']+['assets/expedition/adult']))
    manifest.write_text(json.dumps(m,indent=2)+'\n')
    audit=ROOT/'docs/art/combat-pilot-20261002';audit.mkdir(parents=True,exist_ok=True)
    (audit/'registration.json').write_text(json.dumps({'hiro':[slash,hit],'alpha':[attack,cleave],'adult':[adult]},indent=2)+'\n')
    shutil.copyfile(SRC/'prompts.json',audit/'prompts.json')

if __name__=='__main__':main()
