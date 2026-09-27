"""Pack generated parallax bands; preserve native transparency and source masters."""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v3/atmosphere'
for entry in json.loads((SRC/'intake.json').read_text()):
    im=Image.open(SRC/entry['file']).convert('RGBA')
    dest=ROOT/'assets/expedition/travel'/entry['id']
    for i,name in enumerate(['far','ground','near']):
        rect=entry.get('regions',[(0,entry['cuts'][n],im.width,entry['cuts'][n+1]) for n in range(3)])[i]
        band=im.crop(rect)
        if name!='far':
            if band.getchannel('A').getextrema()[0]>10:raise ValueError('Missing real alpha: '+entry['id']+' '+name)
        band.resize((2280,760),Image.Resampling.LANCZOS).save(dest/('atmosphere-'+name+'.webp'),quality=84,method=6)
    print(entry['id'],'packed three layers')
