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
    const w = innerWidth, h = innerHeight;
    const placed = [];

    let attempts = 0;
    const MAX_ATTEMPTS = 5000;
    let i = 0;

    while (i < items.length && attempts < MAX_ATTEMPTS) {
      attempts++;
      const size = rand(46, 116);
      const r = size * 0.62;
      const x = rand(size / 2, w - size / 2);
      const y = rand(size / 2, h - size / 2);

      if (x > w * 0.24 && x < w * 0.76 && y < h * 0.44) continue;

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

      sketches.push({
        el,
        item,
        gradIdx,
        baseX: x - size / 2,
        baseY: y - size / 2,
        r,
        baseRot: rand(-16, 16),
        baseOpacity: rand(0.6, 0.95),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.22, 0.48),
        ampX: rand(8, 18),
        ampY: rand(8, 18),
        wobbleSpeed: rand(0.3, 0.6),
        wobblePhase: rand(0, Math.PI * 2),
        curScale: 1, curPushX: 0, curPushY: 0, curRot: 0, curDim: 1,
        hovered: false,
      });
      i++;
    }

    // Safe wander radius from each sketch's REAL nearest-neighbour gap.
    sketches.forEach((s, idx) => {
      let nearest = Infinity;
      placed.forEach((p, j) => {
        if (idx === j) return;
        const d = Math.hypot(placed[idx].x - p.x, placed[idx].y - p.y) - s.r - p.r;
        if (d < nearest) nearest = d;
      });
      s.maxMove = Math.max(4, Math.min(26, (isFinite(nearest) ? nearest : 26) * 0.4));
      s.el.style.opacity = s.baseOpacity;
      s.el.addEventListener('click', () => openExpand(s));
      s.el.addEventListener('mouseenter', () => { s.hovered = true; });
      s.el.addEventListener('mouseleave', () => { s.hovered = false; });
      field.appendChild(s.el);
    });
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
  if (window.DeviceOrientationEvent) {
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null || e.beta == null) return;
      tiltX = Math.max(-30, Math.min(30, e.gamma));
      tiltY = Math.max(-30, Math.min(30, e.beta - 45));
    });
  }
  const isTouch = matchMedia('(pointer: coarse)').matches;

  const PROX_RADIUS = 220;
  const BREATH_PERIOD = 4.6;
  const BREATH_SCALE_AMP = 0.035;
  const BREATH_OPACITY_AMP = 0.07;

  function tick(t) {
    const time = t / 1000;
    const dt = Math.min(0.05, (t - (tick.lastT || t)) / 1000);
    tick.lastT = t;

    let targetX = px, targetY = py;
    if (isTouch && !hasPointer) {
      targetX = innerWidth / 2 + tiltX * 6;
      targetY = innerHeight / 2 + tiltY * 6;
    }

    const anyHovered = sketches.some((s) => s.hovered);

    sketches.forEach((s) => {
      const driftX = Math.sin(time * s.speed + s.phase) * s.ampX;
      const driftY = Math.cos(time * s.speed * 0.83 + s.phase) * s.ampY;
      const wobble = Math.sin(time * s.wobbleSpeed + s.wobblePhase) * 6;

      const cx = s.baseX + s.el.offsetWidth / 2;
      const cy = s.baseY + s.el.offsetHeight / 2;
      const dx = cx - targetX;
      const dy = cy - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let targetPushX = 0, targetPushY = 0, targetScale = 1, targetRot = 0, opacityBoost = 0;

      if (dist < PROX_RADIUS) {
        const f = 1 - dist / PROX_RADIUS;
        const eased = f * f;
        const angle = Math.atan2(dy, dx);
        const pushDist = eased * 34;
        targetPushX = Math.cos(angle) * pushDist;
        targetPushY = Math.sin(angle) * pushDist;
        targetScale = 1 + eased * 0.24;
        targetRot = eased * (dx > 0 ? 14 : -14);
        opacityBoost = eased * (1 - s.baseOpacity) * 0.9;
      }

      if (s.hovered) {
        targetScale = Math.max(targetScale, 1.42);
        opacityBoost = Math.max(opacityBoost, (1 - s.baseOpacity));
        s.el.style.boxShadow = '0 22px 48px -10px rgba(17,17,17,0.34)';
        s.el.style.zIndex = 5;
      } else {
        s.el.style.boxShadow = '';
        s.el.style.zIndex = '';
      }

      const targetDim = anyHovered ? (s.hovered ? 1.1 : 0.22) : 1;
      s.curDim += (targetDim - s.curDim) * Math.min(1, dt * 6);

      s.curPushX += (targetPushX - s.curPushX) * Math.min(1, dt * 9);
      s.curPushY += (targetPushY - s.curPushY) * Math.min(1, dt * 9);
      s.curScale += (targetScale - s.curScale) * Math.min(1, dt * 7);
      s.curRot += (targetRot - s.curRot) * Math.min(1, dt * 8);

      const rawX = driftX + s.curPushX;
      const rawY = driftY + s.curPushY;
      const offX = Math.max(-s.maxMove, Math.min(s.maxMove, rawX));
      const offY = Math.max(-s.maxMove, Math.min(s.maxMove, rawY));

      const x = s.baseX + offX;
      const y = s.baseY + offY;
      const rot = s.baseRot + wobble + s.curRot;

      const breath = Math.sin((time / BREATH_PERIOD) * Math.PI * 2);
      const finalScale = s.curScale * (1 + breath * BREATH_SCALE_AMP);
      const finalOpacity = Math.min(1, s.baseOpacity + opacityBoost) * (1 + breath * BREATH_OPACITY_AMP) * s.curDim;

      s.el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${finalScale})`;
      s.el.style.opacity = Math.max(0, Math.min(1, finalOpacity));
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
