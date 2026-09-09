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
  document.querySelectorAll('[data-c-bg]').forEach((el) => {
    const val = get(el.getAttribute('data-c-bg'));
    if (typeof val === 'string' && val.length) {
      el.style.backgroundImage = `url('${val}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
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
