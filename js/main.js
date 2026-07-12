/* ============================================================
   SPOORLOPER — init glue
   first interaction starts the underscore · sound toggle ·
   spotify card · lazy video loading
   ============================================================ */

(function () {
  const toggle = document.getElementById('sound-toggle');

  /* --- start audio on the first real gesture ------------- */
  function firstGesture() {
    SpoorAudio.markActivated();
    if (SpoorAudio.started) removeGestureListeners();
  }
  function removeGestureListeners() {
    ['pointerdown', 'keydown', 'touchend'].forEach(ev =>
      window.removeEventListener(ev, firstGesture));
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(ev =>
    window.addEventListener(ev, firstGesture, { passive: true }));

  /* scroll won't grant audio permission everywhere, but try anyway —
     on touch devices it does. */
  window.addEventListener('scroll', () => SpoorAudio.start(), { passive: true, once: false });

  /* --- sound toggle --------------------------------------
     The label promises "sound on" from the start — the music
     falls in at the first scroll or tap (browsers demand a
     gesture). Only a deliberate mute shows "sound off". */
  const soundLabel = document.getElementById('sound-label');
  function paintToggle() {
    const on = !SpoorAudio.muted;
    toggle.classList.toggle('is-on', on);
    soundLabel.textContent = on ? 'sound on' : 'sound off';
  }
  paintToggle();
  SpoorAudio.on('start', paintToggle);
  SpoorAudio.on('mute', paintToggle);

  /* the nudge has done its job once the music actually plays */
  const soundHint = document.getElementById('sound-hint');
  SpoorAudio.on('start', () => {
    gsap.to(soundHint, { opacity: 0, duration: 0.9, onComplete: () => soundHint.remove() });
  });

  toggle.addEventListener('click', () => {
    if (!SpoorAudio.started) {
      SpoorAudio.setMuted(false);   // also starts
    } else {
      SpoorAudio.setMuted(!SpoorAudio.muted);
    }
    paintToggle();
  });

  /* --- bookings: glide down to the landing ---------------- */
  const bookings = document.getElementById('bookings-link');
  if (bookings) {
    bookings.addEventListener('click', (e) => {
      e.preventDefault();
      const contact = document.getElementById('s-contact');
      const y = contact.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  }

  /* --- wake up: the TV comes back on, from the top --------- */
  const wake = document.getElementById('wake-up');
  if (wake) {
    wake.addEventListener('click', () => {
      wake.classList.remove('is-live');
      window.scrollTo({ top: 0, behavior: 'auto' });
      if (window.ScrollTrigger) ScrollTrigger.update();
      SpoorAudio.restartFromTop();
    });
  }

  /* --- spotify card -------------------------------------- */
  const playBtn = document.getElementById('spotify-play');
  const card = document.querySelector('.spotify-card');
  if (playBtn && card) {
    playBtn.addEventListener('click', () => {
      const playing = SpoorAudio.toggleTrack();
      card.classList.toggle('is-playing', playing);
      playBtn.innerHTML = playing ? '&#10073;&#10073;' : '&#9654;';
      playBtn.setAttribute('aria-label', playing ? 'Pause Swallow Gold' : 'Play Swallow Gold');
    });
    /* leaving the scene stops the track */
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: '#s-spotify',
        start: 'top bottom',
        end: 'bottom top',
        onLeave: () => { SpoorAudio.stopTrack(); card.classList.remove('is-playing'); playBtn.innerHTML = '&#9654;'; },
        onLeaveBack: () => { SpoorAudio.stopTrack(); card.classList.remove('is-playing'); playBtn.innerHTML = '&#9654;'; },
      });
    }
  }

  /* --- lazy-load videos when they come near --------------- */
  function loadVideo(v) {
    if (v.dataset.src && !v.getAttribute('src')) {
      v.src = v.dataset.src;
      v.load();
    }
  }
  window.loadVideo = loadVideo; // audio.js safety net
  if (window.ScrollTrigger) {
    document.querySelectorAll('video[data-src]').forEach(v => {
      ScrollTrigger.create({
        trigger: v.closest('.scene') || v,
        start: 'top 300%',   // two viewports before arrival
        once: true,
        onEnter: () => loadVideo(v),
      });
    });
  } else {
    document.querySelectorAll('video[data-src]').forEach(loadVideo);
  }
})();
