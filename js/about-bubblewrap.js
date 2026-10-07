(() => {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A short, synthesized pop rather than an external audio file — a
  // quick tone with a fast decay envelope reads as a satisfying
  // "pop"/click, and each one gets a slightly different pitch so
  // popping several in a row doesn't sound identical, same idea real
  // bubble-wrap sites use with multiple recorded pop sounds. One
  // shared audio context for every patch on the page.
  // A real pop has two parts: a sharp percussive snap (the plastic
  // giving way) and a short tonal release right after. One thin sine
  // tone alone reads as weak — layering a brief burst of filtered
  // noise under the tone gets much closer to an actual pop.
  let audioCtx = null;
  function playPop() {
    if (reduceMotion) return; // treat sound as part of the motion, not just visuals
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;

      // The snap — a very short burst of noise through a bandpass
      // filter, the percussive "give" of the plastic.
      const bufferSize = audioCtx.sampleRate * 0.03;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1800 + Math.random() * 800;
      noiseFilter.Q.value = 1.2;
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(now);
      noise.stop(now + 0.03);

      // The tonal release right after the snap.
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const basePitch = 300 + Math.random() * 160; // real pitch variation, per pop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(basePitch, now + 0.01);
      osc.frequency.exponentialRampToValueAtTime(basePitch * 0.35, now + 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.start(now + 0.01);
      osc.stop(now + 0.12);
    } catch (e) {
      // Web Audio can fail quietly in some contexts (autoplay policy,
      // unsupported browser) — the visual pop still works either way.
    }
  }

  const reduceMotionPref = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pop(bubble) {
    if (bubble.classList.contains('is-popped')) return;
    bubble.classList.add('is-popped');
    playPop();
    popCounter.add(1);
    // Every bubble in the footer vehicle popped: let it drive off.
    const shape = bubble.closest('[data-shape-pool]');
    if (shape && !shape.querySelector('.about-bubble:not(.is-popped)')) {
      shape.dispatchEvent(new CustomEvent('popit:complete'));
    }
  }

  // ---- Shared counter: every visitor's pops add to one total. Pops are
  // batched (sent every few seconds, and when leaving the page), not one
  // request per pop. If the counter can't be reached, the line stays hidden.
  const popCounter = (() => {
    let serverTotal = null, pending = 0, timer = null;
    const line = document.createElement('div');
    line.className = 'about-popit-count';
    line.hidden = true;
    function show() {
      if (serverTotal === null) return;
      line.textContent = `Visitors have popped ${(serverTotal + pending).toLocaleString('en-US')} bubbles`;
      line.hidden = false;
    }
    function flush(useBeacon) {
      if (!pending) return;
      const count = Math.min(pending, 500);
      pending -= count;
      const body = JSON.stringify({ count });
      if (useBeacon && navigator.sendBeacon) { navigator.sendBeacon('/api/pops', new Blob([body], { type: 'application/json' })); serverTotal = (serverTotal || 0) + count; return; }
      fetch('/api/pops', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
        .then((r) => r.ok ? r.json() : null).then((d) => { if (d && typeof d.total === 'number') { serverTotal = d.total; show(); } })
        .catch(() => { pending += count; });
    }
    fetch('/api/pops').then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { serverTotal = d.total; show(); })
      .catch(() => { if (typeof window.__POPS_DEMO === 'number') { serverTotal = window.__POPS_DEMO; show(); } });
    addEventListener('pagehide', () => flush(true));
    return {
      el: line,
      add(n) { pending += n; show(); clearTimeout(timer); timer = setTimeout(() => flush(false), 3000); },
    };
  })();

  // Keyboard access, without ~1,800 tab stops. Every bubble used to be its
  // own focusable button (the footer patch plus the 12-shape gallery came
  // to about 1,800 stops in front of the contact links). Bubbles are now
  // pointer and touch targets only; each PATCH is a single tab stop, and
  // Enter or Space on it pops the next bubble, so the toy still works from
  // the keyboard.
  function makeBubbleAccessible(bubble) {
    bubble.tabIndex = -1;
    bubble.setAttribute('aria-hidden', 'true');
  }
  function makePatchKeyboardAccessible(container) {
    container.tabIndex = 0;
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Pop-it. Press Enter or Space to pop the next bubble.');
    container.addEventListener('keydown', (e) => {
      if (e.target !== container) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const next = container.querySelector('.about-bubble:not(.is-popped)');
        if (next) pop(next);
      }
    });
  }

  // Shared drag-to-pop wiring — swipe a finger or held-down cursor
  // across a row and every bubble it crosses pops, not just the one
  // directly clicked. Used by every patch on the page: the plain
  // patches below, the footer shape, and every card in the "pop all
  // 15" gallery.
  // Why pops used to miss:
  //  1. Fast swipes: the browser only reports pointer positions every
  //     few ms, so a quick swipe jumped 30-60px between reports and any
  //     bubble in between never popped. Now every point along the path
  //     between two reports is checked.
  //  2. Near-misses: bubbles are circles, so the corners of each cell
  //     were dead zones. Hit-testing now uses each bubble's centre with
  //     a little tolerance.
  //  3. Every re-render of a shape attached another set of handlers.
  //     Each container is now wired exactly once, and the move/up
  //     listeners are shared by the whole page.
  const wired = new WeakSet();
  let gesture = null; // { rects, last:[x,y], step }

  function collectBubbles(container) {
    return [...container.querySelectorAll('.about-bubble:not(.is-popped)')].map((el) => {
      const b = el.getBoundingClientRect();
      const r = (b.width / 2) * 1.2;
      return { el, cx: b.left + b.width / 2, cy: b.top + b.height / 2, r2: r * r, w: b.width };
    });
  }
  function bubbleAt(x, y) {
    for (const r of gesture.rects) {
      const dx = x - r.cx, dy = y - r.cy;
      if (dx * dx + dy * dy <= r.r2) return r.el;
    }
    return null;
  }
  function popAlong(x, y) {
    const [lx, ly] = gesture.last;
    const n = Math.max(1, Math.ceil(Math.hypot(x - lx, y - ly) / gesture.step));
    for (let i = 1; i <= n; i++) {
      const el = bubbleAt(lx + (x - lx) * i / n, ly + (y - ly) * i / n);
      if (el) pop(el);
    }
    gesture.last = [x, y];
  }

  function wireDragToPop(container) {
    if (!container.hasAttribute('data-kbd')) { container.setAttribute('data-kbd', '1'); makePatchKeyboardAccessible(container); }
    if (wired.has(container)) return;
    wired.add(container);
    container.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return; // left button / touch / pen only
      // Stop the browser starting its own text selection or native drag.
      // Fast popping registers as double-clicks, which selected nearby text;
      // the next press-and-drag then grabbed that selection, the browser
      // showed its red "no drop" cursor, and stopped sending the pointer
      // moves that pop bubbles. Also clear any selection left from before.
      if (e.pointerType === 'mouse') e.preventDefault();
      clearSelection();
      const rects = collectBubbles(container);
      gesture = { rects, last: [e.clientX, e.clientY], step: Math.max(3, ((rects[0] && rects[0].w) || 24) / 3) };
      const el = bubbleAt(e.clientX, e.clientY);
      if (el) pop(el);
    });
  }
  function clearSelection() {
    const sel = window.getSelection && window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) sel.removeAllRanges();
  }
  // Backstop: never let a native drag or text selection start anywhere in
  // the pop-it area (patches, labels, counter, buttons, gallery).
  const POPIT_AREA = '.about-popit, .about-bubblewrap, .about-popit-gallery';
  ['dragstart', 'selectstart'].forEach((type) => {
    document.addEventListener(type, (e) => {
      if (e.target && e.target.closest && e.target.closest(POPIT_AREA)) e.preventDefault();
    });
  });
  let prevPt = null; // pointer position at the previous report
  addEventListener('pointermove', (e) => {
    const from = prevPt;
    prevPt = [e.clientX, e.clientY];
    if (!gesture) {
      // Button held down but the press started just outside a patch:
      // begin popping the moment the pointer sweeps onto one.
      if (!(e.buttons & 1)) return;
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const container = hit && hit.closest('.about-bubblewrap');
      if (!container || !wired.has(container)) return;
      clearSelection();
      const rects = collectBubbles(container);
      // Start the path where the pointer actually was, so bubbles between
      // the last report outside the patch and this one still count.
      gesture = { rects, last: from || [e.clientX, e.clientY], step: Math.max(3, ((rects[0] && rects[0].w) || 24) / 3) };
    }
    popAlong(e.clientX, e.clientY);
  }, { passive: true });
  addEventListener('pointerup', () => { gesture = null; });
  addEventListener('pointercancel', () => { gesture = null; });

  // ---- Plain rectangular patches — any element with class
  // "about-bubblewrap" that is NOT the shape-reveal footer patch.
  // Kept for any other bubble-wrap patch elsewhere on the page. ----
  const plainWraps = document.querySelectorAll('.about-bubblewrap:not([data-shape-pool])');
  plainWraps.forEach((wrap) => {
    // Scale count to the actual current column count (read from the
    // live grid) rather than a fixed number — at a fixed count, fewer
    // columns on mobile just means more rows stacked up, turning a
    // wide flat shape into a tall narrow one. Locking rows to 3
    // regardless of column count keeps it landscape at any width.
    const computedColumns = getComputedStyle(wrap).gridTemplateColumns.split(' ').length;
    const rows = 3;
    const count = wrap.dataset.count
      ? parseInt(wrap.dataset.count, 10)
      : computedColumns * rows;

    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'about-bubble';
      bubble.addEventListener('click', () => pop(bubble));
      makeBubbleAccessible(bubble);
      wrap.appendChild(bubble);
    }
    wireDragToPop(wrap);
  });

  // ---- Shape rendering — shared by the footer patch and every card
  // in the "pop all 15" gallery. Places a bubble ONLY where its full
  // circle sits mostly inside the vehicle silhouette. Deliberately not
  // a CSS mask over a plain grid: masking clips bubbles right through
  // the middle wherever the silhouette edge crosses one, which looks
  // broken and leaves half a bubble that still visually registers as
  // poppable but isn't fully there. Real molded pop-its only ever
  // place whole circles, this does the same. ----
  function renderShape(container, layout) {
    container.innerHTML = '';
    // minmax(0, 1fr), not plain 1fr — a bare 1fr track has an implicit
    // minimum of "auto" (its content's natural size), so a box with
    // many rows/columns packed into a small fixed footprint (the
    // gallery's 140px-tall cards) quietly grows taller than its box
    // instead of shrinking to fit, and the box's overflow:hidden then
    // clips the excess off the bottom. minmax(0, 1fr) removes that
    // floor so the tracks actually shrink to the space available.
    container.style.gridTemplateColumns = `repeat(${layout.cols}, minmax(0, 1fr))`;
    container.style.gridTemplateRows = `repeat(${layout.rows}, minmax(0, 1fr))`;
    container.style.aspectRatio = `${layout.cols} / ${layout.rows}`;

    layout.cells.forEach(([col, row]) => {
      const bubble = document.createElement('div');
      bubble.className = 'about-bubble';
      bubble.style.gridColumn = String(col + 1);
      bubble.style.gridRow = String(row + 1);
      bubble.addEventListener('click', () => pop(bubble));
      makeBubbleAccessible(bubble);
      container.appendChild(bubble);
    });

    wireDragToPop(container);
  }

  function resetShape(container) {
    container.querySelectorAll('.about-bubble.is-popped').forEach((b) => b.classList.remove('is-popped'));
  }

  function pickRandomName(names, exclude) {
    if (names.length <= 1) return names[0];
    let name;
    do {
      name = names[Math.floor(Math.random() * names.length)];
    } while (name === exclude);
    return name;
  }

  // ---- Footer patch — picks one vehicle silhouette at random per
  // page load, plus Reset / Next / a "pop all 15" gallery. ----
  const revealWrap = document.querySelector('.about-bubblewrap-footer[data-shape-pool]');
  const revealStage = document.getElementById('popitStage');
  if (revealWrap) {
    // Shape data is inlined via js/vehicle-shapes-data.js (loaded before this
    // file) rather than fetched — fetching a local JSON file is blocked by
    // CORS when this page is opened directly from disk (file://), which
    // silently killed the entire footer pop-it feature in that case.
    Promise.resolve(window.BUBBLE_LAYOUTS || {})
      .then((layouts) => {
        const names = Object.keys(layouts);
        if (!names.length) return;

        let currentName = null;
        let currentLayout = null;
        // Different vehicles have very different row/column counts, so
        // letting the patch's own height follow its aspect-ratio (the
        // old behavior) meant switching shapes changed the footer's
        // total height and shoved "Let's talk about..." up or down —
        // exactly the "position changes every time" bug. The stage
        // (see CSS) is a fixed box; fitPatchToStage measures it and
        // sizes the patch to fit inside, same approach as the gallery
        // cards, so the footer's height is constant across every shape.
        function fitFooterPatch() {
          if (revealStage && currentLayout) {
            fitPatchToStage(revealStage, revealWrap, currentLayout.cols, currentLayout.rows);
          }
        }
        function showFooterShape(name) {
          currentName = name;
          currentLayout = layouts[name];
          revealWrap.dataset.shape = name;
          renderShape(revealWrap, currentLayout);
          fitFooterPatch();
        }
        showFooterShape(pickRandomName(names));

        const labelEl = document.querySelector('.about-popit-label');
        if (labelEl) labelEl.insertAdjacentElement('afterend', popCounter.el);

        // The gift: a fully popped vehicle drives off (speeding up as it
        // leaves), and the next one rolls in and eases to a stop. No
        // bounce, per the site's motion rules.
        // Which way each vehicle's front points in its bubble shape, so the
        // drive-off always moves forward. Read from the shapes themselves.
        // Read from each silhouette: a windshield rake, a long hood, a bucket
        // arm or a propeller marks the front. (The car has a long hood on
        // the left and a blunt rear on the right; the snowmobile has a
        // low seat on the left and a tall windshield and sloping nose on
        // the right. An earlier version had those two the wrong way round.)
        const VEHICLE_FACING = {
          scooter: 'left', rickshaw: 'left', car: 'left', jcb: 'left',
          bus: 'left', train: 'left', pickup: 'left',
          tank: 'right', helicopter: 'right', ambulance: 'right',
          submarine: 'right', snowmobile: 'right',
        };
        let driving = false;
        revealWrap.addEventListener('popit:complete', () => {
          if (driving) return;
          driving = true;
          const next = pickRandomName(names, currentName);
          if (reduceMotionPref) { showFooterShape(next); driving = false; return; }
          if (revealStage) revealStage.classList.add('is-driving');
          // Each vehicle drives off the way it faces, and the next one arrives
          // from behind, also moving forward (never in reverse).
          const outDir = VEHICLE_FACING[currentName] === 'left' ? -1 : 1;
          const inDir = VEHICLE_FACING[next] === 'left' ? -1 : 1;
          setTimeout(() => {
            revealWrap.style.transition = 'transform 0.9s cubic-bezier(0.55, 0, 0.9, 0.4)';
            revealWrap.style.transform = `translateX(${115 * outDir}%)`;
            setTimeout(() => {
              revealWrap.style.transition = 'none';
              showFooterShape(next);
              revealWrap.style.transform = `translateX(${-115 * inDir}%)`;
              void revealWrap.offsetWidth;
              revealWrap.style.transition = 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)';
              revealWrap.style.transform = 'translateX(0)';
              setTimeout(() => {
                revealWrap.style.transition = '';
                revealWrap.style.transform = '';
                if (revealStage) revealStage.classList.remove('is-driving');
                driving = false;
              }, 1050);
            }, 920);
          }, 350);
        });

        if (revealStage && window.ResizeObserver) {
          const revealRo = new ResizeObserver(fitFooterPatch);
          revealRo.observe(revealStage);
        } else if (revealStage) {
          addEventListener('resize', fitFooterPatch);
        }

        const resetBtn = document.getElementById('popitResetBtn');
        const nextBtn = document.getElementById('popitNextBtn');
        const moreBtn = document.getElementById('popitMoreBtn');
        const galleryEl = document.getElementById('popitGallery');

        if (resetBtn) {
          resetBtn.addEventListener('click', () => resetShape(revealWrap));
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', () => showFooterShape(pickRandomName(names, currentName)));
        }
        if (moreBtn && galleryEl) {
          moreBtn.addEventListener('click', () => toggleGallery(galleryEl, moreBtn, layouts, names));
        }
      })
      .catch(() => {
        // If the layout data fails to load, leave the patch empty
        // rather than falling back to a shape-less grid — an empty
        // panel is a much smaller problem than a visibly broken one.
      });
  }

  // ---- "Pop all 13" gallery — expands in place below the footer's
  // controls, in normal page flow (no overlay, no second surface on
  // top of the page). Built once on first open and reused after that,
  // so bubbles that are already popped stay popped between toggles. ----
  let galleryBuilt = false;

  // Every card's stage is a fixed box on BOTH axes (a set card height,
  // and a width the auto-fit grid decides) — CSS alone can't express
  // "grow the patch as large as it can go while keeping its true
  // aspect ratio," because the aspect-ratio property only resolves
  // when exactly ONE axis is definite. Leaving both auto and only
  // capping with max-width/max-height (the previous attempt) let the
  // patch collapse to its own tiny natural size instead of growing to
  // fill the box — nothing was forcing it to actually be big. This
  // measures the real stage box and sets an explicit pixel width and
  // height that fills whichever axis binds first, same idea as
  // object-fit: contain. A ResizeObserver re-runs it whenever the
  // card's width changes (the grid reflowing, the window resizing),
  // so it can't go stale the way a one-time pixel calculation would.
  function fitPatchToStage(stage, patch, cols, rows) {
    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    if (!stageW || !stageH) return;
    const ratio = cols / rows;
    let w, h;
    if (stageW / stageH > ratio) {
      h = stageH;
      w = stageH * ratio;
    } else {
      w = stageW;
      h = stageW / ratio;
    }
    patch.style.width = `${w}px`;
    patch.style.height = `${h}px`;
  }

  function buildGallery(galleryEl, layouts, names) {
    if (galleryBuilt) return;
    names.forEach((name) => {
      const layout = layouts[name];

      const card = document.createElement('div');
      card.className = 'about-popit-gallery-card';

      const stage = document.createElement('div');
      stage.className = 'about-popit-gallery-stage';

      const patch = document.createElement('div');
      patch.className = 'about-bubblewrap about-popit-gallery-patch';
      stage.appendChild(patch);

      card.appendChild(stage);
      galleryEl.appendChild(card);

      renderShape(patch, layout);

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => fitPatchToStage(stage, patch, layout.cols, layout.rows));
        ro.observe(stage);
      } else {
        fitPatchToStage(stage, patch, layout.cols, layout.rows);
      }
    });
    galleryBuilt = true;
  }

  function toggleGallery(galleryEl, moreBtn, layouts, names) {
    const opening = !galleryEl.classList.contains('is-open');
    if (opening) {
      // Open BEFORE building — the gallery is display:none until this
      // class lands, so the stages have no real layout box to measure
      // if the fit-to-stage pass runs first.
      galleryEl.classList.add('is-open');
      buildGallery(galleryEl, layouts, names);
      moreBtn.textContent = 'Show less';
      moreBtn.setAttribute('aria-expanded', 'true');
      galleryEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    } else {
      galleryEl.classList.remove('is-open');
      moreBtn.textContent = 'More fun';
      moreBtn.setAttribute('aria-expanded', 'false');
    }
  }
})();
