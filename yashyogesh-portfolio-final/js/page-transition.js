/* ==========================================================================
   SHARED PAGE TRANSITION — used on every page.
   One consistent transition language site-wide: a solid veil fades in
   before any internal navigation, and fades out on arrival. Exposed as
   window.pageTransitionOut(href) so other scripts (studio.js) can trigger
   the exact same transition instead of rolling their own.
   ========================================================================== */

(function () {
  function ensureVeil() {
    let veil = document.getElementById('pageVeil');
    if (!veil) {
      veil = document.createElement('div');
      veil.id = 'pageVeil';
      veil.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:9999',
        'background:#111111',
        'opacity:1',
        'pointer-events:none',
        'transition:opacity 0.45s cubic-bezier(0.16,1,0.3,1)',
      ].join(';');
      document.body.appendChild(veil);
    }
    return veil;
  }

  const veil = ensureVeil();

  // Fade the veil out shortly after this page has loaded — the "arrival" half.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { veil.style.opacity = '0'; });
  });

  // The "departure" half — exposed globally so any script on any page can
  // trigger the identical transition rather than building its own veil.
  window.pageTransitionOut = function (href, delay) {
    veil.style.pointerEvents = 'all';
    veil.style.opacity = '1';
    setTimeout(() => { window.location.href = href; }, delay || 420);
  };

  // Intercept ordinary same-site link clicks site-wide so every navigation
  // — footer links, nav links, "next project" links, anything — uses this
  // same transition without each page needing its own click handler.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
    if (a.target === '_blank' || a.hasAttribute('data-no-transition')) return;
    if (/^https?:\/\//i.test(href)) return; // external links: leave alone

    e.preventDefault();
    window.pageTransitionOut(href);
  });
})();
