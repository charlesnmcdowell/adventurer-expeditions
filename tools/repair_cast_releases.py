"""Use existing firing poses as casts. No pixel, idle or attack changes."""
from pathlib import Path
import json,copy
ROOT=Path(__file__).resolve().parents[1]
# Local hand / staff / bow coordinates measured on attack/4, in trimmed pixels.
GUIDES={'story_femi':(125,62,.40),'elven_ranger':(90,90,.25),
        'elven_wizard':(92,65,.40),'enchantress':(32,34,.40),'hag':(66,73,.45),
        'spider':(260,150,.50)}
def repair(d,actor):
 if actor not in GUIDES:return
 x,y,size=GUIDES[actor]
 c=copy.deepcopy(d['clips']['attack']);f=d['frames'][c['frames'][4]];ss=f['spriteSourceSize']
 c.update(contact=[],release=4,releaseAnchor={'x':ss['x']+x,'y':ss['y']+y,'sizeRatio':size,'measuredFrame':4},
          castRepair={'sourceClip':'attack','frame':4,'trimmedAnchor':[x,y],'reason':'Projectile leaves the painted weapon before recovery'})
 d['clips']['cast']=c
def main():
 for actor in GUIDES:
  p=ROOT/'assets/expedition'/actor/(actor+'.json');d=json.loads(p.read_text(encoding='utf-8'));repair(d,actor)
  p.write_text(json.dumps(d,separators=(',',':')),encoding='utf-8')
  print(actor,'cast release 4, anchor',d['clips']['cast']['releaseAnchor'])
if __name__=='__main__':main()
