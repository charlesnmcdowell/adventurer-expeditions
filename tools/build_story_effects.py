"""Pack authored chapter-one VFX cells; preserve generated alpha and source art."""
from pathlib import Path
from PIL import Image
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / 'adventurer-expeditions-source-art/astra-v8/chapter-one-polish-20261012'
OUT = ROOT / 'assets/expedition/story/effects'

def main():
    im = Image.open(SRC / 'effects-spaced.png').convert('RGBA')
    atlas = Image.new('RGBA', (1024, 1024))
    for i in range(16):
        x, y = i % 4, i // 4
        cell = im.crop((round(x*im.width/4), round(y*im.height/4),
                        round((x+1)*im.width/4), round((y+1)*im.height/4)))
        # Transparent sampler gutters. No gray key or broad alpha threshold.
        cell = cell.resize((224, 224), Image.Resampling.LANCZOS)
        atlas.alpha_composite(cell, (x*256+16, y*256+16))
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = SRC / 'effects-runtime.webp'
    atlas.save(tmp, lossless=True, method=6)
    name = 'chapter-one-' + hashlib.sha256(tmp.read_bytes()).hexdigest()[:12] + '.webp'
    shutil.copy2(tmp, OUT/name)
    meta = dict(image=name, frameWidth=256, frameHeight=256, columns=4, rows=4,
                clips={'fire_bolt':[0,1,2,3], 'prismatic_bolt':[4,5,6,7],
                       'marked_for_the_knife':[8,9,10,11], 'smoke_bomb':[12,13,14,15]},
                source='astra-v8/chapter-one-polish-20261012/effects-spaced.png')
    (OUT/'chapter-one.json').write_text(json.dumps(meta, indent=2))
    print(name, (OUT/name).stat().st_size)

if __name__ == '__main__':
    main()
