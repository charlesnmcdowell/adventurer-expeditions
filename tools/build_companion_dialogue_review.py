"""Local review pages only; no generation, recording or publication."""
import json, html
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'docs/COMPANION_DIALOGUE_REVIEW_20261016'
rows=json.loads((root/'assets/expedition/story/companion-voice.json').read_text(encoding='utf-8'))['files']
esc=html.escape
names={r['who']:r['name'] for r in rows}
order=['vess']+[x for x in names if x!='vess']
style='<style>body{max-width:980px;margin:24px auto;padding:0 18px;background:#111722;color:#edf0f5;font:18px/1.55 system-ui}a{color:#b8d7ff}nav{display:flex;flex-wrap:wrap;gap:14px}article{background:#1c2635;border-radius:10px;padding:18px;margin:14px 0}h3{font-size:16px;color:#dbc18e}audio{width:100%;max-width:600px}details{color:#bec8d8}small{overflow-wrap:anywhere}</style>'
page=['<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Companion dialogue: complete production</title>',style,
      '<h1>Companion dialogue: complete production</h1><p>156 recorded segments: 41 revisions, 70 chapter remarks, 45 added combat barks. All 45 approved auditions reused. Chapter remarks require a living, travelling companion. Combat barks are ready for the staged companion combat feature; this pass does not enable it.</p><p><a href="CHANGES.md">Complete before/after table and placement keys</a> · <a href="index.html">Approved auditions</a></p>',
      '<nav>'+''.join('<a href="#'+who+'">'+esc(names[who])+'</a>' for who in order)+'</nav>']
md=['# Companion dialogue production — 2026-10-16','',
    'Local integration. Original Adventurer and shared campaign files are untouched. All 45 approved clips were reused byte for byte; 111 additional recordings were generated. No retakes. No new lore, plot branches or relationship scenes.',
    '', '| Companion | Revised | Chapter remarks | New barks |','| --- | ---: | ---: | ---: |']
for who in order:
    group=[r for r in rows if r['who']==who]
    md.append('| '+names[who]+' | '+' | '.join(str(sum(r['kind']==k for r in group)) for k in ['rewrite','gap','bark'])+' |')
    page.append('<section id="'+who+'"><h2>'+esc(names[who])+'</h2><small>Voice '+esc(group[0]['voiceId'])+'</small>')
    for r in group:
        page.append('<article><h3>'+esc(r['key'])+' #'+str(r['index'])+' · '+r['kind']+'</h3>')
        if r['before']:page.append('<details><summary>Previous wording</summary><p>'+esc(r['before'])+'</p></details>')
        page.append('<p>'+esc(r['text'])+'</p><audio controls preload="none" src="../../assets/expedition/story/media/'+r['file']+'"></audio></article>')
    page.append('</section>')
md+=['','## Placement','',
     'New remarks are appended to existing dialogue moments: chapter 3 departure; 4 opener 0 (mine entrance); 5 opener 2 (bandit palisade); 6 opener 0 (webs); 7 opener 1 (cages); 8 departure (bridge/gates); 9 departure (Consortium); 10 opener 0 (keep); 11 departure (wanted notices); 12 departure (palace); 13 opener 0 (maze stairs); 14 departure (sanctum). Indices are zero-based. They never replace original beats or choice hooks. Cached queues recheck company membership and do not refill after consumption.',
     '', '## Changes','', '| File | Speaker / line ID | Before | After |','| --- | --- | --- | --- |']
for r in rows:
    clean=lambda s:s.replace('|','\\|').replace('\n',' ')
    md.append('| js/expedition/story_dialogue.js | '+r['name']+' / '+r['key']+' #'+str(r['index'])+' | '+clean(r['before'] or ('New: '+r['kind']))+' | '+clean(r['text'])+' |')
md+=['','## Deliberate exceptions','',
     '- Layla keeps "ya stranger": the original lore deliberately gives her region an Arabic-influenced voice.',
     '- Optional bond/romance dialogue stays unchanged; Expeditions has no accessible inn conversation entry. No romantic scene was activated or removed.',
     '- Winston already had chapters 3/4/5/8 dialogue; no filler was added there. Loyal Desmond/Winston remarks supplement chapter 9 without using their betrayal dialogue.',
     '- Santiago\'s approved 29 lines and recordings remain unchanged. Only barks 4–6 are new.',
     '- All original withCompany and foeStatus bark conditions remain. Knocked-out, absent, dead and departed companions cannot bark.',
     '- Companion combat remains staged/off. The six-line banks and battle selector are integrated for its later activation; narrative remarks work now.',
     '', '## Voice accounting','',
     '156 requests including auditions; 10,639 submitted characters. Response headers report 4,682 credits. The account-wide counter is not a job-specific meter and can include other sessions. The conservative character reservation remains below the 15,000 cap. Correct voice IDs were checked against the original casting JSON. Raw masters and the resumable ledger remain in the sibling source-art folder; API credentials are not stored here.']
(out/'production.html').write_text(''.join(page),encoding='utf-8')
(out/'CHANGES.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
p=out/'index.html';s=p.read_text(encoding='utf-8');s=s.replace('These are review drafts; the game still uses its current dialogue.','All deliveries approved. <a href="production.html">Review all 156 integrated recordings.</a>');s=s.replace('New proposed line','Approved new line');p.write_text(s,encoding='utf-8')
p=out/'REVIEW.md';s=p.read_text(encoding='utf-8');start=s.index('## State\n')+len('## State\n');end=s.index('\n\n## Verified',start);s=s[:start]+'All 45 auditions approved and reused. The complete 156-segment production is now integrated locally. See [CHANGES.md](CHANGES.md) for every revision, new line, placement and exception, or [production.html](production.html) to hear all recordings.'+s[end:];s=s.replace('## Production after approval','## Production plan (completed; detailed results in CHANGES.md)');p.write_text(s,encoding='utf-8')
print('Production review: 156 recordings and complete before/after table.')
