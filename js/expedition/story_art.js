// Only verified campaign sets belong here; no creature stand-ins.
(function(){
'use strict';const X=ADV.Expedition,S=X.Story;
S.bindings['mini:nib']={actor:'story_nib',height:300,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['mini:cobb']={actor:'story_cobb',height:350,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:hired_knife']={actor:'story_hired_knife',height:315,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:consortium_mage']={actor:'story_consortium_mage',height:330,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['named:morwin']={actor:'story_merle',height:310,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['named:lessa']={actor:'story_lurleen',height:310,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:gnoll_raider']={actor:'story_gnoll_raider',height:350,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:bandit_archer']={actor:'story_bandit_archer',height:305,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['mini:gnoll_warleader']={actor:'story_snarl',height:385,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
// Source Bahadir survives this alternate fight. Hiro's pairs are explicitly
// nonlethal arm/leg disarms; his own defeat-Hiro pair remains lethal.
S.bindings['named:bramm']={actor:'story_bahadir',height:350,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:tunnel_kobold']={actor:'story_tunnel_kobold',height:210,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:kobold_shaman']={actor:'story_kobold_shaman',height:210,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['mini:kobold_chief']={actor:'story_kobold_chief',height:250,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:veylan_acolyte']={actor:'story_veylan_acolyte',height:315,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['named:grukhar']={actor:'story_grukhar',height:340,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
// Original named portrait/dialogue identify Femi as a male merchant; the old
// mini thumbnail depicts a different character and is not his animation model.
S.bindings['mini:verlan']={actor:'story_femi',height:315,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:gauntlet_soldier']={actor:'story_gauntlet_soldier',height:320,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
// Original Road Wolf is a gray wolf. Reuse the approved gray wolf and its
// three Hiro-owned pairs; no tint or unrelated creature substitution.
S.bindings['enemy:road_wolf']={actor:'wolf',height:250,reuse:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:3};
for(const [id,b]of Object.entries(S.bindings)){
  if(!b.reuse&&!X.monsterActors.includes(b.actor))X.monsterActors.push(b.actor);
  if(!X.Painted.actors.includes(b.actor))X.Painted.actors.push(b.actor);
  X.EnemyFinishers.registerActor(b.actor);
  X.enemies['story:'+id]={artActor:b.actor,kind:b.actor,height:b.height};
}
})();
