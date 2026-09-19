// Presentation-only censorship: preserve authored dialogue and saved names.
(function () {
'use strict';
const A = globalThis.ADV;
// Whole words and common inflections: do not damage assassin, class, Scunthorpe,
// cockatrice, hoarse, etc. Masked text keeps its length for typewriter timing.
const terms = [
  '(?:mother[- ]?)?fuck(?:s|ed|ers?|ing|in[\u0027\u2019]?|heads?|faces?|wits?)?',
  '(?:bull|horse|bat)?shit(?:s|ty|tier|tiest|ting|ted|heads?)?',
  'bitch(?:es|y|ing)?', 'cunt(?:s)?', 'bastard(?:s)?',
  'ass(?:es|holes?|hats?|wipes?)?', 'arse(?:s|holes?)?',
  'damn(?:s|ed|ing|it)?', 'god[- ]?damn(?:ed|it)?', 'hell(?:s)?',
  'piss(?:ed|es|ing)?', 'dick(?:s|heads?)?', 'cock(?:s|suckers?)?',
  'prick(?:s)?', 'twat(?:s)?', 'wank(?:ers?|ing)?', 'bollocks',
  'bugger(?:s|ed|ing)?', 'whore(?:s)?', 'slut(?:s|ty)?',
];
const pattern = new RegExp('(^|[^\\p{L}\\p{N}_])(' + terms.join('|') + ')(?=$|[^\\p{L}\\p{N}_])', 'giu');
const observers = new Set();
const texts = new Map();
let originalSetText;
const C = A.Censorship = {
  locked: () => A.Release?.target === 'crazygames',
  enabled: () => C.locked() || A.Prefs?.get().censorProfanity === true,
  mask(value) {
    if (Array.isArray(value)) return value.map(C.mask);
    if (typeof value !== 'string') return value;
    return value.replace(pattern, (_, prefix, word) => prefix + '*'.repeat(word.length));
  },
  contains(value) { return typeof value === 'string' && C.mask(value) !== value; },
  text(value) { return C.enabled() ? C.mask(value) : value; },
  label() { return 'Censor swearing: ' + (C.enabled() ? 'on' : 'off') + (C.locked() ? ' (locked)' : ''); },
  toggle() { if (!C.locked()) A.Prefs.set({ censorProfanity: !C.enabled() }); },
  watch(fn, owner) {
    observers.add(fn);
    const dispose = () => { observers.delete(fn); owner?.off?.('destroy', dispose); };
    owner?.once?.('destroy', dispose);
    return dispose;
  },
  refresh() {
    // Refresh already visible labels/logs without rewriting the underlying data.
    for (const [text, raw] of texts) originalSetText.call(text, C.text(raw));
    A.Music?.enforceCensorship?.();
    for (const fn of observers) fn();
  },
  installText(Phaser) {
    const proto = Phaser?.GameObjects?.Text?.prototype;
    if (!proto || originalSetText) return;
    originalSetText = proto.setText;
    proto.setText = function (value) {
      if (!texts.has(this)) this.once('destroy', () => texts.delete(this));
      texts.set(this, Array.isArray(value) ? value.slice() : value);
      return originalSetText.call(this, C.text(value));
    };
  },
  // Resolve the exact clip, including alternate tagged personality recordings.
  // Unmapped clips stay silent in censored mode instead of guessing they are clean.
  voiceText(path) {
    const parts = String(path).replace(/[?#].*$/, '').split('/');
    const start = parts.lastIndexOf('vo');
    if (start < 0) return null;
    const tail = parts.slice(start + 1), D = A.DATA;
    if (tail[0] === 'tutorial') return D.TUTORIAL_VO?.[tail[1]?.replace(/\.mp3$/, '')] ?? null;
    if (tail[0] === 'narrator') return A.Narrator?.lines?.[tail[1]?.replace(/\.mp3$/, '')] ?? null;
    const match = tail.at(-1)?.match(/^(.*)_(\d+)\.mp3$/);
    if (!match) return null;
    const key = match[1], index = Number(match[2]) - 1;
    const lineText = line => typeof line === 'string' ? line : line ? [line.t, line.v].filter(t => typeof t === 'string').join(' ') : null;
    if (tail[0] !== 'campaign') return lineText(D.DIALOGUE?.[tail.at(-2)]?.[key]?.[index]);
    const who = tail[1];
    for (const table of [D.CAMPAIGN3_DIALOGUE, D.CAMPAIGN2_DIALOGUE, D.CAMPAIGN_DIALOGUE]) {
      for (const cast of Object.values(table || {})) {
        const line = cast[who]?.[key]?.find((row, i) => (row.vo || i + 1) === index + 1);
        if (line != null) return lineText(line);
      }
    }
    if (key === 'exit') return lineText(D.CAMPAIGN_CHARS?.[who]?.exitLines?.[index]);
    if (key === 'roar') return lineText(D.MONSTER_VO?.[who]?.roar?.[index]);
    for (const [name, band] of [['GOD_LINE_DIALOGUE', 'open'], ['GOD_LINE_SMITE', 'smite'], ['GOD_LINE_HATRED', 'hatred']]) {
      if (band === key && D[name]?.[who]?.[index] != null) return lineText(D[name][who][index]);
    }
    for (const war of Object.values(D.FACTION_WAR_DIALOGUE || {})) {
      if (war.who === who && ['waropen', 'warboss'].includes(key)) return lineText(war[key === 'waropen' ? 'open' : 'boss']?.[index]);
    }
    if (who === D.GATE_EPILOGUE_VO?.speaker && index === 0) return D.GATE_EPILOGUE_VO.entries.find(row => row.key === key)?.text ?? null;
    return null;
  },
  voiceAllowed(path) {
    if (!C.enabled()) return true;
    const text = C.voiceText(path);
    return text !== null && !C.contains(text);
  },
};
})();
