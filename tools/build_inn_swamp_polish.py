"""Repack the September 28 source paintings and corrected small-enemy pairs."""
from pathlib import Path
import json
from PIL import Image
from art_intake_v2 import build

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / 'adventurer-expeditions-source-art/astra-v3/inn-swamp-20260928'
for name in ('inn-hiro-mage', 'inn-hiro-warrior', 'inn-hiro-ranger', 'swamp'):
    folder = 'stages' if name == 'swamp' else 'inn'
    revised = name in ('inn-hiro-mage', 'inn-hiro-warrior')
    source_name = name + ('-wardrobe-v2' if revised else '')
    output_name = name + ('-v2' if revised else '')
    Image.open(SRC / (source_name + '.png')).convert('RGB').resize((1280, 760), Image.Resampling.LANCZOS).save(
        ROOT / 'assets/expedition' / folder / (output_name + '.webp'), quality=86, method=6)
for actor in ('goblin', 'spider'):
    original = SRC.parent / 'monsters' / actor
    manifest = json.loads((SRC / (actor + '-manifest.json')).read_text(encoding='utf-8'))
    for clip in manifest['clips']:
        if clip.get('paired'):
            clip['sourceRoot'] = str(SRC)
    doc = build(original, actor, ROOT / 'assets/expedition', height=300, quality=80, manifest=manifest)
    doc['authoredFacing'] = -1
    (ROOT / 'assets/expedition' / actor / (actor + '.json')).write_text(json.dumps(doc, separators=(',', ':')), encoding='utf-8')
