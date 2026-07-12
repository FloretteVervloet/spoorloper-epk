/* ============================================================
   SPOORLOPER — scroll choreography
   Every scene appears out of the dark and dissolves again.
   Video scenes pin the scroll and take over the sound.
   ============================================================ */

(function () {
  gsap.registerPlugin(ScrollTrigger);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  /* ---------- text splitting helpers ---------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    [...text].forEach(ch => {
      const s = document.createElement('span');
      s.className = 'char';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    });
    return el.querySelectorAll('.char');
  }

  function splitWords(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    text.split(/\s+/).forEach(w => {
      const s = document.createElement('span');
      s.className = 'word';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      el.appendChild(s);
    });
    return el.querySelectorAll('.word');
  }

  /* Generic: appear early, stay readable long, dissolve only at the very end. */
  function riseAndDissolve(scene, targets, opts = {}) {
    gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: 'top 88%',
        end: 'bottom 5%',
        scrub: 0.8,
      }
    })
    .from(targets, {
      opacity: 0,
      y: opts.y ?? 70,
      rotation: opts.rot ?? 0,
      scale: opts.scale ?? 1,
      stagger: opts.stagger ?? 0.04,
      ease: 'power2.out',
      duration: 0.28,
    })
    .to({}, { duration: 0.55 }) // long readable hold
    .to(targets, {
      opacity: 0,
      y: opts.yOut ?? -50,
      stagger: opts.stagger ? opts.stagger * 0.5 : 0,
      ease: 'power2.in',
      duration: 0.17,
    });
  }

  /* ---------- 1 · opening ---------- */
  const opening = document.getElementById('s-opening');
  gsap.timeline({
    scrollTrigger: { trigger: opening, start: 'top top', end: 'bottom 35%', scrub: 0.6 }
  })
  .to('.scroll-hint', { opacity: 0, duration: 0.15 }, 0)
  .to('.letterlogo', { scale: 1.35, opacity: 0, filter: 'blur(14px)', ease: 'power1.in' }, 0)
  .to('.opening-line', { opacity: 0, y: -80, ease: 'power1.in' }, 0.05);

  /* ---------- 2 · baseline ---------- */
  const baselineChars = splitChars(document.querySelector('.baseline'));
  gsap.timeline({
    scrollTrigger: { trigger: '#s-baseline', start: 'top 75%', end: 'bottom 15%', scrub: 0.8 }
  })
  .from('#s-baseline .bol-anchor', { opacity: 0, scale: 0.4, duration: 0.25 })
  .from(baselineChars, {
    opacity: 0,
    y: () => gsap.utils.random(50, 120),
    rotation: () => gsap.utils.random(-24, 24),
    stagger: { each: 0.02, from: 'random' },
    ease: 'back.out(1.6)',
    duration: 0.5,
  }, 0.05)
  .to({}, { duration: 0.3 })
  .to('#s-baseline .bol-anchor, .baseline', { opacity: 0, y: -60, ease: 'power2.in', duration: 0.3 });

  /* ---------- bio fragments (split chars, Pandemic) ---------- */
  ['#s-bio1'].forEach(sel => {
    const el = document.querySelector(`${sel} .js-split`);
    if (el) riseAndDissolve(sel, splitChars(el), { y: 90, stagger: 0.03 });
  });

  /* long Inter lines: word by word */
  document.querySelectorAll('.js-words').forEach(el => {
    const words = splitWords(el);
    riseAndDissolve(el.closest('.scene'), words, { y: 40, stagger: 0.05 });
  });

  /* ---------- breathes / bites ---------- */
  const bio3 = document.querySelector('#s-bio3 .bio-line');
  gsap.timeline({
    scrollTrigger: { trigger: '#s-bio3', start: 'top 80%', end: 'bottom 5%', scrub: 0.8 }
  })
  .from('#s-bio3 .breathes', { opacity: 0, scale: 0.8, transformOrigin: '50% 50%', ease: 'sine.out', duration: 0.3 })
  .to('#s-bio3 .breathes', { scale: 1.06, yoyo: true, repeat: 1, duration: 0.18, ease: 'sine.inOut' })
  .from('#s-bio3 .bites', { opacity: 0, scale: 2.6, rotation: -8, ease: 'power4.in', duration: 0.2 })
  .to({}, { duration: 0.5 })
  .to(bio3, { opacity: 0, y: -60, duration: 0.18 });

  /* ---------- press facts: appear and STAY readable ---------- */
  gsap.from('.press-fact', {
    scrollTrigger: { trigger: '#s-press', start: 'top 70%', toggleActions: 'play none none reverse' },
    opacity: 0, y: 50, duration: 1, ease: 'power2.out',
  });
  /* the ungoogleable line: big Pandemic, dead center, two balanced
     rows, letters tumbling in and out */
  const ungoog = document.querySelector('.ungoogleable');
  if (ungoog) {
    const chars = [...ungoog.querySelectorAll('.ung-row')].flatMap(row => [...splitChars(row)]);
    gsap.timeline({
      scrollTrigger: { trigger: '#s-ungoogleable', start: 'top 80%', end: 'bottom 5%', scrub: 0.8 }
    })
    .from(chars, {
      opacity: 0,
      y: () => gsap.utils.random(50, 110),
      rotation: () => gsap.utils.random(-22, 22),
      stagger: { each: 0.018, from: 'random' },
      ease: 'back.out(1.6)',
      duration: 0.3,
    })
    .to({}, { duration: 0.5 })
    .to(chars, {
      opacity: 0,
      y: -60,
      stagger: { each: 0.012, from: 'random' },
      ease: 'power2.in',
      duration: 0.2,
    });
  }

  /* ---------- press image + download tag ---------- */
  gsap.timeline({
    scrollTrigger: { trigger: '#s-pressimage', start: 'top 70%', end: 'center center', scrub: 0.8 }
  })
  .from('.press-image img', { opacity: 0, scale: 0.82, ease: 'power2.out' })
  .from('.download-tag', { opacity: 0, y: 60, rotation: 14, ease: 'back.out(2)' }, 0.4);

  /* ---------- gaze parallax ---------- */
  gsap.fromTo('.gaze-landscape',
    { yPercent: -10 },
    {
      yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: '#s-bio4', start: 'top bottom', end: 'bottom top', scrub: true }
    });

  /* ---------- band members ---------- */
  document.querySelectorAll('.band-member').forEach((m, i) => {
    const fromLeft = i % 2 === 0;
    gsap.timeline({
      scrollTrigger: { trigger: m, start: 'top 85%', end: 'top 25%', scrub: 0.7 }
    })
    .from(m, { opacity: 0, x: fromLeft ? -140 : 140, rotation: fromLeft ? -4 : 4, ease: 'power2.out' });
  });

  /* ---------- spotify ---------- */
  const listen = document.querySelector('.listen-word');
  if (listen) {
    gsap.from(splitChars(listen), {
      scrollTrigger: { trigger: '#s-spotify', start: 'top 70%', toggleActions: 'play none none reverse' },
      opacity: 0, y: 80, rotation: () => gsap.utils.random(-18, 18),
      stagger: 0.06, ease: 'back.out(1.8)', duration: 0.7,
    });
  }
  gsap.from('.spotify-card', {
    scrollTrigger: { trigger: '#s-spotify', start: 'top 55%', toggleActions: 'play none none reverse' },
    opacity: 0, y: 90, duration: 0.9, ease: 'power2.out',
  });

  /* ---------- contact: calm landing ---------- */
  gsap.from('#s-contact > *', {
    scrollTrigger: { trigger: '#s-contact', start: 'top 70%', toggleActions: 'play none none reverse' },
    opacity: 0, y: 40, stagger: 0.18, duration: 1, ease: 'power1.out',
  });

  /* ---------- video scenes: pin + audio takeover ----------
     Clips (data-shrink) get the full ritual: watch → the frame
     shrinks while you keep scrolling ("keep on scrolling") →
     at the smallest point it implodes to black like an old TV
     being switched off. Scrolling back up turns it back on.
     Audio follows a single threshold so underscore and clip
     never play over each other. */
  document.querySelectorAll('[data-video-scene]').forEach(scene => {
    const video = scene.querySelector('video');
    const shrink = scene.hasAttribute('data-shrink');
    const frame = scene.querySelector('.video-frame, .reel-wrap');
    const AUDIO_CUT = shrink ? 0.42 : 0.6; // progress where clip audio hands back

    let audible = false;
    function setAudible(on) {
      if (on === audible) return;
      audible = on;
      if (on) SpoorAudio.duckForVideo(video);
      else SpoorAudio.releaseVideo(video);
    }

    /* mobile scrolls tighter: shorter pins, same choreography —
       desktop keeps its exact original pacing */
    const PIN_LEN = () => Math.round(window.innerHeight *
      (window.innerWidth <= 640 ? (shrink ? 1.5 : 1.1) : (shrink ? 1.9 : 1.3)));

    ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: () => '+=' + PIN_LEN(),
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => setAudible(self.isActive && self.progress < AUDIO_CUT),
      onLeave: () => setAudible(false),
      onLeaveBack: () => setAudible(false),
      onEnter: self => setAudible(self.progress < AUDIO_CUT),
      onEnterBack: self => setAudible(self.progress < AUDIO_CUT),
    });

    if (shrink) {
      const flash = scene.querySelector('.crt-flash');
      const hint = scene.querySelector('.keep-scrolling');
      gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: 'top top',
          end: () => '+=' + PIN_LEN(),
          scrub: 0.5,
        }
      })
      /* 0–.38: full-screen watching — the hint surfaces right away */
      .to({}, { duration: 0.38 })
      .to(hint, { opacity: 1, duration: 0.08 }, 0.12)
      /* .38–.72: the frame pulls away from you */
      .to(frame, { scale: 0.3, ease: 'power1.in', duration: 0.34 }, 0.38)
      /* .72–.8: CRT off — collapse to a bright line, then a dot */
      .to(frame, { scaleY: 0.015, scaleX: 0.42, ease: 'power3.in', duration: 0.08 }, 0.72)
      .to(flash, { opacity: 1, duration: 0.04 }, 0.72)
      .to(flash, { opacity: 0, duration: 0.06 }, 0.78)
      .to(frame, { scaleX: 0.001, opacity: 0, ease: 'power2.in', duration: 0.05 }, 0.8)
      /* .85–1: black; the hint stays a moment, then dissolves */
      .to(hint, { opacity: 0, duration: 0.1 }, 0.88);
    }

    /* frame drifts in slightly as it arrives */
    gsap.fromTo(frame,
      { scale: 0.92, opacity: 0.6 },
      {
        scale: 1, opacity: 1, ease: 'power1.out',
        scrollTrigger: { trigger: scene, start: 'top 90%', end: 'top top', scrub: 0.6 }
      });
  });

  /* ---------- closer: the TV switches off ----------
     Created AFTER the video pins so its position is measured with
     all pin spacing in place (it lives at the very end of the page).
     The two closing lines surface below the bookings info; scroll
     past them and the whole website shuts down like an old TV —
     panels squeeze the screen into a bright line, the line collapses
     to a dot, the amp pops LOUD, and there is nothing left. Except,
     after a beat, a faint WAKE UP. */
  const closerLines = document.querySelectorAll('.closer-line');
  const line1Words = splitWords(closerLines[0]);
  const line2Words = splitWords(closerLines[1]);
  const CLOSER_LEN = () => Math.round(window.innerHeight * (window.innerWidth <= 640 ? 2.2 : 2.8));
  const wakeBtn = document.getElementById('wake-up');

  const closerTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#s-closer',
      start: 'top top',
      end: () => '+=' + CLOSER_LEN(),
      scrub: 0.6,
    }
  })
  /* the two lines surface out of the dark, one after the other */
  .from(line1Words, {
    opacity: 0, filter: 'blur(9px)', y: 34,
    stagger: 0.035, duration: 0.2, ease: 'power1.out',
  })
  .from(line2Words, {
    opacity: 0, filter: 'blur(9px)', y: 34,
    stagger: 0.035, duration: 0.2, ease: 'power1.out',
  }, '+=0.07')
  /* hold — he doesn't notice you */
  .to({}, { duration: 0.2 })
  /* TV OFF — everything is squeezed into a line of light */
  .add('off')
  .to('.closer-lines', { scaleY: 0.015, scaleX: 1.12, ease: 'power3.in', duration: 0.07 }, 'off')
  .to('.tvoff-panel--top', { scaleY: 1, ease: 'power3.in', duration: 0.07 }, 'off')
  .to('.tvoff-panel--bottom', { scaleY: 1, ease: 'power3.in', duration: 0.07 }, 'off')
  .to('#sound-toggle, #bookings-link', { opacity: 0, duration: 0.05 }, 'off')
  .to('.tvoff-line', { opacity: 1, duration: 0.025 }, 'off+=0.045')
  .to('.closer-lines', { opacity: 0, duration: 0.015 }, 'off+=0.07')
  /* the line collapses to a dot */
  .to('.tvoff-line', { scaleX: 0.002, ease: 'power2.in', duration: 0.06 }, 'off+=0.085')
  .to('.tvoff-line', { opacity: 0, duration: 0.015 }, 'off+=0.14')
  .to('.tvoff-dot', { opacity: 1, duration: 0.015 }, 'off+=0.135')
  .to('.tvoff-dot', { opacity: 0, duration: 0.05 }, 'off+=0.17')
  /* nothing. then, faintly: wake up */
  .to({}, { duration: 0.08 })
  .to(wakeBtn, { opacity: 1, duration: 0.1 })
  .to({}, { duration: 0.08 });

  /* the pop and the wake button follow the same 'off' moment */
  const offFrac = closerTl.labels.off / closerTl.duration();
  const wakeFrac = Math.min(offFrac + 0.28 / closerTl.duration(), 0.97);
  let popped = false;
  ScrollTrigger.create({
    trigger: '#s-closer',
    start: 'top top',
    end: () => '+=' + CLOSER_LEN(),
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: self => {
      if (self.progress > offFrac + 0.02 && !popped) { popped = true; SpoorAudio.ampPop(); }
      else if (self.progress <= offFrac - 0.04 && popped) { popped = false; SpoorAudio.powerBack(); }
      wakeBtn.classList.toggle('is-live', self.progress > wakeFrac);
    },
    onLeaveBack: () => {
      if (popped) { popped = false; SpoorAudio.powerBack(); }
      wakeBtn.classList.remove('is-live');
    },
  });

  /* trigger positions: sort by real position and re-measure once
     everything (fonts, posters, pins) has settled */
  ScrollTrigger.sort();
  window.addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* ---------- scroll velocity → audio + subtle skew ---------- */
  let lastY = window.scrollY, lastT = performance.now();
  window.addEventListener('scroll', () => {
    const t = performance.now();
    const v = (window.scrollY - lastY) / Math.max(t - lastT, 1) * 1000;
    lastY = window.scrollY; lastT = t;
    SpoorAudio.onScrollVelocity(v);
  }, { passive: true });
})();
