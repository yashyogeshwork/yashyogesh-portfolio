// About page only: replaces the redundant nav "About" link (we're already on
// the About page) with tiny vehicle-shaped bubbles that pop themselves one at
// a time, in random order, then cycle through 5 silhouettes forever. Clicking
// the link (or reaching it via keyboard and pressing Enter) is a plain anchor
// jump to #popitStage — the real pop-it section in the footer — handled by
// the browser and the site's existing smooth-scroll CSS, no JS needed for
// that part.
//
// Shape coordinates were extracted directly from a reference image (dot
// centroid detection), not hand-drawn, so treat the cell arrays below as
// exact — don't "clean them up" without re-checking against the source.
(function () {
  var SHAPES = [
    {
      // car — narrower roof row centered over a wider body, wheels inset
      name: 'car',
      cols: 6,
      rows: 3,
      cells: [
        [1, 0], [2, 0], [3, 0], [4, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [1, 2], [4, 2]
      ]
    },
    {
      // pickup — narrow 2-dot cab hump pulled to the left, longer bed to the right
      name: 'pickup',
      cols: 6,
      rows: 3,
      cells: [
        [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [1, 2], [4, 2]
      ]
    },
    {
      // bus — a clean 7-wide rectangle, both body rows the same width, wheels inset
      name: 'bus',
      cols: 7,
      rows: 3,
      cells: [
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
        [1, 2], [5, 2]
      ]
    },
    {
      // shape 4 — full-width body row, top row missing just the last column
      name: 'shape4',
      cols: 6,
      rows: 3,
      cells: [
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [1, 2], [4, 2]
      ]
    },
    {
      // shape 5 — a diamond/kite taper: single apex, widening to a full 7-wide
      // row, then narrowing again
      name: 'shape5',
      cols: 7,
      rows: 4,
      cells: [
        [3, 0],
        [2, 1], [3, 1], [4, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
        [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]
      ]
    }
  ];

  var CELL_PX = 7;
  var POP_INTERVAL_MS = 260;
  var INITIAL_DELAY_MS = 500;
  var HOLD_MS = 2400;
  var FADE_MS = 450;

  var container = document.getElementById('navVehicleShape');
  if (!container) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Force this link to always be a same-page scroll to the pop-it section,
  // never a full navigation/reload — handled explicitly here (instead of
  // relying only on the plain "#popitStage" href) so nothing else on the
  // page (e.g. any global nav-link click handling) can hijack it into a
  // full page reload.
  var navLink = container.closest('a');
  if (navLink) {
    navLink.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var target = document.getElementById('popitStage');
      if (target) {
        target.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    });
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function renderShape(layout) {
    container.innerHTML = '';
    container.style.gridTemplateColumns = 'repeat(' + layout.cols + ', ' + CELL_PX + 'px)';
    container.style.gridTemplateRows = 'repeat(' + layout.rows + ', ' + CELL_PX + 'px)';
    return layout.cells.map(function (cell) {
      var col = cell[0];
      var row = cell[1];
      var dot = document.createElement('span');
      dot.className = 'about-bubble nav-vehicle-bubble';
      dot.style.gridColumn = String(col + 1);
      dot.style.gridRow = String(row + 1);
      container.appendChild(dot);
      return dot;
    });
  }

  async function popSequence(dots) {
    // Pop one at a time, in a freshly shuffled order every cycle, so the
    // same shape doesn't trace itself the same way twice.
    var order = shuffle(dots);
    for (var i = 0; i < order.length; i++) {
      order[i].classList.add('is-popped');
      await wait(POP_INTERVAL_MS);
    }
  }

  async function cycleShapes() {
    var i = 0;
    while (true) {
      var shape = SHAPES[i % SHAPES.length];
      var dots = renderShape(shape);

      if (reduceMotion) {
        dots.forEach(function (d) { d.classList.add('is-popped'); });
        return; // static single shape, no cycling
      }

      await wait(INITIAL_DELAY_MS);
      await popSequence(dots);
      await wait(HOLD_MS); // hold the fully-formed shape so it can actually be read

      dots.forEach(function (d) {
        d.style.transition = 'opacity ' + FADE_MS + 'ms ease, transform ' + FADE_MS + 'ms ease';
        d.style.opacity = '0';
        d.style.transform = 'scale(0.5)';
      });
      await wait(FADE_MS + 50);
      i++;
    }
  }

  cycleShapes();
})();
