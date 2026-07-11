/* ============================================================
   SPOORLOPER — the creatures
   Deformed beings drift through the universe while you scroll.
   Each entry is a swappable asset: png/svg today, webm with
   alpha tomorrow (same config, same motion).
   ============================================================ */

(function () {
  const layer = document.getElementById('creatures');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!layer || reduced) return;

  /* The Spoorloper icon (same figure as the sound button). */
  const BOL = (color) => `<svg viewBox="0 0 100 108" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 12 C30 14 22 34 26 50 C29 61 38 66 42 74 C44 79 43 86 41 90 M50 12 C70 14 78 34 74 50 C71 61 62 66 58 74 C56 79 57 86 59 90 M41 90 L30 95 M59 90 L70 95"
            fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;

  /* Hand-drawn line beings in the nohhhelooho style. */
  const LINE_BEINGS = [
    `<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#FFD100" stroke-width="3" stroke-linecap="round" fill="none">
        <path d="M120 30 C70 40 55 95 65 130 C72 158 95 172 104 196 C109 210 106 228 102 240"/>
        <path d="M120 30 C170 40 185 95 175 130 C168 158 145 172 136 196 C131 210 134 228 138 240"/>
        <path d="M102 240 L80 252"/><path d="M138 240 L160 252"/>
        <path d="M96 100 L104 108"/><path d="M144 100 L136 108"/>
      </g>
    </svg>`,
    `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#E80E88" stroke-width="2.6" stroke-linecap="round" fill="none">
        <path d="M30 110 L190 110"/><path d="M110 30 L110 190"/>
        <path d="M55 55 L165 165"/><path d="M165 55 L55 165"/>
        <path d="M48 48 L62 62"/><path d="M158 158 L172 172"/>
        <path d="M110 22 L98 34"/><path d="M110 22 L122 34"/>
        <circle cx="110" cy="110" r="6" fill="#FFD100" stroke="none"/>
      </g>
    </svg>`
  ];

  /* Config: every entry is a swappable slot — replace `svg`/`src`
     with `src: 'assets/creatures/being.webm'` (alpha webm) and the
     motion stays identical. progress = [enter, exit] as fraction of
     the total page scroll. Entries marked WEBM-SLOT fill the quiet
     stretches between scenes and are meant to be replaced by the
     band's animated beings. */
  const CREATURES = [
    { svg: BOL('#FFD100'), width: 'clamp(70px, 9vw, 130px)',  x: '80vw', progress: [0.05, 0.2], fromY: 110, toY: -130, rot: [-14, 10], sway: 4 },
    { src: 'assets/img/figures-black.jpg', width: 'clamp(180px, 26vw, 380px)', x: '58vw', progress: [0.1, 0.24], fromY: 120, toY: -140, rot: [-6, 5], sway: 3, blend: 'screen', opacity: 0.85 }, /* WEBM-SLOT */
    { src: 'assets/creatures/creature-body.png', width: 'clamp(110px, 16vw, 230px)', x: '6vw', progress: [0.17, 0.33], fromY: 120, toY: -140, rot: [8, -12], sway: 3, opacity: 0.8 }, /* WEBM-SLOT */
    { svg: LINE_BEINGS[0], width: 'clamp(80px, 11vw, 160px)', x: '74vw', progress: [0.3, 0.46],  fromY: 115, toY: -125, rot: [0, 18], sway: 5 },
    { src: 'assets/img/collage-goat.jpg', width: 'clamp(160px, 24vw, 340px)', x: '10vw', progress: [0.38, 0.53], fromY: 125, toY: -135, rot: [-4, 7], sway: 4, blend: 'screen', opacity: 0.85 }, /* WEBM-SLOT */
    { svg: LINE_BEINGS[1], width: 'clamp(60px, 8vw, 110px)',  x: '14vw', progress: [0.5, 0.64], fromY: 110, toY: -120, rot: [-30, 30], sway: 6 },
    { src: 'assets/img/figures-landscape.jpg', width: 'clamp(170px, 25vw, 360px)', x: '62vw', progress: [0.57, 0.72], fromY: 125, toY: -135, rot: [5, -6], sway: 3, blend: 'screen', opacity: 0.8 }, /* WEBM-SLOT */
    { src: 'assets/img/bol-pink.png', width: 'clamp(60px, 7vw, 100px)', x: '86vw', progress: [0.66, 0.8], fromY: 110, toY: -120, rot: [-6, 6], sway: 3, blend: 'screen' },
    { src: 'assets/img/collage-goat-2.jpg', width: 'clamp(150px, 22vw, 320px)', x: '8vw', progress: [0.76, 0.9], fromY: 125, toY: -135, rot: [6, -8], sway: 4, blend: 'screen', opacity: 0.85 }, /* WEBM-SLOT */
    { svg: BOL('#E80E88'), width: 'clamp(50px, 7vw, 100px)',  x: '20vw', progress: [0.86, 0.97],  fromY: 115, toY: -130, rot: [20, -16], sway: 5 },
  ];

  function buildAsset(c) {
    if (c.svg) {
      const div = document.createElement('div');
      div.innerHTML = c.svg;
      return div.firstElementChild;
    }
    if (/\.webm$/i.test(c.src)) {
      const v = document.createElement('video');
      v.src = c.src;
      v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
      return v;
    }
    const img = document.createElement('img');
    img.src = c.src;
    img.alt = '';
    img.loading = 'lazy';
    return img;
  }

  window.addEventListener('load', () => {
    CREATURES.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'creature';
      el.style.width = c.width;
      el.style.left = c.x;
      if (c.blend) el.style.mixBlendMode = c.blend;
      el.appendChild(buildAsset(c));
      layer.appendChild(el);

      const doc = document.documentElement;
      const pageEnd = () => doc.scrollHeight - innerHeight;

      gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: () => pageEnd() * c.progress[0],
          end: () => pageEnd() * c.progress[1],
          scrub: 1.2,
          invalidateOnRefresh: true,
        }
      })
      .fromTo(el,
        { yPercent: 0, y: () => innerHeight * (c.fromY / 100), rotation: c.rot[0], opacity: 0 },
        { y: () => innerHeight * (c.toY / 100), rotation: c.rot[1], opacity: c.opacity || 1, ease: 'none' })
      .to(el, { opacity: 0, duration: 0.18 }, 0.82);

      /* idle sway on top of the scroll drift */
      gsap.to(el, {
        x: `+=${c.sway * 8}`,
        duration: 3 + i,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });
  });
})();
