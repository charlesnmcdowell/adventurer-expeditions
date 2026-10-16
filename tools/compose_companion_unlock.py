"""Original 2.2-second unpitched welcome flourish; no external samples/voice credits.

Brush sweep and three soft wood taps avoid conflicting with the current chapter's
musical key. This is deliberately quieter than dialogue, not a victory fanfare.
"""
from pathlib import Path
import subprocess, tempfile, wave
import numpy as np
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
sr=44100;duration=2.2;n=round(sr*duration);rng=np.random.default_rng(15102026)
t=np.arange(n)/sr;noise=rng.standard_normal(n)
smooth=np.convolve(noise,np.ones(14)/14,mode='same')
audio=smooth*.16*np.sin(np.pi*np.minimum(1,t/1.3))**2*(t<1.3)
for at,amp in [(0.16,.12),(.43,.15),(.76,.2)]:
 local=t-at;env=np.exp(-np.maximum(local,0)*36)*(local>=0)
 # Short filtered-noise wood taps, without a sustained tonal chord.
 audio+=(noise-np.roll(noise,1))*.08*amp/.2*env
audio=np.clip(audio,-.8,.8)
out=ROOT/'assets/expedition/story/companion-unlocked.mp3';out.parent.mkdir(exist_ok=True,parents=True)
with tempfile.TemporaryDirectory() as td:
 wav=Path(td)/'welcome.wav'
 with wave.open(str(wav),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes((audio*32767).astype('<i2').tobytes())
 subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-v','error','-i',str(wav),'-af','loudnorm=I=-25:TP=-3:LRA=5','-ar','44100','-b:a','96k',str(out)],check=True)
print(out)
