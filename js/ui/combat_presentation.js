// Skill sound and melee choreography. Presentation only: never mutates combat state.
(function () {
'use strict';
const A = globalThis.ADV;
const colors = {fire:0xff9a45,ice:0xa2dfff,lightning:0xe9d77b,acid:0xa4d776,shadow:0xaf89d3,holy:0xffe4a1,arcane:0x94b7ef,prismatic:0xdab7ee};
const meleeAny = new Set(['backstab','vanishing_strike','boarding_hook','tongue_lash','sky_pluck']);
// Blade skills that carry 'fang' in the name: a dagger stab, not a creature's jaws (Venom Fang is 'a shallow, dirty cut').
const bladeFangs = new Set(['venom_fang']);
function profile(id, tier) {
  const d = A.DATA.SKILLS[id] || {}, s = Object.assign({}, d, d.tiers && d.tiers[tier || 'basic']);
  const melee = (s.reach === 'front' || meleeAny.has(id)) && !['self','ally','party','allyLane'].includes(s.target);
  let family = 'support';
  if (/shape|_form|bear_stance/.test(id)) family = 'transform';
  else if (s.heal || /mend|triage|raise|restor|medic|suture|stanch|sick_bay|rum_ration/.test(id)) family = 'heal';
  else if (melee) family = /touch|fist|palm|punch/.test(id) ? 'unarmed' : /bite|fang|snap/.test(id) && !bladeFangs.has(id) ? 'bite' : bladeFangs.has(id) ? 'thrust' : /lash|boarding_hook/.test(id) ? 'whip' : /mace|smash|boulder|weight|crush|treefall|pincer|fault_line|shield_break/.test(id) ? 'blunt' : /gore|tusk|thrust|kunai|sting|throat/.test(id) ? 'thrust' : /claw|rake|talon|shred|pounce/.test(id) ? 'claw' : /dual|tempo|rhythm|frenzy/.test(id) ? 'flurry' : 'slash';
  else if (/flintlock|grapeshot|cannon|chain_shot/.test(id)) family = 'gun';
  else if (s.element) family = 'magic';
  else if (/shot|quarrel|bow|loosing|shuriken|kunai|volley/.test(id)) family = 'projectile';
  else if (/counter|riposte|guard|ward|shield|bulwark|armour|armor/.test(id)) family = 'guard';
  else if (s.power && ['enemy','allEnemies','enemyLane'].includes(s.target)) family = 'magic';
  return {id, family, melee, tier:tier||'basic', intensity:tier==='advanced'?1.3:tier==='intermediate'?1.15:1, element:s.element, color:colors[s.element] || (family==='heal'?0x9edaa5:0xead8b0), passive:d.kind==='perk'};
}

// Local ElevenLabs recordings with synthesized fallback while decoding.
let context, master, unlocked = false;
const buffers=new Map();let bankPromise;
function hasToken(id, list) {
  const bits = new Set((id || '').split('_'));
  return list.some(x => bits.has(x));
}
function bankElement(p) {
  if (p.element === 'prismatic') return 'arcane';
  if (p.element) return p.element;
  const id = p.id || '';
  if (hasToken(id, ['ember', 'cinder', 'magma', 'pyre', 'flame']) || /^fire_|powder_keg|ashfall|ash_ward/.test(id)) return 'fire';
  if (hasToken(id, ['ice', 'frost', 'rime', 'winter']) || id === 'glass_web') return 'ice';
  if (hasToken(id, ['spark', 'lightning', 'storm', 'shock']) || id === 'antler_arc') return 'lightning';
  if (hasToken(id, ['poison', 'venom', 'acid', 'wither', 'plague']) || id === 'rot_wing') return 'acid';
  if (hasToken(id, ['shadow', 'umbral']) || /night_screech|whisper_of_ending/.test(id)) return 'shadow';
  if (hasToken(id, ['holy', 'edict', 'smite']) || /true_rest|gods_/.test(id)) return 'holy';
  if (hasToken(id, ['root', 'thorn', 'vine', 'leaf', 'spore', 'grove', 'growth', 'briar', 'moss']) || /entang|quartermasters/.test(id)) return 'nature';
  return null;
}
function sampleKey(p,phase){
  if(phase==='block'||phase==='miss')return phase;
  if(phase==='use' && /raise|revive/.test(p.id))return 'revive_use';
  if(phase==='use' && /stealth|smoke|vanish|ghoststep|cloak_of_shadows/.test(p.id))return 'stealth_use';
  const el=bankElement(p);
  const keepWeapon=/fang|bite|snap/.test(p.id||'') && !p.element;
  if(el && !keepWeapon && !['heal','transform','guard'].includes(p.family)) {
    return el+(phase==='hit'?'_hit':'_use');
  }
  let f=p.family;
  if(f==='flurry')f='slash';
  if(f==='magic')f=el||'arcane';
  if(['heal','guard','support','transform'].includes(f))return f+'_use';
  return f+'_'+phase;
}
function preload(){
  const c=init();if(!c)return Promise.resolve();
  if(!bankPromise)bankPromise=Promise.all(Object.entries(A.DATA.SFX_HASHES||{}).map(async([key,hash])=>{
    try{const r=await fetch('audio/sfx/'+key+'.mp3?v='+hash);if(!r.ok)return;const b=await c.decodeAudioData(await r.arrayBuffer());buffers.set(key,b);}catch(_){}
  }));
  return bankPromise;
}
function recorded(c,scene,p,phase){
  const b=buffers.get(sampleKey(p,phase));if(!b)return false;
  const source=c.createBufferSource(),gain=c.createGain();source.buffer=b;
  source.playbackRate.value=1+(Math.random()-.5)*.06;
  gain.gain.value=.65;source.connect(gain);gain.connect(master);active.set(source,scene);
  source.onended=()=>{source.disconnect();gain.disconnect();active.delete(source);};source.start();return true;
}
const active = new Map(), sceneHooks = new WeakSet();
function allowed() { return !document.hidden && !(A.Music && (A.Music.muted || A.Music.hidden)); }
function init() {
  if (!context) {
    const C = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!C) return null;
    context = new C(); master = context.createGain(); master.gain.value = .45; master.connect(context.destination);
  }
  return context;
}
function unlock() { unlocked = true; const c=init(); if(c && allowed()) c.resume().catch(()=>{});preload(); }
function stop(scene) {
  for (const [node, owner] of active) if (!scene || owner===scene) { try {node.stop();}catch(_){} }
}
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown',unlock,{passive:true});
  document.addEventListener('keydown',unlock,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
}
if (typeof globalThis.addEventListener === 'function') globalThis.addEventListener('pagehide',()=>stop());
function synth(c, output, p, phase, when, track) {
  const impact=phase==='hit', block=phase==='block', miss=phase==='miss';
  const f=p.family, magic=['magic','heal','support','guard','transform'].includes(f);
  const duration=miss?.12:block?.18:impact?.18:f==='transform'?.58:magic?.38:.22;
  const start=when || c.currentTime;
  function envelope(g, amp) { g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(amp,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+duration); }
  function connect(source, filter, amp) { const g=c.createGain();envelope(g,amp);source.connect(filter);filter.connect(g);g.connect(output);source.start(start);source.stop(start+duration+.02);if(track)track(source);source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();active.delete(source);}; }
  const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate), data=buffer.getChannelData(0);
  // A repeatable noise bed avoids depending on gameplay RNG.
  let seed=2166136261;for(const ch of p.id+phase)seed=Math.imul(seed^ch.charCodeAt(0),16777619);
  for(let i=0;i<data.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;data[i]=((seed>>>0)/4294967296)*2-1;}
  const noise=c.createBufferSource();noise.buffer=buffer;
  const filter=c.createBiquadFilter();filter.type=block?'highpass':'bandpass';
  const elementHz={fire:480,ice:3200,lightning:4400,acid:1300,shadow:330,holy:2400,arcane:1800,prismatic:2800};
  const freq=block?2600:f==='gun'?420:impact?f==='blunt'?180:850:magic?(elementHz[p.element]||1800):2700;
  filter.frequency.setValueAtTime(freq,start);filter.frequency.exponentialRampToValueAtTime(Math.max(80,freq*.3),start+duration);filter.Q.value=magic?1.8:.7;
  connect(noise,filter,miss?.08:magic?.09:f==='gun'?.36:.22);
  if(!miss) {
    const notes = f==='heal'?[523,659,784]:f==='support'?[330,440]:f==='guard'||block?[740,1110]:f==='transform'?[90,135]:magic?[220,330]:[impact?f==='blunt'?78:155:f==='gun'?65:240];
    const pitch=1+((seed>>>0)%13-6)*.018;
    notes.forEach((hz,i)=>{const osc=c.createOscillator(),low=c.createBiquadFilter();hz*=pitch;osc.type=p.element==='lightning'?'sawtooth':magic?'sine':block?'triangle':'sine';osc.frequency.setValueAtTime(hz,start);osc.frequency.exponentialRampToValueAtTime(hz*(magic?1.3:.42),start+duration);low.type='lowpass';low.frequency.value=1800;connect(osc,low,.12/notes.length);});
  }
  return duration;
}
function sound(scene,p,phase) {
  if (!unlocked || !allowed()) return;
  const c=init();if(!c || c.state!=='running')return;
  if(!sceneHooks.has(scene)){sceneHooks.add(scene);scene.events.once('shutdown',()=>{stop(scene);sceneHooks.delete(scene);});}
  // Bound simultaneous voices in large party/area attacks, and debounce repeated outcomes.
  const key=sampleKey(p,phase), now=c.currentTime;
  const stamps=scene.__sfxStamps || (scene.__sfxStamps={});
  if(now-(stamps[key]??-1)<.055 || active.size>30)return;
  stamps[key]=now;if(!recorded(c,scene,p,phase))synth(c,master,p,phase,now,node=>active.set(node,scene));
}
function graphic(scene, paint, duration) {
  const g=scene.add.graphics().setDepth(505);paint(g);
  scene.tweens.add({targets:g,alpha:0,duration,onComplete:()=>g.destroy()});return g;
}
function stroke(g,x,y,dir,p,offset) {
  const color=p.color, n=p.family==='claw'?3:1;
  for(let i=0;i<n;i++) {
    const yy=y+(i-(n-1)/2)*11+(offset||0);
    for(const [width,alpha,tint] of [[8,.8,0x203049],[5,.94,color],[1.3,.95,0xfff5db]]){
      g.lineStyle(width*(p.intensity||1),tint,alpha);
      if(p.family==='thrust')g.lineBetween(x-dir*62,yy,x+dir*26,yy-6);
      else if(p.family==='unarmed'){g.strokeCircle(x,yy,13);g.lineBetween(x-dir*35,yy,x-dir*18,yy);}
      else if(p.family==='bite'){for(const side of [-1,1]){g.beginPath();g.moveTo(x-16,yy+side*20);g.lineTo(x-10,yy+side*7);g.lineTo(x,yy+side*15);g.lineTo(x+10,yy+side*7);g.lineTo(x+16,yy+side*20);g.strokePath();}}
      else {
        const whip=p.family==='whip';
        new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x-dir*(whip?68:42),yy-32),new Phaser.Math.Vector2(x+dir*55,yy-(whip?65:15)),new Phaser.Math.Vector2(x+dir*24,yy+36)).draw(g,16);
      }
    }
  }
}
function swing(scene,src,tgt,p) {
  const dir=src.u.side==='a'?1:-1;
  if (A.SkillArt?.has(p.id)) return A.SkillArt.play(scene,{skillId:p.id,tier:p.tier,src,tgt,dir});
  if (A.VFX && A.VFX.lunge) A.VFX.lunge(scene,src.img,dir);
  // Motion lives between portraits; no contact burst until combat confirms an outcome.
  const x=src.x+dir*((src.img.displayWidth||92)*.5+28),y=src.y;
  graphic(scene,g=>{
    if(p.family==='blunt'){g.lineStyle(10,p.color,.3);g.lineBetween(x-dir*30,y-45,x+dir*20,y+20);g.lineStyle(2,p.color,.85);g.strokeCircle(x+dir*20,y+20,10);}
    else {stroke(g,x,y,dir,p);if(p.family==='flurry')stroke(g,x+dir*12,y, -dir,p,18);}
  },220);
  return 240;
}
function impact(scene,v,p,phase,ctx) {
  if(!v)return;
  if(A.SkillArt?.has(p.id)) { A.SkillArt.outcome(scene,v,p.id,p.tier,phase,ctx); return; }
  graphic(scene,g=>{
    if(phase==='block'){g.lineStyle(4,0xb8d2ef,.9);g.beginPath();g.arc(v.x,v.y,42,-1.35,1.35);g.strokePath();return;}
    if(phase==='miss'){g.lineStyle(1,p.color,.35);for(let i=0;i<3;i++)g.lineBetween(v.x-28,v.y+i*10,v.x+18,v.y+i*10-12);return;}
    const star=[];for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?5:14+(i%4)*3;star.push({x:v.x+Math.cos(a)*r,y:v.y+Math.sin(a)*r});}
    g.fillStyle(0xfff3cf,.9);g.lineStyle(1.3,0x223049,.8);g.fillPoints(star,true);g.strokePoints(star,true);
    if(p.family==='blunt'){g.lineStyle(3,p.color,.8);g.strokeCircle(v.x,v.y,24);g.lineStyle(1,p.color,.45);g.strokeCircle(v.x,v.y,37);}
    else stroke(g,v.x,v.y,1,p);
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9;g.lineStyle(i%2?1:2,p.color,.85);g.lineBetween(v.x+Math.cos(a)*12,v.y+Math.sin(a)*12,v.x+Math.cos(a)*(24+i%3*7),v.y+Math.sin(a)*(24+i%3*7));}
  },phase==='hit'?190:150);
}
function event(scene,e) {
  const actions=scene.__skillActions || (scene.__skillActions=new Map());
  if(e.t==='use'){const p=profile(e.skillId,e.tier);actions.set(e.uid,p);scene.__lastSkill=p;sound(scene,p,'use');return;}
  const reflected=e.tag==='reflect'||e.tag==='retaliation';
  const p=reflected?Object.assign(profile('thorn_skin'),{family:'magic',melee:false}):actions.get(e.by) || scene.__lastSkill || profile('basic_attack');
  const v=e.uid?scene.view(e.uid):null;
  const ctx={src:e.by?scene.view(e.by):null,tgt:v,previous:p.lastContact};
  if(e.t==='damage' && e.tag!=='dot') {sound(scene,p,'hit');if(A.SkillArt||p.melee)impact(scene,v,p,'hit',ctx);p.lastContact=v;}
  else if(e.t==='evade'){sound(scene,p,'miss');if(A.SkillArt||p.melee)impact(scene,v,p,'miss',ctx);}
  else if(['ward','shieldAbsorb','shieldBreak','immune'].includes(e.t)){sound(scene,profile('crossing_guard'),'block');impact(scene,v,p,'block',ctx);}
  else if(e.t==='counter'){const counter=Object.assign(profile('basic_attack'),{family:'thrust'});actions.set(e.uid,counter);sound(scene,counter,'use');if(v)swing(scene,v,scene.view(e.by),counter);}
  else if(['heal','extraTurn','surviveLethal','arenaChampion','bulwarkKill','poisonHop'].includes(e.t) && !e.tick) sound(scene,profile(e.t==='heal'?'mend':'crossing_guard'),'use');
  else if(['shapeshift','revive','grantTurn','thornShield','exposedBurst','venomDraw','trueRest','npcSmite'].includes(e.t)) {
    const id=e.t==='shapeshift'?'beast_shape':e.t==='revive'?'raise':e.t==='venomDraw'?'venom_fang':e.t==='exposedBurst'?'sunder':'crossing_guard';
    sound(scene,profile(id),'use');
  }
  const triggers={extraTurn:'lightning_king',surviveLethal:'stand_fast',arenaChampion:'arena_champion',bulwarkKill:'bulwark',poisonHop:'venom_draw',grantTurn:'signal_flags',exposedBurst:'sunder',trueRest:'true_rest',npcSmite:'gods_edict'};
  if(v&&triggers[e.t]&&!e.tick) A.SkillArt?.perk(scene,v,triggers[e.t]);
}
A.CombatPresentation={profile,event,swing,impact,sound,stop,synth,preload,sampleKey,coverage:()=>Object.keys(A.DATA.SKILLS).map(id=>profile(id)),get loadedSamples(){return buffers.size;},get activeVoices(){return active.size;}};
})();
