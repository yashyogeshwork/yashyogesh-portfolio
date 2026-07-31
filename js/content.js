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
    // 32 real campaign photos go here — empty image paths fall back to
    // placeholder tones automatically, so this works right now and just
    // starts using real photos the moment paths are added.
    heroImages: Array.from({ length: 32 }, () => ({ image: '' })),
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
    statement: 'I\'m a transportation designer. Some of what I design solves a real problem — some of it just needs to look like nothing else on the road. I care about both.',
    introPart1: 'Transportation Designer. MFA at Umeå Institute of Design.',
    introPart2: 'Open to freelance and internship opportunities.',
    factBasedLabel: 'Based in',
    factBasedValue: 'Umeå, Sweden',
    factStudyLabel: 'Studying',
    factStudyValue: 'MFA Transportation Design',
    factBackgroundLabel: 'Background',
    factBackgroundValue: '3 years, industrial & transportation design',
    cvButton: 'Download CV',
    para1: 'Transportation designer with a strong foundation in problem-solving and user-centered design. Experienced in collaborative projects across industrial design — vehicles, toys, consumer products — with a focus on translating ideas into functional, visually considered solutions.',
    para2: 'At Surface Moto, I took their first electric bike from concept to a road-ready prototype.',
    para3: 'Now at Umeå Institute of Design, sharpening how I think about mobility, systems, and the problems worth solving — working across companies and disciplines to get sharper at the part that actually matters: knowing the problem before I reach for a shape.',
    recognitionLabel: 'Recognition',
    recognition1Title: 'Real-Time Water Pollutant Monitoring System',
    recognition1Sub: 'Patent published — IN 361772001',
    recognition2Title: 'Croctus — Handheld Toy',
    recognition2Sub: 'Design patent application filed',
    recognition3Title: 'XP Pen D\'kalp Design Challenge',
    recognition3Sub: 'National winner, 2021',
    recognition4Title: 'Gravity Sketch Certified Professional & Designer',
    recognition4Sub: 'Licenses & certifications',
    skillsLabel: 'Tools & skills',
    skills: 'Rhino 3D, Keyshot, Blender, Adobe CC, Figma, Gravity Sketch, Procreate, Sketching, Prototyping, User Research',
    educationLabel: 'Education',
    edu1Degree: 'MFA Transportation Design',
    edu1School: 'Umeå Institute of Design',
    edu2Degree: 'Offsite Certification, Advanced Design',
    edu2School: 'Chicago',
    edu3Degree: "Bachelor's of Design",
    edu3School: 'IIITDM Jabalpur',
    experienceLabel: 'Experience',
    exp1Role: 'Industrial Designer, Contour (self-employed)',
    exp2Role: 'Industrial Designer, Surface Moto',
    exp3Role: 'Design Consultant, Indkal Technologies (Acer India)',
    exp4Role: 'Industrial Design Intern, SKM Design',
    noteInvite: 'Something on your mind? Write me a note.',
    footerStatement: 'Let\'s talk about mobility, design, or Umeå.',
    email: 'yashyogesh.work@gmail.com',
    linkedin: '#',
    instagram: '#',
    behance: '#',
    cv: 'yash-yogesh-cv.pdf',
  },
};
