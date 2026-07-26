// Shared site behavior: scroll reveal + contact anchor handling
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  // "Contact" nav tab: scroll to #contact on this page, or go to home #contact
  document.querySelectorAll('a[data-contact-link]').forEach((a) => {
    a.addEventListener('click', (ev) => {
      const target = document.getElementById('contact');
      if (target) {
        ev.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });

  // Scroll handling across navigations:
  //  - Back/Forward: open the page at the very top, INSTANTLY — no smooth
  //    scroll-up animation and no flash of the previous position. (html has
  //    scroll-behavior:smooth, so we take over restoration ourselves.)
  //  - Reload: keep the exact position she was at (she reloads to check live
  //    pushes), restored from sessionStorage.
  //  - #anchor targets (#contact, Back-to-top): left to the browser.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const scrollKey = 'scroll:' + location.pathname;

  const jumpTo = (y) => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';        // defeat the CSS smooth-scroll
    window.scrollTo(0, y);
    requestAnimationFrame(() => { html.style.scrollBehavior = prev; });
  };

  window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem(scrollKey, String(window.scrollY)); } catch (e) {}
  });

  window.addEventListener('pageshow', (e) => {
    if (location.hash) return;                  // let the browser reach the anchor
    const nav = performance.getEntriesByType('navigation')[0];
    const isReload = !e.persisted && nav && nav.type === 'reload';
    if (isReload) {
      let y = 0;
      try { y = parseInt(sessionStorage.getItem(scrollKey) || '0', 10) || 0; } catch (e) {}
      jumpTo(y);                                // restore where she was
    } else {
      jumpTo(0);                                // top for back/forward (and fresh loads)
    }
  });
})();
