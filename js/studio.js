/* ==========================================================================
   WHITE STUDIO — homepage carousel engine.
   Idle auto-advance is the default, always-running state. Scroll and drag
   temporarily take over and always ease back to idle afterward. Sustained
   forward scroll past the last panel (Sketches) exits to About. Clicking
   the centered panel navigates to that project's real page.

   Motion tone: no spring/bounce/elastic overshoot anywhere — ease-in-out
   for single steps, true linear deceleration/acceleration (real
   kinematics, not a curve) for the entrance and exit sweeps.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const cinema = document.getElementById('studioCinema');
  const track = document.getElementById('studioTrack');
  const labelBar = document.getElementById('studioLabelBar');
  const hint = document.getElementById('studioHint');
  const stage = document.querySelector('.studio-stage');

  if (!cinema || !track) return; // guard: only runs on the homepage

  const isMobile = matchMedia('(max-width: 768px)').matches;

  /* Real project pages — exactly one slide per project. */
  const slides = [
    { key: 'hive',     title: 'HIVE',     bg: 'linear-gradient(135deg,#E8E2D5,#C9BFA8)', href: 'hive.html' },
    { key: 'toad',     title: 'TOAD',     bg: 'linear-gradient(135deg,#DCE5D2,#AEC49A)', href: 'toad.html' },
    { key: 'surface',  title: 'C1',       bg: 'linear-gradient(135deg,#E5E5E5,#C2C2C2)', href: 'surface-c1.html' },
    { key: 'sketches', title: 'SKETCHES', bg: 'linear-gradient(135deg,#F5EFE5,#DCD0BC)', href: 'sketches.html' },
  ];
  const N = slides.length;

  /* ---------- Geometry ---------- */
  let vw = innerWidth, panelW, gap, unit;
  function computeGeom() {
    vw = innerWidth;
    panelW = isMobile ? vw * 0.80 : Math.min(vw * 0.58, 860);
    // ~10% of viewport — measured from the Figma reference — gives real
    // visible breathing room between the center panel and the peek.
    gap = isMobile ? vw * 0.05 : vw * 0.10;
    unit = panelW + gap;
  }

  /* ---------- State ----------
     pos = continuous position in "slide units" (panel i is centered when
     pos ≡ i mod N). Exactly one thing ever owns motion at a time. */
  let pos = 0;
  let currentIndex = 0;
  let state = 'entrance'; // entrance | hold | auto | step | drag | exiting
  let holdTimer = null;
  let raf = null;
  let exited = false;

  const HOLD_MS = 4200;
  const STEP_MS = 900;
  const ENTRANCE_MS = 2600;
  const ENTRANCE_SWEEP = 3 * N;
  const EXIT_SWEEP_MS = 900;

  /* ---------- Build ---------- */
  const panelEls = [];
  slides.forEach((s) => {
    const p = document.createElement('div');
    p.className = 'studio-panel';
    const inner = document.createElement('div');
    inner.className = 'studio-panel-inner';
    inner.style.background = s.bg;
    p.appendChild(inner);
    track.appendChild(p);
    panelEls.push(p);
  });

  slides.forEach((s, i) => {
    const l = document.createElement('button');
    l.type = 'button';
    l.className = 'studio-label';
    l.dataset.key = s.key;
    l.textContent = s.title;
    l.addEventListener('click', () => jumpToIndex(i));
    labelBar.appendChild(l);
  });
  const labelEls = [...labelBar.children];
  function commitLabel(i) {
    labelEls.forEach((el, j) => el.classList.toggle('is-active', j === i));
  }

  function render() {
    const h = cinema.clientHeight;
    panelEls.forEach((p, i) => {
      let d = (i - pos) % N;
      if (d > N / 2) d -= N;
      if (d < -N / 2) d += N;
      const x = vw / 2 - panelW / 2 + d * unit;
      p.style.width = panelW + 'px';
      p.style.height = h + 'px';
      p.style.transform = `translateX(${x}px)`;
      p.classList.toggle('is-center', Math.abs(d) < 0.02);
    });
  }

  /* ---------- Easing primitives ----------
     Editorial tone: no spring, no overshoot, no elastic bounce anywhere. */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateEase(delta, ms, onDone) {
    cancelAnimationFrame(raf);
    const from = pos, t0 = performance.now();
    (function frame(now) {
      const t = Math.min((now - t0) / ms, 1);
      pos = from + delta * easeInOutCubic(t);
      render();
      if (t < 1) raf = requestAnimationFrame(frame);
      else { pos = from + delta; render(); onDone && onDone(); }
    })(performance.now());
  }

  function animateLinearDecel(delta, ms, onDone) {
    cancelAnimationFrame(raf);
    const from = pos, v0 = 2 * delta / ms, t0 = performance.now();
    (function frame(now) {
      const t = Math.min(now - t0, ms);
      pos = from + v0 * t - (v0 / (2 * ms)) * t * t;
      render();
      if (t < ms) raf = requestAnimationFrame(frame);
      else { pos = from + delta; render(); onDone && onDone(); }
    })(performance.now());
  }

  function animateLinearAccel(delta, ms, onDone) {
    cancelAnimationFrame(raf);
    const from = pos, a = 2 * delta / (ms * ms), t0 = performance.now();
    (function frame(now) {
      const t = Math.min(now - t0, ms);
      pos = from + 0.5 * a * t * t;
      render();
      if (t < ms) raf = requestAnimationFrame(frame);
      else { pos = from + delta; render(); onDone && onDone(); }
    })(performance.now());
  }

  /* ---------- Hold / auto-advance loop — always running ---------- */
  function scheduleHold() {
    state = 'hold';
    pos = ((pos % N) + N) % N;
    currentIndex = Math.round(pos) % N;
    render();
    clearTimeout(holdTimer);
    holdTimer = setTimeout(autoAdvance, HOLD_MS);
  }

  function autoAdvance() {
    if (exited) return;
    state = 'auto';
    const next = (currentIndex + 1) % N;
    commitLabel(next);
    animateEase(1, STEP_MS, scheduleHold);
  }

  /* ---------- Direct navigation via label bar — only from a settled
     hold state, to avoid the stuck-mid-transition race. ---------- */
  function jumpToIndex(target) {
    if (exited || state !== 'hold') return;
    if (target === currentIndex) return;
    let diff = (target - currentIndex + N) % N;
    if (diff > N / 2) diff -= N;
    if (diff === 0) return;

    clearTimeout(holdTimer);
    state = 'step';
    commitLabel(target);
    const ms = Math.max(STEP_MS, Math.abs(diff) * 550);
    animateEase(diff, ms, () => { currentIndex = target; scheduleHold(); });
  }

  /* ---------- Watchdog — force-finish if anything ever gets stuck ---------- */
  let lastPos = pos;
  let lastMoveAt = performance.now();
  setInterval(() => {
    if (state === 'hold' || state === 'entrance' || dragging) { lastPos = pos; lastMoveAt = performance.now(); return; }
    if (pos !== lastPos) { lastPos = pos; lastMoveAt = performance.now(); return; }
    if (performance.now() - lastMoveAt > 1000) {
      cancelAnimationFrame(raf);
      const target = Math.round(pos);
      pos = target;
      render();
      currentIndex = ((target % N) + N) % N;
      commitLabel(currentIndex);
      scheduleHold();
    }
  }, 500);

  /* ---------- Click centered panel → real project page ---------- */
  panelEls.forEach((p, i) => {
    const inner = p.querySelector('.studio-panel-inner');
    inner.style.cursor = 'pointer';
    inner.addEventListener('click', () => {
      if (state !== 'hold') return;
      if (i === currentIndex) {
        thumpThenEnter(inner, slides[i].href);
      } else {
        jumpToIndex(i);
      }
    });
  });

  function thumpThenEnter(inner, href) {
    inner.style.transition = 'transform 0.16s cubic-bezier(0.5,0,0.75,0)';
    inner.style.transform = 'scale(0.94)';
    setTimeout(() => {
      window.pageTransitionOut ? window.pageTransitionOut(href) : (window.location.href = href);
    }, 150);
  }

  /* ---------- Shared step logic — used by BOTH desktop wheel scroll
     AND vertical touch swipe, so the two behave identically: same
     trigger threshold, same easing, same label update, same exit. ---------- */
  let wheelAcc = 0;
  const WHEEL_TRIGGER = 90;
  function stepFromDelta(delta) {
    if (state !== 'hold' || exited) return;
    wheelAcc += delta;
    if (Math.abs(wheelAcc) < WHEEL_TRIGGER) return;
    const dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;

    if (dir > 0 && currentIndex === N - 1) {
      exitToAbout();
      return;
    }
    const target = (currentIndex + dir + N) % N;
    state = 'step';
    clearTimeout(holdTimer);
    commitLabel(target);
    animateEase(dir, STEP_MS, scheduleHold);
  }

  function onWheel(e) {
    e.preventDefault();
    stepFromDelta(e.deltaY);
  }
  addEventListener('wheel', onWheel, { passive: false });

  /* ---------- Direct drag — 1:1, own control, never exits ---------- */
  let dragging = false;
  let dragStartX = 0;
  let dragStartPos = 0;

  function dragStart(clientX) {
    if (exited) return;
    dragging = true;
    state = 'drag';
    clearTimeout(holdTimer);
    cancelAnimationFrame(raf);
    dragStartX = clientX;
    dragStartPos = pos;
    cinema.classList.add('is-grabbing');
  }
  function dragMove(clientX) {
    if (!dragging) return;
    const dx = clientX - dragStartX;
    pos = dragStartPos - dx / unit;
    render();
  }
  function dragEnd() {
    if (!dragging) return;
    dragging = false;
    cinema.classList.remove('is-grabbing');
    const target = Math.round(pos);
    const delta = target - pos;
    state = 'step';
    commitLabel(((target % N) + N) % N);
    animateEase(delta, 420, scheduleHold);
  }

  cinema.addEventListener('mousedown', (e) => { e.preventDefault(); dragStart(e.clientX); });
  addEventListener('mousemove', (e) => dragMove(e.clientX));
  addEventListener('mouseup', dragEnd);

  /* ---------- Unified touch gesture ----------
     A touch could mean either "drag the carousel horizontally" or
     "swipe to scroll-step" — we don't know which until the finger has
     actually moved a little. Deciding per-gesture (rather than reserving
     one axis for native scrolling ahead of time) is what removes the
     browser's direction-disambiguation hesitation that read as friction,
     and is also what makes vertical swipe finally do something: it now
     feeds the exact same stepFromDelta() as desktop wheel scroll. */
  let touchMode = null; // null (undecided) | 'drag' | 'scroll'
  let touchStartX = 0, touchStartY = 0, touchLastY = 0;
  const AXIS_LOCK_PX = 6;

  function onTouchStart(e) {
    if (exited) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchLastY = t.clientY;
    touchMode = null;
  }

  function onTouchMove(e) {
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (touchMode === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return; // not enough movement to decide yet
      touchMode = Math.abs(dx) > Math.abs(dy) ? 'drag' : 'scroll';
      if (touchMode === 'drag') dragStart(touchStartX);
    }

    e.preventDefault();
    if (touchMode === 'drag') {
      dragMove(t.clientX);
    } else {
      // Swipe up (finger moves up the screen) reads as "scroll forward",
      // matching the same sign convention as a natural downward wheel
      // scroll — swipe up = advance, swipe down = go back.
      const deltaY = touchLastY - t.clientY;
      touchLastY = t.clientY;
      stepFromDelta(deltaY);
    }
  }

  function onTouchEnd() {
    if (touchMode === 'drag') dragEnd();
    touchMode = null;
  }

  cinema.addEventListener('touchstart', onTouchStart, { passive: true });
  cinema.addEventListener('touchmove', onTouchMove, { passive: false });
  addEventListener('touchend', onTouchEnd);


  /* ---------- Exit to About: accelerate away (mirror of entrance),
     scene dissolves, THEN the shared page-transition veil covers and
     navigates for real. ---------- */
  function exitToAbout() {
    exited = true;
    state = 'exiting';
    clearTimeout(holdTimer);
    animateLinearAccel(3, EXIT_SWEEP_MS, () => {
      stage.classList.add('is-vanishing');
      setTimeout(() => {
        if (window.pageTransitionOut) {
          window.pageTransitionOut('about.html', 550);
        } else {
          window.location.href = 'about.html';
        }
      }, 250);
    });
  }

  addEventListener('resize', () => { computeGeom(); render(); });

  /* ---------- Entrance: fast, constant-rate deceleration, lands on Hive ---------- */
  computeGeom();
  commitLabel(0);
  pos = -ENTRANCE_SWEEP;
  render();
  state = 'entrance';
  animateLinearDecel(ENTRANCE_SWEEP, ENTRANCE_MS, () => {
    scheduleHold();
    setTimeout(() => hint.classList.add('is-visible'), 900);
  });
});
