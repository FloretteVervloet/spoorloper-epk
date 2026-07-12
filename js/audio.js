/* ============================================================
   SPOORLOPER — audio engine
   Nightshop loops underneath everything. Videos and the
   Spotify card push it away; it always seeps back in.
   ============================================================ */

window.SpoorAudio = (function () {
  const BASE_VOL = 0.75;
  const FADE = 1.1; // seconds

  const nightshop = new Audio('assets/audio/nightshop.mp3');
  nightshop.loop = true;
  nightshop.preload = 'auto';
  nightshop.volume = 0;

  const swallowGold = new Audio('assets/audio/swallow-gold.mp3');
  swallowGold.loop = true;
  swallowGold.preload = 'none';
  swallowGold.volume = 0;

  let started = false;      // nightshop actually playing
  let activated = false;    // browser granted user activation
  let muted = false;
  let dead = false;         // the TV is off — nothing makes sound
  let focus = null;         // current audible video element (pinned scene)
  let trackPlaying = false; // Spotify card state
  const listeners = { start: [], mute: [], blocked: [] };

  function emit(ev, arg) { listeners[ev].forEach(fn => fn(arg)); }
  function on(ev, fn) { listeners[ev].push(fn); }

  function fade(media, vol, dur = FADE) {
    gsap.to(media, { volume: vol, duration: dur, ease: 'sine.inOut', overwrite: 'auto' });
  }

  /* Try to start the underscore. Needs user activation in most browsers;
     retried on every interaction until it sticks. */
  function start() {
    if (started || muted) return;
    const p = nightshop.play();
    if (p) p.then(() => {
      started = true;
      activated = true;
      if (!focus && !trackPlaying && !dead) fade(nightshop, BASE_VOL, 2.4);
      emit('start');
    }).catch(() => { /* not yet — next gesture will retry */ });
  }

  function markActivated() { activated = true; start(); }

  /* --- video pin moments --------------------------------
     Hard rule: only one audible source at a time. Taking focus
     silences the previous holder immediately (fast fade), and
     the underscore only creeps back once nothing else claims it. */
  function silenceVideo(video, fast) {
    gsap.killTweensOf(video);
    gsap.to(video, {
      volume: 0, duration: fast ? 0.35 : FADE * 0.6, ease: 'sine.out', overwrite: 'auto',
      onComplete: () => { if (focus !== video) video.pause(); }
    });
  }

  function duckForVideo(video) {
    if (focus && focus !== video) silenceVideo(focus, true);
    focus = video;
    stopTrack(true);
    gsap.killTweensOf(nightshop);
    fade(nightshop, 0, 0.6);
    if (window.loadVideo) window.loadVideo(video);
    /* the visuals ALWAYS run: without sound permission we simply
       play muted (allowed everywhere) — the dream never freezes */
    const soundless = !started || muted;
    video.muted = soundless;
    if (video.paused) video.volume = 0;
    const p = video.play();
    if (p) p.catch(() => {
      /* even muted playback refused (very locked-down browser):
         force-mute and try once more */
      if (focus !== video) return;
      video.muted = true;
      const retry = video.play();
      if (retry) retry.catch(() => {});
    });
    /* invite sound on the playing video — only for visitors who
       never made a sound choice yet */
    if (!started && !activated) emit('blocked', video);
    fade(video, soundless ? 0 : 1);
  }

  /* the "sound on" chip on a playing video: one click unmutes it
     IN PLACE (no re-scroll) and unlocks the whole soundscape */
  function enableFromVideo(video) {
    muted = false;
    activated = true;
    nightshop.muted = false;
    swallowGold.muted = false;
    document.querySelectorAll('video').forEach(v => { v.muted = false; });
    duckForVideo(video);   /* claims focus; video keeps playing */
    video.muted = false;   /* unmute mid-play, right where they are */
    fade(video, 1);
    start();               /* underscore starts (stays ducked at 0) */
    emit('mute');          /* repaint the toggle */
  }

  function releaseVideo(video) {
    if (focus === video) focus = null;
    silenceVideo(video, false);
    /* wait a beat: if another scene claims focus right away,
       the underscore stays out of the way */
    gsap.delayedCall(0.25, () => {
      if (!focus && !trackPlaying && started && !muted && !dead) fade(nightshop, BASE_VOL);
    });
  }

  /* --- Spotify card (Swallow Gold) ----------------------- */
  function toggleTrack() {
    if (trackPlaying) { stopTrack(); return false; }
    markActivated();
    trackPlaying = true;
    fade(nightshop, 0);
    swallowGold.muted = muted;
    const p = swallowGold.play();
    if (p) p.catch(() => {});
    fade(swallowGold, muted ? 0 : 1);
    return true;
  }

  function stopTrack(silent) {
    if (!trackPlaying) return;
    trackPlaying = false;
    gsap.to(swallowGold, {
      volume: 0, duration: FADE * 0.7, ease: 'sine.inOut', overwrite: 'auto',
      onComplete: () => swallowGold.pause()
    });
    if (!silent && !focus && started && !muted) fade(nightshop, BASE_VOL);
  }

  /* --- global mute --------------------------------------- */
  function setMuted(m) {
    muted = m;
    nightshop.muted = m;
    swallowGold.muted = m;
    document.querySelectorAll('video').forEach(v => { v.muted = m; });
    if (!m) {
      if (!started) start();
      if (focus) fade(focus, 1);
      else if (trackPlaying) fade(swallowGold, 1);
      else if (started && !dead) fade(nightshop, BASE_VOL);
    }
    emit('mute');
  }

  /* --- the amp pops: hard power cut at the end of the dream --- */
  let popCtx = null;
  function ampPop() {
    dead = true;
    gsap.killTweensOf(nightshop);
    gsap.killTweensOf(swallowGold);
    nightshop.volume = 0;
    swallowGold.volume = 0;
    if (focus) { gsap.killTweensOf(focus); focus.volume = 0; }
    if (muted || !started) return;
    try {
      popCtx = popCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (popCtx.state === 'suspended') popCtx.resume();
      const t = popCtx.currentTime;
      /* soft-clip the sum so it can be LOUD without wrecking speakers */
      const comp = popCtx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 14;
      comp.connect(popCtx.destination);
      /* the thump — a speaker cone giving out */
      const osc = popCtx.createOscillator();
      const g = popCtx.createGain();
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.25);
      g.gain.setValueAtTime(1.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(g).connect(comp);
      osc.start(t); osc.stop(t + 0.6);
      /* the crack — circuitry snapping */
      const crack = popCtx.createOscillator();
      crack.type = 'square';
      const gc = popCtx.createGain();
      crack.frequency.setValueAtTime(900, t);
      crack.frequency.exponentialRampToValueAtTime(90, t + 0.07);
      gc.gain.setValueAtTime(0.5, t);
      gc.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      crack.connect(gc).connect(comp);
      crack.start(t); crack.stop(t + 0.1);
      /* the click — static discharge */
      const len = Math.floor(popCtx.sampleRate * 0.07);
      const buf = popCtx.createBuffer(1, len, popCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = popCtx.createBufferSource();
      src.buffer = buf;
      const g2 = popCtx.createGain();
      g2.gain.value = 0.65;
      src.connect(g2).connect(comp);
      src.start(t);
    } catch (e) { /* silence is also an ending */ }
  }

  /* scrolling back up: the power hums back on */
  function powerBack() {
    dead = false;
    if (started && !muted && !focus && !trackPlaying) fade(nightshop, BASE_VOL, 2.4);
  }

  /* wake up: back to the top, the dream restarts from the beginning */
  function restartFromTop() {
    dead = false;
    try { nightshop.currentTime = 0; } catch (e) {}
    if (started && !muted) fade(nightshop, BASE_VOL, 1.6);
  }

  /* Subtle life: scroll velocity leans on the underscore volume. */
  let calmTimer = null;
  function onScrollVelocity(v) {
    if (!started || muted || dead || focus || trackPlaying) return;
    const dip = Math.min(Math.abs(v) / 6000, 0.3);
    nightshop.volume = Math.max(BASE_VOL - dip, 0.4);
    clearTimeout(calmTimer);
    calmTimer = setTimeout(() => {
      if (!focus && !trackPlaying && !muted && !dead && started) fade(nightshop, BASE_VOL, 1.6);
    }, 220);
  }

  return {
    start, markActivated, duckForVideo, releaseVideo, enableFromVideo,
    toggleTrack, stopTrack, setMuted, onScrollVelocity, on,
    ampPop, powerBack, restartFromTop,
    get muted() { return muted; },
    get started() { return started; },
    get trackPlaying() { return trackPlaying; },
    get dead() { return dead; },
    get level() { return nightshop.volume; }
  };
})();
