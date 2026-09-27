"""Register painted travel actions and contact timelines, then pack runtime WebP."""
from pathlib import Path
import json, hashlib
from PIL import Image
from art_intake_v2 import build, key_cell
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v3'
OUT=ROOT/'assets/expedition/travel'

def strip(source,dest,size=(256,192),regions=None):
    im=Image.open(source).convert('RGBA'); out=Image.new('RGBA',(size[0]*4,size[1]*3))
    for i in range(12):
        if regions: x,y,w,h=regions[i]
        else:
            x=round(i%4*im.width/4); y=round(i//4*im.height/3)
            w=round((i%4+1)*im.width/4)-x; h=round((i//4+1)*im.height/3)-y
        cell,_=key_cell(im.crop((x,y,x+w,y+h)))
        out.paste(cell.resize(size,Image.Resampling.LANCZOS),(i%4*size[0],i//4*size[1]))
    dest.parent.mkdir(parents=True,exist_ok=True); out.save(dest,'WEBP',quality=84,method=6)

def make(id):
    src=SRC/'travel'/id; dest=OUT/id; dest.mkdir(parents=True,exist_ok=True)
    forest=id=='forest-carriage-vault'; swamp=id=='swamp-log-slide'; market=id=='city-market-vault'
    plate=Image.open(src/('clean-plate-wide-v1.png' if forest else 'clean-plate.png')).convert('RGB')
    width=round(plate.width*760/plate.height)
    plate.resize((width,760),Image.Resampling.LANCZOS).save(dest/'plate.webp','WEBP',quality=87,method=6)
    file='hiro-hop-actions-v1.png' if forest else 'hiro-actions.png'
    im=Image.open(src/file); cw=im.width/3; ch=im.height/4
    ref=330 if forest else ch*.92
    sources=[dict(file=file,frames=12,columns=3,rows=4)]
    c=dict(id='travel',file=file,frames=12,columns=3,rows=4,durationsMs=[160,150,160,160,210,240,210,180,180,160,160,160],
           loop=False,contactFramesZeroBased=[2,3,8],releaseFrameZeroBased=11,
           registration=dict(referenceHeight=ref,anchorX=cw*.5,groundY=ch*.96))
    # Translation follows planted soles (or the slide's contact shadow), while
    # body scale remains constant. Generated cell padding is not a ground line.
    planted=list(range(12)) if swamp else ([0,1,8,9,10,11] if market else [0,1,6,7,8,9,10,11] if not forest else [0,2,3,8,9,10])
    guides=[{} for _ in range(12)]
    for i in planted:
        x=round(i%3*cw);y=round(i//3*ch)
        cell=im.crop((x,y,round((i%3+1)*cw),round((i//3+1)*ch))).convert('RGBA')
        alpha=cell.getchannel('A').point(lambda a:255 if a>96 else 0)
        box=alpha.getbbox()
        if box:guides[i]['groundY']=box[3]
    c['registration']['frames']=guides
    if not forest and not swamp and not market and (src/'ledge-grip-frame.png').exists():
        # A complete replacement pose replaces the generator's clipped boot.
        f=Image.open(src/'ledge-grip-frame.png'); _,box=key_cell(f)
        sources=[]
        for i in range(12):
            if i==4:
                sources.append(dict(file='ledge-grip-frame.png',frames=1,columns=1,rows=1,firstFrameZeroBased=i))
            else:
                x=round(i%3*cw);y=round(i//3*ch)
                sources.append(dict(file=file,frames=1,regions=[[x,y,round((i%3+1)*cw)-x,round((i//3+1)*ch)-y]],firstFrameZeroBased=i))
        c['sources']=sources
        c['registration']['frames'][4]=dict(referenceHeight=(box[3]-box[1])*.83,anchorX=(box[0]+box[2])/2,groundY=box[3])
    man=dict(version=3,clips=[c]); (src/'runtime-registration.json').write_text(json.dumps(man,indent=2),encoding='utf-8')
    doc=build(src,'actions',dest,300,82,man)
    # build puts an actor subdirectory around its bundle; flatten inside this beat.
    for p in (dest/'actions').iterdir(): p.replace(dest/p.name)
    (dest/'actions').rmdir()
    if forest:
        xs=[640,790,970,1090,1260,1440,1640,1840,2080,2170,2260,2390]
        ys=[610,610,610,610,500,445,445,485,610,610,610,610]
        loops=[dict(row=0,x=1090,y=615,startMs=470),dict(row=1,x=1090,y=615,startMs=470),dict(row=2,x=1500,y=570,startMs=680),dict(row=1,x=2080,y=615,startMs=1470)]
    elif swamp:
        xs=[450,590,710,790,940,1130,1380,1540,1680,1770,1880,2010]
        ys=[625]*12
        loops=[dict(row=0,x=800,y=625,startMs=470),dict(row=1,x=1120,y=625,startMs=650),dict(row=1,x=1560,y=625,startMs=1260),dict(row=2,x=450,y=700,continuous=True,alpha=.65)]
    elif market:
        xs=[550,700,830,1020,1190,1340,1500,1660,1800,1900,2020,2160]
        ys=[650,650,615,540,495,495,490,575,650,650,650,650]
        loops=[dict(row=0,x=1560,y=635,continuous=True,alpha=.65),dict(row=1,x=1330,y=455,startMs=630,scale=.65),dict(row=2,x=1830,y=650,startMs=1450)]
    else:
        xs=[530,660,810,930,1000,1100,1240,1370,1480,1620,1770,1930]
        ys=[530,530,480,450,630,390,300,290,290,280,270,255]
        loops=[dict(row=0,x=1450,y=140,startMs=850,scale=.55),dict(row=1,x=1120,y=285,startMs=850,scale=.6),dict(row=2,x=1000,y=650,continuous=True,scale=.55)]
    frames=[]
    for i,(x,y) in enumerate(zip(xs,ys)):
        frames.append(dict(name='travel/'+str(i),ms=c['durationsMs'][i],x=x,y=y,cameraX=max(0,min(width-1280,x-650)),contact=i in c['contactFramesZeroBased']))
    scene=dict(id=id,width=width,height=760,canvas=doc['canvas'],pivot=doc['canvas']['pivot'],heroScale=1,frames=frames,loops=loops,source=str(src.name))
    (dest/'scene.json').write_text(json.dumps(scene,indent=2),encoding='utf-8')
    regions=None
    if forest:
        xc=[0,360,739,1100,1448];yc=[0,400,800,1086]
        regions=[[xc[i%4],yc[i//4],xc[i%4+1]-xc[i%4],yc[i//4+1]-yc[i//4]] for i in range(12)]
    strip(src/('environment-loops-v1.png' if forest else 'environment-loops.png'),dest/'loops.webp',regions=regions)

if __name__=='__main__':
    import sys
    for id in sys.argv[1:] or ['forest-carriage-vault','swamp-log-slide','city-market-vault','city-rooftop-run']:make(id)
    for loc in ['swamp','city']:strip(SRC/'effects'/loc/'defeat.png',ROOT/'assets/expedition/effects'/(loc+'.webp'),(256,256))
