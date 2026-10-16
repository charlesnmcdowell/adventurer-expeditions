"""Intake the authored right-facing reflected projectile sheet, preserving alpha."""
from PIL import Image
from pathlib import Path
import json, hashlib
from art_intake_v2 import discard_neighbor_fragments
ROOT=Path(__file__).resolve().parents[1]
src=ROOT.parent/'adventurer-expeditions-source-art/astra-v10/hiro-actions-20261016/reflected.png'
im=Image.open(src).convert('RGBA');out=Image.new('RGBA',(1024,1024))
for i in range(16):
 x=i%4;y=i//4;cell=im.crop((round(x*im.width/4),round(y*im.height/4),round((x+1)*im.width/4),round((y+1)*im.height/4)))
 cell=discard_neighbor_fragments(cell);cell.thumbnail((236,236),Image.Resampling.LANCZOS)
 out.alpha_composite(cell,(x*256+(256-cell.width)//2,y*256+(256-cell.height)//2))
p=ROOT/'assets/expedition/story/effects';out.save(p/'reflected.webp',quality=90,exact=True)
d={'image':'reflected.webp','frameWidth':256,'frameHeight':256,'columns':4,'rows':4,'authoredFacing':1,'clips':{name:list(range(i*4,i*4+4)) for i,name in enumerate(['fire_bolt','prismatic_bolt','arrow','marked_for_the_knife'])},'source':src.relative_to(ROOT.parent).as_posix(),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'releaseFrameZeroBased':0}
(p/'reflected.json').write_text(json.dumps(d,indent=2))
print('16 reflected projectile drawings packed.')
