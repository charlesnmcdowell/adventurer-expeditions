"""Read-only atlas idle inventory and registered-frame contact sheets."""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test/reports/idle-roster';OUT.mkdir(parents=True,exist_ok=True)
rows=[];inventory=[]
for path in sorted((ROOT/'assets/expedition').glob('*/*.json')):
 try: d=json.loads(path.read_text(encoding='utf-8'))
 except (ValueError,UnicodeError):continue
 if not isinstance(d,dict) or 'idle' not in d.get('clips',{}):continue
 pages=[Image.open(path.parent/t['image']).convert('RGBA') for t in d['textures']]
 entries=[];pivot=d['canvas']['pivot'];scale=140/d.get('standing',300)
 for name in d['clips']['idle']['frames']:
  f=d['frames'][name];r=f['frame'];ss=f['spriteSourceSize'];im=pages[f.get('page',0)].crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
  a=np.array(im.getchannel('A'))>128;yy,xx=np.where(a);bottom=int(yy.max())+1;band=max(8,round(d.get('standing',300)*.10));by,bx=np.where(a[max(0,bottom-band):bottom]);anchor=(int(bx.min())+int(bx.max())+1)/2
  entries.append(dict(frame=name,x=ss['x']+anchor,y=ss['y']+bottom,localX=anchor,localY=bottom,ss=ss,rect=r,page=f.get('page',0)))
  tile=Image.new('RGB',(220,185),'#414750');tile.paste(im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale)))),(round(110+(ss['x']-pivot['x'])*scale),round(166+(ss['y']-pivot['y'])*scale)),im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale)))))
  dr=ImageDraw.Draw(tile);dr.line((110,22,110,183),fill='#68777f');dr.line((0,166,219,166),fill='#68777f');dr.text((3,3),path.parent.name+' '+name,fill='white');rows.append(tile)
 xs=[e['x'] for e in entries];ys=[e['y'] for e in entries]
 inventory.append(dict(actor=path.parent.name,file=str(path.relative_to(ROOT)),frames=entries,standing=d.get('standing'),pivot=pivot,dx=max(xs)-min(xs),dy=max(ys)-min(ys)))
 for page in pages:page.close()
for i in range(0,len(rows),40):
 sheet=Image.new('RGB',(880,1850),'#222222')
 for j,tile in enumerate(rows[i:i+40]):sheet.paste(tile,((j%4)*220,(j//4)*185))
 sheet.save(OUT/f'contact-{i//40:02d}.jpg',quality=90)
(OUT/'inventory.json').write_text(json.dumps(inventory,indent=2),encoding='utf-8')
print('Actors',len(inventory),'idle frames',len(rows))
for row in sorted(inventory,key=lambda r:r['dx'],reverse=True):print(row['actor'],round(row['dx'],1),round(row['dy'],1))
