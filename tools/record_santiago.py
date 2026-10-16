"""Record approved Expeditions-only Santiago edits; resumable, no silent retries.

Uses the original campaign's casting record, ElevenLabs v3 and 64k MP3 format.
Raw masters/paid-request receipts stay outside the game. No key is logged.
Run without --record for a cost estimate; --record makes paid requests.
"""
import hashlib, json, re, subprocess, sys, urllib.request, urllib.error
from pathlib import Path
import imageio_ffmpeg

GAME=Path(__file__).resolve().parents[1]
REVIEW=GAME/'docs/SANTIAGO_DIALOGUE_REVIEW_20261016'
ROOT=GAME.parent/'adventurer-expeditions-source-art/astra-v10/santiago-dialogue-20261016'
VOICE='xHLnsxqUy4cc16VOmSD4'
MODEL='eleven_v3'
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
CAP=5000

def api(path,key):
    req=urllib.request.Request('https://api.elevenlabs.io/v1/'+path,headers={'xi-api-key':key})
    with urllib.request.urlopen(req,timeout=45) as r:return json.load(r)

def loudness(path,target=-23):
    p=subprocess.run([FFMPEG,'-hide_banner','-i',str(path),'-af',f'loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    return json.loads(re.findall(r'\{[^{}]+\}',p.stderr)[-1])

def main():
    cast=json.loads((GAME.parent/'adventurer/tools/voice_casting.json').read_text(encoding='utf-8'))
    assert cast['cassian']==VOICE
    rows=json.loads((REVIEW/'changes.json').read_text(encoding='utf-8'))
    for r in rows:
        # Preserve dynamic names in subtitles; spoken audio follows source convention.
        r['spokenText']=r['after'].replace('{target}, ','').replace('{target}. ','').replace(', {target}','')
        r['spokenText']=r['spokenText'].replace('Santiago. ', '')
    estimate=sum(len(r['spokenText']) for r in rows)
    print(len(rows),'clips;',estimate,'characters reserved; cap',CAP,flush=True)
    assert estimate<CAP
    if '--record' not in sys.argv:return
    ROOT.mkdir(parents=True,exist_ok=True);raw=ROOT/'raw';raw.mkdir(exist_ok=True)
    keyfile=Path.home()/'OneDrive/Documents/TTRPG/Kenji/Game init files/tts_config.json'
    key=json.loads(keyfile.read_text(encoding='utf-8-sig'))['api_key']
    ledgerfile=ROOT/'ledger.json'
    ledger=json.loads(ledgerfile.read_text(encoding='utf-8')) if ledgerfile.exists() else {'voiceId':VOICE,'model':MODEL,'cap':CAP,'requests':[]}
    def save():ledgerfile.write_text(json.dumps(ledger,indent=2,ensure_ascii=False),encoding='utf-8')
    sub=api('user/subscription',key)
    ledger.setdefault('before',sub['character_count'])
    remaining=sum(len(r['spokenText']) for r in rows if not (raw/(r['id']+'.mp3')).exists())
    if sub['character_limit']-sub['character_count']<remaining:raise RuntimeError('Insufficient credits')
    reference=GAME/'assets/expedition/story/media/audio/vo/campaign/cassian/q2_cassian_join_1.mp3'
    target=max(-24,min(-14,round(float(loudness(reference)['input_i']),1)))
    ledger['referenceLUFS']=target;save()
    files=[]
    for row in rows:
        rid=row['id'];master=raw/(rid+'.mp3');old=next((r for r in ledger['requests'] if r['id']==rid),None)
        if old and (old['text']!=row['spokenText'] or not master.exists()):raise RuntimeError('Inspect prior uncertain request before another charge: '+rid)
        if not master.exists():
            used=sum(max(r['characters'],int(r.get('chargedCharacters') or 0)) for r in ledger['requests'])
            if used+len(row['spokenText'])>CAP:raise RuntimeError('Credit cap reached')
            rec={'id':rid,'text':row['spokenText'],'characters':len(row['spokenText']),'state':'pending'}
            ledger['requests'].append(rec);save()
            payload=json.dumps({'text':row['spokenText'],'model_id':MODEL,'voice_settings':{'stability':0.5,'similarity_boost':0.8}}).encode('utf-8')
            req=urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/'+VOICE+'?output_format=mp3_44100_64',data=payload,headers={'xi-api-key':key,'Content-Type':'application/json'})
            with urllib.request.urlopen(req,timeout=90) as response:
                audio=response.read();rec['requestId']=response.headers.get('request-id');rec['chargedCharacters']=response.headers.get('character-cost')
            if len(audio)<400:raise RuntimeError('Short audio response: '+rid)
            master.write_bytes(audio);rec['state']='saved';save()
        rel='audio/vo/campaign/cassian/'+rid+'_santiago20261016.mp3'
        output=GAME/'assets/expedition/story/media'/rel
        if not output.exists():
            a=loudness(master,target)
            filt=f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={a['input_i']}:measured_TP={a['input_tp']}:measured_LRA={a['input_lra']}:measured_thresh={a['input_thresh']}:offset={a['target_offset']}:linear=true"
            subprocess.run([FFMPEG,'-v','error','-y','-i',str(master),'-af',filt,'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','64k',str(output)],check=True)
        files.append({'id':rid,'file':rel,'text':row['after'],'spokenText':row['spokenText'],'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size})
        print(rid,'ready',flush=True)
    ledger['after']=api('user/subscription',key)['character_count'];save()
    manifest={'speaker':'cassian','voiceId':VOICE,'model':MODEL,'revision':'santiago20261016','files':files}
    (GAME/'assets/expedition/story/santiago-voice.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
    (REVIEW/'voice-ledger.json').write_text(json.dumps(ledger,indent=2,ensure_ascii=False),encoding='utf-8')
    print('Complete; header credits:',sum(int(r.get('chargedCharacters') or 0) for r in ledger['requests']),flush=True)

if __name__=='__main__':
    try:main()
    except urllib.error.HTTPError as e:raise SystemExit('ElevenLabs HTTP '+str(e.code)+'; no automatic paid retry')
