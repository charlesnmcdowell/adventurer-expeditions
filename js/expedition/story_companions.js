// Expedition-owned companion production contract. Source characters stay read-only.
(function(){
'use strict';const A=ADV,X=A.Expedition,S=X.Story,C=A.Campaign3;
const P=S.Companions={fieldMax:2,foeHealthPerAlly:.25,bindings:{},enabled:true};
// Full roster approved for combat on 2026-10-16 after packed-art and browser QA.
P.kits={
 wren_ward:{join:1,weapon:'Short blade and throwing knife',skills:['backstab','smoke_bomb'],height:310},
 vess:{join:2,weapon:'Ritual wand',skills:['ember_lash','wither_touch'],height:325},
 fennick:{join:2,weapon:'Hooked knife',skills:['venom_fang','whisper_of_ending'],height:220},
 cassian:{join:2,weapon:'Spear and round shield',skills:['shield_wall','cleanse'],height:340},
 dorran:{join:2,weapon:'Broadsword and kite shield',skills:['cleave','sunder'],height:350},
 selene:{join:2,weapon:'Branch staff',skills:['mend','thorn_skin'],height:320},
 ithrel:{join:3,weapon:'Longbow',skills:['aimed_shot','snare'],height:330},
 bramm:{join:3,weapon:'Two-handed greatsword',skills:['cleave','defiant_stand'],height:365},
 ysolde:{join:3,weapon:'Talisman fans',skills:['frost_touch','rime_grasp'],height:315},
 aurelius:{join:3,weapon:'Hooked wizard staff',skills:['fire_bolt','spark'],height:345},
 ilvara:{join:5,weapon:'Priestess’s sceptre',skills:['wither_touch','blood_pact'],height:320},
 faelen:{join:6,weapon:'Shortbow',skills:['aimed_shot','backstab'],height:320},
 nettle:{join:6,weapon:'Thorn and bone gauntlets',skills:['thorn_skin','wither_touch'],height:310},
 durnik:{join:7,weapon:'Warhammer and shield',skills:['mend','regenerate'],height:245},
 amara:{join:13,weapon:'Twin sabres',skills:['dual_swords','counter_attack'],height:330},
};
P.bows=new Set(['ithrel','faelen']);
P.clips=['idle','walk','attack','signature-1','signature-2','hit','knockout','victory'];
// Spellcasters keep a free, reliable basic action while their signatures recharge.
// Same power/cost/statuses; only the edition's copies become ranged spells.
// Hiro's exceptions (2026-10-18): Winston, Santiago, Wanjiru and Dai Morgan keep weapons.
P.casters={vess:{name:'Ember Bolt',effect:'ember_lash',element:'fire',clip:'signature-1'},
 aurelius:{name:'Fire Bolt',effect:'fire_bolt',element:'fire',clip:'signature-1'},
 ysolde:{name:'Frost Bolt',effect:'frost_touch',element:'ice',clip:'signature-1'},
 selene:{name:'Thorn Bolt',effect:'thorn_lash',element:'nature',clip:'signature-2'},
 ilvara:{name:'Shadow Bolt',effect:'blood_lotus',element:'shadow',clip:'signature-1'}};
// A visual variation of the resolved gauntlet hit, never an extra damage roll.
// Normal -> bear -> normal -> eagle. Defensive/support actions do not consume it.
P.formAttack=function(actor,skill){
 if(actor.unit?.ch?.expeditionStoryCompanion!=='nettle'||!['basic_attack','wither_touch'].includes(skill))return null;
 if(!actor.sheet?.clips['form-bear']||!actor.sheet?.clips['form-eagle'])return null;
 const beat=actor._natureStrikes||0;actor._natureStrikes=beat+1;
 return [null,'bear',null,'eagle'][beat%4];
};
P.eligible=s=>s.record.chapter<2?[]:C.companyIds(s.game).filter(id=>P.kits[id]?.join<=s.record.chapter&&C.isRecruited(s.game,id));
// The recommended party is the two newest recruits, so every companion gets a
// turn (Hiro, 2026-10-19). It is the default at the start of each chapter and
// again whenever someone new joins; a player's own pick lasts until then.
P.recommended=function(s){
 const recruited=C.state(s.game).recruited||[];
 return P.eligible(s).slice().sort((a,b)=>recruited.indexOf(b)-recruited.indexOf(a)).slice(0,P.fieldMax);
};
P.selectionKey=s=>s.record.chapter+'|'+(C.state(s.game).recruited||[]).length;
P.isRecommended=(s,ids=P.selected(s))=>{const r=P.recommended(s);return ids.length===r.length&&r.every(id=>ids.includes(id));};
P.selected=function(s){
 const eligible=P.eligible(s),saved=s.record.fightingCompanions;
 if(s.record.companionSelectionKey!==P.selectionKey(s))return P.recommended(s);
 // Explicit empty / one-member selections are choices, not missing data.
 if(Array.isArray(saved)){
  const valid=[...new Set(saved)].filter(id=>eligible.includes(id)).slice(0,P.fieldMax);
  if(!saved.length)return valid;
  if(valid.length&&s.record.companionSelectionExplicit!==false&&valid.length===saved.length)return valid;
  const recruited=C.state(s.game).recruited||[];
  const fill=eligible.filter(id=>!valid.includes(id)).sort((a,b)=>recruited.indexOf(b)-recruited.indexOf(a));
  return valid.concat(fill).slice(0,P.fieldMax);
 }
 const recruited=C.state(s.game).recruited||[];
 return eligible.slice().sort((a,b)=>recruited.indexOf(b)-recruited.indexOf(a)).slice(0,P.fieldMax);
};
P.select=function(s,ids,{explicit=true}={}){
 if(!Array.isArray(ids)||ids.length>P.fieldMax||new Set(ids).size!==ids.length||ids.some(id=>!P.eligible(s).includes(id)))throw Error('Choose up to two riding companions');
 s.record.fightingCompanions=ids.slice();s.record.companionSelectionExplicit=explicit;s.record.companionSelectionKey=P.selectionKey(s);S.save(s);return ids;
};
P.readiness=s=>P.selected(s).filter(id=>!P.bindings[id]?.ready).map(id=>'companion:'+id);
P.register=function(id,atlas){
 if(!P.kits[id])throw Error('Unknown companion '+id);
 for(const name of P.clips){const clip=atlas?.clips?.[name];
  if(!clip||clip.paired||clip.frames?.length<(name==='idle'&&clip.technicalCalmLoop?4:16)||new Set(clip.frames).size!==clip.frames.length)throw Error('Incomplete companion clip '+id+'/'+name);
 }
 P.bindings[id]={actor:'companion_'+id,ready:true,height:P.kits[id].height};
};
const loading=new Map();
P.ensure=async function(s,ids=P.selected(s)){
 if(!P.enabled)return;
 await Promise.all(ids.filter(id=>P.eligible(s).includes(id)).map(id=>{
  if(P.bindings[id]?.ready)return;
  if(!loading.has(id))loading.set(id,(async()=>{
   const response=await fetch('assets/expedition/companion_'+id+'/companion_'+id+'.json');
   if(!response.ok)throw Error('Companion art could not load: '+id);
   P.register(id,await response.json());
  })().finally(()=>loading.delete(id)));
  return loading.get(id);
 }));
};
// Track actual recruitment separately from seating, picker changes and reloads.
P.queueUnlocks=function(s,beforeRoster){
 const r=s.record,seen=r.companionUnlocksSeen||[],pending=r.companionUnlocksPending||[];
 const joined=C.roster(s.game).filter(id=>P.kits[id]&&!beforeRoster.includes(id)&&!seen.includes(id)&&!pending.includes(id));
 if(joined.length){r.companionUnlocksPending=pending.concat(joined);r.companionPickerDue=true;S.save(s);}return joined;
};
P.claimUnlock=function(s,wanted){
 const r=s.record,pending=r.companionUnlocksPending||[],id=wanted||pending[0];if(!id||!pending.includes(id))return null;
 r.companionUnlocksPending=pending.filter(v=>v!==id);
 r.companionUnlocksSeen=[...new Set([...(r.companionUnlocksSeen||[]),id])];S.save(s);return id;
};
// Peek is non-destructive. Only Accept calls claimUnlock, so an interrupted
// welcome reappears after reload, while an accepted welcome never repeats.
P.pendingUnlock=function(s){
 const r=s.record;
 if(r.chapter<2||r.travelPending||r.phase==='inn'||r.phase==='complete'||r.chapterRewardDue)return null;
 if(r.phase==='departure'&&!(r.titleCards||[]).includes(r.chapter))return null;
 return (r.companionUnlocksPending||[]).find(id=>P.kits[id]&&C.isRecruited(s.game,id))||null;
};
// Per-ally tuning (Hiro, 2026-10-17): quicker allies act twice a turn, heavy
// hitters deal moderately more, the shield and guard allies take far more.
P.tuning={
 wren_ward:{turns:2},fennick:{turns:2},ithrel:{turns:2},amara:{turns:2},
 bramm:{atk:1.3},durnik:{atk:1.3},nettle:{atk:1.3,hp:1.75},
 dorran:{hp:1.75},cassian:{hp:1.75},
};
P.make=function(s,id){
 if(!P.eligible(s).includes(id))throw Error('Companion is not riding: '+id);
 const kit=P.kits[id],ch=JSON.parse(JSON.stringify(C.actor(s.game,id)));
 // Cached source actors never receive combat mutations or knockout state.
 ch.expeditionStoryCompanion=id;ch.companionKey='companion_'+id;ch.expeditionArtIdentity=ch.companionKey;
 ch.campaignExit=false;ch.isPlayer=false;ch.alive=true;ch.noCombatVoice=true;delete ch.personalityId;delete ch.combatHp;
 ch.actives=kit.skills.map(skillId=>{
  const entry=ch.actives.find(e=>e.skillId===skillId);if(!entry)throw Error('Approved skill missing from source: '+id+'/'+skillId);return entry;
 });
 ch.autoOrder=kit.skills.map(skillId=>({skillId,off:false})).concat([{skillId:'basic_attack',off:false}]);ch.autoAdopted=true;
 const tune=P.tuning[id];
 if(tune?.atk){ch.stats.atk=Math.round(ch.stats.atk*tune.atk);if(ch.bonusStats?.atk)ch.bonusStats.atk=Math.round(ch.bonusStats.atk*tune.atk);}
 return ch;
};
P.characters=s=>P.selected(s).map(id=>P.make(s,id));
P.prepareEncounter=function(enc){
 if(!enc.allies.length)return;
 const foes=enc.st.units.filter(u=>u.side==='b');
 for(const u of enc.st.units.filter(u=>u.ch.expeditionStoryCompanion)){
  const damage=foes.map(foe=>{
   const m=A.SkillSys.manifest(foe.ch,{skillId:'basic_attack',level:1});
   return A.Combat._internals.computeDamage(enc.st,foe,u,m)*(foe.ch.c3FoeDmg||1);
  });
  // Five to six comparable basic hits, measured against this fight's foes.
  const tune=P.tuning[u.ch.expeditionStoryCompanion]||{};
  u.maxHp=u.chp=Math.max(1,Math.ceil(damage.reduce((a,b)=>a+b,0)/damage.length*5.5*(tune.hp||1)));
  // Two actions, spread through the round rather than back to back.
  if(tune.turns){u.turnsPerRound=Math.max(u.turnsPerRound||1,tune.turns);u.consecutiveTurns=false;}
  u.tempHp=0;u.downed=false;
 }
};
const oldManifest=A.SkillSys.manifest;
A.SkillSys.manifest=function(ch,entry){
 const m=oldManifest.call(this,ch,entry);
 if(!ch?.expeditionStoryCompanion)return m;
 const caster=P.casters[ch.expeditionStoryCompanion];
 if(P.bows.has(ch.expeditionStoryCompanion)&&['basic_attack',...P.kits[ch.expeditionStoryCompanion].skills].includes(entry.skillId)){
  const names=ch.expeditionStoryCompanion==='ithrel'?{aimed_shot:'Sky Volley',snare:'Pinning Shot'}:{backstab:'Tumbling Triple Shot'};
  return {...m,data:{...m.data,name:names[entry.skillId]||m.data.name,elemental:false,element:undefined,reach:'any',melee:false,katana:false,
    ...(entry.skillId==='basic_attack'?{}:{cooldown:Math.max(3,m.data.cooldown||0)})}};
 }
 // Winston delivers his lingering wound with the hooked knife. Keep the
 // source skill ID, power, status payload and cooldown; no free shadow bolt.
 if(ch.expeditionStoryCompanion==='fennick'&&entry.skillId==='whisper_of_ending')
  return {...m,data:{...m.data,name:'Ending Cut',desc:'A hooked-knife cut that leaves a lingering wound and prevents healing.',elemental:false,element:undefined,reach:'front',melee:true,katana:false,cooldown:Math.max(3,m.data.cooldown||0)}};
 if(entry.skillId==='basic_attack'){
  return caster?{...m,data:{...m.data,name:caster.name,elemental:true,
    element:caster.element,reach:'any',melee:false,katana:false}}:m;
 }
 const offensive=caster&&['enemy','allEnemies'].includes(m.data.target);
 return {...m,data:{...m.data,...(offensive?{elemental:true,element:m.data.element||caster.element,reach:'any',melee:false,katana:false}:{}),cooldown:Math.max(3,m.data.cooldown||0)}};
};
const recoverySkills=new Set(['mend','regenerate','wither_touch','blood_pact']);
const oldAI=A.Combat.aiTakeTurn;
A.Combat.aiTakeTurn=function(st,u){
 if(!u.ch.expeditionStoryCompanion)return oldAI.call(this,st,u);
 const keep=u.ch.actives,uses=u.companionSignatureUses||(u.companionSignatureUses={});
 u.ch.actives=keep.filter(e=>!recoverySkills.has(e.skillId)||(uses[e.skillId]||0)<3);
 const before=st.events.length;
 try{return oldAI.call(this,st,u);}finally{
  u.ch.actives=keep;
  for(const e of st.events.slice(before))if(e.t==='use'&&e.uid===u.uid)uses[e.skillId]=(uses[e.skillId]||0)+1;
 }
};
// Source combat normally waits for every ally to fall. Story defeat is Hiro's.
function checkHiro(st){
 const hero=st.__storyHiroUid&&st.units.find(u=>u.uid===st.__storyHiroUid);
 if(!hero||(!hero.downed&&hero.chp>0&&!hero.fled))return;
 if(!st.__hiroDefeat){st.__hiroDefeat=true;st.events.push({t:'end',winner:'b',reason:'hiroDefeated'});}
 st.over=true;st.winner='b';
}
for(const name of ['act','advance','currentTurn']){
 const old=A.Combat[name];
 A.Combat[name]=function(st,...args){
  checkHiro(st);if(st.__hiroDefeat)return name==='act'?{ok:false,error:'Hiro defeated'}:null;
  const result=old.call(this,st,...args);checkHiro(st);
  return name==='currentTurn'&&st.__hiroDefeat?null:result;
 };
}
const oldWon=X.Encounter.won;
X.Encounter.won=enc=>!enc.st.__hiroDefeat&&oldWon(enc);
})();
