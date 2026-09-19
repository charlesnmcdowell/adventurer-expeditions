// Authored visual directions for every active skill. Gameplay definitions remain authoritative.
(function(){
'use strict';
const A=ADV,entries={};
function group(family,motion,ids){for(const id of ids.split(/\s+/).filter(Boolean)){if(entries[id])throw Error('Duplicate skill art: '+id);entries[id]={family,motion};}}
group('steel','cut','basic_attack katana_slash scouts_cut veterans_cut kings_tax flanking_pay');
group('steel','sweep','cleave line_advance disciplined_advance');
group('steel','draw','iai_draw finisher');
group('steel','rise','rising_cut');
group('steel','flurry','dual_swords butchers_tempo executioners_rhythm cutlass_work');
group('steel','thrust','saber_thrust throat_work');
group('steel','hammer','mace_swing sunder shield_breaker paid_in_full');
group('shadow','ambush','backstab vanishing_strike silenced_step ward_thief');
group('poison','thrust','venom_fang');
group('arcane','cut','runic_strike bell_silence');
group('shadow','smoke','smoke_bomb ghoststep smoke_step');
group('shadow','guard','cloak_of_shadows unseen_guard');
group('blood','guard','blood_price');
group('steel','arrow','aimed_shot silent_loosing killing_angle ranged_discipline paid_shot measured_shot');
group('steel','volley','suppressing_volley longbow_volley');
group('poison','arrow','poisoned_quarrel');
group('steel','stars','shuriken_fan');
group('steel','chain','kunai_line chain_and_weight boarding_hook chain_and_bar');
group('steel','trap','snare');
group('fire','bolt','fire_bolt');
group('fire','lash','ember_lash');
group('fire','siege','siege_flame');
group('fire','rain','ashfall');
group('fire','wave','fire_ship');
group('fire','flare','flare');
group('fire','guard','fire_barrier ash_ward');
group('ice','lance','frost_touch');
group('ice','grasp','rime_grasp');
group('lightning','bolt','spark');
group('lightning','chain','chain_lightning antler_arc');
group('lightning','descent','sky_crash');
group('prism','bolt','prismatic_bolt');
group('arcane','bolt','aimed_cantrip focal_shot');
group('arcane','spiral','arcane_cascade');
group('arcane','field','ranging_ward');
group('arcane','guard','countersign warding_stance absorption_field aegis_protocol elemental_bond');
group('arcane','dispel','dispel');
group('holy','judgment','true_rest gods_edict cleanse');
group('holy','crown','god_aura');
group('holy','heal','mend triage stanch field_honour');
group('holy','stitch','stitch_and_run field_suture surgeons_saw');
group('holy','groupHeal','company_medic restorative_circle breath_of_the_bell sick_bay');
group('holy','bloom','regenerate');
group('holy','raise','raise last_breath');
group('nature','raise','grove_raise');
group('holy','guard','guardian_ward purge_ward vital_anchor');
group('poison','paper','paper_charm');
group('nature','thornGuard','thorn_skin');
group('nature','grove','growth_field quartermasters_root');
group('blood','drain','blood_pact');
group('blood','groupHeal','clan_blood');
group('poison','curse','wither_touch blood_lotus bog_curse');
group('poison','spray','poison_spray');
group('poison','drain','venom_draw');
group('shadow','curse','whisper_of_ending');
group('shadow','lance','shadow_lance');
group('shadow','mark','marked_for_the_knife spiders_patience');
group('gold','mark','contract_mark');
group('gold','command','taunt signal_flags volley_fire');
group('gold','guard','shield_wall hold_the_road bulwark_formation crossing_guard stone_stance iron_fan_guard boarding_plate close_order');
group('steel','counter','counter_attack riposte_line');
group('gold','bond','contract_bound articles_of_war');
group('gold','ration','rum_ration');
group('gold','eye','crow_sight reading_the_field reading_the_tally chart_the_water');
group('gold','roar','kiai');
group('gold','lastStand','stand_fast defiant_stand');
group('shadow','lastStand','shadow_rise');
group('gold','conscript','conscript');
group('necromancy','summon','necromancy');
group('nature','transform','beast_shape serpent_form warhound_form fox_form bear_stance');
group('arcane','transform','spellblade_form');
group('lightning','transform','storm_shape');
group('gold','transform','sea_dog_form marine_form');
group('powder','bullet','flintlock_shot');
group('powder','scatter','grapeshot');
group('powder','cannon','ranging_cannon');
group('powder','chainshot','chain_shot');
group('powder','keg','powder_keg');
group('blood','bite','pack_snap pack_frenzy');
group('shadow','claw','umbral_rake');
group('blood','claw','raptor_shred rending_talons hamstring_pounce sky_pluck');
group('blood','fists','red_fury');
group('earth','gore','tusk_gore antler_gore');
group('poison','gore','mire_tusk');
group('poison','sting','sand_sting');
group('poison','bite','tri_bite');
group('poison','coil','coil_crush');
group('nature','lash','thorn_lash');
group('ice','storm','coven_rime');
group('ice','breath','rime_breath');
group('ice','web','glass_web');
group('ice','bite','frost_bite');
group('earth','roar','war_bellow');
group('earth','boulder','boulder_smash');
group('earth','fault','fault_line');
group('earth','shell','carapace_burst');
group('nature','tree','treefall');
group('earth','pincer','pincer_lock');
group('earth','gaze','stone_gaze');
group('shadow','roar','night_screech soul_bay');
group('poison','breath','rot_wing');
group('poison','tongue','tongue_lash');
group('fire','spit','magma_spit');
group('fire','gore','cinder_charge');

const PALETTES={
 steel:[0x121e36,0x556784,0xafdcf2,0xf4fbff],fire:[0x381427,0xbc3b32,0xff9938,0xfff3ae],ice:[0x12233e,0x377ea7,0x70ddf5,0xf3ffff],
 lightning:[0x281b49,0x7754c4,0xebcf5f,0xffffd3],arcane:[0x1d2045,0x5451b1,0x8aa7ff,0xf1dcff],prism:[0x222144,0x9865c4,0x6ae3dc,0xffe3f4],
 nature:[0x112d2a,0x30664c,0x9ad268,0xe8f3a8],poison:[0x273022,0x578537,0xbbdc54,0xf3f7a0],blood:[0x321628,0x852a47,0xdb5962,0xffc0a5],
 shadow:[0x171b32,0x51406e,0x9b83d4,0xe5cafa],holy:[0x302838,0xaf8752,0xf6d987,0xffffe4],gold:[0x1d2940,0x87643b,0xe7bf68,0xffedbc],
 necromancy:[0x172b32,0x3c6175,0x8ae0c3,0xe8fbd2],powder:[0x262536,0x886252,0xe5aa60,0xffe1a0],earth:[0x222a34,0x636d64,0xb8ad8b,0xebe1bc]
};
// Tier names denote different choreography as well as stronger effects.
const TIER_MOTIONS={
 fire_bolt:{advanced:'siege'},frost_touch:{basic:'grasp',intermediate:'chain',advanced:'storm'},
 spark:{intermediate:'chain',advanced:'descent'},aimed_shot:{advanced:'volley'},
 cleave:{advanced:'whirlwind'},snare:{intermediate:'web',advanced:'rootField'},
 magma_spit:{intermediate:'spray',advanced:'wave'},pack_snap:{intermediate:'claw'},
 umbral_rake:{advanced:'bite'},glass_web:{advanced:'iceTomb'}
};
function hash(s){let n=2166136261;for(const ch of s)n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
function passive(d){
 if(d.id==='charm')return{family:'blood',motion:'heart'};
 if(d.id==='persuade'||d.id==='quiet_word')return{family:'holy',motion:'speech'};
 if(d.id==='intimidate')return{family:'shadow',motion:'gaze'};
 if(/rich|pay|commission|corpse|muster|trade|papers/.test(d.id))return{family:'gold',motion:'coin'};
 if(/sight|sense|watch|look|room|invis|terms/.test(d.id))return{family:'arcane',motion:'eye'};
 if(/blood|sanguine|opportunist/.test(d.id))return{family:'blood',motion:'drain'};
 if(/ice/.test(d.id))return{family:'ice',motion:'guard'};
 if(/lightning/.test(d.id))return{family:'lightning',motion:'bolt'};
 if(/pyro/.test(d.id))return{family:'fire',motion:'bolt'};
 if(/wild|beast|wolf/.test(d.id))return{family:'nature',motion:'transform'};
 if(/devoted|demigod/.test(d.id))return{family:'holy',motion:'heal'};
 if(/bulwark|discipline|form|clan/.test(d.id))return{family:'gold',motion:'guard'};
 if(/marksman|sniper|broadside/.test(d.id))return{family:'steel',motion:'arrow'};
 if(/sneak|shadow/.test(d.id))return{family:'shadow',motion:'smoke'};
 if(/momentum|sword/.test(d.id))return{family:'steel',motion:'cut'};
 if(/focus|prodigy|years/.test(d.id))return{family:'arcane',motion:'spiral'};
 return{family:'gold',motion:'crown'};
}
function describe(id,tier,ctx){
 const d=A.DATA.SKILLS[id];if(!d)return null;
 const t=tier||'basic',s=Object.assign({},d,d.tiers?.[t]||d.tiers?.basic),base=entries[id]||(d.kind==='perk'?passive(d):null);
 if(!base)return null;
 const p=Object.assign({id,tier:t,rank:t==='advanced'?2:t==='intermediate'?1:0,seed:hash(id),passive:d.kind==='perk',definition:s},base);
 if(TIER_MOTIONS[id]?.[t])p.motion=TIER_MOTIONS[id][t];
 if(id==='snare'&&t==='advanced')p.family='nature';
 if(id==='fox_form')p.family='arcane';
 if(id==='serpent_form')p.family='poison';
 if(id==='basic_attack'&&ctx?.src?.u){
  const u=ctx.src.u,form=u.form||u.ch?.portraitId||u.ch?.enemyTypeId||'';
  if(/serpent|snake|wolf|hound/.test(form)){p.motion='bite';p.family='blood';}
  else if(/panther|bear|raptor|harpy|fox/.test(form)){p.motion='claw';p.family='blood';}
  else if(/boar|elk|stag|minotaur/.test(form)){p.motion='gore';p.family='earth';}
 }
 if(d.heal&&(ctx?.offensive||ctx?.src?.u&&ctx?.tgt?.u&&ctx.src.u.side!==ctx.tgt.u.side)){p.family=id==='triage'?'blood':id==='regenerate'?'poison':'necromancy';p.motion=id==='regenerate'?'curse':'drain';p.offensive=true;}
 p.palette=PALETTES[p.family];p.scale=1+p.rank*.23;
 return p;
}
A.SkillArtCatalog={entries,PALETTES,TIER_MOTIONS,describe,hash,missing:()=>Object.values(A.DATA.SKILLS).filter(d=>d.kind!=='perk'&&!entries[d.id]).map(d=>d.id)};
})();
