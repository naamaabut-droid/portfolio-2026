// Video slots — shared component. A .media-video[data-video] slot keeps its
// poster <img> and lays a muted, inline, looping <video> on top, streaming
// ../assets/<data-video-root>/<name>.mp4.
//
// Bulletproof on mobile (iPhone / iOS WebKit incl. iOS Chrome), where inline
// autoplay is often blocked (Low-Power, strict policies):
//  • the poster <img> is NEVER removed → the slot is never blank;
//  • a play button overlays the poster, so it always reads as a tappable video;
//  • TAP anywhere on the slot plays it — a direct user gesture is always
//    allowed, so this works even when autoplay is refused;
//  • autoplay is still attempted (muted/playsinline/autoplay/loop ATTRIBUTES +
//    an IntersectionObserver) for the hands-off showreel where it's permitted;
//  • the <video> only fades in once it is really rendering frames
//    (currentTime advances) — no black flash over the poster.
// No fetch/CORS involved, so it works over http and file:// alike.
(() => {
  const root = document.body.dataset.videoRoot;
  if (!root) return;

  const PLAY_SVG = '<svg width="20" height="22" viewBox="0 0 20 22" fill="#fff" aria-hidden="true">' +
    '<path d="M19 9.27a2 2 0 0 1 0 3.46L3.5 21.7A2 2 0 0 1 .5 20V2A2 2 0 0 1 3.5.3L19 9.27Z"/></svg>';

  const setup = (slot) => {
    if (getComputedStyle(slot).position === 'static') slot.style.position = 'relative';

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
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
      'object-fit:cover;display:block;opacity:0;transition:opacity .3s ease;pointer-events:none';

    const btn = document.createElement('div');
    btn.className = 'video-play';
    btn.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);' +
      'width:54px;height:54px;border-radius:50%;background:rgba(17,17,19,0.5);' +
      '-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);display:flex;' +
      'align-items:center;justify-content:center;padding-left:4px;pointer-events:none;' +
      'transition:opacity .3s ease;z-index:2';
    btn.innerHTML = PLAY_SVG;

    // reveal the video (and drop the play button) only once it is GENUINELY
    // playing and presenting frames — never on a mere buffered/seeked state, so
    // the poster + button stay put until playback actually starts.
    let shown = false;
    const reveal = () => { if (shown) return; shown = true; v.style.opacity = '1'; btn.style.opacity = '0'; };
    if (v.requestVideoFrameCallback) {
      const onFrame = () => { if (!v.paused) reveal(); else v.requestVideoFrameCallback(onFrame); };
      v.requestVideoFrameCallback(onFrame);   // fires only while frames are composited (i.e. playing)
    } else {
      v.addEventListener('playing', () => setTimeout(() => { if (!v.paused) reveal(); }, 60));
    }

    v.src = `../assets/${root}/${slot.dataset.video}.mp4`;
    slot.appendChild(v);
    slot.appendChild(btn);

    // tap/click always plays (guaranteed user-gesture playback on iOS)
    slot.style.cursor = 'pointer';
    slot.addEventListener('click', () => { v.play().catch(() => {}); });
    return { slot, v };
  };

  const items = [...document.querySelectorAll('.media-video[data-video]')].map(setup);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target.querySelector('video');
        if (!v) return;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: 0.1, rootMargin: '200px 0px' });
    items.forEach(({ slot }) => io.observe(slot));
  } else {
    items.forEach(({ v }) => v.play().catch(() => {}));
  }
})();
