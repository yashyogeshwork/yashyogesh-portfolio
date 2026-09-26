/* ==========================================================================
   SHARED SCROLL-REVEAL, used on every page.
   A restrained fade-up for headings, copy and images.

   How it works (rewritten after an audit of how it felt on the page):
   1. Look-ahead: photos start loading about a screen before they're
      reached, so by the time something reveals its photo is usually
      already there. Previously loading only began at the moment of
      reveal, so the wait landed exactly when you were looking at it.
   2. Earlier trigger: an element reveals once its top edge is a little
      way into the screen. The old rule needed 15% of the element's
      height visible, which on a 710px board meant ~170px of blank card
      scrolling in before the fade even started.
   3. Waits for both kinds of photo: CSS background images (TOAD, C1)
      and real <img> tags (Hive). Before, <img> photos were not waited
      for, so their fade could finish before the picture arrived.
   A short cap means a slow photo never keeps content hidden for long.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const els = [...document.querySelectorAll('.reveal')];
  if (!els.length) return;

  const WAIT_CAP_MS = 900;
  const ready = new WeakMap(); // element -> Promise that resolves when its photo is ready

  function bgUrl(el) {
    const bg = getComputedStyle(el).backgroundImage || '';
    const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : null;
  }

  function loadPhoto(el) {
    if (ready.has(el)) return ready.get(el);
    const imgs = [...el.querySelectorAll('img')];
    let p;
    if (imgs.length) {
      p = Promise.all(imgs.map((img) => {
        img.loading = 'eager';
        if (img.complete && img.naturalWidth) return Promise.resolve();
        return (img.decode ? img.decode() : new Promise((r) => { img.onload = r; })).catch(() => {});
      }));
    } else {
      const url = bgUrl(el);
      p = url ? new Promise((resolve) => {
        const im = new Image();
        im.onload = im.onerror = () => resolve();
        im.src = url;
        if (im.decode) im.decode().then(resolve, resolve);
      }) : Promise.resolve();
    }
    ready.set(el, p);
    return p;
  }

  function reveal(el) {
    // Cards holding real <img> tags reveal on time as a soft placeholder,
    // and the photo fades in inside them once decoded (see .is-loaded in
    // project.css), so there's neither an empty gap nor a late pop.
    if (el.querySelector('img')) {
      el.classList.add('is-visible');
      el.querySelectorAll('img').forEach((img) => {
        const mark = () => img.classList.add('is-loaded');
        if (img.complete && img.naturalWidth) mark();
        else {
          img.loading = 'eager';
          const fallback = () => {
            if (img.complete) mark();
            else { img.addEventListener('load', mark, { once: true }); img.addEventListener('error', mark, { once: true }); }
          };
          (img.decode ? img.decode() : Promise.reject()).then(mark, fallback);
        }
      });
      return;
    }
    let done = false;
    const show = () => { if (!done) { done = true; el.classList.add('is-visible'); } };
    loadPhoto(el).then(show);
    setTimeout(show, WAIT_CAP_MS);
  }

  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-visible')); return; }

  // Start loading roughly one screen ahead.
  const lookahead = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { loadPhoto(e.target); lookahead.unobserve(e.target); } });
  }, { rootMargin: '100% 0px 100% 0px' });

  // Reveal once the top edge is a little way into the screen.
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); revealer.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

  els.forEach((el) => { lookahead.observe(el); revealer.observe(el); });
});
