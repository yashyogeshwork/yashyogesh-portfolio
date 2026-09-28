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


  // Reading progress as a ring around a back-to-top button (bottom right).
  // The ring fills as you read; clicking returns to the top. Hidden over the
  // hero, fades in once the case study begins.
  const firstSection = document.querySelector('.cs-section');
  const ring = document.createElement('button');
  ring.type = 'button';
  ring.className = 'progress-ring';
  ring.setAttribute('aria-label', 'Back to top');
  ring.innerHTML = '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="progress-ring-track" cx="22" cy="22" r="20.5"/><circle class="progress-ring-arc" cx="22" cy="22" r="20.5" transform="rotate(-90 22 22)"/></svg><span class="progress-ring-arrow" aria-hidden="true"></span>';
  document.body.appendChild(ring);
  const arc = ring.querySelector('.progress-ring-arc');
  const CIRC = 2 * Math.PI * 20.5;
  arc.style.strokeDasharray = String(CIRC);
  const reduceMotionRing = matchMedia('(prefers-reduced-motion: reduce)').matches;
  ring.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotionRing ? 'auto' : 'smooth' }));
  let ringTick = false;
  function updateRing() {
    ringTick = false;
    const H = document.documentElement.scrollHeight - innerHeight;
    const p = Math.min(1, Math.max(0, scrollY / Math.max(1, H)));
    arc.style.strokeDashoffset = String(CIRC * (1 - p));
    const started = firstSection && firstSection.getBoundingClientRect().top < innerHeight * 0.5;
    ring.classList.toggle('is-on', !!started);
  }
  addEventListener('scroll', () => { if (!ringTick) { ringTick = true; requestAnimationFrame(updateRing); } }, { passive: true });
  addEventListener('resize', updateRing);
  updateRing();
});
