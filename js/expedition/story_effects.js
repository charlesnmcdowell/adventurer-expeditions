// Painted opening-chapter effects. Damage and status rules remain in the sim.
(function(){
'use strict';const X=ADV.Expedition,KEY='story_chapter_one_effects';
const clips={fire_bolt:0,prismatic_bolt:4,marked_for_the_knife:8,smoke_bomb:12,
  spark:4,ember_lash:0,ashfall:0,cinder_charge:0,bog_curse:4,blood_pact:4};
const F=X.StoryEffects={
  supports:id=>Object.hasOwn(clips,id),
  preload(scene){
    if(scene.textures.exists(KEY))return;
    scene.load.json(KEY+'_manifest','assets/expedition/story/effects/chapter-one.json');
    scene.load.once('filecomplete-json-'+KEY+'_manifest',(key,type,data)=>{
      if(!scene.textures.exists(KEY))scene.load.spritesheet(KEY,'assets/expedition/story/effects/'+data.image,
        {frameWidth:data.frameWidth,frameHeight:data.frameHeight});
    });
  },
  play(scene,id,from,to,opts={}){
    if(!F.supports(id))return Promise.resolve(false);
    if(!scene.textures.exists(KEY))throw Error('Chapter-one effect art missing: '+id);
    const missile=!['marked_for_the_knife','smoke_bomb'].includes(id),smoke=id==='smoke_bomb';
    const duration=missile?360:smoke?800:650;
    const start=missile?from:to;
    const size=missile?(opts.height||300)*(opts.clip?.releaseAnchor?.sizeRatio||.4):smoke?230:110;
    const sprite=scene.add.image(start.x,start.y,KEY,clips[id]).setDepth(650)
      .setDisplaySize(size,size)
      .setName('story_effect_'+id);
    if(id==='spark')sprite.setTint(0xffeda3);
    if(id==='bog_curse'||id==='blood_pact')sprite.setTint(0x79dc83);
    if(missile)sprite.setRotation(Math.atan2(to.y-from.y,to.x-from.x)-Math.PI);
    return new Promise(resolve=>{
      let elapsed=0,done=false;
      const finish=()=>{if(done)return;done=true;scene.events.off('update',tick);
        scene.events.off('shutdown',finish);sprite.destroy();resolve(true);};
      const tick=(time,dt)=>{
        if(scene.paused||scene.time.paused||scene.__paintedHitStopCount>0||scene.time.now<(scene.__paintedHitStopUntil||0))return;
        elapsed+=Math.min(dt,50)*(scene.time.timeScale??1);
        const t=Math.min(1,elapsed/duration);
        sprite.setFrame(clips[id]+Math.min(3,Math.floor(t*4)));
        if(missile)sprite.setPosition(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t);
        else sprite.setAlpha(t>.8?(1-t)/.2:1);
        if(t>=1)finish();
      };
      scene.events.on('update',tick);scene.events.once('shutdown',finish);
    });
  }
};
})();
