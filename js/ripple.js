/* ============================================================
   SPOORLOPER — space-time ripples
   Moving the mouse disturbs the fabric of the dream:
   expanding distortion waves with chromatic fringes over a
   slowly breathing nebula. WebGL, degrades to nothing.
   ============================================================ */

(function () {
  const canvas = document.getElementById('ripple-canvas');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduced) { if (canvas) canvas.remove(); return; }

  const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
  if (!gl) { canvas.remove(); return; }

  const MAX_RIPPLES = 14;

  const vsrc = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const fsrc = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_scroll;
    uniform vec4 u_ripples[${MAX_RIPPLES}]; // x, y, birth, strength

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
      return v;
    }

    vec3 nebula(vec2 uv, float shift) {
      vec2 p = uv * 2.6 + vec2(shift * 0.35, u_scroll * 1.4);
      float n = fbm(p + fbm(p + u_time * 0.03) * 1.4);
      vec3 ink      = vec3(0.145, 0.0,   0.18);
      vec3 bordeaux = vec3(0.345, 0.02,  0.12);
      vec3 magenta  = vec3(0.91,  0.055, 0.53);
      vec3 col = mix(vec3(0.016, 0.0, 0.02), ink, smoothstep(0.25, 0.75, n));
      col = mix(col, bordeaux, smoothstep(0.55, 0.9, n) * 0.8);
      col += magenta * pow(max(n - 0.68, 0.0) * 3.1, 2.0) * 0.55;
      return col;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      vec2 asp = vec2(u_res.x / u_res.y, 1.0);

      /* accumulated ripple displacement */
      vec2 disp = vec2(0.0);
      float glow = 0.0;
      for (int i = 0; i < ${MAX_RIPPLES}; i++) {
        vec4 r = u_ripples[i];
        if (r.w <= 0.0) continue;
        float age = u_time - r.z;
        if (age > 3.5) continue;
        vec2 d = (uv - r.xy) * asp;
        float dist = length(d);
        float radius = age * 0.34;
        float band = dist - radius;
        float wave = exp(-band * band * 90.0) * exp(-age * 1.4) * r.w;
        disp += normalize(d + 0.0001) * wave * 0.045;
        glow += wave;
      }

      /* chromatic aberration along the wavefront */
      vec3 col;
      col.r = nebula(uv + disp * 1.25, 0.0).r;
      col.g = nebula(uv + disp, 0.0).g;
      col.b = nebula(uv + disp * 0.75, 0.0).b;

      /* wavefront itself flashes magenta/gold */
      col += vec3(0.91, 0.055, 0.53) * glow * 0.35;
      col += vec3(1.0, 0.82, 0.0) * glow * glow * 0.12;

      /* vignette */
      float vig = smoothstep(1.25, 0.45, length((uv - 0.5) * asp * 1.35));
      col *= mix(0.55, 1.0, vig);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('ripple shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vsrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsrc);
  if (!vs || !fs) { canvas.remove(); return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uScroll = gl.getUniformLocation(prog, 'u_scroll');
  const uRipples = gl.getUniformLocation(prog, 'u_ripples');

  const ripples = new Float32Array(MAX_RIPPLES * 4);
  let rippleIdx = 0;
  let last = { x: -1, y: -1, t: 0 };
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;

  function addRipple(x, y, strength) {
    const i = rippleIdx * 4;
    ripples[i] = x / window.innerWidth;
    ripples[i + 1] = 1 - y / window.innerHeight;
    ripples[i + 2] = now();
    ripples[i + 3] = strength;
    rippleIdx = (rippleIdx + 1) % MAX_RIPPLES;
  }

  window.addEventListener('pointermove', (e) => {
    const t = performance.now();
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    const distSq = dx * dx + dy * dy;
    if (t - last.t > 55 && distSq > 400) {
      const speed = Math.min(Math.sqrt(distSq) / Math.max(t - last.t, 1), 4);
      addRipple(e.clientX, e.clientY, 0.35 + speed * 0.25);
      last = { x: e.clientX, y: e.clientY, t };
    }
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => addRipple(e.clientX, e.clientY, 1.1), { passive: true });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  let raf, paused = false;
  function frame() {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, now());
    const doc = document.documentElement;
    gl.uniform1f(uScroll, doc.scrollTop / Math.max(doc.scrollHeight - innerHeight, 1));
    gl.uniform4fv(uRipples, ripples);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!paused) raf = requestAnimationFrame(frame);
  }
  frame();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!paused) frame();
  });

  window.SpoorRipple = {
    pause() { paused = true; cancelAnimationFrame(raf); },
    resume() { if (paused) { paused = false; frame(); } }
  };
})();
