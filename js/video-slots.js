// Video slots — shared component. A .media-video[data-video] slot is turned
// into a muted, inline, looping <video> whose poster frame is the slot's
// original <img>, streaming ../assets/<data-video-root>/<name>.mp4.
//
// Mobile-robust (iPhone / iOS WebKit — incl. iOS Chrome):
//  • the <video> goes into the DOM IMMEDIATELY (poster attribute shows the
//    still until it plays) so iOS's NATIVE inline-autoplay engine engages —
//    the previous "wait for loadeddata, then swap" left the element out of the
//    DOM and iOS never started it;
//  • muted + playsinline + autoplay + loop are set as ATTRIBUTES (iOS ignores
//    the JS-only properties for autoplay);
//  • an IntersectionObserver plays the on-screen video and pauses the rest
//    (keeps desktop light and matches iOS's scroll behaviour);
//  • play is retried on the first user gesture (covers Low-Power / strict
//    blocks — a tap or scroll starts them).
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
    const poster = slot.querySelector('img');
    const posterSrc = poster && poster.getAttribute('src');
    const v = document.createElement('video');
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('autoplay', '');
    v.setAttribute('loop', '');
    if (posterSrc) v.setAttribute('poster', posterSrc);
    v.src = `../assets/${root}/${slot.dataset.video}.mp4`;
    slot.replaceChildren(v);          // in the DOM now — poster shows until play
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
