// One facade dispatches campaign behavior; expansions register providers rather
// than capturing another campaign's methods. Presentation can decorate results.
(function(){
'use strict';
const providers=new Map(),decorators=new Map();
const R={};
R.register=function(id,api){
 if(providers.has(id))throw new Error('Duplicate campaign provider: '+id);
 for(const method of ['spawnEncounter','alliesFor','departureBeats','banter','takeBeats','lines'])if(typeof api[method]!=='function')throw new Error(id+' missing '+method);
 providers.set(id,{...api,id});
};
R.forQuest=q=>providers.get(q?.campaign3?'gate':q?.campaign2?'factions':'original');
R.decorate=function(method,fn){const list=decorators.get(method)||[];list.push(fn);decorators.set(method,list);};
R.hook=function(game,name,result,context){const fn=R.forQuest(game.quest?.quest)?.[name];return fn?fn(game,result,context):result;};
R.install=function(facade){
 const call=(provider,method,args)=>{
  let result=provider[method](...args);
  for(const decorate of decorators.get(method)||[])result=decorate(result,...args);
  return result;
 };
 for(const method of ['spawnEncounter','alliesFor','departureBeats','onCampaignQuestDone'])facade[method]=(game,q,...rest)=>call(R.forQuest(q),method,[game,q,...rest]);
 facade.banter=(game,...args)=>call(R.forQuest(game.quest?.quest),'banter',[game,...args]);
 facade.takeBeats=game=>['original','factions','gate'].flatMap(id=>providers.get(id).takeBeats(game));
 facade.onContractComplete=(...args)=>{for(const id of ['original','factions'])providers.get(id).onContractComplete(...args);};
 for(const method of ['rivalDeathSequence','finalOpener','afterBossBeats'])facade[method]=(game,fid)=>{
  const p=game.quest?.quest?.campaign3?providers.get('gate'):fid?providers.get('factions'):providers.get('original');
  return p[method](game,fid);
 };
 facade.lines=(fid,...args)=>{
  const p=[...providers.values()].find(p=>p.acceptsFaction?.(fid))||providers.get('original');
  return p.lines(fid,...args);
 };
};
R.ids=()=>[...providers.keys()];
ADV.CampaignRoutes=R;
})();
