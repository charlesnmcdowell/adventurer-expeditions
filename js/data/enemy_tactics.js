// Explicit kits for mismatched enemies; every other type keeps its authored pool.
(function(){
'use strict';
const D=ADV.DATA,changes={
 bandit:{actives:['scouts_cut','smoke_bomb']},
 hedge_mage:{actives:['aimed_cantrip','frost_touch']},
 town_watch:{perks:['opportunist'],actives:['sunder','taunt']},
 plated_sentinel:{perks:['momentum'],actives:['mace_swing','shield_wall']},
 field_chaplain:{actives:['mend','guardian_ward','stanch']},
 pyre_justicar:{actives:['fire_bolt','guardian_ward']},
 sentinel_prime:{perks:['momentum'],actives:['shield_breaker','mace_swing','shield_wall','sunder']},
 hollow_owl:{actives:['night_screech','umbral_rake']}
};
for(const [id,patch]of Object.entries(changes)){const d=D.ENEMIES[id]||D.BOSSES[id];if(d)Object.assign(d,patch);}
const signatures={house_guard:'unseen_guard',bonded_courier:'silent_loosing',watch_investigator:'marked_for_the_knife',lamplit_witness:'poisoned_quarrel',candle_bearer:'stitch_and_run',rival_company_spear:'shield_breaker',contract_breaker:'scouts_cut',road_warden:'suppressing_volley',free_company_burner:'siege_flame',sanctioned_adept:'company_medic',unlicensed_warder:'aegis_protocol',struck_scholar:'chain_lightning',academy_proctor:'restorative_circle'};
for(const book of [D.ENEMIES,D.BOSSES,D.CAMPAIGN_ENEMIES])for(const [id,d]of Object.entries(book||{})){
 const kit=d.actives||d.pool||[];
 const usable=kit.filter(k=>{const s=D.SKILLS[k];return s&&s.kind==='active'&&s.target!=='postVictory'&&!s.passive;});
 const signature=signatures[id]&&kit.includes(signatures[id])?signatures[id]:usable[0]||'basic_attack';
 const style=/archer|gun|bow|shot|powder|signal|courier|warden/.test(id)?'ranged':/healer|physician|surgeon|medic|chaplain|matron|adept|proctor|candle/.test(id)?'support':/wolf|worg|raptor|panther|vulture|hound/.test(id)?'hunter':/guard|sentinel|golem|bannerman|crab|boar/.test(id)?'frontline':/poison|plague|venom|hag|leech|spider/.test(id)?'affliction':'signature';
 d.tactics={signature,style};
}
})();
