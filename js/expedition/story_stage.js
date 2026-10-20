// Reuse each original painting and its authored ambience. The lower contact
// surface stays fixed while the distant plate and weather move behind actors.
(function(){
'use strict';const A=ADV,S=A.Expedition.Story;
S.Stage={
// Walkable floor boundaries measured in the 1280x760 combat view (after cover
// cropping), not the source image. Architecture, water and sky are not floor.
groundProfiles:{
  lanternhold:[[0,560],[1280,560]],griffon:[[0,530],[640,500],[1280,540]],
  shore:[[0,560],[400,540],[850,510],[1280,565]],open_hand:[[0,450],[1280,450]],
  dunmere:[[0,520],[1280,520]],ford:[[0,515],[1280,515]],
  gnoll_fort:[[0,550],[280,530],[500,540],[800,580],[1000,635],[1280,700]],
  dunmere_mine:[[0,540],[1280,540]],black_altar:[[0,570],[1280,570]],
  thornbury:[[0,585],[640,545],[1280,600]],holloway:[[0,625],[640,590],[1280,620]],
  bandit_camp:[[0,580],[640,550],[1280,580]],mirkhollow:[[0,665],[350,625],[700,600],[1280,665]],
  grove:[[0,555],[640,520],[1280,555]],cliffs:[[0,525],[1280,525]],
  iron_mine:[[0,620],[1280,620]],study:[[0,540],[1280,540]],valve:[[0,505],[1280,505]],
  sewers:[[0,530],[1280,530]],nine_lanterns:[[0,550],[1280,550]],counting:[[0,530],[1280,530]],
  tower:[[0,535],[1280,535]],silk_floor:[[0,520],[1280,520]],catacombs:[[0,540],[1280,540]],
  hunted_city:[[0,645],[640,620],[1280,675]],sickroom:[[0,460],[1280,460]],undervault:[[0,520],[1280,520]],
  palace:[[0,610],[1280,610]],undercity:[[0,625],[640,575],[1280,625]],temple:[[0,610],[1280,610]],
  mirrors:[[0,615],[1280,615]],morrak_realm:[[0,570],[1280,570]]
},
// Edition-owned combat adaptation. Dialogue keeps the original painting.
files:{nine_lanterns:'assets/expedition/story/stages/nine-lanterns-combat-20261015.webp',
  open_hand:'assets/expedition/story/stages/open-hand-combat-20261020.webp',
  dunmere_mine:'assets/expedition/story/stages/dunmere-mine-combat.webp',
  dunmere:'assets/expedition/story/stages/dunmere-combat-20261011.webp',
  ford:'assets/expedition/story/stages/ford-combat-20261011.webp',
  ...Object.fromEntries(['cliffs','sewers','study','counting','sickroom','tower','silk_floor','undervault','valve','catacombs'].map(id=>[id,'assets/expedition/story/stages/'+id+'-combat-20261014.webp']))},
// These combat compositions have different landmarks from the dialogue plates.
// Keep water behind the bank and attach smoke/cloth/lights to their new positions.
profiles:{
  open_hand:{lights:[[.520,.279],[.707,.166],[.768,.254],[.117,.432],[.218,.437],[.321,.442]],
    fires:[[.093,.150,.014,.035],[.126,.155,.014,.037],[.394,.161,.012,.030]],
    cloth:[[.820,.040,.051,.246],[.385,.040,.048,.057]],sky:[[.16,.003,.20,.075]],dust:true},
  nine_lanterns:{lights:[[.223,.313],[.285,.320],[.335,.326],[.385,.331],[.431,.336],[.480,.341],[.526,.345],[.572,.348],[.614,.351],[.656,.358]],cloth:[[.796,.358,.04,.13]],water:[[.90,.56,.10,.06]],sky:[[.81,.003,.18,.16]],dust:true},
  cliffs:{sky:[[.01,.005,.52,.30]],cloth:[[.69,.12,.085,.13]],mist:.59,birds:true},
  sewers:{lights:[[.125,.13],[.204,.20],[.679,.40],[.91,.33]],water:[[.13,.54,.78,.06]],falls:[[.151,.29,.019,.23],[.21,.37,.018,.17],[.88,.46,.025,.09]],mist:.59},
  study:{lights:[[.215,.27],[.417,.21],[.627,.17],[.83,.12]],cloth:[[.298,.12,.067,.29]],dust:true},
  counting:{lights:[[.125,.12],[.27,.155],[.944,.05]],dust:true},
  sickroom:{cloth:[[.149,.13,.028,.27],[.419,.12,.027,.28]],dust:true},
  tower:{lights:[[.074,.12],[.27,.20],[.568,.20],[.823,.16]],cloth:[[.04,.01,.05,.27],[.65,.01,.045,.20]],dust:true},
  silk_floor:{lights:[[.899,.10]],cloth:[[.292,.025,.075,.35],[.84,.015,.038,.24]],dust:true},
  undervault:{lights:[[.265,.16],[.396,.28],[.792,.28],[.903,.09]],dust:true},
  valve:{lights:[[.065,.17],[.441,.14],[.925,.06],[.972,.33]],falls:[[.15,.33,.018,.22],[.20,.35,.04,.20],[.49,.40,.021,.15]],water:[[.125,.535,.47,.035]],mist:.58},
  catacombs:{fires:[[.286,.164,.025,.07],[.382,.235,.026,.06],[.71,.13,.028,.063]],lights:[[.443,.306],[.718,.338]],mist:.59},
  dunmere:{smoke:[[.244,.332,.14],[.294,.372,.12]],
    lights:[[.141,.385],[.388,.485],[.667,.473],[.676,.469]],
    cloth:[[.522,.155,.021,.102],[.642,.155,.018,.108]],
    fires:[[.874,.507,.016,.036],[.972,.5,.016,.036]],sky:[[.25,.003,.29,.10]]},
  ford:{water:[[.285,.526,.64,.032]],falls:[[.348,.252,.021,.162],[.289,.285,.01,.075]],
    cloth:[[.575,.202,.024,.105],[.855,.176,.024,.099]],sky:[[.29,.002,.22,.087]],birds:true}
},
paint(scene,id,key,phase){
  // Dialogue loads the original painting: never apply a combat plate's
  // relocated water/flame coordinates to it.
  const def=S.Presentation.data.art.environments[id],combat=!!scene.story;
  const base=(!combat?null:this.profiles[id])||A.GateAmbience.environments[id];
  const profile=id==='morrak_realm'?{...base,flameTone:'blue'}:base;
  const source=scene.textures.get(key).getSourceImage(),sw=source.width,sh=source.height;
  // Dialogue shows the complete painting. Combat still fills its authored
  // arena, whose walkable boundaries are measured in this fixed viewport.
  const scale=(combat?Math.max:Math.min)(1280/sw,760/sh),root=scene.add.container(0,0).setDepth(-10);
  const bg=scene.add.image(640,380,key).setScale(scale);root.add(bg);root.background=bg;
  const ambience=A.GateAmbience.attach(scene,root,bg,profile);
  // A technical crop of existing pixels, not a new painted floor. Feathering
  // avoids a seam between the small distant drift and the fixed ground.
  const groundKey=key+'_contact';
  if(!scene.textures.exists(groundKey)){
    const tex=scene.textures.createCanvas(groundKey,sw,sh),ctx=tex.context;
    ctx.drawImage(source,0,0);ctx.globalCompositeOperation='destination-in';
    const mask=ctx.createLinearGradient(0,sh*.58,0,sh*.67);mask.addColorStop(0,'transparent');mask.addColorStop(1,'white');
    ctx.fillStyle=mask;ctx.fillRect(0,0,sw,sh);ctx.globalCompositeOperation='source-over';tex.refresh();
  }
  const weather=A.Weather.at(scene.game_.world,{phase,override:{kind:'clear',intensity:0,wind:.15}});
  const fx=A.GateAmbience.weather(scene,root,profile,!!def.indoor,weather,phase,{depth:-9,combat:true});
  if(fx?.container)root.add(fx.container);
  const ground=scene.add.image(640,380,groundKey).setScale(scale);root.add(ground);
  root.layers=[bg,ambience?.layer||fx?.container,ground].filter(Boolean);root.layerOrder=['distance','weather-scenery','hero-ground'];
  root.combatPlate=combat&&!!this.files[id];root.motionProfile=profile;
  root.locationId=id;root.ready=Promise.resolve(true);scene.battleArt=root;
  if(ambience)scene.events.off('update',ambience.update);
  let elapsed=0;const tick=(t,dt)=>{
    if(scene.paused||scene.time.paused)return;
    elapsed+=Math.min(dt,50)*scene.time.timeScale;
    if(combat)bg.x=640+Math.sin(elapsed/13000)*2+(scene.cameras.main.scrollX||0)*.035;
    ambience?.update(t,Math.min(dt,50)*scene.time.timeScale);
  };
  scene.events.on('update',tick);scene.events.once('shutdown',()=>{scene.events.off('update',tick);root.destroy(true);});
  return root;
}};
})();
