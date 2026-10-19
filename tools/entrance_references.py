"""Extract untouched runtime poses as image-generation identity references."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
GAME=Path(__file__).resolve().parents[1]
SRC=GAME.parent/'adventurer-expeditions-source-art/astra-v12/entrances-20261019'
def main():
 SRC.mkdir(parents=True,exist_ok=True)
 inv=json.loads((GAME/'docs/ENTRANCE_REVIEW_20261019/inventory.json').read_text())
 actors=[r['actor'] for r in inv['story'] if r['unique']]+['wolf','alpha','plant','serpent','beetle','moss_giant','hag','goblin','spider','orc','crab','toad','vulture','hydra','elven_wizard','elven_ranger','dark_swordswoman','enchantress','story_web_spider','story_wyvern','story_phase_spider']
 for actor in dict.fromkeys(actors):
  folder=GAME/'assets/expedition'/actor;d=json.loads((folder/(actor+'.json')).read_text());sheet=Image.new('RGBA',(1200,600),'#777777');draw=ImageDraw.Draw(sheet)
  selected=[('idle',0),('idle',min(1,len(d['clips']['idle']['frames'])-1)),('attack',0),('cast' if 'cast' in d['clips'] else 'attack',2)]
  for i,(clip,index) in enumerate(selected):
   if clip not in d['clips']:clip=next(k for k in d['clips'] if not d['clips'][k].get('paired'))
   c=d['clips'][clip];key=c['frames'][min(index,len(c['frames'])-1)];f=d['frames'][key];r=f['frame'];im=Image.open(folder/d['textures'][f['page']]['image']).convert('RGBA').crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']));im.thumbnail((285,530));sheet.alpha_composite(im,(i*300+(300-im.width)//2,560-im.height));draw.text((i*300+10,12),actor+' '+clip,fill='white')
  sheet.convert('RGB').save(SRC/(actor+'-reference.jpg'),quality=95)
 print('Saved',len(set(actors)),'unmodified runtime reference sheets to',SRC)
if __name__=='__main__':main()
