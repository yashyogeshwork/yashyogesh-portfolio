// Responsive background images — background-image has no native
// srcset equivalent for viewport-width-based selection (image-set()
// only handles device pixel ratio, not layout width), so this swaps
// in a genuinely smaller, pre-generated -800w variant on narrow
// viewports after apply-content.js has already set the full-size
// image. Runs once on load and once on resize (debounced), not on
// every scroll or frame.
(() => {
  const MOBILE_BREAKPOINT = 768;

  function toSmallVariant(url) {
    // "images/toad/persona.jpg" -> "images/toad/persona-800w.jpg"
    const match = url.match(/^(.*)\.(jpg|jpeg|webp|png)$/i);
    if (!match) return url;
    return `${match[1]}-800w.${match[2]}`;
  }

  function applyResponsiveImages() {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    document.querySelectorAll('[data-c-bg]').forEach((el) => {
      const current = el.style.backgroundImage;
      const urlMatch = current.match(/url\(['"]?([^'")]+)['"]?\)/);
      if (!urlMatch) return;
      const currentUrl = urlMatch[1];
      const isAlreadySmall = /-800w\.(jpg|jpeg|webp|png)$/i.test(currentUrl);

      if (isMobile && !isAlreadySmall) {
        el.style.backgroundImage = `url('${toSmallVariant(currentUrl)}')`;
      } else if (!isMobile && isAlreadySmall) {
        el.style.backgroundImage = `url('${currentUrl.replace('-800w.', '.')}')`;
      }
    });
  }

  // Run after apply-content.js has had a chance to set the real
  // background images — a microtask delay is enough since both
  // scripts run synchronously on initial page load.
  setTimeout(applyResponsiveImages, 0);

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyResponsiveImages, 200);
  });
})();
