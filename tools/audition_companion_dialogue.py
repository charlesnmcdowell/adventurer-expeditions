"""Three approval samples per companion; does not alter runtime dialogue.

Without --record: writes the review manifest and reports reserved characters.
With --record: paid ElevenLabs calls, original casting, shared 15k job cap.
Uncertain requests require inspection; never retry a paid request silently.
"""
import json, re, subprocess, sys, urllib.request, urllib.error, hashlib
from pathlib import Path
from record_santiago import loudness, api, FFMPEG

GAME=Path(__file__).resolve().parents[1]
REVIEW=GAME/'docs/COMPANION_DIALOGUE_REVIEW_20261016'
SOURCE=GAME.parent/'adventurer-expeditions-source-art/astra-v10/companion-dialogue-20261016'
CAP=15000

def main():
    inv=json.loads((REVIEW/'inventory.json').read_text(encoding='utf-8'))
    index={(r['who'],r['key'],r['index']):r for r in inv}
    cast=json.loads((GAME.parent/'adventurer/tools/voice_casting.json').read_text(encoding='utf-8'))
    rows=[]
    for line in (REVIEW/'audition-lines.txt').read_text(encoding='utf-8').splitlines():
        who,beat,i,kind,text=line.split('|',4);i=int(i)
        identity=next(r for r in inv if r['who']==who)
        old=index.get((who,beat,i))
        if kind=='rewrite':assert old,'Unknown original line'
        else:assert not old,'New line collides with existing ID'
        assert identity['voiceId']==cast[who]
        spoken=text.replace(', {target}','').replace('{target}, ','')
        # Follow existing name-free recordings. On-screen wording retains names.
        spoken=spoken.replace('You hear that, Winston?', 'You hear that?')
        spoken=spoken.replace("Olamide's name", "The mage's name")
        spoken=spoken.replace('Kaito. Bounty hunter.', 'Bounty hunter.')
        spoken=spoken.replace("Morrak's blood.", "The murder god's blood.")
        rid=who+'__'+beat+'_'+str(i)
        rows.append({'id':rid,'who':who,'name':identity['name'],'voiceId':cast[who], 'key':beat,'index':i,'kind':kind,'before':old['text'] if old else None,'text':text,'spokenText':spoken,'file':'audio/'+rid+'.mp3'})
    for who in cast:
        selected=[r for r in rows if r['who']==who]
        if selected:assert len(selected)==3
    assert len(rows)==45 and len({r['id'] for r in rows})==45
    (REVIEW/'auditions.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf-8')
    print(len(rows),'auditions;',sum(len(r['spokenText']) for r in rows),'characters reserved',flush=True)
    if '--record' not in sys.argv:return
    SOURCE.mkdir(parents=True,exist_ok=True);raw=SOURCE/'raw';raw.mkdir(exist_ok=True)
    (REVIEW/'audio').mkdir(exist_ok=True)
    ledgerfile=SOURCE/'ledger.json'
    ledger=json.loads(ledgerfile.read_text(encoding='utf-8')) if ledgerfile.exists() else {'scope':'auditions only; full batch awaits user approval','jobCap':CAP,'requests':[],'normalization':{}}
    def save():ledgerfile.write_text(json.dumps(ledger,indent=2,ensure_ascii=False),encoding='utf-8')
    config=Path.home()/'OneDrive/Documents/TTRPG/Kenji/Game init files/tts_config.json'
    key=json.loads(config.read_text(encoding='utf-8-sig'))['api_key']
    sub=api('user/subscription',key);ledger.setdefault('before',sub['character_count']);save()
    remaining=sum(len(r['spokenText']) for r in rows if not (raw/(r['id']+'.mp3')).exists())
    if sub['character_limit']-sub['character_count']<remaining:raise RuntimeError('Insufficient credits')
    for row in rows:
        rid=row['id'];master=raw/(rid+'.mp3');out=REVIEW/row['file']
        who=row['who']
        if who not in ledger['normalization']:
            references=sorted((GAME/'assets/expedition/story/media/audio/vo/campaign'/who).glob('*.mp3'))
            reference=next(p for p in references if 'santiago20261016' not in p.name)
            target=max(-24,min(-14,round(float(loudness(reference)['input_i']),1)))
            ledger['normalization'][who]={'reference':str(reference.relative_to(GAME)),'targetLUFS':target};save()
        target=ledger['normalization'][who]['targetLUFS']
        old=next((r for r in ledger['requests'] if r['id']==rid),None)
        if old and (old['text']!=row['spokenText'] or old['voiceId']!=row['voiceId'] or not master.exists()):raise RuntimeError('Inspect uncertain or changed paid request: '+rid)
        if not master.exists():
            used=sum(max(r['characters'],int(r.get('chargedCharacters') or 0)) for r in ledger['requests'])
            if used+len(row['spokenText'])>CAP:raise RuntimeError('Job cap reached')
            rec={'id':rid,'voiceId':row['voiceId'],'text':row['spokenText'],'characters':len(row['spokenText']),'state':'pending'};ledger['requests'].append(rec);save()
            body=json.dumps({'text':row['spokenText'],'model_id':'eleven_v3','voice_settings':{'stability':0.5,'similarity_boost':0.8}}).encode('utf-8')
            req=urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/'+row['voiceId']+'?output_format=mp3_44100_64',data=body,headers={'xi-api-key':key,'Content-Type':'application/json'})
            with urllib.request.urlopen(req,timeout=90) as response:
                audio=response.read();rec['requestId']=response.headers.get('request-id');rec['chargedCharacters']=response.headers.get('character-cost')
            if len(audio)<400:raise RuntimeError('Short audio response')
            master.write_bytes(audio);rec['state']='saved';save()
        if not out.exists():
            a=loudness(master,target)
            filt=f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={a['input_i']}:measured_TP={a['input_tp']}:measured_LRA={a['input_lra']}:measured_thresh={a['input_thresh']}:offset={a['target_offset']}:linear=true"
            subprocess.run([FFMPEG,'-v','error','-y','-i',str(master),'-af',filt,'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','64k',str(out)],check=True)
        row['sha256']=hashlib.sha256(out.read_bytes()).hexdigest()
        print(rid,'ready',flush=True)
    ledger['after']=api('user/subscription',key)['character_count'];save()
    (REVIEW/'voice-ledger.json').write_text(json.dumps(ledger,indent=2,ensure_ascii=False),encoding='utf-8')
    (REVIEW/'auditions.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf-8')
    print('Complete; header credits:',sum(int(r.get('chargedCharacters') or 0) for r in ledger['requests']),flush=True)

if __name__=='__main__':
    try:main()
    except urllib.error.HTTPError as e:raise SystemExit('ElevenLabs HTTP '+str(e.code)+'; no automatic retry')
