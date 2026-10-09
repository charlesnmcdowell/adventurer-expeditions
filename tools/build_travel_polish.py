"""Reproducible Oct 9 travel intake. Masters remain outside the game repo."""
from pathlib import Path
import json
from PIL import Image
import build_citadel_combat as extract
from art_intake_v2 import build
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v6/polish-20261009'

def main():
    extract.SRC=SRC
    for loc,ident,ref in [('coast','coast-mast-vault',290),('citadel','citadel-bridge-leap',340)]:
        name=loc+('-glider' if loc=='coast' else '-portal')
        fs=extract.extract(name+'.png',12)
        # Anatomical scale is shared across the sequence; wing/magic bounds
        # must never be used as the hero's body-height measurement.
        times=([160,180,220,210,260,300,300,260,210,220,180,160] if loc=='coast' else [160,150,250,240,230,190,140,180,170,180,160,160])
        sources=[dict(file=f['file'],frames=1,regions=f['regions'],firstFrameZeroBased=i) for i,f in enumerate(fs)]
        dest=ROOT/'assets/expedition/travel'/ident
        c=dict(id='travel',frames=12,sources=sources,durationsMs=times,loop=False,contactFramesZeroBased=[2,9],releaseFrameZeroBased=11,registration=dict(referenceHeight=ref,frames=[f['guide'] for f in fs]))
        doc=build(SRC,'actions',dest,300,92,dict(clips=[c]))
        for p in (dest/'actions').iterdir():p.replace(dest/p.name)
        (dest/'actions').rmdir()
        plate=Image.open(SRC/(loc+'-plate.png')).convert('RGBA').resize((1900,760),Image.Resampling.LANCZOS)
        plate.save(dest/'plate.webp','WEBP',quality=92,method=6)
        if loc=='coast':
            xs=[620,670,740,800,890,990,1080,1180,1290,1390,1480,1550]
            ys=[612,612,612,560,490,460,460,480,545,612,612,612]
        else:
            xs=[620,680,730,760,800,835,1115,1190,1250,1320,1400,1490]
            ys=[612]*12
        frames=[dict(name='travel/'+str(i),ms=times[i],x=x,y=ys[i],cameraX=max(0,min(620,x-650)),contact=i in (2,9)) for i,x in enumerate(xs)]
        if loc=='citadel':
            for f,camera in zip(frames,[0,0,30,80,150,190,190,270,350,430,510,600]):f['cameraX']=camera
        scene=dict(id=ident,width=1900,height=760,canvas=doc['canvas'],pivot=doc['canvas']['pivot'],heroScale=1,frames=frames,loops=[],groundLayerHeight=550 if loc=='coast' else 450,source='astra-v6/polish-20261009',actionStartFrame=0,actionEndFrame=11,layeredPlate=True,plateY=80 if loc=='coast' else 120,travelKind='hang-glide' if loc=='coast' else 'portal-jutsu',teleportAfterFrame=5 if loc=='citadel' else None)
        (dest/'scene.json').write_text(json.dumps(scene,indent=2),encoding='utf8')
        (SRC/(name+'-registration.json')).write_text(json.dumps(dict(clip=c,scene=scene),indent=2),encoding='utf8')
    Image.open(SRC/'city-ground.png').resize((2280,760),Image.Resampling.LANCZOS).save(ROOT/'assets/expedition/travel/city-rooftop-run/atmosphere-ground.webp','WEBP',quality=92,method=6)
    # Alpha-fringe decontamination removes near-transparent red matte pixels.
    import numpy as np
    a=np.array(Image.open(SRC/'city-near.png').convert('RGBA'));mask=(a[:,:,0]>180)&(a[:,:,1]<70)&(a[:,:,2]<70)&(a[:,:,3]>0);a[mask,3]=0
    Image.fromarray(a).resize((2280,760),Image.Resampling.LANCZOS).save(ROOT/'assets/expedition/travel/city-rooftop-run/atmosphere-near.webp','WEBP',quality=92,method=6)
    for folder in ['stages/citadel','travel/citadel-bridge-leap']:
        Image.open(SRC/'citadel-near.png').resize((2280,760),Image.Resampling.LANCZOS).save(ROOT/'assets/expedition'/folder/'atmosphere-near.webp','WEBP',quality=92,method=6)

if __name__=='__main__':main()
