"""Package draw-cut review art only. Never writes the runtime Hiro atlas."""
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy import ndimage as nd
from PIL import Image
from art_intake_v2 import anchor_x

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / 'adventurer-expeditions-source-art/astra-v10/hiro-draw-cuts-20261016'
OUT = ROOT / 'docs/art/iaido-cuts-20261016'
REF_HEIGHT = {'do-motion-v3-clean.png':389, 'do-bridge.png':356,
 'neck-a.png':358, 'neck-b.png':350, 'kote-a.png':341, 'men-a.png':345,
 'vertical-bridge.png':335, 'noto-a.png':356, 'noto-guide-repair.png':356}
CELL = (640, 520)
PIVOT = (300, 470)
RECOVERY = [('noto-guide-repair.png' if i in [1,2,3] else 'noto-a.png', i) for i in range(8)]
CLIPS = {
 'do': ('Do — horizontal midsection draw', [('do-motion-v3-clean.png',i) for i in range(7)] + [('do-bridge.png',i) for i in range(4)] + RECOVERY, 4),
 'neck': ('Neck-height horizontal draw', [('neck-a.png',i) for i in range(8)] + [('neck-b.png',i) for i in range(4)] + RECOVERY, 5),
 'kote': ('Kote — vertical rising hand cut', [('kote-a.png',i) for i in range(8)] + [('vertical-bridge.png',i) for i in range(4)] + RECOVERY, 4),
 'men': ('Men — vertical rising head cut', [('men-a.png',i) for i in range(8)] + [('vertical-bridge.png',i) for i in range(4,8)] + RECOVERY, 5),
}

def extract(name):
    im = Image.open(SRC/name).convert('RGBA'); pix = np.array(im); alpha = pix[:,:,3]
    if name!='noto-guide-repair.png':
        assert all(not np.any(edge>32) for edge in [alpha[0],alpha[-1],alpha[:,0],alpha[:,-1]]), name
    labels,_ = nd.label(alpha>48); sizes=np.bincount(labels.ravel())
    bodies=[(i,s) for i,s in enumerate(nd.find_objects(labels),1) if sizes[i]>2500]
    assert len(bodies)==8, (name,len(bodies))
    bodies.sort(key=lambda v:(v[1][0].start+v[1][0].stop)/2)
    bodies=[v for row in range(4) for v in sorted(bodies[row*2:row*2+2],key=lambda v:v[1][1].start)]
    result=[]
    for index,(lab,sl) in enumerate(bodies):
        # The generated repair clipped two hair pixels in its unused frame 0.
        # Only requested repaired frames 1–3 are adopted; all others stay original.
        if name=='noto-guide-repair.png' and index not in [1,2,3]:
            result.append(None);continue
        assert sl[0].start>0 and sl[1].start>0 and sl[0].stop<im.height and sl[1].stop<im.width,(name,index,'edge')
        # Isolate the connected drawing, retaining its soft boundary. Never crop
        # on assumed equal-grid lines: sword tips sometimes extend into gutters.
        mask=nd.binary_dilation(labels==lab,iterations=4)&((labels==lab)|(labels==0))
        ys,xs=np.where(mask&(alpha>0)); x0=max(0,int(xs.min())-2);y0=max(0,int(ys.min())-2)
        x1=min(im.width,int(xs.max())+3);y1=min(im.height,int(ys.max())+3)
        p=pix.copy();p[~mask]=0;cell=Image.fromarray(p[y0:y1,x0:x1])
        box=cell.getchannel('A').getbbox(); scale=330/REF_HEIGHT[name]
        ax=anchor_x(cell,box); ground=box[3]
        resized=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
        x=round(PIVOT[0]-ax*scale);y=round(PIVOT[1]-ground*scale)
        assert min(x,y)>=4 and x+resized.width<CELL[0]-4 and y+resized.height<CELL[1]-4,(name,x,y,resized.size)
        canvas=Image.new('RGBA',CELL);canvas.alpha_composite(resized,(x,y))
        result.append((canvas,{'source':name,'sourceRect':[x0,y0,x1-x0,y1-y0],'scale':scale,'anchor':[ax,ground],'placed':[x,y],'pixelHash':hashlib.sha256(canvas.tobytes()).hexdigest()}))
    return result

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    sheets={name:extract(name) for name in REF_HEIGHT};manifest={'reviewOnly':True,'cell':CELL,'pivot':PIVOT,'clips':{},'sources':{}}
    for name in sheets:
        manifest['sources'][name]={'sha256':hashlib.sha256((SRC/name).read_bytes()).hexdigest(),'standingReferencePixels':REF_HEIGHT[name]}
    for key,(title,frames,contact) in CLIPS.items():
        atlas=Image.new('RGBA',(CELL[0]*5,CELL[1]*4));records=[]
        for i,(name,frame) in enumerate(frames):
            image,record=sheets[name][frame];x=(i%5)*CELL[0];y=(i//5)*CELL[1];atlas.alpha_composite(image,(x,y))
            phase='noto' if name.startswith('noto-') else 'recovery' if 'bridge' in name or name=='neck-b.png' else 'draw'
            duration=[140,130,170,170,220,180,200,260][frame] if phase=='noto' else 120 if phase=='recovery' else 65 if i==contact else 90 if i in [contact-1,contact+1] else 120
            records.append({**record,'sourceFrameZeroBased':frame,'rect':[x,y,*CELL],'durationMs':duration,'phase':phase})
        assert len({f['pixelHash'] for f in records})==len(records)
        atlas.save(OUT/(key+'.webp'),lossless=True)
        manifest['clips'][key]={'title':title,'image':key+'.webp','contact':contact,'durationMs':sum(f['durationMs'] for f in records),'frames':records}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    (OUT/'prompts.json').write_bytes((SRC/'prompts.json').read_bytes())
    print(json.dumps({key:{'frames':len(c['frames']),'durationMs':c['durationMs'],'contact':c['contact']} for key,c in manifest['clips'].items()}))

if __name__=='__main__':main()
