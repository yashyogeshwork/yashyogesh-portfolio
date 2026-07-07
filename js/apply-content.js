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
})();
