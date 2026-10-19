"""Record only documented voices. Estimate by default; --record authorizes calls.

Paid calls are ledgered before submission and never automatically retried after
an uncertain response. Original casting and original game remain read-only.
"""
import hashlib,json,re,subprocess,sys,urllib.request,urllib.error
from pathlib import Path
from record_santiago import api,loudness,FFMPEG
GAME=Path(__file__).resolve().parents[1]
SRC=GAME.parent/'adventurer-expeditions-source-art/astra-v12/entrances-20261019'
REVIEW=GAME/'docs/ENTRANCE_REVIEW_20261019'
CAP=16000
BOSSES=['alpha','story_snarl','story_kobold_chief','story_silksa','story_wyvern_matriarch','story_sewer_ogre_mage','hag','orc','hydra','story_skarn']
def rows():
 cast=json.loads((GAME.parent/'adventurer/tools/voice_casting.json').read_text(encoding='utf-8'))
 plan=json.loads((SRC/'plan.json').read_text(encoding='utf-8'));out=[]
 for p in plan:
  if p['voiceId']:
   assert cast[p['who']]==p['voiceId']
   out.append(dict(id='intro_'+p['actor'],who=p['who'],name=p['name'],actor=p['actor'],kind='intro',text=p['text'],voiceId=p['voiceId']))
 # Separate first encounter from explicitly authored rematches and ascension.
 for actor,variant,text in [
  ('story_gorruk','return',"You again! No city to run to this time, foundling."),
  ('story_amara','return',"I asked for his life. I haven't changed my mind."),
  ('story_korvath','ascendant',"Still standing, brother? Then come and finish it.")]:
  p=next(p for p in plan if p['actor']==actor)
  out.append(dict(id='intro_'+actor+'_'+variant,who=p['who'],name=p['name'],actor=actor,variant=variant,kind='intro',text=text,voiceId=p['voiceId']))
 names={r['who']:r['name'] for r in json.loads((GAME/'docs/COMPANION_DIALOGUE_REVIEW_20261016/inventory.json').read_text(encoding='utf-8'))}
 for line in (REVIEW/'reactions.txt').read_text(encoding='utf-8').splitlines():
  if not line or line.startswith('#'):continue
  who,*texts=line.split('|');assert len(texts)==len(BOSSES)
  for boss,text in zip(BOSSES,texts):
   out.append(dict(id='react_'+boss+'_'+who,who=who,name=names[who],actor=boss,kind='reaction',text=text,voiceId=cast[who]))
 assert len({r['id'] for r in out})==len(out)
 assert len([r for r in out if r['kind']=='reaction'])==150
 for r in out:
  assert not any(c in r['text'] for c in '\u2018\u2019\u201c\u201d'),r['id']
  r['spokenText']=r['text'].replace('Fındık','Findik').replace('Mzee','Mzee')
  r['file']='assets/expedition/entrances/voice/'+r['id']+'.mp3'
 return out
def main():
 items=rows();estimate=sum(len(r['spokenText']) for r in items)
 # Spell the pet as in the existing approved recordings; no new casting.
 print(len(items),'lines;',estimate,'characters; hard cap',CAP,flush=True);assert estimate<CAP
 (REVIEW/'voice-script.json').write_text(json.dumps(items,indent=2,ensure_ascii=False),encoding='utf-8')
 if '--record' not in sys.argv:return
 key=json.loads((Path.home()/'OneDrive/Documents/TTRPG/Kenji/Game init files/tts_config.json').read_text(encoding='utf-8-sig'))['api_key']
 (SRC/'voice-raw').mkdir(exist_ok=True);(GAME/'assets/expedition/entrances/voice').mkdir(parents=True,exist_ok=True)
 ledgerpath=SRC/'voice-ledger.json';ledger=json.loads(ledgerpath.read_text(encoding='utf-8')) if ledgerpath.exists() else dict(cap=CAP,model='eleven_v3',requests=[],normalization={})
 def save():ledgerpath.write_text(json.dumps(ledger,indent=2,ensure_ascii=False),encoding='utf-8')
 sub=api('user/subscription',key);ledger.setdefault('before',sub['character_count']);save()
 remaining=sum(len(r['spokenText']) for r in items if not (SRC/'voice-raw'/(r['id']+'.mp3')).exists())
 assert sub['character_limit']-sub['character_count']>=remaining,'Not enough remaining credits'
 for r in items:
  rid=r['id'];master=SRC/'voice-raw'/(rid+'.mp3');dest=GAME/r['file'];old=next((x for x in ledger['requests'] if x['id']==rid),None)
  if old and (old['voiceId']!=r['voiceId'] or old['text']!=r['spokenText'] or not master.exists()):raise RuntimeError('Inspect changed or uncertain paid request: '+rid)
  if not master.exists():
   assert sum(max(x['characters'],int(x.get('chargedCharacters') or 0)) for x in ledger['requests'])+len(r['spokenText'])<=CAP
   rec=dict(id=rid,voiceId=r['voiceId'],text=r['spokenText'],characters=len(r['spokenText']),state='pending');ledger['requests'].append(rec);save()
   data=json.dumps(dict(text=r['spokenText'],model_id='eleven_v3',voice_settings=dict(stability=.5,similarity_boost=.8))).encode()
   req=urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/'+r['voiceId']+'?output_format=mp3_44100_64',data=data,headers={'xi-api-key':key,'Content-Type':'application/json'})
   with urllib.request.urlopen(req,timeout=90) as response:
    audio=response.read();rec['requestId']=response.headers.get('request-id');rec['chargedCharacters']=response.headers.get('character-cost')
   assert len(audio)>400;master.write_bytes(audio);rec['state']='saved';save()
  if r['who'] not in ledger['normalization']:
   refs=sorted((GAME/'assets/expedition/story/media/audio/vo/campaign'/r['who']).glob('*.mp3'));assert refs,r['who']
   ledger['normalization'][r['who']]=max(-24,min(-16,round(float(loudness(refs[0])['input_i']),1)));save()
  target=ledger['normalization'][r['who']]
  if not dest.exists():
   a=loudness(master,target);f=f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={a['input_i']}:measured_TP={a['input_tp']}:measured_LRA={a['input_lra']}:measured_thresh={a['input_thresh']}:offset={a['target_offset']}:linear=true"
   subprocess.run([FFMPEG,'-v','error','-y','-i',str(master),'-af',f,'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','64k',str(dest)],check=True)
  r['sha256']=hashlib.sha256(dest.read_bytes()).hexdigest();r['bytes']=dest.stat().st_size
  print(rid,'ready',flush=True)
 ledger['after']=api('user/subscription',key)['character_count'];save()
 (GAME/'assets/expedition/entrances/voice.json').write_text(json.dumps(dict(model='eleven_v3',files=items),indent=2,ensure_ascii=False),encoding='utf-8')
 print('Complete. Charged characters:',sum(int(x.get('chargedCharacters') or 0) for x in ledger['requests']),flush=True)
if __name__=='__main__':
 try:main()
 except urllib.error.HTTPError as e:raise SystemExit('ElevenLabs HTTP '+str(e.code)+'; uncertain paid calls are not retried')
