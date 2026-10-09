"""Pack reviewed expansion sources; never modify the original Adventurer tree."""
from pathlib import Path
import json,copy,hashlib,shutil
from PIL import Image
from art_intake_v2 import build
import build_citadel_combat as combat
from build_v3_travel import strip
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'adventurer-expeditions-source-art/astra-v5'
LOCATIONS={'coast-20261008':['crab','toad','vulture','hydra'],'citadel-20261009':['elven_wizard','elven_ranger','dark_swordswoman','enchantress']}

def actors():
    for location,actors in LOCATIONS.items():
        src=SOURCE/location;review=ROOT/'docs/art'/location
        for actor in actors:
            ordinary=json.loads((review/'combat'/f'{actor}-source.json').read_text(encoding='utf8'))
            pairs=json.loads((review/'pairs'/f'{actor}-source.json').read_text(encoding='utf8'))
            man=dict(clips=ordinary['clips']+[c for c in pairs['clips'] if c['id'].startswith('hiro-')])
            doc=build(src,actor,ROOT/'assets/expedition',300,90,man)
            doc['authoredFacing']=-1
            (ROOT/'assets/expedition'/actor/f'{actor}.json').write_text(json.dumps(doc,separators=(',',':')),encoding='utf8')
            fatal=dict(clips=[c for c in pairs['clips'] if c['id'].endswith('-fatal')])
            build(src,actor+'-fatal',ROOT/'assets/expedition/adult',300,90,fatal)

def scenery():
    for location in LOCATIONS:
        loc=location.split('-')[0];src=SOURCE/location;dest=ROOT/'assets/expedition/stages'/loc;dest.mkdir(parents=True,exist_ok=True)
        for layer in ['far','ground','near']:
            Image.open(src/(layer+'.png')).save(dest/('atmosphere-'+layer+'.webp'),'WEBP',quality=90,method=6)

def travel():
    for location in LOCATIONS:
        coast=location.startswith('coast');src=SOURCE/location
        ident='coast-mast-vault' if coast else 'citadel-bridge-leap'
        dest=ROOT/'assets/expedition/travel'/ident;dest.mkdir(parents=True,exist_ok=True)
        im=Image.open(src/'travel-plate.png').convert('RGB');w=round(im.width*760/im.height)
        im.resize((w,760),Image.Resampling.LANCZOS).save(dest/'plate.webp','WEBP',quality=90,method=6)
        combat.SRC=src;fs=combat.extract('travel-actions.png',12)
        ref=370;times=[110,110,130,130,170,200,180,160,130,120,110,110]
        sources=[dict(file=f['file'],frames=1,regions=f['regions'],firstFrameZeroBased=i,sha256=hashlib.sha256((src/f['file']).read_bytes()).hexdigest()) for i,f in enumerate(fs)]
        c=dict(id='travel',frames=12,sources=sources,durationsMs=times,loop=False,contactFramesZeroBased=[2,4,8],releaseFrameZeroBased=11,registration=dict(referenceHeight=ref,frames=[f['guide'] for f in fs]))
        doc=build(src,'actions',dest,300,90,dict(clips=[c]))
        for p in (dest/'actions').iterdir():p.replace(dest/p.name)
        (dest/'actions').rmdir()
        if coast:
            xs=[.18,.27,.35,.4,.47,.54,.61,.69,.77,.83,.9,.96];ys=[650,650,650,610,565,500,480,530,680,680,680,680]
        else:
            xs=[.2,.3,.39,.44,.47,.51,.56,.61,.66,.73,.8,.89];ys=[520,520,520,500,440,390,405,455,540,540,540,540]
        frames=[dict(name='travel/'+str(i),ms=times[i],x=round(x*w),y=ys[i],cameraX=max(0,min(w-1280,round(x*w)-650)),contact=i in c['contactFramesZeroBased']) for i,x in enumerate(xs)]
        loops=[dict(row=0,x=frames[2]['x'],y=ys[2],startMs=sum(times[:2]),scale=.65),dict(row=2,x=frames[4]['x'],y=ys[4]+30,startMs=sum(times[:4]),scale=.65),dict(row=0,x=frames[8]['x'],y=ys[8],startMs=sum(times[:8]),scale=.7)]
        scene=dict(id=ident,width=w,height=760,canvas=doc['canvas'],pivot=doc['canvas']['pivot'],heroScale=1,frames=frames,loops=loops,groundLayerHeight=550 if coast else 450,source=location)
        (dest/'scene.json').write_text(json.dumps(scene,indent=2),encoding='utf8')
        strip(src/'travel-loops.png',dest/'loops.webp')
        for layer in ['far','ground','near']:shutil.copyfile(ROOT/'assets/expedition/stages'/('coast' if coast else 'citadel')/('atmosphere-'+layer+'.webp'),dest/('atmosphere-'+layer+'.webp'))
        (ROOT/'docs/art'/location/'travel-registration.json').write_text(json.dumps(dict(clip=c,scene=scene),indent=2),encoding='utf8')

if __name__=='__main__':
    import sys
    for fn in sys.argv[1:] or ['actors','scenery','travel']:globals()[fn]()
