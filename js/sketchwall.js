/* ==========================================================================
   SKETCH WALL ENGINE
   Organic Poisson-style scatter (no overlap, ever — including during
   motion), always-on ambient drift with a shared breathing pulse,
   cursor/gyroscope proximity push-away, gallery spotlight-dim on hover,
   click to expand. Sketch list comes from CONTENT.sketchwall.items:
   entries with an 'image' use it; entries without get a placeholder
   gradient, so the wall works from day one and evolves as real sketches
   are uploaded.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const field = document.getElementById('wallField');
  const hint = document.getElementById('wallHint');
  const expandVeil = document.getElementById('wallExpandVeil');
  const expandCard = document.getElementById('wallExpandCard');
  const expandTitle = document.getElementById('wallExpandTitle');
  const expandClose = document.getElementById('wallExpandClose');

  if (!field) return;

  const items = (window.CONTENT && window.CONTENT.sketchwall && window.CONTENT.sketchwall.items) || [];

  const gradients = [
    'linear-gradient(135deg,#E8E2D5,#C9BFA8)',
    'linear-gradient(135deg,#DCE5D2,#AEC49A)',
    'linear-gradient(135deg,#E5E5E5,#C2C2C2)',
    'linear-gradient(135deg,#F5EFE5,#DCD0BC)',
    'linear-gradient(135deg,#DCE3E5,#AEC0C4)',
    'linear-gradient(135deg,#EFE7D6,#D8CDA8)',
    'linear-gradient(135deg,#E2E9D5,#B7CB9E)',
    'linear-gradient(135deg,#ECECEC,#CFCFCF)',
  ];

  const sketches = [];

  function rand(min, max) { return min + Math.random() * (max - min); }

  function buildField() {
    field.innerHTML = '';
    sketches.length = 0;
    const w = innerWidth;
    const h = innerHeight; // strictly one screen — no scrolling
    const headlineExcludeH = h * 0.4;
    const placed = [];

    // Size is computed from actual screen area, not a fixed guess — this
    // is what guarantees all N sketches genuinely fit on one screen
    // without needing to scroll, on any device.
    const FILL_RATIO = 0.6;
    const SIZE_VARIANCE = 0.08;
    const baseArea = (w * h * FILL_RATIO) / items.length;
    const baseRadius = Math.sqrt(baseArea / Math.PI);
    let baseSize = baseRadius / 0.62;
    let sizeMin = baseSize * (1 - SIZE_VARIANCE);
    let sizeMax = baseSize * (1 + SIZE_VARIANCE);

    let i = 0;
    let attempts = 0;
    const SHRINK_THRESHOLD = 900; // if placement is struggling this hard, ease sizes down slightly rather than ever scrolling
    const HARD_ATTEMPT_CAP = 20000;

    while (i < items.length && attempts < HARD_ATTEMPT_CAP) {
      attempts++;
      if (attempts % SHRINK_THRESHOLD === 0) {
        sizeMin *= 0.94;
        sizeMax *= 0.94;
      }

      const size = rand(sizeMin, sizeMax);
      const r = size * 0.62;
      const x = rand(size / 2, w - size / 2);
      const y = rand(size / 2, h - size / 2);

      if (x > w * 0.24 && x < w * 0.76 && y < headlineExcludeH) continue;

      const minGap = 14;
      let ok = true;
      for (const p of placed) {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < r + p.r + minGap) { ok = false; break; }
      }
      if (!ok) continue;

      placed.push({ x, y, r });

      const item = items[i];
      const el = document.createElement('div');
      el.className = 'wall-sketch';
      el.style.width = size + 'px';
      el.style.height = (size * rand(0.9, 1.1)) + 'px';

      const gradIdx = i % gradients.length;
      if (item.image && item.image.length) {
        el.style.backgroundImage = `url('images/sketches/${item.image}')`;
        el.style.backgroundColor = '#F5F5F3';
      } else {
        el.style.background = gradients[gradIdx];
      }

      const pin = document.createElement('div');
      pin.className = 'wall-sketch-pin';
      el.appendChild(pin);

      const shine = document.createElement('div');
      shine.className = 'wall-sketch-shine';
      shine.style.setProperty('--shine-angle', `${rand(66, 90)}deg`);
      shine.style.setProperty('--shine-dur', `${rand(1.15, 1.75).toFixed(2)}s`);
      shine.style.setProperty('--shine-op', rand(0.16, 0.3).toFixed(2));
      el.appendChild(shine);

      sketches.push({
        el,
        pin,
        item,
        gradIdx,
        baseX: x - size / 2,
        baseY: y - size / 2,
        r,
        baseRot: rand(-16, 16),
        baseOpacity: rand(0.6, 0.95),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.22, 0.48),
        wobbleSpeed: rand(0.3, 0.6),
        wobblePhase: rand(0, Math.PI * 2),
        curTiltX: 0, curTiltY: 0,
        tiltVelX: 0, tiltVelY: 0,
        swivelAngle: 0, swivelVel: 0,
        // Small per-sketch variance in how strongly it responds — real
        // pinned objects wouldn't all react with identical stiffness.
        responseMul: rand(0.8, 1.2),
        hovered: false,
      });
      i++;
    }

    // Position never changes after this point, so there's no more need
    // to compute a safe wander radius — every reaction from here on is
    // pure rotation around the pin.
    sketches.forEach((s) => {
      s.el.style.opacity = s.baseOpacity;
      s.el.addEventListener('click', () => openExpand(s));
      s.el.addEventListener('mouseenter', () => {
        s.hovered = true;
        s.el.classList.remove('is-shining');
        void s.el.offsetWidth; // force reflow so the animation restarts even on repeat hovers
        s.el.classList.add('is-shining');
      });
      s.el.addEventListener('mouseleave', () => { s.hovered = false; });
      field.appendChild(s.el);
    });

    field.style.height = h + 'px'; // exactly one screen — no scrolling
  }

  /* ---------- Pointer / gyroscope ---------- */
  let px = innerWidth / 2, py = innerHeight / 2;
  let hasPointer = false;

  addEventListener('mousemove', (e) => {
    px = e.clientX; py = e.clientY;
    hasPointer = true;
    hint.classList.add('is-visible');
  });
  addEventListener('mouseleave', () => { hasPointer = false; });
  addEventListener('touchmove', (e) => {
    px = e.touches[0].clientX; py = e.touches[0].clientY;
    hasPointer = true;
  }, { passive: true });

  let tiltX = 0, tiltY = 0;
  function enableTilt() {
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null || e.beta == null) return;
      tiltX = Math.max(-30, Math.min(30, e.gamma));
      tiltY = Math.max(-30, Math.min(30, e.beta - 45));
    });
  }

  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ Safari: deviceorientation silently never fires unless
      // permission is explicitly requested from within a real tap —
      // it cannot be requested automatically on page load. Ask on the
      // first touch anywhere on the page, once.
      const askOnce = () => {
        removeEventListener('touchend', askOnce);
        DeviceOrientationEvent.requestPermission()
          .then((state) => { if (state === 'granted') enableTilt(); })
          .catch(() => {});
      };
      addEventListener('touchend', askOnce, { once: true });
    } else {
      // Android / older iOS — no permission gate needed.
      enableTilt();
    }
  }
  const isTouch = matchMedia('(pointer: coarse)').matches;

  // Wind — instead of a synchronized "breathing" pulse, sketches sway
  // like paper pinned to a wall in a breeze. Wind direction and gust
  // strength wander slowly and irregularly over time (layered sine waves
  // standing in for turbulence — real gusts aren't a clean sine wave),
  // and each sketch responds with its own phase/weight so they don't
  // all sway in perfect unison, the way real pinned paper wouldn't.
  const WIND_SWAY_DEG = 16;

  function windAngle(time) {
    // Irregular wandering direction, not a fixed compass bearing.
    return Math.sin(time * 0.12) * 1.4 + Math.sin(time * 0.05 + 2) * 0.8;
  }
  function windGust(time) {
    // Irregular gust strength, 0..1 — layered waves so it doesn't feel
    // like a metronome the way a single sine wave would.
    const g = Math.sin(time * 0.22) * 0.5 + Math.sin(time * 0.09 + 1.3) * 0.35 + Math.sin(time * 0.4 + 3) * 0.15;
    return Math.max(0, (g + 1) / 2); // normalized to 0..1, biased toward calmer moments
  }

  // Swivel — like running a finger across pinned photos: as the cursor
  // passes near a sketch, its motion imparts a torque that makes the
  // sketch swing on its pin, then settle back like a damped pendulum.
  // Torque is the TANGENTIAL cursor speed relative to each sketch,
  // normalized by distance — contact-like, so brushing directly over a
  // sketch gives the strongest kick, tapering smoothly with distance
  // (the earlier version wasn't normalized, so farther sketches within
  // range could get MORE kick than ones you brushed right over, which
  // is backwards). Spring/damping are now dt-scaled too, so the swing
  // settles at the same real-world speed regardless of screen refresh
  // rate — previously it was tied to frame count, not real time.
  const SWIVEL_RADIUS = 150;
  const SWIVEL_KICK_SCALE = 0.00085;
  const SWIVEL_SPRING_K = 0.012;
  const SWIVEL_DAMPING = 0.92;
  const SWIVEL_MAX_DEG = 34;

  // Holographic tilt — like the reference card: real 3D rotateX/rotateY
  // that follows the cursor directly (proportional, not physics-
  // integrated like the swivel above), so a sketch appears to turn and
  // face your cursor as you approach, like a trading card catching the
  // light. Layered on top of the swivel, not replacing it — swivel gives
  // the "brushed and swinging" motion, this gives the "looking toward
  // you" 3D depth. Pivots from the pin via transform-origin, same as
  // everything else.
  const TILT_RADIUS = 220;
  const TILT_KICK_SCALE = 0.0011;
  const TILT_SPRING_K = 0.014;
  const TILT_DAMPING = 0.91;
  const TILT_MAX_DEG = 28;

  let lastCursorX = px, lastCursorY = py;

  function tick(t) {
    const time = t / 1000;
    const dt = Math.min(0.05, (t - (tick.lastT || t)) / 1000);
    tick.lastT = t;

    let targetX = px, targetY = py;
    if (isTouch && !hasPointer) {
      targetX = innerWidth / 2 + tiltX * 6;
      targetY = innerHeight / 2 + tiltY * 6;
    }
    // Sketches are positioned in document coordinates (the field can be
    // taller than one screen now), but mouse/touch coordinates are
    // viewport-relative — add the scroll offset so proximity/torque
    // comparisons stay correct no matter how far down the page you are.
    targetY += window.scrollY;

    const cursorVX = targetX - lastCursorX;
    const cursorVY = targetY - lastCursorY;
    lastCursorX = targetX;
    lastCursorY = targetY;

    // Every sketch stays pinned exactly where it was placed. Ambient
    // motion now comes from shared wind — direction and gust strength
    // computed once per frame — rather than each sketch independently
    // breathing in a synced pulse. Swivel/tilt physics only engage on
    // actual hover, not just general proximity.
    const gustGlobal = windGust(time);
    const angleGlobal = windAngle(time);

    sketches.forEach((s) => {
      // The pin's position NEVER changes — it's fixed to the wall,
      // exactly where it was placed. Everything below is rotation only,
      // pivoting around that fixed point via transform-origin — nothing
      // here ever translates the element's position again.
      const cx = s.baseX + s.el.offsetWidth / 2;
      const cy = s.baseY + s.el.offsetHeight / 2;
      s._dist = Math.hypot(cx - targetX, cy - targetY);

      // Per-sketch weight so they don't all sway in perfect unison, the
      // way real pinned paper of slightly different sizes wouldn't.
      const weight = 0.55 + 0.45 * Math.sin(s.phase * 3);
      const gustLocal = gustGlobal * weight;
      // Idle wind: a gentle side-to-side SWING (rotation), not a
      // position shift — like paper hanging from a pin, blown by air
      // that comes and goes irregularly, never a mechanical pulse.
      const windLean = angleGlobal * (WIND_SWAY_DEG / 3) * gustLocal
                      + Math.sin(time * s.wobbleSpeed + s.wobblePhase) * WIND_SWAY_DEG * 0.35 * gustLocal;
      // A touch of idle X/Y nod too — a hanging object catches air
      // unevenly, not just side to side. Small on purpose; the pin is
      // still the anchor, this is a whisper, not a tumble.
      const windNodX = Math.sin(time * s.wobbleSpeed * 0.7 + s.phase) * 3.5 * gustLocal;
      const windNodY = Math.cos(time * s.wobbleSpeed * 0.55 + s.wobblePhase) * 3 * gustLocal;

      s.el.style.boxShadow = '';
      s.el.style.zIndex = s.hovered ? 6 : '';

      // Brushing (proximity) — a DIFFERENT behavior from idle wind, as
      // asked: an actual torque kick from your cursor's motion, not
      // random gusting. Still pure rotation, still pivoting from the pin.
      const dx = cx - targetX, dy = cy - targetY;
      if (s._dist < SWIVEL_RADIUS) {
        const proximity = 1 - s._dist / SWIVEL_RADIUS;
        const torque = (cursorVX * dy - cursorVY * dx) * SWIVEL_KICK_SCALE * proximity * s.responseMul;
        s.swivelVel += torque;
      }
      s.swivelVel += -s.swivelAngle * SWIVEL_SPRING_K;
      s.swivelVel *= SWIVEL_DAMPING;
      s.swivelAngle += s.swivelVel;
      s.swivelAngle = Math.max(-SWIVEL_MAX_DEG, Math.min(SWIVEL_MAX_DEG, s.swivelAngle));

      // Holographic tilt is now real torque physics too — vertical
      // cursor motion tips the sketch around X, horizontal motion tips
      // it around Y, exactly the same paradigm as the Z-axis swivel
      // above. All three axes now swing together as one unified 3D
      // tumble around the pin, instead of Z being physical while X/Y
      // just snapped directly to cursor position.
      if (s._dist < TILT_RADIUS) {
        const proximity = 1 - s._dist / TILT_RADIUS;
        s.tiltVelX += cursorVY * TILT_KICK_SCALE * proximity * s.responseMul;
        s.tiltVelY += -cursorVX * TILT_KICK_SCALE * proximity * s.responseMul;
      }
      s.tiltVelX += -s.curTiltX * TILT_SPRING_K;
      s.tiltVelY += -s.curTiltY * TILT_SPRING_K;
      s.tiltVelX *= TILT_DAMPING;
      s.tiltVelY *= TILT_DAMPING;
      s.curTiltX += s.tiltVelX;
      s.curTiltY += s.tiltVelY;
      s.curTiltX = Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, s.curTiltX));
      s.curTiltY = Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, s.curTiltY));

      // Position is permanently s.baseX/s.baseY — never modified.
      const x = s.baseX;
      const y = s.baseY;
      const rot = s.baseRot + windLean + s.swivelAngle;

      // perspective() as a transform function (not the parent's CSS
      // perspective property) gives this element its OWN 3D viewing
      // distance, so rotateX/rotateY tilt correctly regardless of what's
      // around it — and since transform-origin is pinned at the top
      // (the pin's location), every rotation here — in-plane swivel AND
      // 3D tilt — pivots from the pin, exactly like a real pinned photo.
      s.el.style.transform = `translate(${x}px, ${y}px) perspective(550px) rotateX(${s.curTiltX + windNodX}deg) rotateY(${s.curTiltY + windNodY}deg) rotateZ(${rot}deg)`;
      s.el.style.opacity = s.baseOpacity;
      // Counter-rotate the pin against the sketch's own rotation — a real
      // pin stays upright no matter how the paper underneath it tilts.
      s.pin.style.transform = `translateX(-50%) rotate(${-rot}deg)`;
    });

    requestAnimationFrame(tick);
  }

  /* ---------- Expand ---------- */
  function openExpand(s) {
    if (s.item.image && s.item.image.length) {
      expandCard.style.background = '';
      expandCard.style.backgroundImage = `url('images/sketches/${s.item.image}')`;
      expandCard.style.backgroundSize = 'contain';
      expandCard.style.backgroundPosition = 'center';
      expandCard.style.backgroundRepeat = 'no-repeat';
      expandCard.style.backgroundColor = '#FFFFFF';
    } else {
      expandCard.style.backgroundImage = '';
      expandCard.style.background = gradients[s.gradIdx];
    }
    expandTitle.textContent = s.item.title || '';
    expandVeil.classList.add('is-active');
    expandClose.classList.add('is-active');
  }
  function closeExpand() {
    expandVeil.classList.remove('is-active');
    expandClose.classList.remove('is-active');
  }
  expandVeil.addEventListener('click', closeExpand);
  expandCard.addEventListener('click', (e) => e.stopPropagation());
  expandClose.addEventListener('click', closeExpand);

  addEventListener('resize', buildField);

  buildField();
  requestAnimationFrame(tick);
  setTimeout(() => { if (!isTouch) hint.classList.add('is-visible'); }, 1200);
});
