// Contact section: breathing gradient canvas (same treatment as the heroes —
// glow geometry taken from the Figma "Contact section" component, 158:232).
(() => {
  const sections = document.querySelectorAll('.contact-section');
  if (!sections.length) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  // Fractions of the 1080×396 component frame.
  const blobs = [
    { c: '255,243,226', x: 0.457, y: -0.072, r: 0.34, fx: 0.140, fy: 0.180, fr: 0.150, p: 2.1, amp: 0.05, fade: 0.72 },
    { c: '255,217,190', x: 0.822, y: 0.279, r: 0.29, fx: 0.150, fy: 0.200, fr: 0.110, p: 5.6, amp: 0.06, fade: 0.66 },
    { c: '255,217,190', x: 0.214, y: 0.524, r: 0.29, fx: 0.120, fy: 0.160, fr: 0.130, p: 3.4, amp: 0.06, fade: 0.66 },
    { c: '220,217,255', x: 0.135, y: 0.787, r: 0.26, fx: 0.170, fy: 0.120, fr: 0.140, p: 4.2, amp: 0.06, fade: 0.64 },
    { c: '185,185,250', x: 0.904, y: 0.788, r: 0.31, fx: 0.110, fy: 0.150, fr: 0.120, p: 0.5, amp: 0.05, fade: 0.62 },
  ];

  sections.forEach((section) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'contact-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    section.prepend(canvas);
    const ctx = canvas.getContext('2d');

    function draw(tMs) {
      const t = tMs / 1000;
      const w = section.clientWidth, h = section.clientHeight;
      const cw = Math.round(w / 2), ch = Math.round(h / 2);
      if (!cw || !ch) return;
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      const base = ctx.createLinearGradient(0, 0, 0, ch);
      base.addColorStop(0, '#f3f1fe');
      base.addColorStop(1, '#eceafb');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, cw, ch);
      for (const b of blobs) {
        const cx = (b.x + b.amp * Math.sin(t * b.fx * TAU + b.p)) * cw;
        const cy = (b.y + b.amp * Math.sin(t * b.fy * TAU + b.p * 1.7)) * ch;
        const r = b.r * (1 + 0.30 * Math.sin(t * b.fr * TAU + b.p * 2.3)) * cw;
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
      return;
    }
    const tick = () => draw(performance.now());
    let timer = null;
    const start = () => { if (!timer) { tick(); timer = setInterval(tick, 33); } };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    start();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => (es[0].isIntersecting ? start() : stop())).observe(section);
    }
  });
})();
