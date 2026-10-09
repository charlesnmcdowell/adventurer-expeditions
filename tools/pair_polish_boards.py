"""Render registered runtime pairs on a neutral review grid, without editing art."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test/reports/polish';OUT.mkdir(parents=True,exist_ok=True)
actors=['crab','toad','vulture','hydra','elven_wizard','elven_ranger','dark_swordswoman','enchantress','orc']
for actor in actors:
    folder=ROOT/'assets/expedition'/actor;j=json.loads((folder/(actor+'.json')).read_text())
    clips=[(k,c) for k,c in j['clips'].items() if c.get('paired') and k.startswith('hiro-')]
    for k,c in clips:
        board=Image.new('RGB',(1200,240*((len(c['frames'])+3)//4)),(62,67,76));d=ImageDraw.Draw(board)
        fixed=Image.new('RGB',(1800,400*((len(c['frames'])+3)//4)),(62,67,76));fd=ImageDraw.Draw(fixed)
        for i,name in enumerate(c['frames']):
            f=j['frames'][name];r=f['frame'];p=j['textures'][f['page']]['image'];im=Image.open(folder/p).crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
            im.thumbnail((294,210));x=i%4*300+(300-im.width)//2;y=i//4*240+25+210-im.height;board.paste(im,(x,y),im)
            d.text((i%4*300+8,i//4*240+5),str(i)+(' CONTACT' if i in c['contact'] else ''),fill='white')
            raw=Image.open(folder/p).crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
            raw=raw.resize((round(raw.width*.5),round(raw.height*.5)))
            pivot=j['canvas']['pivot'];ss=f['spriteSourceSize'];left=i%4*450+130+round((ss['x']-pivot['x'])*.5);top=i//4*400+350+round((ss['y']-pivot['y'])*.5)
            fixed.paste(raw,(left,top),raw);fd.line((i%4*450,i//4*400+350,(i%4+1)*450,i//4*400+350),fill=(100,100,100));fd.text((i%4*450+8,i//4*400+5),str(i),fill='white')
        board.save(OUT/(actor+'-'+k+'.png'))
        fixed.save(OUT/(actor+'-'+k+'-registered.png'))
