"""CrazyGames store assets, cut from the Facebook campaign's clean captures.

Rules applied (docs.crazygames.com/requirements/game-covers, read 2026-09-28):
covers 1920x1080, 800x1200 and 800x800 with nothing written but the title;
preview video 15-20 s, landscape 1080p and portrait 1080p, no audio, no cursor,
no text, no black bars, no logo transitions, under 50 MB.

Run from the Expeditions root: python marketing/crazygames-store-20260928/build_store_assets.py
"""
from pathlib import Path
import json, re, subprocess, sys
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

if '--videos-only' not in sys.argv:
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
    
# Complete action beats; start and duration in seconds, no speed changes.
CUTS = [('03-wolf-finisher', 0, 4.0), ('04-forest-vault', 0.8, 4.0),
        ('06-moss-giant', 0, 2.5), ('12-orc-boss', 0, 6.0), ('13-victory', 0, 3.5)]
total = sum(c[2] for c in CUTS)
assert total == 20
WORK = ROOT / 'work' / 'preview-v2'
WORK.mkdir(parents=True, exist_ok=True)
for name, start, secs in CUTS:
    assert duration(SRC / 'raw' / (name + '.webm')) >= start + secs, name

parts = {'land': [], 'port': []}
for key, width, height in [('land', 1920, 1080), ('port', 1080, 1920)]:
    for name, start, secs in CUTS:
        src = SRC / 'raw' / (name + '.webm')
        dest = WORK / (name + '-' + key + '.mp4')
        # Fit the complete game frame. Background fill never replaces or clips it.
        graph = (f'[0:v]trim=start={start}:duration={secs},setpts=PTS-STARTPTS,fps=30,split=2[b][f];'
                 f'[b]scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},'
                 'boxblur=24:2,eq=brightness=-0.3:saturation=0.7[bg];'
                 f'[f]scale={width}:{height}:force_original_aspect_ratio=decrease:force_divisible_by=2[fg];'
                 '[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p[v]')
        run([FF, '-v', 'error', '-y', '-i', src, '-filter_complex_threads', '1', '-filter_complex', graph,
             '-map', '[v]', '-frames:v', str(round(secs*30)), '-an', '-r', '30', '-c:v', 'libx264',
             '-preset', 'fast', '-crf', '20', '-threads', '2', '-video_track_timescale', '15360', dest])
        parts[key].append(dest)
        print('Encoded', key, name, flush=True)

videos = {}
for key, out in [('land', 'Adventurer_Expeditions_Preview_1920x1080.mp4'), ('port', 'Adventurer_Expeditions_Preview_1080x1920.mp4')]:
    lst = WORK / (key + '.txt')
    lst.write_text(''.join("file '" + p.as_posix() + "'\n" for p in parts[key]), encoding='utf-8')
    run([FF, '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-an',
         '-movflags', '+faststart', ROOT / out])
    seconds = duration(ROOT / out)
    assert abs(seconds - 20) < 0.1, seconds
    assert (ROOT / out).stat().st_size < 50_000_000
    videos[out] = {'seconds': seconds, 'bytes': (ROOT / out).stat().st_size, 'audio': False}

# Preserve cover provenance when rebuilding video only.
report_path = ROOT / 'verification.json'
report = json.loads(report_path.read_text(encoding='utf-8')) if report_path.exists() else {}
report.update(videos=videos, cuts=CUTS, source=str(SRC), previewRevision=2,
              framing='Full game frame fitted in both orientations over soft scenery fill',
              timeline='Wolf 0-4; travel 4-8; swamp 8-10.5; orc 10.5-16.5; victory 16.5-20')
report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
print('Verified two silent 20-second previews', flush=True)
