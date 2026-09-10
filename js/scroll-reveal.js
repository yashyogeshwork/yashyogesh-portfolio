/* ==========================================================================
   SHARED SCROLL-REVEAL — used on every page.
   Consistent, restrained fade-up-on-enter for headings, body copy, and
   images across About, Contact, and every case study — so the whole site
   feels paced, not just the homepage carousel and sketch wall.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  function revealNow(el) {
    el.classList.add('is-visible');
  }

  function reveal(el) {
    // Elements with a real background-image (case-study photos) wait
    // for that actual image to finish loading before revealing — the
    // reveal animation firing purely on scroll position, with no idea
    // whether the photo behind it has actually arrived yet, is what
    // caused the real image to visibly pop in after the fade-up
    // already finished, disconnected from the motion that was
    // supposed to bring it in.
    const style = el.getAttribute('style') || '';
    const match = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
    if (match && match[1]) {
      const img = new Image();
      let done = false;
      const finish = () => { if (!done) { done = true; revealNow(el); } };
      img.onload = finish;
      img.onerror = finish;
      img.src = match[1];
      // A real photo already cached loads instantly (onload fires
      // synchronously-ish), so this only ever adds a wait when there
      // genuinely is one — and a hard cap means a slow or failed
      // image still reveals eventually rather than staying hidden.
      setTimeout(finish, 2500);
    } else {
      revealNow(el);
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  els.forEach((el) => io.observe(el));
});
