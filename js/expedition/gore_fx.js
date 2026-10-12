// Website-only humanoid sword impact. This overlay does not load in portal profiles.
(function(){
'use strict';
const X=ADV.Expedition,G=X.HumanoidGore={};
const ids=new Set(['elven_wizard','elven_ranger','dark_swordswoman','enchantress','orc','goblin','hag']);
G.preload=(scene,actors)=>{
  if(ADV.Release?.target!=='website'||!actors.some(id=>ids.has(id)))return;
  if(!scene.textures.exists('xp_blood_slash'))scene.load.spritesheet('xp_blood_slash','assets/expedition/adult/blood/slash.webp?v=20261009-polish',{frameWidth:256,frameHeight:256});
};
// Contact coordinates measured on each registered paired canvas, relative to
// its Hiro pivot. The separate enemy's world position is NOT the embedded foe.
const contacts={
  elven_wizard:[[230,-185],[110,-220]],elven_ranger:[[65,-205],[110,-205]],
  dark_swordswoman:[[195,-225],[230,-235]],enchantress:[[395,-245],[140,-145]],
  orc:[[190,-255],[240,-260]],goblin:[[110,-105],[140,-110]],hag:[[165,-245],[120,-245]]
};
G.contacts=contacts;
G.play=(scene,hero,target,sheet,clipId)=>{
  // Replacement pairs paint blood at their own sword contact. Do not overlay
  // the old composition's measured point on top of a differently staged pair.
  if(sheet.clips[clipId]?.embeddedBlood)return ()=>{};
  if(ADV.Release?.target!=='website'||!ids.has(target.sheet?.actor)||!scene.textures.exists('xp_blood_slash'))return ()=>{};
  const point=contacts[target.sheet.actor]?.[clipId.endsWith('-2')?1:0];
  if(!point)return ()=>{};
  const scale=hero.height/(sheet.standing||300)*(sheet.clips[clipId].bodyScale||1);
  const x=hero.x+point[0]*scale*hero.facing,y=hero.y+point[1]*scale;
  const sprite=scene.add.image(x,y,'xp_blood_slash',0).setOrigin(.16,.90).setDisplaySize(150*scale,150*scale).setDepth((hero.root.depth||120)+2);
  if(scene.hudCam)scene.hudCam.ignore(sprite);
  let elapsed=0,done=false;
  const destroy=()=>{if(done)return;done=true;scene.events.off('update',tick);scene.events.off('shutdown',destroy);sprite.destroy();};
  const tick=(_t,dt)=>{
    // Holds through the finisher's painted hit-stop like the actors do.
    if(scene.paused||scene.time.paused||scene.__paintedHitStopCount>0||scene.time.now<(scene.__paintedHitStopUntil||0))return;
    elapsed+=dt*scene.time.timeScale;
    const frame=Math.min(7,Math.floor(elapsed/75));sprite.setFrame(frame);
    if(frame>=4)sprite.y=y+(target.y-y)*Math.min(1,(elapsed-300)/250);
    if(elapsed>750)sprite.setAlpha(Math.max(0,1-(elapsed-750)/250));
    if(elapsed>=1000)destroy();
  };
  scene.events.on('update',tick);scene.events.once('shutdown',destroy);
  scene.__lastHumanoidGore={actor:target.sheet.actor,started:true,x,y,clipId};return destroy;
};
})();
