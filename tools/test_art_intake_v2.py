"""Focused deterministic intake regressions; no source-art or browser required."""
import unittest
from PIL import Image, ImageDraw
from art_intake_v2 import key_cell, clip_polygon, source_frames

class IntakeTests(unittest.TestCase):
    def test_border_blade_is_not_erased_with_matte(self):
        im=Image.new('RGB',(64,64),(170,170,170));d=ImageDraw.Draw(im)
        d.rectangle((20,15,45,60),fill=(35,24,50))
        d.line((0,20,35,30),fill=(245,245,247),width=2)
        out,_=key_cell(im)
        self.assertEqual(out.getpixel((0,20))[3],255)
        self.assertEqual(out.getpixel((0,0))[3],0)

    def test_true_alpha_is_preserved_exactly(self):
        im=Image.new('RGBA',(32,32),(0,0,0,0));d=ImageDraw.Draw(im)
        d.rectangle((3,3,28,28),fill=(170,170,170,255))
        d.line((1,1,29,25),fill=(190,220,250,61),width=2)
        out,_=key_cell(im)
        self.assertEqual(out.tobytes(),im.tobytes())

    def test_concave_enclosed_matte_is_removed(self):
        im=Image.new('RGB',(128,110),(170,170,170));d=ImageDraw.Draw(im)
        d.rectangle((5,5,120,105),fill=(33,22,44))
        d.polygon([(20,20),(32,20),(32,80),(100,80),(100,92),(20,92)],fill=(171,171,170))
        d.line((50,20,105,50),fill=(239,239,242),width=3)
        out,_=key_cell(im)
        self.assertEqual(out.getpixel((25,50))[3],0)
        self.assertEqual(out.getpixel((70,86))[3],0)
        self.assertEqual(out.getpixel((50,20))[3],255)
        self.assertEqual(out.getpixel((60,60))[3],255)

    def test_authored_polygon_preserves_toe_but_excludes_neighbor(self):
        im=Image.new('RGBA',(40,50),(30,20,50,255))
        out=clip_polygon(im,[[0,0],[30,0],[30,35],[40,35],[40,50],[0,50]])
        self.assertEqual(out.getpixel((35,20))[3],0)
        self.assertEqual(out.getpixel((35,42))[3],255)

    def test_multisource_is_a_single_contiguous_clip(self):
        clip={'id':'run','frames':4,'sources':[{'file':'a.png','frames':2,'firstFrameZeroBased':0},
              {'file':'b.png','frames':2,'firstFrameZeroBased':2}],
              'frameFiles':['a.png','a.png','b.png','b.png'],'sourceIndices':[0,0,1,1]}
        self.assertEqual([(ix,si,local) for ix,si,s,local in source_frames(clip)],[(0,0,0),(1,0,1),(2,1,0),(3,1,1)])
        clip['sources'][1]['firstFrameZeroBased']=3
        with self.assertRaisesRegex(ValueError,'noncontiguous'):list(source_frames(clip))

if __name__=='__main__':unittest.main()
