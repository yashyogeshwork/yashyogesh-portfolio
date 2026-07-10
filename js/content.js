/* ==========================================================================
   CONTENT.JS — THE ONE FILE YOU EDIT
   ==========================================================================
   Every piece of text on the site, and the full sketch list, lives here.
   To change anything: edit this file (directly on GitHub, or through
   admin.html which generates a new copy of this file for you), commit,
   and Netlify republishes automatically.

   RULES:
   - Keep the quotes around text: 'like this'
   - If your text contains an apostrophe, use \' like: 'it\'s great'
   - Don't remove commas at the ends of lines
   ========================================================================== */

window.CONTENT = {

  /* ---- Site-wide ---- */
  site: {
    name: 'Yash Yogesh',
    navAbout: 'About',
    navContact: 'Contact',
    footerCopyright: 'Yash Yogesh © 2026',
    footerTagline: 'Designed & built in Umeå',
  },

  /* ---- Homepage carousel ----
     One entry per project. 'href' is the page it opens.
     'bg' is the placeholder gradient shown until you set 'image'.
     To use a real image: put the file in images/ and set
     image: 'images/your-file.jpg'  (leave bg as fallback). ---- */
  home: {
    hint: 'Scroll or drag to explore',
    projects: [
      { key: 'hive',     title: 'HIVE',     href: 'hive.html',       image: '', bg: 'linear-gradient(135deg,#E8E2D5,#C9BFA8)' },
      { key: 'toad',     title: 'TOAD',     href: 'toad.html',       image: '', bg: 'linear-gradient(135deg,#DCE5D2,#AEC49A)' },
      { key: 'surface',  title: 'C1',       href: 'surface-c1.html', image: '', bg: 'linear-gradient(135deg,#E5E5E5,#C2C2C2)' },
      { key: 'sketches', title: 'SKETCHES', href: 'sketches.html',   image: '', bg: 'linear-gradient(135deg,#F5EFE5,#DCD0BC)' },
    ],
  },

  /* ---- Hive case study ---- */
  hive: {
    eyebrow: 'Hyundai — Concept',
    title: 'Hive',
    subtitle: 'What if the journey to school was the school?',
    problemHeading: 'Rural children lose hours every day just reaching school — and their parents lose just as much getting them there.',
    problemBody: 'Centralized schools serve low-density regions inefficiently. A 7 to 14 year old in the countryside may travel long distances daily, and a parent often has to leave work to manage the trip. The commute itself becomes the barrier to education, not the curriculum.',
    stat1Value: '7–14',
    stat1Label: 'Target age group',
    stat2Value: 'Low-density',
    stat2Label: 'Rural & countryside regions',
    systemHeading: "Hive isn't a redesigned bus. It's a personal pod that becomes a classroom.",
    systemBody: 'A subscription-based Hyundai service. An autonomous pod picks a child up from home, travels to a local community docking station, and connects with other pods arriving from the same area — forming a temporary, shared learning space.',
    exteriorHeading: 'Form inspired by tetrapods — load-distributing, tip-resistant, naturally interlocking.',
    exteriorBody: 'The tripod leg structure lets pods sit stably alone and connect seamlessly when docked side by side, forming a continuous corridor children can move through freely.',
    interiorHeading: 'A sensory learning environment, not a transit cabin.',
    interiorBody: "Pressure-responsive panels, a ceiling projector, and a tactile floor turn the commute into engagement rather than dead time — calm enough not to overstimulate, interactive enough to hold a child's attention.",
    nextLabel: 'Next project',
    nextTitle: 'Toyota TOAD',
  },

  /* ---- TOAD case study ---- */
  toad: {
    eyebrow: 'Toyota — Concept',
    title: 'TOAD',
    subtitle: 'A farming companion for people who never learned to farm.',
    problemHeading: 'A new generation is moving to the countryside — with remote jobs, small plots of land, and no farming knowledge at all.',
    problemBody: 'City leavers — the neo-rural generation — buy land for a slower life but keep their online work. They want to grow food, but lack the generational knowledge a farming family passes down. Existing agricultural machines assume expertise they simply don\'t have.',
    stat1Value: 'Neo-rural',
    stat1Label: 'Target generation',
    stat2Value: 'Small-plot',
    stat2Label: 'Hobby & subsistence farming',
    systemHeading: 'TOAD is not a tractor. It\'s a companion that knows the land better than its owner.',
    systemBody: 'A compact autonomous vehicle that studies the soil, the seasons, and the crops — guiding its owner through the farming year like a patient teacher, doing the heavy work, and learning the plot season after season.',
    exteriorHeading: 'Toad-inspired: low, wide, grounded — built to sit close to the earth it works.',
    exteriorBody: 'The form language borrows from the animal — a wide, stable stance, soft dome-like body, and a posture that reads as calm and approachable rather than industrial and intimidating.',
    interiorHeading: 'No cockpit. The interface is the field itself.',
    interiorBody: 'TOAD is guided through a simple companion app and on-body signals — its owner works alongside it, not inside it. Interaction is designed to teach, not just execute.',
    nextLabel: 'Next project',
    nextTitle: 'Surface C1',
  },

  /* ---- Surface C1 case study ---- */
  c1: {
    eyebrow: 'Surface Moto — Production',
    title: 'C1',
    subtitle: 'An electric commuter, taken from first sketch to the street.',
    problemHeading: 'Urban commuters needed an e-bike that felt like a product, not a prototype.',
    problemBody: 'At Surface Moto I worked on the C1 from early concept sketches through to a road-ready electric bike — the full journey of negotiating design intent against manufacturing, cost, and time.',
    stat1Value: 'Concept → Road',
    stat1Label: 'Full development cycle',
    stat2Value: 'Production',
    stat2Label: 'Real-world constraints',
    systemHeading: 'Every surface earned its shape.',
    systemBody: 'Frame geometry, battery packaging, cable routing, stance — each decision was tested against how it would actually be made, and what it would cost.',
    exteriorHeading: 'Clean volumes, honest materials.',
    exteriorBody: 'The C1\'s visual identity comes from restraint: an uncluttered frame, purposeful proportions, and details that survive from sketch to showroom.',
    interiorHeading: 'From foam models to fabrication.',
    interiorBody: 'Cut, weld, paint — the project taught me what design actually costs in the real world, and how to protect an idea through the compromises of production.',
    nextLabel: 'Next project',
    nextTitle: 'Sketches',
  },

  /* ---- Sketch wall page ---- */
  sketchwall: {
    headlineLine1: 'A 5-year sketching challenge.',
    headlineLine2: 'Imperfect. Ongoing.',
    hint: 'Move through the sketches',
    /* ---- THE SKETCH LIST ----
       Each entry is one sketch on the wall.
       - 'image': filename inside the images/sketches/ folder.
         Leave as '' to show a placeholder gradient instead.
       - 'title': shown when the sketch is opened (optional, can be '').
       To ADD a sketch: upload the image file to images/sketches/ on
       GitHub, then add a line here (or use admin.html).
       To REPLACE a sketch: upload a new file with the SAME filename —
       done, nothing else to change.
       To REMOVE: delete its line here. ---- */
    items: [
      { image: '', title: 'Sketch 01' },
      { image: '', title: 'Sketch 02' },
      { image: '', title: 'Sketch 03' },
      { image: '', title: 'Sketch 04' },
      { image: '', title: 'Sketch 05' },
      { image: '', title: 'Sketch 06' },
      { image: '', title: 'Sketch 07' },
      { image: '', title: 'Sketch 08' },
      { image: '', title: 'Sketch 09' },
      { image: '', title: 'Sketch 10' },
      { image: '', title: 'Sketch 11' },
      { image: '', title: 'Sketch 12' },
      { image: '', title: 'Sketch 13' },
      { image: '', title: 'Sketch 14' },
      { image: '', title: 'Sketch 15' },
      { image: '', title: 'Sketch 16' },
      { image: '', title: 'Sketch 17' },
      { image: '', title: 'Sketch 18' },
      { image: '', title: 'Sketch 19' },
      { image: '', title: 'Sketch 20' },
    ],
  },

  /* ---- About page ---- */
  about: {
    statement: 'I design vehicles that solve real problems for real people — and I want them to feel beautiful doing it.',
    factBasedLabel: 'Based in',
    factBasedValue: 'India → Umeå, Sweden',
    factStudyLabel: 'Studying',
    factStudyValue: 'MFA Transportation Design',
    factBackgroundLabel: 'Background',
    factBackgroundValue: 'Industrial Design, B.Des',
    factPracticeLabel: 'Practice',
    factPracticeValue: 'Daily sketching, 15 years',
    cvButton: 'Download CV',
    para1: 'I grew up drawing vehicles. Fifteen years later I\'m still sketching every single day. Somewhere along the way I stopped caring about how something looks and started caring about what it does for the person using it.',
    para2: 'I worked at Surface Moto, helping build their first electric bike from a rough concept to a road-ready prototype. That taught me what design actually costs in the real world — every decision negotiated against manufacturing, cost, and time.',
    para3: 'I\'m heading to Umeå Institute of Design because I want to think harder about the problems before I reach for the vehicle. Hive and TOAD are both attempts at that — starting from a real human tension, not a shape.',
    footerStatement: 'Let\'s talk about mobility, design, or Umeå.',
    email: 'hello@yashyogesh.com',
  },

  /* ---- Contact page ---- */
  contact: {
    statement: 'Heading to Umeå this fall. Open to conversations about mobility, design, or an internship from third semester.',
    email: 'hello@yashyogesh.com',
    linkedin: '#',
    instagram: '#',
    cv: '#',
  },
};
