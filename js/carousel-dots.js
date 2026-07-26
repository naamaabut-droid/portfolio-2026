// Scroll-pagination dots for sideways carousels (mobile).
// Builds a .dots-pagination row after each carousel — one dot per card,
// the active dot tracking the card nearest the scroller's centre. The dots
// are hidden on desktop via CSS (the arrow controls take over there).
(() => {
  // [carousel selector, item selector within it]
  const CONFIG = [
    ['.flow', ':scope > .figure'],
    ['.features-row', ':scope > .col'],
    ['.testimonials', '.t-item'],
    ['.reviews', ':scope > .review'],
    ['.abc-grid', ':scope > .abc-cell'],
    ['.layouts-screens', ':scope > img'],
    ['.examples-grid', ':scope > .ex-pair'],
  ];

  function build(scroller, itemSel) {
    if (scroller.dataset.dots) return;
    const items = Array.from(scroller.querySelectorAll(itemSel));
    if (items.length < 2) return;

    const pag = document.createElement('div');
    pag.className = 'dots-pagination';
    pag.setAttribute('aria-hidden', 'true');
    items.forEach(() => {
      const d = document.createElement('span');
      d.className = 'dot';
      pag.appendChild(d);
    });
    // place the dots after the scroller (or its .scroll-wrap, if any)
    const anchor = scroller.closest('.scroll-wrap') || scroller;
    anchor.insertAdjacentElement('afterend', pag);
    const dots = Array.from(pag.children);

    const update = () => {
      const s = scroller.getBoundingClientRect();
      const mid = s.left + s.width / 2;
      let idx = 0, best = Infinity;
      items.forEach((it, i) => {
        const r = it.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - mid);
        if (dist < best) { best = dist; idx = i; }
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    scroller.dataset.dots = '1';
  }

  function initAll() {
    CONFIG.forEach(([sel, itemSel]) => {
      document.querySelectorAll(sel).forEach((s) => build(s, itemSel));
    });
  }

  // run after scroll-arrows.js has wrapped the flows
  if (document.readyState === 'complete') setTimeout(initAll, 60);
  else window.addEventListener('load', () => setTimeout(initAll, 60));
})();
