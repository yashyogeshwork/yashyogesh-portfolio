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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          applyLightOnDark();
        } else {
          applyDarkOnLight();
        }
      });
    },
    { threshold: 0.15 }
  );

  observer.observe(intro);
});
