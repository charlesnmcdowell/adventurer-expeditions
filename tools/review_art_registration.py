"""Visual and numeric QA of registered runtime atlas frames."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
out=root/'test/reports/registration'
out.mkdir(parents=True,exist_ok=True)
for hero in ['hiro','bram','wolf','boar','plant','alpha']:
    d=json.loads((root/f'assets/expedition/{hero}/{hero}.json').read_text())
    pages=[Image.open(root/f'assets/expedition/{hero}'/t['image']) for t in d['textures']]
    picks=[]
    for name,c in d['clips'].items():
        picks.append((name,0))
        if name in ['hit-short','hit_short','walk','draw','bite_leg','bite-leg-paired','finisher-l1-paired','roll','down_fade','enrage']:picks.append((name,len(c['frames'])-1))
    w,h=380,440;cols=5
    board=Image.new('RGB',(cols*w,((len(picks)+cols-1)//cols)*h),'#203a43')
    draw=ImageDraw.Draw(board)
    for idx,(name,n) in enumerate(picks):
        f=d['frames'][d['clips'][name]['frames'][n]];r=f['frame'];img=pages[f['page']].crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
        x0=idx%cols*w;y0=idx//cols*h;base=y0+405
        scale=min(1,360/d['standing'],350/max(1,r['w']))
        img=img.resize((max(1,round(img.width*scale)),max(1,round(img.height*scale))))
        x=round(x0+160+(f['spriteSourceSize']['x']-d['canvas']['pivot']['x'])*scale)
        y=round(base+(f['spriteSourceSize']['y']-d['canvas']['pivot']['y'])*scale)
        board.paste(img,(x,y),img)
        draw.line((x0,base,x0+w,base),fill='#7eaaaa')
        draw.text((x0+4,y0+5),f'{hero} {name} /{n}',fill='white')
        draw.text((x0+4,y0+22),f'body {d["standing"]}px, view {scale:.2f}',fill='white')
    board.save(out/(hero+'-registration.png'))
print('Wrote registration review boards.')

