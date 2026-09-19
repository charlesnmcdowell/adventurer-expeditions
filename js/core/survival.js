// Hunger and shelter. Player-only. One stacking multiplier; four stacks kill.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const STACK_COST = 0.25;
const KILL_AT = 4;
const SHELTER_QUESTS = 5;
const SETTLED = 'brick';

const Survival = {};
Survival.STACK_COST = STACK_COST;
Survival.KILL_AT = KILL_AT;
Survival.SHELTER_QUESTS = SHELTER_QUESTS;

function settled(ch) {
  if (!ADV.Housing) return false;
  return ADV.Housing.rank(ADV.Housing.of(ch).id) >= ADV.Housing.rank(SETTLED);
}

Survival.state = function (ch) {
  if (!ch) return { hunger: 0, questsSinceShelter: 0, sick: false, sickStacks: 0, favoriteFoodId: null, autoBuyFood: false, questTicks: 0 };
  if (!ch.survival) {
    ch.survival = { hunger: 0, questsSinceShelter: 0, sick: false, sickStacks: 0, favoriteFoodId: null, autoBuyFood: false, questTicks: 0 };
  }
  const s = ch.survival;
  if (s.hunger == null) s.hunger = 0;
  if (s.questsSinceShelter == null) s.questsSinceShelter = 0;
  if (s.sick == null) s.sick = false;
  if (s.sickStacks == null) s.sickStacks = s.sick ? 1 : 0;
  if (s.favoriteFoodId == null) s.favoriteFoodId = null;
  if (s.autoBuyFood == null) s.autoBuyFood = false;
  if (s.questTicks == null) s.questTicks = 0;
  return s;
};

Survival.stacks = function (ch) {
  if (!ch || !ch.isPlayer) return 0;
  const s = Survival.state(ch);
  return (s.hunger || 0) + (s.sick ? (s.sickStacks || 0) : 0);
};

Survival.statMult = function (ch) {
  if (!ch || !ch.isPlayer) return 1;
  const n = Survival.stacks(ch);
  return Math.max(0, 1 - STACK_COST * n);
};

function clampHp(ch) {
  if (!ch || !ADV.Character) return;
  const max = ADV.Character.maxHp(ch);
  if (ch.combatHp != null && ch.combatHp > max) ch.combatHp = max;
}

Survival.eatCures = function (ch) {
  if (!ch || !ch.isPlayer) return;
  const s = Survival.state(ch);
  const had = s.hunger > 0;
  s.hunger = 0;
  clampHp(ch);
  return had;
};

Survival.shelterDeadline = function (ch) {
  if (!ch || !ch.isPlayer || settled(ch)) return Infinity;
  const s = Survival.state(ch);
  return Math.max(0, SHELTER_QUESTS - (s.questsSinceShelter || 0));
};

Survival.onMovedUp = function (ch) {
  if (!ch || !ch.isPlayer) return;
  const s = Survival.state(ch);
  s.questsSinceShelter = 0;
  s.sick = false;
  s.sickStacks = 0;
  clampHp(ch);
};

function jiltAll(game, player) {
  if (!game || !ADV.Rel) return 0;
  const ids = ADV.Rel.partnerIds ? ADV.Rel.partnerIds(player).slice() : (player.partnerId ? [player.partnerId] : []);
  let n = 0;
  for (const id of ids) {
    const spouse = ADV.World.byId(game.world, id);
    if (!spouse || !spouse.alive) continue;
    ADV.Rel.jilt(game.world, spouse, player);
    n++;
  }
  return n;
}

Survival.onQuestResolved = function (game) {
  const out = { hunger: 0, sick: false, died: false, jilted: 0, ate: false, becameSick: false };
  if (!game || !ADV.Game) return out;
  const ch = ADV.Game.player(game);
  if (!ch || !ch.isPlayer) return out;
  const alreadyDead = !!(game.quest && game.quest.playerDead) || !!game.pendingDeath;
  const ate = !!ch.meal;
  out.ate = ate;
  if (ADV.Character && ADV.Character.digest) ADV.Character.digest(ch);
  const s = Survival.state(ch);
  if (ate) {
    Survival.eatCures(ch);
  } else {
    s.hunger = (s.hunger || 0) + 1;
  }
  out.hunger = s.hunger;
  if (!settled(ch)) {
    s.questsSinceShelter = (s.questsSinceShelter || 0) + 1;
    if (s.questsSinceShelter >= SHELTER_QUESTS) {
      if (!s.sick) {
        s.sick = true;
        s.sickStacks = 1;
        out.becameSick = true;
        out.jilted = jiltAll(game, ch);
      } else {
        s.sickStacks = (s.sickStacks || 1) + 1;
      }
    }
  }
  out.sick = !!s.sick;
  clampHp(ch);
  if (s.autoBuyFood && s.favoriteFoodId && ((s.questTicks || 0) % 2 === 0)) {
    const buy = ADV.Character && ADV.Character.tryAutoBuyMeal
      ? ADV.Character.tryAutoBuyMeal(ch) : { ok: false, error: 'no grocer' };
    if (buy && buy.ok) {
      const food = (ADV.DATA.FOODS || []).find(f => f.id === s.favoriteFoodId);
      out.autoBought = { id: s.favoriteFoodId, name: (ch.meal && ch.meal.name) || (food && food.name), cost: food ? food.cost : 0 };
      out.hunger = s.hunger;
    } else {
      out.autoBuyFailed = (buy && buy.error) || 'could not buy';
    }
  }
  s.questTicks = (s.questTicks || 0) + 1;
  if (!alreadyDead && Survival.stacks(ch) >= KILL_AT) {
    out.died = true;
    ADV.Game.onPlayerDeath(game, null);
  }
  return out;
};

Survival.warnings = function (game) {
  const list = [];
  if (!game || !ADV.Game) return list;
  const ch = ADV.Game.player(game);
  if (!ch || !ch.isPlayer) return list;
  const s = Survival.state(ch);
  if (s.hunger > 0) {
    const left = ['three quarters', 'half', 'a quarter', 'none'][Math.min(3, s.hunger - 1)];
    list.push({ severity: s.hunger >= 3 ? 'blood' : 'gold',
      text: s.hunger === 2 ? 'Hungry ×2 — half your strength.'
        : s.hunger === 1 ? 'Hungry ×1 — a quarter of your strength gone.'
        : s.hunger === 3 ? 'Hungry ×3 — a quarter of your strength left.'
        : 'Hungry ×' + s.hunger + ' — ' + left + ' of your strength.' });
  }
  if (s.sick) {
    list.push({ severity: 'blood', text: s.sickStacks > 1
      ? 'Sick ×' + s.sickStacks + ' — the damp is stacking with the hunger.'
      : 'Sick — a roof would have stopped this.' });
  } else {
    const left = Survival.shelterDeadline(ch);
    if (left <= 2 && left !== Infinity) {
      list.push({ severity: 'blood', text: left === 0
        ? 'The next night on this rung will make you sick.'
        : left === 1 ? 'One quest left on this roof before the damp takes you.'
        : 'Two quests left on this roof before the damp takes you.' });
    }
  }
  return list;
};

ADV.Survival = Survival;
})();
