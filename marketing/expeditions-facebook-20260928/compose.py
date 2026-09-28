"""70-second Facebook Reel. Real game capture + selected music, no game audio/VO."""
from pathlib import Path
import concurrent.futures, hashlib, json, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
WORK=ROOT/'work'; WORK.mkdir(exist_ok=True)
FF=Path('C:/Program Files (x86)/Steam/steamapps/common/SpellForceThree/editor/tools/ffmpeg/bin/ffmpeg.exe')
PROBE=FF.with_name('ffprobe.exe')
MUSIC=Path('C:/Users/charl/OneDrive/Documents/TTRPG/Kenji/music/cookie relaxation 2.wav')
OUT=ROOT/'Adventurer_Expeditions_Facebook_Reel_70s.mp4'
# Reframe individual shots around the action, without changing the gameplay camera.
# Tuple: capture, seconds, horizontal crop start/width, editorial chapter caption.
CUTS=[
 ('01-hiro-intro',5,180,1100,'MEET HIRO'),
 ('02-wolf-exchange',6,200,1080,'DRAW YOUR BLADE'),
 ('03-wolf-finisher',4,180,1040,'FINISH THE FIGHT'),
 ('04-forest-vault',5,180,1060,'TAKE THE ROAD'),
 ('05-swamp-serpent',6,200,1080,'INTO THE MARSH'),
 ('06-moss-giant',4,240,1040,'CUT THEM DOWN'),
 ('07-city-vault',4,180,1060,'THROUGH THE CITY'),
 ('08-goblin-finisher',4,240,1040,'MAKE YOUR MOVE'),
 ('09-spider-finisher',4,280,1000,'MAKE IT COUNT'),
 *[('10-inn-'+str(i),1.6,350,930,'TAKE A BREATHER') for i in range(5)],
 ('11-alpha-boss',5,180,1100,'FACE THE ALPHA'),
 ('12-orc-boss',6,200,1080,'ONE MORE BOSS'),
 ('13-victory',5,140,920,'WALK AWAY A WINNER'),
]
assert abs(sum(c[1] for c in CUTS)+4-70)<.001

def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode(errors='replace')[-4500:])
 return p.stdout

def font(size,bold=False,serif=False):
 name=('georgiab.ttf' if bold else 'georgia.ttf') if serif else ('segoeuib.ttf' if bold else 'segoeui.ttf')
 return ImageFont.truetype('C:/Windows/Fonts/'+name,size)

def center(draw,y,text,size,color,bold=False,serif=False):
 f=font(size,bold,serif);box=draw.textbbox((0,0),text,font=f)
 draw.text(((1080-(box[2]-box[0]))/2,y),text,font=f,fill=color)

def overlay(name,caption,end=False):
 im=Image.new('RGBA',(1080,1920),(0,0,0,0));d=ImageDraw.Draw(im)
 if end:
  for y in range(1360,1730):
   a=min(235,int((y-1360)*2));d.line((0,y,1080,y),fill=(12,9,22,a))
  center(d,1440,'NEVERENDINGNARRATIVES',40,'#edcd87',True)
  center(d,1508,'Follow the adventure on Facebook',38,'#fff6df')
  center(d,1570,'facebook.com/neverendingnarratives',38,'#ffffff',True)
 else:
  center(d,198,'ADVENTURER',62,'#f2d08a',True,True)
  center(d,280,'EXPEDITIONS',72,'#fff0c7',True,True)
  d.line((220,393,860,393),fill=(222,188,113,190),width=2)
  center(d,1340,caption,47,'#fff1d2',True)
  center(d,1450,'NEVERENDINGNARRATIVES',31,'#d9bd84',True)
  center(d,1504,'facebook.com/neverendingnarratives',29,'#e8e0ef')
 path=WORK/(name+'-overlay.png');im.save(path);return path

def encode(cut):
 name,secs,x,w,caption=cut
 text=overlay(name,caption)
 height=round(760*1080/w/2)*2
 y=round((1920-height)/2)-35
 graph=(f'[0:v]fps=30,split=2[b][f];'
  f'[b]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=32:2,eq=brightness=-0.42:saturation=0.65[bg];'
  f'[f]crop={w}:760:{x}:0,scale=1080:{height}[fg];'
  f'[bg][fg]overlay=0:{y}[shot];[shot][1:v]overlay=0:0,setsar=1,format=yuv420p')
 if name=='13-victory':graph+=',fade=t=out:st=4.4:d=0.6'
 graph+='[v]'
 dest=WORK/(name+'.mp4')
 run([FF,'-loglevel','error','-y','-i',ROOT/'raw'/(name+'.webm'),'-loop','1','-i',text,
      '-filter_complex_threads','1','-filter_complex',graph,'-map','[v]','-t',secs,'-an','-r','30',
      '-c:v','libx264','-preset','fast','-crf','20','-threads','2','-pix_fmt','yuv420p',dest])
 print('Encoded',name,flush=True)
 return dest

def main():
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:clips=list(ex.map(encode,CUTS))
 end=WORK/'14-endcard.mp4';text=overlay('endcard','',True)
 run([FF,'-loglevel','error','-y','-loop','1','-i',ROOT/'Adventurer_Expeditions_Cover_1080x1920.png',
      '-loop','1','-i',text,'-filter_complex_threads','1','-filter_complex',
      '[0:v][1:v]overlay=0:0,fade=t=in:st=0:d=0.6,setsar=1,format=yuv420p[v]',
      '-map','[v]','-t','4','-r','30','-an','-c:v','libx264','-preset','fast','-crf','20','-threads','2',end])
 clips.append(end)
 listing=WORK/'concat.txt';listing.write_text(''.join("file '"+c.as_posix()+"'\n" for c in clips),encoding='utf-8')
 silent=WORK/'reel-silent.mp4'
 run([FF,'-loglevel','error','-y','-f','concat','-safe','0','-i',listing,'-c','copy',silent])
 run([FF,'-loglevel','error','-y','-i',silent,'-i',MUSIC,'-map','0:v:0','-map','1:a:0',
      '-t','70','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000',
      '-af','loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.4,afade=t=out:st=68:d=2',
      '-movflags','+faststart',OUT])
 probe=json.loads(run([PROBE,'-v','error','-show_streams','-show_format','-of','json',OUT]))
 vs=next(s for s in probe['streams'] if s['codec_type']=='video')
 assert(vs['width'],vs['height'])==(1080,1920)
 assert abs(float(probe['format']['duration'])-70)<.1
 assert len(probe['streams'])==2
 report={'file':OUT.name,'duration':probe['format']['duration'],'bytes':OUT.stat().st_size,
  'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'music':str(MUSIC),'musicStartSeconds':0,
  'voiceover':False,'gameAudio':False,'cuts':CUTS,'endcardSeconds':4,'probe':probe}
 (ROOT/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print('VERIFIED',OUT,OUT.stat().st_size,flush=True)
if __name__=='__main__':main()
