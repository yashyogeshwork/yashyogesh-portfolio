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

  function rand(a, b) { return a + Math.random() * (b - a); }

  function getDims() {
    const rect = fieldWrap.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }

  function spawn(card, forceBelow) {
    const { w, h } = getDims();
    const size = Math.max(144, Math.min(264, w * 0.12));
    const others = placed.filter((p) => p.card !== card);

    function overlaps(x, y, gap) {
      const cx = x + size / 2, cy = y + size / 2, r = size / 2;
      return others.some((p) => {
        const dist = Math.hypot(cx - p.cx, cy - p.cy);
        return dist < r + p.r + Math.max(0, gap);
      });
    }

    let x, y, attempts = 0, searchExtra = 0;
    while (true) {
      attempts++;
      const gap = rand(-60, 520);
      x = rand(0, Math.max(0, w - size));
      y = forceBelow
        ? rand(h + 40, h + h * 3.1 + searchExtra)
        : rand(-h * 2.9 - searchExtra, h - size + searchExtra);
      if (!overlaps(x, y, gap)) break;
      if (attempts > 150) { searchExtra += h * 0.4; attempts = 0; }
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
    card.depth = rand(0, 1);
    card.speed = 0.42 + card.depth * 0.8;
    card.el.style.opacity = '1';
    card.el.style.left = x + 'px';
    card.el.style.top = y + 'px';
  }

  for (let i = 0; i < N; i++) {
    const el = document.createElement('div');
    el.className = 'c1-card';
    fieldWrap.appendChild(el);
    const card = { el, index: i };
    spawn(card);
    el.addEventListener('click', () => {
      expandCard.style.background = el.style.background;
      expandVeil.classList.add('is-active');
      expandClose.classList.add('is-active');
    });
    cards.push(card);
  }
  expandVeil.addEventListener('click', () => { expandVeil.classList.remove('is-active'); expandClose.classList.remove('is-active'); });
  expandClose.addEventListener('click', () => { expandVeil.classList.remove('is-active'); expandClose.classList.remove('is-active'); });

  let boost = 0;
  let recycleCount = 0;
  let unlocked = false;
  const UNLOCK_AFTER = N;

  function tick() {
    cards.forEach((card) => {
      card.baseY -= card.speed + boost * (0.4 + card.depth * 0.6);
      if (card.baseY < -260) {
        spawn(card, true);
        if (!unlocked) {
          recycleCount++;
          if (recycleCount >= UNLOCK_AFTER) unlocked = true;
        }
      } else {
        card.el.style.left = card.baseX + 'px';
        card.el.style.top = card.baseY + 'px';
      }
    });
    boost *= 0.93;
    requestAnimationFrame(tick);
  }

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  addEventListener('wheel', (e) => {
    if (!unlocked) {
      e.preventDefault();
      boost = Math.min(11, boost + Math.abs(e.deltaY) * 0.085);
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
