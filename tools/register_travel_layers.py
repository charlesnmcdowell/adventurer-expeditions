"""Register edited alpha plates against approved ground/obstacle geometry."""
from pathlib import Path
import subprocess,json,io
import cv2,numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v6/polish-20261009'
report=[]
for ident in ['forest-carriage-vault','swamp-log-slide','city-market-vault','city-rooftop-run']:
    rel='assets/expedition/travel/'+ident+'/plate.webp'
    old=Image.open(io.BytesIO(subprocess.check_output(['git','show','5a127ed:'+rel],cwd=ROOT))).convert('RGBA')
    new=Image.open(SRC/(ident+'-layered-plate.png')).convert('RGBA').resize(old.size,Image.Resampling.LANCZOS)
    a=np.array(new);b=np.array(old)
    sift=cv2.SIFT_create(nfeatures=6000)
    mask=np.zeros(b.shape[:2],np.uint8);mask[int(old.height*.43):]=255
    k1,d1=sift.detectAndCompute(cv2.cvtColor(a,cv2.COLOR_RGBA2GRAY),mask)
    k2,d2=sift.detectAndCompute(cv2.cvtColor(b,cv2.COLOR_RGBA2GRAY),mask)
    good=[m for m,n in cv2.BFMatcher().knnMatch(d1,d2,k=2) if m.distance<.72*n.distance]
    if len(good)<15:raise ValueError(ident+': insufficient ground correspondences')
    p=np.float32([k1[m.queryIdx].pt for m in good]);q=np.float32([k2[m.trainIdx].pt for m in good])
    matrix,inliers=cv2.estimateAffine2D(p,q,method=cv2.RANSAC,ransacReprojThreshold=3)
    if matrix is None or inliers.sum()<15:raise ValueError(ident+': unreliable contact registration')
    aligned=cv2.warpAffine(a,matrix,old.size,flags=cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_CONSTANT)
    # Preserve original ground at an uncovered outer-bottom edge after registration.
    # This margin is part of the contact plane, never a new creative drawing.
    holes=(aligned[:,:,3]<8)&(np.indices(aligned.shape[:2])[0]>old.height-20)
    aligned[holes]=b[holes]
    Image.fromarray(aligned).save(ROOT/rel,'WEBP',quality=92,method=6)
    path=ROOT/'assets/expedition/travel'/ident/'scene.json';d=json.loads(path.read_text());d['layeredPlate']=True;d['plateRegistration']='20261009-approved-contact-plane';path.write_text(json.dumps(d,indent=2),encoding='utf8')
    record=dict(id=ident,matches=len(good),inliers=int(inliers.sum()),affine=matrix.tolist())
    report.append(record);print(record,flush=True)
(SRC/'layer-registration.json').write_text(json.dumps(report,indent=2),encoding='utf8')
