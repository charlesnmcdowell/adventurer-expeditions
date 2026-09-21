"""Pack the selected v2 inn paintings/effects; never copy source masters to ship.

Run from any directory with Python and Pillow. The authored placement coordinates
are mapped through the same uniform fit used for each 1280x760 base painting.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'adventurer-expeditions-source-art/astra-v2/backgrounds'
OUTPUT = ROOT / 'assets/expedition/inn'
CANVAS = (1280, 760)


def checked_image(entry):
    path = SOURCE / entry['file']
    if hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
        raise ValueError(f'Source changed; review its manifest before intake: {path}')
    return Image.open(path)


def build():
    source = json.loads((SOURCE / 'inn-manifest.json').read_text(encoding='utf-8-sig'))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {'version': 1, 'canvas': {'width': CANVAS[0], 'height': CANVAS[1]}, 'backgrounds': {}, 'effects': {}}
    for entry in source['backgrounds']:
        image = checked_image(entry).convert('RGB')
        scale = max(CANVAS[0] / image.width, CANVAS[1] / image.height)
        crop_x = (image.width * scale - CANVAS[0]) / 2
        crop_y = (image.height * scale - CANVAS[1]) / 2
        name = entry['id'] + '.webp'
        ImageOps.fit(image, CANVAS, method=Image.Resampling.LANCZOS).save(OUTPUT / name, quality=87, method=6)
        placements = []
        for placement in entry['draftPlacementsNative']:
            p = {'effect': placement['clip'], 'x': round(placement['x'] * scale - crop_x, 3), 'y': round(placement['y'] * scale - crop_y, 3), 'phaseOffsetMs': placement.get('phaseOffsetMs', 0)}
            if 'clipRect' in placement:
                r = placement['clipRect']
                p['clipRect'] = {'x': round(r['x'] * scale - crop_x, 3), 'y': round(r['y'] * scale - crop_y, 3), 'w': round(r['w'] * scale, 3), 'h': round(r['h'] * scale, 3)}
            placements.append(p)
        manifest['backgrounds'][entry['id']] = {'file': name, 'actors': entry['actors'], 'placements': placements, 'source': entry['file'], 'sourceSha256': entry['sha256']}
    for entry in source['clips']:
        image = checked_image(entry).convert('RGBA')
        height = {'inn-candle-flame': 96, 'inn-stew-steam': 144, 'inn-hearth-fire': 256}[entry['id']]
        width = round(entry['cellWidth'] / entry['cellHeight'] * height)
        strip = Image.new('RGBA', (width * len(entry['frameRects']), height))
        for i, r in enumerate(entry['frameRects']):
            cell = image.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
            strip.paste(cell.resize((width, height), Image.Resampling.LANCZOS), (width * i, 0))
        name = entry['id'] + '.webp'
        strip.save(OUTPUT / name, quality=88, alpha_quality=100, method=6)
        # Both bases share the same native dimensions and target fit.
        manifest['effects'][entry['id']] = {
            'file': name, 'frameWidth': width, 'frameHeight': height, 'frames': len(entry['frameRects']),
            'originX': entry['anchorDraft']['x'] / entry['cellWidth'], 'originY': entry['anchorDraft']['y'] / entry['cellHeight'],
            'displayWidth': round(entry['cellWidth'] * entry['scaleNativeDraft'] * scale, 3),
            'displayHeight': round(entry['cellHeight'] * entry['scaleNativeDraft'] * scale, 3),
            'opacity': entry['opacityDraft'], 'durationsMs': entry['frameDurationsMsDraft'],
            'order': entry.get('quietPlaybackOrderZeroBased', entry['loopOrderZeroBased']),
            'source': entry['file'], 'sourceSha256': entry['sha256'], 'alpha': True,
        }
    (OUTPUT / 'inn.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    files = [OUTPUT / 'inn.json'] + [OUTPUT / d['file'] for d in manifest['backgrounds'].values()] + [OUTPUT / d['file'] for d in manifest['effects'].values()]
    total = sum(path.stat().st_size for path in files)
    print(json.dumps({'files': len(files), 'bytes': total, 'outputs': [{'file': p.name, 'bytes': p.stat().st_size} for p in files]}))
    if total > 1_000_000:
        raise ValueError('Inn art exceeds the requested 1 MB intake target; review quality before reducing it.')


if __name__ == '__main__':
    build()
