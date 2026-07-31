(() => {
  const field = document.getElementById('wallField');
  const dragCursor = document.getElementById('dragCursor');

  const tones = [
    'linear-gradient(135deg,#E8E2D5,#C9BFA8)', 'linear-gradient(135deg,#DCE5D2,#AEC49A)',
    'linear-gradient(135deg,#E5E5E5,#C2C2C2)', 'linear-gradient(135deg,#F5EFE5,#DCD0BC)',
    'linear-gradient(135deg,#DCE3E5,#AEC0C4)', 'linear-gradient(135deg,#EFE7D6,#D8CDA8)',
  ];

  const N = 20;
  const cards = [];
  function rand(a, b) { return a + Math.random() * (b - a); }

  const FRICTION = 0.965;
  const RESTITUTION = 0.62;
  const GRAVITY = 0.38; // constant downward pull — this alone produces a real rise-apex-fall arc, no scripting needed
  const STOP_THRESHOLD = 4;

  let topZ = 10;

  function computeLayout(sizes) {
    const w = innerWidth, h = innerHeight;
    const headlineExcludeH = h * 0.3; // only the headline's own vertical band
    const placed = [];
    const result = [];
    const minGap = -55; // negative = cards can genuinely overlap, creating a real layered stack

    function tryPoint(size) {
      const x = rand(size / 2 + 20, Math.max(size / 2 + 21, w - size / 2 - 20));
      const y = rand(size / 2 + 8, Math.max(size / 2 + 9, h - size / 2 - 60));
      return { x, y };
    }
    function isBehindHeadline(x, y, size) {
      // Only the small central-top region behind the headline text —
      // NOT the entire top band. That's what was compressing everything
      // into the lower portion of the page.
      return x > w * 0.28 && x < w * 0.72 && y < headlineExcludeH + size * 0.3;
    }

    sizes.forEach((originalSize) => {
      let size = originalSize;
      let attempts = 0;
      let done = false;
      while (!done) {
        attempts++;
        const r = size * 0.62;
        const { x, y } = tryPoint(size);
        if (isBehindHeadline(x, y, size)) continue;
        let ok = true;
        for (const p of placed) {
          if (Math.hypot(x - p.x, y - p.y) < r + p.r + minGap) { ok = false; break; }
        }
        if (ok) {
          placed.push({ x, y, r });
          result.push({ x: x - size / 2, y: y - size / 2, rot: rand(-24, 24), size });
          done = true;
        } else if (attempts > 400) {
          // Struggling to fit at this size — shrink THIS item slightly
          // and keep trying, rather than silently dropping it. Every
          // sketch is guaranteed to actually appear.
          size *= 0.96;
          attempts = 0;
          if (size < 40) {
            // absolute floor — place it even if it means a touch of
            // overlap, rather than never rendering it at all
            const { x: x2, y: y2 } = tryPoint(size);
            const r2 = size * 0.62;
            placed.push({ x: x2, y: y2, r: r2 });
            result.push({ x: x2 - size / 2, y: y2 - size / 2, rot: rand(-24, 24), size });
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
    const FILL_RATIO = 0.4;
    const baseArea = (innerWidth * innerHeight * FILL_RATIO) / N;
    const baseRadius = Math.sqrt(baseArea / Math.PI);
    const baseSize = Math.max(130, Math.min(210, baseRadius / 0.62));
    const sizes = Array.from({ length: N }, () => baseSize * rand(0.85, 1.15));
    const positions = computeLayout(sizes);
    const order = positions.map((_, i) => i).sort(() => Math.random() - 0.5);

    positions.forEach((pos, i) => {
      const size = pos.size;
      const el = document.createElement('div');
      el.className = 'scatter-card';
      el.style.width = size + 'px';
      el.style.height = (size * rand(0.92, 1.08)) + 'px';
      const item = ((window.CONTENT && CONTENT.sketchwall && CONTENT.sketchwall.items) || [])[i];
      el.style.background = (item && item.image) ? `url('${item.image}') center/cover` : tones[i % tones.length];
      el.style.zIndex = topZ++;

      const shine = document.createElement('div');
      shine.className = 'scatter-shine';
      el.appendChild(shine);
      field.appendChild(el);

      const title = (item && item.title) || `Sketch ${String(i + 1).padStart(2, '0')}`;
      const card = {
        el, shine, size, title,
        x: pos.x, y: pos.y, baseRot: pos.rot,
        w: size, h: size,
        vx: 0, vy: 0,
        hovered: false, dragging: false, inMotion: false, exploding: false, gliding: false,
      };
      cards.push(card);
      wireCard(card);

      const delay = order.indexOf(i) * 45 + rand(0, 80);
      el.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rot}deg) scale(0.3)`;
      setTimeout(() => {
        el.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rot}deg) scale(1)`;
        setTimeout(() => { el.style.transition = ''; }, 600);
      }, delay);
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
    card.el.style.transform = `translate(${card.x}px, ${card.y}px) rotate(${rot}deg) scale(${scale})`;
  }

  function wireCard(card) {
    const { el, shine } = card;
    let dragOffsetX = 0, dragOffsetY = 0;
    let lastMoveX = 0, lastMoveY = 0, lastMoveT = 0;
    let downX = 0, downY = 0;

    el.addEventListener('pointerenter', () => {
      if (card.dragging) return;
      card.hovered = true;
      card.el.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
      render(card);
      card.el.style.zIndex = ++topZ;
    });
    el.addEventListener('pointerleave', () => {
      if (card.dragging) return;
      card.hovered = false;
      card.el.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
      render(card);
      dragCursor.classList.remove('is-visible');
    });
    el.addEventListener('pointermove', (e) => {
      dragCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      if (!card.dragging) dragCursor.classList.add('is-visible');

      if (card.dragging || !card.hovered) return;
      const rect = el.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / rect.width;
      const localY = (e.clientY - rect.top) / rect.height;
      shine.style.background =
        `radial-gradient(circle at ${(localX*100).toFixed(0)}% ${(localY*100).toFixed(0)}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)`;
    });

    el.addEventListener('pointerdown', (e) => {
      card.dragging = true;
      card.vx = 0; card.vy = 0; card.inMotion = false;
      el.classList.add('is-dragging');
      el.style.zIndex = ++topZ;
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
        card.el.style.transition = 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.curScale = 1.06;
        render(card);
      });
    });
    el.addEventListener('pointermove', (e) => {
      if (!card.dragging) return;
      card.x = e.clientX - dragOffsetX;
      card.y = e.clientY - dragOffsetY;
      render(card);

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveT);
      card.vx = ((e.clientX - lastMoveX) / dt) * 16;
      card.vy = ((e.clientY - lastMoveY) / dt) * 16;
      lastMoveX = e.clientX; lastMoveY = e.clientY; lastMoveT = now;
    });
    function endDrag(e) {
      if (!card.dragging) return;
      card.dragging = false;
      el.classList.remove('is-dragging');

      const throwSpeed = Math.hypot(card.vx, card.vy);
      const THROW_THRESHOLD = 3; // a real deliberate flick, not an accidental nudge
      const moveDist = e ? Math.hypot(e.clientX - downX, e.clientY - downY) : 999;

      if (moveDist < 6) {
        // Barely moved at all — this was a click, not a drag. Open the
        // real expand view instead of settling in place.
        card.el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
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
        const throwAngle = Math.atan2(card.vy, card.vx) * (180 / Math.PI);
        card.flightRot = throwAngle + rand(-8, 8);
      } else {
        // Just a drop, not a throw — safe to use a real CSS transition
        // here since nothing else is touching its transform right now.
        // Elastic overshoot settle, not a flat instant snap.
        card.el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.curScale = 1;
        render(card);
      }
    }
    el.addEventListener('pointerup', (e) => endDrag(e));
    el.addEventListener('pointercancel', () => endDrag(null));
  }

  let isExploding = false;

  function physicsTick() {
    const w = innerWidth, h = innerHeight;
    const now = performance.now();
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
        card.el.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.curScale = 1.08;
        render(card);
        setTimeout(() => {
          card.curScale = 1;
          render(card);
        }, 20);
      }
    });

    // Rebuild the instant every sketch has actually cleared the screen —
    // not after a fixed guessed delay. Only checked once every sketch
    // has actually launched, so it can't fire early while some are
    // still waiting in the stagger queue.
    if (isExploding && launchedCount === totalToLaunch && totalToLaunch > 0) {
      const stillFlying = cards.some((c) => c.exploding && c.y < h + 120);
      if (!stillFlying) {
        buildField();
        isExploding = false;
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
    isExploding = true;
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
        const launchDelay = rand(0, 900);
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
          const speed = rand(16, 34);
          card.vx = Math.cos(angle) * speed;
          card.vy = Math.sin(angle) * speed;
          card.curveRate = rand(3, 12) * (Math.random() < 0.5 ? 1 : -1);
          card.curveDecay = rand(0.965, 0.992); // some straighten out fast, others keep curving much longer
          card.gravityMul = rand(0.6, 1.6); // heavier or lighter than average — wider spread means flight durations genuinely differ
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

  function openExpand(card) {
    expandCard.style.background = card.el.style.background;
    expandTitle.textContent = card.title || '';
    expandVeil.classList.add('is-active');
    expandClose.classList.add('is-active');
  }
  function closeExpand() {
    expandVeil.classList.remove('is-active');
    expandClose.classList.remove('is-active');
  }
  expandVeil.addEventListener('click', (e) => { if (e.target === expandVeil) closeExpand(); });
  expandClose.addEventListener('click', closeExpand);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeExpand(); });

  addEventListener('resize', buildField);
  buildField();
  requestAnimationFrame(physicsTick);
})();
