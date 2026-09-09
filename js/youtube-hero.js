// YouTube background-video embed — built only when conditions are
// right (matches what video-data-aware.js used to do for the native
// video element). YouTube's own player handles looping internally via
// the loop+playlist parameters, so the manual-loop black-flash
// workaround that was needed for our own H.264 files doesn't apply
// here at all, that was specific to the native <video loop> restart
// mechanism, not something YouTube's player has.
(() => {
  function shouldPlayVideo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = conn && conn.saveData;
    const slowConnection = conn && /2g/.test(conn.effectiveType || '');
    const reducedData = window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !(saveData || slowConnection || reducedData || reducedMotion);
  }

  function sizeToCover(iframe, container) {
    // YouTube embeds are always 16:9 — to "cover" a container with a
    // different aspect ratio, the iframe has to be deliberately
    // oversized on one axis and centered, the same logic object-fit:
    // cover applies to a real <video>, just done by hand since
    // iframes don't reliably support object-fit across browsers.
    function resize() {
      const rect = container.getBoundingClientRect();
      const containerRatio = rect.width / rect.height;
      const videoRatio = 16 / 9;
      let w, h;
      if (containerRatio > videoRatio) {
        w = rect.width;
        h = w / videoRatio;
      } else {
        h = rect.height;
        w = h * videoRatio;
      }
      iframe.style.width = w + 'px';
      iframe.style.height = h + 'px';
      iframe.style.left = (rect.width - w) / 2 + 'px';
      iframe.style.top = (rect.height - h) / 2 + 'px';
    }
    resize();
    addEventListener('resize', resize);
  }

  function embedYouTube(containerId, videoId) {
    const container = document.getElementById(containerId);
    if (!container || !shouldPlayVideo()) return;

    const iframe = document.createElement('iframe');
    const params = [
      'autoplay=1', 'mute=1', 'loop=1', `playlist=${videoId}`,
      'controls=0', 'showinfo=0', 'modestbranding=1', 'rel=0',
      'iv_load_policy=3', 'playsinline=1', 'disablekb=1', 'fs=0',
    ].join('&');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    iframe.style.position = 'absolute';
    iframe.style.border = 'none';
    iframe.style.pointerEvents = 'none'; // background video, not an interactive player
    iframe.setAttribute('allow', 'autoplay; encrypted-media');
    iframe.setAttribute('title', ''); // decorative background video, not content needing an accessible name

    container.appendChild(iframe);
    sizeToCover(iframe, container);
  }

  embedYouTube('hiveHeroEmbed', '56FzDGYKALI');
  embedYouTube('toadHeroEmbed', '1SaLk_rTwOQ');
})();
