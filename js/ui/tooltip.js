// Hover tooltips + backend skill inspector.
// SkillInfo.describe dumps exactly what the engine will do with a skill —
// every tier parameter, the damage formula with the character's real numbers,
// riders, offensive modes — so a broken skill is diagnosable on sight.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;
const C = () => ADV.DATA.CONST;

// ---------------------------------------------------------------- Tooltip
// Sit beside the hovered control after a long pause, then vanish the instant
// the pointer leaves that control. Never follow the cursor — a cursor-locked
// card covers the skill and steals the hover that is keeping it open.
const Tooltip = {
  current: null,
  SHOW_DELAY_MS: 4000,
  _timer: null,
  _host: null,
  _hoverGen: 0,

  hostRect(obj, px, py) {
    if (obj && ADV.UI && ADV.UI.worldRect) {
      const r = ADV.UI.worldRect(obj);
      if (r && r.w > 0 && r.h > 0) return r;
    }
    if (obj && typeof obj.getBounds === 'function') {
      const b = obj.getBounds();
      if (b && b.width > 0 && b.height > 0) return { x: b.x, y: b.y, w: b.width, h: b.height };
    }
    return { x: (px || 0) - 8, y: (py || 0) - 8, w: 16, h: 16 };
  },

  // Keep the card off the host's hit box so the pointer can stay on the skill.
  placeBeside(host, w, h, screenW, screenH) {
    const M = 8, GAP = 12;
    const W = screenW, H = screenH;
    const hx = host.x, hy = host.y, hw = host.w, hh = host.h;
    let y = hy;
    if (y + h > H - M) y = H - M - h;
    if (y < M) y = M;
    const rightX = hx + hw + GAP;
    const leftX = hx - w - GAP;
    if (rightX + w <= W - M) return { x: rightX, y };
    if (leftX >= M) return { x: leftX, y };
    const belowY = hy + hh + GAP;
    if (belowY + h <= H - M) return { x: Math.max(M, Math.min(hx, W - M - w)), y: belowY };
    const aboveY = hy - h - GAP;
    if (aboveY >= M) return { x: Math.max(M, Math.min(hx, W - M - w)), y: aboveY };
    return { x: rightX + w <= W - M ? rightX : Math.max(M, leftX), y };
  },

  overlapsHost(box, host) {
    return !(box.x + box.w <= host.x || box.x >= host.x + host.w || box.y + box.h <= host.y || box.y >= host.y + host.h);
  },

  cancelHover() {
    if (Tooltip._timer != null) {
      clearTimeout(Tooltip._timer);
      Tooltip._timer = null;
    }
    if (Tooltip._tapTimer) {
      clearTimeout(Tooltip._tapTimer);
      Tooltip._tapTimer = null;
    }
  },

  leave(obj) {
    if (obj && Tooltip._host && Tooltip._host !== obj) return;
    Tooltip.cancelHover();
    Tooltip._host = null;
    Tooltip.hide();
  },

  show(scene, textLines, host, px, py) {
    Tooltip.hide();
    if (ADV.UI && ADV.UI.holdCard && !ADV.UI.holdCard('tooltip', Tooltip.hide)) return;
    if (typeof host === 'number') { py = px; px = host; host = null; }
    const body = Array.isArray(textLines) ? textLines.join('\n') : textLines;
    const txt = scene.add.text(0, 0, body, {
      fontFamily: T().font.mono, fontSize: '12px', color: T().css.ink,
      lineSpacing: 3, wordWrap: { width: 430 },
    }).setDepth(1502);
    const w = txt.width + 24, h = txt.height + 20;
    const hostBox = Tooltip.hostRect(host || Tooltip._host, px, py);
    const pos = Tooltip.placeBeside(hostBox, w, h, T().W, T().H);
    const x = pos.x, y = pos.y;
    const bg = scene.add.graphics().setDepth(1501);
    if (bg.disableInteractive) bg.disableInteractive();
    if (txt.disableInteractive) txt.disableInteractive();
    bg.fillStyle(0x0f0d0a, 0.97);
    bg.fillRoundedRect(x, y, w, h, 5);
    bg.lineStyle(1.5, T().c.gold, 0.8);
    bg.strokeRoundedRect(x, y, w, h, 5);
    txt.setPosition(x + 12, y + 10);
    Tooltip.current = { bg, txt, scene, host: hostBox };
    scene.events.once('shutdown', Tooltip.hide);
  },

  move() {
    // Kept as a no-op so older call sites do not drag the card onto the cursor.
  },

  hide() {
    Tooltip.cancelHover();
    if (ADV.UI && ADV.UI.releaseCard) ADV.UI.releaseCard('tooltip');
    if (!Tooltip.current) return;
    try { Tooltip.current.bg.destroy(); Tooltip.current.txt.destroy(); } catch (e) {}
    Tooltip.current = null;
  },

  // Wire hover on any interactive zone/object. textFn is lazy (built on hover).
  attach(scene, obj, textFn) {
    obj.on('pointerover', (p) => {
      Tooltip.cancelHover();
      Tooltip._host = obj;
      const gen = ++Tooltip._hoverGen;
      Tooltip._timer = setTimeout(() => {
        if (Tooltip._hoverGen !== gen || Tooltip._host !== obj) return;
        Tooltip._timer = null;
        const t = textFn();
        if (t) Tooltip.show(scene, t, obj, p && p.x, p && p.y);
      }, Tooltip.SHOW_DELAY_MS);
    });
    obj.on('pointerout', () => Tooltip.leave(obj));
    obj.on('pointerdown', () => Tooltip.leave(obj));
    // Phones have no hover (mobile pass): a tap shows the inspector for a few
    // seconds alongside whatever the tap does.
    if (ADV.UI && ADV.UI.isTouch && ADV.UI.isTouch()) {
      obj.on('pointerup', (p) => {
        const t = textFn(); if (!t) return;
        Tooltip._host = obj;
        Tooltip.show(scene, t, obj, p.x, p.y);
        if (Tooltip._tapTimer) clearTimeout(Tooltip._tapTimer);
        Tooltip._tapTimer = setTimeout(() => Tooltip.leave(obj), Tooltip.SHOW_DELAY_MS);
      });
    }
  },
};

// Scenes call this on shutdown-ish moments; cheap safety.
Tooltip.attachZone = function (scene, x, y, w, h, textFn) {
  const z = scene.add.zone(x, y, w, h).setOrigin(0).setInteractive();
  Tooltip.attach(scene, z, textFn);
  return z;
};

// ---------------------------------------------------------------- SkillInfo
// Human labels for every engine parameter a tier can carry. Anything not
// listed still prints raw as `key: value` so nothing is ever hidden.
const PARAM_LABEL = {
  // ---- second campaign (add-on §3): the new engine primitives -------------
  immovable: () => 'cannot be moved, pulled or pushed out of this lane',
  laneNoDelay: () => 'ignores Shock and any effect that delays your place in the order',
  firstInRoundOne: () => 'acts first in round 1, before anything else on the field',
  grantTurn: v => `gives an ally ${v} extra action(s) this round`,
  pull: v => `drags the target ${v} lane(s) toward you`,
  pullAttacker: () => 'anyone who attacks you is dragged one lane forward',
  rootRounds: v => `roots the target for ${v} round(s): it cannot change lane`,
  selfRoot: () => 'you cannot change lane while this holds',
  reactionLock: () => 'the target cannot counter, reflect or retaliate',
  defIgnorePct: v => `ignores ${Math.round(v * 100)}% of the target's DEF`,
  laneFocusScale: v => `+${Math.round(v * 100)}% per previous hit into the same lane this round`,
  lifeKillScale: v => `scales with everyone this character has ever killed (+${Math.round(v * 100)}% each)`,
  laneAllyGuard: () => 'guards every ally sharing your lane',
  allyStealth: () => 'hides an ally as well as yourself',
  stealthRounds: v => `stealth holds for ${v} round(s)`,
  stealthKeepsOnHit: () => 'attacking does not break stealth',
  revealIntents: () => 'shows every hidden enemy and the skills they carry, all battle',
  onHitExposed: () => 'hits apply Exposed',
  onHitPoison: () => 'hits apply poison',
  wardPoison: () => 'anyone who strikes you is poisoned',
  exposedOnSecond: () => 'the second hit on the same target applies Exposed',
  selfBleedOnTarget: v => `costs you ${v} HP per use`,
  healAtEnd: v => `when the share ends, each linked ally heals ${Math.round(v * 100)}% of their max HP`,
  healFromTaken: v => `heals ${Math.round(v * 100)}% of the damage you have taken this battle`,
  noReload: () => 'no reload lock: usable every round',
  rangedExtraTarget: () => 'ranged attacks strike one extra target',
  lawfulPayMult: v => `×${v} gold from lawful contracts`,
  witnessStartLevel: v => `skills you witness start at level ${v}`,
  power: v => `power ${v} (damage/heal multiplier in the formula)`,
  eleDmgMult: v => `elemental damage ×${v} (applies to elemental actives)`,
  dmgTakenMult: v => `damage taken ×${v}`,
  physicalTaken: () => 'the reduction applies to physical wounds and percent-of-HP ticks',
  guardAbsorb: v => v >= 1 ? 'negates incoming damage' : `absorbs ${Math.round(v * 100)}% of incoming damage`,
  reflectPct: v => `reflects ${Math.round(v * 100)}% of damage taken to the attacker`,
  protectAdjacent: () => 'also covers adjacent lane allies',
  killHealPct: v => `heals ${Math.round(v * 100)}% max HP whenever an enemy dies`,
  killCleanse: () => 'clears every status on you when an enemy dies',
  stun: v => `stuns the target for ${v} turn(s)`,
  critSecondAdjacent: () => 'the second strike is a critical (double damage) on an adjacent enemy',
  guardScope: v => `Shield Wall guard scope: ${v} — negated damage is dealt back to the attacker`,
  marks: v => `marks ${v === 'all' ? 'every enemy' : v === 'lane' ? 'a whole lane' : v + ' enemy(s)'} — marked enemies must attack you`,
  retaliationPower: v => `retaliation ${v}× ATK each time a marked enemy attacks (ignores DEF)`,
  executeThreshold: v => `bonus vs targets under ${Math.round(v * 100)}% HP`,
  bonusMult: v => `bonus damage ×${v}`,
  bonusHpPct: v => `+${Math.round(v * 100)}% of the target's max HP as extra damage (strikes, bleed, and poison)`,
  killRefundsAction: () => 'kills refund the action (act again)',
  backLaneBonus: v => `×${v} damage while you stand in the back lane`,
  // Added alongside the healing and dispel rework: without wording here the tooltip prints
  // the raw key at the player, which is what test/skill_audit.js guards against.
  medicPct: v => `restores ${Math.round(v * 100)}% of the tier's share of each target's max HP`,
  medicBelow: v => `treats every ally below ${Math.round(v * 100)}% health`,
  breathRounds: v => `the borrowed turn lasts ${v} round${v === 1 ? '' : 's'}`,
  breathAll: () => 'lifts every downed ally, not just one',
  spreadPct: v => `everyone other than the target you picked takes ${Math.round(v * 100)}% of the damage`,
  drawKinds: v => `pulls ${[].concat(v).join(' and ')} across`,
  drawFromAll: () => 'pulls from every ally at once, not just the worst off',
  dispelCap: v => `strips at most ${v} effect${v === 1 ? '' : 's'}`,
  ignoreCover: () => 'ignores lane cover',
  noReflect: () => 'back-lane attacks take NO reflect damage from any source',
  openerOrStealth: () => 'usable ONLY as the opening action of an encounter, or from stealth',
  stealthOnUse: () => 'enters stealth (untargetable without See Invisibility; broken by attacking)',
  melee: () => 'counts as melee: applies and consumes Exposed',
  stackMult: v => `+${Math.round(v * 100)}% per consecutive attacking turn`,
  maxStacks: v => `max ${v} stacks`,
  thirdHitTwice: () => 'every 3rd consecutive attacking turn strikes twice',
  cleaveRows: v => v === 1 ? "hits the target's row" : `hits ${v} rows around the target`,
  hitScale: () => 'damage is multiplied by the number of enemies hit',
  status: (v, tier) => 'inflicts: ' + Object.entries(v).map(([k, s]) => {
    // poison & bleed are a percentage of the target's max HP by tier (DOT_PROMPT.md §1)
    if ((k === 'poison' || k === 'bleed') && ADV.Combat && ADV.Combat.DOT_PCT) {
      const pct = ADV.Combat.DOT_PCT[tier || 'basic'] || 0.5;
      const n = ADV.Combat.dotWindow ? ADV.Combat.dotWindow(s.rounds) : (s.rounds || 6);
      return `${k}${s.stacks ? ' (STACKS)' : ''}: ${Math.round(pct * 100)}% of the target's health over ${n} turns`;
    }
    return `${k}${s.stacks ? ' (STACKS)' : ''} ${s.power}× ATK/2 per round, ${s.rounds} rounds`;
  }).join('; '),
  defStrip: v => `strips ${v} DEF for the battle (counters Armored +${C().ARMORED_BONUS_DEF})`,
  defStripAll: () => 'strips ALL DEF for the battle',
  delayTarget: () => 'target acts later this round (SPD −4 in the order)',
  loseAction: () => 'target loses its next action',
  multiTarget: v => `chains to ${v} targets`,
  adjacent: v => `hits +${v} adjacent enemy in the lane`,
  pierceBehind: () => 'also hits the first enemy in the lane behind',
  splashAdjacent: () => 'splashes to one adjacent enemy',
  evadeNext: v => `evades the next ${v} attack(s)`,
  untargetableRounds: () => 'untargetable this round, then 1 free evade',
  freeStrike: () => 'plus a free 2.0-power strike',
  freeAction: () => 'free action — does not end your turn; you may still use another skill',
  fullHpBackstabPct: v => `against a target at full health, deals ${Math.round(v * 100)}% of a Backstab`,
  dotMult: v => `bleed and poison damage ×${v}`,
  dotLeech: v => `heal ${Math.round(v * 100)}% of bleed and poison ticks you deal or take`,
  leechAny: () => 'heals from every poison and bleed on the field, whoever cast it',
  counterNext: v => `negates the next ${v} attack(s) and reflects the damage`,
  thornPct: v => `reflects ${Math.round(v * 100)}% of damage taken`,
  thornScope: v => `thorns cover: ${v}`,
  rounds: v => `lasts ${v} rounds`,
  freeBuff: () => 'does not cost a turn — applied at battle start and whenever it falls off',
  atkMult: v => `ATK ×${v}`,
  lifeSteal: v => `heals ${Math.round(v * 100)}% of damage dealt`,
  surviveLethal: () => 'survives one lethal blow per battle at 1 HP',
  laneShift: () => 'may shift lanes freely',
  accuracy: () => 'attacks cannot miss while Momentum is armed',
  oneShotUndead: () => 'instantly ends undead',
  turnPlacement: v => v === 'distributed' ? 'extra turns are spread through the round' : `turn placement: ${v}`,
  noReload: () => 'reload skills fire every round',
  buffRounds: v => `the rise buff lasts ${v} turn(s)`,
  cannotMiss: () => 'this attack cannot miss',
  cooldown: v => `cooldown ${v} round(s)`,
  autoKillPct: v => `${Math.round(v * 100)}% chance to kill outright anything below boss rank`,
  requireBelowPct: v => `can only be aimed at enemies already below ${Math.round(v * 100)}% health`,
  counterRounds: v => `the stance holds for ${v} round(s)`,
  counterRiposte: () => 'every blocked attack is answered in kind',
  questGain: () => 'the stat gain lasts the contract and leaves you when you come home',
  autoReviveRounds: v => `stands back up ${v} round(s) after falling, if anyone is still fighting`,
  pctTotal: v => `bleeds ${Math.round(v * 100)}% of the target's maximum health over the wound`,
  pctMaxHp: v => `takes ${Math.round(v * 100)}% of the target's maximum health, whatever its armour`,
  targetHighestHp: () => 'always strikes whoever has the largest maximum health, ignoring taunts',
  signature: () => 'used the round it comes off cooldown',
  ignoreGuards: () => 'ignores guards',
  openerOnly: () => 'usable only as the opening action of the encounter',
  reflectImmuneNext: () => 'your next attack takes no reflect damage',
  reload: () => 'must reload before firing again',
  revealGold: () => 'shows enemy gold on the field',
  unactedDouble: () => 'doubled against a target that has not acted yet',
  unactedOnly: () => 'only heals allies who have not acted this round',
  dmgMult: v => `all damage dealt ×${v}`,
  healMult: v => `healing you perform ×${v}`,
  tempHpDouble: () => 'overheal converts to temp HP at DOUBLE value',
  tempHpCap: v => `temp HP cap raised to ${Math.round(v * 100)}% of max`,
  healSplashPct: v => `${Math.round(v * 100)}% of each heal also damages the nearest enemy`,
  hotRounds: v => `heal over time, ${v} rounds`,
  cures: v => `cures: ${v.join(', ')}`,
  cureCount: v => `removes ${v >= 99 ? 'ALL' : v} negative status(es)`,
  shieldHits: v => `ward blocks the next ${v} hit(s)`,
  shieldRounds: v => `ward blocks everything for ${v} round(s)`,
  wardReflect: () => 'ward reflects the blocked damage',
  doubleBelow: v => `doubled on targets under ${Math.round(v * 100)}% HP`,
  fullHealBelow: v => `FULL heal on targets under ${Math.round(v * 100)}% HP`,
  revive: () => 'revives fallen allies',
  reviveHp: v => `returns at ${Math.round(v * 100)}% HP`,
  reviveCount: v => v > 1 ? `raises up to ${v} fallen allies` : 'raises one fallen ally',
  selfRevive: () => 'triggers automatically when you fall — cannot be clicked',
  reviveUses: v => v === 1 ? 'once per battle' : `up to ${v} times per battle`,
  reviveAtkMult: v => `+${Math.round((v - 1) * 100)}% damage after rising`,
  reviveBuffRounds: v => `the rise buff lasts ${v} turn(s)`,
  reviveStealthRounds: v => `rises invisible for ${v} turn(s)`,
  reviveEvade: v => `evades the next ${v} attack(s) after rising`,
  grantSelfTurn: v => `takes ${v} extra turn(s) after rising`,
  oncePerBattle: () => 'once per battle',
  dualHeal: () => 'damages the enemy AND heals allies for the same amount',
  healTargets: v => `heals ${v === 'party' ? 'the whole party' : v + ' most-wounded ally(s)'}`,
  duration: v => `holds ${v} quests, then they escape at permanent Hatred`,
  cap: v => `cap ${v} — exceeding it releases/kills the oldest`,
  risenPower: v => `the risen fight at ${v}× strength for the rest of this contract`,
  undeadKeepSkills: () => 'raised undead keep their skills',
  vs: v => `works against: ${v}`,
  partyApplicationBonus: () => 'bonus to party application odds',
  recruitForEncounter: () => 'charmed target fights for you this encounter',
  fleersDropLoot: () => 'frightened enemies drop loot',
  stealAll: () => 'steals from EVERY enemy in the encounter',
  executeBelow: v => `EXECUTES targets under ${Math.round(v * 100)}% HP (not bosses)`,
  instantKillIfMaxHp: v => `instantly kills anyone whose max HP exceeds ${v}`,
  healOnKillPct: v => `heals ${Math.round(v * 100)}% max HP on kill`,
  permStatGain: v => `+${v} to ALL stats permanently per kill (lost on death)`,
  turnsPerRound: v => `${v} turns per round (never shared with allies)`,
  goldMult: v => `all gold earned ×${v}`,
  healReceivedMult: v => `all healing received ×${v}`,
  overhealUncapped: () => 'overheal temp HP has NO cap',
  statusImmune: () => 'immune to all negative statuses',
  katanaFreeSlots: () => 'katana skills use no active slots',
  auraAtk: v => `party ATK ×${v}`,
  auraDef: v => `party incoming damage ÷${v}`,
  auraEvade: v => `party evade +${Math.round(v * 100)}%`,
  evadePct: v => `${Math.round(v * 100)}% chance to evade incoming attacks`,
  rangerExtraUse: v => `${v} extra ranger-skill use(s) per round`,
  element: v => `element: ${v}`,
  guardRounds: v => `negates damage for ${v <= 1 ? 2 : v} turns`,
  markRounds: v => `marks last ${v} rounds`,
  freeze: v => `FREEZES the target: loses ${v} whole turn(s); thawed targets can't re-freeze for 3 rounds`,
  shock: v => `SHOCKS: target takes +${Math.round(v * 100)}% damage from ALL sources`,
  shockRounds: v => `shock lasts ${v} rounds`,
  seal: v => `SEALS the target's ${v.join(' + ')} skills (Basic Attack never seals)`,
  sealRounds: v => `seal lasts ${v} rounds`,
  spreadLanes: () => "hits the target's lane AND both adjacent lanes",
  wardAhead: () => 'usable on allies in your lane or behind you — you shield what stands behind you',
  undeadPower: v => `vs undead: holy damage at power ${v} instead`,
  purifyRounds: v => `grants immunity to ALL negative statuses (and post-battle conscription) for ${v} rounds`,
  unraise: () => 'cast on a walking undead: restores them to LIFE, undoing the true death (never revives the ordinary dead)',
  bribeChance: v => `in battle: bribe a hostile named enemy to flee — ${Math.round(v * 100)}% odds, fee 30 + 20×rank, spent either way`,
  fireResist: v => `takes ${Math.round(v * 100)}% less fire damage`,
  fireLeech: v => `heals for ${Math.round(v * 100)}% of fire damage dealt`,
  survivalHp: v => `+${v} max HP for every battle you come out of alive this quest (each encounter counts; it fades when you are home)`,
  consecutive: () => 'the extra turn comes immediately after the first',
  fleeBonus: v => `+${Math.round(v * 100)}% chance to flee`,
  killHealPct: v => `each kill restores ${Math.round(v * 100)}% of max HP`,
  stackPct: v => `each kill adds +${Math.round(v * 100)}% damage for the rest of the battle (stacking)`,
  tauntRounds: v => `each kill taunts EVERY enemy onto you for ${v} rounds`,
  dotMult: v => `bleed and poison damage ×${v}`,
  dotLeech: v => `heals you for ${Math.round(v * 100)}% of bleed/poison damage dealt`,
  wageEdge: v => `hired ${v}g above your price; your hires accept ${v}g below theirs`,
  oppositeSexFriendly: () => 'the opposite sex starts at Friendly toward you',
  softJilt: () => 'people you leave stay Friendly instead of hating you',
  targetedLast: () => 'enemies attack your party before you whenever they can',
  iceArmorPerHit: v => `each ice hit dealt: +${Math.round(v * 100)}% stacking damage reduction (cap 50%, whole battle)`,
  // ---- campaign primitives (campaign doc §13)
  effect: v => ({ mark: 'MARK: the target takes extra damage from you while marked', contractMark: 'CONTRACT MARK: every ally deals bonus damage to the target',
    ghoststep: 'GHOSTSTEP: enter stealth and shift lanes', unseenGuard: 'UNSEEN GUARD: the warded ally cannot be targeted while you stay in stealth',
    venomDraw: 'VENOM DRAW: pulls every DOT off the target and re-applies them all at once', lastBreath: 'LAST BREATH: revive at low HP with a burst of temp HP',
    share: 'SHARE: damage taken is split with the linked ally(s)', paidInFull: 'PAID IN FULL: bonus damage scaled by the gold you carry (x ATK)',
    companyMedic: 'COMPANY MEDIC: heals the party, most wounded first', dispel: 'DISPEL: strips every buff from the target' }[v] || `effect: ${v}`),
  stealthOnKill: () => 'a kill re-enters stealth for 2 rounds',
  silent: () => 'silent: does not break stealth',
  hits: v => `${v} separate hits`,
  chainDecay: v => `each chained hit does ×${v} of the last`,
  randomElemental: () => 'element rolled each cast (fire/ice/lightning) with its status',
  stripGuards: () => 'removes guards, wards and taunts from the target',
  stealBuff: () => 'steals one buff from the target',
  silence: v => `SILENCE: target cannot use actives for ${v} round(s)`,
  withering: v => `WITHERING: healing received ×${v.mult || 0.5} for ${v.rounds} round(s)`,
  healcutRounds: v => `target receives NO healing for ${v} round(s)`,
  runic: () => 'runic: ignores wards',
  selfWardPct: v => `wards yourself for ${Math.round(v * 100)}% of the damage dealt`,
  laneBuff: v => `lane buff: ${v.kind} ×${v.mult} for ${v.rounds} round(s) on your whole lane`,
  reveal: () => "reveals the next encounter's composition (Scout's Cut)",
  revealHp: () => 'shows exact enemy HP numbers',
  revealLoadouts: () => 'shows enemy skill loadouts before the encounter (Case the Room)',
  revealPerks: () => 'shows enemy perks',
  revealContracts: () => 'shows exact payouts and every encounter before accepting a contract',
  seeInvis: () => 'sees stealthed enemies',
  selfStatus: v => `on self: ${v.kind} ×${v.mult || ''} ${v.rounds} round(s)`,
  partyStatus: v => `on the party: ${Object.keys(v).join(', ')}`,
  allyStatus: v => `on the ally: ${Object.keys(v).join(', ')}`,
  laneStatus: v => `on the lane: ${Object.keys(v).join(', ')}`,
  hazard: v => `lays a ${v.kind} hazard on the lane (${v.rounds} rounds, ${v.power}× ATK)`,
  interrupt: () => 'INTERRUPT: cancels the target\'s planned action this round',
  grantEvade: v => `the healed ally evades the next ${v} attack(s)`,
  wardAll: () => 'wards the whole party',
  shareWith: v => `shares with: ${v}`,
  mult: v => `×${v}`,
  levelMult: v => `levels ${v}× faster`,
  passive: () => 'passive: costs no action',
  betweenHealPct: v => `+${Math.round(v * 100)}% max HP healed between encounters for the whole party`,
  autoFlee: () => 'fleeing succeeds automatically once per quest',
  wageDiscount: v => `hires accept wages as if ${Math.round(v * 100)}% richer`,
  followerDef: v => `conscripts and summons gain +${v} DEF`,
  killGold: v => `+${v}g per kill (Corpse Work)`,
  // scalers: how the number grows
  killStreakScale: v => `+${Math.round(v * 100)}% per kill this battle`,
  idleScale: v => `+${Math.round(v * 100)}% per round the target has not acted`,
  encounterScale: v => `+${Math.round(v * 100)}% per encounter into the quest`,
  castScale: v => `+${Math.round(v * 100)}% per previous cast this battle`,
  tierScale: v => `+${Math.round(v * 100)}% per quest tier`,
  alliesBetweenScale: v => `+${Math.round(v * 100)}% per ally standing between you and the target`,
  buffCountScale: v => `+${Math.round(v * 100)}% per buff on the target`,
  flankScale: v => `+${Math.round(v * 100)}% per ally attacking the same target this round`,
  laneStreakScale: v => `+${Math.round(v * 100)}% per round you have held your lane`,
  distanceScale: v => `+${Math.round(v * 100)}% per lane of distance to the target`,
};
const SKIP_KEYS = new Set(['name', 'note', 'tiers', 'id', 'kind', 'archetype', 'desc',
  'campaignReward', 'group', 'key', 'quest', 'questName', 'requirement',
  'target', 'reach', 'offensive', 'heal', 'elemental', 'universal', 'unique', 'noSlot',
  'forbidden', 'social', 'warning', 'katana', 'noTierGrowth', 'faction', 'campaign', 'tier']);

function paramLines(data, tier) {
  const out = [];
  for (const [k, v] of Object.entries(data)) {
    if (SKIP_KEYS.has(k) || v == null || v === false) continue;
    const f = PARAM_LABEL[k];
    out.push('  · ' + (f ? f(v, tier) : `${k}: ${JSON.stringify(v)}`));
  }
  return out;
}

const SkillInfo = {
  // ch may be null (creation screen): formula shown with example ATK 10.
  describe(ch, skillId) {
    const sk = ADV.DATA.SKILLS[skillId];
    if (!sk) return null;
    if (sk.campaignReward) {
      const rank = ch?.perks?.find(e => e.skillId === skillId)?.campaignRank || 1;
      const desc = skillId === 'gate_unmasker' && rank >= 2 ? sk.desc.replace('15 percentage points', '25 percentage points').replace('Quest 10 can improve the evasion reduction to 25 points.', 'Improved in quest 10.') : sk.desc;
      return [sk.name, desc, 'Campaign perk · Passive · No class requirement · No skill slot', 'Quest ' + sk.quest + ' — ' + sk.questName, sk.requirement].join('\n\n');
    }
    const L = [];
    const entry = ch ? (ch.perks.find(e => e.skillId === skillId) || ch.actives.find(e => e.skillId === skillId)) : null;
    const rec = ch && !entry ? (ch.skillLevels || {})[skillId] : null;
    const level = entry ? entry.level : rec ? rec.level : 1;
    const effLevel = ch ? ADV.SkillSys.effectiveLevel(ch, skillId, level) : level;
    const tier = ADV.SkillSys.tierFor(ch, skillId, effLevel);
    const tierMult = sk.noTierGrowth ? 1.0 : C().TIER_MULT[tier];
    const data = Object.assign({}, sk, sk.tiers[tier]);

    L.push(`${sk.name}  [${sk.kind}${sk.archetype ? ' · ' + sk.archetype : sk.social ? ' · social (' + sk.social + ')' : ''}${sk.unique ? ' · UNIQUE' : ''}${sk.forbidden ? ' · FORBIDDEN' : ''}]`);
    L.push(sk.desc || '');
    L.push('');
    if (entry || rec) {
      const uses = entry ? entry.uses : rec.uses;
      const toNext = C().USES_PER_LEVEL - (uses % C().USES_PER_LEVEL);
      L.push(`level ${level} (${uses} uses, ${toNext} to next) → manifests as ${tier.toUpperCase()}: ${data.name}`);
      if (effLevel > level) L.push(`  gear set floors this to level ${effLevel}`);
    } else {
      L.push(`unlearned — starts level 1 (BASIC). ${C().USES_PER_LEVEL} uses per level; Intermediate at ${C().TIER_THRESHOLDS.intermediate}, Advanced at ${C().TIER_THRESHOLDS.advanced}.`);
    }

    // targeting
    if (sk.kind === 'active') {
      const tgt = data.target || 'enemy';
      const reach = data.reach === 'front' ? 'front lane only (melee, blocked by cover)' :
        data.reach === 'back' ? 'rearmost non-front enemy lane only' : 'any lane';
      L.push(`targets: ${tgt} · reach: ${reach}`);
    }

    // formula with real numbers
    const atk = ch ? ADV.Character.effStat(ch, 'atk') : 10;
    if (data.power > 0 && !data.heal) {
      const raw = Math.round(atk * data.power * tierMult * (1 + effLevel * C().LEVEL_DAMAGE_SCALAR));
      L.push(`damage = round(ATK ${atk} × power ${data.power} × tier ×${tierMult} × (1 + ${effLevel}×0.015)) − targetDEF`);
      L.push(`       = ${raw} − DEF  (vs DEF 10 → ${Math.max(1, raw - 10)}; minimum 1)`);
    }
    if (data.heal && data.power > 0) {
      const raw = Math.round(atk * data.power * tierMult * (1 + effLevel * C().LEVEL_DAMAGE_SCALAR));
      L.push(`heal = round(ATK ${atk} × ${data.power} × ×${tierMult} × (1 + ${effLevel}×0.015)) = ${raw} (no DEF; overheal → temp HP, cap ${Math.round(C().OVERHEAL_CAP_PCT * 100)}%)`);
    }

    // current-tier parameters (the backend truth)
    const pl = paramLines(data, tier);
    if (pl.length) { L.push('this tier does:'); L.push(...pl); }

    // offensive mode
    if (sk.offensive) {
      L.push(`hostile mode — ${sk.offensive.name}:`);
      const ol = paramLines(sk.offensive);
      L.push(...(ol.length ? ol : ['  · ' + JSON.stringify(sk.offensive)]));
    }

    // other tiers, compact
    for (const tname of ['basic', 'intermediate', 'advanced']) {
      if (tname === tier || sk.noTierGrowth) continue;
      const td = Object.assign({}, sk, sk.tiers[tname]);
      const diffs = paramLines(sk.tiers[tname], tname);
      L.push(`${tname} (×${C().TIER_MULT[tname]}): ${td.name}${diffs.length ? ' — ' + diffs.map(s => s.replace('  · ', '')).join('; ') : ''}`);
    }

    const flare = ADV.SkillSys.classFlare && ADV.SkillSys.classFlare(sk);
    if (flare) {
      L.push('');
      L.push(`class flare (${sk.archetype}): ${flare.desc}`);
      const names = (flare.twins || []).map(id => (ADV.DATA.SKILLS[id] || {}).name || id).slice(0, 5);
      if (names.length) L.push('  · kindred skill in another class: ' + names.join(', '));
    }

    if (sk.forbidden) L.push(`⚠ ${sk.warning} Using it builds toward Divine Intervention.`);
    if (sk.universal) L.push('universal: no slot, never learned, never witnessed, never improves.');
    if (sk.unique) L.push('unique tier: never witnessable, never learnable.');
    return L.filter(s => s !== null).join('\n');
  },
};

const GearSetInfo = {
  describe(setId, ch) {
    const set = ADV.DATA.GEAR_SETS[setId];
    if (!set) return null;
    const floor = set.floor || C().GEAR_SET_FLOOR_LEVEL;
    const L = [];
    L.push(set.name);
    if (set.advanceTier || set.cost >= (C().GOLD.gearSet || 800)) {
      L.push(`Floors matching skills at level ${floor}, and advances them one tier from their own level ${C().TIER_THRESHOLDS.intermediate} — a skill you have carried that far manifests as its Advanced form.`);
    } else {
      L.push(`Floors matching skills at level ${floor} (Intermediate if they were lower). It never lifts them past Intermediate — only levelling the skill through use reaches Advanced.`);
    }
    L.push('Matching skills and perks use an unlimited armor slot while you wear this — they do not spend your skill or perk slots.');
    L.push('Archetypes: ' + (set.archetypes || []).join(', '));
    if (set.extraSkills && set.extraSkills.length) {
      L.push('Also floors: ' + set.extraSkills.map(id => (ADV.DATA.SKILLS[id] && ADV.DATA.SKILLS[id].name) || id).join(', '));
    }
    L.push('');
    L.push('Skills this set enhances (you do not need to know them yet):');
    const names = [];
    const seen = {};
    for (const [id, sk] of Object.entries(ADV.DATA.SKILLS || {})) {
      if (!sk || sk.noSlot || sk.universal) continue;
      const hit = (sk.archetype && set.archetypes && set.archetypes.includes(sk.archetype))
        || (set.extraSkills && set.extraSkills.includes(id));
      if (!hit || seen[sk.name]) continue;
      seen[sk.name] = true;
      names.push(sk.name + (sk.kind === 'perk' ? ' ◆' : ''));
    }
    if (!names.length) L.push('  (no listed skills)');
    else for (const n of names.slice(0, 24)) L.push('  · ' + n);
    if (names.length > 24) L.push('  · …');
    if (ch) {
      const mine = (ch.perks || []).concat(ch.actives || []).filter(e => {
        const sk = ADV.DATA.SKILLS[e.skillId];
        return sk && ((sk.archetype && set.archetypes.includes(sk.archetype)) || (set.extraSkills && set.extraSkills.includes(e.skillId)));
      }).map(e => ADV.DATA.SKILLS[e.skillId].name);
      L.push('');
      L.push(mine.length ? 'You already carry: ' + mine.join(', ') : 'You carry none of these yet — the floor still applies when you learn them.');
    }
    return L.join('\n');
  },
};

ADV.Tooltip = Tooltip;
ADV.SkillInfo = SkillInfo;
ADV.GearSetInfo = GearSetInfo;
})();
