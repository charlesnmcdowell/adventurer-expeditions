"""Preview-only intake. Preserve masters and never write runtime actor assets."""
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'adventurer-expeditions-source-art/astra-v11/layla-idle-20261019'
OUT = ROOT / 'docs/art/layla-idle-20261019'

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    master = Image.open(SOURCE / 'idle-draft.png').convert('RGBA')
    pixels = np.array(master)
    labels, _ = ndimage.label(pixels[:, :, 3] > 32)
    counts = np.bincount(labels.ravel())
    bodies = [(i, s) for i, s in enumerate(ndimage.find_objects(labels), 1) if counts[i] > 3000]
    assert len(bodies) == 16
    bodies.sort(key=lambda r: (r[1][0].start + r[1][0].stop) / 2)
    bodies = [b for row in range(4) for b in sorted(bodies[row*4:row*4+4], key=lambda r: r[1][1].start)]
    frames, records = [], []
    for index, (label, slices) in enumerate(bodies):
        # Isolate the connected whole figure with its antialiased edges. Do not
        # slice equal cells across hair or erase dark skin/costume pixels.
        mask = ndimage.binary_dilation(labels == label, iterations=3)
        mask &= (labels == 0) | (labels == label)
        p = pixels.copy()
        p[~mask] = 0
        crop = Image.fromarray(p)
        box = crop.getbbox()
        crop = crop.crop(box)
        scale = 320 / 302  # one scale for every drawing; never normalize poses
        crop = crop.resize((round(crop.width*scale), round(crop.height*scale)), Image.Resampling.LANCZOS)
        a = np.array(crop)[:, :, 3]
        bottom = int(np.where(a > 96)[0].max())
        ys, xs = np.where((a > 96) & (np.indices(a.shape)[0] >= bottom-10))
        # Register the planted boot centroid. A whole silhouette centroid would
        # shift the body whenever her long cape or hair changes width.
        anchor = float(xs.mean())
        canvas = Image.new('RGBA', (384, 374))
        x = round(192-anchor)
        y = 368-bottom
        canvas.alpha_composite(crop, (x, y))
        assert canvas.getbbox()[0] > 0 and canvas.getbbox()[2] < 384
        frames.append(canvas)
        records.append({'frame': index, 'sourceRegion': list(box), 'scale': scale,
                        'bootAnchorX': anchor, 'placement': [x,y], 'groundY': 368})
    sheet = Image.new('RGBA', (384*4, 374*4))
    contact = Image.new('RGB', (384*4, 374*4), '#3a3e49')
    for i, f in enumerate(frames):
        pos = ((i%4)*384, (i//4)*374)
        sheet.alpha_composite(f, pos)
        contact.paste(f, pos, f)
        d = ImageDraw.Draw(contact)
        d.line((pos[0],pos[1]+368,pos[0]+383,pos[1]+368),fill='#94938b')
        d.text((pos[0]+12,pos[1]+12),str(i+1),fill='white')
    sheet.save(OUT/'layla-idle-preview.webp',lossless=True)
    contact.resize((1152,1122)).save(OUT/'contact-sheet.jpg',quality=90)
    (SOURCE/'registration.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
    (OUT/'prompts.json').write_text((SOURCE/'prompts.json').read_text(encoding='utf-8'),encoding='utf-8')
    # Reversible sequence removes the 15->0 snap, retaining distinct drawings.
    sequence = list(range(16)) + list(range(14,0,-1))
    manifest = {'previewOnly':True,'image':'layla-idle-preview.webp',
        'frameSize':[384,374],'columns':4,'standing':320,'pivot':[192,368],
        'distinctDrawings':16,'sequence':sequence,'frameMs':160,
        'durationMs':len(sequence)*160,'registration':records,
        'masterSha256':hashlib.sha256((SOURCE/'idle-draft.png').read_bytes()).hexdigest(),
        'notes':['One constant scale; painted whole figures, no body rig or crossfade.',
                 'Forward/reverse loop avoids a discontinuous reset.',
                 'Preview only: current runtime and saves are untouched.']}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print('Wrote preview only:', OUT)

if __name__ == '__main__':
    main()
