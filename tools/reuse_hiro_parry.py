"""Reuse existing draw-review poses for melee parry; no generation or repainting."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT/'assets/expedition/hiro'
REVIEW = ROOT/'docs/art/iaido-cuts-20261016'
PAGE = 'hiro-parry-reuse.webp'
CLIP = 'parry-rise'

def main():
    doc = json.loads((DEST/'hiro.json').read_text())
    review = json.loads((REVIEW/'manifest.json').read_text())
    source = review['clips']['kote']
    art = Image.open(REVIEW/source['image']).convert('RGBA')
    selected = [2,3,4,5,6,8,9,10,11]
    durations = [65,55,65,70,60,65,70,80,95]
    old = {i for i,t in enumerate(doc['textures']) if t['image']==PAGE}
    remap = {v:i for i,v in enumerate(j for j in range(len(doc['textures'])) if j not in old)}
    doc['textures'] = [t for i,t in enumerate(doc['textures']) if i not in old]
    doc['frames'] = {k:{**f,'page':remap[f['page']]} for k,f in doc['frames'].items() if f['page'] not in old}
    canvas = doc['canvas']; pivot = canvas['pivot']; scale=doc['standing']/330
    cell_w,cell_h=640,420
    page = Image.new('RGBA',(cell_w*3,cell_h*3)); frames=[]; provenance=[]
    for i,idx in enumerate(selected):
        r=source['frames'][idx]; x,y,w,h=r['rect']
        im=art.crop((x,y,x+w,y+h)); box=im.getchannel('A').getbbox()
        im=im.crop(box); im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
        px=(i%3)*cell_w+4;py=(i//3)*cell_h+4
        assert im.width<cell_w-8 and im.height<cell_h-8
        page.alpha_composite(im,(px,py))
        sx=round(pivot['x']+(box[0]-review['pivot'][0])*scale)
        sy=round(pivot['y']+(box[1]-review['pivot'][1])*scale)
        assert min(sx,sy)>=0 and sx+im.width<=canvas['w'] and sy+im.height<=canvas['h']
        f={'filename':f'{CLIP}/{i}','frame':{'x':px,'y':py,'w':im.width,'h':im.height},'rotated':False,'trimmed':True,
           'spriteSourceSize':{'x':sx,'y':sy,'w':im.width,'h':im.height},'sourceSize':{'w':canvas['w'],'h':canvas['h']}}
        frames.append(f);doc['frames'][f['filename']]={**f,'page':len(doc['textures'])}
        provenance.append({'reviewFrame':idx,'source':r['source'],'sourceFrameZeroBased':r['sourceFrameZeroBased']})
    page.save(DEST/PAGE,lossless=True)
    doc['textures'].append({'image':PAGE,'format':'RGBA8888','size':{'w':page.width,'h':page.height},'scale':1,'frames':frames})
    doc['clips'][CLIP]={'frames':[f['filename'] for f in frames],'contact':[2],'release':8,'durationMs':sum(durations),'frameDurationsMs':durations,
       'frameMs':69,'loop':False,'paired':False,'opponentKinds':[],'opponentKeys':[],'reusedDrawings':provenance,
       'note':'User-approved reuse direction: short rising guard for melee Counter, not Iaido Draw. No sheathing hold.'}
    doc['meta']['pages']=[t['image'] for t in doc['textures']]
    (DEST/'hiro.json').write_text(json.dumps(doc,separators=(',',':')))
    print(f'{CLIP}: {len(frames)} reused drawings, {sum(durations)} ms, { (DEST/PAGE).stat().st_size } bytes')

if __name__=='__main__':main()
