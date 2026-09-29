"""CrazyGames store assets, cut from the Facebook campaign's clean captures.

Rules applied (docs.crazygames.com/requirements/game-covers, read 2026-09-28):
covers 1920x1080, 800x1200 and 800x800 with nothing written but the title;
preview video 15-20 s, landscape 1080p and portrait 1080p, no audio, no cursor,
no text, no black bars, no logo transitions, under 50 MB.

Run from the Expeditions root: python marketing/crazygames-store-20260928/build_store_assets.py
"""
from pathlib import Path
import json, re, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
SRC = ROOT.parent / 'expeditions-facebook-20260928'
FF = Path('C:/Users/charl/AppData/Local/Programs/Python/Python311/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
WORK = ROOT / 'work'; WORK.mkdir(exist_ok=True)

def run(args):
    p = subprocess.run([str(a) for a in args], capture_output=True)
    if p.returncode: raise RuntimeError(p.stderr.decode(errors='replace')[-3000:])
    return p

def duration(path):
    # The WebM captures carry no duration header; decode to null and read the last timestamp.
    p = subprocess.run([str(FF), '-i', str(path), '-f', 'null', '-'], capture_output=True)
    times = re.findall(rb'time=(\d+):(\d+):(\d+\.\d+)', p.stderr)
    if not times: raise RuntimeError('no duration for ' + str(path))
    h, m, s = times[-1]
    return int(h) * 3600 + int(m) * 60 + float(s)

# ---------------------------------------------------------------- covers
master = Image.open(SRC / 'cover-master.png').convert('RGB')   # 941 x 1672, title painted in, studio name at the foot
W, H = master.size

def save(im, name):
    im.save(ROOT / name, optimize=True); print(name, im.size)

# Portrait 2:3 from the top of the master: keeps the painted title and Hiro, drops
# the studio name at the foot (only the game's title may appear).
ph = round(W * 3 / 2)
save(master.crop((0, 0, W, ph)).resize((800, 1200), Image.LANCZOS), 'Adventurer_Expeditions_Cover_800x1200.png')
# Dedicated square composition keeps Hiro, the blade and title fully in frame.
square = Image.open(ROOT / 'square-cover-master.png').convert('RGB')
save(square.resize((800, 800), Image.LANCZOS), 'Adventurer_Expeditions_Cover_800x800.png')

# Landscape has a dedicated, coherent widescreen master matching the portrait.
# Do not reconstruct it from blurred portrait crops or extract duplicate lettering.
land = Image.open(ROOT / 'landscape-cover-master.png').convert('RGB')
save(land.resize((1920, 1080), Image.LANCZOS), 'Adventurer_Expeditions_Cover_1920x1080.png')

# ---------------------------------------------------------------- videos
# (capture, seconds, crop x, crop width) — the same reframes the reel used, no captions.
CUTS = [('02-wolf-exchange', 3.0, 200, 1080), ('03-wolf-finisher', 4.0, 180, 1040), ('04-forest-vault', 3.0, 180, 1060),
        ('06-moss-giant', 3.0, 240, 1040), ('12-orc-boss', 4.0, 200, 1080), ('13-victory', 2.0, 140, 920)]
total = sum(c[1] for c in CUTS); assert 15 <= total <= 20, total
for name, secs, x, w in CUTS:
    assert duration(SRC / 'raw' / (name + '.webm')) >= secs, name

def encode(out, graph, inputs):
    args = [FF, '-y']
    for i in inputs: args += ['-i', i]
    args += ['-filter_complex', graph, '-map', '[v]', '-an', '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]
    run(args)

parts = {'land': [], 'port': []}
for name, secs, x, w in CUTS:
    src = SRC / 'raw' / (name + '.webm')
    # Landscape 1920x1080: scale the 1280x760 frame to 1920 wide and trim the 60 px the 16:9 frame cannot hold.
    outL = WORK / (name + '-land.mp4')
    encode(outL, f'[0:v]trim=0:{secs},setpts=PTS-STARTPTS,fps=30,scale=1920:1140:flags=lanczos,crop=1920:1080:0:30,setsar=1[v]', [src])
    parts['land'].append(outL)
    # Portrait 1080x1920: the action reframed to 1080 wide over a blurred fill of the same frame, as the reel did.
    hgt = round(760 * 1080 / w / 2) * 2
    outP = WORK / (name + '-port.mp4')
    encode(outP, (f'[0:v]trim=0:{secs},setpts=PTS-STARTPTS,fps=30,split=2[b][f];'
                  f'[b]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=-0.12[bg];'
                  f'[f]crop={w}:760:{x}:0,scale=1080:{hgt}:flags=lanczos[fg];'
                  f'[bg][fg]overlay=0:(H-h)/2,setsar=1[v]'), [src])
    parts['port'].append(outP)

for key, out in [('land', 'Adventurer_Expeditions_Preview_1920x1080.mp4'), ('port', 'Adventurer_Expeditions_Preview_1080x1920.mp4')]:
    lst = WORK / (key + '.txt'); lst.write_text(''.join(f"file '{p.as_posix()}'\n" for p in parts[key]))
    run([FF, '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', ROOT / out])
    print(out, round(duration(ROOT / out), 2), 's', round((ROOT / out).stat().st_size / 1048576, 1), 'MB')

report = {'covers': {n: Image.open(ROOT / n).size for n in ['Adventurer_Expeditions_Cover_1920x1080.png', 'Adventurer_Expeditions_Cover_800x1200.png', 'Adventurer_Expeditions_Cover_800x800.png']},
          'videos': {n: {'seconds': round(duration(ROOT / n), 2), 'mb': round((ROOT / n).stat().st_size / 1048576, 2)} for n in ['Adventurer_Expeditions_Preview_1920x1080.mp4', 'Adventurer_Expeditions_Preview_1080x1920.mp4']},
          'cuts': CUTS, 'source': str(SRC)}
(ROOT / 'verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=1))
