/* ==========================================================================
   PROJECT PAGE NAV — switches from transparent/light-text (over hero)
   to solid white/dark-text once scrolled past the cinematic intro.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('siteNav');
  const intro = document.querySelector('.project-intro');
  if (!nav || !intro) return;

  const navLogo = nav.querySelector('.nav-logo');
  const navLinks = nav.querySelectorAll('.nav-link');

  // C1's hero is a light background now, not a dark photo/video like
  // Hive and TOAD — text stays dark in both states here, unlike the
  // white-on-dark-hero swap below, but it still needs the same real
  // scroll transition (transparent over the hero, solid white bar
  // with border once scrolled past), not a permanently-transparent
  // nav that never changes no matter how far down the page you go.
  const heroIsLight = document.body.dataset.page === 'project-c1';

  function applyDarkOnLight() {
    nav.classList.add('is-scrolled');
    nav.classList.remove('is-hidden-home');
    navLogo.style.color = 'var(--color-text-primary)';
    navLinks.forEach((l) => (l.style.color = ''));
  }

  function applyLightOnDark() {
    nav.classList.remove('is-scrolled');
    nav.classList.add('is-hidden-home');
    navLogo.style.color = 'var(--color-bg)';
    navLinks.forEach((l) => (l.style.color = 'rgba(255,255,255,0.8)'));
  }

  function applyTransparentDark() {
    // Same transparent, no-blur treatment as is-hidden-home, but with
    // dark text instead of white — C1's own light-hero state.
    nav.classList.remove('is-scrolled', 'is-hidden-home');
    nav.style.background = 'transparent';
    nav.style.backdropFilter = 'none';
    nav.style.webkitBackdropFilter = 'none';
    nav.style.borderBottom = 'none';
    navLogo.style.color = 'var(--color-text-primary)';
    navLinks.forEach((l) => (l.style.color = ''));
  }

  function resetInlineOverrides() {
    // Clears the manual transparent/no-blur overrides so the normal
    // is-scrolled CSS (solid white background, real border) can
    // actually apply once scrolled past the hero.
    nav.style.background = '';
    nav.style.backdropFilter = '';
    nav.style.webkitBackdropFilter = '';
    nav.style.borderBottom = '';
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (heroIsLight) {
            applyTransparentDark();
          } else {
            applyLightOnDark();
          }
        } else {
          if (heroIsLight) resetInlineOverrides();
          applyDarkOnLight();
        }
      });
    },
    { threshold: 0.15 }
  );

  observer.observe(intro);
});
