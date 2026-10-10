"""Verify replacement intake against its saved baseline, without changing assets.

Requires the sibling astra-v7 source delivery. Checks visible pixels and root
offsets of retained frames, not arbitrary RGB under fully transparent pixels.
"""
import json
from functools import lru_cache
import numpy as np
from PIL import Image
from build_v7_pairs import ROOT, SRC, ACTORS, remove_grid_rules

@lru_cache(maxsize=4)
def load_page(path):
    return Image.open(path).convert('RGBA')

def frame(folder,doc,name):
    f=doc['frames'][name];r=f['frame'];s=f['spriteSourceSize'];p=doc['canvas']['pivot']
    im=load_page(folder/doc['textures'][f['page']]['image'])
    a=np.array(im.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])))
    return a,(s['x']-p['x'],s['y']-p['y'])

count=0
for actor in ACTORS:
    before=SRC/'baseline'/actor;after=ROOT/'assets/expedition'/actor
    old=json.loads((before/(actor+'.json')).read_text());new=json.loads((after/(actor+'.json')).read_text())
    replacements=['hiro-finisher-1']+([] if actor=='moss_giant' else ['hiro-finisher-2'])
    for ident,c in old['clips'].items():
        if ident in replacements:continue
        assert c==new['clips'][ident],(actor,ident,'retained timing or lifecycle changed')
        for name in c['frames']:
            a,pa=frame(before,old,name);b,pb=frame(after,new,name)
            assert pa==pb and a.shape==b.shape,(actor,name,'retained registration changed',pa,pb,a.shape,b.shape)
            assert np.array_equal(a[:,:,3],b[:,:,3]),(actor,name,'alpha changed')
            assert np.array_equal(a[:,:,:3][a[:,:,3]>0],b[:,:,:3][b[:,:,3]>0]),(actor,name,'visible RGB changed')
            count+=1
    for ident in replacements:
        c=new['clips'][ident]
        assert c['opponentKinds']==old['clips'][ident]['opponentKinds'],(actor,'boss/family matching changed')
        assert c['release']==len(c['frames'])-1
        assert len(set(c['sourceRegistration']['referenceHeights']))==1
        for source in c['sources']:
            im=Image.open(source).convert('RGBA')
            assert np.array_equal(np.array(im),np.array(remove_grid_rules(im))),(source,'unremoved grid rule')
print(f'v7 intake: {count} retained frames pixel/alpha/root-identical; 17 replacements have stable scales, clean borders and matching families')
