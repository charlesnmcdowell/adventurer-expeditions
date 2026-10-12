// Reuse each original painting and its authored ambience. The lower contact
// surface stays fixed while the distant plate and weather move behind actors.
(function(){
'use strict';const A=ADV,S=A.Expedition.Story;
S.Stage={
// Edition-owned combat adaptation. Dialogue keeps the original painting.
files:{dunmere_mine:'assets/expedition/story/stages/dunmere-mine-combat.webp',
  dunmere:'assets/expedition/story/stages/dunmere-combat-20261011.webp',
  ford:'assets/expedition/story/stages/ford-combat-20261011.webp'},
// These combat compositions have different landmarks from the dialogue plates.
// Keep water behind the bank and attach smoke/cloth/lights to their new positions.
profiles:{
  dunmere:{smoke:[[.244,.332,.14],[.294,.372,.12]],
    lights:[[.141,.385],[.388,.485],[.667,.473],[.676,.469]],
    cloth:[[.522,.155,.021,.102],[.642,.155,.018,.108]],
    fires:[[.874,.507,.016,.036],[.972,.5,.016,.036]],sky:[[.25,.003,.29,.10]]},
  ford:{water:[[.285,.526,.64,.032]],falls:[[.348,.252,.021,.162],[.289,.285,.01,.075]],
    cloth:[[.575,.202,.024,.105],[.855,.176,.024,.099]],sky:[[.29,.002,.22,.087]],birds:true}
},
paint(scene,id,key,phase){
  const def=S.Presentation.data.art.environments[id],profile=this.profiles[id]||A.GateAmbience.environments[id];
  const source=scene.textures.get(key).getSourceImage(),sw=source.width,sh=source.height;
  const scale=Math.max(1280/sw,760/sh),root=scene.add.container(0,0).setDepth(-10);
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
  root.layers=[bg,ground];root.layerOrder=['distance','weather-scenery','hero-ground'];
  root.locationId=id;root.ready=Promise.resolve(true);scene.battleArt=root;
  if(ambience)scene.events.off('update',ambience.update);
  let elapsed=0;const tick=(t,dt)=>{
    if(scene.paused||scene.time.paused)return;
    elapsed+=Math.min(dt,50)*scene.time.timeScale;
    bg.x=640+Math.sin(elapsed/13000)*2+(scene.cameras.main.scrollX||0)*.035;
    ambience?.update(t,Math.min(dt,50)*scene.time.timeScale);
  };
  scene.events.on('update',tick);scene.events.once('shutdown',()=>{scene.events.off('update',tick);root.destroy(true);});
  return root;
}};
})();
