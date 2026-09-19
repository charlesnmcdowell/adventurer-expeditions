#!/usr/bin/env python3
"""Adventurer: Expeditions — painted-sheet intake (GDD v0.8 §10.3, Claude-owned).

Turns Astra's keyframe sheets (opaque neutral gray, one PNG per clip, cells in a
columns × rows grid, indexed by heroes/<hero>/manifest.json) into one runtime
atlas per hero:

    assets/expedition/<hero>/<hero>.webp   packed, keyed, trimmed frames
    assets/expedition/<hero>/<hero>.json   Phaser atlas (JSON hash) + "clips"

Registration: every frame shares one source box (the hero canvas) whose bottom
centre is the ground pivot, so a sprite with origin (0.5, 1) never jumps between
clips. Per frame the x anchor is the centroid of the figure's lower third (the
feet, not the sword), the y anchor is the frame's lowest opaque row; the canvas
height is the tallest frame. Contact/release frames are copied zero-based from
the manifest, per-frame durations from durationMsDraft, and the impact draft is
carried through untouched (greenlit stays false until Astra signs it off).

    python3 tools/art_intake.py --src <folder with manifest.json> --hero hiro \
        --clips idle,walk,draw,short-draw,slash-l1,hit-short --height 480 --out assets/expedition
"""
import argparse, json, math, os, sys
from collections import deque
from PIL import Image

def parse():
    p = argparse.ArgumentParser()
    p.add_argument('--src', required=True, help='folder holding manifest.json and the clip PNGs')
    p.add_argument('--hero', default='hiro')
    p.add_argument('--clips', default='', help='comma list of clip ids (default: every unpaired clip whose file exists)')
    p.add_argument('--height', type=int, default=480, help='standing height of the idle pose in atlas pixels')
    p.add_argument('--out', default='assets/expedition')
    p.add_argument('--quality', type=int, default=82)
    p.add_argument('--tolerance', type=int, default=22, help='max channel distance to the border gray that still counts as background')
    p.add_argument('--max-width', type=int, default=2048)
    p.add_argument('--max-height', type=int, default=4096, help='mobile GPUs cap textures at 4096; the tool refuses a taller atlas')
    return p.parse_args()

# ---------------------------------------------------------------- keying
def key_cell(cell, tol):
    """Flood-fill the background from the cell border; returns an RGBA image and its bbox."""
    w, h = cell.size
    px = cell.load()
    # The background colour: the median of the border pixels.
    border = [px[x, 0] for x in range(w)] + [px[x, h - 1] for x in range(w)] + [px[0, y] for y in range(h)] + [px[w - 1, y] for y in range(h)]
    bg = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))
    def dist(c): return max(abs(c[0] - bg[0]), abs(c[1] - bg[1]), abs(c[2] - bg[2]))
    removed = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if dist(px[x, y]) <= tol and not removed[y * w + x]: removed[y * w + x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if dist(px[x, y]) <= tol and not removed[y * w + x]: removed[y * w + x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not removed[i] and dist(px[nx, ny]) <= tol: removed[i] = 1; q.append((nx, ny))
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    op = out.load()
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if removed[y * w + x]: continue
            c = px[x, y]
            # Soft fringe: a kept pixel next to background that is itself near the gray fades.
            a = 255
            near = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and removed[ny * w + nx]: near = True; break
            if near:
                d = dist(c)
                a = int(max(0, min(255, (d - tol) / max(1, tol) * 255 + 128)))
            op[x, y] = (c[0], c[1], c[2], a)
            if a:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    if x1 < 0: return out, None
    return out, (x0, y0, x1 + 1, y1 + 1)

def anchor_x(img, box):
    """Centroid of the opaque mass in the lower third of the figure (feet and legs)."""
    x0, y0, x1, y1 = box
    top = y1 - max(1, (y1 - y0) // 3)
    px = img.load()
    s = n = 0
    for y in range(top, y1):
        for x in range(x0, x1):
            a = px[x, y][3]
            if a > 96: s += x; n += 1
    return s / n if n else (x0 + x1) / 2

# ---------------------------------------------------------------- packing
def shelf_pack(items, max_w):
    """items: list of (w, h, id) → dict id → (x, y); returns (positions, W, H). Shelves by height."""
    items = sorted(items, key=lambda t: -t[1])
    pos, x, y, shelf_h, W = {}, 0, 0, 0, 0
    for w, h, i in items:
        if x + w > max_w and x > 0: y += shelf_h; x = 0; shelf_h = 0
        pos[i] = (x, y); x += w; shelf_h = max(shelf_h, h); W = max(W, x)
    return pos, W, y + shelf_h

def main():
    a = parse()
    man = json.load(open(os.path.join(a.src, 'manifest.json')))
    want = [c for c in a.clips.split(',') if c] or [c['id'] for c in man['clips'] if not c['paired'] and os.path.exists(os.path.join(a.src, c['file']))]
    clips = {c['id']: c for c in man['clips']}
    frames = []   # dicts: clip, index, img(RGBA cropped), ax (anchor x within crop), ay (ground within crop)
    for cid in want:
        c = clips.get(cid)
        if not c: sys.exit('unknown clip ' + cid)
        f = os.path.join(a.src, c['file'])
        if not os.path.exists(f): sys.exit('missing ' + f)
        sheet = Image.open(f).convert('RGB')
        cw, ch = sheet.width // c['columns'], sheet.height // c['rows']
        n = 0
        for r in range(c['rows']):
            for col in range(c['columns']):
                if n >= c['frames']: break
                cell = sheet.crop((col * cw, r * ch, (col + 1) * cw, (r + 1) * ch))
                rgba, box = key_cell(cell, a.tolerance)
                if not box: sys.exit(f'{cid} frame {n}: nothing left after keying')
                ax = anchor_x(rgba, box)
                crop = rgba.crop(box)
                frames.append({'clip': cid, 'i': n, 'img': crop, 'ax': ax - box[0], 'ay': box[3] - box[1], 'cell_h': ch})
                n += 1
        print(f'{cid}: {n} frames, cell {cw}x{ch}', file=sys.stderr)
    # Scale: the idle pose (or the first clip) stands a.height tall.
    ref = [fr for fr in frames if fr['clip'] == ('idle' if 'idle' in want else want[0])][0]
    scale = a.height / ref['img'].height
    for fr in frames:
        w, h = max(1, round(fr['img'].width * scale)), max(1, round(fr['img'].height * scale))
        fr['img'] = fr['img'].resize((w, h), Image.LANCZOS)
        fr['ax'] *= scale; fr['ay'] *= scale
    # The hero canvas: wide enough for the widest reach either side of the anchor, tall enough for the tallest frame.
    left = max(fr['ax'] for fr in frames); right = max(fr['img'].width - fr['ax'] for fr in frames)
    above = max(fr['ay'] for fr in frames); below = max(fr['img'].height - fr['ay'] for fr in frames)
    half = math.ceil(max(left, right)); CW = 2 * half; CH = math.ceil(above + below)
    for fr in frames:
        fr['sx'] = round(half - fr['ax']); fr['sy'] = round(above - fr['ay'])
    pad = 2
    pos, W, H = shelf_pack([(fr['img'].width + pad, fr['img'].height + pad, k) for k, fr in enumerate(frames)], a.max_width)
    if H > a.max_height: sys.exit(f'atlas {W}x{H} exceeds the {a.max_height} px texture cap — lower --height or split the clip list')
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out_frames = {}
    for k, fr in enumerate(frames):
        x, y = pos[k]
        atlas.paste(fr['img'], (x, y))
        name = f"{fr['clip']}/{fr['i']}"
        out_frames[name] = {'frame': {'x': x, 'y': y, 'w': fr['img'].width, 'h': fr['img'].height}, 'rotated': False, 'trimmed': True,
                            'spriteSourceSize': {'x': fr['sx'], 'y': fr['sy'], 'w': fr['img'].width, 'h': fr['img'].height},
                            'sourceSize': {'w': CW, 'h': CH}}
    out_clips = {}
    for cid in want:
        c = clips[cid]
        n = c['frames']
        per = (c.get('durationMsDraft') or n * 100) / n
        out_clips[cid] = {'frames': [f'{cid}/{i}' for i in range(n)], 'contact': c.get('contactFramesZeroBased', []), 'release': c.get('releaseFrameZeroBased', n - 1),
                          'durationMs': c.get('durationMsDraft'), 'frameMs': round(per), 'loop': cid in ('idle', 'walk'),
                          'impact': c.get('impactDraft'), 'timingGreenlit': bool(c.get('timingGreenlit')), 'source': c['file'], 'sha256': c.get('sha256')}
    odir = os.path.join(a.out, a.hero); os.makedirs(odir, exist_ok=True)
    webp = os.path.join(odir, a.hero + '.webp'); js = os.path.join(odir, a.hero + '.json')
    atlas.save(webp, 'WEBP', quality=a.quality, method=6)
    doc = {'frames': out_frames, 'meta': {'app': 'tools/art_intake.py', 'image': a.hero + '.webp', 'size': {'w': W, 'h': H}, 'scale': '1',
           'source': man.get('basePath'), 'manifestVersion': man.get('version'), 'created': man.get('created')},
           'hero': a.hero, 'canvas': {'w': CW, 'h': CH, 'pivot': {'x': half, 'y': above}}, 'standing': a.height, 'clips': out_clips}
    json.dump(doc, open(js, 'w'), indent=1)
    print(f'atlas {W}x{H} → {webp} ({os.path.getsize(webp) / 1024:.0f} KB), canvas {CW}x{CH}, {len(frames)} frames, {len(want)} clips', file=sys.stderr)

if __name__ == '__main__':
    main()
