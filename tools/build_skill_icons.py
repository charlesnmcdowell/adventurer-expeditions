"""Repeatable intake of the four approved Astra-v2 painted Hiro icons.

This only crops authored regions, preserves alpha and resizes them into a
96px-per-icon Phaser atlas. It neither generates nor repaints artwork.
Run from any directory: python tools/build_skill_icons.py
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT.parent / 'adventurer-expeditions-source-art/astra-v2/icons/icons-manifest.json'
DEFAULT_DEST = ROOT / 'assets/expedition/icons'
ICON_IDS = ('katana_slash', 'god_aura', 'counter_attack', 'finisher')
CELL = 96
PADDING = 4


def build(source: Path, dest: Path) -> dict:
    manifest = json.loads(source.read_text(encoding='utf-8-sig'))
    source_image = source.parent / manifest['sheet']['file']
    raw = source_image.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != manifest['sheet']['sha256']:
        raise ValueError('Approved icon source hash changed; review the source manifest first.')
    image = Image.open(source_image).convert('RGBA')
    if image.size != (manifest['sheet']['width'], manifest['sheet']['height']):
        raise ValueError('Source dimensions differ from approved manifest.')
    icons = {icon['id']: icon for icon in manifest['icons']}
    if set(icons) != set(ICON_IDS):
        raise ValueError('Expected exactly the four approved Hiro skill icons.')
    atlas = Image.new('RGBA', (CELL * 2, CELL * 2))
    frames = {}
    for index, icon_id in enumerate(ICON_IDS):
        icon = icons[icon_id]
        x, y, w, h = icon['region']
        left, top, right, bottom = icon['contentBoundsLocal']
        if not (0 <= left < right <= w and 0 <= top < bottom <= h
                and x >= 0 and y >= 0 and x + w <= image.width and y + h <= image.height):
            raise ValueError(f'Invalid authored bounds for {icon_id}.')
        art = image.crop((x + left, y + top, x + right, y + bottom))
        art = ImageOps.contain(art, (CELL - PADDING * 2, CELL - PADDING * 2), Image.Resampling.LANCZOS)
        cx, cy = (index % 2) * CELL, (index // 2) * CELL
        atlas.alpha_composite(art, (cx + (CELL - art.width) // 2, cy + (CELL - art.height) // 2))
        frames[icon_id] = {'frame': {'x': cx, 'y': cy, 'w': CELL, 'h': CELL},
                           'rotated': False, 'trimmed': False,
                           'spriteSourceSize': {'x': 0, 'y': 0, 'w': CELL, 'h': CELL},
                           'sourceSize': {'w': CELL, 'h': CELL}}
    dest.mkdir(parents=True, exist_ok=True)
    output = dest / 'hiro-skills.webp'
    atlas.save(output, 'WEBP', quality=90, method=6, exact=True)
    data = {'frames': frames, 'meta': {'image': output.name, 'format': 'RGBA8888',
            'size': {'w': atlas.width, 'h': atlas.height}, 'scale': '1',
            'source': 'astra-v2/icons/hiro-skill-icons-v2.png', 'sourceSha256': digest,
            'intake': {'cellPx': CELL, 'paddingPx': PADDING, 'webpQuality': 90,
                       'operation': 'Approved authored bounds cropped and resized; original alpha preserved.'}}}
    atlas_json = dest / 'hiro-skills.json'
    atlas_json.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    total = output.stat().st_size + atlas_json.stat().st_size
    if total >= 100_000:
        raise ValueError(f'Icon atlas exceeds100KB budget: {total} bytes.')
    # Decode the output too: a successfully written file must remain a four-frame RGBA atlas.
    with Image.open(output) as check:
        assert check.size == (192, 192) and check.mode == 'RGBA'
    return {'files': [str(output), str(atlas_json)], 'bytes': total, 'icons': list(frames)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--dest', type=Path, default=DEFAULT_DEST)
    args = parser.parse_args()
    print(json.dumps(build(args.source.resolve(), args.dest.resolve()), indent=2))
