// Case-study hero: breathing gradient canvas (same treatment across all
// project pages — glow positions taken from the Figma header component).
(() => {
  const hero = document.querySelector('.cs-hero');
  const canvas = hero && hero.querySelector('.hero-canvas');
  if (!canvas) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');

  const blobs = [
    { c: '255,243,226', x: 0.38, y: 0.40, r: 0.42, fx: 0.140, fy: 0.180, fr: 0.150, p: 2.1, amp: 0.15, fade: 0.70 },
    { c: '185,185,250', x: 0.55, y: 0.92, r: 0.70, fx: 0.110, fy: 0.150, fr: 0.120, p: 0.5, amp: 0.16, fade: 0.58 },
    { c: '220,217,255', x: 0.10, y: 0.20, r: 0.56, fx: 0.170, fy: 0.120, fr: 0.140, p: 4.2, amp: 0.18, fade: 0.60 },
    { c: '255,217,190', x: 0.82, y: 0.08, r: 0.58, fx: 0.150, fy: 0.200, fr: 0.110, p: 5.6, amp: 0.16, fade: 0.62 },
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
      const r = b.r * (1 + 0.38 * Math.sin(t * b.fr * TAU + b.p * 2.3)) * cw * 0.72;
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
  const tick = () => { draw(performance.now()); hero.classList.add('canvas-live'); };
  let timer = null;
  const start = () => { if (!timer) { tick(); timer = setInterval(tick, 33); } };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  start();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => (es[0].isIntersecting ? start() : stop())).observe(hero);
  }
})();
