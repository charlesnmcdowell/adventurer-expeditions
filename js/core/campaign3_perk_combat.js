// Bounded battle effects for the story reward catalogue; no NPC acquisition.
(function () {
'use strict';
const G = {}, has = (u,k) => ADV.GatePerks.has(u && u.ch,k);
const live = u => u && !u.downed && !u.fled && !u.reserved;
const regular = u => live(u) && !u.ch.isQuestThrall && !u.ch.isSummon && !u.ch.summoned && !u.ch.summonerId;
const direct = tag => tag === 'attack' || tag === 'spell';
const event = (st,u,key) => st.events.push({t:'status',uid:u.uid,kind:key});
G.canTarget = (u,t) => !t.untargetable || has(u,'unmasker');
G.evasionCut = u => has(u,'unmasker') ? ((u.ch.perks.find(e => e.skillId === 'gate_unmasker').campaignRank || 1) >= 2 ? 0.25 : 0.15) : 0;
G.bypassDodge = function (st,u) {
  if (!has(u,'unmasker') || u.gateDodgeRound === st.round) return false;
  u.gateDodgeRound = st.round;
  return true;
};
function shield(st,u,pct,expires,key) {
  const amount = Math.max(1,Math.round(u.maxHp*pct));
  (u.gateShields || (u.gateShields=[])).push({left:amount,expires});
  u.tempHp += amount;
  event(st,u,key);
}
G.start = function (st) {
  const owners = st.units.filter(u => live(u) && u.ch.isPlayer);
  for (const owner of owners) {
    const party = st.units.filter(u => u.side === owner.side && regular(u));
    if (has(owner,'veteran')) for (const u of party) {
      u.gateBaseMax = u.maxHp;
      const pct = Math.max(0,Math.min(1,u.chp/u.maxHp));
      u.maxHp = Math.round(u.maxHp*1.05); u.chp = Math.round(u.maxHp*pct);
    }
    if (has(owner,'door')) for (const u of party) shield(st,u,0.05,2,'Hold the Door');
  }
};
G.absorb = function (u,amount) {
  for (const s of u.gateShields || []) { const used=Math.min(s.left,amount);s.left-=used;amount-=used; }
};
G.endRound = function (st) {
  for (const u of st.units) {
    for (const s of u.gateShields || []) if (st.round >= s.expires) { u.tempHp=Math.max(0,u.tempHp-s.left);s.left=0; }
    u.gateShields=(u.gateShields || []).filter(s => s.left > 0);
  }
};
function mastery(st,u) {
  if (!live(u) || !has(u,'mastery') || u.gateMastery || u.chp <= 0 || u.chp/u.maxHp >= 0.3) return;
  u.gateMastery=true; shield(st,u,0.15,st.round+1,'Self-Mastery');
}
// These small heals honor anti-healing, but cannot amplify, cleanse, splash or overheal.
function heal(st,src,tgt,amount,key) {
  if (!live(tgt) || tgt.chp >= tgt.maxHp || tgt.statuses.some(s => s.kind==='withering')) return 0;
  const cut = tgt.statuses.find(s => s.kind==='healcut');
  if (cut) amount *= 1-(cut.pct == null ? 0.5 : cut.pct);
  const limit = ADV.Combat._internals.recoveryLeft(tgt);
  amount=Math.max(0,Math.min(Math.round(amount),tgt.maxHp-tgt.chp,limit));
  if (!amount) return 0;
  tgt.chp+=amount; tgt.healingReceived=(tgt.healingReceived || 0)+amount;
  if (Number.isFinite(limit)) tgt.recoverySpent=(tgt.recoverySpent || 0)+amount;
  src.healingDone=(src.healingDone || 0)+amount;
  ADV.Combat.addThreat(st,src,Math.round(amount/tgt.maxHp*30),'healing');
  st.events.push({t:'heal',uid:tgt.uid,by:src.uid,amount,temp:tgt.tempHp,skillId:'gate_'+key});
  return amount;
}
G.turn = function (st,u) {
  mastery(st,u);
  if (!has(u,'cure') || u.gateCureRound === st.round || (u.gateCureUses || 0)>=3) return;
  u.gateCureRound=st.round;
  const eligible = st.units.filter(t => t.side===u.side && regular(t) && t.chp<t.maxHp && !t.statuses.some(s=>s.kind==='withering' || (s.kind==='healcut' && s.pct>=1)));
  const companions=eligible.filter(t=>t!==u).sort((a,b)=>a.chp/a.maxHp-b.chp/b.maxHp);
  const target=companions[0] || eligible.find(t=>t===u);
  if (target && heal(st,u,target,target.maxHp*0.06,'cure')) u.gateCureUses=(u.gateCureUses || 0)+1;
};
G.beginAction = function (st,u) {
  st.gateAction={id:(st.gateActionSerial || 0)+1,uid:u.uid,damage:0,attempted:false};
  st.gateActionSerial=st.gateAction.id;
};
G.attempt = function (st,src,tgt,tag) {
  if (src && st.gateAction?.uid===src.uid && src.side!==tgt.side && direct(tag)) st.gateAction.attempted=true;
};
G.focus = (st,u) => has(u,'focus') && st.gateAction?.uid===u.uid && u.gateFocusRound!==st.round;
G.modifyDamage = function (st,src,tgt,dmg,tag,opts) {
  const a=st.gateAction, own=src && a && a.uid===src.uid && src.side!==tgt.side && direct(tag);
  if (own) {
    a.attempted=true;
    if (has(src,'resolve') && tgt.chp/tgt.maxHp<0.35) dmg*=1.12;
    if (has(tgt,'duke')) {
      if (tgt.gateDukeAction==null) tgt.gateDukeAction=a.id;
      if (tgt.gateDukeAction===a.id) dmg*=0.8;
    }
  }
  const el=opts.element || (opts.visual?.dotKind==='burn' ? 'fire' : null);
  if (has(tgt,'unbowed') && ['fire','ice','lightning'].includes(el)) dmg*=0.8;
  if (has(tgt,'hardiness') && tag==='dot' && opts.visual?.dotKind==='poison') dmg*=0.8;
  return Math.round(dmg);
};
G.damaged = function (st,src,tgt,hpDamage,tag) {
  const a=st.gateAction;
  if (src && a && a.uid===src.uid && src.side!==tgt.side && direct(tag)) a.damage+=Math.max(0,hpDamage);
  mastery(st,tgt);
};
G.finishAction = function (st,u) {
  const a=st.gateAction;
  if (!a || a.uid!==u.uid) return;
  if (a.attempted) u.gateFocusRound=st.round;
  if (a.attempted && has(u,'drain') && u.gateDrainRound!==st.round) {
    u.gateDrainRound=st.round;
    if (a.damage>0 && live(u) && (u.gateDrainUses || 0)<3 && heal(st,u,u,Math.min(a.damage*0.15,u.maxHp*0.05),'drain')) u.gateDrainUses=(u.gateDrainUses || 0)+1;
  }
  st.gateAction=null;
};
G.exportHp = u => u.gateBaseMax ? Math.min(u.gateBaseMax,Math.round(u.chp/u.maxHp*u.gateBaseMax)) : u.chp;
ADV.GatePerkCombat=G;
})();
