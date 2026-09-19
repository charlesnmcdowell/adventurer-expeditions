// Music + voice playback. HTML5 Audio elements (they work from file:// where
// XHR-based loaders don't). One music channel with per-context rotation that
// switches up often, one voice channel for dialogue lines.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

// context -> track pool (audio/music/<name>.mp3). Single-track pools loop.
const POOLS = {
  // "Weight of the Quiet Man Edwyn theme 2" — the relaxing home-menu theme.
  title:    ['edwyn2'],
  town:     ['edwyn2'],
  creation: ['shop1', 'relax1'],
  quest:    ['forest1', 'forest2', 'night1', 'night2', 'fog1', 'origin1',
             'city1', 'city2', 'stars1', 'stars2', 'scabbard1', 'scabbard2',
             'gate1', 'inn1', 'inn2'],
  combat:   ['battle_clove', 'battle_ronin1', 'battle_ronin2', 'battle_fire1',
             'battle_fire2', 'battle_origin', 'battle_salute1', 'battle_salute2',
             'battle_riot1', 'battle_riot2'],
  boss:     ['boss1', 'boss2', 'gate2'],
  death:    ['edwyn1'],
};

const live = new Set();
let playGen = 0;

function bumpGen(el) {
  playGen++;
  if (el) el.__playGen = playGen;
  return playGen;
}

// Chrome will often honor a play() that resolves AFTER we paused. Stamp the
// generation so a late promise cannot restart a track we already left.
function pauseEl(el) {
  if (!el) return;
  el.__wantPlay = false;
  bumpGen(el);
  try { el.pause(); } catch (e) {}
}

function killEl(el) {
  pauseEl(el);
  if (!el) return;
  try { el.removeAttribute('src'); el.src = ''; el.load(); } catch (e) {}
  live.delete(el);
}

// Music sits under dialogue: while a voice clip plays the music channel drops
// to `duck` of its level (request: the score was drowning the campaign lines).
function voiceActive() {
  const v = Music.voiceEl;
  return !!(v && v.__wantPlay && !v.ended && !v.__playError);
}
function musicGain() {
  return Music.volume * (voiceActive() ? Music.duck : 1);
}
let rampTimer = null;
function rampMusic(ms) {
  const el = Music.el;
  if (rampTimer) { clearInterval(rampTimer); rampTimer = null; }
  if (!el || Music.muted) return;
  const target = musicGain();
  if (typeof setInterval !== 'function' || !ms) { try { el.volume = target; } catch (e) {} return; }
  const from = el.volume, steps = Math.max(1, Math.round(ms / 25));
  let i = 0;
  rampTimer = setInterval(() => {
    i++;
    const v = from + (target - from) * (i / steps);
    try { el.volume = Math.max(0, Math.min(1, v)); } catch (e) {}
    if (i >= steps) { clearInterval(rampTimer); rampTimer = null; }
  }, 25);
}

function playEl(el) {
  if (!el) return;
  if (el.__voicePath && ADV.Censorship && !ADV.Censorship.voiceAllowed(el.__voicePath)) {
    pauseEl(el);
    el.__censored = true;
    if (el === Music.voiceEl) rampMusic(200);
    return;
  }
  const gen = bumpGen(el);
  el.__wantPlay = true;
  el.__playError = null;
  el.__playBlocked = false;
  el.volume = Music.muted ? 0 : (el === Music.voiceEl ? 1 : musicGain());
  if (el === Music.voiceEl) rampMusic(120);
  if (Music.muted || Music.hidden || Music.movieHeld) return;
  const failed = err => {
    // A cancelled/older request belongs to the line we have already left.
    if (el.__playGen !== gen || !el.__wantPlay || err?.name === 'AbortError') return;
    el.__playBlocked = err?.name === 'NotAllowedError';
    el.__playError = err?.name || 'PlaybackError';
    if (el === Music.voiceEl) {
      console.warn('Voice playback failed:', el.src, el.__playError);
      rampMusic(200);
    }
  };
  let p;
  try { p = el.play(); } catch (err) { failed(err); return; }
  if (p && p.then) {
    p.then(() => {
      if (!el.__wantPlay || Music.hidden || Music.muted || Music.movieHeld || el.__censored) {
        try { el.pause(); } catch (e) {}
      } else if (el.__playGen === gen) {
        Music.unlocked = true;
        el.__playError = null;
        el.__playBlocked = false;
      }
      // An older play promise must not pause a newer resume on this element.
    }).catch(failed);
  }
}

function watch(el) {
  if (!el) return el;
  live.add(el);
  el.addEventListener('ended', () => {
    if (!el.__wantPlay) live.delete(el);
    if (el === Music.voiceEl) { el.__wantPlay = false; rampMusic(400); }   // voice done: music comes back up
  });
  el.addEventListener('error', () => {
    if (el === Music.voiceEl) {
      el.__wantPlay = false;
      el.__playError = 'MediaError:' + (el.error?.code || 'unknown');
      console.warn('Voice loading failed:', el.src, el.__playError);
      rampMusic(200);
    }
  });
  return el;
}

function pauseOthers(keep) {
  for (const el of live) {
    if (el !== keep && el !== Music.voiceEl) pauseEl(el);
  }
  if (Music.homeEl && Music.homeEl !== keep) pauseEl(Music.homeEl);
  if (Music.el && Music.el !== keep && Music.el !== Music.voiceEl) pauseEl(Music.el);
}

function haltAll(hard) {
  if (hard) {
    for (const el of live) killEl(el);
    killEl(Music.el);
    killEl(Music.homeEl);
    killEl(Music.voiceEl);
    live.clear();
    Music.el = null;
    Music.homeEl = null;
    Music.voiceEl = null;
    Music.track = null;
    return;
  }
  for (const el of live) pauseEl(el);
  pauseEl(Music.el);
  pauseEl(Music.homeEl);
  pauseEl(Music.voiceEl);
}

const Music = {
  el: null, voiceEl: null,
  context: null, track: null,
  queues: {}, muted: false, unlocked: false,
  volume: 0.4,
  duck: 0.45,                      // music level under a voice line (fraction of `volume`)
  hidden: false,

  init() {
    try { Music.muted = localStorage.getItem('adv:muted') === '1'; } catch (e) {}
    const unlock = () => {
      const first = !Music.unlocked;
      Music.unlocked = true;
      if (Music.hidden && Music.pageVisible()) Music.hidden = false;
      if (Music.hidden || Music.muted) return;
      if (first) Music.resumeCurrent();
      else if (Music.el?.__playBlocked) playEl(Music.el);
    };
    // Keep this listener: webviews can revoke playback after returning from
    // the background. Dialogue has a separate replay control for its voice.
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    if (typeof window === 'undefined') return;
    // Soft halt when the tab is hidden so one track can resume. Hard halt
    // on real close — otherwise looped HTML5 Audio keeps playing with no UI.
    // freeze/pagehide used to hard-kill and leave Music.hidden stuck with no
    // matching resume, which muted every later voice line until reload.
    window.addEventListener('pagehide', (ev) => Music.halt(!ev.persisted));
    window.addEventListener('pageshow', () => Music.wake());
    window.addEventListener('beforeunload', () => Music.halt(true));
    window.addEventListener('freeze', () => Music.halt(false));
    window.addEventListener('resume', () => Music.wake());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) Music.halt(false);
      else Music.wake();
    });
  },

  pageVisible() {
    return typeof document === 'undefined' || !document.hidden;
  },

  // Clear a stuck mute-from-background and start whatever should be playing.
  wake() {
    Music.hidden = false;
    if (Music.muted) return;
    Music.resumeCurrent();
  },

  halt(hard) {
    if (!hard && Music.voiceEl && Music.voiceEl.__wantPlay && !Music.voiceEl.ended) Music._voiceHeld = true;
    else Music._voiceHeld = false;
    Music.hidden = true;
    haltAll(!!hard);
  },

  resumeCurrent() {
    if (Music.hidden || Music.muted) return;
    if (Music.HOME.includes(Music.context) && Music.homeEl && Music.homeEl.src) {
      pauseOthers(Music.homeEl);
      Music.el = Music.homeEl;
      playEl(Music.homeEl);
    } else if (Music.el && Music.el.src) {
      pauseOthers(Music.el);
      playEl(Music.el);
    }
    if (Music.voiceEl?.src && (Music._voiceHeld || (Music.voiceEl.__wantPlay && Music.voiceEl.paused && !Music.voiceEl.ended))) {
      Music._voiceHeld = false;
      playEl(Music.voiceEl);
    }
  },

  nextTrack(context) {
    const pool = POOLS[context] || [];
    if (!pool.length) return null;
    if (pool.length === 1) return pool[0];
    let q = Music.queues[context];
    if (!q || !q.length) {
      q = pool.slice();
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
      }
      // avoid immediate repeat across reshuffles
      if (q[0] === Music.track && q.length > 1) q.push(q.shift());
      Music.queues[context] = q;
    }
    return q.shift();
  },

  // One track per quest (request): the run picks a track when the quest
  // starts and keeps it through every encounter and fight; boss quests draw
  // from the boss pool. Town/death/creation end the run.
  RUN_CONTEXTS: ['quest', 'combat', 'boss'],
  run: null,                       // {track} or {story:{quest,combat,boss}} while a quest is in progress

  // `story` (optional) is a scored run: {quest, combat, boss} track names. The
  // quest track carries every screen and dialogue; the combat track is heard
  // only inside a fight and the quest track resumes where it left off after
  // (request: no battle themes under the dialogue-heavy sections).
  startRun(isBoss, story) {
    if (story && story.quest) {
      Music.run = { story, track: story.quest };
      Music.storyEls = {};
      Music.context = 'quest';
      Music.cued = null;
      Music.playStory(story.quest);
      return;
    }
    const pool = isBoss ? POOLS.boss : POOLS.quest.concat(POOLS.combat);
    let name = pool[Math.floor(Math.random() * pool.length)];
    if (name === Music.lastRunTrack && pool.length > 1) name = pool[(pool.indexOf(name) + 1) % pool.length];
    Music.lastRunTrack = name;
    Music.run = { track: name };
    Music.context = 'quest';
    Music.startNamed(name, true);
  },
  endRun() { Music.run = null; Music.storyEls = null; },

  // A saved quest may say musicStarted even though this browser session has
  // no audio run. Rebuild its score instead of falling into the random pools.
  // Also used by the return journey, after game.quest has been settled.
  playQuest(quest, context = 'quest') {
    const story = ADV.Campaign3 && ADV.Campaign3.musicFor(quest);
    if (!Music.run || (story ? Music.run.story?.quest !== story.quest : Music.run.story)) {
      Music.startRun(!!quest?.isBoss, story);
    }
    Music.play(context);
  },

  // Story tracks are cached per run so leaving a fight resumes the underscore
  // mid-phrase instead of restarting it.
  storyEls: null,
  playStory(name) {
    pauseEl(Music.homeEl);
    const els = Music.storyEls || (Music.storyEls = {});
    let el = els[name];
    if (!el || !el.src) {
      el = els[name] = watch(new Audio('audio/music/' + name + '.mp3'));
      el.__name = name; el.loop = true;
    }
    pauseOthers(el);
    Music.el = el; Music.track = name;
    if (el.paused || !el.__wantPlay) playEl(el);
    else { try { el.volume = Music.muted ? 0 : musicGain(); } catch (e) {} }
  },
  storyTrackFor(context) {
    const s = Music.run && Music.run.story;
    if (!s) return null;
    if (Music.cued) return Music.cued;
    if (context === 'boss') return s.boss || s.combat || s.quest;
    if (context === 'combat') return s.combat || s.quest;
    return s.quest;
  },

  // A cue overrides the run's quest track (a dream, the ending) until cleared
  // or until the next context change.
  cued: null,
  cue(name) {
    Music.cued = name || null;
    if (name) {
      if (Music.run && Music.run.story) Music.playStory(name);
      else { if (!Music.cueReturn) Music.cueReturn = { context: Music.context }; Music.context = 'cue'; Music.startNamed(name, true); }
    } else if (Music.run && Music.run.story) {
      Music.playStory(Music.storyTrackFor(Music.context));
    } else if (Music.cueReturn) {
      const back = Music.cueReturn; Music.cueReturn = null;
      Music.context = null;
      if (back.context) Music.play(back.context);
      else pauseEl(Music.el);
    }
  },

  play(context) {
    if (Music.cued && Music.context === 'cue') Music.cueReturn = null;
    Music.cued = null;
    if (Music.RUN_CONTEXTS.includes(context)) {
      if (Music.run && Music.run.story) {                // scored run: quest track outside fights, battle track inside
        Music.context = context;
        Music.playStory(Music.storyTrackFor(context));
        return;
      }
      if (Music.run) {                                   // mid-quest: keep the quest's track going
        Music.context = context;
        Music.leaveHome();
        if (Music.el && Music.el.__name === Music.run.track) {
          pauseOthers(Music.el);
          if (Music.el.paused) playEl(Music.el);
        }
        return;
      }
    } else Music.endRun();
    // the one track a context can want (home contexts may be overridden by a story hub)
    const want = (Music.HOME.includes(context) && Music.homeOverride) || ((POOLS[context] || []).length === 1 ? POOLS[context][0] : null);
    if (Music.context === context && Music.el && !Music.el.paused && Music.el.__wantPlay && (!want || want === Music.el.__name)) return;
    // seamless carry-over when both contexts sit on the same single track
    if (Music.el && !Music.el.paused && Music.el.__wantPlay && Music.context && want && want === Music.el.__name &&
        (Music.homeOverride || (POOLS[Music.context] || []).length === 1)) {
      Music.context = context;
      return;
    }
    Music.context = context;
    Music.start(context, false);
  },

  // The home theme is one element for the whole session: it loops, and when
  // the player leaves town it pauses where it is and resumes there on return
  // (request: keep "Weight of the Quiet Man" playing on the home screen).
  HOME: ['title', 'town'],
  homeEl: null,

  pauseEl,
  pauseHome() { pauseEl(Music.homeEl); },
  leaveHome() {
    const keep = (Music.el && Music.el !== Music.homeEl) ? Music.el : null;
    pauseEl(Music.homeEl);
    if (Music.el === Music.homeEl) Music.el = null;
    pauseOthers(keep);
  },

  // A story hub can swap the home theme for its own camp cue (homeOverride);
  // pause/resume behaviour stays the same.
  homeOverride: null,

  start(context, force) {
    const isHome = Music.HOME.includes(context);
    const name = (isHome && Music.homeOverride) || Music.nextTrack(context);
    if (!name) return;
    let el;
    if (isHome && Music.homeEl && Music.homeEl.__name === name && Music.homeEl.src) {
      el = Music.homeEl;                                   // resume where it left off
    } else {
      if (isHome && Music.homeEl) pauseEl(Music.homeEl);
      el = watch(new Audio('audio/music/' + name + '.mp3'));
      el.__name = name;
      const single = (POOLS[context] || []).length === 1;
      el.loop = single || isHome;
      el.addEventListener('ended', () => {
        if (!el.__wantPlay || Music.el !== el) return;
        if (el.loop) {
          try { el.currentTime = 0; } catch (e) {}
          playEl(el);
        } else if (Music.context === context) Music.start(context, false);
      });
      if (isHome) Music.homeEl = el;
    }
    pauseOthers(el);
    Music.el = el;
    Music.track = name;
    playEl(el);
  },

  // Play one named track, looping or not, replacing whatever is on.
  startNamed(name, loop) {
    pauseEl(Music.homeEl);
    const el = watch(new Audio('audio/music/' + name + '.mp3'));
    el.__name = name; el.loop = !!loop;
    pauseOthers(el);
    Music.el = el; Music.track = name;
    playEl(el);
  },

  // Force a rotation step ("switch it up") without changing context.
  rotate() { if (Music.context) Music.start(Music.context, false); },

  toggleMute() {
    Music.muted = !Music.muted;
    try { localStorage.setItem('adv:muted', Music.muted ? '1' : '0'); } catch (e) {}
    if (Music.muted) {
      Music._voiceHeld = !!(Music.voiceEl?.__wantPlay && !Music.voiceEl.ended);
      haltAll(false); if (ADV.CombatPresentation) ADV.CombatPresentation.stop();
    }
    else Music.resumeCurrent();
    return Music.muted;
  },

  // ---- voice channel --------------------------------------------------------
  // If a freeze/pagehide left hidden=true while the tab is back, unstick so
  // the new clip can actually play().
  _readyVoice() {
    Music._voiceHeld = false;
    if (Music.hidden && Music.pageVisible()) Music.hidden = false;
  },
  voiceUrl(path) {
    const hash = ADV.DATA.VOICE_HASHES && ADV.DATA.VOICE_HASHES[path];
    const local = ADV.Release?.localVoicePrefixes?.some(prefix => path.startsWith(prefix));
    const source = !local && ADV.Release?.voiceBase && path.startsWith('audio/vo/')
      ? ADV.Release.voiceBase + path.slice('audio/vo/'.length) : path;
    return source + (hash ? '?v=' + hash : '');
  },
  // Called directly from the dialogue button so a browser that rejected the
  // automatic request gets a fresh user gesture. Never revive an older line.
  replayVoice(expected) {
    const el = Music.voiceEl;
    if (!el || el !== expected || !el.src || Music.muted || !Music.pageVisible() || (ADV.Censorship && !ADV.Censorship.voiceAllowed(el.__voicePath))) return false;
    Music.hidden = false;
    Music._voiceHeld = false;
    try { if (el.error) el.load(); el.currentTime = 0; } catch (e) {}
    playEl(el);
    return true;
  },
  enforceCensorship() {
    if (Music.voiceEl && ADV.Censorship && !ADV.Censorship.voiceAllowed(Music.voiceEl.__voicePath)) Music.stopVoice();
  },
  _voiceElement(path) {
    if (ADV.Censorship && !ADV.Censorship.voiceAllowed(path)) return null;
    const el = watch(new Audio(Music.voiceUrl(path)));
    el.__voicePath = path;
    return el;
  },
  speakFile(personalityId, band, idx, tag) {
    if (!personalityId) return;
    Music._readyVoice();
    Music.stopVoice();
    const plain = 'audio/vo/' + personalityId + '/' + band + '_' + idx + '.mp3';
    const src = tag ? 'audio/vo/' + tag + '/' + personalityId + '/' + band + '_' + idx + '.mp3' : plain;
    const el = Music._voiceElement(src);
    if (!el) return;
    if (tag) {
      el.addEventListener('error', () => {
        if (Music.voiceEl !== el) return;
        const fb = Music._voiceElement(plain);
        if (!fb) { Music.stopVoice(); return; }
        killEl(el);
        Music.voiceEl = fb;
        playEl(fb);
      }, { once: true });
    }
    Music.voiceKind = 'dialogue';
    Music.voiceEl = el;
    playEl(el);
  },
  // campaign lines are name-free clips keyed by character, beat and index (§8)
  speakCampaign(who, key, idx) {
    Music._readyVoice();
    Music.stopVoice();
    const el = Music._voiceElement('audio/vo/campaign/' + who + '/' + key + '_' + idx + '.mp3');
    if (!el) return;
    Music.voiceKind = 'campaign';
    Music.voiceEl = el;
    playEl(el);
  },
  speakTutorial(id) {
    if (!id) return;
    Music._readyVoice();
    Music.stopVoice();
    const el = Music._voiceElement('audio/vo/tutorial/' + id + '.mp3');
    if (!el) return;
    Music.voiceKind = 'tutorial';
    Music.voiceEl = el;
    playEl(el);
  },
  speakNarrator(id) {
    if (!id) return;
    Music._readyVoice(); Music.stopVoice();
    const el = Music._voiceElement('audio/vo/narrator/' + id + '.mp3');
    if (!el) return;
    Music.voiceKind = 'narrator'; Music.voiceEl = el; playEl(el);
  },
  stopVoice() {
    Music._voiceHeld = false;
    Music.voiceKind = null;
    if (Music.voiceEl) { killEl(Music.voiceEl); Music.voiceEl = null; rampMusic(300); }
  },
  // Close a tutor card without killing an NPC / campaign line that just started.
  stopTutorial() {
    if (Music.voiceKind === 'tutorial') Music.stopVoice();
  },

  // small speaker toggle for a scene corner
  button(scene, x, y) {
    const label = () => Music.muted ? '♪ off' : '♪ on';
    const t = ADV.T.text(scene, x, y, label(), { size: 12, ox: 1, color: ADV.T.css.inkDim })
      .setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => { Music.toggleMute(); t.setText(label()); });
    return t;
  },
};

Music.init();
ADV.Music = Music;
})();
