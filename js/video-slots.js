// Video slots — shared component. A .media-video[data-video] slot shows its
// poster <img> until the MP4 (../assets/<data-video-root>/<name>.mp4) has
// loaded, then swaps in a muted, inline, looping autoplay video.
//
// Mobile-robust:
//  • sets the muted + playsinline ATTRIBUTES (iOS inline autoplay needs the
//    attributes, not only the JS properties), plus a poster so it's never blank;
//  • lazy-loads each video only as its slot nears the viewport (loading all
//    ~9 clips at once stalls on mobile), via IntersectionObserver;
//  • plays on-screen / pauses off-screen;
//  • retries play on the first user gesture (covers strict / Low-Power blocks).
// No fetch/CORS involved, so it works over http and file:// alike.
(() => {
  const root = document.body.dataset.videoRoot;
  if (!root) return;

  const build = (slot) => {
    if (slot._v) return slot._v;
    const poster = slot.querySelector('img');
    const v = document.createElement('video');
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    v.preload = 'auto';
    // iOS inline autoplay requires these as ATTRIBUTES, not only properties.
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('autoplay', '');
    v.setAttribute('loop', '');
    if (poster && poster.getAttribute('src')) {
      v.setAttribute('poster', poster.getAttribute('src'));
    }
    v.addEventListener('loadeddata', () => {
      slot.replaceChildren(v);
      v.play().catch(() => {});
    }, { once: true });
    v.src = `../assets/${root}/${slot.dataset.video}.mp4`;
    slot._v = v;
    return v;
  };

  const slots = [...document.querySelectorAll('.media-video[data-video]')];

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          build(e.target).play().catch(() => {});   // lazy-load + play near view
        } else if (e.target._v) {
          e.target._v.pause();
        }
      });
    }, { threshold: 0.1, rootMargin: '200px 0px' });
    slots.forEach((s) => io.observe(s));
  } else {
    slots.forEach((s) => build(s).play().catch(() => {}));
  }

  // Autoplay may be blocked until the first user gesture — on it, (re)play
  // every video currently on screen.
  const kick = () => slots.forEach((s) => {
    const r = s.getBoundingClientRect();
    if (s._v && r.top < innerHeight && r.bottom > 0) s._v.play().catch(() => {});
  });
  ['touchstart', 'pointerdown', 'click'].forEach((ev) =>
    addEventListener(ev, kick, { once: true, passive: true })
  );
})();
