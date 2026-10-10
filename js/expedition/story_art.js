// Only verified campaign sets belong here; no creature stand-ins.
(function(){
'use strict';const X=ADV.Expedition,S=X.Story;
S.bindings['mini:nib']={actor:'story_nib',height:300,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
for(const [id,b]of Object.entries(S.bindings)){
  if(!X.monsterActors.includes(b.actor))X.monsterActors.push(b.actor);
  if(!X.Painted.actors.includes(b.actor))X.Painted.actors.push(b.actor);
  X.EnemyFinishers.registerActor(b.actor);
  X.enemies['story:'+id]={artActor:b.actor,kind:b.actor,height:b.height};
}
})();
