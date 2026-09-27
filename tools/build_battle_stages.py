"""Resize approved source paintings for runtime. No generated pixel content."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / 'adventurer-expeditions-source-art/astra-v3/release-polish'
DST = ROOT / 'assets/expedition/stages'
DST.mkdir(parents=True, exist_ok=True)
for name in ('mountain', 'city'):
    Image.open(SRC / (name + '.png')).convert('RGB').resize((1280, 760), Image.Resampling.LANCZOS).save(DST / (name + '.webp'), quality=86, method=6)
