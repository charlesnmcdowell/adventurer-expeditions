"""Pack the six authored late-campaign effect sheets, preserving alpha and gutters."""
from pathlib import Path
from PIL import Image
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v8/story-enemies'
OUT=ROOT/'assets/expedition/story/effects'
GROUPS={
 'nature':['thorn_lash','poison_spray','rot_wing','glass_web'],
 'frost':['frost_touch','rime_grasp','rime_breath','coven_rime'],
 'weapons':['aimed_shot','kunai_line','suppressing_volley','contract_mark'],
 'occult':['blood_lotus','soul_bay','bell_silence','dispel'],
 'fire':['siege_flame','ember_lash','fire_barrier','ashfall'],
 'storm':['spark','chain_lightning','arcane_cascade','ranging_ward']}
def main():
 for group,clips in GROUPS.items():
  folder=SRC/('effects-'+group)
  file=folder/('effects-v2.png' if group=='weapons' else 'effects.png')
  im=Image.open(file).convert('RGBA');atlas=Image.new('RGBA',(1024,1024))
  for i in range(16):
   x,y=i%4,i//4
   cell=im.crop((round(x*im.width/4),round(y*im.height/4),round((x+1)*im.width/4),round((y+1)*im.height/4)))
   cell.thumbnail((224,224),Image.Resampling.LANCZOS)
   atlas.alpha_composite(cell,(x*256+(256-cell.width)//2,y*256+(256-cell.height)//2))
  tmp=folder/'runtime.webp';atlas.save(tmp,lossless=True,method=6)
  content=tmp.read_bytes();name=group+'-'+hashlib.sha256(content).hexdigest()[:12]+'.webp'
  (OUT/name).write_bytes(content)
  (OUT/(group+'.json')).write_text(json.dumps(dict(image=name,frameWidth=256,frameHeight=256,columns=4,rows=4,clips={k:list(range(i*4,i*4+4)) for i,k in enumerate(clips)},source=str(file.relative_to(SRC.parent))),indent=2))
  print(group,len(content))
if __name__=='__main__':main()
