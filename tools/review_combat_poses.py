"""Diagnostic montage of packed pixels at registered scale; does not edit art."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test/reports/combat-identity';OUT.mkdir(parents=True,exist_ok=True)
tiles=[]
for p in sorted((ROOT/'assets/expedition').glob('*/*.json')):
 try:d=json.loads(p.read_text(encoding='utf-8'))
 except (ValueError,UnicodeError):continue
 if not isinstance(d,dict) or 'idle' not in d.get('clips',{}):continue
 pages=[Image.open(p.parent/t['image']).convert('RGBA') for t in d['textures']]
 tile=Image.new('RGB',(480,205),'#414750');dr=ImageDraw.Draw(tile);dr.text((4,3),p.stem,fill='white')
 choices=[('idle',0),('idle',len(d['clips']['idle']['frames'])//2)]
 for options in [('attack','slash','bite','strike','lash'),('cast','signature-1','attack','bite','strike')]:
  name=next((n for n in options if n in d['clips']), 'idle');c=d['clips'][name];choices.append((name,c.get('release',c.get('contact',len(c['frames'])//2))))
 for i,(name,ix) in enumerate(choices):
  c=d['clips'][name];ix=ix if isinstance(ix,int) else ix[0];f=d['frames'][c['frames'][ix]];r=f['frame'];ss=f['spriteSourceSize'];pv=d['canvas']['pivot'];scale=125/d.get('standing',300)
  im=pages[f.get('page',0)].crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']));im.thumbnail((1800,1800))
  im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))))
  sub=Image.new('RGB',(120,180),'#414750');sub.paste(im,(round(60+(ss['x']-pv['x'])*scale),round(153+(ss['y']-pv['y'])*scale)),im)
  sd=ImageDraw.Draw(sub);sd.line((0,153,119,153),fill='#829390');sd.text((2,164),name+' '+str(ix),fill='white');tile.paste(sub,(120*i,22))
 tiles.append(tile)
 for im in pages:im.close()
for start in range(0,len(tiles),15):
 sheet=Image.new('RGB',(1440,1025),'#20252b')
 for i,t in enumerate(tiles[start:start+15]):sheet.paste(t,((i%3)*480,(i//3)*205))
 sheet.save(OUT/f'poses-{start//15:02d}.jpg',quality=92)
print('Rendered',len(tiles),'actors')
