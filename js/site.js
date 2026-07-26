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

  // Land at the top of the page on Back/Forward navigation instead of
  // restoring the previous scroll position (the "← Back" button uses
  // history.back(), and the browser was dropping her mid-page). Only
  // back/forward — reloads keep their position (she reloads to check
  // pushes) and real anchor targets (#contact, Back-to-top) are left alone.
  window.addEventListener('pageshow', (e) => {
    const nav = performance.getEntriesByType('navigation')[0];
    const backForward = e.persisted || (nav && nav.type === 'back_forward');
    if (backForward && !location.hash) {
      window.scrollTo(0, 0);
      // beat any late async scroll-restoration the browser does after pageshow
      requestAnimationFrame(() => { if (!location.hash) window.scrollTo(0, 0); });
    }
  });
})();
