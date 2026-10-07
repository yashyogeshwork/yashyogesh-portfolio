(() => {
  const el = document.getElementById('aboutGreeting');
  const eyesWrap = document.getElementById('aboutEyes');
  if (!el) return;

  // A couple of these are personal, not just decorative — Hej is
  // Swedish (Umeå), Namaste is Hindi.
  const greetings = ['Hej', 'Hello', 'Namaste', 'Nihao', 'Guten Tag', '안녕하세요', 'Ciao', 'こんにちは', 'Bonjour', 'Hola'];
  let i = 0;

  const eyes = eyesWrap ? eyesWrap.querySelectorAll('.about-eye') : [];

  function blink() {
    eyes.forEach((eye) => eye.classList.add('is-blinking'));
    setTimeout(() => eyes.forEach((eye) => eye.classList.remove('is-blinking')), 140);
  }

  function cycle() {
    el.style.opacity = '0';
    blink(); // the eyes blink exactly as the greeting changes underneath
    setTimeout(() => {
      i = (i + 1) % greetings.length;
      el.textContent = greetings[i];
      el.style.opacity = '1';
    }, 250);
  }

  // Only animate when it can be seen and the visitor hasn't asked for less
  // motion. Before, the greeting swapped and the eyes blinked every 2s
  // forever: ignoring reduced-motion (the only About script that did), and
  // running while off-screen or in a background tab.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let onScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { onScreen = entries[0].isIntersecting; }).observe(el);
  }
  if (!reducedMotion) {
    setInterval(() => { if (onScreen && !document.hidden) cycle(); }, 2000);
  }

  // Real cursor-tracking pupils — each pupil shifts toward the cursor,
  // clamped so it never leaves the white of the eye.
  if (eyesWrap && !matchMedia('(pointer: coarse)').matches) {
    const pupils = eyesWrap.querySelectorAll('.about-pupil');
    // One update per frame, not one per mouse event, and none while the
    // greeting is off-screen (it used to read layout on every pointermove).
    let lastEvent = null, queued = false;
    addEventListener('pointermove', (e) => {
      lastEvent = e;
      if (queued || !onScreen) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; track(lastEvent); });
    }, { passive: true });
    function track(e) {
      eyes.forEach((eye, idx) => {
        const rect = eye.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const angle = Math.atan2(dy, dx);
        const maxOffset = rect.width * 0.22; // keeps the pupil inside the white
        const px = Math.cos(angle) * maxOffset;
        const py = Math.sin(angle) * maxOffset;
        pupils[idx].style.transform = `translate(${px}px, ${py}px)`;
      });
    }
  }
})();
