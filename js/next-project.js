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

  // Reaching the bottom is not a request to leave. A fast scroll (or the
  // momentum tail of a trackpad swipe) keeps firing wheel events after the
  // page hits the bottom, and those used to pile up past the threshold, so
  // a single scroll-to-the-bottom could jump to the next project and the
  // footer was almost unreachable. Now the visitor must first REST at the
  // bottom (PAUSE_MS), and only a fresh gesture that starts after that
  // counts toward opening the next project.
  const PAUSE_MS = 900;      // how long to rest at the bottom before overscroll counts
  const GESTURE_GAP_MS = 200; // a gap this long between wheel events = a new gesture
  let arrivedAt = 0;         // when the page arrived at the bottom (0 = not there)
  let lastWheelAt = 0;
  let gestureCounts = false; // does the gesture in progress count? (decided when it starts)

  function leaveBottom() {
    arrivedAt = 0;
    overscroll = 0;
    gestureCounts = false;
    link.style.opacity = '';
  }

  addEventListener('scroll', () => {
    if (navigating) return;
    if (atBottom()) { if (!arrivedAt) arrivedAt = performance.now(); }
    else if (arrivedAt) leaveBottom();
  }, { passive: true });

  addEventListener('wheel', (e) => {
    if (navigating) return;
    const now = performance.now();
    const freshGesture = now - lastWheelAt > GESTURE_GAP_MS;
    lastWheelAt = now;

    if (!atBottom()) { if (arrivedAt || overscroll) leaveBottom(); return; }
    if (!arrivedAt) arrivedAt = now;

    // Decided once, when a gesture begins: it counts only if the visitor has
    // already been resting at the bottom. The tail of the scroll that
    // brought them here never counts.
    if (freshGesture) gestureCounts = now - arrivedAt > PAUSE_MS;
    if (!gestureCounts || e.deltaY <= 0) return;

    overscroll += e.deltaY;
    // Visible feedback that the scroll is building toward something.
    const pct = Math.min(1, overscroll / THRESHOLD);
    link.style.opacity = String(0.6 + pct * 0.4);
    if (overscroll > THRESHOLD) goNext();
  }, { passive: true });

  // Touch: the drag has to BEGIN while the visitor is already resting at the
  // bottom. A long swipe that merely ends at the bottom no longer carries on
  // into the next project.
  let touchStartY = null;
  let touchCounts = false;
  addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchCounts = atBottom() && arrivedAt && (performance.now() - arrivedAt) > PAUSE_MS;
  }, { passive: true });

  addEventListener('touchmove', (e) => {
    if (navigating || touchStartY === null || !touchCounts) return;
    const dy = touchStartY - e.touches[0].clientY;
    if (atBottom() && dy > 0) {
      overscroll = dy * 3; // touch drags are shorter than wheel deltas, scale up
      if (overscroll > THRESHOLD) goNext();
    }
  }, { passive: true });
})();
