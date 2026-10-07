(() => {
  const fieldWrap = document.getElementById('c1Field');
  if (!fieldWrap) return; // only runs on the C1 page

  const expandVeil = document.getElementById('c1ExpandVeil');
  const expandCard = document.getElementById('c1ExpandCard');
  const expandClose = document.getElementById('c1ExpandClose');

  const tones = ['#E8E2D5', '#DCE5D2', '#E5E5E5', '#F5EFE5', '#DCE3E5', '#EFE7D6', '#D9CFC4', '#CBD6D3'];
  const N = 32;
  const cards = [];
  const placed = [];

  // Same accessibility signal c1-gallery.js already honors — the field's
  // scroll-lock + perpetual upward drift is exactly the kind of continuous,
  // full-viewport motion Apple's reduced-motion guidance calls out, and
  // unlike CSS transitions/animations (already zeroed globally in
  // base.css), this is a per-frame transform write that no CSS rule can
  // reach. So it needs its own explicit check.
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(a, b) { return a + Math.random() * (b - a); }

  let cachedDims = null;
  function getDims() {
    if (cachedDims) return cachedDims;
    const rect = fieldWrap.getBoundingClientRect();
    cachedDims = { w: rect.width, h: rect.height };
    return cachedDims;
  }
  function invalidateDims() { cachedDims = null; }

  // Place cards on whole device pixels. They drift under 1px per frame,
  // so unsnapped positions cycled through every in-between value and the
  // photos alternated between crisp and softened ~4 times a second,
  // which read as flickering motion blur. Snapping keeps every frame sharp.
  const DPR = window.devicePixelRatio || 1;
  const snap = (v) => Math.round(v * DPR) / DPR;
  const place = (el, x, y) => { el.style.transform = `translate3d(${snap(x)}px, ${snap(y)}px, 0)`; };
  addEventListener('resize', invalidateDims);
  addEventListener('orientationchange', invalidateDims);

  // Stratified initial depth: pure per-card randomness could, purely by
  // chance, leave one or two images buried far deeper than the rest —
  // and since the field only unlocks once every image has had its turn,
  // those stragglers dragged the whole reveal out while everything else
  // kept looping past and repeating in the meantime. Spreading all 32
  // evenly across the (now much shorter) travel range up front guarantees
  // every image gets a bounded, predictable turn.
  const initialOrder = Array.from({ length: N }, (_, i) => i);
  for (let i = initialOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [initialOrder[i], initialOrder[j]] = [initialOrder[j], initialOrder[i]];
  }
  const initialRank = new Array(N);
  initialOrder.forEach((cardIndex, rank) => { initialRank[cardIndex] = rank; });

  function spawn(card, mode) {
    const { w, h } = getDims();
    const size = Math.max(173, Math.min(460, w * 0.144)); // cap raised from 317 so photos grow on big monitors
    const others = placed.filter((p) => p.card !== card);

    function overlaps(x, y, gap) {
      const cx = x + size / 2, cy = y + size / 2, r = size / 2;
      return others.some((p) => {
        const dist = Math.hypot(cx - p.cx, cy - p.cy);
        return dist < r + p.r + Math.max(0, gap);
      });
    }

    let x, y, attempts = 0, searchExtra = 0, totalAttempts = 0;

    // Initial, stratified: this card's own even-spaced band, entirely
    // within the range that's guaranteed to still cross the viewport.
    // Position only ever decreases (the drift is upward), and a card
    // counts as "seen" once baseY + size > 0 — so anything starting at or
    // below -size is already past the point of no return and would park
    // without ever having been visible. Computed once, outside the
    // overlap-search loop below: if that loop's escalation logic were
    // allowed to push this further (as it does for 'below'/'static'), a
    // crowded layout could shove a card's *initial* position well past
    // its band and delay its one guaranteed appearance unpredictably —
    // exactly what made the reveal drag on and occasionally never finish.
    let initialBandStart = 0, initialBand = 0;
    if (mode !== 'below' && mode !== 'static') {
      const minSafeY = -(size - 40);
      // Wider travel range than the tightest version — 32 cards packed
      // into a short range put too many on screen at once even with live
      // separation resisting literal overlap. More room per card means
      // fewer are ever concurrently visible.
      const travel = h + h * 2.8 - minSafeY;
      initialBand = travel / N;
      initialBandStart = minSafeY + initialRank[card.index] * initialBand;
      y = rand(initialBandStart, initialBandStart + initialBand);
    }

    while (true) {
      attempts++;
      totalAttempts++;
      // Minimum breathing room between any two cards at the moment they're
      // placed — 60px let cards spawn almost edge-to-edge, which read as
      // cramped even before any drift-driven convergence (see MIN_GAP
      // below) had a chance to make it worse.
      const gap = rand(160, 560);
      x = rand(0, Math.max(0, w - size));
      if (mode === 'below') {
        y = rand(h + 40, h + h * 2.8 + searchExtra);
      } else if (mode === 'static') {
        // Reduced-motion layout: every card lands fully inside the
        // visible band right away, nothing off-screen waiting to drift
        // in, since there's no drift loop to bring it into view.
        y = rand(0, Math.max(0, h - size + searchExtra));
      } else if (attempts > 1) {
        // Re-roll within this card's own band only — never escalate
        // outside it, so the travel distance stays bounded no matter how
        // many attempts the search takes.
        y = rand(initialBandStart, initialBandStart + initialBand);
      }
      if (!overlaps(x, y, gap)) break;
      if (attempts > 150) { searchExtra += h * 0.4; attempts = 0; }
      // Safety valve: for a band-locked initial placement there's no
      // escalation to fall back on, so an extremely crowded band could in
      // principle search forever. Accept a minor overlap rather than hang.
      if (totalAttempts > 600) break;
    }

    const item = ((window.CONTENT && CONTENT.c1 && CONTENT.c1.heroImages) || [])[card.index];
    // Only touch size/background when they actually change: re-setting
    // the same image URL on every recycle forced a repaint of the photo.
    if (card.size !== size) { card.el.style.width = size + 'px'; card.el.style.height = size + 'px'; }
    const bg = (item && item.image) ? `url('${item.image}') center/cover` : tones[card.index % tones.length];
    // The sharp large version of this photo, used only by the enlarged view.
    card.el.dataset.large = (item && item.image) ? item.image.replace(/\.jpg$/i, '-lg.jpg') : '';
    if (card.bg !== bg) { card.el.style.background = bg; card.bg = bg; }

    const existing = placed.find((p) => p.card === card);
    const record = { card, cx: x + size / 2, cy: y + size / 2, r: size / 2 };
    if (existing) Object.assign(existing, record);
    else placed.push(record);

    card.baseX = x;
    card.baseY = y;
    card.size = size;
    card.depth = rand(0, 1);
    card.speed = 0.46 + card.depth * 0.78;
    card.el.style.opacity = '1';
    place(card.el, x, y);
  }

  // Spawn-time spacing only holds for an instant: cards drift at different
  // speeds (see card.speed below), so two that started with clear space
  // between them gradually converge and can end up overlapping by the time
  // they're both on screen. A light, continuous separation pass — the same
  // "always correct from the live position" idea as the gallery's magnetic
  // field — keeps a minimum gap between whatever's currently visible,
  // nudged apart gradually rather than snapped, so it never reads as a
  // sudden jump.
  const MIN_GAP = 84;
  function separateCards() {
    const n = cards.length;
    const pushX = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const a = cards[i];
      const ar = a.size / 2;
      for (let j = i + 1; j < n; j++) {
        const b = cards[j];
        const br = b.size / 2;
        const dx = (a.baseX + ar) - (b.baseX + br);
        const dy = (a.baseY + ar) - (b.baseY + br);
        const dist = Math.hypot(dx, dy) || 0.01;
        const minDist = ar + br + MIN_GAP;
        if (dist < minDist) {
          const nx = (dx / dist) * (minDist - dist) * 0.5;
          pushX[i] += nx;
          pushX[j] -= nx;
        }
      }
    }
    const { w } = getDims();
    for (let i = 0; i < n; i++) {
      const card = cards[i];
      // Cap the per-frame nudge so even a dense cluster eases apart over
      // several frames instead of popping to its resolved position. Clamp
      // fully within the field's horizontal bounds — cards must never be
      // pushed partway off the left/right edge, even to resolve a crowded
      // cluster; a card getting sliced off by the viewport edge reads as
      // broken, not as a design choice.
      card.baseX += Math.max(-5, Math.min(5, pushX[i]));
      card.baseX = Math.max(0, Math.min(w - card.size, card.baseX));
    }
  }

  for (let i = 0; i < N; i++) {
    const el = document.createElement('div');
    el.className = 'c1-card';
    // These photos drift across the screen continuously, so they are
    // decoration for pointer and touch (click to enlarge), not keyboard
    // stops: 32 of them sat in the tab order ahead of the case study. The
    // gallery below is the keyboard route to the same viewer.
    el.tabIndex = -1;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-hidden', 'true');
    fieldWrap.appendChild(el);
    const card = { el, index: i };
    function openThisCard() {
      // Anchor the expand to where the card actually is (FLIP), rather
      // than always growing from a fixed center point — per the "things
      // should emerge from where they came" rule, the card the person
      // just looked at is the origin, not the middle of the screen.
      const from = el.getBoundingClientRect();
      expandCard.style.background = el.style.background; // the thumbnail shows instantly...
      // ...and is swapped for the sharp large version the moment it has loaded
      // (the card used to stay a blown-up thumbnail, which looked soft).
      const largeSrc = el.dataset.large;
      if (largeSrc) {
        const big = new Image();
        big.onload = () => {
          if (expandVeil.classList.contains('is-active')) expandCard.style.background = `url('${largeSrc}') center/cover`;
        };
        big.src = largeSrc;
      }
      expandVeil.classList.add('is-active');
      expandClose.classList.add('is-active');

      const to = expandCard.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const sx = from.width / to.width;
      const sy = from.height / to.height;

      if (reduceMotion) {
        // Reduced motion: skip the FLIP entirely, just show it in place —
        // a cross-fade via the veil's own opacity transition is enough.
        expandCard.style.transform = 'none';
        return;
      }

      expandCard.style.transition = 'none';
      expandCard.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      void expandCard.offsetWidth; // force reflow so the start state actually paints
      expandCard.style.transition = '';
      requestAnimationFrame(() => {
        expandCard.style.transform = 'translate(0, 0) scale(1)';
      });
    }
    el.addEventListener('click', openThisCard);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openThisCard();
      }
    });
    cards.push(card);
  }

  // The actual expensive work — each spawn's overlap-avoidance search
  // can retry up to 600 times, and doing that for all 32 cards back to
  // back with no gap for the browser to paint is exactly what produced
  // the load-time freeze. Card creation above stays synchronous since
  // it's cheap; only the real cost is deferred, spread across a
  // handful of frames so the browser can breathe between batches.
  // Each photo is decoded before its card appears. Previously all 32
  // were decoded on the fly the first time they were painted, which
  // stalled frames for up to ~160ms in the first seconds (the "freeze").
  // img.decode() does that work off the main thread, and the result is
  // cached, so the paint is instant and later recycles reuse it.
  const decoded = new Map();
  function decodeImage(url) {
    if (!url) return Promise.resolve();
    if (!decoded.has(url)) {
      const im = new Image();
      im.src = url;
      decoded.set(url, (im.decode ? im.decode() : Promise.resolve()).catch(() => {}));
    }
    return decoded.get(url);
  }
  (function spawnInitialCards() {
    const list = (window.CONTENT && CONTENT.c1 && CONTENT.c1.heroImages) || [];
    // Every photo decodes in parallel (so none of them individually stall a
    // frame), but they tend to finish decoding within a few ms of each
    // other. Spawning each one the instant its own decode resolves meant
    // most of the 32 cards became ready in the same one or two frames, and
    // inserting/painting that many new elements at once was the actual
    // "brief freeze on load" — real, but invisible to a long-task check,
    // since it's paint/composite cost, not blocked script time.
    // A small per-frame cap spreads that paint work back out, the same
    // fix already proven for the original synchronous-spawn freeze.
    const BATCH_SIZE = 4;
    const ready = [];
    let draining = false;
    function drain() {
      draining = true;
      const batch = ready.splice(0, BATCH_SIZE);
      batch.forEach((card) => spawn(card, reduceMotion ? 'static' : undefined));
      if (ready.length) requestAnimationFrame(drain);
      else draining = false;
    }
    cards.forEach((card) => {
      const url = list[card.index] && list[card.index].image;
      // Cap the wait so a slow photo never holds its card back for long.
      Promise.race([decodeImage(url), new Promise((r) => setTimeout(r, 1500))])
        .then(() => {
          ready.push(card);
          if (!draining) requestAnimationFrame(drain);
        });
    });
  })();
  function closeExpand() {
    expandVeil.classList.remove('is-active');
    expandClose.classList.remove('is-active');
    // Let it settle back to the CSS-driven resting transform (scale(0.95))
    // instead of leaving the last FLIP transform stuck in place.
    expandCard.style.transform = '';
  }
  expandVeil.addEventListener('click', closeExpand);
  expandClose.addEventListener('click', closeExpand);

  // Dialog behaviour for the enlarged viewer. It is shared with the gallery
  // below, so this watches the veil instead of hooking each opener: when it
  // opens, focus moves to Close and Tab stays there; when it closes, the
  // Close button leaves the tab order and focus returns to where it was.
  (function dialogBehaviour() {
    expandCard.setAttribute('role', 'dialog');
    expandCard.setAttribute('aria-modal', 'true');
    expandCard.setAttribute('aria-label', 'Photo viewer');
    expandClose.tabIndex = -1;
    let prior = null;
    new MutationObserver(() => {
      const open = expandVeil.classList.contains('is-active');
      if (open && expandClose.tabIndex !== 0) {
        prior = document.activeElement;
        expandClose.tabIndex = 0;
        expandClose.focus({ preventScroll: true });
      } else if (!open && expandClose.tabIndex === 0) {
        expandClose.tabIndex = -1;
        if (prior && prior !== document.body && document.contains(prior) && prior.focus) prior.focus({ preventScroll: true });
        prior = null;
      }
    }).observe(expandVeil, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && expandVeil.classList.contains('is-active')) {
        e.preventDefault();
        expandClose.focus({ preventScroll: true });
      }
    });
  })();
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeExpand(); });

  // Reduced motion: cards are already laid out in a static, fully-visible
  // band (spawned with mode 'static' above) — no drift loop, no scroll
  // lock, no recycling. The page simply scrolls normally from here.
  if (reduceMotion) return;

  // Scroll feels like a push: each scroll adds to a target speed, the
  // photos accelerate toward it over ~250ms, then the target fades and
  // they ease back down. (Before, speed jumped instantly then decayed.)
  let boost = 0;
  let boostTarget = 0;
  let unlocked = false;
  // Each of the 32 card elements is permanently tied to one image
  // (card.index never changes, only where it's positioned), so "shown
  // every photo" means every index has actually passed through the
  // visible viewport at least once — not just "32 recycle events have
  // happened somewhere," which could hit 32 while a slow-moving card in
  // the back never entered view at all.
  const seen = new Set();

  // A thin, honest "how much further" indicator for the scroll-lock —
  // without it there's no way to tell a slow scroll from a stuck page.
  const progressWrap = document.createElement('div');
  progressWrap.className = 'c1-field-progress';
  const progressBar = document.createElement('div');
  progressBar.className = 'c1-field-progress-bar';
  progressWrap.appendChild(progressBar);
  fieldWrap.parentElement.appendChild(progressWrap);

  let separateFrameCounter = 0;
  // Once the lock is released and the hero has scrolled out of view, the
  // frame loop kept moving and re-separating 32 cards nobody could see for
  // the rest of the visit. It now idles until the hero is back in view.
  let heroInView = true;
  const heroEl = document.querySelector('.project-intro');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { heroInView = entries[0].isIntersecting; }).observe(heroEl);
  }

  function tick() {
    if (unlocked && !heroInView) { requestAnimationFrame(tick); return; }
    separateFrameCounter++;
    if (separateFrameCounter % 2 === 0) separateCards();
    const { h } = getDims();
    cards.forEach((card) => {
      if (card.baseY == null) return; // not placed yet (its photo is still decoding)
      if (!unlocked && !seen.has(card.index) && card.baseY + card.size > 0 && card.baseY < h) {
        seen.add(card.index);
      }
      const dy = card.speed + boost * (0.4 + card.depth * 0.6);
      card.baseY -= dy;
      if (card.baseY < -260) {
        if (unlocked) {
          // The reveal is done — safe to loop indefinitely now, purely as
          // ambient background motion behind whatever the person is
          // scrolling through next.
          spawn(card, 'below');
        } else {
          // Already had its one guaranteed appearance. Park it off-screen
          // instead of looping it back in — recycling it here is exactly
          // what caused images to repeat over and over while the reveal
          // waited on whichever photos hadn't had their turn yet.
          card.el.style.opacity = '0';
        }
      } else {
        place(card.el, card.baseX, card.baseY);
      }
    });
    if (!unlocked) {
      progressBar.style.transform = `scaleX(${Math.min(1, seen.size / N)})`;
      if (seen.size >= N) {
        // Via the one unlock function. Setting the flag directly here left
        // the page at overflow:hidden, so a keyboard-only visitor (whose
        // key handler returns early once unlocked) could be stuck for good.
        forceUnlock();
      }
    }
    boost += (boostTarget - boost) * 0.12; // accelerate toward the push
    boostTarget *= 0.93;                   // the push fades, so they slow again
    requestAnimationFrame(tick);
  }

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Scroll-gesture cap: the lock is only meant to hold attention for a
  // few real attempts, not force the visitor to sit through the whole
  // reel. After 3 distinct scroll gestures (a trackpad swipe, a mouse
  // wheel notch-burst, a touch swipe) the 4th gesture releases the lock
  // immediately and lets that same input carry straight into the page,
  // regardless of how many cards have been seen. A single gesture is
  // grouped by a short quiet-gap timeout, since one real-world swipe
  // fires many discrete wheel events, not one.
  // Two scrolls push the photos along; the third moves into the case study.
  const GESTURE_LIMIT = 2;
  let gestureCount = 0;
  let gestureActive = false;
  let gestureTimer = null;
  let swallowUntilIdle = false;

  function forceUnlock() {
    unlocked = true;
    progressWrap.classList.add('is-hidden');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  // Keyboard users had no way past the hero at all: overflow:hidden
  // swallowed PageDown, Space, arrows and End. Any scroll key now
  // releases the page, and the key's own scroll then happens normally.
  const SCROLL_KEYS = new Set(['PageDown', 'PageUp', ' ', 'Spacebar', 'ArrowDown', 'ArrowUp', 'End', 'Home']);
  addEventListener('keydown', (e) => {
    if (unlocked || !SCROLL_KEYS.has(e.key)) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName))) return;
    // A focused photo card is a div[role=button], not a <button>: pressing
    // Space on it opened the card AND unlocked the page behind it.
    if ((e.key === ' ' || e.key === 'Spacebar') && t && t.closest && t.closest('[role="button"]')) return;
    forceUnlock();
  });

  addEventListener('wheel', (e) => {
    if (!unlocked) {
      // Only decide "is this a new gesture" at the boundary — mid-gesture
      // wheel events (the same trackpad swipe, still arriving) must never
      // re-check the limit, or a gesture that pushes gestureCount up to
      // the limit would unlock itself halfway through its own events
      // instead of waiting for the next, genuinely new one.
      const isNewGesture = !gestureActive;
      if (isNewGesture) {
        if (gestureCount >= GESTURE_LIMIT) {
          // The third scroll: glide to exactly the start of the case study.
          // Letting the scroll through raw meant the rest of the same
          // trackpad swipe kept going and carried half the first section
          // past. The remainder of this gesture is absorbed instead.
          e.preventDefault();
          forceUnlock();
          swallowUntilIdle = true;
          const first = document.querySelector('.cs-section');
          if (first) window.scrollTo({ top: first.getBoundingClientRect().top + scrollY, behavior: reduceMotion ? 'auto' : 'smooth' });
          gestureActive = true;
          clearTimeout(gestureTimer);
          gestureTimer = setTimeout(() => { gestureActive = false; swallowUntilIdle = false; }, 220);
          return;
        }
        gestureCount += 1;
      }
      gestureActive = true;
      clearTimeout(gestureTimer);
      gestureTimer = setTimeout(() => { gestureActive = false; }, 180);

      e.preventDefault();
      // Between the original (too fast to register) and the first
      // correction (too slow) — more travel room per card (see the
      // spawn() bands above) does most of the work of making this feel
      // less frantic, so speed doesn't have to carry all of it alone.
      // Gain and cap raised, decay tightened (see below), so the cards
      // read as responding to each scroll input directly rather than
      // trailing a smoothed-out average of recent ones.
      boostTarget = Math.min(24, boostTarget + Math.abs(e.deltaY) * 0.3);
    } else {
      if (swallowUntilIdle) {
        // Still the same swipe that triggered the glide: absorb it.
        e.preventDefault();
        clearTimeout(gestureTimer);
        gestureTimer = setTimeout(() => { gestureActive = false; swallowUntilIdle = false; }, 220);
        return;
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }, { passive: false });

  // Real touch support — without this, mobile users had no way to
  // speed through the locked hero at all, only the cards' own slow
  // idle drift, potentially leaving them stuck for a long time with
  // no visible way out. Each touchstart is its own gesture (a swipe has
  // a natural start/end, unlike a wheel stream), so it counts directly.
  let touchStartY = null;
  let touchTravel = 0;       // how far this touch has moved in total
  let touchCounted = false;  // has this touch already counted as a gesture?
  addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchTravel = 0;
    touchCounted = false;
    // Nothing is counted here. It used to be, so simply TAPPING a photo
    // three times counted as three scroll gestures, and the third tap
    // force-unlocked and scrolled the page away instead of opening it.
  }, { passive: true });

  addEventListener('touchmove', (e) => {
    if (touchStartY === null) return;
    const dy = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    touchTravel += Math.abs(dy);
    if (!unlocked && !touchCounted && touchTravel > 12) {
      // The finger really is swiping: only now does it count as a gesture.
      touchCounted = true;
      if (gestureCount >= GESTURE_LIMIT) {
        // Third swipe: glide to the start of the case study, absorbing the
        // rest of this swipe (same as the wheel path above).
        e.preventDefault();
        forceUnlock();
        swallowUntilIdle = true;
        const first = document.querySelector('.cs-section');
        if (first) window.scrollTo({ top: first.getBoundingClientRect().top + scrollY, behavior: reduceMotion ? 'auto' : 'smooth' });
        clearTimeout(gestureTimer);
        gestureTimer = setTimeout(() => { gestureActive = false; swallowUntilIdle = false; }, 220);
        return;
      }
      gestureCount += 1;
    }
    if (!unlocked) {
      if (dy > 0) e.preventDefault();
      boostTarget = Math.min(24, boostTarget + Math.abs(dy) * 0.66);
    } else {
      if (swallowUntilIdle) {
        // Still the same swipe that triggered the glide: absorb it.
        e.preventDefault();
        clearTimeout(gestureTimer);
        gestureTimer = setTimeout(() => { gestureActive = false; swallowUntilIdle = false; }, 220);
        return;
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }, { passive: false });

  let respawnToken = 0;
  function respawnAll() {
    const token = ++respawnToken; // a newer re-placement cancels an older one still in progress
    placed.length = 0;
    // Spawning all 32 cards synchronously in one go was the real cause
    // of the load-time freeze — each spawn can retry its overlap search
    // up to 600 times, and doing that for all 32 back to back with no
    // gap for the browser to paint is exactly what a multi-second
    // freeze looks like. Spreading it across a few frames gives the
    // same final layout, just interleaved with actual rendering
    // instead of blocking it outright.
    const BATCH_SIZE = 6;
    let spawnIndex = 0;
    function spawnBatch() {
      if (token !== respawnToken) return;
      const end = Math.min(spawnIndex + BATCH_SIZE, cards.length);
      for (; spawnIndex < end; spawnIndex++) {
        spawn(cards[spawnIndex]);
      }
      if (spawnIndex < cards.length) {
        requestAnimationFrame(spawnBatch);
      }
    }
    spawnBatch();
  }
  // Re-place the photos once, 200ms after resizing stops. It used to run on
  // every resize event (dozens per window drag), and also when a phone's
  // address bar slid away, which changes the height but needs no re-placing.
  let lastW = innerWidth, lastH = innerHeight, resizeTimer = null;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const dw = Math.abs(innerWidth - lastW), dh = Math.abs(innerHeight - lastH);
      if (dw < 40 && dh < lastH * 0.25) return;
      lastW = innerWidth; lastH = innerHeight;
      respawnAll();
    }, 200);
  });

  requestAnimationFrame(tick);
})();

// No native drag or text selection can start on the draggable surfaces:
// a stray selection or image drag let the browser take over a press
// (red "no drop" circle) instead of the page's own drag handling.
['dragstart', 'selectstart'].forEach((type) => {
  document.addEventListener(type, (e) => {
    if (e.target && e.target.closest && e.target.closest('#c1Field, #c1Mosaic, .c1-expand-card')) e.preventDefault();
  });
});
