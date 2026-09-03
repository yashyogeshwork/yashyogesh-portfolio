(() => {
  const gift = document.getElementById('aboutGift');
  const wrap = document.getElementById('aboutGiftWrap');
  const image = document.getElementById('aboutGiftImage');
  const glow = document.getElementById('aboutGiftGlow');
  if (!gift || !wrap || !image) return;

  // Set the real silver foil PNG path here once it exists (a
  // transparent-background image). Until then this stays on the
  // dark-panel CSS fallback — never a fake gradient standing in for
  // the real photo.
  const WRAPPER_IMAGE = '';
  if (WRAPPER_IMAGE) {
    image.style.backgroundImage = `url('${WRAPPER_IMAGE}')`;
    image.style.backgroundColor = 'transparent';
  }

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Hover glow — identical technique to the C1 studio gallery ----
  if (!reduceMotion) {
    wrap.addEventListener('pointerenter', () => wrap.classList.add('is-hovering'));
    wrap.addEventListener('pointerleave', () => wrap.classList.remove('is-hovering'));
    wrap.addEventListener('pointermove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      glow.style.setProperty('--mx', `${mx}%`);
      glow.style.setProperty('--my', `${my}%`);
    });
  }

  // ---- Drag to tear, then a real physical fall, not a fade ----
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let diagonal = 0;
  const OPEN_THRESHOLD = 0.5; // drag past this fraction of the diagonal to tear loose

  // A small jagged nick at the corner while dragging — just enough to
  // show something is starting to give, not the whole reveal
  // mechanic. The real "opening" is the physical fall below.
  const JAG = [3, -2, 4, -3, 2];

  function cornerNick(pct) {
    if (pct <= 0) return 'none';
    const cut = Math.min(22, pct * 40);
    const points = [`100% 0%`];
    JAG.forEach((j, i) => {
      const t = (i + 1) / (JAG.length + 1);
      points.push(`${(100 - cut * t + j * pct).toFixed(1)}% ${(cut * t).toFixed(1)}%`);
    });
    points.push(`${100 - cut}% ${cut}%`, `100% ${cut}%`);
    return `polygon(0% 0%, ${points.join(', ')}, 100% 100%, 0% 100%)`;
  }

  function begin(e) {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = gift.getBoundingClientRect();
    diagonal = Math.hypot(rect.width, rect.height);
    wrap.classList.add('is-dragging');
  }

  function move(e) {
    if (!dragging) return;
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
    const pct = Math.min(1, dist / (diagonal * OPEN_THRESHOLD));

    wrap.style.clipPath = cornerNick(pct);
    wrap.style.transform = `translate(${pct * 10}px, ${-pct * 8}px) rotate(${pct * -3}deg)`;

    if (pct >= 1) fall();
  }

  function end(e) {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('is-dragging');

    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
    const pct = dist / (diagonal * OPEN_THRESHOLD);

    if (pct >= 1) {
      fall();
    } else {
      wrap.style.clipPath = 'none';
      wrap.style.transform = 'translate(0, 0) rotate(0deg)';
    }
  }

  function fall() {
    dragging = false;
    wrap.classList.remove('is-dragging', 'is-hovering');
    wrap.classList.add('is-falling');
    // After the fall finishes, remove it from layout entirely so it
    // can't be grabbed again and doesn't sit invisibly on top of the
    // bubbles underneath.
    setTimeout(() => {
      wrap.style.display = 'none';
    }, reduceMotion ? 300 : 750);
  }

  wrap.addEventListener('pointerdown', begin);
  addEventListener('pointermove', move);
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);
})();
