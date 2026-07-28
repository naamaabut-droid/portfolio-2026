// Home hero:
// 1) Breathing gradient canvas (same treatment as the case-study headers).
// 2) Industry logo chips — Matter.js physics matching the reference site:
//    chips fall from above, collide with the headline and the hero floor,
//    and can be dragged with the mouse.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  if (!hero) return;

  /* ---------- breathing glows ---------- */
  try {
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    // Figma glows: cream / peach / peach / lilac / periwinkle (fractions of 1440×700)
    const blobs = [
      { c: '255,243,226', x: 0.44, y: 0.20, r: 0.44, fx: 0.140, fy: 0.180, fr: 0.150, p: 2.1, amp: 0.14, fade: 0.70 },
      { c: '255,217,190', x: 0.79, y: 0.46, r: 0.38, fx: 0.150, fy: 0.200, fr: 0.110, p: 5.6, amp: 0.15, fade: 0.62 },
      { c: '255,217,190', x: 0.20, y: 0.64, r: 0.38, fx: 0.120, fy: 0.160, fr: 0.130, p: 3.3, amp: 0.15, fade: 0.62 },
      { c: '220,217,255', x: 0.13, y: 0.83, r: 0.40, fx: 0.170, fy: 0.120, fr: 0.140, p: 4.2, amp: 0.17, fade: 0.60 },
      { c: '185,185,250', x: 0.87, y: 0.91, r: 0.34, fx: 0.110, fy: 0.150, fr: 0.120, p: 0.5, amp: 0.15, fade: 0.58 },
    ];
    const TAU = Math.PI * 2;
    function draw(tMs) {
      const t = tMs / 1000;
      const w = hero.clientWidth, h = hero.clientHeight;
      const cw = Math.round(w / 2), ch = Math.round(h / 2);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      const base = ctx.createLinearGradient(0, 0, 0, ch);
      base.addColorStop(0, '#f3f1fe');
      base.addColorStop(1, '#eceafb');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, cw, ch);
      for (const b of blobs) {
        const cx = (b.x + b.amp * Math.sin(t * b.fx * TAU + b.p)) * cw;
        const cy = (b.y + b.amp * Math.sin(t * b.fy * TAU + b.p * 1.7)) * ch;
        const r = b.r * (1 + 0.32 * Math.sin(t * b.fr * TAU + b.p * 2.3)) * cw * 0.72;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(r, 1));
        g.addColorStop(0, 'rgba(' + b.c + ',1)');
        g.addColorStop(b.fade, 'rgba(' + b.c + ',0)');
        g.addColorStop(1, 'rgba(' + b.c + ',0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
      }
    }
    if (reduceMotion) {
      draw(0);
      addEventListener('resize', () => draw(0));
    } else {
      const tick = () => { draw(performance.now()); hero.classList.add('canvas-live'); };
      let timer = null;
      const start = () => { if (!timer) { tick(); timer = setInterval(tick, 33); } };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
      start();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((es) => (es[0].isIntersecting ? start() : stop())).observe(hero);
      }
    }
  } catch (e) { /* CSS fallback glows remain visible */ }

  /* ---------- physics logo chips ---------- */
  const chipsCanvas = document.getElementById('chips-canvas');
  const measure = document.querySelector('.chips-measure');
  if (!chipsCanvas || !measure || typeof Matter === 'undefined') return;

  const isTouch = matchMedia('(pointer: coarse)').matches;
  if (isTouch) chipsCanvas.style.pointerEvents = 'none'; // never trap scroll on touch

  const CHIPS = [
    { label: 'Figma', icon: 'assets/home/chip-figma.svg' },
    { label: 'Claude Code', icon: 'assets/home/chip-claude.svg' },
    { label: 'Storybook', icon: 'assets/home/chip-storybook.svg' },
    { label: 'Adobe', icon: 'assets/home/chip-adobe.svg', plain: true },
    { label: 'Cursor', icon: 'assets/home/chip-cursor.svg' },
    { label: 'GitHub', icon: 'assets/home/chip-github.svg' },
    { label: 'VS Code', icon: 'assets/home/chip-vscode.svg' },
    { label: 'Jira', icon: 'assets/home/chip-jira.svg' },
    { label: 'HTML & CSS', icon: 'assets/home/chip-html.svg' },
  ];

  const ctx2 = chipsCanvas.getContext('2d');

  function chipScale() {
    const w = hero.clientWidth;
    return w < 640 ? 0.58 : w < 1024 ? 0.78 : 1;
  }

  async function boot() {
    // Don't let a slow webfont hold the chips back — cap the wait so they drop
    // in almost immediately on entry (pills re-measure fine once the font lands).
    const fontsReady = document.fonts
      ? Promise.race([document.fonts.ready, new Promise((res) => setTimeout(res, 200))])
      : Promise.resolve();
    await Promise.all([
      fontsReady,
      ...CHIPS.map((c) => new Promise((res) => {
        c.img = new Image();
        c.img.onload = res;
        c.img.onerror = res;
        c.img.src = c.icon;
      })),
    ]);

    const { Engine, World, Bodies, Body, Composite, Mouse, MouseConstraint, Sleeping } = Matter;

    let engine = null;
    let stepTimer = null;
    let bodiesInfo = [];
    let dpr = 1;

    function fit() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      chipsCanvas.width = Math.round(hero.clientWidth * dpr);
      chipsCanvas.height = Math.round(hero.clientHeight * dpr);
    }

    function chipMetrics(scale) {
      // pill: 8 pad | 64 circle | 12 gap | text | 24 pad — text 32px DM Sans Medium
      ctx2.font = `500 ${32 * scale}px "DM Sans"`;
      return CHIPS.map((c) => {
        const textW = ctx2.measureText(c.label).width;
        return {
          chip: c,
          w: (8 + 64 + 12) * scale + textW + 24 * scale,
          h: 80 * scale,
          textW,
        };
      });
    }

    function build() {
      fit();
      const W = hero.clientWidth, H = hero.clientHeight;
      const scale = chipScale();

      engine = Engine.create();
      engine.world.gravity.y = 1.7;       // reference values
      engine.enableSleeping = true;
      const world = engine.world;

      // floor + walls, 16px inset like the reference
      Composite.add(world, [
        Bodies.rectangle(W / 2, H - 16 + 200, W * 3, 400, { isStatic: true }),
        Bodies.rectangle(-184, H / 2, 400, H * 4, { isStatic: true }),
        Bodies.rectangle(W - 16 + 200, H / 2, 400, H * 4, { isStatic: true }),
      ]);

      // chips fall past the headline all the way to the floor — no text colliders
      const heroRect = hero.getBoundingClientRect();
      const intro = document.querySelector('.hero-intro');
      const ir = intro.getBoundingClientRect();
      const left = ir.left - heroRect.left, width = ir.width;
      // Chips fall freely and settle into a natural, tilted pile (she asked
      // for a free fall, not the upright straight-row stack). On phones the
      // fall is gentler: a shorter drop, more air drag, a smaller starting
      // tilt, and extra rotational inertia — so they still land organically
      // but settle at soft angles (close to the Figma pile) instead of
      // tumbling to steep/vertical ones.
      const isMobile = W < 640;
      const metrics = chipMetrics(scale);
      bodiesInfo = metrics.map((m, i) => {
        const x = left + ((i + 0.5) / metrics.length) * width + (Math.random() - 0.5) * 32;
        // spawn just above the top edge so they fall into view right away
        const y = isMobile
          ? -0.10 * H - Math.random() * 0.08 * H
          : -0.22 * H - Math.random() * 0.16 * H;
        const body = Bodies.rectangle(x, y, m.w, m.h, {
          chamfer: { radius: m.h / 2 },
          restitution: isMobile ? 0.06 : 0.35,
          friction: 0.5,
          frictionAir: isMobile ? 0.03 : 0.014,
          density: 0.0018,
          angle: (Math.random() - 0.5) * (isMobile ? 0.32 : 0.5),
        });
        // extra rotational inertia on phones → gentle tilts, not steep spins
        if (isMobile) Body.setInertia(body, body.inertia * 4);
        Composite.add(world, body);
        return { ...m, body, scale };
      });

      // mouse dragging; keep page scrolling intact
      if (!isTouch) {
        const mouse = Mouse.create(chipsCanvas);
        mouse.pixelRatio = dpr;
        const mc = MouseConstraint.create(engine, {
          mouse,
          constraint: { stiffness: 0.2, render: { visible: false } },
        });
        // Matter hijacks the wheel — give it back to the page
        chipsCanvas.removeEventListener('wheel', mouse.mousewheel);
        chipsCanvas.removeEventListener('mousewheel', mouse.mousewheel);
        chipsCanvas.removeEventListener('DOMMouseScroll', mouse.mousewheel);
        Composite.add(world, mc);
        Matter.Events.on(mc, 'startdrag', (e) => { Sleeping.set(e.body, false); chipsCanvas.style.cursor = 'grabbing'; });
        Matter.Events.on(mc, 'enddrag', () => { chipsCanvas.style.cursor = ''; });
        chipsCanvas.addEventListener('mousemove', (ev) => {
          if (mc.body) return;
          const rect = chipsCanvas.getBoundingClientRect();
          const p = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
          const hit = Matter.Query.point(bodiesInfo.map((b) => b.body), p).length > 0;
          chipsCanvas.style.cursor = hit ? 'grab' : '';
        });
      }

      // Advance by real elapsed time in fixed substeps. Driven by BOTH
      // rAF (fast path in real browsers) and an interval fallback for
      // environments that throttle rAF — `last` prevents double-stepping.
      lastStep = performance.now();
      buildTime = lastStep;
      paused = false;
      const loop = () => { advance(); rafId = requestAnimationFrame(loop); };
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
      clearInterval(stepTimer);
      stepTimer = setInterval(advance, 33);
    }

    let lastStep = 0, paused = false, rafId = 0, buildTime = 0;
    function advance() {
      if (!engine || paused) return;
      const now = performance.now();
      let elapsed = Math.min(now - lastStep, 700);
      lastStep = now;
      if (elapsed <= 0) return;
      while (elapsed > 0) {
        Matter.Engine.update(engine, Math.min(16.667, elapsed));
        elapsed -= 16.667;
      }
      render();
      // On touch there is no drag to keep the sim alive, so once every chip has
      // settled (or after a safety timeout) STOP stepping entirely — otherwise a
      // stray mobile resize / rounding can keep nudging the pile ("dancing").
      if (isTouch && stepTimer && bodiesInfo.length &&
          (bodiesInfo.every((b) => b.body.isSleeping) || now - buildTime > 8000)) {
        cancelAnimationFrame(rafId);
        clearInterval(stepTimer);
        stepTimer = null;
      }
    }

    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function render() {
      const c = ctx2;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, chipsCanvas.width, chipsCanvas.height);
      for (const info of bodiesInfo) {
        const { body, w, h, chip, scale } = info;
        c.save();
        c.translate(body.position.x, body.position.y);
        c.rotate(body.angle);
        // pill
        c.save();
        c.shadowColor = 'rgba(17,17,19,0.08)';
        c.shadowBlur = 6 * scale;
        c.shadowOffsetY = 2 * scale;
        c.fillStyle = 'rgba(255,255,255,0.45)';
        roundRect(c, -w / 2, -h / 2, w, h, h / 2);
        c.fill();
        c.restore();
        // logo circle / plain logo
        const pad = 8 * scale, circle = 64 * scale;
        const cx = -w / 2 + pad + circle / 2;
        if (!chip.plain) {
          c.fillStyle = '#fff';
          c.beginPath();
          c.arc(cx, 0, circle / 2, 0, Math.PI * 2);
          c.fill();
        }
        if (chip.img && chip.img.naturalWidth !== 0 || chip.img.width) {
          const box = (chip.plain ? 64 : 34.9) * scale;
          const iw = chip.img.width || box, ih = chip.img.height || box;
          const k = Math.min(box / iw, box / ih);
          c.drawImage(chip.img, cx - (iw * k) / 2, -(ih * k) / 2, iw * k, ih * k);
        }
        // label
        c.font = `500 ${32 * scale}px "DM Sans"`;
        if ('letterSpacing' in c) c.letterSpacing = `${-0.64 * scale}px`;
        c.fillStyle = '#111113';
        c.textBaseline = 'middle';
        c.fillText(chip.label, -w / 2 + (8 + 64 + 12) * scale, 1 * scale);
        c.restore();
      }
    }

    build();
    window.__heroDebug = () => ({
      bodies: bodiesInfo.map((b) => ({
        label: b.chip.label,
        x: Math.round(b.body.position.x),
        y: Math.round(b.body.position.y),
        sleeping: b.body.isSleeping,
        speed: +b.body.speed.toFixed(2),
      })),
      running: !!stepTimer,
    });

    // rebuild on resize (debounced) — but only when the WIDTH actually changes.
    // Mobile browsers fire resize on every scroll as the URL bar shows/hides
    // (height-only change); rebuilding there re-dropped the chips endlessly,
    // which read as the chips jittering "hysterically".
    let rt = null;
    let lastW = hero.clientWidth;
    addEventListener('resize', () => {
      // Ignore small width wobble (iOS URL-bar show/hide can nudge it a px or
      // two); only a real width change — orientation, desktop resize — rebuilds.
      if (Math.abs(hero.clientWidth - lastW) <= 16) return;
      lastW = hero.clientWidth;
      clearTimeout(rt);
      rt = setTimeout(build, 250);
    });

    // pause the sim while the hero is offscreen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        paused = !es[0].isIntersecting;
        if (!paused) lastStep = performance.now();
      }).observe(hero);
    }
  }

  if (reduceMotion) {
    // no physics — draw the chips in their designed resting spots via DOM
    measure.classList.add('chips-static');
    return;
  }
  boot();
})();
