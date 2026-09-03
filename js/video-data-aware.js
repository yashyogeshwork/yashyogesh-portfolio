// Skip the hero video entirely when it's not the right thing to
// autoplay — checks four real signals: the Save-Data header
// preference (well-supported on Chrome/Android), the network's
// reported effective type (2g/slow-2g), the newer
// prefers-reduced-data CSS media feature, and prefers-reduced-motion
// (the same preference every other piece of continuous motion on
// this site already respects — this was the one exception before).
// If any of these apply, the video's source is removed before it
// ever starts downloading or playing, and the poster image just
// stays as the permanent, static background.
(() => {
  const video = document.querySelector('.project-intro-media video');
  if (!video) return;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = conn && conn.saveData;
  const slowConnection = conn && /2g/.test(conn.effectiveType || '');
  const reducedData = window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (saveData || slowConnection || reducedData || reducedMotion) {
    video.removeAttribute('autoplay');
    video.pause();
    video.querySelectorAll('source').forEach((s) => s.remove());
    video.removeAttribute('src');
    video.load(); // clears any buffered/pending download, leaves the poster showing
  }
})();
