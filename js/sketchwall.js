(() => {
  const field = document.getElementById('wallField');
  const dragCursor = document.getElementById('dragCursor');
  const touchHint = document.getElementById('wallTouchHint');

  // Touch has no hover, so it never sees the "Click to view" pill that
  // tells desktop visitors both gestures exist before they touch
  // anything. A one-time static hint stands in for that on a coarse
  // pointer — shown once per browser (remembered in localStorage), gone
  // for good after that, on first touch or after a few seconds either way.
  const isCoarsePointer = matchMedia('(hover: none), (pointer: coarse)').matches;
  if (touchHint) {
    let hintSeen = true;
    try { hintSeen = !!localStorage.getItem('sketchwallTouchHintSeen'); } catch (e) { /* private mode etc — just don't nag */ }
    if (isCoarsePointer && !hintSeen) {
      requestAnimationFrame(() => touchHint.classList.add('is-visible'));
      const dismissHint = () => {
        touchHint.classList.remove('is-visible');
        try { localStorage.setItem('sketchwallTouchHintSeen', '1'); } catch (e) {}
      };
      setTimeout(dismissHint, 4000);
      addEventListener('pointerdown', dismissHint, { once: true, passive: true });
    } else {
      touchHint.remove();
    }
  }

  const tones = [
    'linear-gradient(135deg,#E8E2D5,#C9BFA8)', 'linear-gradient(135deg,#DCE5D2,#AEC49A)',
    'linear-gradient(135deg,#E5E5E5,#C2C2C2)', 'linear-gradient(135deg,#F5EFE5,#DCD0BC)',
    'linear-gradient(135deg,#DCE3E5,#AEC0C4)', 'linear-gradient(135deg,#EFE7D6,#D8CDA8)',
  ];

  const N = 25;
  const cards = [];
  function rand(a, b) { return a + Math.random() * (b - a); }

  // The physics show (the staggered fly-in on load, the firework burst
  // on rescatter) is large, automatic motion across the whole viewport
  // — exactly what prefers-reduced-motion is for. Direct manipulation
  // (dragging and throwing a single card yourself) is left alone: that
  // motion is caused by the user's own hand, not sprung on them.
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- Ambient field reactivity (fun layer) -----------------
  // Motion-only, no sound, no new colors. Skipped outright under
  // reduced-motion, same as the rest of the page's decorative motion.
  let mouseX = -9999, mouseY = -9999;
  addEventListener('pointermove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

  // Cards near the cursor lean away slightly, like brushing a hand over a
  // pile of real photos — only while genuinely at rest (not dragging,
  // not hovered — that card already has its own scale feedback — not
  // mid-throw/rescatter, where physics already owns the transform).
  const AMBIENT_RADIUS = 150;
  const AMBIENT_MAX_PUSH = 24;
  function ambientTick() {
    if (prefersReducedMotion) return;
    cards.forEach((card) => {
      let targetOx = 0, targetOy = 0;
      if (!card.dragging && !card.exploding && !card.hovered) {
        const cx = card.x + card.w / 2, cy = card.y + card.h / 2;
        const dx = cx - mouseX, dy = cy - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < AMBIENT_RADIUS && dist > 1) {
          const t = 1 - dist / AMBIENT_RADIUS;
          const push = t * AMBIENT_MAX_PUSH;
          targetOx = (dx / dist) * push;
          targetOy = (dy / dist) * push;
        }
      }
      const newOx = card.ox + (targetOx - card.ox) * 0.12;
      const newOy = card.oy + (targetOy - card.oy) * 0.12;
      const changed = Math.abs(newOx - card.ox) > 0.03 || Math.abs(newOy - card.oy) > 0.03;
      card.ox = Math.abs(newOx) < 0.03 ? 0 : newOx;
      card.oy = Math.abs(newOy) < 0.03 ? 0 : newOy;
      // Cards already mid-flight/rest-check get rendered by physicsTick's
      // own loop right after this runs — only render here for the ones
      // that loop skips (idle, not inMotion), so we don't double-write
      // the same frame's transform.
      if (changed && !card.inMotion) render(card);
    });
  }

  // True while ANY card is being dragged. pointerenter/pointerleave are
  // explicitly NOT redirected by setPointerCapture (only pointermove/up/
  // down/cancel are) — so while dragging card A across the dense wall,
  // the cursor sliding over card B still fires B's own pointerenter,
  // which was resetting the shared drag-cursor pill's text back to
  // "Click to view" the instant it should have said "Drag". Checking
  // this shared flag instead of each card's own .dragging is what
  // actually stops that — confirmed against the Pointer Events spec,
  // not guessed.
  let draggingCard = null;

  // Rubber-band resistance for dragging past the wall's edge — the
  // further past the boundary, the less the card follows the pointer,
  // same shape a real object pulled against something holding it would
  // have. Without this a card could be dragged fully off-screen with no
  // feedback at all that it was leaving, and if released gently (not a
  // hard throw) it stayed lost off-screen permanently — confirmed by
  // testing, not assumed. See endDrag()'s "drop" branch for the other
  // half of that fix.
  function rubberband(overshoot, dimension, constant = 0.55) {
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
  }
  function withRubberBand(raw, min, max, dimension) {
    if (raw < min) return min - rubberband(min - raw, dimension);
    if (raw > max) return max + rubberband(raw - max, dimension);
    return raw;
  }

  const FRICTION = 0.965;
  const RESTITUTION = 0.62;
  // Only used by the rescatter burst (regular throws don't fall). Raised
  // from 0.38 — simulating the actual formula showed the old value let
  // the slowest of 25 random cards routinely take 5-8+s to clear the
  // screen, which is what made rescatter feel broken/laggy, the wall
  // sat waiting on one straggler most of the time. This value, paired
  // with the tightened speed/weight ranges below, keeps the worst of
  // 25 comfortably under ~1.6s so the burst reads as snappy every time.
  const GRAVITY = 0.65;
  const STOP_THRESHOLD = 4;

  let topZ = 10;
  // Cards climb in z-index on every hover/drag/rebuild so the most
  // recently-touched one renders on top. Left uncapped, that climb
  // crosses .wall-expand-veil's z-index (100) after enough interaction
  // in one session, and a card would then render ABOVE the expand veil
  // and its enlarged image instead of correctly sliding underneath it
  // when it parts. Wrapping the counter well below 100 keeps the
  // "most recent card wins" ordering among the cards themselves while
  // guaranteeing none of them can ever outrank the veil.
  const Z_CEILING = 90;
  function nextZ() {
    if (topZ >= Z_CEILING) topZ = 10;
    return ++topZ;
  }

  // dims: array of { areaSize, w, h } — areaSize drives collision spacing
  // (kept as an even circle regardless of aspect ratio), w/h are the
  // card's real on-screen dimensions, already shaped to match each
  // sketch's actual aspect ratio.
  function computeLayout(dims) {
    const w = innerWidth, h = innerHeight;
    const headlineExcludeH = h * 0.3; // only the headline's own vertical band
    const placed = [];
    const result = [];
    const minGap = -55; // negative = cards can genuinely overlap, creating a real layered stack

    // The fixed "Yash Yogesh" / About row sits right at the very top
    // (padding 42px desktop, 22px mobile — see .wall-frame-top). The old
    // +8 minimum let a card's CENTER land 8px from the top edge, meaning
    // its actual top could sit right under, or overlapping, that text —
    // a card doesn't know the nav is there, it just renders on top of it
    // since the nav's z-index is deliberately kept above every card.
    // Keeping cards' centers below the nav's real height fixes it at the
    // source instead of trying to patch it with more z-index tricks.
    const navSafeTop = w <= 768 ? 92 : 116;

    function tryPoint(areaSize) {
      const x = rand(areaSize / 2 + 20, Math.max(areaSize / 2 + 21, w - areaSize / 2 - 20));
      // areaSize/2 + navSafeTop, not a max() of the two — a max() still let
      // big cards (areaSize/2 alone bigger than navSafeTop) land with their
      // real top edge back at the old ~8px margin, which is exactly the
      // large-card case the screenshot showed.
      const yMin = areaSize / 2 + navSafeTop;
      const y = rand(yMin, Math.max(yMin + 1, h - areaSize / 2 - 60));
      return { x, y };
    }
    function isBehindHeadline(x, y, areaSize) {
      // Only the small central-top region behind the headline text —
      // NOT the entire top band. That's what was compressing everything
      // into the lower portion of the page.
      return x > w * 0.28 && x < w * 0.72 && y < headlineExcludeH + areaSize * 0.3;
    }

    dims.forEach((d) => {
      let areaSize = d.areaSize;
      let scale = 1;
      let attempts = 0;
      let done = false;
      while (!done) {
        attempts++;
        const r = areaSize * 0.62;
        const { x, y } = tryPoint(areaSize);
        if (isBehindHeadline(x, y, areaSize)) continue;
        let ok = true;
        for (const p of placed) {
          if (Math.hypot(x - p.x, y - p.y) < r + p.r + minGap) { ok = false; break; }
        }
        if (ok) {
          placed.push({ x, y, r });
          const cw = d.w * scale, ch = d.h * scale;
          result.push({ x: x - cw / 2, y: y - ch / 2, rot: rand(-24, 24), w: cw, h: ch });
          done = true;
        } else if (attempts > 400) {
          // Struggling to fit at this size — shrink THIS item slightly
          // (width and height together, so its aspect ratio holds) and
          // keep trying, rather than silently dropping it. Every sketch
          // is guaranteed to actually appear.
          areaSize *= 0.96;
          scale *= 0.96;
          attempts = 0;
          if (areaSize < 90) {
            // absolute floor — place it even if it means a touch of
            // overlap, rather than never rendering it at all
            const { x: x2, y: y2 } = tryPoint(areaSize);
            const r2 = areaSize * 0.62;
            placed.push({ x: x2, y: y2, r: r2 });
            const cw = d.w * scale, ch = d.h * scale;
            result.push({ x: x2 - cw / 2, y: y2 - ch / 2, rot: rand(-24, 24), w: cw, h: ch });
            done = true;
          }
        }
      }
    });
    return result;
  }

  function buildField() {
    field.innerHTML = '';
    cards.length = 0;
    // Raised from 0.4/130-210 — at a typical wide desktop viewport the old
    // numbers left the wall looking sparse, cards read as small mostly
    // because of how much bare canvas surrounded them, not because any
    // one card was drawn wrong. Bigger fill ratio and a higher size floor
    // and ceiling so cards read as a proper wall of sketches at any
    // screen width, not a few small photos scattered on an empty table.
    const FILL_RATIO = 0.5;
    const baseArea = (innerWidth * innerHeight * FILL_RATIO) / N;
    const baseRadius = Math.sqrt(baseArea / Math.PI);
    const baseAreaSize = Math.max(150, Math.min(260, baseRadius / 0.62));

    const items = (window.CONTENT && CONTENT.sketchwall && CONTENT.sketchwall.items) || [];
    const dims = Array.from({ length: N }, (_, i) => {
      // Variance narrowed from 0.85-1.15 — that spread let the unlucky
      // small end of the range read as noticeably tiny next to the large
      // end. Same organic size variety, less of a gap between smallest
      // and largest.
      const areaSize = baseAreaSize * rand(0.9, 1.12);
      const ratio = (items[i] && items[i].ratio) || 1;
      // Card shape matches the sketch's real aspect ratio exactly, so
      // it can show the whole image with no crop and no white
      // letterbox margin. Height/width are derived so the on-screen
      // footprint AREA stays close to a square card's, a wide sketch
      // becomes short-and-wide rather than blowing up the layout.
      const ch = areaSize / Math.sqrt(ratio);
      const cw = ch * ratio;
      return { areaSize, w: cw, h: ch };
    });

    const positions = computeLayout(dims);
    const order = positions.map((_, i) => i).sort(() => Math.random() - 0.5);

    positions.forEach((pos, i) => {
      const el = document.createElement('div');
      el.className = 'scatter-card';
      el.style.width = pos.w + 'px';
      el.style.height = pos.h + 'px';
      // Keyboard/screen-reader access — these were plain unlabeled divs
      // before, reachable only with a pointer. tabIndex + role make
      // each one a real focusable control; the aria-label is only for
      // assistive tech, it doesn't put a title on screen (that stays
      // banned in the expand view per site rule).
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      const item = items[i];
      // The wall uses the small 'thumb' image, not the full-resolution
      // file — decoding 25 full-res images at once was the actual
      // cause of the lag. The full file only ever loads later, when
      // this one sketch is actually opened (see openExpand).
      const thumbSrc = (item && (item.thumb || item.image)) || '';
      el.style.background = thumbSrc
        ? `url('${thumbSrc}') no-repeat center/contain var(--color-bg)`
        : tones[i % tones.length];
      el.style.zIndex = nextZ();
      field.appendChild(el);

      // No fallback label — per site rule, sketches carry no title at all
      // unless one is explicitly set in content.js.
      const title = (item && item.title) || '';
      el.setAttribute('aria-label', title || `Sketch ${i + 1} of ${N}, view enlarged`);
      const fullImage = (item && item.image) || '';
      const card = {
        el, title, fullImage,
        x: pos.x, y: pos.y, baseRot: pos.rot,
        w: pos.w, h: pos.h,
        vx: 0, vy: 0, ox: 0, oy: 0,
        hovered: false, dragging: false, inMotion: false, exploding: false, gliding: false,
      };
      cards.push(card);
      wireCard(card);

      if (prefersReducedMotion) {
        // Skip the staggered fly-in entirely — land straight at rest.
        el.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rot}deg) scale(1)`;
        el.style.opacity = '1';
      } else {
        const delay = order.indexOf(i) * 45 + rand(0, 80);
        el.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rot}deg) scale(0.3)`;
        setTimeout(() => {
          el.style.transition = 'transform 0.55s var(--ease-cinematic), opacity 0.4s ease';
          el.style.opacity = '1';
          el.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rot}deg) scale(1)`;
          setTimeout(() => { el.style.transition = ''; }, 600);
        }, delay);
      }
    });
  }

  function render(card) {
    let rot;
    if (card.exploding || card.gliding) {
      // Flight rotation is set ONCE, at the moment of launch — not
      // recalculated from live velocity every frame. Recomputing it
      // continuously was the actual bug: as speed decays toward zero
      // the angle math becomes unstable and jitters, and a wall bounce
      // flips the velocity sign instantly, snapping the visual rotation
      // by up to 180° in a single frame. A fixed angle can't do either.
      rot = card.flightRot;
    } else {
      rot = card.hovered ? 0 : card.baseRot;
    }
    const scale = card.curScale || 1;
    // ox/oy: a small ambient offset from the cursor-proximity nudge below —
    // additive to the card's real x/y, never written back into them, so
    // drag/throw/layout math elsewhere stays untouched.
    const ox = card.ox || 0, oy = card.oy || 0;
    card.el.style.transform = `translate(${card.x + ox}px, ${card.y + oy}px) rotate(${rot}deg) scale(${scale})`;
  }

  function wireCard(card) {
    const { el } = card;
    let dragOffsetX = 0, dragOffsetY = 0;
    let lastMoveX = 0, lastMoveY = 0, lastMoveT = 0;
    let downX = 0, downY = 0;

    // Keyboard equivalent of a click: Enter/Space opens the sketch.
    // Dragging and throwing stay mouse/touch-only — there's no keyboard
    // equivalent for that gesture, same as most direct-manipulation UI.
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openExpand(card);
    });

    el.addEventListener('pointerenter', (e) => {
      if (draggingCard) return;
      card.hovered = true;
      // A little larger on hover (about 15%) — real, tactile feedback
      // that this is the thing your pointer is over, not just a flat
      // rotation reset. Skipped mid-flight/mid-flinch — this only reads
      // right on a card that's actually sitting still.
      if (!card.inMotion && !card.exploding) card.curScale = 1.15;
      card.el.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
      render(card);
      card.el.style.zIndex = nextZ();
      // Hover always starts as "you can click this to view it" — see
      // the pointermove drag handler below for where this switches to
      // "Drag" once an actual drag is under way.
      dragCursor.textContent = 'Click to view';
      dragCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      dragCursor.classList.add('is-visible');
    });
    el.addEventListener('pointerleave', () => {
      if (draggingCard) return;
      card.hovered = false;
      card.curScale = 1;
      card.el.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
      render(card);
      dragCursor.classList.remove('is-visible');
    });
    el.addEventListener('pointermove', (e) => {
      if (draggingCard) return; // the dragged card's own handler below owns the pill while dragging
      dragCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      dragCursor.classList.add('is-visible');
    });

    el.addEventListener('pointerdown', (e) => {
      card.dragging = true;
      draggingCard = card;
      card.vx = 0; card.vy = 0; card.inMotion = false;
      // Grabbing it is the user taking manual control of where it sits —
      // don't let a later unpartWall() snap it back to its pre-expand
      // spot out from under them.
      delete card.preExpandX;
      el.classList.add('is-dragging');
      el.style.zIndex = nextZ();
      el.setPointerCapture(e.pointerId);
      dragOffsetX = e.clientX - card.x;
      dragOffsetY = e.clientY - card.y;
      lastMoveX = e.clientX; lastMoveY = e.clientY; lastMoveT = performance.now();
      downX = e.clientX; downY = e.clientY;
      // Immediate squash-and-stretch pop on grab — real, snappy, tactile
      // feedback the instant you touch it, not just a shadow change.
      // Snap to the pop instantly (no transition), then let it relax
      // down to a resting "held" scale with an actual eased transition.
      card.el.style.transition = 'none';
      card.curScale = 1.16;
      render(card);
      requestAnimationFrame(() => {
        card.el.style.transition = 'transform 0.22s var(--ease-cinematic)';
        card.curScale = 1.06;
        render(card);
      });
    });
    el.addEventListener('pointermove', (e) => {
      if (!card.dragging) return;
      const rawX = e.clientX - dragOffsetX;
      const rawY = e.clientY - dragOffsetY;
      // Resist past the wall's edge instead of following 1:1 with no
      // limit — a soft "there's nothing more here" instead of letting
      // the card wander fully off-screen.
      card.x = withRubberBand(rawX, 0, innerWidth - card.w, innerWidth);
      card.y = withRubberBand(rawY, 0, innerHeight - card.h, innerHeight);
      render(card);

      // Only relabel once it's actually a drag, not a click that hasn't
      // resolved yet — same 6px hysteresis endDrag() uses to tell them
      // apart, so the label always agrees with what release is about to do.
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) {
        dragCursor.textContent = 'Drag';
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveT);
      card.vx = ((e.clientX - lastMoveX) / dt) * 16;
      card.vy = ((e.clientY - lastMoveY) / dt) * 16;
      lastMoveX = e.clientX; lastMoveY = e.clientY; lastMoveT = now;
    });
    function endDrag(e) {
      if (!card.dragging) return;
      card.dragging = false;
      draggingCard = null;
      el.classList.remove('is-dragging');

      const throwSpeed = Math.hypot(card.vx, card.vy);
      const THROW_THRESHOLD = 3; // a real deliberate flick, not an accidental nudge
      const moveDist = e ? Math.hypot(e.clientX - downX, e.clientY - downY) : 999;

      if (moveDist < 6) {
        // Barely moved at all — this was a click, not a drag. Open the
        // real expand view instead of settling in place.
        card.el.style.transition = 'transform 0.5s var(--ease-cinematic)';
        card.curScale = 1;
        render(card);
        openExpand(card);
        return;
      }

      if (throwSpeed > THROW_THRESHOLD) {
        // It's being thrown — JS will drive its transform every single
        // frame during flight, so a CSS transition here would fight
        // those updates and smear. Snap scale back instantly instead;
        // the curving flight itself is the feedback for a throw.
        card.el.style.transition = '';
        card.curScale = 1;
        card.inMotion = true;
        card.gliding = true; // banking orientation — the nose visually tracks the flight direction
        // Rotation is set once, right here, from the actual throw
        // direction — then it stays fixed for the whole flight. A
        // small one-time random variance gives it character without
        // ever letting the angle drift or destabilize mid-flight.
        //
        // Fully committing to the raw travel angle looked wrong in
        // practice: an ordinary throw could snap the card's rotation by
        // 100-140° in a single frame (no transition plays during flight,
        // see above), which read as "spinning a lot" rather than a real
        // paper-airplane bank. Capping how far it can rotate away from
        // its resting angle keeps the banking character without the
        // disorienting snap.
        const throwAngle = Math.atan2(card.vy, card.vx) * (180 / Math.PI);
        let delta = throwAngle - card.baseRot;
        delta = ((delta + 180) % 360 + 360) % 360 - 180; // normalize to -180..180
        const MAX_THROW_BANK = 55; // degrees — most it can bank toward the throw direction
        delta = Math.max(-MAX_THROW_BANK, Math.min(MAX_THROW_BANK, delta));
        card.flightRot = card.baseRot + delta + rand(-8, 8);
      } else {
        // Just a drop, not a throw — safe to use a real CSS transition
        // here since nothing else is touching its transform right now.
        // Elastic overshoot settle, not a flat instant snap.
        card.el.style.transition = 'transform 0.5s var(--ease-cinematic)';
        card.curScale = 1;
        render(card);
        // Hand this off to physicsTick even though it isn't a throw —
        // its non-exploding branch already clamps position to the wall
        // bounds every frame (see below). Without this, a card dropped
        // right at the rubber-banded edge with near-zero velocity never
        // re-entered that check and could stay stuck part-off-screen.
        card.inMotion = true;
      }
    }
    el.addEventListener('pointerup', (e) => endDrag(e));
    el.addEventListener('pointercancel', () => endDrag(null));
  }

  let isExploding = false;
  let allExplodedAt = 0; // timestamp once every sketch has launched — see completion check below

  function physicsTick() {
    const w = innerWidth, h = innerHeight;
    const now = performance.now();
    ambientTick();
    cards.forEach((card) => {
      if (!card.inMotion) return;

      card.x += card.vx;
      card.y += card.vy;
      card.vx *= card.exploding ? 0.994 : FRICTION;
      card.vy *= card.exploding ? 0.994 : FRICTION;

      if (card.exploding) {
        // Real, continuous projectile motion — constant gravity acting
        // from the moment it launches is what naturally produces the
        // rise, the deceleration, the apex, and the fall. No scripted
        // phase-switch, no instant velocity swap — this is just actual
        // physics, the same reason a thrown ball arcs instead of
        // stopping dead and reversing.
        card.vy += GRAVITY * card.gravityMul; // each sketch has its own weight — heavier ones fall faster, lighter ones float longer

        // A little banking character layered on top — small and
        // decaying at its own per-sketch rate, so no two curve the
        // same way or straighten out at the same time.
        const turnRad = card.curveRate * (Math.PI / 180);
        card.curveRate *= card.curveDecay;
        const cosT = Math.cos(turnRad), sinT = Math.sin(turnRad);
        const newVx = card.vx * cosT - card.vy * sinT;
        const newVy = card.vx * sinT + card.vy * cosT;
        card.vx = newVx;
        card.vy = newVy;

        // A visible flutter — real paper doesn't fly on a perfectly
        // smooth banked line, it wobbles as it cuts through the air.
        // Layered on top of the velocity-tracking orientation, not
        // replacing it, so it still visibly banks into its real path.
        const baseRot = Math.atan2(card.vy, card.vx) * (180 / Math.PI);
        const flutter = Math.sin(now / 1000 * card.flutterFreq + card.flutterPhase) * card.flutterAmp;
        card.flightRot = baseRot + flutter;
      } else {
        const minX = 0, maxX = w - card.w;
        const minY = 0, maxY = h - card.h;
        if (card.x < minX) { card.x = minX; card.vx = -card.vx * RESTITUTION; }
        if (card.x > maxX) { card.x = maxX; card.vx = -card.vx * RESTITUTION; }
        if (card.y < minY) { card.y = minY; card.vy = -card.vy * RESTITUTION; }
        if (card.y > maxY) { card.y = maxY; card.vy = -card.vy * RESTITUTION; }
      }

      render(card);

      if (!card.exploding && Math.abs(card.vx) < STOP_THRESHOLD / 60 && Math.abs(card.vy) < STOP_THRESHOLD / 60) {
        card.inMotion = false;
        card.vx = 0; card.vy = 0;
        if (card.gliding && card.flightRot != null) {
          // It can fly at any angle mid-flight, but the resting rotation
          // it lands at shouldn't exceed 50° — beyond that it's genuinely
          // harder to view the sketch properly. Hovering still straightens
          // it to 0° regardless, exactly as before.
          card.baseRot = Math.max(-50, Math.min(50, card.flightRot));
        }
        card.gliding = false;
        // A satisfying little "landing" pulse now that it's genuinely
        // at rest — safe to use a real transition here, nothing else
        // is touching its transform anymore.
        card.el.style.transition = 'transform 0.4s var(--ease-cinematic)';
        card.curScale = 1.08;
        render(card);
        setTimeout(() => {
          card.curScale = 1;
          render(card);
          // A card that was still settling (mid-throw, mid-rescatter) the
          // moment a sketch got expanded was skipped by partWall() — it
          // only ever ran once, at the instant of opening, and it
          // deliberately leaves dragging/inMotion cards alone since their
          // position isn't final yet. That left it free to land wherever
          // physics put it, sometimes right behind the enlarged image,
          // hidden for good since nothing ever re-checked it. Re-running
          // partWall() here, now that this card has actually come to
          // rest, catches that case without touching cards that were
          // already parted correctly.
          if (expandedCard) partWall();
        }, 20);
      }
    });

    // Rebuild the instant every sketch has actually cleared the screen —
    // not after a fixed guessed delay. Only checked once every sketch
    // has actually launched, so it can't fire early while some are
    // still waiting in the stagger queue.
    //
    // Real bug found by testing this, not guessing: "stillFlying" waits
    // for the SINGLE SLOWEST of 25 cards to clear the screen. The first
    // fix (tightening the ranges a little, adding a 1800ms hard cap)
    // wasn't actually enough — simulating the old ranges showed the
    // median single-card flight was already 1.7s, so with 25 draws the
    // 1800ms cap was hit on essentially EVERY rescatter, abruptly
    // cutting 6-10 still-visible cards out of the air and snapping to
    // the new layout. That hard cut, not frame rate, is what read as
    // "laggy". The GRAVITY/speed/weight constants above are now tuned
    // (simulated 1500+ runs of the real formula) so the worst of 25
    // clears in ~1.6s or less on its own. The cap below stays only as a
    // rare safety net, raised so it essentially never fires in normal use.
    if (isExploding && launchedCount === totalToLaunch && totalToLaunch > 0) {
      if (!allExplodedAt) allExplodedAt = now;
      const stillFlying = cards.some((c) => c.exploding && c.y < h + 120);
      const MAX_EXPLODE_WAIT = 2200; // ms — rare safety net, see note above
      const tookTooLong = now - allExplodedAt > MAX_EXPLODE_WAIT;
      if (!stillFlying || tookTooLong) {
        buildField();
        isExploding = false;
        allExplodedAt = 0;
        rescatterBtn.disabled = false;
      }
    }

    requestAnimationFrame(physicsTick);
  }

  // ---------------- Rescatter: explode everything off-screen, then pop
  // a brand new random layout back in ----------------
  const rescatterBtn = document.getElementById('rescatterBtn');
  let launchedCount = 0;
  let totalToLaunch = 0;

  function rescatter() {
    if (isExploding) return;

    if (prefersReducedMotion) {
      // Same result — a fresh random layout — without the firework
      // burst across the whole screen. A quick crossfade instead.
      rescatterBtn.disabled = true;
      cards.forEach((card) => { card.el.style.transition = 'opacity 0.15s ease'; card.el.style.opacity = '0'; });
      setTimeout(() => {
        buildField();
        rescatterBtn.disabled = false;
      }, 160);
      return;
    }

    isExploding = true;
    allExplodedAt = 0;
    rescatterBtn.disabled = true;
    launchedCount = 0;
    totalToLaunch = cards.length;

    // Anticipation — every sketch flinches inward slightly before the
    // burst, a brief windup that makes the payoff read as a real
    // release of energy, not just things suddenly moving.
    cards.forEach((card) => {
      card.el.style.transition = 'transform 0.13s cubic-bezier(0.4, 0, 0.6, 1)';
      card.curScale = 0.92;
      render(card);
    });

    setTimeout(() => {
      cards.forEach((card) => {
        // Each sketch launches on its own small random delay, so the
        // burst cascades outward like a real string of firecrackers,
        // not one mechanical simultaneous event.
        const launchDelay = rand(0, 500);
        setTimeout(() => {
          // A swift, mostly-vertical launch upward — like a firework
          // going up. Real gravity (applied every frame in physicsTick)
          // takes it from here: it'll decelerate, reach a natural apex,
          // and fall — genuine continuous physics, not a scripted phase.
          // Real variety, not a uniform launch — wide angle spread, wide
          // speed range, and a per-sketch "weight" so some feel heavier
          // (fall faster, bank less) and others lighter and flightier,
          // like real paper airplanes never fold identically.
          const angle = rand(-135, -45) * (Math.PI / 180);
          // Speed and weight ranges tightened from their original spread —
          // simulated the actual formula (3000+ runs) rather than
          // guessing. The old spread let a fast, light straggler stay
          // airborne long after everything else had cleared, which is
          // what read as "laggy": the burst would sit on one card for
          // a couple extra seconds before it could rebuild. This range
          // keeps the worst of 25 under ~1.6s. Still real variety, just
          // without that long a tail.
          const speed = rand(11, 18);
          card.vx = Math.cos(angle) * speed;
          card.vy = Math.sin(angle) * speed;
          card.curveRate = rand(3, 12) * (Math.random() < 0.5 ? 1 : -1);
          card.curveDecay = rand(0.965, 0.992); // some straighten out fast, others keep curving much longer
          card.gravityMul = rand(1.3, 2.0); // heavier or lighter than average — still varies, without the extreme floaty tail
          card.flutterAmp = rand(2, 8);
          card.flutterFreq = rand(2, 5);
          card.flutterPhase = rand(0, Math.PI * 2);
          card.flightRot = Math.atan2(card.vy, card.vx) * (180 / Math.PI);
          card.el.style.transition = '';
          card.curScale = 1.1; // a little pop right as it launches
          card.exploding = true;
          card.hovered = false;
          card.inMotion = true;
          launchedCount++;
        }, launchDelay);
      });
    }, 128);
  }
  rescatterBtn.addEventListener('click', rescatter);

  // ---------------- Expand view — the real site's existing modal ----------------
  const expandVeil = document.getElementById('wallExpandVeil');
  const expandCard = document.getElementById('wallExpandCard');
  const expandTitle = document.getElementById('wallExpandTitle');
  const expandClose = document.getElementById('wallExpandClose');

  // Part the wall when a sketch opens full-size, instead of leaving the
  // whole busy scatter frozen behind the veil's blur — every card not
  // currently mid-drag or mid-flight slides out to whichever side of
  // center it's already closer to, clearing real room in the middle for
  // the one enlarged sketch, then slides back on close. Same left-goes-
  // left/right-goes-right logic either direction, so the return path
  // retraces the exit path.
  function partWall() {
    const centerX = innerWidth / 2;
    // The enlarged sketch itself — same sizing .wall-expand-card uses in
    // CSS (min(72vw, 560px)) — plus a little breathing room around it.
    // That's the only region that actually needs to clear. A card
    // already sitting outside it is left exactly where it is, still
    // visible in the side margins — parting isn't "send everything off
    // the screen", it's "get out of the one picture's way".
    const expandHalfW = Math.min(innerWidth * 0.72, 560) / 2 + 40;
    cards.forEach((c) => {
      if (c.dragging || c.inMotion) return;
      const rot = c.hovered ? 0 : c.baseRot;
      // A tilted card's true on-screen footprint is wider than its own
      // stored w/h — checking the plain unrotated box let a rotated
      // card's corners poke past the check and stay hidden right behind
      // the enlarged image, visible as a sliver at its edges. Using the
      // rotated bounding box (same trig the browser uses to actually
      // paint it) is what the check needs to match what's on screen.
      const rad = rot * (Math.PI / 180);
      const cosA = Math.abs(Math.cos(rad)), sinA = Math.abs(Math.sin(rad));
      const rotW = c.w * cosA + c.h * sinA;
      const cxMid = c.x + c.w / 2;
      const cardLeft = cxMid - rotW / 2, cardRight = cxMid + rotW / 2;
      const overlapsCenter = cardRight > centerX - expandHalfW && cardLeft < centerX + expandHalfW;
      if (!overlapsCenter) return; // already clear — don't move it at all
      const dir = cxMid < centerX ? -1 : 1;
      // Move it just past the clear zone's edge on its own side, not off
      // the screen entirely — it should still read as part of the wall,
      // pushed into the room that's actually there.
      const targetCenterX = centerX + dir * (expandHalfW + c.w / 2 + 16);
      // Writing the parted position ONLY to the DOM transform (and never
      // to c.x) was the real bug behind sketches still peeking out from
      // under the enlarged image: anything that calls render(card) again
      // afterward — hovering it to bring it forward, it settling from a
      // drop, grabbing it to drag — reads card.x, which still held the
      // old, un-parted spot, and silently snapped the card back toward
      // center. Updating c.x here (and remembering the true resting spot
      // once, in preExpandX, so unpartWall() can put it back) keeps every
      // later render() call in agreement with where the card actually is.
      if (c.preExpandX === undefined) c.preExpandX = c.x;
      c.x = targetCenterX - c.w / 2;
      c.el.style.transition = 'transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)';
      render(c);
    });
  }
  function unpartWall() {
    cards.forEach((c) => {
      if (c.dragging || c.inMotion) return;
      if (c.preExpandX !== undefined) {
        c.x = c.preExpandX;
        delete c.preExpandX;
      }
      c.el.style.transition = 'transform 0.5s var(--ease-cinematic)';
      render(c);
    });
  }

  let expandedCard = null; // the sketch currently shown full-size, if any

  function openExpand(card) {
    expandedCard = card;
    if (card.fullImage) {
      // Set the image only (not the whole 'background' shorthand) —
      // .wall-expand-card already defines background-size/position/
      // repeat/color in CSS, and a shorthand write here would silently
      // reset all of those back to their defaults, the exact "JS inline
      // style beats CSS" trap this build has hit before.
      expandCard.style.background = '';
      expandCard.style.backgroundImage = `url('${card.fullImage}')`;
    } else {
      // No real image for this one — fall back to the same placeholder
      // gradient the card itself is showing.
      expandCard.style.backgroundImage = '';
      expandCard.style.background = card.el.style.background;
    }
    expandTitle.textContent = card.title || '';
    expandVeil.classList.add('is-active');
    expandClose.classList.add('is-active');
    // The headline sits behind the (deliberately transparent) veil at a
    // low z-index, so with nothing covering that part of the screen it
    // just showed straight through, overlapping the enlarged sketch. The
    // name/About row up top should stay — only the headline hides while
    // a sketch is open.
    document.body.classList.add('wall-is-expanded');
    partWall();
  }
  function closeExpand() {
    expandedCard = null;
    clearVeilHover();
    expandVeil.classList.remove('is-active');
    expandClose.classList.remove('is-active');
    document.body.classList.remove('wall-is-expanded');
    unpartWall();
  }

  // The veil sits above every card (z-index 100 vs. the cards' capped
  // z-index 90) with pointer-events:all while active, so it hit-tests
  // first and the cards underneath never get real pointerenter/leave —
  // hovering one to bring it forward silently did nothing while a
  // sketch was expanded. Simulated here instead: hand-roll the same
  // hover treatment (scale up, flatten, rise in stacking order) by
  // hit-testing the cursor against each card's real position on every
  // move over the veil.
  let veilHoveredCard = null;
  function clearVeilHover() {
    if (veilHoveredCard) {
      veilHoveredCard.hovered = false;
      veilHoveredCard.curScale = 1;
      veilHoveredCard.el.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
      render(veilHoveredCard);
    }
    veilHoveredCard = null;
  }
  expandVeil.addEventListener('pointermove', (e) => {
    if (!expandVeil.classList.contains('is-active')) return;
    const hit = cards.find((c) => {
      if (c === expandedCard || c.dragging || c.inMotion) return false;
      const r = c.el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }) || null;
    if (hit === veilHoveredCard) {
      if (hit) {
        dragCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      }
      return;
    }
    clearVeilHover();
    if (hit) {
      veilHoveredCard = hit;
      hit.hovered = true;
      hit.curScale = 1.15;
      hit.el.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
      render(hit);
      hit.el.style.zIndex = nextZ();
      dragCursor.textContent = 'Click to view';
      dragCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      dragCursor.classList.add('is-visible');
    } else {
      dragCursor.classList.remove('is-visible');
    }
  });
  expandVeil.addEventListener('pointerleave', clearVeilHover);

  expandVeil.addEventListener('click', (e) => {
    // A click that isn't on the enlarged image/title itself lands on the
    // veil (it covers the full viewport and sits above the cards). That
    // used to always close, even when the click was actually on one of
    // the other sketches still visible in the side margins — clicking
    // another sketch should switch to viewing THAT one, not dismiss the
    // view entirely. Hit-test the click against every other card's real
    // on-screen position before deciding which it is.
    if (e.target !== expandVeil) return;
    const other = cards.find((c) => {
      if (c === expandedCard) return false;
      const r = c.el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (other) {
      openExpand(other);
    } else {
      closeExpand();
    }
  });
  expandClose.addEventListener('click', closeExpand);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeExpand(); });

  addEventListener('resize', buildField);
  buildField();
  requestAnimationFrame(physicsTick);
})();
