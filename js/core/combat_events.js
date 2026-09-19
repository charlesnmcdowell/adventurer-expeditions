// Events subsystem. Dependencies are supplied by the combat facade.
(function(){
'use strict';
ADV.CombatModules=ADV.CombatModules||{};
ADV.CombatModules.events=function({}){
function ev(st, e) { st.events.push(e); return e; }


return {ev};
};
})();
