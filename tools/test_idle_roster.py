"""Idle guides must survive intake without changing other animations."""
import copy,json,unittest
from repair_idle_roster import repair,ROOT,CONFIG

class IdleRegistrationTests(unittest.TestCase):
 def test_roster_and_rebuild_contract(self):
  specs=json.loads(CONFIG.read_text())['actors']
  self.assertEqual(len(specs),36)
  for actor,spec in specs.items():
   with self.subTest(actor=actor):
    doc=json.loads((ROOT/'assets/expedition'/actor/(actor+'.json')).read_text())
    current=copy.deepcopy(doc)
    repair(doc)
    self.assertEqual(doc,current,'repair must be idempotent')
    packed={f['filename']:f for t in doc['textures'] for f in t['frames']}
    for g in spec['frames']:
     ss=doc['frames'][g['frame']]['spriteSourceSize']
     self.assertLessEqual(abs(ss['x']+g['anchorX']-spec['targetX']),0.5)
     self.assertEqual(ss['y']+g['anchorY'],spec['targetY'])
     self.assertEqual(ss,packed[g['frame']]['spriteSourceSize'])
     # Simulate freshly intaken original registration.
     doc['frames'][g['frame']]['spriteSourceSize']=copy.deepcopy(g['before'])
     packed[g['frame']]['spriteSourceSize']=copy.deepcopy(g['before'])
    repair(doc)
    self.assertEqual(doc,current,'intake must produce the reviewed metadata exactly')
    # A wider finisher can change the atlas canvas: anchor relative to pivot.
    doc['canvas']['pivot']['x']+=37;doc['canvas']['pivot']['y']+=19
    repair(doc)
    for g in spec['frames']:
     ss=doc['frames'][g['frame']]['spriteSourceSize']
     self.assertEqual(ss['x'],g['after']['x']+37)
     self.assertEqual(ss['y'],g['after']['y']+19)
    self.assertEqual(doc['clips'],current['clips'])
    for name,f in doc['frames'].items():
     if not name.startswith('idle/'):self.assertEqual(f,current['frames'][name])
    doc['frames']['idle/0']['frame']['w']+=1
    with self.assertRaisesRegex(ValueError,'remeasure'):repair(doc)

if __name__=='__main__':unittest.main()
