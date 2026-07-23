// Arrow controls for sideways-scrolling galleries (.flow, .features-row).
// Right arrow shows while more content is hidden; left arrow appears once scrolled.
(() => {
  const rows = document.querySelectorAll('.flow, .features-row');
  rows.forEach((row) => {
    const wrap = document.createElement('div');
    wrap.className = 'scroll-wrap';
    row.parentNode.insertBefore(wrap, row);
    wrap.appendChild(row);

    const mkBtn = (dir) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'scroll-arrow ' + dir;
      b.setAttribute('aria-label', dir === 'prev' ? 'Scroll back' : 'Scroll forward');
      b.addEventListener('click', () => {
        row.scrollBy({ left: (dir === 'prev' ? -1 : 1) * Math.round(row.clientWidth * 0.7), behavior: 'smooth' });
      });
      wrap.appendChild(b);
      return b;
    };
    const prev = mkBtn('prev');
    const next = mkBtn('next');

    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      next.classList.toggle('show', max > 8 && row.scrollLeft < max - 8);
      prev.classList.toggle('show', row.scrollLeft > 8);
    };
    row.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    if (document.readyState === 'complete') update();
    else addEventListener('load', update);
    update();
  });
})();
