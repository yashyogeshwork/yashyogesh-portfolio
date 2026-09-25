// Skip loading the hero video entirely on a slow/metered connection or
// when the visitor has requested reduced motion — the poster image
// stays as a real, considered fallback in that case, not a broken gap.
(() => {
  function shouldSkipVideo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = conn && conn.saveData;
    const slowConnection = conn && /2g/.test(conn.effectiveType || '');
    const reducedData = window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return saveData || slowConnection || reducedData || reducedMotion;
  }

  if (!shouldSkipVideo()) return;

  document.querySelectorAll('.project-intro-media video').forEach((video) => {
    video.removeAttribute('autoplay');
    video.querySelectorAll('source').forEach((s) => s.remove());
    video.load();
    // No 'playing' event will ever fire on a video with no source, so
    // without this the poster stays hidden behind the fade-in opacity
    // that was added for the actual video handoff — a real gap this
    // change would have introduced.
    video.style.opacity = '1';
  });
})();
