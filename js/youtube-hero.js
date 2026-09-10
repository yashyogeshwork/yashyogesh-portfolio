// YouTube background-video embed, built via the real Player API, not
// URL parameters. The simpler loop=1&playlist=ID approach looks
// equivalent but has a known, real quirk: during the transition back
// to the start, it can briefly show YouTube's own "video ended"
// screen, complete with play/pause/next/previous controls, before the
// loop actually kicks in. Controlling playback directly and
// restarting the video ourselves the instant it ends avoids that
// screen ever having a chance to appear at all.
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

  const pending = [];

  function embedYouTube(containerId, videoId) {
    const container = document.getElementById(containerId);
    if (!container || !shouldPlayVideo()) return;

    const placeholder = document.createElement('div');
    container.appendChild(placeholder);
    pending.push({ placeholder, container, videoId });
  }

  function createPlayer({ placeholder, container, videoId }) {
    const player = new YT.Player(placeholder, {
      videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        showinfo: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        playsinline: 1,
        disablekb: 1,
        fs: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (e) => {
          const iframe = player.getIframe();
          iframe.style.position = 'absolute';
          iframe.style.border = 'none';
          iframe.style.pointerEvents = 'none';
          iframe.style.opacity = '0';
          iframe.style.transition = 'opacity 0.4s ease';
          iframe.setAttribute('title', '');
          sizeToCover(iframe, container);
          e.target.playVideo();
          requestAnimationFrame(() => { iframe.style.opacity = '1'; });
        },
        onStateChange: (e) => {
          // Restart the instant it ends, in code — this is what
          // actually prevents YouTube's own end-screen controls from
          // ever rendering, rather than trying to hide them after the
          // fact with CSS or the loop URL parameter's own timing.
          if (e.data === YT.PlayerState.ENDED) {
            player.seekTo(0);
            player.playVideo();
          }
        },
      },
    });
  }

  window.onYouTubeIframeAPIReady = () => {
    pending.forEach(createPlayer);
  };

  embedYouTube('hiveHeroEmbed', '56FzDGYKALI');
  embedYouTube('toadHeroEmbed', '1SaLk_rTwOQ');

  if (pending.length) {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }
})();
