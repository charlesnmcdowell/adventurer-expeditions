#!/usr/bin/env python3
"""Rebuild painted atlases; apply the approved Hiro v2 delta over v1 clips."""
import argparse, copy, json, os, runpy, subprocess, sys
from pathlib import Path
from art_intake_v2 import build
ROOT=Path(__file__).resolve().parents[1]

HIRO_DELTA_COUNTS={'walk':16,'idle-sheathed':4,'wolf-cleave-paired':12,
    'wolf-pin-paired':6,'wolf-rising-cut-paired':6,'plant-stem-cut-paired':8,
    'plant-vine-pin-paired':6,'plant-crosscut-paired':6}
RETIRED_HIRO_CLIPS={'finisher-l1-paired','finisher-l2-paired','finisher-l3-paired'}

def hiro_delta(v1_root,v2_root):
    """Keep every unaffected v1 clip; source images are never copied into ship."""
    old=json.loads((ROOT/'tools/art_registration/hiro.json').read_text(encoding='utf-8-sig'))
    new=json.loads((v2_root/'heroes/hiro/manifest.json').read_text(encoding='utf-8-sig'))
    updates={c['id']:copy.deepcopy(c) for c in new['clips']}
    if set(updates)!=set(HIRO_DELTA_COUNTS):raise ValueError('Unexpected Hiro v2 delta clip set')
    for name,count in HIRO_DELTA_COUNTS.items():
        c=updates[name]
        if c['frames']!=count:raise ValueError('Approved frame count changed: '+name)
        c['sourceRoot']=str((v2_root/'heroes/hiro').resolve())
        if name=='plant-crosscut-paired':
            # Its concave root/vine gaps contain a slightly shadowed gray
            # board. This local tolerance avoids altering other painted clips.
            c['enclosedMatteTolerance']=12
        if c.get('paired'):
            wolf=name.startswith('wolf-')
            c['opponentKinds']=['wolf' if wolf else 'plant']
            c['opponentKeys']=['dire_wolf' if wolf else 'thorn_lurker']
            # First-frame foe body/root center relative to the authored Hiro
            # ground anchor, in body-height units. This is staging distance,
            # not a per-frame transform or an extra damage/contact trigger.
            c['pairTargetDistanceRatio']={
                'wolf-cleave-paired':.86,'wolf-pin-paired':.72,
                'wolf-rising-cut-paired':.78,'plant-stem-cut-paired':.84,
                'plant-vine-pin-paired':.95,'plant-crosscut-paired':.87}[name]
            c.setdefault('finalState','drawn-idle')
    merged=[]
    for original in old['clips']:
        if original['id'] in RETIRED_HIRO_CLIPS:continue
        c=copy.deepcopy(original)
        c['sourceRoot']=str((v1_root/'heroes/hiro').resolve())
        merged.append(updates.pop(c['id'],c))
    merged.extend(updates.values())
    if sum(c['frames'] for c in merged)!=175:raise ValueError('Hiro delta must contain175 frames')
    return {'hero':'hiro','version':2,'clips':merged}

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--masters',type=Path,default=ROOT.parent/'adventurer-expeditions-source-art/astra-v1')
    p.add_argument('--v2-masters',type=Path,default=ROOT.parent/'adventurer-expeditions-source-art/astra-v2')
    p.add_argument('--actors',default='hiro,bram,wolf,boar,plant,alpha')
    a=p.parse_args(); os.chdir(ROOT)
    if not a.masters.is_dir():raise SystemExit('Source art folder not found: '+str(a.masters))
    subprocess.run([sys.executable,'tools/test_art_intake_v2.py'],check=True)
    runpy.run_path(str(ROOT/'tools/prepare_art_registration.py'),run_name='__main__')
    for actor in a.actors.split(','):
        if actor not in {'hiro','bram','wolf','boar','plant','alpha'}:raise SystemExit('Unknown actor '+actor)
        human=actor in {'hiro','bram'}
        src=a.masters/('heroes/'+actor if human else 'beasts')
        manifest=hiro_delta(a.masters,a.v2_masters) if actor=='hiro' else ROOT/('tools/art_registration/'+actor+'.json')
        build(src,actor,ROOT/'assets/expedition',320 if human else 200,76,manifest)
    subprocess.run(['node','test/art_registration.js'],check=True)
    subprocess.run(['node','tools/size_check.js'],check=True)
