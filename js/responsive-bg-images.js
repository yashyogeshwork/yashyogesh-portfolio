// Keeps slide images sharp when the window changes. apply-content.js picks
// the right size when the page loads; if the window is later made larger
// (or the page is zoomed), this upgrades the slides to a bigger size. It
// only ever upgrades: shrinking the window never swaps in a softer image.
// Runs on resize (debounced), never on scroll or per frame.
(() => {
  const rank = (u) => { const m = u.match(/-(\d+)w\.[a-z]+$/i); return m ? +m[1] : 99999; };
  const stripSize = (u) => u.replace(/-\d+w(\.[a-z]+)$/i, '$1');

  function refresh() {
    if (!window.pickSlideVariant) return;
    document.querySelectorAll('[data-c-bg]').forEach((el) => {
      const current = el.dataset.cBgSrc;
      if (!current) return;
      const wanted = window.pickSlideVariant(stripSize(current), el.getBoundingClientRect().width);
      if (rank(wanted) <= rank(current)) return;
      el.dataset.cBgSrc = wanted;
      if (el.style.backgroundImage) el.style.backgroundImage = `url('${wanted}')`;
    });
  }

  let timer;
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(refresh, 250); });
})();
