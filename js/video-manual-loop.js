// Hero video: a manual loop, plus a reveal that can never leave the video
// stuck behind its cover image, and never shows a frozen frame.
//
// 1. Manual loop instead of the native <video loop>: some browsers flash
//    black exactly at the native restart even when frame 0 is a keyframe.
//    Restarting a hair after zero sidesteps it.
//
// 2. Reveal. The cover image stays up while the video loads and starts
//    playing underneath, then the video fades in once it can keep playing:
//      - the whole file is buffered, or
//      - the download is clearly outrunning playback (>= 1.3x, 3s ahead), or
//      - it has been playing for 3s with at least 1.5s of video ahead.
//    The last rule matters: Safari (iPad, iPhone) only buffers a short
//    window ahead of the playhead, so "fully downloaded" never happens
//    there. Waiting for it left the video hidden forever.
//
// 3. If playback stalls while visible (a slow connection), the video fades
//    back to the cover image instead of showing a frozen frame, and fades
//    in again when it has a little video ahead. It never freezes on screen.
//
// 4. Autoplay can be blocked (iOS Low Power Mode, some browser settings).
//    The first touch, click, key press or scroll then starts the video.
(() => {
  document.querySelectorAll('.project-intro-media video').forEach((video) => {
    let revealed = false;
    let playingSince = 0;
    let lastEnd = 0, lastT = 0, outrunning = false;

    const aheadSeconds = () => {
      const b = video.buffered;
      if (!b || !b.length) return 0;
      // the range that contains the playhead
      for (let i = 0; i < b.length; i++) {
        if (video.currentTime >= b.start(i) - 0.1 && video.currentTime <= b.end(i) + 0.1) return b.end(i) - video.currentTime;
      }
      return 0;
    };
    const fullyBuffered = () => {
      const b = video.buffered, d = video.duration;
      return !!(b && b.length && isFinite(d) && d > 0 && b.end(b.length - 1) >= d - 0.3);
    };

    function show() { revealed = true; video.style.opacity = '1'; }
    function hide() { revealed = false; video.style.opacity = '0'; }

    function check() {
      if (video.paused || video.ended || !playingSince) return;
      const ahead = aheadSeconds();
      if (revealed) return;
      const longEnough = performance.now() - playingSince > 3000 && ahead >= 1.5;
      if (fullyBuffered() || outrunning || longEnough) {
        show();
      }
    }

    // Download speed vs playback speed, sampled once a second.
    setInterval(() => {
      const b = video.buffered;
      if (b && b.length) {
        const end = b.end(b.length - 1), now = performance.now() / 1000;
        if (lastT && (end - lastEnd) / (now - lastT) >= 1.3 && aheadSeconds() >= 3) outrunning = true;
        lastEnd = end; lastT = now;
      }
      check();
    }, 1000);

    video.addEventListener('playing', () => {
      if (!playingSince) playingSince = performance.now();
      check();
    });
    ['progress', 'canplaythrough', 'timeupdate'].forEach((t) => video.addEventListener(t, check));

    // Stalled while visible: back to the cover until it has video ahead.
    video.addEventListener('waiting', () => { if (revealed && !fullyBuffered()) hide(); });

    video.addEventListener('ended', () => {
      video.currentTime = 0.05;
      const p = video.play(); if (p && p.catch) p.catch(() => {});
    });

    // Autoplay blocked: start on the first interaction.
    const kick = () => {
      if (!video.paused) return;
      const p = video.play(); if (p && p.catch) p.catch(() => {});
    };
    ['touchstart', 'pointerdown', 'keydown', 'scroll', 'wheel'].forEach((t) =>
      addEventListener(t, kick, { once: true, passive: true }));
    setTimeout(kick, 1500);
  });
})();
