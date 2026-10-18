from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];out=root/'test/reports/magic-polish';out.mkdir(parents=True,exist_ok=True);report={}
baseline=json.loads((root/'test/fixtures/wolf_contact_before.json').read_text(encoding='utf-8'))
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()
for actor,clips in [('hiro',['bite-arm-paired','bite-leg-paired']),('wolf',['leap'])]:
 folder=root/'assets/expedition'/actor;d=json.loads((folder/(actor+'.json')).read_text())
 old=baseline[actor];assert digest(d['clips'])==old['clipsSha256'],'timings and markers must stay unchanged'
 assert d['canvas']==old['canvas'];assert d['standing']==old['standing']
 unchanged={n:f for n,f in d['frames'].items() if n not in old['repaired']}
 assert digest(unchanged)==old['unaffectedFramesSha256'],'unrelated frames must not change'
 pages=[Image.open(folder/p).convert('RGBA') for p in d['meta']['pages']]
 changed=[]
 for name,f in d['frames'].items():
  if name not in old['repaired']:continue
  changed.append(name)
  assert f['frame']['w']>0;assert d['meta']['pages'][f['page']]==actor+'-contact-clean.webp'
  r=f['frame'];page=pages[f['page']];x,y,w,h=r['x'],r['y'],r['w'],r['h']
  # Padding isolates all four edges from neighboring cells.
  assert not page.crop((x-3,y-3,x+w+3,y)).getchannel('A').getbbox()
  assert not page.crop((x-3,y+h,x+w+3,y+h+3)).getchannel('A').getbbox()
  assert not page.crop((x-3,y,x,y+h)).getchannel('A').getbbox()
  assert not page.crop((x+w,y,x+w+3,y+h)).getchannel('A').getbbox()
 for clip in clips:
  cw,ch=d['canvas']['w'],d['canvas']['h'];cellw,cellh=round(cw*.6),round(ch*.6)+24;names=d['clips'][clip]['frames'];sheet=Image.new('RGB',(cellw*4,cellh*((len(names)+3)//4)),(60,65,73));draw=ImageDraw.Draw(sheet)
  for i,n in enumerate(names):
   f=d['frames'][n];r=f['frame'];s=f['spriteSourceSize'];im=Image.new('RGBA',(cw,ch));im.alpha_composite(pages[f['page']].crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])),(s['x'],s['y']));im.thumbnail((cellw,cellh-24));x=i%4*cellw;y=i//4*cellh;sheet.paste(im,(x,y),im);draw.text((x+5,y+cellh-22),str(i),fill='white')
  sheet.save(out/(actor+'-'+clip+'-clean.png'))
 report[actor]=changed
assert len(report['hiro'])==20 and len(report['wolf'])==5
(out/'contact-repair.json').write_text(json.dumps(report,indent=2));print('PASS: 25 isolated repaired frames; unchanged timing, contact markers, canvas and untouched cells')
