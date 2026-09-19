// Documentation-only contracts. These describe ownership, not a new save format.
/**
 * @typedef {Object} SavedCharacter
 * @property {string} id Stable identity, also used by family/party/vault links.
 * @property {boolean} alive Deceased relatives remain in the canonical roster.
 * @property {{hp:number,atk:number,def:number,spd:number}} stats Base statistics.
 * @property {{gold:number}} inventory Carried gold and other inventory fields.
 * @property {Array<{skillId:string,level:number}>} perks
 * @property {Array<{skillId:string,level:number}>} actives
 * @property {Array<Object>} [dependents] Children reserve IDs before adulthood.
 */
/**
 * @typedef {Object} GateProgress
 * @property {number} stage Last completed chapter; persists across lives.
 * @property {Object<string,boolean>} flags Authored story facts.
 * @property {string[]} company Companions selected for the road.
 * @property {string[]} recruited All recruited companions, including the inn.
 * @property {Object<string,string>} choices Settled answers by choice ID.
 * @property {Object<string,{optionId:string,aff?:Object,heritageDelta?:number,legacy?:boolean}>} choiceEffects
 */
/**
 * @typedef {Object} QuestAttempt Transient. A reload restarts the chapter.
 * @property {Object} quest Authored/generated quest specification.
 * @property {number} encIdx Current encounter index.
 * @property {boolean} failed A loss, not merely an individual downed ally.
 * @property {boolean} [readyToComplete]
 * @property {CombatState} [combat]
 * @property {DialogueBeat[]} [openerBeats]
 * @property {string[]} [appliedChoices] Attempt-local bypass receipts.
 */
/**
 * @typedef {Object} DialogueBeat Presentation consumed by campaign UI.
 * @property {string} who Speaker character ID.
 * @property {string} key Authored dialogue/voice lookup key.
 * @property {string} [choice] Authored choice ID.
 * @property {string} [fid] Campaign/faction namespace.
 * @property {string[]} [recruit] Persistent effects when the beat plays.
 */
/**
 * @typedef {Object} CombatUnit Transient wrapper around a character.
 * @property {string} uid Encounter-local unit identity.
 * @property {SavedCharacter} ch
 * @property {'a'|'b'} side
 * @property {number} chp Current battle HP.
 * @property {boolean} downed
 * @property {Array<Object>} statuses
 */
/**
 * @typedef {Object} CombatState Transient rules state, never a Phaser scene.
 * @property {CombatUnit[]} units
 * @property {Object} rng Dedicated seeded stream for this encounter.
 * @property {CombatEvent[]} events Ordered output consumed by UI and tests.
 * @property {number} round
 * @property {boolean} over
 */
/**
 * @typedef {Object} CombatEvent Rules output; presentation must not apply damage.
 * @property {string} t Discriminant; payload varies by event kind.
 */
/**
 * @typedef {Object} CampaignProvider Explicitly registered in CampaignRoutes.
 * @property {function(Object,Object,number):Array<SavedCharacter>} spawnEncounter
 * @property {function(Object,Object):Array<SavedCharacter>} alliesFor
 * @property {function(Object,Object):Array<DialogueBeat>} departureBeats
 * @property {function(Object,Object):void} onCampaignQuestDone
 * @property {function(Object):Array<DialogueBeat>} takeBeats
 * @property {function(string,string,string):Array<Object>} lines
 * @property {function(Object,CombatState,number):Object} banter
 */
