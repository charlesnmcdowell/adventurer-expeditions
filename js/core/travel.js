(function () {
'use strict';
const Travel = {}, L = () => ADV.DATA.TRAVEL_LOCATIONS;
Travel.locationFor = function(q) {
 if (q.travelLocation && L()[q.travelLocation]) return q.travelLocation;
 if (q.godLine && L()[q.routeId]) return q.routeId;
 const fid = q.factionId || q.warAgainst;
 if (fid) return ({maw:q.n === 5?'maw_boss':'maw',antler:'antler',varenholm:'academy',bell:'bell',green:q.n===5?'green_boss':'green',tally:'tally',navy:'navy'})[fid] || 'road';
 const text = [q.name,q.theme,q.brief,(q.encounters||[]).flatMap(e=>e.enemyTypeIds||e.types||[])].join(' ').toLowerCase();
 const rules = [
 [/birthing/,'birthing_house'],[/low.tide/,'low_tide'],[/pyre|ember|cult.fire/,'pyre'],
 [/marsh|mire|bog|frost.hag|plague/,'marsh'],[/lockup|breakout|prison/,'prison'],
 [/crypt|grave|ossuar|tomb|sentinel/,'crypt'],[/survey|\bruins?\b/,'ruins'],
 [/ship|naval|pirat|harbo|port\b|blockade/,'port'],[/coast|shore|sea\b|tide|cove/,'coast'],
 [/mountain|pass\b|climb/,'mountain'],[/tavern|inn\b|hedge.mage/,'tavern'],
 [/heist|quiet.run|settle|alley/,'alley'],[/warrant|magistrate|watch/,'city'],
 [/caravan|escort|road|salvage/,'road'],[/wood|wolf|beast|cull/,'forest'],
 ];
 return (rules.find(([re])=>re.test(text))||[null,q.factionAlignment==='criminal'?'alley':q.factionAlignment==='law'?'city':'forest'])[1];
};
Travel.declare = function(q) {
 if (!q) return q;
 const r=L()[Travel.locationFor(q)];
 q.travelLocation=r.id; q.terrain=r.terrain; q.distance=r.distance;
 q.passageCost=r.terrain==='port'?Math.min(30,Math.max(8,Math.floor(((q.payout||100)-(q.incomeBoostV1?100:0))*0.04))):0;
 q.midLegAfterEncounter=(!q.campaign&&!q.godLine&&(q.encounters||[]).length>=3)?1:null;
 return q;
};
Travel.quote = function(game,q,provisions=true) {
 Travel.declare(q);
 const far=q.distance==='far', days=far?2:1, supplies=far&&provisions?8:0;
 const party=ADV.Game.questParty(game,q);
 const payer=party?ADV.Party.leader(game.world,party):ADV.Game.player(game);
 return {location:L()[q.travelLocation],days,passage:q.passageCost,supplies,total:q.passageCost+supplies,payer,provisions:!!provisions};
};
Travel.history = game => game.meta.travelSeen || (game.meta.travelSeen={});
Travel.key = (q,leg,event) => 'travel:'+q.travelLocation+':v'+L()[q.travelLocation].version+':'+(event?'event:'+event:leg);
Travel.views = (game,key) => Math.min(2,Travel.history(game)[key]||0);
Travel.mark = function(game,key) {
 Travel.history(game)[key]=Math.min(2,Travel.views(game,key)+1);
 ADV.Save.saveMeta(game);
};
Travel.roster = function(game) {
 const p=ADV.Game.player(game), party=ADV.Game.questParty(game,game.travelResolution?.q?.quest), leader=party&&ADV.Party.leader(game.world,party);
 const snapshot=game.travelResolution&&game.travelResolution.roster;
 return (snapshot||ADV.Game.partyRoster(game)).filter(c=>c&&c.alive!==false&&!c.hasFled)
  .sort((a,b)=>(b.id===(leader||p).id)-(a.id===(leader||p).id));
};
Travel.plan = function(game,q,leg) {
 Travel.declare(q);
 const key=Travel.key(q,leg), visits=Travel.views(game,key);
 const named=leg==='outbound'&&Travel.roster(game).find(c=>c.campaignId&&
  ((ADV.DATA.CAMPAIGN_DIALOGUE[(ADV.DATA.CAMPAIGN_CHARS[c.campaignId]||{}).faction]||ADV.DATA.CAMPAIGN2_DIALOGUE[(ADV.DATA.CAMPAIGN_CHARS[c.campaignId]||{}).faction]||{})[c.campaignId]||{}).travel);
 if(named){const namedKey=Travel.key(q,leg,'companion-'+named.campaignId);if(Travel.views(game,namedKey)<2)return {key:namedKey,visits:Travel.views(game,namedKey),skip:Travel.views(game,namedKey)>0,bypass:false,event:'companion',location:L()[q.travelLocation],leg};}
 // A rare event is independently limited to two showings, including across lives.
 let event=null;
 if (leg==='outbound'&&visits>0) {
  const last=game.meta.travelLastRare||{};
  const lastEvent=game.meta.travelLastEvent||{};
  const journey=game.meta.travelJourneyCount||0;
  const roll=ADV.hashStr(q.id+':'+game.world.questClock+':rare')>>>0;
  const members=Travel.roster(game).filter(c=>!c.isPlayer&&!c.isUndead&&!c.campaign&&/^[MF]\d\d$/.test(c.personalityId));
  const friction=members.some(a=>members.some(b=>a!==b&&ADV.Rel.tierBetween(game.world,b.id,a.id)==='hatred'));
  const candidates=['roadside-candle','occupied-landmark','weather-turn'].concat(friction?['party-friction']:[])
   .filter(id=>Travel.views(game,Travel.key(q,leg,id))<2&&lastEvent[q.travelLocation]!==id);
  if (candidates.length&&roll%8===0&&last[q.travelLocation]!==journey-1) event=candidates[(roll>>>4)%candidates.length];
 }
 const contentKey=event?Travel.key(q,leg,event):key;
 return {key:contentKey,visits:Travel.views(game,contentKey),skip:Travel.views(game,contentKey)>0,
  bypass:!event&&visits>=2,event,location:L()[q.travelLocation],leg};
};
Travel.rememberTalk = function(game, speakers) {
 const w = game && game.world;
 if (!w) return;
 const ids = (speakers || []).map(c => c && c.id).filter(Boolean);
 w.travelSpoke = (w.travelSpoke || []).concat(ids);
 if (w.travelSpoke.length > 16) w.travelSpoke = w.travelSpoke.slice(-16);
};
Travel.pickTalkers = function(game, eligible, seed) {
 if (!eligible || !eligible.length) return { a: null, b: null };
 const recent = (game.world && game.world.travelSpoke) || [];
 const recency = (c) => {
  let n = 0;
  for (let i = 0; i < recent.length; i++) if (recent[i] === c.id) n += i + 1;
  return n;
 };
 const rng = new ADV.RNG(seed >>> 0);
 const ranked = rng.shuffle(eligible).sort((x, y) => recency(x) - recency(y));
 let a = ranked[0], b = ranked[1] || null;
 if (b && (seed & 1)) { const t = a; a = b; b = t; }
 return { a, b };
};
Travel.dialogue = function(game,q,leg,plan) {
 const roster=Travel.roster(game), p=ADV.Game.player(game);
 if(roster.length<2) return [];
 const named=roster.find(c=>c.campaignId);
 if(named&&leg==='outbound') {
  const def=ADV.DATA.CAMPAIGN_CHARS[named.campaignId];
  const table=ADV.DATA.CAMPAIGN_DIALOGUE[def.faction]||ADV.DATA.CAMPAIGN2_DIALOGUE[def.faction];
  const ls=table&&table[def.id]&&table[def.id].travel;
 if(ls) {const idx=Math.min(plan.visits,ls.length-1);return [{speaker:named,band:'travel',idx,text:ls[idx].t,to:p,campaign:def.id}];}
 }
 const eligible=roster.filter(c=>!c.isPlayer&&!c.isUndead&&!c.isMonster&&!c.campaign&&/^[MF]\d\d$/.test(c.personalityId));
 if(!eligible.length) return [];
 const voices=eligible.filter(c=>!c.isConscript);
 const pool=voices.length?voices:eligible;
 const seed=ADV.hashStr([q.id,leg,plan.visits,(game.meta&&game.meta.travelJourneyCount)||0,(game.world&&game.world.questClock)||0,pool.map(c=>c.id).join(',')].join(':'))>>>0;
 let {a,b}=Travel.pickTalkers(game,pool,seed);
 if(plan.event==='party-friction')for(const one of eligible){const two=eligible.find(c=>c!==one&&ADV.Rel.tierBetween(game.world,c.id,one.id)==='hatred');if(two){a=one;b=two;break;}}
 // Captive silence is intentional; only occasional practical speech.
 if(a&&a.isConscript&&seed%4) return [];
 let band=leg==='return'?'travel_'+((game.quest||(game.travelResolution&&game.travelResolution.q)||{}).failed?'return_loss':'return_win'):
  leg==='midleg'?'travel_midleg':plan.visits===0?'travel_'+q.travelLocation:'travel_'+(q.factionAlignment||'neutral');
 const make=(c,band,idx,to)=>({speaker:c,band,idx,text:ADV.DATA.DIALOGUE[c.personalityId][band][idx],to});
 const say=(c,band,to)=>{
  const r=ADV.util.speakEx(game.world,c,band,{target:to&&to.name,self:c.name});
  if(r) return {speaker:c,band:r.band,idx:r.idx,text:r.text,to};
  return make(c,band,0,to);
 };
 const lines=[say(a,band,b||p)];
 if(b) {
  const score=ADV.Rel.score(game.world,b.id,a.id);
  const response=ADV.Rel.tier(score)==='hatred'?'travel_hatred':ADV.Rel.isPartner(a,b)?'travel_romantic':'travel_response';
  lines.push(say(b,response,a));
 }
 Travel.rememberTalk(game, [a, b].filter(Boolean));
 return lines;
};
ADV.Travel=Travel;
// Ensure every existing generator and old board passes through the same catalog.
for(const name of ['make','makeSoloPremium','makeHazard','makeWarQuest','makeGodQuest']) {
 const original=ADV.Quests[name]; if(original) ADV.Quests[name]=function(...args){return Travel.declare(original.apply(this,args));};
}
const board=ADV.Quests.generateBoard;
Travel.prepareBoard=function(qs,world,game){
 qs.forEach(Travel.declare);
 for(const track of ['solo','party']) {
 const index=qs.findIndex(q=>q.tier===1&&q.track===track);
 {
  const local=ADV.Quests.makeTutorialParty();
  local.id='local-'+track+'-'+world.questClock;local.track=track;local.tutorialEasy=false;
  delete local.incomeBoostV1;local.payout=track==='solo'?40:100;local.travelLocation='road';local.localTravel=true;
  if(track==='party'&&game&&game.world) {
    const party=ADV.Party.of(game.world,ADV.Game.player(game));
    if(party)local.payout=Math.max(local.payout,ADV.Party.payroll(game.world,party)+40);
  }
  local.name=track==='solo'?'The village mile':'The wagon road';
  local.brief='Wolves have been taking livestock beside the village road. The work is nearby; no passage or provisions are needed.';
  if(index>=0)qs[index]=Travel.declare(local);else qs.push(Travel.declare(local));
 }
 }
 return qs;
};
ADV.Quests.generateBoard=function(world,rng,game){return Travel.prepareBoard(board.call(this,world,rng,game),world,game);};
const load=ADV.Game.load;
ADV.Game.load=function(...args){const game=load.apply(this,args);if(game&&game.board)Travel.prepareBoard(game.board,game.world,game);return game;};
const build=ADV.Campaign.buildQuest;
ADV.Campaign.buildQuest=function(...args){return Travel.declare(build.apply(this,args));};
})();
