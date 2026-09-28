// Scroll-linked slide entrance (Hive, TOAD, C1).
// A static stack of slides reads like a PDF. Here each slide responds to
// the viewer's own scroll: as it rises from the bottom of the screen it
// fades in, lifts slightly and scales up to full size, settling once it's
// about halfway up. The motion is tied to scroll position, not a timer:
// scroll slowly and it arrives slowly; stop and it waits. Only transform
// and opacity change (cheap for the browser), and only for slides near the
// screen. Reduced-motion visitors get the slides fully shown, no motion.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const slides = [...document.querySelectorAll('.cs-board, .cs-render, .cs-problem-image, .cs-fullbleed, .cs-image-stack-item, .cs-split-media')];
  if (!slides.length) return;

  // These slides are driven by scroll now, so they leave the one-shot
  // fade-in system (its 0.9s transition would make the scrub lag).
  slides.forEach((el) => { el.classList.remove('reveal'); el.classList.add('slide-scrub'); });
  // Hive's <img> boards fade their photo in once decoded (.is-loaded); that
  // used to be done by the reveal system, so do it here now.
  slides.forEach((el) => el.querySelectorAll('img').forEach((img) => {
    const mark = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) mark();
    else { img.addEventListener('load', mark, { once: true }); img.addEventListener('error', mark, { once: true }); }
  }));

  const isPhone = () => innerWidth <= 768;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Each slide's resting position on the page, measured with its
  // transform cleared, so the lift/scale never feeds back into the maths.
  // Re-measured only when the layout changes (images load, resize), so a
  // scroll frame does no layout reads at all: just arithmetic and writes.
  let tops = [];
  function measure() {
    const saved = slides.map((el) => el.style.transform);
    slides.forEach((el) => { el.style.transform = 'none'; });
    tops = slides.map((el) => el.getBoundingClientRect().top + scrollY);
    slides.forEach((el, i) => { el.style.transform = saved[i]; });
  }

  function update() {
    ticking = false;
    const vh = innerHeight, y = scrollY;
    const lift = isPhone() ? 24 : 48;      // px the slide rises
    const grow = isPhone() ? 0.03 : 0.06;  // how much smaller it starts
    for (let i = 0; i < slides.length; i++) {
      const top = tops[i] - y;
      if (top > vh + 50 || top < -vh * 2) continue; // far away: skip
      // 0 when the slide's top is at the bottom of the screen,
      // 1 once its top has risen ~55% of the screen height.
      const t = Math.min(1, Math.max(0, (vh - top) / (vh * 0.55)));
      const e = easeOut(t);
      slides[i].style.opacity = String(e);
      slides[i].style.transform = `translate3d(0, ${((1 - e) * lift).toFixed(1)}px, 0) scale(${(1 - grow + grow * e).toFixed(4)})`;
    }
  }
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  const remeasure = () => { measure(); update(); };
  addEventListener('resize', remeasure);
  addEventListener('load', remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
  measure();
  update();
})();
