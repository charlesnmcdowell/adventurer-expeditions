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
// Chapter five: Gorruk's paired disarms preserve his authored escape branch.
S.bindings['mini:skarn']={actor:'story_skarn',height:350,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:hob_sergeant']={actor:'story_hob_sergeant',height:340,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['enemy:gate_bandit']={actor:'story_road_bandit',height:315,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
S.bindings['named:gorruk']={actor:'story_gorruk',height:420,humanoid:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:2,plannedFrames:8,minDistinctFrames:16,goreBothDirections:true};
// Original Road Wolf is a gray wolf. Reuse the approved gray wolf and its
// three Hiro-owned pairs; no tint or unrelated creature substitution.
S.bindings['enemy:road_wolf']={actor:'wolf',height:250,reuse:true,combatReady:true,
  enemyFinisherReady:true,hiroFinishersReady:3};
// Chapters 6–14: authored ordinary sets and three 16-drawing pairs per identity.
S.bindings['mini:silksa']={actor:'story_silksa',"height":270,"humanoid":false,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:web_spider']={actor:'story_web_spider',"height":165,"humanoid":false,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:thornwise']={actor:'story_thornwise',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:umbra_druid']={actor:'story_umbra_druid',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:nettle']={actor:'story_nettle',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:wyvern_matriarch']={actor:'story_wyvern_matriarch',"height":450,"humanoid":false,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:wyvern']={actor:'story_wyvern',"height":420,"humanoid":false,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:kestrel']={actor:'story_kestrel',"height":330,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:consortium_guard']={actor:'story_consortium_guard',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:slave_driver']={actor:'story_slave_driver',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:malvane']={actor:'story_malvane',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:sewer_ogre_mage']={actor:'story_sewer_ogre_mage',"height":390,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:sewer_crawler']={actor:'story_sewer_crawler',"height":165,"humanoid":false,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:shadow_double']={actor:'story_shadow_double',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:lantern_master']={actor:'story_lantern_master',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:umbral_pair']={actor:'story_umbral_pair',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:tower_captain']={actor:'story_tower_captain',"height":345,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:maddox']={actor:'story_maddox',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:vask']={actor:'story_vask',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:rennick']={actor:'story_rennick',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:grell']={actor:'story_grell',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:family_double']={actor:'story_family_double',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:phase_spider']={actor:'story_phase_spider',"height":195,"humanoid":false,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:tomb_ghoul']={actor:'story_tomb_ghoul',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:gauntlet_traitor']={actor:'story_gauntlet_traitor',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:idris']={actor:'story_idris',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:amara']={actor:'story_amara',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:ravel']={actor:'story_ravel',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:kessa']={actor:'story_kessa',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:hall_doubles']={actor:'story_hall_doubles',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:palace_doppelganger']={actor:'story_palace_doppelganger',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:jarem']={actor:'story_jarem',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['enemy:morrak_cultist']={actor:'story_morrak_cultist',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:lucan']={actor:'story_lucan',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:altar_keepers']={actor:'story_altar_keepers',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['mini:your_own_faces']={actor:'story_your_own_faces',"height":315,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
S.bindings['named:korvath']={actor:'story_korvath',"height":360,"humanoid":true,"combatReady":true,"enemyFinisherReady":true,"hiroFinishersReady":2,"plannedFrames":8,"minDistinctFrames":16,"goreBothDirections":true};
for(const [id,b]of Object.entries(S.bindings)){
  if(!b.reuse&&!X.monsterActors.includes(b.actor))X.monsterActors.push(b.actor);
  if(!X.Painted.actors.includes(b.actor))X.Painted.actors.push(b.actor);
  X.EnemyFinishers.registerActor(b.actor);
  X.enemies['story:'+id]={artActor:b.actor,kind:b.actor,height:b.height};
}
})();
