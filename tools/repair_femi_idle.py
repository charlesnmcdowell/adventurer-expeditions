"""Register Femi/Verlan's four existing idle drawings at their boot midpoint.
Metadata only: no repainting, atlas encoding, timing or attack changes.
Called by build_story_actor so a later intake retains the correction.
"""
import json
from pathlib import Path
from PIL import Image

def repair(doc, directory):
    if doc.get('hero') != 'story_femi':
        return doc
    pivot = doc['canvas']['pivot']
    for texture in doc['textures']:
        with Image.open(Path(directory) / texture['image']) as page:
            for frame in texture['frames']:
                if not frame['filename'].startswith('idle/'):
                    continue
                r = frame['frame']
                alpha = page.crop((r['x'], r['y'], r['x']+r['w'], r['y']+r['h'])).getchannel('A')
                solid = alpha.point(lambda value: 255 if value >= 128 else 0)
                # These four upright poses have boots in the bottom 35 pixels;
                # coat/arms are deliberately excluded from the anchor.
                boots = solid.crop((0, r['h']-35, r['w'], r['h'])).getbbox()
                if boots is None:
                    raise ValueError('Missing measured boot region: '+frame['filename'])
                anchor = (boots[0]+boots[2])/2
                offset = frame['spriteSourceSize']
                offset['x'] = round(pivot['x']-anchor)
                offset['y'] = pivot['y']-solid.getbbox()[3]
                doc['frames'][frame['filename']]['spriteSourceSize'] = dict(offset)
    return doc

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    target = root/'assets/expedition/story_femi/story_femi.json'
    doc = json.loads(target.read_text(encoding='utf-8'))
    repair(doc, target.parent)
    target.write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
    print('Registered four Femi idle poses; atlas pixels and timing untouched.')
