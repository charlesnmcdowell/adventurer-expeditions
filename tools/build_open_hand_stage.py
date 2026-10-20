"""Encode the edited Open Hand combat plate; retain its generated source master."""
from pathlib import Path
from PIL import Image
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'adventurer-expeditions-source-art/astra-v12/open-hand-ground-20261020'
master = SOURCE / 'open-hand-courtyard.png'
dest = ROOT / 'assets/expedition/story/stages/open-hand-combat-20261020.webp'
im = Image.open(master).convert('RGB')
if abs(im.width / im.height - 1280 / 760) > .01:
    raise ValueError('Combat master must keep the authored 32:19 composition')
im.resize((1280, 760), Image.Resampling.LANCZOS).save(dest, 'WEBP', quality=92, method=6)
record = json.loads((SOURCE / 'prompts.json').read_text())
record.update(file=dest.relative_to(ROOT).as_posix(), width=1280, height=760,
              sourceSha256=hashlib.sha256(master.read_bytes()).hexdigest(),
              sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),
              bytes=dest.stat().st_size, walkableY=[450, 710],
              note='Combat only; original dialogue painting remains unchanged.')
(ROOT / 'docs/art/open-hand-ground-20261020.json').write_text(json.dumps(record, indent=2))
print(str(dest) + ': ' + str(record['bytes']) + ' bytes')
