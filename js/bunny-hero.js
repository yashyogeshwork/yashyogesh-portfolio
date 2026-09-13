// Real video playback via Bunny Stream's direct HLS URLs, using a
// plain native <video> element — no third-party player UI, no
// iframe, full control, the same clean approach this site used
// before switching to (and back off of) an embedded platform.
// hls.js handles playback everywhere except Safari, which plays HLS
// natively without needing the library at all.
(() => {
  const CDN_HOST = 'vz-5b292803-d63.b-cdn.net';

  function shouldPlayVideo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = conn && conn.saveData;
    const slowConnection = conn && /2g/.test(conn.effectiveType || '');
    const reducedData = window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !(saveData || slowConnection || reducedData || reducedMotion);
  }

  function attachHls(video, src) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari plays HLS natively — no library needed.
      video.src = src;
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return;
    }
    // Neither native HLS nor hls.js available (very old browser) —
    // leave the poster showing rather than fail loudly.
  }

  function setupVideo(videoId, videoGuid) {
    const video = document.getElementById(videoId);
    if (!video) return;

    const src = `https://${CDN_HOST}/${videoGuid}/playlist.m3u8`;
    attachHls(video, src);

    // Manual loop instead of the native loop attribute — a browser's
    // native restart-on-loop can show a brief black flash even with a
    // correct first frame, a real, previously-confirmed issue on this
    // project. Restarting a hair after zero instead of exactly at it
    // avoids that.
    video.addEventListener('ended', () => {
      video.currentTime = 0.05;
      video.play();
    });
  }

  const HERO_VIDEOS = [
    ['hiveHeroVideo', '6a179efe-0abb-4724-aa76-2de725b973a1'],
    ['toadHeroVideo', 'b8084a8a-1890-460a-be85-2359eb882651'],
  ];

  // Only videos that actually exist on this page AND pass the
  // connection/motion check are worth loading hls.js for at all —
  // checking this first, before ever fetching the library, is what
  // actually respects a slow connection or reduced-motion preference,
  // rather than downloading it regardless and only skipping playback
  // afterward.
  const eligible = HERO_VIDEOS.filter(([id]) => document.getElementById(id));
  if (!eligible.length || !shouldPlayVideo()) return;

  if (window.Hls) {
    init();
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js';
    script.onload = init;
    document.head.appendChild(script);
  }

  function init() {
    eligible.forEach(([id, guid]) => setupVideo(id, guid));
  }
})();
