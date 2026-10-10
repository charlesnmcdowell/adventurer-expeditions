// Campaign battle reuses the Arcade director/actors/HUD; outcomes go to Story.
(function(){
'use strict';const A=ADV,X=A.Expedition,S=X.Story;
class StoryBattle extends X.Scene{
  constructor(){super();this.sys.settings.key='StoryBattle';}
  init(opts){this.opts=opts||{};this.story=S.open(this.opts.record||S.load());this.run=this.story.record.run;
    this.artIds=['hiro',...new Set(S.opponentIds(this.story).map(id=>S.bindings[id]?.actor).filter(Boolean))];}
  preload(){
    X.Painted.preload(this,this.artIds);X.UI.preloadBusts(this);X.DefeatFX.preload(this);
    const r=this.story.record,d=S.Presentation.data,id=d.routes[r.chapter][r.encounter];
    this.location=id;this.storyBackground='story_bg_'+id;
    this.load.image(this.storyBackground,S.Presentation.media(d.art.environments[id].file));
  }
  create(){
    this.__presentationReady=false;if(!X.Painted.require(this,this.artIds))return;
    this.actors=new Map();this.paused=false;this.time.paused=false;this.ended=false;this.__enemyFinishPresented=false;
    this.world={game:this.story.game,hero:this.story.hero,companions:[]};this.game_=this.story.game;
    this.seed=this.opts.seed||Math.floor(Date.now()%100000);this.phase=this.story.record.chapter===1?'night':'day';
    this.quest={title:this.game_.quest.quest.name,music:S.Presentation.music(this.story,true)};
    this.enc=S.Combat.create(this.story,this.seed);this.encs=[this.enc.def];
    this.buildTextures();X.UI.installBusts(this);
    this.env=S.Stage.paint(this,this.location,this.storyBackground,this.phase);
    this.buildBand();this.buildHero();
    this.hero.unit=X.Encounter.heroUnit(this.enc);this.hero.uid=this.hero.unit.uid;this.actors.set(this.hero.uid,this.hero);this.hero.refresh(true);this.spawnFoes();
    this.run.wave=this.story.record.encounter;
    this.hud=new X.Hud(this,{run:this.run,hero:this.story.hero,portraitKey:this.hero.faceKey,waveCount:this.game_.quest.quest.encounters.length,
      onSkill:id=>this.tapSkill(id),onArrow:()=>this.returnToStory('victory'),onPause:()=>this.togglePause()});
    this.hud.refresh();this.hud.setSkillStates(X.Encounter.skillStates(this.enc));
    const controls=[['Story',()=>this.returnToStory('leave')],['Pause',()=>this.togglePause()],['Sound',()=>{this.opts.muted=!this.opts.muted;this.opts.muted?this.music?.pause():this.music?.play().catch(()=>{});this.game.sound.mute=this.opts.muted;}]];
    controls.forEach(([label,click],i)=>{const b=A.T.button(this,965+i*99,16,94,44,label,click,{size:15});for(const item of [b.g,b.txt,b.zone])item.setDepth(X.UI.DEPTH.hand+20);});
    this.game.sound.mute=!!this.opts.muted;X.UI.splitCameras(this);
    this.cooldownTicker=this.time.addEvent({delay:100,loop:true,callback:()=>{if(!this.ended&&!this.enc.st.over)this.hud.setSkillStates(X.Encounter.skillStates(this.enc));}});
    this.events.once('shutdown',()=>{this.ended=true;this.music?.pause();});
    this.startMusic();X.Painted.present(this,this.env,()=>this.fight(true));
  }
  startMusic(){if(this.music)return;this.music=new Audio(S.Presentation.media('audio/music/'+this.quest.music+'.mp3'));this.music.loop=true;this.music.volume=.16;
    if(!this.opts.muted)this.music.play().catch(()=>{});}
  tutoring(){return this.enc.storyTutorial&&!this.run.tutorial.skipGuide;}
  togglePause(){this.paused=!this.paused;this.time.paused=this.paused;this.music&&(this.paused?this.music.pause():!this.opts.muted&&this.music.play().catch(()=>{}));}
  async victory(){
    X.UI.resetCamera(this);await this.hero.play('victory');if(this.ended)return;
    S.Combat.win(this.story,this.enc);this.hud.refresh();this.hud.showArrow();
    this.hud.banner('Fight won — continue your journey',1800);
    // Story checkpoint already advanced: clicking cannot award the fight twice.
    this.arrowArmed=true;
  }
  tapArrow(){if(!this.arrowArmed)return;this.arrowArmed=false;this.returnToStory('victory');}
  async defeat(){
    await X.EnemyFinishers.ensureDefeat(this);if(this.ended)return;
    if(!this.__enemyFinishPresented)await this.hero.play('kneel');X.UI.resetCamera(this);
    S.Combat.lose(this.story,this.enc);this.hud.banner('Defeated — your chapter progress is saved',2000);
    const button=A.T.button(this,475,310,330,62,'Retry this fight',()=>{S.retry(this.story);this.scene.restart({...this.opts,record:this.story.record});},{size:22});
    for(const item of [button.g,button.txt,button.zone]){item.setDepth(X.UI.DEPTH.hud+50);if(this.hudCam)this.cameras.main.ignore(item);}
  }
  returnToStory(outcome){if(this.ended)return;this.ended=true;X.UI.resetCamera(this);this.music?.pause();S.save(this.story);
    if(window.parent!==window)window.parent.postMessage({type:'expeditions-story-battle',outcome},location.origin);
    else location.href='STORY_CAMPAIGN_PREVIEW.html';}
  endRun(){this.returnToStory('leave');}
}
X.StoryBattle=StoryBattle;
})();
