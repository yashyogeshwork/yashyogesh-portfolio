// Scroll-depth tracking for case study pages — each threshold fires
// exactly once per page view, not on every scroll tick, so this
// doesn't flood analytics or cost anything in scroll performance.
(() => {
  const thresholds = [50, 90];
  const fired = new Set();

  function checkDepth() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = (scrollTop / docHeight) * 100;

    thresholds.forEach((t) => {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        if (typeof window.gtag === 'function') {
          window.gtag('event', `case_study_scroll_${t}`, { page_path: window.location.pathname });
        }
      }
    });

    if (fired.size === thresholds.length) {
      removeEventListener('scroll', onScroll);
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      checkDepth();
      ticking = false;
    });
  }

  addEventListener('scroll', onScroll, { passive: true });
})();
