/* ==========================================================================
   C1 STUDIO GALLERY — a scattered, overlapping collage of studio
   renders, each shown at its own native aspect ratio (no cropping),
   reacting to the cursor in two layers:

   1. Magnetic field (whole canvas): every photo continuously senses
      cursor proximity and leans/drifts a few px away from it, like a
      pile of real prints being nudged aside as a hand passes over
      them. This runs for all photos at once, not just the one under
      the pointer, so the collage feels alive even before you land on
      anything.
   2. Landing (per photo): hovering one photo pulls it forward, lifts,
      grows, and tilts in true 3D toward the exact cursor position —
      direct, 1:1, per-frame response — while every other photo eases
      back and dims.

   Purely a hover-reactive display piece — no click-to-expand, no
   copy, just the images reacting to the cursor.

   Both reactions are hand-rolled rather than pulled from a
   spring/animation library: this site has no build step, so vanilla
   requestAnimationFrame loops with a critically-damped exponential
   filter get the same "track the cursor, never overshoot" feel
   Apple's fluid-interface guidance calls for, without a new
   dependency.
   ========================================================================== */

(() => {
  const grid = document.getElementById('c1Mosaic');
  if (!grid) return;

  // Literal, fully-quoted paths (not built from a template string) so
  // the preview-build tooling — which pattern-matches exact quoted
  // image paths to swap in base64 data URIs — can find and inline
  // every one of these.
  const HERO_IMAGES = [
    'images/c1/hero/hero-01.jpg',
    'images/c1/hero/hero-02.jpg',
    'images/c1/hero/hero-03.jpg',
    'images/c1/hero/hero-04.jpg',
    'images/c1/hero/hero-05.jpg',
    'images/c1/hero/hero-06.jpg',
    'images/c1/hero/hero-07.jpg',
    'images/c1/hero/hero-08.jpg',
  ];

  // Curated, deliberately-overlapping collage layout — two loose rows
  // with each photo's box tuned to its real aspect ratio (so nothing
  // needs cropping) and nudged so neighbors overlap by design rather
  // than leaving dead gaps between them.
  const LAYOUT = [
    { img: 3, top: '2%',  left: '1%',  w: '26%', rot: -4, z: 2 },
    { img: 7, top: '10%', left: '24%', w: '22%', rot: 4,  z: 3 },
    { img: 5, top: '0%',  left: '48%', w: '17%', rot: -3, z: 4 },
    { img: 8, top: '6%',  left: '70%', w: '26%', rot: 5,  z: 2 },
    { img: 1, top: '48%', left: '3%',  w: '27%', rot: 3,  z: 1 },
    { img: 2, top: '55%', left: '28%', w: '30%', rot: -5, z: 2 },
    { img: 4, top: '46%', left: '60%', w: '21%', rot: 4,  z: 1 },
    { img: 6, top: '58%', left: '79%', w: '23%', rot: -2, z: 3 },
  ];

  const supportsHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_TILT = 9; // degrees — restrained, not a gimmick
  const items = [];

  LAYOUT.forEach((spot, i) => {
    const src = HERO_IMAGES[spot.img - 1];

    const item = document.createElement('div');
    item.className = 'c1-mosaic-item';
    item.tabIndex = 0;
    item.setAttribute('role', 'img');
    item.setAttribute('aria-label', 'Surface C1 studio render');
    item.style.setProperty('--top', spot.top);
    item.style.setProperty('--left', spot.left);
    item.style.setProperty('--w', spot.w);
    item.style.zIndex = String(spot.z);

    const field = document.createElement('div');
    field.className = 'c1-mosaic-field';

    const frame = document.createElement('div');
    frame.className = 'c1-mosaic-frame';

    const tilt = document.createElement('div');
    tilt.className = 'c1-mosaic-tilt';

    const glow = document.createElement('div');
    glow.className = 'c1-mosaic-glow';

    const inner = document.createElement('div');
    inner.className = 'c1-mosaic-inner';
    inner.style.setProperty('--rot', spot.rot + 'deg');
    // Stagger each photo's idle drift so they don't all breathe in
    // sync — a fixed, deterministic spread rather than Math.random(),
    // so the layout is stable across reloads.
    inner.style.setProperty('--dur', (5.2 + (i % 4) * 0.7).toFixed(1) + 's');
    inner.style.setProperty('--delay', (-(i % 5) * 0.6).toFixed(1) + 's');

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Surface C1 studio render';
    img.loading = 'lazy';
    inner.appendChild(img);

    tilt.appendChild(glow);
    tilt.appendChild(inner);
    frame.appendChild(tilt);
    field.appendChild(frame);
    item.appendChild(field);
    grid.appendChild(item);
    items.push({ el: item, field, tilt, glow, src });

    // Tap (or click, or keyboard) opens the same fullscreen expand
    // modal the scatter-field hero already has — real payoff for the
    // interaction, and no new modal/pattern to build or maintain.
    const expandVeil = document.getElementById('c1ExpandVeil');
    const expandCard = document.getElementById('c1ExpandCard');
    const expandClose = document.getElementById('c1ExpandClose');
    function openExpanded() {
      if (!expandVeil || !expandCard) return;
      expandCard.style.backgroundImage = `url('${src}')`;
      expandCard.style.backgroundSize = 'cover';
      expandCard.style.backgroundPosition = 'center';
      expandVeil.classList.add('is-active');
      if (expandClose) expandClose.classList.add('is-active');
    }
    item.addEventListener('click', openExpanded);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openExpanded();
      }
    });
  });

  // The reactive part: hovering (or, on touch, dragging a finger over)
  // one photo pulls it forward, grows it, and tilts it toward the
  // pointer; everything else eases back and dims. Real touch support
  // added below via synthetic mouse events, reusing this exact same
  // math rather than a separate, duplicated code path.
  {
    items.forEach(({ el: active, tilt, glow }) => {
      let raf = null;
      let curRX = 0, curRY = 0, targetRX = 0, targetRY = 0;

      function settle() {
        // Exponential smoothing toward the target — a critically
        // damped filter, same "no overshoot" feel as the rest of the
        // site's motion, just driven per-frame instead of by a CSS
        // transition, so it can track the pointer without lag.
        curRX += (targetRX - curRX) * 0.22;
        curRY += (targetRY - curRY) * 0.22;
        tilt.style.transform = `rotateX(${curRX.toFixed(2)}deg) rotateY(${curRY.toFixed(2)}deg)`;

        const settled = Math.abs(targetRX - curRX) < 0.02 && Math.abs(targetRY - curRY) < 0.02;
        if (settled && targetRX === 0 && targetRY === 0) {
          tilt.style.transform = 'rotateX(0deg) rotateY(0deg)';
          raf = null;
          return;
        }
        raf = requestAnimationFrame(settle);
      }

      function ensureLoop() {
        if (!reduceMotion && raf === null) raf = requestAnimationFrame(settle);
      }

      active.addEventListener('mouseenter', () => {
        items.forEach(({ el: other }) => {
          if (other === active) {
            other.classList.add('is-active');
            other.classList.remove('is-dim');
          } else {
            other.classList.add('is-dim');
            other.classList.remove('is-active');
          }
        });
      });

      active.addEventListener('mousemove', (e) => {
        if (reduceMotion) return;
        const rect = active.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5..0.5
        const ny = (e.clientY - rect.top) / rect.height - 0.5;   // -0.5..0.5
        targetRY = nx * MAX_TILT * 2;
        targetRX = -ny * MAX_TILT * 2;
        glow.style.setProperty('--mx', `${(nx + 0.5) * 100}%`);
        glow.style.setProperty('--my', `${(ny + 0.5) * 100}%`);
        ensureLoop();
      });

      active.addEventListener('mouseleave', () => {
        items.forEach(({ el: other }) => {
          other.classList.remove('is-active');
          other.classList.remove('is-dim');
        });
        targetRX = 0;
        targetRY = 0;
        ensureLoop();
      });

      active.addEventListener('focus', () => {
        active.dispatchEvent(new Event('mouseenter'));
      });
      active.addEventListener('blur', () => {
        active.dispatchEvent(new Event('mouseleave'));
      });
    });
  }

  // The magnetic field: a single shared loop (not one per photo) reads
  // the cursor's last-known position relative to the whole canvas and
  // pushes every photo a few px away from it, proportional to how
  // close it is — the "pile of prints nudged by a passing hand" feel.
  // The photo currently popped forward (is-active) sits this one out,
  // since it already has its own dedicated tilt-toward-cursor above.
  if (!reduceMotion) {
    const FIELD_RADIUS = 260;   // px — how far the field reaches
    const MAX_PUSH = 16;        // px — how far a photo can be nudged
    const MAX_LEAN = 5;         // deg — extra rotation added while pushed

    const fieldState = items.map(() => ({ curX: 0, curY: 0, curRot: 0 }));
    let cursor = null;      // {x, y} relative to the grid, or null when not over it
    let fieldRaf = null;

    function fieldTick() {
      const gridRect = grid.getBoundingClientRect();

      items.forEach((it, i) => {
        const st = fieldState[i];
        let targetX = 0, targetY = 0, targetRot = 0;

        if (cursor && !it.el.classList.contains('is-active')) {
          const r = it.el.getBoundingClientRect();
          const cx = r.left + r.width / 2 - gridRect.left;
          const cy = r.top + r.height / 2 - gridRect.top;
          const dx = cx - cursor.x;
          const dy = cy - cursor.y;
          const dist = Math.hypot(dx, dy);
          if (dist < FIELD_RADIUS) {
            const factor = Math.pow(1 - dist / FIELD_RADIUS, 1.5); // eased falloff
            const nx = dist > 0.001 ? dx / dist : 0;
            const ny = dist > 0.001 ? dy / dist : 0;
            targetX = nx * factor * MAX_PUSH;
            targetY = ny * factor * MAX_PUSH;
            targetRot = nx * factor * MAX_LEAN;
          }
        }

        st.curX += (targetX - st.curX) * 0.16;
        st.curY += (targetY - st.curY) * 0.16;
        st.curRot += (targetRot - st.curRot) * 0.16;

        if (Math.abs(st.curX) < 0.05 && Math.abs(st.curY) < 0.05 && Math.abs(st.curRot) < 0.05 && targetX === 0 && targetY === 0 && targetRot === 0) {
          it.field.style.transform = '';
        } else {
          it.field.style.transform = `translate(${st.curX.toFixed(2)}px, ${st.curY.toFixed(2)}px) rotate(${st.curRot.toFixed(2)}deg)`;
        }
      });

      const stillMoving = fieldState.some((st) => Math.abs(st.curX) > 0.05 || Math.abs(st.curY) > 0.05 || Math.abs(st.curRot) > 0.05);
      if (cursor || stillMoving) {
        fieldRaf = requestAnimationFrame(fieldTick);
      } else {
        fieldRaf = null;
      }
    }

    function ensureFieldLoop() {
      if (fieldRaf === null) fieldRaf = requestAnimationFrame(fieldTick);
    }

    grid.addEventListener('mousemove', (e) => {
      const gridRect = grid.getBoundingClientRect();
      cursor = { x: e.clientX - gridRect.left, y: e.clientY - gridRect.top };
      ensureFieldLoop();
    });
    grid.addEventListener('mouseleave', () => {
      cursor = null;
      ensureFieldLoop();
    });

    // Real touch support — a finger dragging across the grid drives
    // the exact same tilt-toward-pointer and magnetic-field math as
    // desktop hover, translated through synthetic mouse events rather
    // than a separate, simplified code path. elementFromPoint is
    // needed because touchmove always fires on the element touch
    // started on, not whatever the finger currently sits over.
    let touchedItem = null;
    grid.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const gridRect = grid.getBoundingClientRect();
      cursor = { x: touch.clientX - gridRect.left, y: touch.clientY - gridRect.top };
      ensureFieldLoop();

      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const itemEl = target && target.closest('.c1-mosaic-item');

      if (itemEl !== touchedItem) {
        if (touchedItem) touchedItem.dispatchEvent(new Event('mouseleave'));
        if (itemEl) itemEl.dispatchEvent(new Event('mouseenter'));
        touchedItem = itemEl;
      }
      if (itemEl) {
        itemEl.dispatchEvent(new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY }));
      }
    }, { passive: true });

    grid.addEventListener('touchend', () => {
      if (touchedItem) {
        touchedItem.dispatchEvent(new Event('mouseleave'));
        touchedItem = null;
      }
      cursor = null;
      ensureFieldLoop();
    }, { passive: true });
  }
})();
