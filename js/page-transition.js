/* ==========================================================================
   SHARED PAGE TRANSITION — used on every page.
   One consistent transition language site-wide: a solid veil fades in
   before any internal navigation, and fades out on arrival. Exposed as
   window.pageTransitionOut(href) so other scripts (studio.js) can trigger
   the exact same transition instead of rolling their own.
   ========================================================================== */

(function () {
  // Remember which project was last open, so returning to the homepage
  // (Back to home, the browser's Back button, or a reload) shows that
  // project in front instead of restarting on Hive.
  try {
    const PROJECT_PAGES = { 'hive.html': 'hive.html', 'toad.html': 'toad.html', 'surface-c1.html': 'surface-c1.html', 'sketches.html': 'sketches.html' };
    const page = location.pathname.split('/').pop();
    if (PROJECT_PAGES[page]) sessionStorage.setItem('studio-last', PROJECT_PAGES[page]);
  } catch (e) {}

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

  // Only play the arrival fade when this page was reached from another
  // page of the site (the leaving page sets a short-lived marker). On a
  // first visit, from Google or a shared link, there is no fade at all:
  // the veil used to pop over text that had already appeared and then
  // fade out, which read as text loading slowly, or twice.
  let arriving = false;
  try {
    const t = +sessionStorage.getItem('pt-arrive');
    arriving = t > 0 && Date.now() - t < 4000;
    sessionStorage.removeItem('pt-arrive');
  } catch (e) {}

  const veil = ensureVeil();
  if (!arriving) {
    veil.style.transition = 'none';
    veil.style.opacity = '0';
    requestAnimationFrame(() => { veil.style.transition = 'opacity 0.45s cubic-bezier(0.16,1,0.3,1)'; });
  } else {
    // The "arrival" half of an in-site transition.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { veil.style.opacity = '0'; });
    });
  }

  // When a page is restored from the browser's back-forward cache (e.g.
  // clicking the browser's own Back button) rather than loading fresh,
  // this whole script doesn't re-run — so without this, a page left at
  // full veil opacity right before navigating away would come back
  // exactly as frozen, a solid black screen covering everything, since
  // nothing would ever trigger the fade-out a second time.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      veil.style.pointerEvents = 'none';
      veil.style.opacity = '0';
    }
  });

  // The "departure" half — exposed globally so any script on any page can
  // trigger the identical transition rather than building its own veil.
  window.pageTransitionOut = function (href, delay) {
    try { sessionStorage.setItem('pt-arrive', String(Date.now())); } catch (e) {}
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
    // Leave the browser's own behaviour alone for anything that isn't a
    // plain left-click on a page link: Ctrl/Cmd/Shift/Alt+click (new tab or
    // window, download), middle or right button, and download links such
    // as the CV. Before, these were all turned into a delayed same-tab
    // navigation, so Ctrl+click never opened a new tab and the CV download
    // was hijacked.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (a.target === '_blank' || a.hasAttribute('data-no-transition')) return;
    if (/^https?:\/\//i.test(href)) return; // external links: leave alone

    e.preventDefault();
    window.pageTransitionOut(href);
  });
})();
