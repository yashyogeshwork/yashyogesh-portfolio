/* ==========================================================================
   SCROLL-BACK — mirrors the carousel's "scroll past the end" exit.
   On any page with <body data-scroll-back="somepage.html">, scrolling up
   (or swiping down) while already at the very top of the page carries
   the visitor back — e.g. About → landing page — using the same shared
   transition veil as everywhere else on the site.
   ========================================================================== */

(function () {
  const target = document.body.dataset.scrollBack;
  if (!target) return;

  const THRESHOLD = 90;
  const AT_TOP_PX = 4;
  let acc = 0;
  let triggered = false;

  function goBack() {
    if (triggered) return;
    triggered = true;
    if (window.pageTransitionOut) window.pageTransitionOut(target);
    else window.location.href = target;
  }

  function tryBack(delta) {
    if (triggered) return;
    if (window.scrollY > AT_TOP_PX) { acc = 0; return; }
    if (delta < 0) {
      acc += delta;
      if (acc < -THRESHOLD) goBack();
    } else {
      acc = 0;
    }
  }

  window.addEventListener('wheel', (e) => tryBack(e.deltaY), { passive: true });

  let lastY = 0;
  window.addEventListener('touchstart', (e) => { lastY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    const cy = e.touches[0].clientY;
    if (window.scrollY > AT_TOP_PX) { lastY = cy; return; }
    // Finger moving DOWN the screen (cy increasing) = same intent as a
    // desktop "scroll up" — same sign convention as the carousel's own
    // swipe handling elsewhere on the site.
    const deltaY = lastY - cy;
    lastY = cy;
    tryBack(deltaY);
  }, { passive: true });
})();
