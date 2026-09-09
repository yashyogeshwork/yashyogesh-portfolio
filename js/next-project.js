(() => {
  const link = document.getElementById('nextProjectLink');
  if (!link) return;
  const targetHref = link.getAttribute('href');

  let overscroll = 0;
  const THRESHOLD = 260; // how much extra scroll intent past the bottom triggers navigation
  let navigating = false;

  function atBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  }

  function goNext() {
    if (navigating) return;
    navigating = true;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'project_complete', { page_path: window.location.pathname });
    }
    if (window.pageTransitionOut) {
      window.pageTransitionOut(targetHref);
    } else {
      window.location.href = targetHref;
    }
  }

  addEventListener('wheel', (e) => {
    if (navigating) return;
    if (atBottom() && e.deltaY > 0) {
      overscroll += e.deltaY;
      // Give the person visible feedback that their scroll is
      // building toward something, not just being ignored at the edge.
      const pct = Math.min(1, overscroll / THRESHOLD);
      link.style.opacity = String(0.6 + pct * 0.4);
      if (overscroll > THRESHOLD) goNext();
    } else if (!atBottom()) {
      overscroll = 0;
      link.style.opacity = '';
    }
  }, { passive: true });

  // Same idea for touch scrolling on mobile — track continued drag
  // past the bottom edge rather than requiring a tap.
  let touchStartY = null;
  addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  addEventListener('touchmove', (e) => {
    if (navigating || touchStartY === null) return;
    const dy = touchStartY - e.touches[0].clientY;
    if (atBottom() && dy > 0) {
      overscroll = dy * 3; // touch drags are shorter than wheel deltas, scale up
      if (overscroll > THRESHOLD) goNext();
    }
  }, { passive: true });
})();
