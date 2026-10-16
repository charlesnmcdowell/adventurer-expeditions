"""Decode every companion frame and write reproducible ground-line review sheets."""
import hashlib, json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test/reports/story/companions/art-20261016'
OUT.mkdir(parents=True,exist_ok=True)
reports=[]
for atlas in sorted((ROOT/'assets/expedition').glob('companion_*/*.json')):
 d=json.loads(atlas.read_text()); pages=[Image.open(atlas.parent/t['image']).convert('RGBA') for t in d['textures']]
 report={'actor':atlas.stem,'clips':{}}
 board=Image.new('RGB',(1280,1080),'#28343d');draw=ImageDraw.Draw(board)
 for row,(name,clip) in enumerate(d['clips'].items()):
  hashes=[]
  for i,key in enumerate(clip['frames']):
   f=d['frames'][key];r=f['frame'];p=pages[f['page']]
   assert 0<=r['x']<r['x']+r['w']<=p.width and 0<=r['y']<r['y']+r['h']<=p.height
   crop=p.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
   assert crop.getchannel('A').getbbox(),(atlas,name,i,'empty')
   hashes.append(hashlib.sha256(crop.tobytes()).hexdigest())
   if i in (0,4,7,11,15):
    col=(0,4,7,11,15).index(i);scale=.28;s=f['spriteSourceSize'];pivot=d['canvas']['pivot']
    x=col*256+128+(s['x']-pivot['x'])*scale;y=row*135+126+(s['y']-pivot['y'])*scale
    small=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))),Image.Resampling.LANCZOS)
    board.paste(small,(round(x),round(y)),small)
    draw.line((col*256,row*135+126,(col+1)*256,row*135+126),fill='#9f947a')
    draw.text((col*256+5,row*135+3),f'{name} {i}',fill='white')
  assert len(hashes)>=16 and len(set(hashes))==len(hashes),(atlas,name,'duplicate')
  report['clips'][name]={'distinctDrawings':len(hashes),'contact':clip['contact'],'release':clip['release']}
 board.save(OUT/(atlas.stem+'.jpg'),quality=93)
 reports.append(report)
(OUT/'audit.json').write_text(json.dumps(reports,indent=2))
print(f'{len(reports)} companions, {sum(sum(c["distinctDrawings"] for c in r["clips"].values()) for r in reports)} decoded distinct frames; review sheets: {OUT}')
