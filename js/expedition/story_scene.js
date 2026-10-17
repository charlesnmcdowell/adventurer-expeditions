// Campaign battle reuses the Arcade director/actors/HUD; outcomes go to Story.
(function(){
'use strict';const A=ADV,X=A.Expedition,S=X.Story;
class StoryBattle extends X.Scene{
  constructor(){super();this.sys.settings.key='StoryBattle';}
  init(opts){this.opts=opts||{};this.story=S.open(this.opts.record||S.load());this.run=this.story.record.run;
    this.artIds=['hiro',...new Set(S.opponentIds(this.story).map(id=>S.bindings[id]?.actor).filter(Boolean)),...(S.Companions?.enabled?S.Companions.selected(this.story).map(id=>'companion_'+id):[])];}
  preload(){
    X.Painted.preload(this,this.artIds);X.UI.preloadBusts(this);X.DefeatFX.preload(this);X.StoryEffects.preload(this);
    const r=this.story.record,d=S.Presentation.data,id=d.routes[r.chapter][r.encounter];
    this.location=id;this.storyBackground='story_bg_'+id;
    this.load.image(this.storyBackground,S.Stage.files[id]||S.Presentation.media(d.art.environments[id].file));
  }
  create(){
    this.__presentationReady=false;this.__paintedHitStopCount=0;if(!X.Painted.require(this,this.artIds))return;
    this.actors=new Map();this.paused=false;this.time.paused=false;this.ended=false;this.__enemyFinishPresented=false;
    this.world={game:this.story.game,hero:this.story.hero,companions:[]};this.game_=this.story.game;
    this.seed=this.opts.seed||Math.floor(Date.now()%100000);this.phase=this.story.record.chapter===1?'night':'day';
    this.quest={title:this.game_.quest.quest.name,music:S.Presentation.music(this.story,true)};
    this.enc=S.Combat.create(this.story,this.seed);this.encs=[this.enc.def];this.world.companions=this.enc.allies;
    this.buildTextures();X.UI.installBusts(this);
    this.env=S.Stage.paint(this,this.location,this.storyBackground,this.phase);
    this.buildBand();this.buildHero();
    this.hero.unit=X.Encounter.heroUnit(this.enc);this.hero.uid=this.hero.unit.uid;this.actors.set(this.hero.uid,this.hero);this.hero.refresh(true);this.spawnFoes();this.spawnCompanions();
    this.run.wave=this.story.record.encounter;
    this.hud=new X.Hud(this,{run:this.run,hero:this.story.hero,portraitKey:this.hero.faceKey,waveCount:this.game_.quest.quest.encounters.length,
      onSkill:id=>this.tapSkill(id),onArrow:()=>this.returnToStory('victory'),onPause:()=>this.togglePause()});
    this.hud.refresh();this.hud.setSkillStates(X.Encounter.skillStates(this.enc));
    const controls=[['Story',()=>this.returnToStory('leave')],['Pause',()=>this.togglePause()],['Sound',()=>{this.opts.muted=!this.opts.muted;try{localStorage.setItem('adventurer_expeditions_story_muted',this.opts.muted?'1':'0');}catch(_){}this.opts.muted?this.music?.pause():this.music?.play().catch(()=>{});this.game.sound.mute=this.opts.muted;if(this.opts.muted)this.stopBanter();}]];
    controls.forEach(([label,click],i)=>{const b=A.T.button(this,965+i*99,16,94,44,label,click,{size:15});for(const item of [b.g,b.txt,b.zone])item.setDepth(X.UI.DEPTH.hand+20);});
    this.game.sound.mute=!!this.opts.muted;X.UI.splitCameras(this);
    this.cooldownTicker=this.time.addEvent({delay:100,loop:true,callback:()=>{if(!this.ended&&!this.enc.st.over)this.hud.setSkillStates(X.Encounter.skillStates(this.enc));}});
    this.events.once('shutdown',()=>{this.ended=true;this.music?.pause();this.stopBanter();});
    this.startMusic();X.Painted.present(this,this.env,()=>this.fight(true));
  }
  spawnCompanions(){
    const units=this.enc.st.units.filter(u=>u.ch.expeditionStoryCompanion);
    const marks=this.companionMarks();
    units.forEach((u,i)=>{
      const id=u.ch.expeditionStoryCompanion,kit=S.Companions.kits[id],sheet=X.Painted.sheet(this,'companion_'+id);
      if(!sheet)throw Error('Companion art missing: '+id);
      const a=new X.Actor(this,{uid:u.uid,unit:u,side:'a',kind:'ally',sheet,height:kit.height,name:u.ch.name,...marks[i]});
      // Wide shields/staves must not clip against the left edge.
      const ext=this.idleExtents(a);
      a.root.x=a.home.x=Math.max(a.home.x,24-ext.left);
      a.syncPerspective();
      this.actors.set(u.uid,a);a.refresh(true);
    });
  }
  // A Retry restarts this scene, and shutdown paused the old track: resume it
  // instead of returning early, which left every retried fight silent (Hiro,
  // 2026-10-15: no music in fights from chapter two, where retries began).
  startMusic(){if(this.music){if(!this.opts.muted)this.music.play().catch(()=>{});return;}this.music=new Audio(S.Presentation.media('audio/music/'+this.quest.music+'.mp3'));this.music.loop=true;this.music.volume=.16;
    if(!this.opts.muted)this.music.play().catch(()=>{});}
  spawnFoes(){
    super.spawnFoes();
    this.foeSlots=[...this.actors.values()].filter(a=>a.side==='b').map(a=>({...a.home})).sort((a,b)=>a.x-b.x);
  }
  async reformFoes(){
    if(this.ended||!this.hero?.alive||this.hero.unit.chp<=0||!this.foeSlots)return;
    const alive=[...this.actors.values()].filter(a=>a.side==='b'&&a.alive&&!a._destroyed&&a.unit.chp>0)
      .sort((a,b)=>a.home.x-b.home.x);
    // Fill original rear slots; never add an offset repeatedly or shrink foes.
    const slots=this.foeSlots.slice(-alive.length);
    await Promise.all(alive.map(async(a,i)=>{
      const slot=slots[i];a.home.y=a.groundY=slot.y;
      const ext=this.idleExtents(a);
      a.home.x=Math.max(a.home.x,Math.min(slot.x,1252-ext.right));
      a.root.setDepth(105-2*(this.foeSlots.length-alive.length+i));
      if(Math.abs(a.root.x-a.home.x)>1||Math.abs(a.root.y-a.home.y)>1)await a.play('walk',{x:a.home.x,y:a.home.y,duration:340});
    }));
  }
  spaceFoes(foes){
    super.spaceFoes(foes);
  }
  // The first two fights the player actually fights hold for the lessons
  // (Counter, Finisher, God Aura on a boss); a bypassed fight, such as sparing
  // Nib, doesn't use one up. Retries of those fights keep them (Hiro, 2026-10-12).
  tutoring(){const won=Object.values(this.story.record.outcomes||{}).filter(v=>v==='combat').length;
    return won<2&&!this.run.tutorial.skipGuide;}
  stopBanter(){
    if(this.banterVoice){this.banterVoice.onended=null;this.banterVoice.onerror=null;this.banterVoice.pause();this.banterVoice.src='';this.banterVoice=null;}
    // Hud.banner owns its fade timer and destruction. Hide early without invalidating it.
    this.banterCaption?.setVisible(false);this.banterCaption=null;
  }
  storyBanter(){
    if(!S.Companions?.enabled||this.paused||this.ended||this.enc.st.over||this.enc.st.round<2)return;
    const beat=A.Campaign3.banter(this.story.game,this.enc.st,2);if(!beat)return;
    const text=beat.line.t.replace(/\[[^\]]*\]/g,'').replace(/\{target\}/g,'Hiro').trim();
    const name=A.DATA.CAMPAIGN_CHARS[beat.who].name;
    this.banterCaption=this.hud.banner(name+': '+text,3800).setFontSize(26).setWordWrapWidth(1050).setAlign('center');
    if(this.hudCam)this.cameras.main.ignore(this.banterCaption);
    const file=S.Presentation.voice({...beat,lines:[beat.line]},0);
    if(file&&!this.opts.muted){
      const voice=this.banterVoice=new Audio(S.Presentation.media(file));voice.volume=.9;
      voice.onended=()=>this.stopBanter();voice.onerror=()=>this.stopBanter();voice.play().catch(()=>this.stopBanter());
    }
  }
  togglePause(){this.paused=!this.paused;this.time.paused=this.paused;this.music&&(this.paused?this.music.pause():!this.opts.muted&&this.music.play().catch(()=>{}));
    if(this.banterVoice)this.paused?this.banterVoice.pause():!this.opts.muted&&this.banterVoice.play().catch(()=>this.stopBanter());}
  async victory(){
    this.stopBanter();
    X.UI.resetCamera(this);await Promise.all([...this.actors.values()].filter(a=>a.side==='a'&&a.alive).map(a=>a.play('victory')));if(this.ended)return;
    S.Combat.win(this.story,this.enc);this.hud.refresh();this.hud.showArrow();
    this.hud.banner('Fight won — continue your journey',1800);
    // Story checkpoint already advanced: clicking cannot award the fight twice.
    this.arrowArmed=true;
  }
  tapArrow(){if(!this.arrowArmed)return;this.arrowArmed=false;this.returnToStory('victory');}
  async defeat(){
    this.stopBanter();
    await X.EnemyFinishers.ensureDefeat(this);if(this.ended)return;
    if(!this.__enemyFinishPresented)await this.hero.play('kneel');X.UI.resetCamera(this);
    S.Combat.lose(this.story,this.enc);this.hud.banner('Defeated — your chapter progress is saved',2000);
    const button=A.T.button(this,475,310,330,62,'Retry — full health',()=>{S.retry(this.story);this.scene.restart({...this.opts,record:this.story.record});},{size:22});
    for(const item of [button.g,button.txt,button.zone]){item.setDepth(X.UI.DEPTH.hud+50);if(this.hudCam)this.cameras.main.ignore(item);}
  }
  returnToStory(outcome){if(this.ended)return;this.ended=true;X.UI.resetCamera(this);this.music?.pause();S.save(this.story);
    this.stopBanter();
    if(window.parent!==window)window.parent.postMessage({type:'expeditions-story-battle',outcome},location.origin);
    else location.href='docs/STORY_CAMPAIGN_PREVIEW.html';}
  endRun(){this.returnToStory('leave');}
}
X.StoryBattle=StoryBattle;
})();
