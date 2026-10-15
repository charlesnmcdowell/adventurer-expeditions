"""Encode reviewed chapter 6–14 battle paintings; keep PNG masters separately."""
from pathlib import Path
from PIL import Image
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v9/chapter-stages-20261014'
OUT=ROOT/'assets/expedition/story/stages'
def main():
    jobs=json.loads((SRC/'prompts-all.json').read_text());rows=[]
    for job in jobs:
        master=SRC/(job['id']+'.png');im=Image.open(master).convert('RGB')
        if abs(im.width/im.height-1280/760)>.04:raise ValueError('Unexpected composition ratio: '+str(master))
        dest=OUT/(job['id']+'-combat-20261014.webp')
        im.resize((1280,760),Image.Resampling.LANCZOS).save(dest,'WEBP',quality=92,method=6)
        rows.append(dict(id=job['id'],file=dest.relative_to(ROOT).as_posix(),source=str(master),sourceSha256=hashlib.sha256(master.read_bytes()).hexdigest(),sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),width=1280,height=760,groundY=612,clearBand=[.68,.93]))
    (OUT/'late-stages.json').write_text(json.dumps(rows,indent=2))
    shutil.copy2(SRC/'prompts-all.json',ROOT/'docs/art/chapter-stages-20261014-prompts.json')
    print(str(len(rows))+' reviewed combat paintings encoded; original dialogue images unchanged')
if __name__=='__main__':main()
