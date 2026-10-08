"""Pack approved-direction Coast layer sources without altering their paintings."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'adventurer-expeditions-source-art/astra-v5/coast-20261008'
OUT = ROOT / 'assets/expedition/stages/coast'

def build():
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    for layer in ('far', 'ground', 'near'):
        source = SOURCE / (layer + '.png')
        target = OUT / ('atmosphere-' + layer + '.webp')
        image = Image.open(source).convert('RGBA')
        image.save(target, 'WEBP', quality=90, method=6)
        records.append(dict(layer=layer, size=list(image.size), sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(), bytes=target.stat().st_size))
    (ROOT / 'docs/art/coast-20261008/scenery-build.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
    print('Coast layers:', sum(r['bytes'] for r in records), 'bytes')

if __name__ == '__main__':
    build()
