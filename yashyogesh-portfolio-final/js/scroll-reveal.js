/* ==========================================================================
   SHARED SCROLL-REVEAL — used on every page.
   Consistent, restrained fade-up-on-enter for headings, body copy, and
   images across About, Contact, and every case study — so the whole site
   feels paced, not just the homepage carousel and sketch wall.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  els.forEach((el) => io.observe(el));
});
