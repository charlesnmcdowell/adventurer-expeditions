#!/usr/bin/env python3
"""Render shipped Hiro atlas frames at fixed body scale for intake review."""
import json, math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
ATLAS=ROOT/'assets/expedition/hiro'
REPORT=ROOT/'test/reports/registration/hiro-v2'
CLIPS=['idle','walk','idle-sheathed','wolf-cleave-paired','wolf-pin-paired',
       'wolf-rising-cut-paired','plant-stem-cut-paired','plant-vine-pin-paired','plant-crosscut-paired']

def main():
    meta=json.loads((ATLAS/'hiro.json').read_text())
    pages=[Image.open(ATLAS/t['image']).convert('RGBA') for t in meta['textures']]
    REPORT.mkdir(parents=True,exist_ok=True)
    scale=200/meta['standing']
    # Fixed window/pivot across every pose. Cropping each pose to a filled box
    # would hide registration and body-scale defects in the review itself.
    cellw,cellh,originx,ground=560,295,270,260
    for name in CLIPS:
        c=meta['clips'][name];columns=2;rows=math.ceil(len(c['frames'])/columns)
        board=Image.new('RGBA',(cellw*columns,cellh*rows),(17,30,42,255))
        d=ImageDraw.Draw(board)
        for n,key in enumerate(c['frames']):
            f=meta['frames'][key];r=f['frame'];s=f['spriteSourceSize'];p=meta['canvas']['pivot']
            tile=pages[f['page']].crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
            tile=tile.resize((round(tile.width*scale),round(tile.height*scale)),Image.Resampling.LANCZOS)
            col,row=n%columns,n//columns;left,top=col*cellw,row*cellh
            x=round(originx+(s['x']-p['x'])*scale);y=round(ground+(s['y']-p['y'])*scale)
            if x<0 or y<22 or x+tile.width>cellw or y+tile.height>cellh:
                raise ValueError(f'Review window clips {key}: {(x,y,tile.width,tile.height)}')
            d.line((left,top+ground,left+cellw,top+ground),fill=(53,88,88))
            d.line((left+originx,top+24,left+originx,top+ground+8),fill=(41,58,67))
            board.alpha_composite(tile,(left+x,top+y))
            label=f'{name} / {n} — {c["frameDurationsMs"][n]}ms'
            # Pillow default font is ASCII on some bundled runtimes.
            d.text((left+12,top+8),label.replace('—','-'),fill='white')
        board.convert('RGB').save(REPORT/(name+'.jpg'),quality=92)
    print(REPORT)

if __name__=='__main__':main()
