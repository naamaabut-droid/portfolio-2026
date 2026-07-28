// Video slots — shared component. A .media-video[data-video] slot keeps its
// poster <img> visible and lays a muted, inline, looping <video> on top of it
// (streaming ../assets/<data-video-root>/<name>.mp4); the video fades in only
// once it actually starts PLAYING, so the slot is never a blank rectangle.
//
// Mobile-robust (iPhone / iOS WebKit — incl. iOS Chrome):
//  • the poster <img> is never removed → always shows something;
//  • the <video> is in the DOM from the start (iOS only inline-autoplays
//    elements that are in the DOM) with muted/playsinline/autoplay/loop set as
//    ATTRIBUTES (iOS ignores the JS-only properties);
//  • an IntersectionObserver plays the on-screen video and pauses the rest;
//  • play is retried on the first user gesture (Low-Power / strict blocks — a
//    tap or scroll starts them, then the video fades in over the poster).
// No fetch/CORS involved, so it works over http and file:// alike.
(() => {
  const root = document.body.dataset.videoRoot;
  if (!root) return;

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const v = e.target.querySelector('video');
          if (!v) return;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      }, { threshold: 0.1, rootMargin: '200px 0px' })
    : null;

  document.querySelectorAll('.media-video[data-video]').forEach((slot) => {
    if (getComputedStyle(slot).position === 'static') slot.style.position = 'relative';
    const v = document.createElement('video');
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('autoplay', '');
    v.setAttribute('loop', '');
    // sit on top of the poster <img>, hidden until the clip actually plays
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
      'object-fit:cover;display:block;opacity:0;transition:opacity .35s ease';
    v.addEventListener('playing', () => { v.style.opacity = '1'; });
    v.src = `../assets/${root}/${slot.dataset.video}.mp4`;
    slot.appendChild(v);              // in the DOM now (over the poster)
    v.play().catch(() => {});
    if (io) io.observe(slot);
  });

  // Autoplay can be blocked until the first user gesture — on it, (re)play
  // every video currently on screen.
  const kick = () => document.querySelectorAll('.media-video[data-video] video').forEach((v) => {
    const r = v.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) v.play().catch(() => {});
  });
  ['touchstart', 'pointerdown', 'click', 'scroll'].forEach((ev) =>
    addEventListener(ev, kick, { once: true, passive: true })
  );
})();
