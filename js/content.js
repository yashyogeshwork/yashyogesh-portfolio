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
      { key: 'hive',     title: 'HIVE',     href: 'hive.html',       image: 'images/carousel/hive.jpg', bg: 'linear-gradient(135deg,#E8E2D5,#C9BFA8)' },
      { key: 'toad',     title: 'TOAD',     href: 'toad.html',       image: 'images/carousel/toad.jpg', bg: 'linear-gradient(135deg,#DCE5D2,#AEC49A)' },
      { key: 'surface',  title: 'C1',       href: 'surface-c1.html', image: 'images/carousel/c1.jpg', bg: 'linear-gradient(135deg,#E5E5E5,#C2C2C2)' },
      { key: 'sketches', title: 'SKETCHES', href: 'sketches.html',   image: 'images/carousel/sketches.jpg', bg: 'linear-gradient(135deg,#F5EFE5,#DCD0BC)' },
    ],
  },

  /* ---- Hive case study ---- */
  hive: {
    eyebrow: 'Hyundai · Concept',
    title: 'Hive',
    subtitle: 'What if the journey to school was the school?',
    problemHeading: "School is often far from home, costing a child's energy and a parent's work hours.",
    problemBody: '',
    stat1Value: '7–14',
    stat1Label: 'Target age group',
    stat2Value: 'Low-density',
    stat2Label: 'Rural & countryside regions',
    systemHeading: 'The commute is guided learning. The destination is a shared classroom.',
    systemBody: 'Under parental oversight, a pod collects a child at home. During transit it runs calm, guided lessons instead of dead time. At a local community hub it docks with other pods arriving from nearby homes, forming a temporary group learning space.',
    exteriorHeading: 'Shaped like a tetrapod. Stable alone, built to interlock.',
    exteriorBody: 'Tetrapods distribute load, resist tipping, and interlock naturally.',
    interiorHeading: 'Calm and tactile, built to be lived in for the length of a ride.',
    interiorBody: 'Soft geometry, bench storage, and an interactive companion that travels with the child.',
    nextLabel: 'Next project',
    nextTitle: 'Toyota TOAD',
  },

  /* ---- TOAD case study ---- */
  toad: {
    heroVideo: 'videos/toad-hero.mp4',
    personaImage: 'images/toad/persona.jpg',
    systemImage: 'images/toad/system-journey.jpg',
    formImage: 'images/toad/form-inspiration.jpg',
    exteriorImage1: 'images/toad/exterior-1-concept.jpg',
    exteriorImage2: 'images/toad/exterior-2-functional.jpg',
    exteriorImage3: 'images/toad/exterior-3-package.jpg',
    exteriorImage4: 'images/toad/exterior-4-cmf.jpg',
    interiorImage1: 'images/toad/interior-1-sketches.jpg',
    interiorImage2: 'images/toad/interior-2-cmf.jpg',
    eyebrow: 'Toyota · Concept',
    title: 'TOAD',
    subtitle: 'A farming companion for people who never learned to farm.',
    problemHeading: 'Newly rural. Zero farming experience.',
    stat1Value: 'Neo-rural',
    stat1Label: 'Target generation',
    stat2Value: 'Small-plot',
    stat2Label: 'Hobby & subsistence farming',
    personaHeading: 'Digital work by day, farms by choice.',
    personaBody: 'They moved for space, not to become farmers. TOAD is built for someone with no agricultural background who still wants real results from their land.',
    systemHeading: 'Learns your land. Does the heavy work.',
    systemBody: 'It studies the soil, the seasons, and the crops, then does the physical work itself, guiding its owner through decisions instead of expecting them to already know.',
    formHeading: 'Shaped like a toad. Low and grounded.',
    formBody: 'A low, wide stance and a soft, rounded body, an animal-inspired form built to feel grounded and approachable, not industrial.',
    exteriorHeading: 'Built low, wide, and calm.',
    exteriorBody: 'Every surface reads as calm and close to the ground, built to move through a field without looking like it belongs on a construction site.',
    interiorHeading: 'No cockpit. Just the field.',
    interiorBody: "There's no cabin to sit in. TOAD is guided through a simple companion app and on-body signals, the interaction happens in the field itself, not behind a windshield.",
    nextLabel: 'Next project',
    nextTitle: 'Surface C1',
  },

  /* ---- Surface C1 case study ---- */
  c1: {
    eyebrow: 'Surface Moto · Production',
    title: 'C1',
    subtitle: 'An electric commuter, taken from first sketch to the street.',
    heroImages: [
      { image: 'images/c1/field/field-01.jpg' },
      { image: 'images/c1/field/field-02.jpg' },
      { image: 'images/c1/field/field-03.jpg' },
      { image: 'images/c1/field/field-04.jpg' },
      { image: 'images/c1/field/field-05.jpg' },
      { image: 'images/c1/field/field-06.jpg' },
      { image: 'images/c1/field/field-07.jpg' },
      { image: 'images/c1/field/field-08.jpg' },
      { image: 'images/c1/field/field-09.jpg' },
      { image: 'images/c1/field/field-10.jpg' },
      { image: 'images/c1/field/field-11.jpg' },
      { image: 'images/c1/field/field-12.jpg' },
      { image: 'images/c1/field/field-13.jpg' },
      { image: 'images/c1/field/field-14.jpg' },
      { image: 'images/c1/field/field-15.jpg' },
      { image: 'images/c1/field/field-16.jpg' },
      { image: 'images/c1/field/field-17.jpg' },
      { image: 'images/c1/field/field-18.jpg' },
      { image: 'images/c1/field/field-19.jpg' },
      { image: 'images/c1/field/field-20.jpg' },
      { image: 'images/c1/field/field-21.jpg' },
      { image: 'images/c1/field/field-22.jpg' },
      { image: 'images/c1/field/field-23.jpg' },
      { image: 'images/c1/field/field-24.jpg' },
      { image: 'images/c1/field/field-25.jpg' },
      { image: 'images/c1/field/field-26.jpg' },
      { image: 'images/c1/field/field-27.jpg' },
      { image: 'images/c1/field/field-28.jpg' },
      { image: 'images/c1/field/field-29.jpg' },
      { image: 'images/c1/field/field-30.jpg' },
      { image: 'images/c1/field/field-31.jpg' },
      { image: 'images/c1/field/field-32.jpg' },
    ],
    roleImage: 'images/c1/02-role-goal.webp',
    roleHeading: 'A debut product, from scratch.',
    roleBody: 'As the industrial designer on the team, I worked closely with stakeholders throughout the process. The goal was to make everyday urban commuting in India easier, through functional ergonomics, solid engineering, and a design language approachable enough to encourage sustainable mobility.',
    stat1Value: 'Concept → Road',
    stat1Label: 'Full development cycle',
    stat2Value: 'Production',
    stat2Label: 'Real-world constraints',
    processImage: 'images/c1/03-process-sketches.webp',
    processHeading: 'Sketching toward a direction.',
    processBody: 'The project began with broad brainstorming and sketch exploration, focused on understanding everyday urban commuting challenges and identifying a viable design direction.',
    systemImage: 'images/c1/04-design-direction.webp',
    systemHeading: 'One direction, refined.',
    systemBody: 'The concept went through rounds of iteration and evaluation before settling into a balanced design, one that prioritized ergonomics, usability, and practical performance.',
    interiorImage: 'images/c1/05-fabrication.webp',
    interiorHeading: 'From design to steel.',
    interiorBody: 'To translate the design into reality, I worked closely with manufacturers during frame fabrication, observing and taking part in cutting, drilling, and welding.',
    prototypeImage: 'images/c1/06-prototyping.webp',
    prototypeHeading: 'Testing every detail.',
    prototypeBody: 'Paint, materials, and seat ergonomics were refined through physical testing, including several 3D-printed seat prototypes to check comfort and riding posture.',
    assemblyImage: 'images/c1/07-assembly.webp',
    assemblyHeading: 'Redesigning on the floor.',
    assemblyBody: 'During hands-on assembly, component fitment issues came up that needed immediate adjustments and redesigns to keep everything compatible and built to standard.',
    showcaseImage: 'images/c1/08-showcase.webp',
    showcaseHeading: 'Tested by real riders.',
    showcaseBody: 'The functional prototype was shown publicly and tested with real users, validating ergonomics and confirming it was ready for consumer trials and early deliveries.',
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
       - 'image': full-resolution file, used for the expand (click) view.
       - 'thumb': a small, fast-loading version of the same image, used
         for the card on the wall itself. Loading 25 full-resolution
         images at once was the actual cause of page lag, thumb exists
         so the wall stays light while the expand view still opens the
         real full-res file.
       - 'ratio': the image's real width/height. Each card is sized to
         match this exactly, so nothing gets cropped and there's no
         white letterbox margin either, the card just takes the shape
         of the sketch. Recompute if you swap in an image with a
         different aspect ratio (width in px ÷ height in px).
       - 'title': shown when the sketch is opened (optional, can be '').
       Leave 'image'/'thumb' as '' to show a placeholder gradient instead.
       To ADD a sketch: upload the full image to images/sketches/ and a
       smaller copy to images/sketches/thumb/ (same filename), then add
       a line here with its real ratio.
       To REPLACE a sketch: upload new files with the SAME filenames in
       both folders, update 'ratio' if the aspect ratio changed.
       To REMOVE: delete its line here.
       All 25 files are .jpg. The originals that came in as .png were
       lossless, and at these dimensions that meant 150-600KB each, ~14MB
       total for what's supposed to be a light thumbnail set, that was
       the real cause of "this page feels laggy and slow": on an actual
       network connection (not localhost) the wall took visibly long to
       finish populating, and images kept popping in staggered and late.
       Re-encoded as JPEG (quality 85 full-res, 78 for thumbs) after
       flattening onto white, since every sketch already sits on a white
       card, cut total weight by roughly 8x (thumbs: 2.9MB -> ~500KB,
       full-res: 12MB -> ~2MB) with no visible quality loss. Keep new
       uploads as .jpg for the same reason unless an image genuinely
       needs transparency over a non-white background. ---- */
    items: [
      { image: 'images/sketches/sketch-01.jpg', thumb: 'images/sketches/thumb/sketch-01.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-02.jpg', thumb: 'images/sketches/thumb/sketch-02.jpg', ratio: 1.029, title: '' },
      { image: 'images/sketches/sketch-03.jpg', thumb: 'images/sketches/thumb/sketch-03.jpg', ratio: 1.4121, title: '' },
      { image: 'images/sketches/sketch-04.jpg', thumb: 'images/sketches/thumb/sketch-04.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-05.jpg', thumb: 'images/sketches/thumb/sketch-05.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-06.jpg', thumb: 'images/sketches/thumb/sketch-06.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-07.jpg', thumb: 'images/sketches/thumb/sketch-07.jpg', ratio: 1.0329, title: '' },
      { image: 'images/sketches/sketch-08.jpg', thumb: 'images/sketches/thumb/sketch-08.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-09.jpg', thumb: 'images/sketches/thumb/sketch-09.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-10.jpg', thumb: 'images/sketches/thumb/sketch-10.jpg', ratio: 1.62, title: '' },
      { image: 'images/sketches/sketch-11.jpg', thumb: 'images/sketches/thumb/sketch-11.jpg', ratio: 1.4379, title: '' },
      { image: 'images/sketches/sketch-12.jpg', thumb: 'images/sketches/thumb/sketch-12.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-13.jpg', thumb: 'images/sketches/thumb/sketch-13.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-14.jpg', thumb: 'images/sketches/thumb/sketch-14.jpg', ratio: 1.4304, title: '' },
      { image: 'images/sketches/sketch-15.jpg', thumb: 'images/sketches/thumb/sketch-15.jpg', ratio: 1.0863, title: '' },
      { image: 'images/sketches/sketch-16.jpg', thumb: 'images/sketches/thumb/sketch-16.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-17.jpg', thumb: 'images/sketches/thumb/sketch-17.jpg', ratio: 0.9873, title: '' },
      { image: 'images/sketches/sketch-18.jpg', thumb: 'images/sketches/thumb/sketch-18.jpg', ratio: 1.0195, title: '' },
      { image: 'images/sketches/sketch-19.jpg', thumb: 'images/sketches/thumb/sketch-19.jpg', ratio: 0.996, title: '' },
      { image: 'images/sketches/sketch-20.jpg', thumb: 'images/sketches/thumb/sketch-20.jpg', ratio: 1.004, title: '' },
      { image: 'images/sketches/sketch-21.jpg', thumb: 'images/sketches/thumb/sketch-21.jpg', ratio: 1.4417, title: '' },
      { image: 'images/sketches/sketch-22.jpg', thumb: 'images/sketches/thumb/sketch-22.jpg', ratio: 1.4379, title: '' },
      { image: 'images/sketches/sketch-23.jpg', thumb: 'images/sketches/thumb/sketch-23.jpg', ratio: 1.0, title: '' },
      { image: 'images/sketches/sketch-24.jpg', thumb: 'images/sketches/thumb/sketch-24.jpg', ratio: 1.4589, title: '' },
      { image: 'images/sketches/sketch-25.jpg', thumb: 'images/sketches/thumb/sketch-25.jpg', ratio: 1.0309, title: '' },
    ],
  },

  /* ---- About page ---- */
  about: {
    statement: 'I\'m a transportation designer. Some of what I design solves a real problem. Some of it just needs to look different from everything else on the road. I care about both.',
    introPart1: 'MFA at Umeå Institute of Design.',
    introPart2: 'Open to freelance and internship opportunities.',
    factBasedLabel: 'Based in',
    factBasedValue: 'Umeå, Sweden',
    factStudyLabel: 'Studying',
    factStudyValue: 'MFA Transportation Design',
    factBackgroundLabel: 'Background',
    factBackgroundValue: '3 years, industrial & transportation design',
    cvButton: 'Download CV',
    para1: 'Grounded in problem-solving and user-centered design, with experience across vehicles, toys, and consumer products. The focus stays the same across all of it: translating ideas into functional, visually considered solutions.',
    para2: 'At Surface Moto, I took their first electric bike from research through to a road-ready prototype, working inside real engineering and manufacturing constraints.',
    para3: 'Now at Umeå Institute of Design, sharpening how I think about mobility, systems, and the problems worth solving. Working across companies and disciplines to get sharper at the part that actually matters, knowing the problem before I reach for a shape.',
    recognitionLabel: 'Recognition',
    recognition1Title: 'Real-Time Water Pollutant Monitoring System',
    recognition1Sub: 'Patent published, IN 361772001',
    recognition2Title: 'Croctus, Handheld Toy',
    recognition2Sub: 'Design patent application filed',
    recognition3Title: 'XP Pen D\'kalp Design Challenge',
    recognition3Sub: 'National winner, 2021',
    recognition4Title: 'Gravity Sketch Certified Professional & Designer',
    recognition4Sub: 'Licenses & certifications',
    skillsLabel: 'Tools & skills',
    skills: 'Rhino 3D, Keyshot, Blender, Adobe CC, Figma, Gravity Sketch, Procreate, Sketching, Prototyping, User Research',
    educationLabel: 'Education',
    edu1Degree: 'MFA Transportation Design (current)',
    edu1School: 'Umeå Institute of Design',
    edu2Degree: 'Offsite Certification, Advanced Design',
    edu2School: 'Chicago',
    edu3Degree: 'Bachelor of Design',
    edu3School: 'IIITDM Jabalpur',
    experienceLabel: 'Experience',
    exp1Role: 'Industrial Designer, Contour (self-employed)',
    exp2Role: 'Industrial Designer, Surface Moto',
    exp3Role: 'Design Consultant, Indkal Technologies (Acer India)',
    exp4Role: 'Industrial Design Intern, SKM Design',
    footerStatement: 'Let\'s talk about mobility, design, or Umeå.',
    email: 'yashyogesh.work@gmail.com',
    linkedin: 'https://www.linkedin.com/in/yashyogesh/',
    instagram: 'https://www.instagram.com/yash.yogesh_/',
    behance: 'https://www.behance.net/yashyogesh',
    cv: 'yash-yogesh-cv.pdf',
  },
};
