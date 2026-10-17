"""Apply reviewed idle-only registration guides; never alter atlas pixels.
Run after intake or directly for existing runtime metadata. Unexpected replacement
art dimensions fail explicitly so old anchors cannot silently deform new art.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'tools/idle_roster_registration.json'

def repair(doc):
    spec=json.loads(CONFIG.read_text(encoding='utf-8'))['actors'].get(doc.get('hero'))
    if not spec:return doc
    packed={f['filename']:f for t in doc['textures'] for f in t['frames']}
    for g in spec['frames']:
        f=doc['frames'][g['frame']]
        if (f['frame']['w'],f['frame']['h'])!=(g['width'],g['height']):
            raise ValueError('Idle art changed; remeasure registration for '+doc['hero']+'/'+g['frame'])
        # Preserve canvas pivot and first pose; only trim placement changes.
        for entry in [f,packed[g['frame']]]:
            entry['spriteSourceSize']={**entry['spriteSourceSize'],'x':g['after']['x'],'y':g['after']['y']}
    return doc

if __name__=='__main__':
    actors=json.loads(CONFIG.read_text(encoding='utf-8'))['actors']
    for actor in actors:
        path=ROOT/'assets/expedition'/actor/(actor+'.json')
        doc=json.loads(path.read_text(encoding='utf-8'));repair(doc)
        path.write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
    print('Idle metadata repaired:',len(actors),'actors; no atlas edits')
