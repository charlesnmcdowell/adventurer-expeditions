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
const reflectedClips={fire_bolt:0,prismatic_bolt:4,aimed_shot:8,suppressing_volley:8,kunai_line:8,marked_for_the_knife:12};
// New companion-only effects do not replace any original enemy spell artwork.
const companionClips={};['whisper_of_ending','shield_wall','cleanse','thorn_skin'].forEach((id,i)=>companionClips[id]={group:'companion-support',start:i*4});
['mend','regenerate','defiant_stand','counter_attack'].forEach((id,i)=>companionClips[id]={group:'companion-recovery',start:i*4});
const companionStationary=new Set(['shield_wall','thorn_skin','mend','regenerate','defiant_stand','counter_attack']);
for(const [id,source]of Object.entries({cinder_charge:'ember_lash',fire_ship:'siege_flame',
 bog_curse:'poison_spray',wither_touch:'blood_lotus',blood_pact:'blood_lotus',snare:'thorn_lash',
 killing_angle:'contract_mark',ranged_discipline:'ranging_ward',crossing_guard:'ranging_ward',
 vital_anchor:'ranging_ward',mend:'ranging_ward',restorative_circle:'ranging_ward',
 grove_raise:'thorn_lash',growth_field:'thorn_lash',thorn_skin:'thorn_lash',storm_shape:'ranging_ward',
 blood_price:'blood_lotus',raise:'blood_lotus',taunt:'contract_mark'}))clips[id]=clips[source];
const stationary=new Set(['marked_for_the_knife','smoke_bomb','contract_mark','killing_angle','taunt',
 'ranging_ward','ranged_discipline','crossing_guard','vital_anchor','fire_barrier','blood_pact','dispel','bell_silence','snare',
 'mend','restorative_circle','grove_raise','growth_field','thorn_skin','storm_shape','blood_price','raise']);
const keyFor=group=>group==='chapter-one'?'story_chapter_one_effects':'story_effects_'+group;
const themes={
 fire:{aura:'fire_barrier',impact:'ashfall',color:0xffab4c},
 frost:{aura:'rime_grasp',impact:'rime_grasp',color:0x8cddff},
 nature:{aura:'thorn_lash',impact:'poison_spray',color:0x94e891},
 occult:{aura:'blood_lotus',impact:'blood_lotus',color:0xcb9aff},
 storm:{aura:'ranging_ward',impact:'arcane_cascade',color:0xc7d5ff},
 support:{aura:'ranging_ward',impact:'ranging_ward',color:0xffedab}
};
const entryFor=(id,opts={})=>(opts.companion&&companionClips[id])||clips[id];
function family(id){const g=clips[id]?.group;
 if(['thorn_skin','mend','regenerate','wither_touch'].includes(id))return 'nature';
 if(id==='whisper_of_ending')return 'occult';
 if(id==='fire_bolt')return 'fire';if(id==='prismatic_bolt')return 'storm';
 return themes[g]?g:'support';}
// Every effect owns its update/shutdown listeners and settles on interruption.
function animate(scene,duration,draw,done=()=>{}){
 let elapsed=0,ended=false;
 const finish=()=>{if(ended)return;ended=true;scene.events.off('update',tick);scene.events.off('shutdown',finish);done();};
 const tick=(time,dt)=>{
  if(scene.ended){finish();return;}
  if(scene.paused||scene.time.paused||scene.__paintedHitStopCount>0||scene.time.now<(scene.__paintedHitStopUntil||0))return;
  elapsed+=Math.min(dt,50)*(scene.time.timeScale??1);draw(Math.min(1,elapsed/duration),elapsed);
  if(elapsed>=duration)finish();
 };
 scene.events.on('update',tick);scene.events.once('shutdown',finish);return finish;
}
const F=X.StoryEffects={
  supports:(id,opts={})=>Object.hasOwn(clips,id)||(opts.companion&&Object.hasOwn(companionClips,id)),
  catalog:clips,
  family,
  // Marks from a knife/mace/guard are carried by that weapon's contact, never a flying badge.
  meleeStatus:new Set(['marked_for_the_knife','contract_mark','taunt']),
  charge(scene,id,actor,clip,opts={}){
    if(!F.supports(id,opts)||['smoke_bomb','aimed_shot','kunai_line','suppressing_volley'].includes(id))return ()=>{};
    const theme=themes[family(id)],auraEntry=(opts.companion&&companionStationary.has(id)&&companionClips[id])||clips[theme.aura],shot=entryFor(id,opts);
    const aura=scene.add.image(actor.x,actor.y,keyFor(auraEntry.group),auraEntry.start).setDepth((actor.root?.depth||100)-1).setAlpha(0).setName('spell_charge_aura');
    const focus=scene.add.image(actor.x,actor.y,keyFor(shot.group),shot.start).setDepth(650).setAlpha(0).setName('spell_charge_focus');
    const wisps=[0,1,2,3].map(()=>scene.add.image(actor.x,actor.y,keyFor(auraEntry.group),auraEntry.start)
      .setDepth((actor.root?.depth||100)+1).setAlpha(0).setName('spell_charge_wisp'));
    const size=actor.height*actor.perspectiveAt(actor.y);
    const supportScale=opts.companion&&companionStationary.has(id)?1.6:1;
    // Charges grow during the authored windup, then disappear precisely at release.
    const release=clip.release??Math.floor(clip.frames.length/2);
    const hold=(clip.frameDurationsMs||[]).slice(0,release).reduce((n,x)=>n+x,0)||clip.durationMs*release/clip.frames.length||400;
    return animate(scene,Math.max(700,hold+250),(t,ms)=>{
      if(actor._destroyed)return;
      const at=actor.releasePoint(clip),p=Math.min(1,ms/Math.max(180,hold));
      const near=actor.chest?.()||{x:actor.x,y:actor.y-size*.5},reach=Math.max(0,(p-.3)/.7);
      aura.setPosition(actor.x,actor.y-size*.40).setFrame(auraEntry.start+Math.floor(ms/100)%4)
        .setDisplaySize(size*(.9+.38*p)*supportScale,size*(.9+.38*p)*supportScale).setAlpha(.35+.4*p);
      focus.setPosition(near.x+(at.x-near.x)*reach,near.y+(at.y-near.y)*reach).setFrame(shot.start+Math.floor(ms/90)%4)
        .setDisplaySize(size*(.14+.25*p)*supportScale,size*(.14+.25*p)*supportScale).setAlpha(.35+.65*p);
      wisps.forEach((w,i)=>{const rise=(ms/650+i*.25)%1,side=i%2?1:-1;
        w.setPosition(actor.x+side*size*(.25+.08*Math.sin(rise*Math.PI)),actor.y-size*(.08+.85*rise))
          .setFrame(auraEntry.start+(Math.floor(ms/100)+i)%4).setDisplaySize(size*.26*supportScale,size*.34*supportScale)
          .setAlpha(Math.sin(rise*Math.PI)*(.35+.5*p));});
    },()=>{aura.destroy();focus.destroy();wisps.forEach(w=>w.destroy());});
  },
  impact(scene,id,to,height){
    const entry=clips[themes[family(id)].impact];
    const burst=scene.add.image(to.x,to.y,keyFor(entry.group),entry.start).setDepth(650).setName('spell_contact_'+id);
    const size=Math.max(130,Math.min(240,(height||300)*.72));
    return animate(scene,280,t=>{
      burst.setFrame(entry.start+Math.min(3,Math.floor(t*4))).setDisplaySize(size*(.6+.65*t),size*(.6+.65*t)).setAlpha(1-t);
    },()=>burst.destroy());
  },
  preload(scene){
   const loadGroups=[...Object.keys(groups),'reflected'];
   if(X.Story?.Companions?.enabled)loadGroups.push('companion-support','companion-recovery');
   for(const group of loadGroups){
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
    if(!F.supports(id,opts))return Promise.resolve(false);
    const reflected=opts.reflected&&Object.hasOwn(reflectedClips,id);
    const entry=reflected?{group:'reflected',start:reflectedClips[id]}:(opts.companion&&companionClips[id])||clips[id],KEY=keyFor(entry.group);
    if(!scene.textures.exists(KEY))throw Error('Campaign effect art missing: '+id);
    const missile=opts.reflected||!(stationary.has(id)||(opts.companion&&companionStationary.has(id))),smoke=id==='smoke_bomb';
    const enhanced=!!opts.cinematic;
    const duration=missile?(enhanced?440:360):smoke?800:650;
    const start=missile?from:to;
    const size=missile?(opts.height||300)*(enhanced?Math.max(.60,opts.clip?.releaseAnchor?.sizeRatio||0):(opts.clip?.releaseAnchor?.sizeRatio||.4)):smoke?230:enhanced?(opts.companion?270:190):110;
    const sprite=scene.add.image(start.x,start.y,KEY,entry.start).setDepth(650)
      .setDisplaySize(size,size)
      .setName('story_effect_'+id);
    if(missile)sprite.setRotation(Math.atan2(to.y-from.y,to.x-from.x)-(reflected?0:Math.PI));
    const trails=enhanced&&missile?[1,2,3].map(i=>scene.add.image(start.x,start.y,KEY,entry.start)
      .setDepth(649).setDisplaySize(size*(1-i*.14),size*(1-i*.14)).setRotation(sprite.rotation||0).setAlpha(0).setName('spell_trail_'+id)):[];
    return new Promise(resolve=>{
      let elapsed=0,done=false;
      const finish=()=>{if(done)return;done=true;scene.events.off('update',tick);
        scene.events.off('shutdown',finish);sprite.destroy();trails.forEach(s=>s.destroy());resolve(true);};
      const tick=(time,dt)=>{
        if(scene.ended){finish();return;}
        if(scene.paused||scene.time.paused||scene.__paintedHitStopCount>0||scene.time.now<(scene.__paintedHitStopUntil||0))return;
        elapsed+=Math.min(dt,50)*(scene.time.timeScale??1);
        const t=Math.min(1,elapsed/duration);
        sprite.setFrame(entry.start+Math.min(3,Math.floor(t*4)));
        if(missile)sprite.setPosition(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t);
        else sprite.setAlpha(t>.8?(1-t)/.2:1);
        trails.forEach((s,i)=>{const p=Math.max(0,t-(i+1)*.07);s.setPosition(from.x+(to.x-from.x)*p,from.y+(to.y-from.y)*p)
          .setFrame(entry.start+Math.min(3,Math.floor(t*4))).setAlpha(Math.min(1,t*8)*(.23-i*.055));});
        if(t>=1){if(enhanced)F.impact(scene,id,to,opts.height);finish();}
      };
      scene.events.on('update',tick);scene.events.once('shutdown',finish);
    });
  }
};
})();
