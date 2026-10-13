// Original scene paintings and authored fire/water/cloth motion behind the
// edition's dialogue UI. Separate from the combat canvas and its input.
(function(){
'use strict';const A=ADV,S=A.Expedition.Story;
S.Backdrop=function(parent,onReady){
  let wanted={kind:'environments',id:'lanternhold',phase:'night'},scene,game,paused=false;
  const identity=s=>s.kind+':'+s.id+':'+(s.phase||'day')+':'+(s.visit||0);
  class Backdrop extends Phaser.Scene{
    constructor(){super('StoryBackdrop');}
    init(spec){this.spec=spec?.kind?spec:wanted;this.game_={world:{seed:1,questClock:0}};this.paused=false;scene=this;}
    preload(){if(this.spec.kind==='inn'){A.Expedition.InnArt.preload(this);return;}
      const art=S.Presentation.data.art[this.spec.kind][this.spec.id];this.artKey='story_scene_'+this.spec.kind+'_'+this.spec.id;
      if(!this.textures.exists(this.artKey))this.load.image(this.artKey,S.Presentation.media(art.file));}
    create(){
      const {kind,id,phase}=this.spec;
      if(kind==='inn'){this.art=A.Expedition.InnArt.paint(this,this.spec.run);this.events.once('shutdown',()=>this.art?.destroy());}
      else if(kind==='environments')this.art=S.Stage.paint(this,id,this.artKey,phase||'day');
      else{
        const source=this.textures.get(this.artKey).getSourceImage(),root=this.add.container(0,0);
        root.background=this.add.image(640,380,this.artKey).setScale(Math.max(1280/source.width,760/source.height));root.add(root.background);
        A.GateAmbience.attach(this,root,root.background,A.GateAmbience.stills[id]);this.art=root;
        this.events.once('shutdown',()=>root.destroy(true));
      }
      this.events.once('shutdown',()=>{this.art=null;});
      onReady?.(this.spec);if(paused)game.loop.sleep();
      if(identity(this.spec)!==identity(wanted))queueMicrotask(()=>this.scene.restart(wanted));
    }
  }
  game=new Phaser.Game({type:Phaser.AUTO,width:1280,height:760,parent,
    backgroundColor:'#090d18',audio:{noAudio:true},input:{keyboard:false,mouse:false,touch:false},
    scale:{mode:Phaser.Scale.ENVELOP,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Backdrop]});
  const api={game,
    show(spec){if(!spec)return;wanted={...spec};
      if(scene?.sys.isActive()&&identity(scene.spec)!==identity(wanted))scene.scene.restart(wanted);},
    pause(value){paused=!!value;if(paused)game.loop.sleep();else game.loop.wake();},
    state(){return scene?.art?{...scene.spec,layers:scene.art.layerOrder||['painting','authored-ambience']}:null;},
    destroy(){game.destroy(true);}
  };return api;
};
})();
