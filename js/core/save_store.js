// Atomic snapshots. A slot is visible only when the small commit record names
// its exact revision. A failed slot/commit write leaves the current save intact.
(function () {
'use strict';
const COMMIT = 'adv:commit', SLOTS = ['adv:slot:0', 'adv:slot:1'];
const LEGACY = ['adv:world','adv:characters','adv:edges','adv:vaults','adv:meta','adv:backup'];
const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
const clone = v => JSON.parse(JSON.stringify(v));
function valid(p, version) {
  if (!object(p) || !object(p.meta) || p.meta.artVersion !== version) return false;
  if (p.world === null) return true; // journal carried between lives
  if (!object(p.world) || p.world.artVersion !== version || !Number.isFinite(p.world.seed) ||
      !Number.isFinite(p.world.questClock) || !Array.isArray(p.characters) ||
      !Array.isArray(p.edges) || !Array.isArray(p.vaults)) return false;
  if (!p.characters.every(c => object(c) && typeof c.id === 'string' && object(c.stats) && object(c.inventory) &&
      ['hp','atk','def','spd'].every(k=>Number.isFinite(c.stats[k])) && Number.isFinite(c.inventory.gold) &&
      Array.isArray(c.perks) && Array.isArray(c.actives))) return false;
  if (!p.characters.some(c => c.id === p.world.playerId)) return false;
  return ['journal','skillLevels','promptsSeen'].every(k=>p.meta[k]===undefined||object(p.meta[k])) &&
    p.vaults.every(v => object(v) && typeof v.id === 'string' && Number.isFinite(v.gold)) &&
    (!p.world.parties || Array.isArray(p.world.parties));
}
function create(storage, version) {
  let lastError = null;
  function raw(key) { try { return storage.getItem(key); } catch (e) { lastError=e; return null; } }
  function get(key) { try { return JSON.parse(raw(key)); } catch (_) { return null; } }
  function entry(ref) {
    if (!ref || ![0,1].includes(ref.slot) || !Number.isSafeInteger(ref.revision)) return null;
    const e=get(SLOTS[ref.slot]);
    return e && e.revision===ref.revision && valid(e.payload,version) &&
      e.checksum===ADV.hashStr(JSON.stringify(e.payload)) ? e : null;
  }
  function committed() {
    const head=get(COMMIT);
    if (!head || head.format!==1) return null;
    return entry(head.current) || entry(head.previous);
  }
  function legacy() {
    const world=get('adv:world'),meta=get('adv:meta');
    const p={world,meta,characters:get('adv:characters'),edges:get('adv:edges')||[],vaults:get('adv:vaults')||[]};
    if (valid(p,version)) return p;
    const b=get('adv:backup');
    if(b && b.v===version && valid(b,version)) return b;
    if(!world && meta?.artVersion===version)return {world:null,meta};
    return null;
  }
  function read() {
    lastError=null;
    const e=committed();
    // Never fall back to a pre-migration life if a committed journal is corrupt.
    return e ? clone(e.payload) : raw(COMMIT) ? null : legacy();
  }
  function write(payload) {
    try {
      const p=clone(payload);
      if(!valid(p,version))return {ok:false,error:'invalid-save'};
      const old=get(COMMIT),current=entry(old?.current)?old.current:entry(old?.previous)?old.previous:null;
      const ref={slot:current?1-current.slot:0,revision:(current?.revision||0)+1};
      const e={revision:ref.revision,payload:p,checksum:ADV.hashStr(JSON.stringify(p))};
      const serialized=JSON.stringify(e);
      storage.setItem(SLOTS[ref.slot],serialized);
      if(storage.getItem(SLOTS[ref.slot])!==serialized)throw new Error('Snapshot verification failed');
      // localStorage.setItem commits one complete string atomically.
      storage.setItem(COMMIT,JSON.stringify({format:1,current:ref,previous:current}));
      // Legacy input remains untouched until a snapshot has committed.
      for(const key of LEGACY)try{storage.removeItem(key);}catch(_){}
      return {ok:true,revision:ref.revision};
    } catch(e) {lastError=e;return {ok:false,error:'storage-unavailable',detail:e.message};}
  }
  return {
    read,write,valid:p=>valid(p,version),
    restore() {
      const head=get(COMMIT),previous=entry(head?.previous),current=entry(head?.current);
      const p=previous?.payload || (!current && legacy());
      return p ? write(p) : {ok:false,error:'no-backup'};
    },
    compatible() {
      if(read())return true;
      if(raw(COMMIT))return false; // corruption is not a request to wipe
      const w=get('adv:world'),m=get('adv:meta');
      if(w?.artVersion===version || m?.artVersion===version)return false;
      // Preserve the original, approved art-version migration rule only.
      for(const key of LEGACY)try{storage.removeItem(key);}catch(_){}
      return false;
    },
    reset() {
      try { for(const key of [COMMIT,...SLOTS,...LEGACY])storage.removeItem(key);return {ok:true}; }
      catch(e){return {ok:false,error:'storage-unavailable',detail:e.message};}
    },
    diagnostics() {return {error:lastError?.message||null,hasJournal:!!raw(COMMIT)};},
    rawExport() {return JSON.stringify(Object.fromEntries([COMMIT,...SLOTS,...LEGACY].map(k=>[k,raw(k)])));}
  };
}
ADV.SaveStore={create,valid,keys:{commit:COMMIT,slots:SLOTS.slice()}};
})();
