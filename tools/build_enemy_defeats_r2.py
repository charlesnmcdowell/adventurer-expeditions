"""Reviewed wolf/orc replacement intake; preserves first-pass source masters."""
import sys
import build_enemy_defeats as b
b.SRC=b.ROOT.parent/'adventurer-expeditions-source-art/astra-v4/enemy-defeats-20261008-r2'
b.AUDIT=b.ROOT/'docs/art/enemy-defeats-20261008-r2'
b.ACTORS=['wolf','orc']
# Source wolf pose 2 clips its tail at the right edge. Remaining bite poses
# show the same action without a partial monster or a neighboring frame.
b.OMITTED={'wolf':{2}}
b.PACK_TAG='review-r2'
if '--prepare' in sys.argv:b.prepare()
if '--apply' in sys.argv:b.apply()
