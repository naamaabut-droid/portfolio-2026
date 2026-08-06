/* Portrait on the About page: idles with a gentle float, and stays wherever it is dragged. */
(function () {
  var wrap = document.querySelector('.about-portrait');
  if (!wrap) return;

  var dragEl = wrap.querySelector('.about-portrait__drag');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MAX_TRAVEL = 220; // px — how far from its original spot it can be taken
  var x = 0, y = 0;     // current offset
  var tx = 0, ty = 0;   // where the pointer wants it
  var originX = 0, originY = 0;
  var dragging = false;
  var pointerId = null;
  var frame = null;

  function render() {
    // lean into the movement: the tilt comes from how far it is lagging behind the
    // pointer, so it straightens itself out as soon as it catches up
    var lean = Math.max(-14, Math.min(14, (tx - x) * 0.14));
    dragEl.style.transform =
      'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0) rotate(' + lean.toFixed(2) + 'deg)';
  }

  function tick() {
    // trail slightly behind the pointer so it feels weighted, not glued
    var ease = calm ? 1 : 0.22;
    x += (tx - x) * ease;
    y += (ty - y) * ease;
    render();

    // once released and caught up, park it right where it was dropped
    if (!dragging && Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1) {
      x = tx;
      y = ty;
      render();
      frame = null;
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  function run() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function clamp(v) {
    return Math.max(-MAX_TRAVEL, Math.min(MAX_TRAVEL, v));
  }

  wrap.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    dragging = true;
    pointerId = e.pointerId;
    originX = e.clientX - x;
    originY = e.clientY - y;
    tx = x;
    ty = y;
    dragEl.classList.add('is-dragging');
    try { wrap.setPointerCapture(pointerId); } catch (err) {}
    run();
  });

  wrap.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    tx = clamp(e.clientX - originX);
    ty = clamp(e.clientY - originY);
  });

  function release(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    dragEl.classList.remove('is-dragging');
    run(); // let it coast the last few pixels, then stay put
  }

  wrap.addEventListener('pointerup', release);
  wrap.addEventListener('pointercancel', release);
})();
