"""Recover the ward/emblem crossing row 3/4; retain the original packed pages.
Explicit crop repair, no repainting, thresholds, erased art or new frames.
"""
from pathlib import Path
import hashlib,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/'assets/expedition/story/effects'
HASHES={'weapons':'8aa4c6323ce40e1f8ec73bb8d7572f554e0a70fab6f0dd90439ca9dc7adc76d3',
        'storm':'238117816a3de9c7a700d449d220a04149f73ad5d866a199446ecf82ddd66ee4'}
def main():
 report=[]
 for group in ['weapons','storm']:
  p=DIR/(group+'.json');d=json.loads(p.read_text())
  original=d.get('boundaryRepair',{}).get('original',d['image'])
  src=Image.open(DIR/original).convert('RGBA');out=src.copy()
  assert src.size==(1024,1024)
  master=ROOT.parent/'adventurer-expeditions-source-art/astra-v8/story-enemies'/('effects-'+group)/('effects-v2.png' if group=='weapons' else 'effects.png')
  assert hashlib.sha256(master.read_bytes()).hexdigest()==HASHES[group], 'Changed source: review before repacking '+group
  raw=Image.open(master).convert('RGBA');assert raw.size==(1254,1254)
  # Return to the master: the old packer split each icon and introduced a
  # gutter through it. Rejoining that broken atlas would retain the gap.
  # y=890 is the reviewed transparent seam above the complete fourth row.
  for row,(top,bottom) in enumerate([(627,890),(890,1254)],start=2):
   cells=[raw.crop((round(i*1254/4),top,round((i+1)*1254/4),bottom)) for i in range(4)]
   boxes=[im.getbbox() for im in cells]
   union=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
   w,h=union[2]-union[0],union[3]-union[1];scale=min(224/314,224/w,224/h)
   for col,im in enumerate(cells):
    art=im.crop(union);art=art.resize((round(w*scale),round(h*scale)),Image.Resampling.LANCZOS)
    out.paste((0,0,0,0),(col*256,row*256,(col+1)*256,(row+1)*256))
    out.alpha_composite(art,(col*256+(256-art.width)//2,row*256+(256-art.height)//2))
  digest=hashlib.sha256(out.tobytes()).hexdigest()[:12];name=group+'-clean-'+digest+'.webp'
  out.save(DIR/name,'WEBP',lossless=True)
  d['image']=name;d['boundaryRepair']={'original':original,'master':str(master.relative_to(ROOT.parent)),'sourceSHA256':hashlib.sha256(master.read_bytes()).hexdigest(),'masterSeamY':890,'unchangedFrames':list(range(8)),'recoveredFrames':list(range(8,16))}
  p.write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8')
  report.append({'group':group,'file':name,'bytes':(DIR/name).stat().st_size,**d['boundaryRepair']})
 print(json.dumps(report,indent=2))
if __name__=='__main__':main()
