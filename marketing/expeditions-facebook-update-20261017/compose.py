"""45-second update Reel, full-width game footage, original end card, music only."""
from pathlib import Path
import hashlib,json,subprocess
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent
WORK=ROOT/'work';WORK.mkdir(exist_ok=True)
REVIEW=ROOT/'review';REVIEW.mkdir(exist_ok=True)
FF=Path('C:/Program Files (x86)/Steam/steamapps/common/SpellForceThree/editor/tools/ffmpeg/bin/ffmpeg.exe')
PROBE=FF.with_name('ffprobe.exe')
OLD=ROOT.parent/'expeditions-facebook-20260928'/'Adventurer_Expeditions_Facebook_Reel_70s.mp4'
MUSIC=Path('C:/Users/charl/OneDrive/Documents/TTRPG/Kenji/music/Hammer Psalm black smith theme 1.wav')
OUT=ROOT/'Adventurer_Expeditions_Facebook_Update_45s.mp4'
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode(errors='replace')[-4000:])
 return p.stdout
def probe(p):return json.loads(run([PROBE,'-v','error','-show_streams','-show_format','-of','json',p]))
def font(size,bold=False,serif=False):
 return ImageFont.truetype('C:/Windows/Fonts/'+(('georgiab.ttf' if bold else 'georgia.ttf') if serif else ('segoeuib.ttf' if bold else 'segoeui.ttf')),size)
def center(d,y,text,size,color,bold=False,serif=False):
 f=font(size,bold,serif);box=d.textbbox((0,0),text,font=f)
 d.text(((1080-box[2]+box[0])/2,y),text,font=f,fill=color,stroke_width=1,stroke_fill='#110d1c')
def overlay(kind):
 im=Image.new('RGBA',(1080,1920));d=ImageDraw.Draw(im)
 if kind=='intro':
  center(d,300,'ADVENTURER',70,'#f2d18b',True,True)
  center(d,390,'EXPEDITIONS',53,'#fff3d9',True,True)
  d.line((365,480,715,480),fill='#c6a568',width=2)
  center(d,508,'NEW GAME UPDATE',34,'#ffffff',True)
 else:
  center(d,1300,'PLAY THE DEMO',55,'#f2d18b',True)
  center(d,1382,'neverendingnarratives.com',43,'#ffffff',True)
  center(d,1441,'/expeditions',40,'#ffffff')
  center(d,1530,'Send me your feedback on Facebook',35,'#fff3d9')
 p=WORK/(kind+'.png');im.save(p);return p
def frame(p,t,out):
 run([FF,'-loglevel','error','-y','-ss',t,'-i',p,'-frames:v','1',out])
def main():
 report=json.loads((ROOT/'capture.json').read_text())
 assert not report['errors']
 files=[];cuts=[]
 for i,(shot,seconds) in enumerate(zip(report['shots'],[14,13,14])):
  raw=ROOT/'raw'/(shot['name']+'.webm');timed=WORK/(shot['name']+'.mkv')
  run([FF,'-loglevel','error','-y','-i',raw,'-c','copy',timed])
  duration=float(probe(timed)['format']['duration']);raw=timed
  markers=shot['markers'];end=next(m for m in markers if m['type']=='finisher-end')
  assert end['remaining']==0
  dest=WORK/(shot['name']+'.mp4')
  args=[FF,'-loglevel','error','-y','-i',raw]
  text=overlay('intro' if i==0 else 'cta') if i!=1 else None
  if text:args+=['-loop','1','-i',text]
  graph=(f'[0:v]setpts=(PTS-STARTPTS)*{seconds/duration:.8f},fps=30,split=2[b][f];'
   '[b]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=32:2,eq=brightness=-0.42:saturation=0.65[bg];'
   '[f]scale=1080:642[fg];[bg][fg]overlay=0:622[shot];')
  if text:
   enable='lt(t,4)' if i==0 else 'gte(t,7)'
   graph+=f"[shot][1:v]overlay=0:0:enable='{enable}'[text];[text]"
  else:graph+='[shot]'
  graph+='setsar=1,format=yuv420p'
  if i==2:graph+=',fade=t=out:st=13.6:d=0.4'
  graph+='[v]'
  run(args+['-filter_complex_threads','1','-filter_complex',graph,'-map','[v]','-an','-t',seconds,'-r','30','-c:v','libx264','-preset','fast','-crf','19','-threads','4',dest])
  files.append(dest);cuts.append({'name':shot['name'],'duration':seconds,'sourceDuration':duration,'rate':duration/seconds,'start':sum(c['duration'] for c in cuts),'party':shot['pair'],'location':shot['location'],'finisher':end})
  print('ENCODED',dest.name,flush=True)
 # Preserve the approved end card directly from the original Reel, including its fade.
 endcard=WORK/'original-endcard.mp4'
 run([FF,'-loglevel','error','-y','-ss','66','-i',OLD,'-t','4','-an','-vf','fps=30,setsar=1,format=yuv420p','-c:v','libx264','-preset','fast','-crf','19','-threads','4',endcard]);files.append(endcard)
 listing=WORK/'concat.txt';listing.write_text(''.join("file '"+p.as_posix()+"'\n" for p in files),encoding='utf-8')
 silent=WORK/'silent.mp4';run([FF,'-loglevel','error','-y','-f','concat','-safe','0','-i',listing,'-c','copy',silent])
 run([FF,'-loglevel','error','-y','-i',silent,'-ss','27','-i',MUSIC,'-map','0:v:0','-map','1:a:0','-t','45','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000',
  '-af','loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.15,afade=t=out:st=43:d=2','-movflags','+faststart',OUT])
 p=probe(OUT);v=next(s for s in p['streams'] if s['codec_type']=='video');a=next(s for s in p['streams'] if s['codec_type']=='audio')
 assert (v['width'],v['height'])==(1080,1920) and v['r_frame_rate']=='30/1'
 assert abs(float(p['format']['duration'])-45)<.05 and len(p['streams'])==2
 assert v['codec_name']=='h264' and a['codec_name']=='aac'
 run([FF,'-v','error','-i',OUT,'-f','null','-'])
 # Review representative action/finisher frames with no changes to their pixels.
 times=[.8,4,8.8,10.7,12,15,19,22.8,24.2,26,28,31.5,35,37.5,39,43]
 sheet=Image.new('RGB',(1080,4*530),'#13101c');d=ImageDraw.Draw(sheet)
 for n,t in enumerate(times):
  img=REVIEW/f'frame-{n:02}.jpg';frame(OUT,t,img)
  pic=Image.open(img);pic.thumbnail((270,480));x=(n%4)*270;y=(n//4)*530;sheet.paste(pic,(x,y));d.text((x+10,y+488),f'{t:.1f}s',font=font(22),fill='white')
 sheet.save(REVIEW/'storyboard.jpg')
 frame(OUT,43,REVIEW/'endcard.jpg')
 result={'file':OUT.name,'duration':p['format']['duration'],'bytes':OUT.stat().st_size,'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'music':str(MUSIC),'musicSourceStartSeconds':27,'musicSourceEndSeconds':72,'voiceover':False,'gameAudio':False,'cuts':cuts,'originalEndcard':{'source':str(OLD),'sourceStartSeconds':66,'duration':4},'fullBattleWidthPreserved':True,'probe':p}
 (ROOT/'verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
 print('VERIFIED',OUT,OUT.stat().st_size,flush=True)
if __name__=='__main__':main()
