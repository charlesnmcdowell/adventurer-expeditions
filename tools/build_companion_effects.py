"""Pack separated companion effects after checking source-cell alpha edges."""
from pathlib import Path
from PIL import Image
import hashlib,json,sys
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v10/companions-hiro-20261015/effects'
OUT=ROOT/'assets/expedition/story/effects'
second=len(sys.argv)>1 and sys.argv[1]=='support-b'
source='support-b.png' if second else 'support-a-spaced.png'
group='companion-recovery' if second else 'companion-support'
names=['mend','regenerate','defiant_stand','counter_attack'] if second else ['whisper_of_ending','shield_wall','cleanse','thorn_skin']
im=Image.open(SRC/source).convert('RGBA')
atlas=Image.new('RGBA',(1024,1024))
for i in range(16):
    x,y=i%4,i//4
    cell=im.crop((round(x*im.width/4),round(y*im.height/4),round((x+1)*im.width/4),round((y+1)*im.height/4)))
    alpha=cell.getchannel('A')
    edges=[alpha.crop((0,0,cell.width,1)),alpha.crop((0,cell.height-1,cell.width,cell.height)),
           alpha.crop((0,0,1,cell.height)),alpha.crop((cell.width-1,0,cell.width,cell.height))]
    ceiling=12 if second else 2
    assert all(e.getextrema()[1]<=ceiling for e in edges),('Effect crosses cell boundary',i)
    # Remove only the measured faint alpha noise, never crop visible painted
    # effect cores. The second source's cell edges peak at 9/255.
    if second:cell.putalpha(alpha.point(lambda value:0 if value<=ceiling else value))
    cell.thumbnail((224,224),Image.Resampling.LANCZOS)
    atlas.alpha_composite(cell,(x*256+(256-cell.width)//2,y*256+(256-cell.height)//2))
target=SRC/(group+'-runtime.webp');atlas.save(target,lossless=True,method=6)
content=target.read_bytes();name=group+'-'+hashlib.sha256(content).hexdigest()[:12]+'.webp'
(OUT/name).write_bytes(content)
doc=dict(image=name,frameWidth=256,frameHeight=256,columns=4,rows=4,
    clips={name:list(range(i*4,i*4+4)) for i,name in enumerate(names)},source='astra-v10/companions-hiro-20261015/effects/'+source,alphaNoiseCeiling=ceiling if second else 0)
(OUT/(group+'.json')).write_text(json.dumps(doc,indent=2),encoding='utf-8')
print(name,len(content))
