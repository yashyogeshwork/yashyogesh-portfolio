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

  function getDims() {
    const rect = fieldWrap.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }

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
    const size = Math.max(173, Math.min(317, w * 0.144));
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
    card.el.style.width = size + 'px';
    card.el.style.height = size + 'px';
    card.el.style.background = (item && item.image) ? `url('${item.image}') center/cover` : tones[card.index % tones.length];

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
    card.el.style.transform = `translate(${x}px, ${y}px)`;
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
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Surface C1 photo ${i + 1}, press Enter to view`);
    fieldWrap.appendChild(el);
    const card = { el, index: i };
    spawn(card, reduceMotion ? 'static' : undefined);
    function openThisCard() {
      // Anchor the expand to where the card actually is (FLIP), rather
      // than always growing from a fixed center point — per the "things
      // should emerge from where they came" rule, the card the person
      // just looked at is the origin, not the middle of the screen.
      const from = el.getBoundingClientRect();
      expandCard.style.background = el.style.background;
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
  function closeExpand() {
    expandVeil.classList.remove('is-active');
    expandClose.classList.remove('is-active');
    // Let it settle back to the CSS-driven resting transform (scale(0.95))
    // instead of leaving the last FLIP transform stuck in place.
    expandCard.style.transform = '';
  }
  expandVeil.addEventListener('click', closeExpand);
  expandClose.addEventListener('click', closeExpand);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeExpand(); });

  // Reduced motion: cards are already laid out in a static, fully-visible
  // band (spawned with mode 'static' above) — no drift loop, no scroll
  // lock, no recycling. The page simply scrolls normally from here.
  if (reduceMotion) return;

  let boost = 0;
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

  function tick() {
    separateCards();
    const { h } = getDims();
    cards.forEach((card) => {
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
        card.el.style.transform = `translate(${card.baseX}px, ${card.baseY}px)`;
      }
    });
    if (!unlocked) {
      progressBar.style.transform = `scaleX(${Math.min(1, seen.size / N)})`;
      if (seen.size >= N) {
        unlocked = true;
        progressWrap.classList.add('is-hidden');
      }
    }
    // Tightened from 0.94 so boost tracks the scroll that's actually
    // happening right now rather than coasting on one from a moment ago
    // — each new wheel/touch input reads as a direct, current response
    // instead of blending into a lingering trail.
    boost *= 0.88;
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
  const GESTURE_LIMIT = 3;
  let gestureCount = 0;
  let gestureActive = false;
  let gestureTimer = null;

  function forceUnlock() {
    unlocked = true;
    progressWrap.classList.add('is-hidden');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

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
          // This is the 4th gesture — let it through untouched instead of
          // capturing it, so it becomes the first real scroll of the page.
          forceUnlock();
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
      boost = Math.min(13, boost + Math.abs(e.deltaY) * 0.14);
    } else {
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
  addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    if (!unlocked) {
      if (gestureCount >= GESTURE_LIMIT) {
        forceUnlock();
      } else {
        gestureCount += 1;
      }
    }
  }, { passive: true });

  addEventListener('touchmove', (e) => {
    if (touchStartY === null) return;
    const dy = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    if (!unlocked) {
      if (dy > 0) e.preventDefault();
      boost = Math.min(13, boost + Math.abs(dy) * 0.32);
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }, { passive: false });

  addEventListener('resize', () => {
    placed.length = 0;
    cards.forEach((card) => spawn(card));
  });

  requestAnimationFrame(tick);
})();
