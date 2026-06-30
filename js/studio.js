/* ==========================================================================
   WHITE STUDIO — curved gallery engine
   Positions images along an invisible cylinder using CSS 3D transforms.
   Pure JS + CSS — no animation library dependency.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const boot = document.getElementById('studioBoot');
  const curve = document.getElementById('studioCurve');
  const hint = document.getElementById('studioHint');
  const projectBtns = document.querySelectorAll('.studio-project-btn');
  const enterTransition = document.getElementById('studioEnterTransition');

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const projects = {
    hive: {
      href: 'hive.html',
      slides: [
        { eyebrow: '01 — Hyundai', title: 'Hive', bg: 'linear-gradient(135deg, #F5F5F3, #E8E8E5)' },
        { eyebrow: 'Departure', title: 'Home pickup', bg: 'linear-gradient(135deg, #EFEAE0, #D9D0BE)' },
        { eyebrow: 'Transit', title: 'Sensory learning', bg: 'linear-gradient(135deg, #F0E4E8, #DCC4CE)' },
        { eyebrow: 'Hub', title: 'Pods dock together', bg: 'linear-gradient(135deg, #E6EEF5, #C7D6E5)' },
      ]
    },
    toad: {
      href: 'toad.html',
      slides: [
        { eyebrow: '02 — Toyota', title: 'TOAD', bg: 'linear-gradient(135deg, #F0EDE5, #DCD5C5)' },
        { eyebrow: 'Dawn', title: 'Scanning the field', bg: 'linear-gradient(135deg, #E5EBE0, #C9D4BD)' },
        { eyebrow: 'Midday', title: 'Independent work', bg: 'linear-gradient(135deg, #ECE6DC, #D6C9AF)' },
        { eyebrow: 'Dusk', title: 'Companion mode', bg: 'linear-gradient(135deg, #E0E5E8, #BCC8CE)' },
      ]
    },
    surface: {
      href: 'surface-c1.html',
      slides: [
        { eyebrow: '03 — Surface Moto', title: 'C1', bg: 'linear-gradient(135deg, #ECECEC, #D4D4D4)' },
        { eyebrow: 'Concept', title: 'First sketches', bg: 'linear-gradient(135deg, #EFEFEF, #DADADA)' },
        { eyebrow: 'Fabrication', title: 'Cut, weld, paint', bg: 'linear-gradient(135deg, #E3E3E3, #C5C5C5)' },
        { eyebrow: 'Launch', title: 'Public showcase', bg: 'linear-gradient(135deg, #E8E8E8, #CFCFCF)' },
      ]
    },
    sketches: {
      href: 'sketches.html',
      slides: [
        { eyebrow: '04 — Daily Practice', title: '5 years. Every day.', bg: '#FFFFFF' },
        { eyebrow: 'Practice', title: 'Still going', bg: '#FAFAFA' },
      ]
    }
  };

  let activeProject = 'hive';
  let rotation = 0;
  let targetRotation = 0;
  let radius = 760;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartRotation = 0;
  let autoplayId = null;
  let renderId = null;

  function computeRadius() {
    const slideWidth = curve.parentElement.clientWidth * (isMobile ? 0.78 : 0.46);
    const maxWidth = isMobile ? slideWidth : Math.min(slideWidth, 620);
    radius = maxWidth * (isMobile ? 1.05 : 1.15);
  }

  function buildSlides(projectKey) {
    curve.innerHTML = '';
    const data = projects[projectKey];
    const count = data.slides.length;
    const angleStep = 360 / count;

    data.slides.forEach((slide, i) => {
      const el = document.createElement('div');
      el.className = 'studio-slide';
      el.style.background = slide.bg;
      el.dataset.angle = i * angleStep;
      el.dataset.href = data.href;

      const caption = document.createElement('div');
      caption.className = 'studio-slide-caption';
      caption.innerHTML = `
        <div class="studio-slide-eyebrow">${slide.eyebrow}</div>
        <div class="studio-slide-title">${slide.title}</div>
      `;
      el.appendChild(caption);

      el.addEventListener('click', () => {
        if (el.classList.contains('is-center')) {
          enterProject(data.href);
        } else {
          const angle = parseFloat(el.dataset.angle);
          targetRotation = -angle;
        }
      });

      el.addEventListener('mouseenter', () => {
        if (!isMobile) el.classList.add('is-hovered');
      });
      el.addEventListener('mouseleave', () => {
        el.classList.remove('is-hovered');
      });

      curve.appendChild(el);
    });
  }

  function enterProject(href) {
    enterTransition.classList.add('is-active');
    setTimeout(() => {
      window.location.href = href;
    }, 500);
  }

  function render() {
    rotation += (targetRotation - rotation) * 0.06;

    const slides = curve.querySelectorAll('.studio-slide');
    let closestEl = null;
    let closestDelta = Infinity;

    slides.forEach((el) => {
      const baseAngle = parseFloat(el.dataset.angle);
      const angle = baseAngle + rotation;
      const rad = (angle * Math.PI) / 180;

      const x = Math.sin(rad) * radius;
      const z = Math.cos(rad) * radius - radius;
      const scale = 0.78 + 0.22 * ((z + radius) / radius);
      const opacity = 0.35 + 0.65 * ((z + radius) / radius);

      el.style.transform = `translate3d(${x}px, 0, ${z}px) scale(${scale})`;
      el.style.opacity = Math.max(0.15, Math.min(1, opacity));
      el.style.zIndex = Math.round(z + radius);

      const normalized = ((angle % 360) + 360) % 360;
      const delta = Math.min(normalized, 360 - normalized);
      if (delta < closestDelta) {
        closestDelta = delta;
        closestEl = el;
      }
    });

    slides.forEach((el) => el.classList.remove('is-center'));
    if (closestEl && closestDelta < 18) {
      closestEl.classList.add('is-center');
    }

    renderId = requestAnimationFrame(render);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayId = setInterval(() => {
      targetRotation -= 360 / projects[activeProject].slides.length;
    }, 4200);
  }

  function stopAutoplay() {
    clearInterval(autoplayId);
  }

  function onPointerDown(e) {
    isDragging = true;
    curve.classList.add('is-dragging');
    dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartRotation = targetRotation;
    stopAutoplay();
    hint.classList.add('is-hidden');
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = x - dragStartX;
    targetRotation = dragStartRotation + delta * 0.25;
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    curve.classList.remove('is-dragging');
    const step = 360 / projects[activeProject].slides.length;
    targetRotation = Math.round(targetRotation / step) * step;
    setTimeout(startAutoplay, 3000);
  }

  curve.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  curve.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  projectBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.project;
      if (key === activeProject) return;
      activeProject = key;
      rotation = 0;
      targetRotation = 0;
      projectBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      buildSlides(key);
      startAutoplay();
    });
  });

  window.addEventListener('resize', computeRadius);

  function init() {
    computeRadius();
    buildSlides(activeProject);
    render();
    startAutoplay();
    setTimeout(() => hint.classList.add('is-hidden'), 5000);

    // Entrance choreography — visible motion on load
    if (window.gsap) {
      gsap.set('.site-nav', { opacity: 0, y: -16 });
      gsap.set('.studio-project-nav', { opacity: 0, y: -12 });
      gsap.set('.studio-hint', { opacity: 0 });
      gsap.set('.studio-slide', { opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to('.site-nav', { opacity: 1, y: 0, duration: 0.8 })
        .to('.studio-project-nav', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .to('.studio-slide', {
            opacity: (i, target) => target.classList.contains('is-center') ? 1 : 0.6,
            duration: 1,
            stagger: 0.08
          }, '-=0.4')
        .to('.studio-hint', { opacity: 0.6, duration: 0.6 }, '-=0.3');
    }
  }

  const bootSeen = sessionStorage.getItem('studioBootSeen');
  if (bootSeen) {
    boot.classList.add('is-hidden');
    init();
  } else {
    setTimeout(() => {
      boot.classList.add('is-hidden');
      sessionStorage.setItem('studioBootSeen', 'true');
      init();
    }, 1500);
  }
});
