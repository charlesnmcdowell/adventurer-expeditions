// Authored campaign projectiles and wards. Damage stays in the simulator.
(function(){
'use strict';const X=ADV.Expedition;
const groups={
 'chapter-one':['fire_bolt','prismatic_bolt','marked_for_the_knife','smoke_bomb'],
 nature:['thorn_lash','poison_spray','rot_wing','glass_web'],
 frost:['frost_touch','rime_grasp','rime_breath','coven_rime'],
 weapons:['aimed_shot','kunai_line','suppressing_volley','contract_mark'],
 occult:['blood_lotus','soul_bay','bell_silence','dispel'],
 fire:['siege_flame','ember_lash','fire_barrier','ashfall'],
 storm:['spark','chain_lightning','arcane_cascade','ranging_ward']};
const clips={};for(const [group,ids]of Object.entries(groups))ids.forEach((id,i)=>clips[id]={group,start:i*4});
for(const [id,source]of Object.entries({cinder_charge:'ember_lash',fire_ship:'siege_flame',
 bog_curse:'poison_spray',blood_pact:'blood_lotus',snare:'thorn_lash',
 killing_angle:'contract_mark',ranged_discipline:'ranging_ward',crossing_guard:'ranging_ward',
 vital_anchor:'ranging_ward',mend:'ranging_ward',restorative_circle:'ranging_ward',
 grove_raise:'thorn_lash',growth_field:'thorn_lash',raise:'blood_lotus',taunt:'contract_mark'}))clips[id]=clips[source];
const stationary=new Set(['marked_for_the_knife','smoke_bomb','contract_mark','killing_angle','taunt',
 'ranging_ward','ranged_discipline','crossing_guard','vital_anchor','fire_barrier','blood_pact','dispel','bell_silence','snare',
 'mend','restorative_circle','grove_raise','growth_field','raise']);
const keyFor=group=>group==='chapter-one'?'story_chapter_one_effects':'story_effects_'+group;
const F=X.StoryEffects={
  supports:id=>Object.hasOwn(clips,id),
  catalog:clips,
  preload(scene){
   for(const group of Object.keys(groups)){
    const KEY=keyFor(group);
    if(scene.textures.exists(KEY))continue;
    scene.load.json(KEY+'_manifest','assets/expedition/story/effects/'+group+'.json');
    scene.load.once('filecomplete-json-'+KEY+'_manifest',(key,type,data)=>{
      if(!scene.textures.exists(KEY))scene.load.spritesheet(KEY,'assets/expedition/story/effects/'+data.image,
        {frameWidth:data.frameWidth,frameHeight:data.frameHeight});
    });
   }
  },
  play(scene,id,from,to,opts={}){
    if(!F.supports(id))return Promise.resolve(false);
    const entry=clips[id],KEY=keyFor(entry.group);
    if(!scene.textures.exists(KEY))throw Error('Campaign effect art missing: '+id);
    const missile=opts.reflected||!stationary.has(id),smoke=id==='smoke_bomb';
    const duration=missile?360:smoke?800:650;
    const start=missile?from:to;
    const size=missile?(opts.height||300)*(opts.clip?.releaseAnchor?.sizeRatio||.4):smoke?230:110;
    const sprite=scene.add.image(start.x,start.y,KEY,entry.start).setDepth(650)
      .setDisplaySize(size,size)
      .setName('story_effect_'+id);
    if(missile)sprite.setRotation(Math.atan2(to.y-from.y,to.x-from.x)-Math.PI);
    return new Promise(resolve=>{
      let elapsed=0,done=false;
      const finish=()=>{if(done)return;done=true;scene.events.off('update',tick);
        scene.events.off('shutdown',finish);sprite.destroy();resolve(true);};
      const tick=(time,dt)=>{
        if(scene.paused||scene.time.paused||scene.__paintedHitStopCount>0||scene.time.now<(scene.__paintedHitStopUntil||0))return;
        elapsed+=Math.min(dt,50)*(scene.time.timeScale??1);
        const t=Math.min(1,elapsed/duration);
        sprite.setFrame(entry.start+Math.min(3,Math.floor(t*4)));
        if(missile)sprite.setPosition(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t);
        else sprite.setAlpha(t>.8?(1-t)/.2:1);
        if(t>=1)finish();
      };
      scene.events.on('update',tick);scene.events.once('shutdown',finish);
    });
  }
};
})();
