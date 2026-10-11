"""Review resolved campaign drawings, including replacement-sheet mappings.

Never enumerate registered-pairs directories: superseded poses may still be
there, and replacement poses live in different directories. The source
manifest is the same ordered list that the atlas builder consumes.
"""
from pathlib import Path
import argparse, json, math
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('actor')
    args = ap.parse_args()
    src = ROOT.parent / 'adventurer-expeditions-source-art/astra-v8/story-enemies' / args.actor
    out = src / 'qa'; out.mkdir(exist_ok=True)
    for name in ['combat-manifest.json', 'fatal-manifest.json']:
        manifest = json.loads((src / name).read_text())
        for clip in manifest['clips']:
            if not clip.get('paired'): continue
            assert len(clip['sources']) == clip['frames']
            sheet = Image.new('RGB', (1200, math.ceil(clip['frames']/4)*320), '#697575')
            draw = ImageDraw.Draw(sheet)
            for i, source in enumerate(clip['sources']):
                assert source and source['frames'] == 1
                image = Image.open(src / source['file']).convert('RGBA')
                x,y,w,h = source['regions'][0]
                image = image.crop((x,y,x+w,y+h)); image.thumbnail((294,270))
                left = i%4*300; top = i//4*320
                sheet.paste(image, (left+(300-image.width)//2, top+28), image)
                draw.text((left+8,top+5), f"{i} | {clip['durationsMs'][i]} ms", fill='white')
                draw.text((left+8,top+300), str(Path(source['file']).parent.name), fill='white')
            sheet.save(out / (clip['id']+'-resolved.jpg'))
            print(clip['id'], clip['frames'], 'resolved drawings')

if __name__ == '__main__': main()
