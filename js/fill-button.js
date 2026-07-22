// Cursor-origin fill for .btn pills — same mechanic as the reference site:
// a clip-path circle grows from the pointer's entry point to cover the button
// (0.28s power3.out), and collapses back to the exit point (0.196s power3.in).
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const GROW = { duration: 280, easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)', fill: 'forwards' };
  const SHRINK = { duration: 196, easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)', fill: 'forwards' };

  document.querySelectorAll('.btn').forEach((btn) => {
    // wrap existing content so it stacks above the fill layer
    const label = document.createElement('span');
    label.className = 'btn-label';
    while (btn.firstChild) label.appendChild(btn.firstChild);
    const fill = document.createElement('span');
    fill.className = 'btn-fill';
    fill.setAttribute('aria-hidden', 'true');
    btn.append(fill, label);
    btn.classList.add('has-fill');

    let anim = null;
    const radius = (x, y, r) => Math.max(
      Math.hypot(x, y), Math.hypot(r.width - x, y),
      Math.hypot(x, r.height - y), Math.hypot(r.width - x, r.height - y)
    );
    const point = (e) => {
      const r = btn.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, r };
    };
    btn.addEventListener('mouseenter', (e) => {
      const { x, y, r } = point(e);
      anim?.cancel();
      anim = fill.animate(
        [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${radius(x, y, r)}px at ${x}px ${y}px)` }],
        GROW
      );
    });
    btn.addEventListener('mouseleave', (e) => {
      const { x, y, r } = point(e);
      anim?.cancel();
      anim = fill.animate(
        [{ clipPath: `circle(${radius(x, y, r)}px at ${x}px ${y}px)` }, { clipPath: `circle(0px at ${x}px ${y}px)` }],
        SHRINK
      );
    });
    btn.addEventListener('focus', () => {
      const r = btn.getBoundingClientRect();
      anim?.cancel();
      anim = fill.animate(
        [{ clipPath: `circle(0px at 50% 50%)` }, { clipPath: `circle(${radius(r.width / 2, r.height / 2, r)}px at 50% 50%)` }],
        GROW
      );
    });
    btn.addEventListener('blur', () => {
      anim?.cancel();
      anim = fill.animate(
        [{ clipPath: 'circle(200% at 50% 50%)' }, { clipPath: 'circle(0px at 50% 50%)' }],
        SHRINK
      );
    });
  });
})();
