"""Re-extract three existing travel sheets using painted pose ownership, not a grid.

No new poses, retiming, per-pose rescaling, or silhouette painting. Source masters
stay untouched. The prior rooftop ledge-grip replacement remains frame four.
"""
import copy
import hashlib
import json
import shutil
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw
from art_intake_v2 import build

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'adventurer-expeditions-source-art/astra-v3/travel'
EVIDENCE = ROOT.parent / 'adventurer-expeditions-source-art/astra-v9/all-chapter-qa-20261015/travel'
ROWS = {
    'swamp-log-slide': [(0,395,[0,348,748,1086]), (400,710,[0,330,692,1086]),
                        (745,1040,[0,430,757,1086]), (1050,1448,[0,350,736,1086])],
    'city-market-vault': [(0,425,[0,333,676,1024]), (440,768,[0,402,656,1024]),
                          (780,1160,[0,359,698,1024]), (1160,1536,[0,345,682,1024])],
    'city-rooftop-run': [(0,355,[0,362,724,1086]), (355,770,[0,385,745,1086]),
                         (770,1080,[0,362,724,1086]), (1080,1448,[0,362,724,1086])],
}

def repair(scene_id):
    src, dest = SOURCE / scene_id, ROOT / 'assets/expedition/travel' / scene_id
    evidence = EVIDENCE / scene_id
    evidence.mkdir(parents=True, exist_ok=True)
    for name in ['actions.json', 'actions-0.webp', 'scene.json']:
        backup = evidence / ('before-' + name)
        if not backup.exists(): shutil.copyfile(dest / name, backup)
    old = json.loads((evidence / 'before-actions.json').read_text(encoding='utf-8'))
    scene = json.loads((evidence / 'before-scene.json').read_text(encoding='utf-8'))
    manifest = json.loads((src / 'runtime-registration.json').read_text(encoding='utf-8'))
    clip = manifest['clips'][0]
    original_reg = copy.deepcopy(clip['registration'])
    master = Image.open(src / 'hiro-actions.png')
    cw, ch = master.width / 3, master.height / 4
    clip['sources'] = []
    for i in range(12):
        if scene_id == 'city-rooftop-run' and i == 4:
            clip['sources'].append(dict(file='ledge-grip-frame.png',frames=1,columns=1,rows=1,firstFrameZeroBased=i))
            continue
        top, bottom, edges = ROWS[scene_id][i // 3]
        left, right = edges[i % 3:i % 3 + 2]
        clip['sources'].append(dict(file='hiro-actions.png',frames=1,firstFrameZeroBased=i,
                                   regions=[[left, top, right-left, bottom-top]]))
        guide = clip['registration']['frames'][i]
        before = original_reg['frames'][i]
        guide['anchorX'] = round(i % 3 * cw) + before.get('anchorX', original_reg['anchorX']) - left
        guide['groundY'] = round(i // 3 * ch) + before.get('groundY', original_reg['groundY']) - top
        planted = range(12) if scene_id == 'swamp-log-slide' else ([0,1,8,9,10,11] if scene_id == 'city-market-vault' else [0,1,6,7,8,9,10,11])
        if i in planted:
            alpha = master.crop((left,top,right,bottom)).getchannel('A').point(lambda a:255 if a>96 else 0)
            guide['groundY'] = alpha.getbbox()[3]
    clip['sha256'] = hashlib.sha256((src / 'hiro-actions.png').read_bytes()).hexdigest()
    (evidence / 'registration.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    with tempfile.TemporaryDirectory(prefix='travel-cell-repair-') as temp:
        doc = build(src,'actions',temp,300,82,manifest,lossless=True)
        packed = Path(temp) / 'actions'
        # Timing and contacts are already approved; only extraction changes.
        for key,value in old['clips']['travel'].items():
            if key not in ['sourceRegistration','sources']: doc['clips']['travel'][key] = value
        doc['clips']['travel']['sourceRevision'] = 'pose-ownership-20261015'
        for texture in doc['textures']:
            name = texture['image']
            digest = hashlib.sha256((packed / name).read_bytes()).hexdigest()[:12]
            new_name = 'actions-qa-' + digest + '.webp'
            shutil.copyfile(packed / name, dest / new_name)
            texture['image'] = new_name
        doc['meta']['pages'] = [texture['image'] for texture in doc['textures']]
        (dest / 'actions.json').write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
        scene['canvas'], scene['pivot'] = doc['canvas'], doc['canvas']['pivot']
        # The original landing endpoint moved the extended arm off the right
        # screen edge just before run-out. Keep the last contact on the plate.
        if scene_id in ['swamp-log-slide','city-market-vault']:
            scene['frames'][9]['x'] -= 60
        (dest / 'scene.json').write_text(json.dumps(scene,indent=2)+'\n',encoding='utf-8')
    # Archive the superseded page; deletion is limited to its exact known file.
    obsolete = dest / 'actions-0.webp'
    if obsolete.is_file(): obsolete.unlink()
    montage = Image.new('RGB',(1200,1200),(62,64,70)); draw = ImageDraw.Draw(montage)
    for i in range(12):
        f = doc['frames']['travel/'+str(i)]; r=f['frame']; offset=f['spriteSourceSize']
        page=Image.open(dest / doc['textures'][f['page']]['image'])
        image=page.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
        canvas=Image.new('RGBA',(doc['canvas']['w'],doc['canvas']['h']))
        canvas.paste(image,(offset['x'],offset['y']))
        canvas.thumbnail((395,280))
        x,y=(i%3)*400,(i//3)*300
        montage.paste(canvas,(x+(400-canvas.width)//2,y+20),canvas)
        draw.text((x+8,y+5),str(i),fill='white')
    montage.save(evidence / 'repaired-frames.jpg',quality=95)
    print(scene_id, doc['canvas'])

if __name__ == '__main__':
    for scene_id in ROWS: repair(scene_id)
