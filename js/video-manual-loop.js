// Manual loop instead of the native <video loop> attribute — some
// browsers show a brief black flash exactly at the native loop
// restart, even when the file has a correct keyframe at frame 0 (this
// was confirmed directly, not assumed, before writing this fix).
// Restarting a hair after zero instead of exactly at it sidesteps
// whatever edge case triggers it, a well-documented workaround for
// this specific class of issue.
(() => {
  document.querySelectorAll('.project-intro-media video').forEach((video) => {
    // Fade in only once real playback has actually started, not just
    // once the file's metadata has loaded — the video previously cut
    // in instantly the moment it began playing, an abrupt handoff
    // from the poster that read as unpolished rather than deliberate.
    video.addEventListener('playing', () => {
      video.style.opacity = '1';
    }, { once: true });

    video.addEventListener('ended', () => {
      video.currentTime = 0.05;
      video.play();
    });
  });
})();
