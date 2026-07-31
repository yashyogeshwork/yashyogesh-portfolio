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

  /* Real project pages — driven by js/content.js when present. */
  const defaultSlides = [
    { key: 'hive',     title: 'HIVE',     bg: 'linear-gradient(135deg,#E8E2D5,#C9BFA8)', href: 'hive.html' },
    { key: 'toad',     title: 'TOAD',     bg: 'linear-gradient(135deg,#DCE5D2,#AEC49A)', href: 'toad.html' },
    { key: 'surface',  title: 'C1',       bg: 'linear-gradient(135deg,#E5E5E5,#C2C2C2)', href: 'surface-c1.html' },
    { key: 'sketches', title: 'SKETCHES', bg: 'linear-gradient(135deg,#F5EFE5,#DCD0BC)', href: 'sketches.html' },
  ];
  const slides = (window.CONTENT && window.CONTENT.home && window.CONTENT.home.projects)
    ? window.CONTENT.home.projects
    : defaultSlides;
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

  const HOLD_MS = 2800;
  const STEP_MS = 650;
  const ENTRANCE_MS = 2600;
  const ENTRANCE_SWEEP = 3 * N;
  const EXIT_SWEEP_MS = 900;

  /* ---------- Build ---------- */
  const panelEls = [];
  const panelLinks = [];
  slides.forEach((s) => {
    const p = document.createElement('div');
    p.className = 'studio-panel';
    const inner = document.createElement('div');
    inner.className = 'studio-panel-inner';
    inner.style.background = (s.image && s.image.length)
      ? `url('${s.image}') center/cover no-repeat, ${s.bg}`
      : s.bg;
    // A real, native link overlay covering the panel. This is the
    // actual navigation path — a plain anchor with an href, no custom
    // tap/drag logic between the click and the page load, so it simply
    // cannot silently fail. Only the centered panel's link accepts
    // clicks (see updateActiveLink); the rest have pointer-events off
    // so drag/scroll still passes through them.
    const link = document.createElement('a');
    link.className = 'studio-panel-link';
    link.href = s.href;
    link.style.cssText = 'position:absolute;inset:0;z-index:3;pointer-events:none;';
    link.draggable = false;
    link.addEventListener('dragstart', (ev) => ev.preventDefault());
    link.addEventListener('click', (ev) => {
      // Safety guard: if a real drag just happened, don't navigate even
      // if the browser still fires a synthetic click on the link
      // afterward — the person was dragging, not clicking.
      if (dragOccurred) { ev.preventDefault(); return; }
      // Native anchor already navigates on its own — but route through
      // the shared page transition when available, for the consistent
      // fade. If anything about the transition fails, the browser's
      // own default anchor navigation still carries it through.
      if (window.pageTransitionOut) {
        ev.preventDefault();
        window.pageTransitionOut(s.href);
      }
    });
    inner.appendChild(link);
    p.appendChild(inner);
    track.appendChild(p);
    panelEls.push(p);
    panelLinks.push(link);
  });

  // Keep exactly one panel's link clickable: whichever is actually
  // centered on screen right now. Runs every frame via the render loop.
  function updateActiveLink() {
    const centerX = innerWidth / 2;
    panelEls.forEach((panel, i) => {
      const rect = panel.getBoundingClientRect();
      const pc = rect.left + rect.width / 2;
      const centered = rect.width > 0 && Math.abs(pc - centerX) < rect.width * 0.4;
      panelLinks[i].style.pointerEvents = (centered && state === 'hold' && !exited) ? 'auto' : 'none';
    });
  }

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

  let cinemaHeight = 0;

  function applySizes() {
    // Width/height are layout-affecting properties — setting them here,
    // ONCE, rather than inside render() (which runs every single frame
    // during a drag or animation), is what lets the browser handle
    // motion purely on the compositor/GPU. Rewriting width/height every
    // frame forces a full layout recalculation every frame, which is
    // exactly what produced the heavy, non-native "draggy" feeling.
    cinemaHeight = cinema.clientHeight;
    panelEls.forEach((p) => {
      p.style.width = panelW + 'px';
      p.style.height = cinemaHeight + 'px';
    });
  }

  function render() {
    // Runs every frame during drag/animation — touches ONLY transform
    // (and a class toggle), nothing layout-affecting, so the browser can
    // push this straight to the compositor. This is the actual fix for
    // the reported drag friction.
    panelEls.forEach((p, i) => {
      let d = (i - pos) % N;
      if (d > N / 2) d -= N;
      if (d < -N / 2) d += N;
      const x = vw / 2 - panelW / 2 + d * unit;
      p.style.transform = `translateX(${x}px)`;
      p.classList.toggle('is-center', Math.abs(d) < 0.02);
    });
    updateActiveLink();
  }

  /* ---------- Easing primitives ----------
     Editorial tone: no spring, no overshoot, no elastic bounce anywhere. */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
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

  // A dedicated snap for drag release specifically — it needs to respond
  // immediately to the moment you let go (ease-OUT: fast start,
  // decelerating into place), not ease-in-out, which has a perceptible
  // dead moment right at release before it starts moving. That mismatch
  // between "you just let go" and "nothing visibly responds yet" is
  // what reads as unpolished/laggy.
  function animateSnap(delta, ms, onDone) {
    cancelAnimationFrame(raf);
    const from = pos, t0 = performance.now();
    (function frame(now) {
      const t = Math.min((now - t0) / ms, 1);
      pos = from + delta * easeOutCubic(t);
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
     hold state, to avoid the stuck-mid-transition race. Clicking the
     label for the ALREADY-centered project enters it, exactly like
     tapping the slide itself — clicking any other label rotates there. */
  function jumpToIndex(target) {
    if (exited || state !== 'hold') return;

    if (target === currentIndex) {
      const inner = panelEls[target].querySelector('.studio-panel-inner');
      thumpThenEnter(inner, slides[target].href);
      return;
    }

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
    if (state === 'hold' || state === 'entrance' || state === 'drag') { lastPos = pos; lastMoveAt = performance.now(); return; }
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

  /* ---------- Shared step logic — used by BOTH desktop wheel scroll
     AND vertical touch swipe, so the two behave identically: same
     trigger threshold, same easing, same label update, same exit. ---------- */
  let wheelAcc = 0;
  const WHEEL_TRIGGER = 90;
  let lapsCompleted = 0; // how many times we've cycled all the way through

  function stepFromDelta(delta) {
    if (state !== 'hold' || exited) return;
    wheelAcc += delta;
    if (Math.abs(wheelAcc) < WHEEL_TRIGGER) return;
    const dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;

    // Reaching the end and continuing forward completes a lap. The
    // first time this happens, we just loop back to the start and let
    // them go through everything again — someone curious enough to
    // reach the end once deserves a second pass, not an immediate exit.
    // Only on the SECOND lap do we actually leave for About.
    if (dir > 0 && currentIndex === N - 1) {
      lapsCompleted++;
      if (lapsCompleted >= 2) {
        exitToAbout();
        return;
      }
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

  /* ---------- Unified pointer gesture (mouse + touch + pen, one system) ----------
     Previously mouse and touch were handled as two separate systems
     (mousedown/mouseup vs touchstart/touchend), plus a third separate
     'click' listener for tap-to-enter. On touch devices, browsers fire a
     synthetic "ghost" mousedown/mouseup/click sequence after a real tap
     for legacy compatibility — that ghost mousedown was briefly flipping
     the carousel out of 'hold' state, so by the time the real click
     event fired and checked `state`, it was no longer 'hold' and the tap
     was silently ignored. That's exactly why label-bar taps worked (a
     separate element, untouched by this) while tapping the slide itself
     didn't.

     The Pointer Events API unifies mouse/touch/pen into one event stream
     with no ghost-event duplication, and tap-detection happens directly
     inside pointerup rather than depending on a separately-timed browser
     'click' event — removing the whole class of bug. */
  let pointerActive = false;
  let pointerMode = null; // null (undecided) | 'drag' | 'scroll'
  let pointerId = null;
  let startX = 0, startY = 0, startTime = 0, lastY = 0;
  const TAP_MAX_MOVE = 8;
  const TAP_MAX_MS = 500;
  const AXIS_LOCK_PX = 6;

  let lastDragX = 0, lastDragT = 0, dragVelocity = 0;

  let dragRafId = null;
  function dragRenderLoop() {
    render();
    dragRafId = requestAnimationFrame(dragRenderLoop);
  }

  let dragOccurred = false;

  function beginDrag() {
    state = 'drag';
    dragOccurred = true;
    clearTimeout(holdTimer);
    cancelAnimationFrame(raf);
    dragStartPos = pos;
    cinema.classList.add('is-grabbing');
    lastDragX = startX;
    lastDragT = performance.now();
    dragVelocity = 0;
    dragRafId = requestAnimationFrame(dragRenderLoop);
  }
  let dragStartPos = 0;
  function dragMoveTo(clientX) {
    const dx = clientX - startX;
    pos = dragStartPos - dx / unit;
    // No direct render() here — a persistent rAF loop (dragRenderLoop)
    // handles painting while dragging, exactly once per real display
    // frame. Calling render() directly on every raw pointermove event
    // was the actual cause of the lag: pointermove can fire faster than
    // the screen can paint, so the DOM was doing wasted, redundant work
    // that competed with the real paint cycle instead of syncing to it.

    // Track real velocity (panels per second) from the most recent
    // movement, not the whole gesture — this is what lets a fast flick
    // feel different from a slow, deliberate drag on release.
    const now = performance.now();
    const dt = now - lastDragT;
    if (dt > 8) {
      dragVelocity = -(clientX - lastDragX) / unit / (dt / 1000);
      lastDragX = clientX;
      lastDragT = now;
    }
  }
  function endDrag(e) {
    cancelAnimationFrame(dragRafId);
    cinema.classList.remove('is-grabbing');

    // Real human clicking — especially with a mouse or trackpad — very
    // commonly involves a few pixels of incidental movement even when
    // the actual intent was just "click this." That was enough to cross
    // AXIS_LOCK_PX and get classified as a drag, after which this
    // function had no path back to handleTap — it just silently snapped
    // back in place. This is the actual fix: recognize genuinely small
    // total movement as the tap it was meant to be.
    const totalMove = e ? Math.hypot(e.clientX - startX, e.clientY - startY) : 999;
    if (totalMove < 12) {
      state = 'hold';
      handleTap(e.clientX, e.clientY);
      return;
    }

    // A fast flick should carry to the next panel over, not just
    // whichever one you happened to be closest to when you let go —
    // that's what makes it feel like real momentum, not just a
    // position snap.
    const FLICK_THRESHOLD = 0.45; // panels/sec
    let projected = pos;
    if (Math.abs(dragVelocity) > FLICK_THRESHOLD) {
      projected += Math.sign(dragVelocity) * Math.min(1, Math.abs(dragVelocity) * 0.18);
    }
    const target = Math.round(projected);
    const delta = target - pos;

    // Faster release = snappier, shorter settle; a gentle drag eases
    // more slowly — the snap duration itself responds to how the
    // gesture actually felt, not a fixed generic time for every release.
    const speed = Math.min(1, Math.abs(dragVelocity) / 3);
    const duration = 380 - speed * 160; // 380ms gentle -> 220ms for a fast flick

    state = 'step';
    commitLabel(((target % N) + N) % N);
    animateSnap(delta, duration, scheduleHold);
  }

  function handleTap(clientX, clientY) {
    if (state !== 'hold' || exited) return;
    const target = document.elementFromPoint(clientX, clientY);
    const panelInner = target && target.closest('.studio-panel-inner');
    if (!panelInner) return;
    const panel = panelInner.closest('.studio-panel');
    const i = panelEls.indexOf(panel);
    if (i === -1) return;

    // Check the ACTUAL screen position, not the currentIndex variable —
    // if that variable ever drifts out of sync with what's really
    // centered, this comparison would silently take the "just
    // re-center it" path on a panel that's already centered, which
    // produces literally no visible change and looks exactly like the
    // click did nothing at all.
    const viewportCenterX = innerWidth / 2;
    const rect = panel.getBoundingClientRect();
    const panelCenterX = rect.left + rect.width / 2;
    const isActuallyCentered = Math.abs(panelCenterX - viewportCenterX) < rect.width * 0.15;

    if (isActuallyCentered) {
      thumpThenEnter(panelInner, slides[i].href);
    } else {
      jumpToIndex(i);
    }
  }

  function thumpThenEnter(inner, href) {
    inner.style.transition = 'transform 0.16s cubic-bezier(0.5,0,0.75,0)';
    inner.style.transform = 'scale(0.94)';
    setTimeout(() => {
      window.pageTransitionOut ? window.pageTransitionOut(href) : (window.location.href = href);
    }, 150);
  }

  cinema.style.touchAction = 'none';

  /* ---------- Custom hover cursor ----------
     "View [Title]" on the active/centered slide, since that's the one
     a click actually opens. "Select [Title]" on the side slides, since
     clicking those just brings them to center rather than entering.
     Desktop-only — there's no persistent hover state on touch. */
  if (!isMobile) {
    const studioCursor = document.createElement('div');
    studioCursor.className = 'studio-cursor';
    document.body.appendChild(studioCursor);

    addEventListener('pointermove', (e) => {
      studioCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    });

    panelEls.forEach((panelEl, i) => {
      panelEl.addEventListener('pointerenter', () => {
        if (state === 'drag') return;
        studioCursor.textContent = 'View';
        studioCursor.classList.add('is-visible');
        // Pause auto-advance while hovering — without this, reading
        // "View" and then clicking (completely normal, and often takes
        // more than a couple seconds) could silently land after the
        // carousel had already auto-advanced away from 'hold' in the
        // background, making the click do nothing with no indication why.
        clearTimeout(holdTimer);
      });
      panelEl.addEventListener('pointerleave', () => {
        studioCursor.classList.remove('is-visible');
        if (state === 'hold') {
          clearTimeout(holdTimer);
          holdTimer = setTimeout(autoAdvance, HOLD_MS);
        }
      });
    });

    cinema.addEventListener('pointerdown', () => studioCursor.classList.remove('is-visible'));
  }

  cinema.addEventListener('pointerdown', (e) => {
    if (exited) return;
    pointerActive = true;
    pointerMode = null;
    dragOccurred = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastY = e.clientY;
    startTime = performance.now();
    cinema.setPointerCapture(e.pointerId);
  });

  cinema.addEventListener('pointermove', (e) => {
    if (!pointerActive || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (pointerMode === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return; // still could be a tap
      // Biased toward drag on purpose: horizontal dragging is the
      // primary gesture here, and real human movement is never
      // perfectly axis-aligned at the very start of a gesture. A plain
      // dx > dy tie-break meant tiny, essentially random diagonal noise
      // could misclassify an intended drag as a scroll — which is
      // exactly what "sometimes it works, sometimes it doesn't" was.
      // Vertical now has to CLEARLY dominate to win that classification.
      pointerMode = Math.abs(dy) > Math.abs(dx) * 1.4 ? 'scroll' : 'drag';
      if (pointerMode === 'drag') beginDrag();
    }

    if (pointerMode === 'drag') {
      dragMoveTo(e.clientX);
    } else {
      // Vertical swipe reads as scroll — swipe up = advance, matching
      // the same sign convention as a natural downward wheel scroll.
      const deltaY = lastY - e.clientY;
      lastY = e.clientY;
      stepFromDelta(deltaY);
    }
  });

  function onPointerUp(e) {
    if (!pointerActive || e.pointerId !== pointerId) return;
    pointerActive = false;

    if (pointerMode === 'drag') {
      endDrag(e);
    } else if (pointerMode === null) {
      // No axis was ever locked in — this was a genuine tap/click, not a
      // drag. Handle it directly here rather than relying on a separate
      // browser 'click' event, which is what let the ghost-event race
      // condition slip through before.
      const elapsed = performance.now() - startTime;
      if (elapsed < TAP_MAX_MS) handleTap(e.clientX, e.clientY);
    }
    pointerMode = null;
  }
  cinema.addEventListener('pointerup', onPointerUp);
  cinema.addEventListener('pointercancel', () => {
    pointerActive = false;
    pointerMode = null;
    cancelAnimationFrame(dragRafId);
    cinema.classList.remove('is-grabbing');
  });


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

  addEventListener('resize', () => { computeGeom(); applySizes(); render(); });

  /* ---------- Entrance: fast, constant-rate deceleration, lands on Hive ---------- */
  computeGeom();
  applySizes();
  commitLabel(0);
  pos = -ENTRANCE_SWEEP;
  render();
  state = 'entrance';
  animateLinearDecel(ENTRANCE_SWEEP, ENTRANCE_MS, () => {
    scheduleHold();
    setTimeout(() => hint.classList.add('is-visible'), 900);
  });
});
