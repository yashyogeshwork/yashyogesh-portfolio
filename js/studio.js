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

  let isMobile = matchMedia('(max-width: 768px), (max-width: 1100px) and (orientation: portrait)').matches  /* phones, plus tablets held upright */;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    // Re-measured on every call, not just once at load — otherwise a
    // window that starts narrow (e.g. a preview iframe) and is then
    // resized wider keeps using mobile numbers forever.
    isMobile = matchMedia('(max-width: 768px), (max-width: 1100px) and (orientation: portrait)').matches  /* phones, plus tablets held upright */;
    // Proportional to the screen: 52% of its width. The old 780px cap
    // left a small slide floating in empty space on big monitors.
    panelW = isMobile ? vw * 0.80 : vw * 0.52;
    // ~10% of viewport — measured from the Figma reference — gives real
    // visible breathing room between the center panel and the peek.
    gap = isMobile ? vw * 0.05 : vw * 0.10;
    unit = panelW + gap;
    // Stage height comes from panelW at a fixed 3:2 ratio, matching the
    // real images exactly — no crop, no letterbox. If that would make
    // the stage taller than the available viewport, panelW is scaled
    // down to fit instead of letting the stage overflow the window.
    const maxH = innerHeight * 0.62; // proportional; no fixed cap, so big monitors get a big slide
    const RATIO = 1.487; // the carousel photos' own shape, so cover crops nothing
    let h = panelW / RATIO;
    if (h > maxH) {
      h = maxH;
      panelW = h * RATIO;
      gap = isMobile ? vw * 0.05 : vw * 0.10;
      unit = panelW + gap;
    }
    cinema.style.height = h + 'px';
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

  const HOLD_MS = 3200;
  const AUTO_MS = 1400;
  const USER_PAUSE_MS = 8000;
  let lastUserAction = -Infinity;
  const markUser = () => { lastUserAction = performance.now(); };
  const STEP_MS = 650;
  // Entrance: a short, calm glide into place (half a slide) instead of
  // spinning through every project. The old 4-slide sweep started at
  // almost 6 slides/second, which read as a blur of passing images.
  const EXIT_MS = 650;
  // Scrolling past the last project wraps back to the first; only after
  // three full turns does the next forward scroll leave for About.
  const LAPS_BEFORE_ABOUT = 3;
  let lapsCompleted = 0;

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
    // Out of the tab order and hidden from screen readers: these four
    // anchors had no name and duplicated the four label buttons (same
    // destinations), so keyboard users tabbed through eight stops and
    // screen readers met four silent links. The labels are the keyboard
    // route; Enter on the page also opens the centred project.
    link.tabIndex = -1;
    link.setAttribute('aria-hidden', 'true');
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
  // Worked out from `pos` directly. The previous version read every
  // panel's getBoundingClientRect() each frame, right after render()
  // had moved them, forcing a full layout recalculation 60 times a
  // second during every drag, scroll and slide.
  const linkState = [];
  function nearestIndex() { return ((Math.round(pos) % N) + N) % N; }
  function updateActiveLink() {
    const n = nearestIndex();
    const settled = Math.abs(pos - Math.round(pos)) < 0.1;
    panelLinks.forEach((l, i) => {
      const on = i === n && settled && state === 'hold' && !exited;
      if (linkState[i] !== on) { l.style.pointerEvents = on ? 'auto' : 'none'; linkState[i] = on; }
    });
  }

  slides.forEach((s, i) => {
    const l = document.createElement('button');
    l.type = 'button';
    l.className = 'studio-label';
    l.dataset.key = s.key;
    l.textContent = s.title;
    l.addEventListener('click', () => { markUser(); jumpToIndex(i); });
    labelBar.appendChild(l);
  });
  const labelEls = [...labelBar.children];
  let committed = -1;
  function commitLabel(i) {
    if (i === committed) return;
    committed = i;
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

  // Live speed of the carousel (slides per second), measured every frame,
  // so an interruption can hand the current momentum to the next motion.
  let liveVel = 0, lastRenderPos = null, lastRenderT = 0;
  function render() {
    const nowT = performance.now();
    if (lastRenderPos !== null && nowT - lastRenderT > 4 && nowT - lastRenderT < 100) {
      const inst = (pos - lastRenderPos) / ((nowT - lastRenderT) / 1000);
      liveVel = liveVel * 0.5 + inst * 0.5;
    } else if (nowT - lastRenderT >= 100) { liveVel = 0; }
    lastRenderPos = pos; lastRenderT = nowT;
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
  // Softer than cubic at both ends: no sudden start or stop.
  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }
  // Glide pos by `delta` over `ms`. The label follows whichever slide is
  // actually nearest the centre, so it changes as the slide arrives,
  // not the instant the motion starts (that early switch read as a "tick").
  let glideTarget = null; // where the current glide (auto-advance/entrance) is heading
  function animateGlide(delta, ms, ease, onDone) {
    cancelAnimationFrame(raf); springRunning = false;
    const from = pos, t0 = performance.now();
    glideTarget = from + delta;
    (function frame(now) {
      const t = Math.min((now - t0) / ms, 1);
      pos = from + delta * ease(t);
      render();
      commitLabel(nearestIndex());
      if (t < 1) raf = requestAnimationFrame(frame);
      else { pos = from + delta; render(); onDone && onDone(); }
    })(performance.now());
  }

  function animateEase(delta, ms, onDone) {
    cancelAnimationFrame(raf); springRunning = false;
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
    cancelAnimationFrame(raf); springRunning = false;
    const from = pos, t0 = performance.now();
    (function frame(now) {
      const t = Math.min((now - t0) / ms, 1);
      pos = from + delta * easeOutCubic(t);
      render();
      if (t < 1) raf = requestAnimationFrame(frame);
      else { pos = from + delta; render(); onDone && onDone(); }
    })(performance.now());
  }

  /* ---------- Spring: every user-driven movement ----------
     Critically damped (no bounce, no overshoot, per the site's motion
     rules) and always started from the carousel's CURRENT position and
     speed, so it can be redirected at any instant. Replaces fixed-length
     eases that made input wait in a queue until a glide finished. */
  const SPRING_RESPONSE = 0.6; // seconds; Apple-style "response"
  let springTarget = null, springVel = 0, springRunning = false, springW = (2 * Math.PI) / SPRING_RESPONSE;
  function springTo(target, vel, response) {
    if (exited) return;
    springW = (2 * Math.PI) / (response || SPRING_RESPONSE);
    clearTimeout(holdTimer);
    glideTarget = null;
    springTarget = target;
    if (typeof vel === 'number') springVel = vel;
    state = 'step';
    if (reducedMotion) { cancelAnimationFrame(raf); pos = target; springVel = 0; render(); springRunning = false; scheduleHold(); return; }
    // Already moving: the running loop simply picks up the new target and
    // keeps its current speed. (The old version cancelled the loop first
    // and then returned here, which stopped the carousel dead.)
    if (springRunning) return;
    cancelAnimationFrame(raf); // stop any glide before the spring takes over
    springRunning = true;
    let last = performance.now();
    (function frame(now) {
      const w = springW;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const sub = 4, h = dt / sub;
      for (let k = 0; k < sub; k++) {
        const a = -w * w * (pos - springTarget) - 2 * w * springVel;
        springVel += a * h;
        pos += springVel * h;
      }
      render();
      commitLabel(nearestIndex());
      if (Math.abs(pos - springTarget) < 0.004 && Math.abs(springVel) < 0.05) { // ~3px: visually arrived
        pos = springTarget; springVel = 0; springRunning = false; springTarget = null;
        render();
        scheduleHold();
        return;
      }
      raf = requestAnimationFrame(frame);
    })(last);
  }
  // Where the carousel is heading right now (for redirects).
  function headingTo() {
    if (state === 'step' && springTarget !== null) return springTarget;
    if ((state === 'auto' || state === 'entrance') && glideTarget !== null) return glideTarget;
    return Math.round(pos);
  }
  function stopMotion() { cancelAnimationFrame(raf); springRunning = false; }
  // A slide that has visibly arrived should act arrived: if the spring is
  // within a few pixels of its target, finish it now so a click opens the
  // project (instead of being treated as a mid-motion click).
  function settleIfArrived() {
    if (state === 'step' && springTarget !== null && Math.abs(pos - springTarget) < 0.06) {
      stopMotion(); pos = springTarget; springVel = 0; springTarget = null; render(); scheduleHold();
    }
  }

  /* ---------- Hold / auto-advance loop — always running ---------- */
  function scheduleHold() {
    state = 'hold';
    pos = ((pos % N) + N) % N;
    currentIndex = Math.round(pos) % N;
    render();
    commitLabel(currentIndex);
    clearTimeout(holdTimer);
    // A scroll that arrived while a slide was still moving is kept and
    // played now, instead of being silently dropped.
    // A queued click only ever centres a slide. If that slide already
    // arrived in the centre meanwhile, there's nothing to do: opening the
    // project needs a deliberate click on the centred slide.
    if (pendingJump !== -1) { const j = pendingJump; pendingJump = -1; if (j !== currentIndex) { jumpToIndex(j); return; } }
    if (pendingDir) { const d = pendingDir; pendingDir = 0; requestStep(d); return; }
    if (reducedMotion) return; // never auto-advance — user-initiated drag/click still works fine
    // After someone scrolls, drags or clicks, they're in control: wait
    // much longer before the carousel moves on by itself.
    const recentlyUsed = performance.now() - lastUserAction < USER_PAUSE_MS;
    holdTimer = setTimeout(autoAdvance, recentlyUsed ? USER_PAUSE_MS : HOLD_MS);
  }

  function autoAdvance() {
    if (exited) return;
    state = 'auto';
    // A slow, soft glide rather than a quick 650ms step: it drifts to the
    // next project and settles, so auto-advance feels continuous and calm.
    animateGlide(1, AUTO_MS, easeInOutSine, scheduleHold);
  }

  /* ---------- Direct navigation via label bar — only from a settled
     hold state, to avoid the stuck-mid-transition race. Clicking the
     label for the ALREADY-centered project enters it, exactly like
     tapping the slide itself — clicking any other label rotates there. */
  let pendingJump = -1;
  function jumpToIndex(target) {
    if (exited) return;
    settleIfArrived();
    if (state === 'drag' || state === 'exiting') return;
    // Mid-motion: redirect straight to that project from where we are now.
    // (A click during motion only ever centres a slide, never opens it.)
    if (state !== 'hold') {
      const base = headingTo();
      let d = (target - (((Math.round(base) % N) + N) % N) + N) % N;
      if (d > N / 2) d -= N;
      let v = springRunning ? springVel : liveVel;
      if (v * d < 0) v = 0; // same rule: a reversal starts from a standstill
      stopMotion();
      springTo(Math.round(base) + d, v);
      return;
    }

    if (target === currentIndex) {
      const inner = panelEls[target].querySelector('.studio-panel-inner');
      thumpThenEnter(inner, slides[target].href);
      return;
    }

    let diff = (target - currentIndex + N) % N;
    if (diff > N / 2) diff -= N;
    if (diff === 0) return;

    commitLabel(target);
    springTo(pos + diff, 0);
  }

  /* ---------- Watchdog — force-finish if anything ever gets stuck ---------- */
  let lastPos = pos;
  let lastMoveAt = performance.now();
  setInterval(() => {
    if (state === 'hold' || state === 'entrance' || state === 'drag' || state === 'exiting') { lastPos = pos; lastMoveAt = performance.now(); return; }
    if (pos !== lastPos) { lastPos = pos; lastMoveAt = performance.now(); return; }
    if (performance.now() - lastMoveAt > 1000) {
      cancelAnimationFrame(raf); springRunning = false; springTarget = null; springVel = 0;
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
  const WHEEL_TRIGGER = 60;
  let pendingDir = 0;
  let wheelLocked = false, wheelIdle = null;

  // One step per slide change, whoever asks for it (wheel, trackpad,
  // touch swipe). If a slide is already moving, remember the request
  // and play it the moment the carousel settles.
  function requestStep(dir) {
    if (exited || state === 'drag' || state === 'exiting') return;
    // Redirect from wherever the carousel is heading right now, never
    // wait for the current motion to finish.
    const base = Math.round(headingTo());
    // Don't let rapid scrolling run away more than two slides ahead.
    if (Math.abs(base + dir - pos) > 2.2) return;
    const fromIdx = ((base % N) + N) % N;
    if (dir > 0 && fromIdx === N - 1) {
      lapsCompleted += 1;
      if (lapsCompleted >= LAPS_BEFORE_ABOUT) { stopMotion(); exitToAbout(); return; }
    }
    let v = springRunning ? springVel : (state === 'hold' ? 0 : liveVel);
    // Reversing direction: start from a standstill. Inheriting the old
    // speed made the carousel keep travelling the wrong way for a frame
    // or two (2-6px) before turning, which felt like a backward tug.
    if (v * dir < 0) v = 0;
    stopMotion();
    springTo(base + dir, v);
  }

  // One gesture = one slide. Trackpads keep firing wheel events for up
  // to a second after the fingers lift (inertia), and the old handler
  // could turn that tail into a second, unintended step. Now a step
  // locks the wheel until events stop for 180ms, i.e. a new gesture.
  function onWheel(e) {
    e.preventDefault();
    markUser();
    if (exited) return;
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const px = e.deltaMode === 1 ? d * 40 : d; // line-based wheels
    clearTimeout(wheelIdle);
    wheelIdle = setTimeout(() => { wheelLocked = false; wheelAcc = 0; }, 180);
    if (wheelLocked) return;
    wheelAcc += px;
    if (Math.abs(wheelAcc) < WHEEL_TRIGGER) return;
    const dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;
    wheelLocked = true;
    requestStep(dir);
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
  // Release speed is measured over the last ~80ms of movement, not just the
  // last two events (which gave about half the real speed), and is zero if
  // the finger had stopped before letting go.
  let dragHistory = [];
  function releaseVelocity() {
    const now = performance.now();
    const recent = dragHistory.filter((h) => now - h[0] <= 120);
    if (recent.length < 2) return 0;
    const a = recent[0], z = recent[recent.length - 1];
    if (now - z[0] > 100 || z[0] - a[0] < 24) return 0;
    return -(z[1] - a[1]) / unit / ((z[0] - a[0]) / 1000);
  }
  let swipeStepped = false;

  let dragRafId = null;
  function dragRenderLoop() {
    render();
    commitLabel(nearestIndex()); // the label follows your finger live
    dragRafId = requestAnimationFrame(dragRenderLoop);
  }

  let dragOccurred = false;

  function beginDrag() {
    state = 'drag';
    dragOccurred = true;
    clearTimeout(holdTimer);
    // stopMotion (not a bare cancelAnimationFrame): it also clears the
    // spring's running flag. Without that, grabbing the carousel while it
    // was still moving left the spring thinking it was running, so on
    // release it never restarted and the carousel froze until the watchdog.
    stopMotion();
    springTarget = null; springVel = 0; glideTarget = null;
    dragStartPos = pos;
    cinema.classList.add('is-grabbing');
    lastDragX = startX;
    lastDragT = performance.now();
    dragVelocity = 0;
    dragHistory = [[performance.now(), startX]];
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
    dragHistory.push([now, clientX]);
    if (dragHistory.length > 20) dragHistory.shift();
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
    // Momentum projection (Apple's scroll-deceleration maths): project
    // where the flick is heading, snap to the slide nearest THAT point,
    // capped at two slides. Then hand the finger's exact speed to the
    // spring, so there is no seam between dragging and settling.
    dragVelocity = releaseVelocity();
    const DECEL = 0.995; // paging rate: a carousel snaps to pages, so project shorter than a free scroll
    const projected = pos + (dragVelocity / 1000) * DECEL / (1 - DECEL);
    let target = Math.round(projected);
    // Grabbed a side slide and pulled it toward the middle (even a short
    // way, >= 40px)? Bring that slide to the centre, same as clicking it.
    // Long or fast drags can still carry further via the projection above.
    const moved = pos - dragStartPos; // + when content moves left
    if (grabOffset !== 0 && Math.sign(moved) === Math.sign(grabOffset) && Math.abs(moved) * unit >= 40) {
      const grabbedTarget = Math.round(dragStartPos) + grabOffset;
      target = grabOffset > 0 ? Math.max(target, grabbedTarget) : Math.min(target, grabbedTarget);
    }
    target = Math.max(Math.round(dragStartPos) - 2, Math.min(Math.round(dragStartPos) + 2, target));
    commitLabel(((target % N) + N) % N);
    // Match the spring to the throw so the carousel only ever DECELERATES
    // from the finger's speed (never jolts faster): stiffness w <= 2v/D,
    // kept between a 0.45s and 1.4s response so it never feels sluggish.
    const D = target - pos;
    let resp = SPRING_RESPONSE;
    if (Math.abs(D) > 0.01 && Math.sign(D) === Math.sign(dragVelocity) && Math.abs(dragVelocity) > 0.05) {
      const w = Math.max((2 * Math.PI) / 1.4, Math.min((2 * Math.PI) / 0.45, 2 * Math.abs(dragVelocity) / Math.abs(D)));
      resp = (2 * Math.PI) / w;
    }
    springTo(target, dragVelocity, resp);
  }

  function handleTap(clientX, clientY) {
    if (exited) return;
    settleIfArrived();
    // Side slides are tilted in 3D, so the click usually lands on the
    // slide's outer frame rather than its inner photo layer. The old code
    // only accepted the inner layer, so every side-slide click was
    // silently dropped. Accept either.
    const target = document.elementFromPoint(clientX, clientY);
    const panel = target && target.closest('.studio-panel');
    if (!panel) return;
    const panelInner = panel.querySelector('.studio-panel-inner');
    const i = panelEls.indexOf(panel);
    if (i === -1) return;
    // Mid-motion (auto-advance or a slide change): remember the click and
    // act on it the moment the carousel settles, instead of ignoring it.
    if (state !== 'hold') { if (state !== 'drag' && state !== 'exiting') jumpToIndex(i); return; }

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

  // Entering a project: the centred slide zooms gently toward you while
  // the page fades, so it reads as going *into* the project.
  function thumpThenEnter(inner, href) {
    if (exited) return;
    exited = true; state = 'exiting'; clearTimeout(holdTimer);
    const go = () => window.pageTransitionOut ? window.pageTransitionOut(href, 380) : (window.location.href = href);
    if (reducedMotion) { go(); return; }
    inner.style.transition = 'transform 0.55s cubic-bezier(0.7, 0, 0.84, 0)';
    inner.style.transform = 'scale(1.06)';
    setTimeout(go, 160);
  }

  // Keyboard: arrows move, Enter opens the centred project.
  addEventListener('keydown', (e) => {
    if (exited || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); markUser(); requestStep(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); markUser(); requestStep(-1); }
    else if (e.key === 'Enter' && (t === document.body || t === cinema) && state === 'hold') { e.preventDefault(); jumpToIndex(currentIndex); }
  });

  // Backstop: no native drag or selection can start on the homepage stage.
  ['dragstart', 'selectstart'].forEach((type) => {
    document.addEventListener(type, (e) => {
      if (e.target && e.target.closest && e.target.closest('.studio-stage, .studio-label-bar, .studio-hint')) e.preventDefault();
    });
  });

  cinema.style.touchAction = 'none';

  /* ---------- Custom hover cursor ----------
     "View [Title]" on the active/centered slide, since that's the one
     a click actually opens. "Select [Title]" on the side slides, since
     clicking those just brings them to center rather than entering.
     Gated on actual touch capability, not viewport width — isMobile is
     a layout concern (panel sizing), but a narrow desktop window still
     has a real mouse and should still get hover behavior. */
  if (!matchMedia('(pointer: coarse)').matches) {
    const studioCursor = document.createElement('div');
    studioCursor.className = 'studio-cursor';
    document.body.appendChild(studioCursor);

    addEventListener('pointermove', (e) => {
      studioCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    });

    panelEls.forEach((panelEl, i) => {
      panelEl.addEventListener('pointerenter', () => {
        if (state === 'drag') return;
        // Follow the slide that is VISIBLY centred (not the last settled one),
        // and say View only once it has arrived, so the label always matches
        // what a click will do.
        const arrived = state === 'hold' || Math.abs(pos - Math.round(pos)) < 0.06;
        studioCursor.textContent = (i === nearestIndex() && arrived) ? 'View' : 'Select';
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
        if (state === 'hold' && !reducedMotion) {
          clearTimeout(holdTimer);
          holdTimer = setTimeout(autoAdvance, HOLD_MS);
        }
      });
    });

    cinema.addEventListener('pointerdown', () => studioCursor.classList.remove('is-visible'));
  }

  cinema.addEventListener('pointerdown', (e) => {
    if (exited) return;
    // Never let the browser start its own text selection or native drag
    // from the carousel: that is what showed the red "no drop" circle on
    // the side images and swallowed the click/drag. The carousel handles
    // every press itself, so nothing is lost. Also clear any selection
    // left over from earlier (fast clicks count as double/triple-clicks).
    if (e.pointerType === 'mouse') e.preventDefault();
    const sel = window.getSelection && window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) sel.removeAllRanges();
    markUser();
    pointerActive = true;
    pointerMode = null;
    swipeStepped = false;
    dragOccurred = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastY = e.clientY;
    startTime = performance.now();
    cinema.setPointerCapture(e.pointerId);
    // Which slide was grabbed, as an offset from the centre (-1 left,
    // +1 right, 0 centre), so pulling a side slide inward can select it.
    grabOffset = 0;
    const gp = document.elementFromPoint(e.clientX, e.clientY);
    const gpanel = gp && gp.closest('.studio-panel');
    const gi = gpanel ? panelEls.indexOf(gpanel) : -1;
    if (gi !== -1) {
      let d = (gi - pos) % N; if (d > N / 2) d -= N; if (d < -N / 2) d += N;
      grabOffset = Math.round(d);
    }
  });
  let grabOffset = 0;

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
      // One step per swipe, same as the wheel.
      if (!swipeStepped && Math.abs(startY - e.clientY) > 40) {
        swipeStepped = true;
        requestStep(startY - e.clientY > 0 ? 1 : -1);
      }
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
  // If the system cancels a touch mid-drag (notification, OS gesture),
  // settle on the nearest slide. Before, the carousel froze between two
  // slides, and the watchdog skips the drag state so it never recovered.
  cinema.addEventListener('pointercancel', () => {
    const wasDragging = pointerMode === 'drag';
    pointerActive = false;
    pointerMode = null;
    cancelAnimationFrame(dragRafId);
    cinema.classList.remove('is-grabbing');
    if (wasDragging) {
      const target = Math.round(pos);
      state = 'step';
      commitLabel(((target % N) + N) % N);
      animateSnap(target - pos, 320, scheduleHold);
    }
  });


  /* ---------- Exit to About: accelerate away (mirror of entrance),
     scene dissolves, THEN the shared page-transition veil covers and
     navigates for real. ---------- */
  // Leaving for About: the scene eases gently forward and fades while
  // the page veil comes in. Replaces a 3-slide accelerating spin plus a
  // full-screen blur (blur on large images is expensive and stuttered).
  function exitToAbout() {
    exited = true;
    state = 'exiting';
    clearTimeout(holdTimer);
    const go = () => window.pageTransitionOut ? window.pageTransitionOut('about.html', 450) : (window.location.href = 'about.html');
    if (reducedMotion) { go(); return; }
    document.body.classList.add('studio-is-leaving');
    const from = pos, t0 = performance.now();
    cancelAnimationFrame(raf); springRunning = false;
    (function frame(now) {
      const t = Math.min((now - t0) / EXIT_MS, 1);
      pos = from + 0.35 * t * t * t; // ease-in: starts still, gathers pace
      render();
      if (t < 1) raf = requestAnimationFrame(frame);
    })(performance.now());
    setTimeout(go, 280);
  }

  addEventListener('resize', () => { computeGeom(); applySizes(); render(); });

  /* ---------- Entrance: fast, constant-rate deceleration, lands on Hive ---------- */
  computeGeom();
  applySizes();
  commitLabel(0);
  let returnIndex = -1;
  try {
    const last = sessionStorage.getItem('studio-last');
    if (last) returnIndex = slides.findIndex((s) => s.href === last);
  } catch (e) {}
  if (reducedMotion && returnIndex > -1) { pos = returnIndex; }
  if (reducedMotion) {
    document.documentElement.classList.remove('studio-preload');
    pos = returnIndex > -1 ? returnIndex : 0;
    render();
    scheduleHold();
    hint.classList.add('is-visible');
  } else if (returnIndex > -1) {
    // Coming back from a project: that project glides gently into the
    // centre instead of replaying the C1 -> Sketches -> Hive intro.
    pos = returnIndex - 0.6;
    render();
    commitLabel(returnIndex);
    state = 'entrance';
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('studio-preload');
      animateGlide(0.6, 1400, easeInOutCubic, () => {
        scheduleHold();
        setTimeout(() => hint.classList.add('is-visible'), 300);
      });
    });
  } else {
    // Arrive with motion: the slides glide in from ~0.6 of a slide away
    // and decelerate into place while the scene fades up, so it reads as
    // "it moves, slows, and it's yours". Glide and fade start together.
    // Arrive by travelling from C1, past Sketches, to Hive. The first frame
    // shows C1 in full, a ~20% glimpse of TOAD at the left edge and about
    // half of Sketches on the right.
    // Motion starts almost still while the page fades in, gathers pace
    // gently, then settles slowly onto Hive: one calm movement, never two
    // things changing fast at once.
    const ENTRANCE_OFFSET = 1.9, ENTRANCE_MS = 2800;
    pos = -ENTRANCE_OFFSET;
    render();
    commitLabel(((Math.floor(pos) % N) + N) % N); // C1 highlighted on the first frame
    state = 'entrance';
    // Wait for the centre photo and its neighbours to be decoded (capped),
    // so nothing pops in after the fade. Then reveal in one move.
    const urls = [0, 1, N - 1, N - 2, N - 3].map((k) => ((k % N) + N) % N).map((k) => {
      const m = (getComputedStyle(panelEls[k].querySelector('.studio-panel-inner')).backgroundImage || '').match(/url\(["']?([^"')]+)/);
      return m && m[1];
    }).filter(Boolean);
    const ready = Promise.all(urls.map((u) => { const im = new Image(); im.src = u; return im.decode ? im.decode().catch(() => {}) : Promise.resolve(); }));
    let started = false;
    const start = () => {
      if (started) return; started = true;
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('studio-preload');
        animateGlide(ENTRANCE_OFFSET, ENTRANCE_MS, easeInOutCubic, () => {
          scheduleHold();
          setTimeout(() => hint.classList.add('is-visible'), 300);
        });
      });
    };
    ready.then(start); setTimeout(start, 900);
  }

  // Browser Back can restore this page exactly as it was left: mid-exit,
  // with the clicked slide zoomed or the stage faded out for About, and
  // the carousel marked as exited (unresponsive). Reset all of that and
  // settle on the project that was in front.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    exited = false;
    cancelAnimationFrame(raf);
    springRunning = false; springVel = 0; springTarget = null; glideTarget = null;
    clearTimeout(holdTimer);
    pendingDir = 0; pendingJump = -1;
    document.body.classList.remove('studio-is-leaving');
    document.documentElement.classList.remove('studio-preload');
    panelEls.forEach((p) => {
      const inner = p.querySelector('.studio-panel-inner');
      if (inner) { inner.style.transition = 'none'; inner.style.transform = ''; }
    });
    pos = Math.round(pos);
    scheduleHold();
  });
});
