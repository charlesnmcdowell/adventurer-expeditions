// Authored landmarks use the 627px source-atlas cell coordinate system.
// Named heads are deliberately absent from the population/creation library.
(function(){
'use strict';
const H=(sheet,frame,nx,ny,chin,extra={})=>Object.assign({sheet,frame,nx,ny,chin,eyeUp:68,mouthDown:65,spread:61},extra);
const group=(s,rows)=>rows.map((r,i)=>H(s,i,...r));
const heads={
 f:[...group('heads_f',[[325,400,509],[313,395,512],[323,382,502],[320,386,503]]),
 H('heads_extra',0,319,326,442),H('heads_extra',1,318,326,440),
 ...group('heads_f_styles1',[[375,355,461],[256,389,505],[368,323,426],[267,314,410]]),
 ...group('heads_f_styles2',[[370,392,508],[321,395,512],[360,365,486],[322,365,485]])],
 m:[...group('heads_m',[[326,408,539],[291,408,540,{mouthDown:54}],[327,365,502],[292,374,506]]),
 H('heads_extra',2,314,332,472),
 ...group('heads_m_styles1',[[325,366,528],[330,368,523],[328,379,524,{mouthDown:58}],[333,385,528]]),
 ...group('heads_m_styles2',[[330,357,477,{mouthDown:55}],[297,389,512],[338,366,517,{mouthDown:66}],[310,379,528,{mouthDown:57}]])]
};
const named={};
function cast(sheet,rows){rows.forEach(([key,set,nx,ny,chin,eyeType,mouthType,iris,lipColor,extra],frame)=>{
 named[key]=Object.assign({key,set,head:H('heads_named_'+sheet,frame,nx,ny,chin,extra),eyeType,mouthType,iris,lipColor,build:frame%3,mark:0,
 eyeWidth:34+frame*2+(Object.keys(named).length%3),eyeHeight:15+Object.keys(named).length%7,mouthScale:.9+Object.keys(named).length*.012},extra||{});
});}
cast('maw',[
 ['wren','street',317,383,520,4,3,'#956b38','#825452',{eyeUp:76}],
 ['kite','assassins_gear',275,374,510,3,4,'#9b873c','#795651'],
 ['vane','duelist',327,369,530,2,4,'#72908c','#795651',{mouthDown:67}],
 ['arden','hunter',243,391,518,3,2,'#8d6143','#99412e',{browsCovered:true}],
]);
cast('antler',[
 ['holt','warrior',361,382,518,3,3,'#9c733f','#aa7476',{browsCovered:true}],
 ['roscarrow','mercenarys_gear',296,369,517,2,3,'#596850','#825452',{browsCovered:true}],
 ['crane','oath',346,403,540,4,4,'#67848e','#986d63',{browsCovered:true}],
 ['holloway','warrior',300,409,549,2,4,'#9a7374','#795651',{browsCovered:true}],
]);
cast('academy',[
 ['lirien','adept',322,391,506,0,2,'#779dcc','#813f68'],
 ['vaunt','mage',295,365,487,2,2,'#ad80c5','#574553'],
 ['venn','battle_mages_gear',345,355,482,3,1,'#b8a667','#813f68'],
 ['quiet','shadowweave',307,350,478,2,4,'#a3bdc3','#574553',{eyeUp:90,mouthDown:61}],
]);
cast('bell',[
 ['obaasan','chantry',346,397,515,4,4,'#7b6a57','#986d63',{browsCovered:true,eyeHeight:12}],
 ['suzume','shinobi_gear',251,413,522,3,2,'#926f46','#b84e64',{browsCovered:true}],
 ['kaede','shadowweave',352,371,484,2,4,'#827490','#574553',{browsCovered:true}],
 ['jiro','shinobi_gear',281,375,510,2,4,'#c5d4cc','#586966',{cloudy:true,browsCovered:true,ragged:true,eyeUp:73}],
]);
cast('green',[
 ['takeda','ronin',315,397,535,2,3,'#696741','#825452',{browsCovered:true,mouthDown:59}],
 ['ayame','green_eyed_armour',261,427,548,0,2,'#628c64','#aa7476'],
 ['isamu','green_eyed_armour',310,402,540,2,4,'#95ad79','#825452',{browsCovered:true}],
 ['kira','ronin',277,386,516,3,2,'#92738e','#813f68',{browsCovered:true}],
]);
cast('tally',[
 ['hallow','privateers_kit',324,320,532,4,3,'#b39054','#795651',{eyeUp:80,mouthDown:90}],
 ['beau','privateers_kit',319,361,506,0,2,'#8496ad','#986d63',{mouthDown:63}],
 ['saintcloud','privateers_kit',329,340,494,3,1,'#b89a57','#99412e'],
 ['vanekessler','kings_uniform',320,363,535,2,4,'#708197','#986d63',{eyeUp:78,mouthDown:75}],
]);
cast('navy',[
 ['crell','kings_uniform',347,315,509,2,3,'#848e9e','#825452',{eyeUp:86,mouthDown:86}],
 ['fane','kings_uniform',286,385,511,0,4,'#679c9e','#aa7476'],
 ['ash','privateers_kit',347,331,512,3,3,'#a780b1','#825452',{eyeUp:82,mouthDown:72}],
 ['hiro','ronin',314,352,503,2,4,'#8b663b','#795651'],
]);
cast('gods',[
 ['pale_mother','healer',328,356,461,4,4,'#bdc6d5','#9b818a',{cloudy:true}],
 ['drowned_king','oath',301,358,532,2,3,'#80bbb9','#567774',{cloudy:true,mouthDown:67}],
 ['first_bloom','greenward',330,309,458,1,1,'#a5ba63','#b84e64'],
]);
// Gate principals have reserved heads, including Korvath's Sarn disguise.
cast('gate1',[["wren_ward","street",326,402,535,4,3,"#968146","#ae5d80",{"mouthScale":0.87}],["dorran","wardens_gear",292,400,544,3,4,"#6e7952","#986d63",{"mouthScale":0.915}],["selene","greenward",321,377,517,2,4,"#7c9c57","#825452",{"mouthScale":0.96}],["vess","shadowweave",293,381,531,1,3,"#9f86bf","#845f70",{"mouthScale":1.005}]]);
cast('gate2',[["fennick","hunter",318,357,530,2,4,"#956a37","#825452",{"mouthScale":1.05}],["cassian","oath",301,361,523,0,4,"#7998ad","#aa7476",{"mouthScale":0.87}],["ithrel","ranger",314,349,491,3,4,"#789394","#986d63",{"mouthScale":0.915}],["bramm","wildhide",295,295,522,4,1,"#71947c","#986d63",{"mouthScale":0.96,"eyeUp":82,"mouthDown":125,"bodySheet":"wardrobe_gate","bodyFrame":3,"bodyWidth":1110,"companion":"findik_tiger"}]]);
cast('gate3',[["ysolde","mage",324,398,520,2,4,"#ba9e58","#813f68",{"mouthScale":1.005,"clothColor":"#533660"}],["aurelius","mage",311,382,535,3,3,"#a67938","#795651",{"mouthScale":1.05,"mouthDown":52,"clothColor":"#782c36"}],["ilvara","shadowweave",333,363,506,3,2,"#bc718f","#813f68",{"mouthScale":0.87,"clothColor":"#302337"}],["faelen","ranger",283,384,510,0,1,"#8d9d5e","#986d63",{"mouthScale":0.915}]]);
cast('gate4',[["nettle","wildhide",308,346,477,2,4,"#c49f49","#795651",{"mouthScale":0.96,"browsCovered":true}],["durnik","warrior",310,295,490,3,3,"#9d854e","#825452",{"mouthScale":1.005,"mouthDown":72,"beardFront":true,"bodyWidth":1110}],["amara","duelist",308,380,516,3,4,"#a88a49","#99412e",{"mouthScale":1.05,"browsCovered":true}],["aldric","adept",301,373,514,4,3,"#709995","#986d63",{"mouthScale":0.87,"eyeUp":84,"mouthDown":63}]]);
cast('gate5',[["torvald","adept",303,287,465,4,3,"#809bb5","#986d63",{"mouthScale":0.915,"eyeUp":83,"mouthDown":72,"browsCovered":true,"beardFront":true}],["tollan","plain",296,313,500,1,4,"#8a783f","#986d63",{"mouthScale":0.96,"browsCovered":true,"mouthDown":79}],["halloran","mercenarys_gear",316,313,490,2,4,"#8a7551","#825452",{"mouthScale":1.005,"eyeUp":84,"mouthDown":80}],["halvard","kings_uniform",306,363,524,3,4,"#688594","#986d63",{"mouthScale":1.05,"eyeUp":89,"mouthDown":70}]]);
cast('gate6',[["orlan","kings_uniform",317,321,524,4,1,"#8d784f","#986d63",{"mouthScale":0.87,"mouthDown":102}],["mira","mage",310,396,535,3,2,"#a88149","#813f68",{"mouthScale":0.915,"clothColor":"#67365f"}],["ambrose","healer",317,341,524,4,3,"#8a9a88","#986d63",{"mouthScale":0.96,"eyeUp":84,"mouthDown":78}],["hadrian","chantry",313,369,513,2,4,"#6f8492","#795651",{"mouthScale":1.005,"eyeUp":84}]]);
cast('gate7',[["cael","hunter",334,343,497,2,3,"#7b8a65","#825452",{"mouthScale":1.05,"eyeUp":84,"mouthDown":65}],["fen","duelist",318,343,500,3,2,"#b09058","#795651",{"mouthScale":0.87,"eyeUp":79,"mouthDown":65}],["lysandra","mage",335,340,467,3,1,"#88a39b","#b84e64",{"mouthScale":0.915,"clothColor":"#733b53"}],["ostwin","adept",319,357,515,4,4,"#8194a2","#986d63",{"mouthScale":0.96,"eyeUp":100,"mouthDown":72}]]);
cast('gate8',[["sarn","plain",322,335,472,3,4,"#839aa4","#986d63",{"mouthScale":1.005}],["korvath","plate",301,332,477,3,4,"#839aa4","#986d63",{"mouthScale":1.05,"bodySheet":"wardrobe_gate","bodyFrame":2,"bodyWidth":1120}],["morwin","mage",309,371,517,1,3,"#b49648","#825452",{"mouthScale":0.87,"mouthDown":67,"clothColor":"#6b2d39"}],["lessa","street",281,383,517,2,1,"#96855a","#99412e",{"mouthScale":0.915}]]);
cast('gate9',[["verlan","duelist",308,362,533,1,4,"#8c775b","#aa7476",{"mouthScale":0.96,"mouthDown":83}],["grukhar","chantry",312,335,536,2,4,"#b39a51","#65644f",{"mouthScale":0.78,"eyeUp":84,"mouthDown":102}],["gorruk","mercenarys_gear",302,329,536,2,3,"#af9b46","#686c4f",{"mouthScale":1.05,"eyeUp":82,"mouthDown":105,"bodyWidth":1120}],["thornwise","wildhide",312,325,512,3,4,"#a2aa67","#825452",{"mouthScale":0.87,"eyeUp":82,"mouthDown":77,"beardFront":true}]]);
cast('gate10',[["malvane","battle_mages_gear",327,394,543,2,4,"#798fae","#986d63",{"mouthScale":0.915,"mouthDown":69}],["grell","assassins_gear",310,380,540,3,4,"#a18a61","#795651",{"mouthScale":0.96}],["idris","healer",331,385,518,4,4,"#a2bbc0","#8c7b84",{"mouthScale":1.005}],["ravel","duelist",316,384,544,2,1,"#bf8a63","#99412e",{"mouthScale":1.05,"mouthDown":60}]]);
cast('gate11',[["kessa","mage",333,409,536,3,4,"#9ca0c2","#813f68",{"mouthScale":0.87,"clothColor":"#514261"}],["jarem","adept",303,388,541,2,3,"#b59a5e","#795651",{"mouthScale":0.915,"eyeUp":100,"mouthDown":59}],["lucan","mercenarys_gear",346,369,518,3,4,"#849476","#825452",{"mouthScale":0.96}],["maddox","duelist",313,392,541,3,4,"#8196a8","#986d63",{"mouthScale":1.005,"mouthDown":64}]]);
cast('gate12',[["vask","duelist",320,350,530,4,1,"#a48a58","#986d63",{"mouthScale":1.05}],["rennick","plain",310,365,521,1,4,"#8e9a64","#795651",{"mouthScale":0.87}]]);
// Hiro has a reserved cyberpunk head and Ronin body; other equipment still swaps normally.
Object.assign(named.hiro,{head:H('hiro_cyber',0,314,352,503,{eyeUp:80,mouthDown:64,spread:64}),bodySheet:'hiro_cyber',bodyFrame:1,bodySets:['ronin'],bodyWidth:1060});
ADV.AnimeIdentities={heads,named,
 headNames:{f:['Sleek side part','Long waves','Natural curls','Wavy bob','Auburn waves','Silver waves','Swept locs & gold rings','Box-braid bun','Hime cut','Long woven braid','High ponytail','Curly updo','Blond wolf cut','Auburn crown braid'],
 m:['Topknot','Waves & beard','Short curls','Swept hair & stubble','Blond swept hair','Locs & chin stubble','High fade & beard','Wavy fade & goatee','Two-block cut','Thick waves & full beard','Long half-up hair','Flow cut & short beard','Red undercut & mustache']}};
})();
