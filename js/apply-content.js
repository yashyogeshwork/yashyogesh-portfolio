/* ==========================================================================
   APPLY-CONTENT — fills the page from js/content.js.
   Any element with data-c="path.to.key" gets its text replaced by the
   matching value in window.CONTENT. Links can use data-c-href to set
   their href from content instead.

   This is what makes every page editable from ONE file (or from
   admin.html) without touching HTML.
   ========================================================================== */

(function () {
  if (!window.CONTENT) return;

  /* Local preview support: if admin.html saved a preview in this browser,
     merge it over the live content — ONLY on this device. The live site
     (and everyone else) still sees the published content.js. */
  try {
    const preview = localStorage.getItem('contentPreviewJSON');
    if (preview) window.CONTENT = JSON.parse(preview);
  } catch (e) { /* ignore corrupt preview */ }

  function get(path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), window.CONTENT);
  }

  document.querySelectorAll('[data-c]').forEach((el) => {
    const val = get(el.getAttribute('data-c'));
    if (typeof val === 'string' && val.length) el.textContent = val;
  });

  document.querySelectorAll('[data-c-href]').forEach((el) => {
    const val = get(el.getAttribute('data-c-href'));
    if (typeof val === 'string' && val.length) {
      el.setAttribute('href', val.includes('@') ? 'mailto:' + val : val);
    }
  });

  /* data-c-bg="path.to.key" — swaps an element's background-image to a
     real photo once one is set, otherwise leaves whatever's already
     there (the gradient placeholder), so nothing breaks before real
     images exist. */
  // Which size of a slide to load, per visitor. Each slide exists in five
  // sizes (800 / 1200 / 1600 / 2400 wide and the full-resolution original). The one
  // chosen is the smallest that still covers the slide's on-screen width at
  // the screen's pixel density, so a phone downloads a small file while a
  // retina laptop or a 27-inch monitor gets a genuinely sharp one. (Slides
  // used to be a single size, shrunk well below the originals to keep pages
  // light, which made them soft on high-density and large screens.)
  const SLIDE_LADDER = [800, 1200, 1600];
  window.pickSlideVariant = function (url, cssWidth) {
    if (!/-v4\.(jpg|jpeg|webp|png)$/i.test(url)) return url; // not a ladder image
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const need = (cssWidth || window.innerWidth) * dpr;
    for (const t of SLIDE_LADDER) {
      if (t >= need * 0.97) return url.replace(/\.(jpg|jpeg|webp|png)$/i, `-${t}w.$1`);
    }
    return url; // the full-resolution original
  };
  // Each image also loads only when its slide is about a screen from view.
  const setBg = (el) => { el.style.backgroundImage = `url('${el.dataset.cBgSrc}')`; };
  const lazyBg = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { setBg(e.target); lazyBg.unobserve(e.target); }
      }), { rootMargin: '100% 0px' })
    : null;
  document.querySelectorAll('[data-c-bg]').forEach((el) => {
    const val = get(el.getAttribute('data-c-bg'));
    if (typeof val === 'string' && val.length) {
      el.dataset.cBgSrc = window.pickSlideVariant(val, el.getBoundingClientRect().width / (parseFloat(getComputedStyle(el).getPropertyValue('--cw')) || 1));
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      if (lazyBg) lazyBg.observe(el); else setBg(el);
    }
  });

  /* data-c-src="path.to.key" — for <source> elements inside hero
     videos, same idea as data-c-bg but for actual video files. */
  document.querySelectorAll('[data-c-src]').forEach((el) => {
    const val = get(el.getAttribute('data-c-src'));
    if (typeof val === 'string' && val.length) {
      el.setAttribute('src', val);
      const video = el.closest('video');
      if (video) video.load();
    }
  });
})();
