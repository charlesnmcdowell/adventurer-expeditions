"""Replace only the Citadel action atlas; keep the approved plate and weather."""
from pathlib import Path
import hashlib, json, shutil
from PIL import Image, ImageDraw
import build_citadel_combat as extract
from art_intake_v2 import build

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v8/portal-story-20261009'
DEST=ROOT/'assets/expedition/travel/citadel-bridge-leap'

def main():
    extract.SRC=SRC
    frames=extract.extract('citadel-portal-v2.png',12)
    # The drawing's pelvis is the horizontal root, not its extended toe. Guides
    # below are in full-sheet coordinates and never follow silhouette width.
    hips=[(241,173),(624,171),(994,180),(1353,180),
          (215,508),(597,506),(1004,514),(1366,556),
          (207,846),(598,855),(990,865),(1374,850)]
    master=Image.open(SRC/'citadel-portal-v2.png')
    # Use explicit fixed cells to translate the measured guides. Crops from the
    # extractor have an audited exact bounding box in the original sheet.
    import numpy as np
    from scipy import ndimage
    arr=np.array(master); labels,_=ndimage.label(arr[:,:,3]>64)
    sizes=np.bincount(labels.ravel());sizes[0]=0;boxes=ndimage.find_objects(labels)
    ids=list(np.where(sizes>5000)[0]);ids.sort(key=lambda n:(boxes[n-1][0].start+boxes[n-1][0].stop)/2)
    ordered=[]
    for row in range(3):ordered+=sorted(ids[row*4:row*4+4],key=lambda n:boxes[n-1][1].start)
    dist,near=ndimage.distance_transform_edt(~np.isin(labels,ids),return_indices=True); assigned=labels[near[0],near[1]]
    # Ground guides allow bent knees and airborne tuck without inflating Hiro.
    floors=[354,362,366,365,691,708,699,687,1015,1021,1018,1020]
    for i,(f,n) in enumerate(zip(frames,ordered)):
        keep=(assigned==n)&(dist<=48)&(arr[:,:,3]>=8);yy,xx=np.where(keep)
        x0=max(0,int(xx.min())-3);y0=max(0,int(yy.min())-3)
        f['guide']={'anchorX':hips[i][0]-x0,'groundY':floors[i]-y0}
    times=[95,95,170,200,130,120,110,125,90,90,95,95]
    sources=[dict(file=f['file'],frames=1,regions=f['regions'],firstFrameZeroBased=i) for i,f in enumerate(frames)]
    clip=dict(id='travel',frames=12,sources=sources,durationsMs=times,loop=False,
              contactFramesZeroBased=[2,3,7,10],releaseFrameZeroBased=11,
              registration=dict(referenceHeight=340,frames=[f['guide'] for f in frames]))
    doc=build(SRC,'actions',SRC/'packed',300,92,dict(clips=[clip]),lossless=True)
    for t in doc['textures']:
        source=SRC/'packed/actions'/t['image'];name='actions-'+hashlib.sha256(source.read_bytes()).hexdigest()[:12]+'.webp'
        shutil.copyfile(source,DEST/name);t['image']=name
    doc['meta']['pages']=[t['image'] for t in doc['textures']]
    (DEST/'actions.json').write_text(json.dumps(doc,separators=(',',':')),encoding='utf8')
    scene=json.loads((DEST/'scene.json').read_text())
    # Stop on the planted casting poses; only cross the gap on the teleport.
    xs=[650,690,725,725,765,825,1145,1190,1230,1270,1310,1350]
    cameras=[0,40,75,75,115,175,495,540,580,620,620,620]
    scene.update(canvas=doc['canvas'],pivot=doc['canvas']['pivot'],source='astra-v8/portal-story-20261009',
                 frames=[dict(name='travel/'+str(i),ms=times[i],x=x,y=612,cameraX=cameras[i],contact=i in [2,3,7,10]) for i,x in enumerate(xs)])
    (DEST/'scene.json').write_text(json.dumps(scene,indent=2),encoding='utf8')
    (SRC/'registration.json').write_text(json.dumps(dict(clip=clip,scene=scene),indent=2),encoding='utf8')

if __name__=='__main__':main()
