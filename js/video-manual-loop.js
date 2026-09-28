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
    // Reveal only once the whole file has downloaded. The first version
    // faded in on the first frame; on a slower connection playback then
    // caught up with the download and froze midway (reproduced on a
    // throttled connection: a stall ~20s in). The browser's own
    // "canplaythrough" estimate proved too optimistic (it fired at 9s and
    // the video still stalled), so this waits for the full buffer instead.
    // Until then the cover image stays up while the video keeps loading
    // and playing underneath (iPhones only load video while it plays);
    // any stall happens out of sight. On reveal it restarts from the top,
    // and every loop after that plays from memory, so it can't freeze.
    let playing = false, revealed = false;
    const fullyBuffered = () => {
      const b = video.buffered, d = video.duration;
      return b.length > 0 && isFinite(d) && d > 0 && b.end(b.length - 1) >= d - 0.3;
    };
    // On a fast connection there's no need to wait for the whole file:
    // if the download is comfortably outrunning playback (buffer growing
    // at 1.3x real time or better, with 3s already in hand), playback can
    // never catch up with it, so reveal straight away.
    let lastEnd = 0, lastT = 0, safe = false;
    const sample = setInterval(() => {
      if (revealed) { clearInterval(sample); return; }
      const b = video.buffered;
      if (!b.length) return;
      const end = b.end(b.length - 1), now = performance.now() / 1000;
      if (lastT) {
        const rate = (end - lastEnd) / (now - lastT);
        const ahead = end - video.currentTime;
        if (rate >= 1.3 && ahead >= 3) safe = true;
      }
      lastEnd = end; lastT = now;
      reveal();
    }, 1000);
    const reveal = () => {
      if (revealed || !playing || !(safe || fullyBuffered())) return;
      revealed = true;
      if (video.currentTime > 2) { try { video.currentTime = 0.05; } catch (e) {} }
      video.style.opacity = '1';
    };
    video.addEventListener('playing', () => { playing = true; reveal(); });
    video.addEventListener('progress', reveal);
    video.addEventListener('canplaythrough', reveal);

    video.addEventListener('ended', () => {
      video.currentTime = 0.05;
      video.play();
    });
  });
})();
