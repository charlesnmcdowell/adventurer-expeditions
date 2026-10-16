"""Original 2.6-second melodic welcome fanfare; zero voice/music API credits."""
from pathlib import Path
import json, subprocess, tempfile, wave
import numpy as np
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
music=ROOT/'assets/expedition/story/media/audio/music/vg_shore_road.mp3'
raw=subprocess.check_output([ffmpeg,'-v','error','-i',str(music),'-t','30','-f','f32le','-ac','1','-ar','22050','-'])
samples=np.frombuffer(raw,dtype='<f4');chroma=np.zeros(12);size=8192
freq=np.fft.rfftfreq(size,1/22050);valid=(freq>80)&(freq<1800)
midi=np.rint(69+12*np.log2(np.maximum(freq,1)/440)).astype(int)
for start in range(0,len(samples)-size,4096):
 power=np.abs(np.fft.rfft(samples[start:start+size]*np.hanning(size)))
 np.add.at(chroma,midi[valid]%12,power[valid])
profiles=[np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]),np.array([6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17])]
_,tonic,mode=max((np.corrcoef(chroma,np.roll(profile,key))[0,1],key,mode) for key in range(12) for mode,profile in enumerate(profiles))
sr=44100;duration=2.6;t=np.arange(round(sr*duration))/sr;audio=np.zeros_like(t)
third=3 if mode else 4
for at,offset,amp in [(0,0,.14),(.18,7,.12),(.36,12,.14),(.56,12+third,.14),(.81,19,.12),(1.06,24,.18),(1.06,12,.07),(1.06,7,.06)]:
 local=np.maximum(0,t-at);hz=440*2**((60+tonic+offset-69)/12)
 env=(1-np.exp(-local*100))*np.exp(-local*3.8)*(t>=at)
 tone=np.sin(2*np.pi*hz*local)+.22*np.sin(4*np.pi*hz*local)*np.exp(-local*3)+.07*np.sin(6*np.pi*hz*local)*np.exp(-local*6)
 audio+=amp*tone*env
audio*=np.minimum(1,(duration-t)/.3)
out=ROOT/'assets/expedition/story/companion-unlocked.mp3'
with tempfile.TemporaryDirectory() as td:
 wav=Path(td)/'welcome.wav'
 with wave.open(str(wav),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes((np.clip(audio,-1,1)*32767).astype('<i2').tobytes())
 subprocess.run([ffmpeg,'-y','-v','error','-i',str(wav),'-af','loudnorm=I=-25:TP=-4:LRA=5','-ar','44100','-b:a','96k',str(out)],check=True)
report={'durationSeconds':duration,'source':'Original synthesized harp/bell composition','credits':0,'referenceTrack':music.name,'estimatedKey':['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][tonic]+(' minor' if mode else ' major'),'analysis':'FFT chroma/profile estimate; other chapter music ducks during the shared fanfare'}
(out.parent/'companion-unlocked.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
