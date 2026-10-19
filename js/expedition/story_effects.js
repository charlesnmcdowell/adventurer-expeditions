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
 blood_price:'blood_lotus',raise:'blood_lotus',taunt:'contract_mark',
 xp_arcane_volley:'arcane_cascade',xp_arcane_ward:'ranging_ward',
 xp_binding_sigil:'bell_silence',xp_waning_curse:'soul_bay'}))clips[id]=clips[source];
const stationary=new Set(['marked_for_the_knife','smoke_bomb','contract_mark','killing_angle','taunt',
 'ranging_ward','ranged_discipline','crossing_guard','vital_anchor','fire_barrier','blood_pact','dispel','bell_silence','snare',
 'mend','restorative_circle','grove_raise','growth_field','thorn_skin','storm_shape','blood_price','raise',
 'xp_arcane_ward','xp_binding_sigil']);
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
  // Presentation only: never changes a resolved roll, damage or story skill.
  // Match the weapon actually painted in each set, not a generic basic attack.
  basicEffects:{story_bandit_archer:'aimed_shot',story_grell:'aimed_shot',elven_ranger:'aimed_shot',
    story_consortium_mage:'prismatic_bolt',story_merle:'fire_bolt',story_femi:'frost_touch',
    story_kobold_shaman:'fire_bolt',story_kobold_chief:'fire_bolt',story_veylan_acolyte:'blood_lotus',
    story_grukhar:'poison_spray',story_thornwise:'thorn_lash',story_umbra_druid:'thorn_lash',
    story_malvane:'frost_touch',story_rennick:'spark',story_kessa:'chain_lightning',story_jarem:'siege_flame',
    story_altar_keepers:'poison_spray',elven_wizard:'prismatic_bolt',enchantress:'soul_bay',hag:'bog_curse'},
  enemyAction(actor,id,skill){
    const key=actor.sheet?.actor||actor.kind;
    // These two source kits include ranger skills but their approved art is
    // a greatsword and a hooked blade respectively. Deliver those via contact.
    const bladeShot=['story_bahadir','story_tunnel_kobold'].includes(key)&&['aimed_shot','snare'].includes(id);
    const crossbow=key==='story_grell'&&['basic_attack','aimed_shot','killing_angle','backstab'].includes(id);
    const weaponStatus=!crossbow&&(F.meleeStatus.has(id)||bladeShot);
    const basic=id==='basic_attack'&&F.basicEffects[key];
    const effect=crossbow?'aimed_shot':basic||({killing_angle:'aimed_shot',xp_enchanted_arrow:'aimed_shot',
      ghoststep:'smoke_bomb',smoke_step:'smoke_bomb',cloak_of_shadows:'smoke_bomb',
      beast_shape:'thorn_skin',warding_stance:'ranging_ward'}[id]||id);
    const ranged=crossbow||!!basic||(!weaponStatus&&(skill.elemental||(skill.reach==='any'&&!skill.melee&&!skill.katana&&skill.target&&!['self','party','ally','deadAlly','allyLane'].includes(skill.target))));
    return {effect,ranged:!!ranged,weaponStatus};
  },
  supports:(id,opts={})=>id==='shadow_rise'||Object.hasOwn(clips,id)||(opts.companion&&Object.hasOwn(companionClips,id)),
  stanceFor:id=>id==='xp_evasive_step'?'roll':[
    'xp_blade_counter','shield_wall','close_order','stone_stance','defiant_stand',
    'hold_the_road','bulwark_formation','counter_attack','countersign'].includes(id)?'intercept':null,
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
   const loadGroups=[...Object.keys(groups),'reflected','resurrection'];
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
  // One resolved attack, many painted arrows. No extra damage/status rolls.
  skyVolley(scene,from,to,height){
    const key=keyFor('weapons'),size=height*.24;
    const leader=scene.add.image(from.x,from.y,key,0).setDepth(650).setDisplaySize(size,size).setName('sky_volley_launch');
    const rain=Array.from({length:100},(_,i)=>{
      const end={x:to.x+((i*37)%181)-90,y:to.y+((i*19)%81)-35};
      return {start:{x:end.x-60,y:Math.max(70,to.y-380)-((i*11)%55)},end,delay:.26+(i%20)*.017,
        sprite:scene.add.image(0,0,key,0).setDepth(650).setDisplaySize(size*.8,size*.8).setAlpha(0).setName('sky_volley_arrow')};
    });
    return new Promise(resolve=>animate(scene,1250,t=>{
      const p=Math.min(1,t/.27);leader.setPosition(from.x+170*p,from.y-280*p)
        .setRotation(Math.atan2(-280,170)-Math.PI).setAlpha(t<.27?1:0).setFrame(Math.min(3,Math.floor(p*4)));
      for(const r of rain){const q=(t-r.delay)/.35;
        if(q<0||q>1){r.sprite.setAlpha(0);continue;}
        r.sprite.setPosition(r.start.x+(r.end.x-r.start.x)*q,r.start.y+(r.end.y-r.start.y)*q)
          .setRotation(Math.atan2(r.end.y-r.start.y,r.end.x-r.start.x)-Math.PI)
          .setAlpha(q>.86?(1-q)/.14:.88).setFrame(Math.min(3,Math.floor(q*4)));
      }
    },()=>{leader.destroy();rain.forEach(r=>r.sprite.destroy());resolve(true);}));
  },
  // The combat engine has already revived the unit. Present its fall and
  // return without changing HP, charges, stealth, team or damage outcomes.
  async resurrect(scene,actor){
    if(!actor||actor._destroyed||scene.ended)return false;
    if(actor.__rising)return actor.__rising;
    const task=(async()=>{
      actor.restoreFromFade();
      await actor.play('kneel');
      if(actor._destroyed||scene.ended)return false;
      const size=actor.height*actor.perspectiveAt(actor.y),key=keyFor('resurrection');
      const fx=scene.add.image(actor.x,actor.y,key,0).setOrigin(.5,300/384)
        .setDisplaySize(size*1.55,size*1.55*384/400).setDepth(actor.root.depth+.01).setName('shadow_rise_grave');
      fx.__riserUid=actor.uid;
      const maskShape=scene.make.graphics({x:0,y:0,add:false});
      maskShape.fillStyle(0xffffff).fillRect(actor.x-size*2,actor.y-size*3,size*4,size*3+2);
      const mask=maskShape.createGeometryMask(),oldMask=actor.img.mask;
      const plateVisible=actor.plate.visible,shadowAlpha=actor.shadow?.alpha??1;
      actor.plate.setVisible(false);actor.img.setMask(mask);actor.img.anims.stop();
      let standing=false;
      await new Promise(resolve=>animate(scene,1900,(t)=>{
        if(actor._destroyed)return;
        fx.setFrame(Math.min(15,Math.floor(t*16))).setAlpha(t>.88?(1-t)/.12:1);
        if(t<.23){actor.img.setAlpha(1-t/.23);}
        else{
          if(!standing){actor.resetImageTransform();actor.img.setFrame(actor.sheet.clips.idle.frames[0]);standing=true;}
          const p=Math.max(0,Math.min(1,(t-.31)/.51)),ease=p*p*(3-2*p);
          actor.img.y=actor.height*(1-ease);actor.img.setAlpha(1);
          if(actor.shadow)actor.shadow.setAlpha(shadowAlpha*ease);
        }
      },()=>{
        fx.destroy();
        if(!actor._destroyed){
          actor.img.clearMask();if(oldMask)actor.img.setMask(oldMask);
          actor.img.setAlpha(1);actor.img.y=0;actor.resetImageTransform();
          actor.plate.setVisible(plateVisible);if(actor.shadow)actor.shadow.setAlpha(shadowAlpha);
          if(!scene.ended&&scene.sys?.isActive())actor.idle();
        }
        mask.destroy();maskShape.destroy();resolve();
      }));
      if(!actor._destroyed&&!scene.ended){actor.alive=true;actor.refresh(true);}
      return true;
    })();
    actor.__rising=task;
    try{return await task;}finally{actor.__rising=null;}
  },
  play(scene,id,from,to,opts={}){
    if(id==='shadow_rise')return opts.actor?F.resurrect(scene,opts.actor):Promise.resolve(false);
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
