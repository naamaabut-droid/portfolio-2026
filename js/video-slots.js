// Video slots — shared component. A .media-video[data-video] slot shows its
// poster <img> until the MP4 (../assets/<data-video-root>/<name>.mp4) has
// actually loaded, then swaps in an autoplaying loop. No fetch/CORS involved,
// so it works over http and file:// alike. Offscreen videos are paused.
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
      }, { threshold: 0.1 })
    : null;

  document.querySelectorAll('.media-video[data-video]').forEach((slot) => {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.addEventListener('loadeddata', () => {
      slot.replaceChildren(v);
      v.play().catch(() => {});
      if (io) io.observe(slot);
    }, { once: true });
    v.src = `../assets/${root}/${slot.dataset.video}.mp4`;
  });
})();
