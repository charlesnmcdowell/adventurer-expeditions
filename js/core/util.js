// Small shared helpers.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

ADV.util = {
  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
  cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; },
  // Dialogue token substitution (§17a): names in text, written pronouns in voice.
  renderLine(line, ctx) {
    // ctx: {target, them, partner, self} — names (or null)
    let out = line;
    out = out.replace(/\{target\}/g, ctx.target || 'friend');
    out = out.replace(/\{they\}/g, ctx.them || 'they');
    out = out.replace(/\{them\}/g, ctx.them || 'them');
    out = out.replace(/\{their\}/g, ctx.them ? ctx.them + "'s" : 'their');
    out = out.replace(/\{partner\}/g, ctx.partner || 'someone');
    out = out.replace(/\{self\}/g, ctx.self || '');
    out = out.replace(/\[[a-z ]+\]\s*/gi, '');   // delivery cues are for the voice, not the text box
    if (out) out = out[0].toUpperCase() + out.slice(1);
    return out;
  },
  lineNeeds(line) {
    const needs = [];
    if (/\{them\}|\{their\}|\{they\}/.test(line)) needs.push('them');
    if (/\{partner\}/.test(line)) needs.push('partner');
    return needs;
  },
  // Pick a dialogue line for a speaker (§17a): band by tier, warmth by score,
  // never the same variant twice running, conditional lines excluded when
  // their token can't resolve, fallback INSIDE the same band only.
  speak(world, speaker, band, ctx) {
    const r = ADV.util.speakEx(world, speaker, band, ctx);
    return r ? r.text : null;
  },
  // Full form: returns {text, band, idx} so callers can play the matching
  // voice clip (audio/vo/{pid}/{band}_{idx+1}.mp3, §17a asset layout).
  speakEx(world, speaker, band, ctx) {
    ctx = ctx || {};
    const D = ADV.DATA.DIALOGUE;
    const p = speaker.personalityId ? D[speaker.personalityId] : null;
    if (!p) return null;
    const lines = p[band];
    if (!lines || !lines.length) return null;
    const rules = p.replyFamilies && p.replyFamilies[band];
    const usable = [];
    const matched = [];
    for (let i = 0; i < lines.length; i++) {
      const needs = ADV.util.lineNeeds(lines[i]);
      if (needs.includes('them') && !ctx.them) continue;
      if (needs.includes('partner') && !ctx.partner) continue;
      usable.push(i);
      if (ctx.replyTo && rules && rules[i] && rules[i].includes(ctx.replyTo)) matched.push(i);
    }
    if (!usable.length) return null; // show no box rather than the wrong voice (§17a)
    speaker.lastVariantUsed = speaker.lastVariantUsed || {};
    const last = speaker.lastVariantUsed[band];
    // Unknown subjects stay silent. A spent thanks or greeting pool must still
    // be able to use the rest of the band — that is why they have many replies.
    if (ctx.replyTo && !matched.length) return null;
    const family = ctx.replyTo ? matched : usable;
    // Walk every eligible line in order (round-robin). Relationship score only
    // chooses where the cycle starts, never shrinks the pool to two greetings.
    let preferred = family.slice();
    if (ctx.score != null && usable.length >= 2 && !ctx.replyTo) {
      const intensity = band === 'hatred' ? Math.abs(ctx.score) : ctx.score;
      const pos = band === 'general' ? (intensity + 49) / 98 : (intensity - 50) / 50;
      const start = Math.max(0, Math.min(usable.length - 1, Math.floor(pos * usable.length)));
      preferred = usable.slice(start).concat(usable.slice(0, start));
    }
    speaker.dialogueRotation = speaker.dialogueRotation || {};
    const signature = (ADV.DATA.DIALOGUE_REVISION || '') + ':' + usable.join(',');
    let rotation = speaker.dialogueRotation[band];
    if (!rotation || rotation.signature !== signature || !Array.isArray(rotation.used)) {
      rotation = speaker.dialogueRotation[band] = { signature, used: [] };
    }
    const take = list => {
      const avail = list.filter(i => !rotation.used.includes(i) && i !== last);
      if (avail.length) return avail[0];
      const rest = list.filter(i => !rotation.used.includes(i));
      return rest.length ? rest[0] : null;
    };
    let idx = take(preferred);
    if (idx == null) idx = take(family);
    if (idx == null) idx = take(usable);
    if (idx == null) {
      rotation.used = [];
      idx = take(preferred);
      if (idx == null) idx = take(family);
      if (idx == null) idx = take(usable);
    }
    if (idx == null) idx = usable[0];
    speaker.lastVariantUsed[band] = idx;
    rotation.used.push(idx);
    return { text: ADV.util.renderLine(lines[idx], ctx), band, idx };
  },
};
})();
