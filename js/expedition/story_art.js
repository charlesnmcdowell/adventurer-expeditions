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
