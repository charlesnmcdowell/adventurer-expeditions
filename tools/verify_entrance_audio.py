"""Decode the local entrance batch and tame codec peak overshoot, without API calls."""
import json,re,subprocess,hashlib
from pathlib import Path
from record_santiago import loudness,FFMPEG
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'adventurer-expeditions-source-art/astra-v12/entrances-20261019'
path=ROOT/'assets/expedition/entrances/voice.json'
data=json.loads(path.read_text(encoding='utf-8'));ledger=json.loads((SRC/'voice-ledger.json').read_text(encoding='utf-8'));report=[]
def measure(file):
 p=subprocess.run([FFMPEG,'-hide_banner','-i',str(file),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
 return dict(duration=re.search(r'Duration: ([0-9:.]+)',p.stderr).group(1),maxDb=float(re.search(r'max_volume: ([-0-9.]+)',p.stderr).group(1)))
for r in data['files']:
 dest=ROOT/r['file'];before=measure(dest);repaired=False
 if before['maxDb']>=-.5:
  master=SRC/'voice-raw'/(r['id']+'.mp3');target=ledger['normalization'][r['who']];a=loudness(master,target)
  f=f"loudnorm=I={target}:TP=-3:LRA=11:measured_I={a['input_i']}:measured_TP={a['input_tp']}:measured_LRA={a['input_lra']}:measured_thresh={a['input_thresh']}:offset={a['target_offset']}:linear=true,alimiter=limit=0.75:level=false"
  subprocess.run([FFMPEG,'-v','error','-y','-i',str(master),'-af',f,'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','64k',str(dest)],check=True);repaired=True
 after=measure(dest) if repaired else before;assert after['maxDb']<-.5,(r['id'],after)
 r['sha256']=hashlib.sha256(dest.read_bytes()).hexdigest();r['bytes']=dest.stat().st_size
 report.append(dict(id=r['id'],before=before,after=after,repaired=repaired))
path.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf-8')
(ROOT/'test/reports/entrances/voice-decode.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('PASS',len(report),'decoded clips;',sum(r['repaired'] for r in report),'codec peaks remastered from retained source; zero new recordings')
