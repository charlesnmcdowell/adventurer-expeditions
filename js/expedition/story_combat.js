// Adapt authored campaign opponents to the existing Expeditions simulator.
// Art readiness is checked before creating any combat; portraits never stand in.
(function(){
'use strict';
const A=ADV,X=A.Expedition,S=X.Story,C=A.Campaign3;
const B=S.Combat={};
const copy=x=>JSON.parse(JSON.stringify(x));
// Source encounters expect party recovery and multi-target defenses. The story
// edition is solo. Keep authored kits but scope numerical tuning to tagged foes.
B.tuning={foeDamage:.60,laterFoeDamage:.35,percentHitCap:.28,recoveryMax:.25};
// The opening knife teaches three controls; the first mage boss introduces
// spell pressure. Retain their kits without party-sized burst on solo Hiro.
B.enemyDamage={'mini:nib':.30,'named:morwin':.35};
// Mine caster groups were built for a party. Shorten their combined health
// pools while preserving poison, healing, curses and ranged tactics.
B.encounterHealth={'4:1':.65,'4:2':.70,'4:3':.40};
B.encounterDamage={'4:1':.16,'4:2':.16,'4:3':.15};
// These hostile casts stop after placing a status/hazard or stripping buffs.
// Zero-power executions, percentage strikes and Paid in Full already hurt;
// self buffs (including Smoke Bomb) are deliberately not in this list.
B.statusStrikes=new Set(['marked_for_the_knife','contract_mark','ashfall','ranging_ward','taunt','dispel']);
B.statusStrikeRatio=.60;
const originalAct=A.Combat.act;
A.Combat.act=function(st,u,action){
  const start=st.events.length,id=action?.skillId;
  const shields=st.units.some(t=>t.ch?.expeditionStoryFoe)?st.units.filter(t=>t.tempHp>0).map(t=>[t,t.tempHp]):[];
  const target=st.units.find(t=>t.uid===action?.targetUid);
  const eligible=u.ch?.expeditionStoryFoe&&B.statusStrikes.has(id)&&target&&target.side!==u.side;
  // Measure before the new mark changes defence, at basic-attack tier/level.
  const basic=eligible?A.SkillSys.manifest(u.ch,{skillId:'basic_attack',level:1}):null;
  const amount=basic?Math.max(1,Math.round(A.Combat._internals.computeDamage(st,u,target,basic)*B.statusStrikeRatio)):0;
  const result=originalAct.call(this,st,u,action);
  const events=st.events.slice(start),use=events.find(e=>e.t==='use'&&e.uid===u.uid&&e.skillId===id);
  if(eligible&&result?.ok!==false&&use&&!st.over&&!target.downed&&!u.downed&&
      !events.some(e=>e.t==='interrupted'||e.t==='damage'&&e.by===u.uid&&e.uid===target.uid)){
    const skill=A.DATA.SKILLS[id];
    A.Combat._internals.dealDamage(st,u,target,amount,skill.elemental?'spell':'attack',
      {element:skill.element,melee:!!skill.melee,power:basic.data.power*B.statusStrikeRatio});
  }
  for(const [t,before]of shields){
    const absorbed=before-(t.tempHp||0);
    if(absorbed>0&&st.events.slice(start).some(e=>e.t==='damage'&&e.uid===t.uid))
      st.events.push({t:'shieldAbsorb',uid:t.uid,by:u.uid,absorbed,temporary:true});
  }
  return result;
};
const originalManifest=A.SkillSys.manifest;
A.SkillSys.manifest=function(ch,entry){
  const m=originalManifest.call(this,ch,entry);
  if(!m||!ch?.expeditionStoryFoe||!Number.isFinite(m.data.pctMaxHp))return m;
  return {...m,data:{...m.data,pctMaxHp:Math.min(m.data.pctMaxHp,B.tuning.percentHitCap)}};
};
const originalAllies=C.alliesFor;
C.alliesFor=function(game,...args){return game?.__expeditionStory?[]:originalAllies.call(this,game,...args);};

B.identity=function(ch,spec){
  if(ch.campaignId&&A.DATA.CAMPAIGN_CHARS[ch.campaignId])return 'named:'+ch.campaignId;
  if(ch.campaignCharId&&A.DATA.CAMPAIGN_CHARS[ch.campaignCharId])return 'named:'+ch.campaignCharId;
  if(spec.boss&&ch.name===A.DATA.CAMPAIGN_CHARS[spec.boss]?.name)return 'named:'+spec.boss;
  for(const id of spec.with||[])if(A.DATA.CAMPAIGN_CHARS[id]?.name===ch.name)return 'named:'+id;
  if(spec.mini){const m=A.DATA.CAMPAIGN_MINIBOSSES[spec.mini];
    if(m&&ch.enemyTypeId===m.base&&(ch.name===m.name||ch.name.startsWith(m.name+' ')))return 'mini:'+spec.mini;
  }
  if(ch.enemyTypeId&&A.DATA.CAMPAIGN_ENEMIES[ch.enemyTypeId])return 'enemy:'+ch.enemyTypeId;
  throw Error('Unmapped campaign opponent: '+ch.name);
};

B.spawn=function(session){
  const r=session.record,q=copy(session.game.quest.quest),spec=S.currentSpec(session);
  // Persisted no-escape decisions must reach the source spawner too.
  q.cEnc[r.encounter]=spec;
  const foes=C.spawnEncounter(session.game,q,r.encounter);
  for(const ch of foes){
    const id=B.identity(ch,spec),b=S.bindings[id];
    ch.storyOpponent=id;ch.expeditionKey='story:'+id;
    ch.expeditionStoryFoe=true;
    ch.c3FoeDmg=(ch.c3FoeDmg??1)*(B.enemyDamage[id]??B.encounterDamage[r.chapter+':'+r.encounter]??(r.chapter>=4?B.tuning.laterFoeDamage:B.tuning.foeDamage));
    // The source supplies a party with anti-healing companions. Here Hiro is
    // the only fighter: retain every healer's kit, but share a finite recovery
    // budget across healing, drains and overheal instead of restoring a whole
    // party's second health bar. The original engine already enforces it.
    ch.c3RecoveryMax=Math.min(ch.c3RecoveryMax??Infinity,B.tuning.recoveryMax);
    const health=B.encounterHealth[r.chapter+':'+r.encounter];
    if(health){ch.stats.hp*=health;ch.bonusStats.hp=(ch.bonusStats.hp||0)*health;if(ch.hpFloor)ch.hpFloor=Math.ceil(ch.hpFloor*health);}
    ch.expeditionArtIdentity=b?.actor||id;
    ch.noCombatVoice=true;delete ch.personalityId;
    if(ch.campaignExit&&spec.escapes===false)ch.campaignExit=false;
    // Per-opponent edition tuning is explicit and never changes source data.
    const tune=b?.balance;
    if(tune){
      for(const k of ['hp','atk','def','spd'])if(tune[k]!==undefined){
        if(!Number.isFinite(tune[k])||tune[k]<=0)throw Error('Invalid story balance '+id+'/'+k);
        ch.stats[k]*=tune[k];if(ch.bonusStats?.[k])ch.bonusStats[k]*=tune[k];
      }
      if(tune.hp&&ch.hpFloor)ch.hpFloor=Math.ceil(ch.hpFloor*tune.hp);
    }
  }
  return foes;
};

B.create=function(session,seed){
  const missing=S.readiness(session);if(missing.length)throw Error('Campaign combat art not ready: '+missing.join(', '));
  const foes=B.spawn(session),r=session.record;
  // A source guard added by a boss hook also needs a verified identity/art set.
  for(const ch of foes)if(!S.bindings[ch.storyOpponent]?.actor)throw Error('Campaign combat binding missing: '+ch.storyOpponent);
  const info=S.beginFight(session);
  if(Number.isFinite(r.run.hp))session.hero.combatHp=Math.max(1,r.run.hp);
  const encounter={id:'story-'+r.chapter+'-'+r.encounter,enemies:[],boss:foes.some(c=>c.boss),
    label:session.game.quest.quest.encounters[r.encounter]?.label||session.game.quest.quest.name,story:true};
  const enc=X.Encounter.create({encounter,seed,run:r.run,hero:session.hero,allies:[],foes});
  enc.storySession=session;enc.storyTutorial=info.tutorial;
  return enc;
};

B.win=function(session,enc){
  if(!X.Encounter.won(enc))throw Error('Cannot complete an unfinished or lost story fight');
  X.Encounter.rememberHp(session.record.run,X.Encounter.heroUnit(enc));
  const award=X.Encounter.award(enc);
  S.victory(session,enc.st.units.filter(u=>u.side==='b'));
  return award;
};
B.lose=function(session,enc){
  if(!X.Encounter.lost(enc))throw Error('Cannot retry an unfinished or won story fight');
  S.defeat(session);
};
})();
