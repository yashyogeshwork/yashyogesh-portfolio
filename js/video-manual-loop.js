// Manual loop instead of the native <video loop> attribute — some
// browsers show a brief black flash exactly at the native loop
// restart, even when the file has a correct keyframe at frame 0 (this
// was confirmed directly, not assumed, before writing this fix).
// Restarting a hair after zero instead of exactly at it sidesteps
// whatever edge case triggers it, a well-documented workaround for
// this specific class of issue.
(() => {
  document.querySelectorAll('.project-intro-media video').forEach((video) => {
    video.addEventListener('ended', () => {
      video.currentTime = 0.05;
      video.play();
    });
  });
})();
