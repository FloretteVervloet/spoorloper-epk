/* ============================================================
   SPOORLOPER — init glue
   first interaction starts the underscore · sound toggle ·
   spotify card · lazy video loading
   ============================================================ */

(function () {
  const toggle = document.getElementById('sound-toggle');

  /* --- sound toggle --------------------------------------
     Sound is OFF until the visitor chooses it. The opening
     points at this button; until sound is on, the button
     throbs for attention. */
  const soundLabel = document.getElementById('sound-label');
  function paintToggle() {
    const on = SpoorAudio.started && !SpoorAudio.muted;
    toggle.classList.toggle('is-on', on);
    soundLabel.textContent = on ? 'sound on' : 'sound off';
  }
  paintToggle();
  SpoorAudio.on('start', paintToggle);
  SpoorAudio.on('mute', paintToggle);

  /* leaving for another tab (YouTube, Instagram, Spotify…):
     mute everything so two sounds never play over each other.
     The visitor flips it back on with one click when they return. */
  document.addEventListener('click', e => {
    const link = e.target.closest ? e.target.closest('a[target="_blank"]') : null;
    if (link && SpoorAudio.started && !SpoorAudio.muted) SpoorAudio.setMuted(true);
  }, true);

  /* attention state: throbbing button + pointer in the opening,
     both gone the moment sound actually plays */
  toggle.classList.add('attract');
  const soundPointer = document.getElementById('sound-pointer');
  SpoorAudio.on('start', () => {
    toggle.classList.remove('attract');
    if (soundPointer) {
      gsap.to(soundPointer, { opacity: 0, duration: 0.7, onComplete: () => soundPointer.remove() });
    }
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
