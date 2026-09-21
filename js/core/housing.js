// Player housing: six dwellings (the roadside camp plus five purchases).
// Bigger roofs hold more spouses without a jilt. Town art keys off homeId.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

ADV.DATA.HOMES = [
  { id: 'camp',     name: 'Sleeping rough',     cost: 0,    spouses: 1, title: 'THE ROADSIDE',
    blurb: 'A bedroll outside the walls. The village is a cluster of lights you do not live in.' },
  { id: 'inn',      name: 'A room at the inn',  cost: 100,  spouses: 1, title: 'THE INN',
    blurb: 'Four walls, a bed, and a window over the yard. Yours for as long as you pay the keep.' },
  { id: 'cottage',  name: 'Wood cottage',       cost: 200,  spouses: 1, title: 'THE COTTAGE',
    blurb: 'A timber cottage with a garden path and smoke at the chimney.' },
  { id: 'brick',    name: 'Brick house',        cost: 350,  spouses: 2, title: 'THE BRICK HOUSE',
    blurb: 'A proper brick house on the cobbles. Room enough for two spouses under one roof.' },
  { id: 'mansion',  name: 'Grand house',        cost: 500,  spouses: 3, title: 'THE HOUSE',
    blurb: 'A luxury mansion on a circular drive, with horses at the posts. Three spouses may share it.' },
  { id: 'castle',   name: 'Castle',             cost: 1000, spouses: 5, title: 'THE CASTLE',
    blurb: 'A giant fantasy keep. Five spouses, and the village looks up at you.' },
];

const Housing = {};
Housing.list = function () { return ADV.DATA.HOMES; };
Housing.byId = function (id) {
  return ADV.DATA.HOMES.find(h => h.id === id) || ADV.DATA.HOMES[0];
};
Housing.of = function (ch) {
  return Housing.byId(ch && ch.homeId ? ch.homeId : 'camp');
};
Housing.rank = function (id) {
  const i = ADV.DATA.HOMES.findIndex(h => h.id === id);
  return i < 0 ? 0 : i;
};
Housing.spouseCap = function (ch) {
  if (!ch || !ch.isPlayer) return 1;
  return Housing.of(ch).spouses;
};
Housing.canTakeSpouse = function (ch) {
  if (!ch) return false;
  const n = ADV.Rel && ADV.Rel.partnerIds ? ADV.Rel.partnerIds(ch).length : (ch.partnerId ? 1 : 0);
  return n < Housing.spouseCap(ch);
};
// Town backdrop lighting follows the world clock: day, evening, night, repeat.
Housing.SKY_PHASES = ['day', 'evening', 'night'];
Housing.timeOfDay = function (clock) {
  const n = ((clock | 0) % 3 + 3) % 3;
  return Housing.SKY_PHASES[n];
};

Housing.buy = function (game, homeId) {
  const p = ADV.Game.player(game);
  const next = Housing.byId(homeId);
  if (!next || next.id === 'camp') return { ok: false, error: 'that is not for sale' };
  const cur = Housing.of(p);
  if (Housing.rank(next.id) <= Housing.rank(cur.id)) return { ok: false, error: 'you already live somewhere finer' };
  if ((p.inventory.gold || 0) < next.cost) return { ok: false, error: 'you cannot afford it' };
  p.inventory.gold -= next.cost;
  p.homeId = next.id;
  ADV.World.feed(game.world, `${p.name} took ${next.name === 'Castle' ? 'the castle' : next.name}.`, [p.id]);
  if (ADV.Survival) ADV.Survival.onMovedUp(p);
  return { ok: true, home: next, first: cur.id === 'camp' };
};

ADV.Housing = Housing;
})();
