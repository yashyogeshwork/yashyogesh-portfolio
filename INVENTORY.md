# INVENTORY — yashyogesh.com (build of 2026-10-05)

Prepared so the site can be rebuilt as an editable design in Figma, and later rebuilt in code from that design. Everything below was generated from the real files and from the pages as they render (HTML + `js/content.js` + CSS), not typed from memory. Text was read from the rendered pages at 1440px wide after the page scripts had run, so it is the text a visitor actually sees.

## 0. Read this first

**What this build is.** It is the working build as of 2026-10-05: the complete source I hold, including every change made in the latest sessions (concept disclaimers and years on Hive/TOAD, the rebuilt full-resolution slide images, the visible slide frames, the accessibility and link-safety fixes). **I could not verify that it is byte-for-byte what is deployed on yashyogesh.com**, because I cannot reach the live site from here and I do not know which version has been published. `MANIFEST-SHA256.txt` in this zip lists the SHA-256 hash of every file (included and not included), so whoever deploys or checks the live site can confirm any file against it.

**Paths are untouched.** Nothing was renamed, resized, re-encoded or moved. Every file in this zip is byte-identical to the working copy, at the same path.

**Image sizes.** Dimensions given are those of the full-size file in the zip. Slide images also exist in the site's file set as smaller responsive copies (`-800w`, `-1200w`, `-1600w`, `-2400w`); those are not in this zip because they are only scaled-down copies of the included full-size files.

### What is NOT in this zip, and why

| What | Files | Size | Why |
|---|---|---|---|
| smaller responsive copy of an image that IS included at full size (-800w / -1200w / -1600w / -2400w / -720w); regenerable | 109 | 17.9 MB | `images/c1/02-role-goal-v4-1200w.webp`, `images/c1/02-role-goal-v4-1600w.webp`, `images/c1/02-role-goal-v4-2400w.webp`, `images/c1/02-role-goal-v4-800w.webp`, `images/c1/03-process-sketches-v4-1200w.webp`, `images/c1/03-process-sketches-v4-1600w.webp`, … (+103 more, all listed in MANIFEST-SHA256.txt) |
| large (1100px) version of a C1 floating photo; the 600px card version IS included | 32 | 7.0 MB | `images/c1/field/field-01-lg.jpg`, `images/c1/field/field-02-lg.jpg`, `images/c1/field/field-03-lg.jpg`, `images/c1/field/field-04-lg.jpg`, `images/c1/field/field-05-lg.jpg`, `images/c1/field/field-06-lg.jpg`, … (+26 more, all listed in MANIFEST-SHA256.txt) |
| social-share preview crop (1200x630); regenerable from the hero posters | 3 | 0.6 MB | `images/og/c1.jpg`, `images/og/hive.jpg`, `images/og/toad.jpg` |
| private career research page; not part of the portfolio design | 1 | 0.3 MB | `playbook.html` |
| video file (skipped as requested; the posters are included) | 6 | 71.4 MB | `videos/hive-hero-720.mp4`, `videos/hive-hero-hq.mp4`, `videos/hive-hero.mp4`, `videos/toad-hero-720.mp4`, `videos/toad-hero-hq.mp4`, `videos/toad-hero.mp4` |
| downloadable CV (1.9 MB); not part of the design | 1 | 1.9 MB | `yash-yogesh-cv.pdf` |

**Hero videos.** Hive and TOAD each have a hero video (three encodes each: `-720`, standard and `-hq`). They are skipped as requested. Both heroes already have a poster image, so no frame had to be exported: Hive → `images/hive/hero-cover-new.jpg` (1920×1080), TOAD → `images/toad/exterior-cover-new.jpg` (1920×1080). The C1 hero and the homepage have no video.

**Why the 25 MB limit forced these choices.** The complete working copy is 123.7 MB (99 MB of it is what is listed above). With code, fonts, every full-size image and both posters included, the zip is just under 25 MB.

**Pages in this zip.** Portfolio pages: `index.html`, `about.html`, `hive.html`, `toad.html`, `surface-c1.html`, `sketches.html`, `privacy.html`, `404.html`. Also included because "all HTML" was asked for: `uid.html`, `companies.html`, `admin.html` (internal tools, not part of the portfolio design; they are not inventoried below). `playbook.html` (private research) is left out.

---

## 1. Design tokens

Source of truth: `css/variables.css` (all page CSS reads from it), `css/base.css` (shared column), `css/project.css` (project-page rhythm).

### 1.1 Colour

| Token | Value | Use |
|---|---|---|
| `--color-bg` | #FFFFFF | page background; board/slide ground |
| `--color-bg-section` | #F5F5F3 | alternate section background (every second section on project pages) |
| `--color-border` | #E8E8E5 | hairline rules (footer top, next-project top) |
| `--color-text-primary` | #111111 | text; also the only "accent" |
| `--color-text-secondary` | #707070 | secondary text, captions, labels (4.95:1 on white, 4.54:1 on #F5F5F3) |
| `--color-accent` | #111111 | monochrome: accent means emphasis, not a hue |
| `--color-status-live` | #2ECC71 | the one exception: the "currently available" green dot on About |
| `slide frame line` | rgba(17,17,17,0.09) | 1px border around every slide/board (project pages) |
| `homepage label, inactive` | #C9C6C2 | bottom label bar; the active label is #111111 |
| `homepage side-slide dim` | #111111 at 7% opacity | laid over the non-centred slides |

The site is monochrome by design. Hero text over photos/video is white (`#FFFFFF`); the C1 hero text sits on `#F5F5F3`-toned background with a soft halo of the same colour.

### 1.2 Typography

- **Family:** Plus Jakarta Sans (self-hosted in `fonts/`, Latin subset, `font-display: swap`). Weights shipped: 300 (`plus-jakarta-sans-latin-300-normal.woff2`), 400, 500, 600. Fallback stack: `-apple-system, BlinkMacSystemFont, sans-serif`.
- **Weights in use:** light 300, regular 400, medium 500, semibold 600 (`--fw-*`).
- **Heading line-height 1.1, letter-spacing −0.02em. Body line-height 1.6, letter-spacing 0.**

**Type scale by screen width** (`--fs-*`; measured as computed px at six frames):

| Token | Phone 390x844 | iPad 820x1180 | Laptop 1440x900 | Laptop 1536x702 | Desktop 1920x1080 | Monitor 2560x1440 |
|---|---|---|---|---|---|---|
| `--fs-hero` (Hero title) | 40px | 52px | 64px | 64px | 76px | 88px |
| `--fs-section` (Section heading) | 28px | 32px | 36px | 36px | 42px | 50px |
| `--fs-body` (Body) | 16px | 17px | 17px | 17px | 19px | 21px |
| `--fs-caption` (Caption / labels) | 13px | 13px | 13px | 13px | 14px | 15px |

Breakpoints in `css/variables.css`: ≤768px (phone), 769–1024px (tablet), 1025–1799px (base), ≥1800px, ≥2300px, ≥3200px (4K at 100%). Each step above 1799px scales type, spacing, width and radius proportionally.

**Text styles as rendered** (measured on the rendered pages; weights 300–600; size/line-height in px):

| Element | Phone 390 | Laptop 1440 | Desktop 1920 |
|---|---|---|---|
| Nav: logo | Plus Jakarta Sans 600 · 16px / 25.6px · ls -0.16px · #FFFFFF | Plus Jakarta Sans 600 · 17px / 27.2px · ls -0.17px · #FFFFFF | Plus Jakarta Sans 600 · 19px / 30.4px · ls -0.19px · #FFFFFF |
| Nav: link | Plus Jakarta Sans 500 · 11px / 17.6px · ls 0.22px · uppercase · #FFFFFF | Plus Jakarta Sans 500 · 13px / 20.8px · ls 0.26px · uppercase · #FFFFFF | Plus Jakarta Sans 500 · 14px / 22.4px · ls 0.28px · uppercase · #FFFFFF |
| Hero eyebrow | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.3px · uppercase · #FFFFFF | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.3px · uppercase · #FFFFFF | Plus Jakarta Sans 400 · 14px / 22.4px · ls 1.4px · uppercase · #FFFFFF |
| Hero title | Plus Jakarta Sans 500 · 36px / 36px · ls -0.72px · #FFFFFF | Plus Jakarta Sans 500 · 80px / 80px · ls -1.6px · #FFFFFF | Plus Jakarta Sans 500 · 96px / 96px · ls -1.92px · #FFFFFF |
| Hero subtitle | Plus Jakarta Sans 400 · 18px / 28.8px · ls 0 · #FFFFFF | Plus Jakarta Sans 400 · 18px / 28.8px · ls 0 · #FFFFFF | Plus Jakarta Sans 400 · 18px / 28.8px · ls 0 · #FFFFFF |
| Hero disclaimer line | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.13px · #FFFFFF | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.13px · #FFFFFF | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0.14px · #FFFFFF |
| Hero scroll cue | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.04px · uppercase · #FFFFFF | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.04px · uppercase · #FFFFFF | Plus Jakarta Sans 400 · 14px / 22.4px · ls 1.12px · uppercase · #FFFFFF |
| Section eyebrow | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.04px · uppercase · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.04px · uppercase · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 1.12px · uppercase · #707070 |
| Section heading | Plus Jakarta Sans 500 · 28px / 30.8px · ls -0.56px · #111111 | Plus Jakarta Sans 500 · 36px / 39.6px · ls -0.72px · #111111 | Plus Jakarta Sans 500 · 42px / 46.2px · ls -0.84px · #111111 |
| Section body | Plus Jakarta Sans 400 · 16px / 25.6px · ls 0 · #707070 | Plus Jakarta Sans 400 · 17px / 27.2px · ls 0 · #707070 | Plus Jakarta Sans 400 · 19px / 30.4px · ls 0 · #707070 |
| Stat label | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.52px · uppercase · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.52px · uppercase · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0.56px · uppercase · #707070 |
| Stat value | Plus Jakarta Sans 500 · 20px / 32px · ls -0.2px · #111111 | Plus Jakarta Sans 500 · 20px / 32px · ls -0.2px · #111111 | Plus Jakarta Sans 500 · 20px / 32px · ls -0.2px · #111111 |
| Problem statement (Hive) | Plus Jakarta Sans 400 · 16px / 25.6px · ls 0 · #111111 | Plus Jakarta Sans 400 · 17px / 27.2px · ls 0 · #111111 | Plus Jakarta Sans 400 · 19px / 30.4px · ls 0 · #111111 |
| Board statement (Hive) | Plus Jakarta Sans 400 · 16px / 25.6px · ls 0 · #111111 | Plus Jakarta Sans 400 · 17px / 27.2px · ls 0 · #111111 | Plus Jakarta Sans 400 · 19px / 30.4px · ls 0 · #111111 |
| Next project: label | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.04px · uppercase · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.04px · uppercase · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 1.12px · uppercase · #707070 |
| Next project: title | Plus Jakarta Sans 500 · 36px / 57.6px · ls -0.72px · #111111 | Plus Jakarta Sans 500 · 56px / 89.6px · ls -1.12px · #111111 | Plus Jakarta Sans 500 · 56px / 89.6px · ls -1.12px · #111111 |
| Next project: hint | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0 · #111111 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0 · #111111 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0 · #111111 |
| Next project: back to home | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0 · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0 · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0 · #707070 |
| Footer text | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.26px · uppercase · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.26px · uppercase · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0.28px · uppercase · #707070 |
| Image credit line (C1) | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.13px · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.13px · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0.14px · #707070 |
| About: greeting | Plus Jakarta Sans 500 · 20px / 32px · ls -0.4px · #111111 | Plus Jakarta Sans 500 · 30px / 48px · ls -0.6px · #111111 | Plus Jakarta Sans 500 · 30px / 48px · ls -0.6px · #111111 |
| About: statement | Plus Jakarta Sans 500 · 24px / 32.4px · ls -0.48px · #111111 | Plus Jakarta Sans 500 · 28px / 37.8px · ls -0.56px · #111111 | Plus Jakarta Sans 500 · 34px / 45.9px · ls -0.68px · #111111 |
| About: intro line | Plus Jakarta Sans 400 · 16px / 25.6px · ls 0 · #707070 | Plus Jakarta Sans 400 · 17px / 27.2px · ls 0 · #707070 | Plus Jakarta Sans 400 · 19px / 30.4px · ls 0 · #707070 |
| About: fact label | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.65px · uppercase · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0.65px · uppercase · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0.7px · uppercase · #707070 |
| About: fact value | Plus Jakarta Sans 500 · 16px / 25.6px · ls 0 · #111111 | Plus Jakarta Sans 500 · 17px / 27.2px · ls 0 · #111111 | Plus Jakarta Sans 500 · 19px / 30.4px · ls 0 · #111111 |
| About: recognition label | Plus Jakarta Sans 500 · 13px / 14.3px · ls 1.04px · uppercase · #707070 | Plus Jakarta Sans 500 · 13px / 14.3px · ls 1.04px · uppercase · #707070 | Plus Jakarta Sans 500 · 14px / 15.4px · ls 1.12px · uppercase · #707070 |
| About: recognition title | Plus Jakarta Sans 500 · 16px / 21.6px · ls 0 · #111111 | Plus Jakarta Sans 500 · 17px / 22.95px · ls 0 · #111111 | Plus Jakarta Sans 500 · 19px / 25.65px · ls 0 · #111111 |
| About: recognition sub | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0 · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0 · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0 · #707070 |
| About: skills list | Plus Jakarta Sans 400 · 16px / 25.6px · ls 0 · #707070 | Plus Jakarta Sans 400 · 17px / 27.2px · ls 0 · #707070 | Plus Jakarta Sans 400 · 19px / 30.4px · ls 0 · #707070 |
| About: email link | Plus Jakarta Sans 500 · 16px / 25.6px · ls 0 · #111111 | Plus Jakarta Sans 500 · 17px / 27.2px · ls 0 · #111111 | Plus Jakarta Sans 500 · 19px / 30.4px · ls 0 · #111111 |
| About: reaction label | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0 · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 0 · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 0 · #707070 |
| Home: name mark | Plus Jakarta Sans 500 · 16px / 25.6px · ls 0.16px · #111111 | Plus Jakarta Sans 500 · 17px / 27.2px · ls 0.17px · #111111 | Plus Jakarta Sans 500 · 19px / 30.4px · ls 0.19px · #111111 |
| Home: About link | Plus Jakarta Sans 500 · 13px / 20.8px · ls 1.56px · uppercase · #111111 | Plus Jakarta Sans 500 · 13px / 20.8px · ls 1.56px · uppercase · #111111 | Plus Jakarta Sans 500 · 14px / 22.4px · ls 1.68px · uppercase · #111111 |
| Home: project label | Plus Jakarta Sans 500 · 11px / normal · ls 1.54px · uppercase · #C9C6C2 | Plus Jakarta Sans 500 · 13px / normal · ls 1.82px · uppercase · #C9C6C2 | Plus Jakarta Sans 500 · 14px / normal · ls 1.96px · uppercase · #C9C6C2 |
| Home: hint | Plus Jakarta Sans 400 · 11px / 17.6px · ls 1.32px · uppercase · #707070 | Plus Jakarta Sans 400 · 11px / 17.6px · ls 1.32px · uppercase · #707070 | Plus Jakarta Sans 400 · 11px / 17.6px · ls 1.32px · uppercase · #707070 |
| Sketches: name mark | Plus Jakarta Sans 500 · 16px / 25.6px · ls 0.16px · #111111 | Plus Jakarta Sans 500 · 17px / 27.2px · ls 0.17px · #111111 | Plus Jakarta Sans 500 · 19px / 30.4px · ls 0.19px · #111111 |
| Sketches: headline line 1 | Plus Jakarta Sans 500 · 28px / 32.2px · ls -0.56px · #111111 | Plus Jakarta Sans 500 · 56px / 64.4px · ls -1.12px · #111111 | Plus Jakarta Sans 500 · 56px / 64.4px · ls -1.12px · #111111 |
| Sketches: headline line 2 | Plus Jakarta Sans 500 · 28px / 32.2px · ls -0.56px · #707070 | Plus Jakarta Sans 500 · 56px / 64.4px · ls -1.12px · #707070 | Plus Jakarta Sans 500 · 56px / 64.4px · ls -1.12px · #707070 |
| Privacy: h1 | Plus Jakarta Sans 500 · 28px / 30.8px · ls -0.56px · #111111 | Plus Jakarta Sans 500 · 36px / 39.6px · ls -0.72px · #111111 | Plus Jakarta Sans 500 · 42px / 46.2px · ls -0.84px · #111111 |
| Privacy: h2 | Plus Jakarta Sans 600 · 18px / 19.8px · ls -0.36px · #111111 | Plus Jakarta Sans 600 · 18px / 19.8px · ls -0.36px · #111111 | Plus Jakarta Sans 600 · 18px / 19.8px · ls -0.36px · #111111 |
| Privacy: paragraph | Plus Jakarta Sans 400 · 16px / 25.6px · ls 0 · #707070 | Plus Jakarta Sans 400 · 17px / 27.2px · ls 0 · #707070 | Plus Jakarta Sans 400 · 19px / 30.4px · ls 0 · #707070 |
| 404: eyebrow | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.04px · uppercase · #707070 | Plus Jakarta Sans 400 · 13px / 20.8px · ls 1.04px · uppercase · #707070 | Plus Jakarta Sans 400 · 14px / 22.4px · ls 1.12px · uppercase · #707070 |
| 404: heading | Plus Jakarta Sans 500 · 28px / 30.8px · ls -0.56px · #111111 | Plus Jakarta Sans 500 · 36px / 39.6px · ls -0.72px · #111111 | Plus Jakarta Sans 500 · 42px / 46.2px · ls -0.84px · #111111 |
| 404: link | Plus Jakarta Sans 500 · 16px / 25.6px · ls 0 · #111111 | Plus Jakarta Sans 500 · 17px / 27.2px · ls 0 · #111111 | Plus Jakarta Sans 500 · 19px / 30.4px · ls 0 · #111111 |

**Nav colour states:** on Hive and TOAD the nav text is white over the hero and turns #111111 once the nav becomes a white bar with a hairline after scrolling; on C1 the nav stays transparent with dark text (with a soft halo over the drifting photos); on About, Privacy and 404 it is a white bar from the start.


(`ls` = letter-spacing. Colours shown are the computed colour; white text on photos appears as `#FFFFFF` or a near-white at reduced opacity. The statement widths below are in `em`, so they scale with the text size.)

### 1.3 Layout, widths and frames

- **Site max width** (`--site-max-width`): 1440px base · 1920px ≥1800 · 2240px ≥2300 · 3000px ≥3200.
- **Content (text) max width** (`--content-max-width`): 720px base · 840px ≥1800 · 960px ≥2300 · 1240px ≥3200. Used for body text, headings, stat rows.
- **Side padding** (`--side-padding-desktop`): 64px base · 40px tablet (769–1024) · 24px phone (≤768) · 96px ≥1800 · 128px ≥2300 · 160px ≥3200.
- **Radius** (`--radius-image`): 12px base · 14px ≥1800 · 16px ≥2300 · 20px ≥3200 (pill 999px, small 6px).
- **Hairline rules** use `--color-border` (#E8E8E5), 1px.

**Project pages and About share ONE column**, set in `css/base.css`:

`max-width = min( --site-max-width , (100svh − 16px) × 1.846 + 2 × --side-padding-desktop )`

That means the column width depends on the **window height** as well as the width (1.846 is the slide artboard shape, 3840×2080). On a short laptop screen the column is narrower than the site max. Measured results (project pages):

| Frame | Column (container) width | Text area inside padding | Left edge | Side padding | Section padding top / bottom | Hero height | Nav height |
|---|---|---|---|---|---|---|---|
| Phone 390x844 | 390px | 342px | 0px | 24px | 48px / 48px | 844px | 58px |
| iPad 820x1180 | 820px | 740px | 0px | 40px | 48px / 48px | 1180px | 59px |
| Laptop 1440x900 | 1440px | 1312px | 0px | 64px | 63.36px / 63.36px | 900px | 59px |
| Laptop 1536x702 | 1394px | 1266px | 71px | 64px | 67.584px / 67.584px | 702px | 59px |
| Desktop 1920x1080 | 1920px | 1728px | 0px | 96px | 84.48px / 84.48px | 1080px | 62px |
| Monitor 2560x1440 | 2240px | 1984px | 160px | 128px | 96px / 96px | 1440px | 66px |

Recommended Figma frames: 390×844 (phone), 820×1180 (iPad), 1440×900 (laptop), 1920×1080 (desktop), 2560×1440 (large monitor).

### 1.4 Spacing

**Spacing scale** (`--space-1…7`): 8 · 16 · 24 · 40 · 64 · 96 · 160px at base; ≥1800px: 8 · 16 · 24 · 48 · 80 · 120 · 192; ≥2300px: 8 · 16 · 24 · 56 · 88 · 136 · 224; ≥3200px: 8 · 16 · 24 · 72 · 112 · 176 · 288.

**Project-page rhythm** (`css/project.css`) — one system for Hive, TOAD and C1. All three scale smoothly with width (no breakpoint jumps):

| Token | Formula | Meaning |
|---|---|---|
| `--cs-pad` | `clamp(48px, 4.4vw, 96px)` | padding above and below the content of every section |
| `--cs-gap-text` | `clamp(40px, 5vw, 96px)` | text → the slide it introduces |
| `--cs-gap-slide` | `clamp(56px, 8vw, 160px)` | slide → slide |
| caption gap | `clamp(24px, 1.6vw, 40px)` | slide → its caption/statement/credit (sits close, belongs to the slide) |
| next-project block | padding `--cs-pad` top and bottom | |
| footer (project pages) | padding-top `--space-4` | |

**Measured gaps** (rendered, in px):

| Frame | text → slide | slide → slide | slide → caption | section padding (top/bottom) |
|---|---|---|---|---|
| Phone 390x844 | 40 | 56 | 24 | 48px / 48px |
| iPad 820x1180 | 41 | 66 | 24 | 48px / 48px |
| Laptop 1440x900 | 72 | 115 | 24 | 63.36px / 63.36px |
| Laptop 1536x702 | 77 | 123 | 25 | 67.584px / 67.584px |
| Desktop 1920x1080 | 96 | 154 | 31 | 84.48px / 84.48px |
| Monitor 2560x1440 | 96 | 160 | 40 | 96px / 96px |

**Slide frame (every slide/board on project pages):** 1px solid `rgba(17,17,17,0.09)`, white ground, `--radius-image` corners, full container width. Slide height = width ÷ the slide's own aspect ratio (listed per image below).

**Statements on Hive:** left-aligned in the text column; the problem statement's width is `min(100%, 52em)` (two lines on desktop), the board statement's `min(100%, 72em)` (one line on desktop). They wrap normally on phones.

**Homepage geometry** (4 slides in a bowed full-width "cinema" strip; slide ratio 1.487:1; side slides dimmed; gap between slides = 10% of the window width). Measured centre/next slide:

| Frame | Strip top / height | Centre slide x, width × height | Next slide x |
|---|---|---|---|
| Phone 390x844 | 317 / 210px | x 39, 312×210 | x -292 |
| iPad 820x1180 | 369 / 441px | x 82, 656×441 | x -615 |
| Laptop 1440x900 | 198 / 504px | x 346, 749×504 | x -547 |
| Laptop 1536x702 | 133 / 435px | x 444, 647×435 | x -356 |
| Desktop 1920x1080 | 205 / 670px | x 462, 996×670 | x -726 |
| Monitor 2560x1440 | 274 / 893px | x 616, 1328×893 | x -967 |

(Strip curve: the strip's top and bottom edges bow — a clip path `M 0,.025 Q .5,.095 1,.025 L 1,.975 Q .5,.905 0,.975 Z` in bounding-box units.)

**Motion tokens:** easing `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-cinematic`); durations 0.6s standard, 0.3s hover. No bounce or overshoot anywhere; the homepage carousel uses a critically damped spring (response about 0.6s).

---

## 2. Pages, section by section, in scroll order

Notation: **text** items show the element's role, the `js/content.js` key it comes from when it has one (`data-c`), and the exact text. **IMAGE** items show the file, its pixel size, its aspect ratio, whether it is in this zip, and what it is. Section positions are at a 1440×900 window. Elements marked *(screen-reader only)* are not visible.


### Homepage — `index.html`

Browser title: "Yash Yogesh · Transportation Designer Portfolio" · full page height at 1440×900: 900px


#### Skip link (hidden until keyboard focus)

Background #FFFFFF · top -100px · height 47px · `<a class="skip-link">`

- **(skip link, visually hidden until focused)**: "Skip to studio"

#### Page heading (screen-reader only)

Background #FFFFFF · top -1px · height 1px · `<h1 class="sr-only">`

- **(H1, screen-reader only)** *(screen-reader only)*: "Yash Yogesh, Transportation Designer, MFA at Umeå Institute of Design"

#### Top frame (name + About link)

Background #FFFFFF · top 0px · height 103px · `<header class="studio-frame-top">`

- **name (top centre)** (`site.name`): "Yash Yogesh"
- **About link (top right)** (`site.navAbout`): "About"

#### Carousel stage (4 slides)

Background #FFFFFF · top 0px · height 900px · `<main class="studio-stage">`

- **IMAGE** `images/carousel/hive.jpg` — 1529×1029 (1.486:1) — in zip: yes — HOMEPAGE CAROUSEL SLIDE (HIVE) — set by script from `home.projects` key `hive` (title "HIVE", links to `hive.html`)
- **IMAGE** `images/carousel/toad.jpg` — 1527×1030 (1.483:1) — in zip: yes — HOMEPAGE CAROUSEL SLIDE (TOAD) — set by script from `home.projects` key `toad` (title "TOAD", links to `toad.html`)
- **IMAGE** `images/carousel/c1.jpg` — 1600×1075 (1.488:1) — in zip: yes — HOMEPAGE CAROUSEL SLIDE (C1) — set by script from `home.projects` key `surface` (title "C1", links to `surface-c1.html`)
- **IMAGE** `images/carousel/sketches.jpg` — 1532×1027 (1.492:1) — in zip: yes — HOMEPAGE CAROUSEL SLIDE (SKETCHES) — set by script from `home.projects` key `sketches` (title "SKETCHES", links to `sketches.html`)

#### Label bar (bottom)

Background #FFFFFF · top 801px · height 24px · `<div class="studio-label-bar" id="studioLabelBar">`

- **project label (bottom bar)**: "HIVE"
- **project label (bottom bar)**: "TOAD"
- **project label (bottom bar)**: "C1"
- **project label (bottom bar)**: "SKETCHES"

#### Hint line (bottom)

Background #FFFFFF · top 855px · height 18px · `<div class="studio-hint" id="studioHint">`

- **hint line** (`home.hint`): "Scroll or drag to explore"

### About — `about.html`

Browser title: "About · Yash Yogesh" · full page height at 1440×900: 3533px


#### Skip link (hidden until keyboard focus)

Background #FFFFFF · top -100px · height 47px · `<a class="skip-link">`

- **(skip link, visually hidden until focused)**: "Skip to content"

#### Navigation bar

Background #FFFFFF · top 0px · height 60px · `<nav class="site-nav" id="siteNav">`

- **nav: name** (`site.name`): "Yash Yogesh"
- **span.sr-only** *(screen-reader only)*: "Jump to the pop-it easter egg at the bottom of the page"

#### About — hero (greeting + statement)

Background #FFFFFF · top 0px · height 900px · `<section class="about-hero" id="main">`

- **div.about-greeting**: "Namaste"
- **IMAGE** `images/yash-portrait.jpg` — 1000×1000 (1.000:1) — in zip: yes — PORTRAIT (black and white), About page — set by script
- **h1.about-statement** (`about.statement`): "I'm a transportation designer. Some of what I design solves a real problem. Some of it just needs to look different from everything else on the road. I care about both."
- **p.about-intro-line** (`about.introPart1`): "MFA at Umeå Institute of Design."
- **span** (`about.introPart2`): "Open to freelance and internship opportunities."
- **a.about-email.accent-underline** (`about.email`): "yashyogesh.work@gmail.com"

#### About — body (portrait, facts, recognition, skills)

Background #FFFFFF · top 900px · height 1336px · `<section class="about-body">`

- **div.about-fact-label** (`about.factBasedLabel`): "Based in"
- **div.about-fact-value** (`about.factBasedValue`): "Umeå, Sweden"
- **div.about-fact-live**: "10:38 local time"
- **div.about-fact-label** (`about.factStudyLabel`): "Studying"
- **div.about-fact-value** (`about.factStudyValue`): "MFA Transportation Design"
- **div.about-fact-label** (`about.factBackgroundLabel`): "Background"
- **div.about-fact-value** (`about.factBackgroundValue`): "3 years, industrial & transportation design"
- **a.about-cv**: "Download CV"
- **p** (`about.para1`): "Grounded in problem-solving and user-centred design, with experience across vehicles, toys, and consumer products. The focus stays the same across all of it: translating ideas into functional, visually considered solutions."
- **p** (`about.para2`): "At Surface Moto, I took their first electric bike from research through to a road-ready prototype, working inside real engineering and manufacturing constraints."
- **p** (`about.para3`): "Now at Umeå Institute of Design, sharpening how I think about mobility, systems, and the problems worth solving. Working across companies and disciplines to get sharper at the part that actually matters, knowing the problem before I reach for a shape."
- **h2.about-recognition-label** (`about.educationLabel`): "Education"
- **span.about-recognition-title** (`about.edu1Degree`): "MFA Transportation Design (current)"
- **span.about-recognition-sub** (`about.edu1School`): "Umeå Institute of Design"
- **span.about-recognition-title** (`about.edu3Degree`): "Bachelor of Design"
- **span.about-recognition-sub** (`about.edu3School`): "IIITDM Jabalpur"
- **span.about-recognition-title** (`about.edu2Degree`): "Offsite Certification, Advanced Design"
- **span.about-recognition-sub** (`about.edu2School`): "Chicago"
- **h2.about-recognition-label** (`about.experienceLabel`): "Experience"
- **span.about-recognition-title** (`about.exp1Role`): "Industrial Designer, Contour (self-employed)"
- **span.about-recognition-title** (`about.exp2Role`): "Industrial Designer, Surface Moto"
- **span.about-recognition-title** (`about.exp3Role`): "Design Consultant, Indkal Technologies (Acer India)"
- **span.about-recognition-title** (`about.exp4Role`): "Industrial Design Intern, SKM Design"
- **h2.about-recognition-label** (`about.recognitionLabel`): "Recognition"
- **span.about-recognition-title** (`about.recognition1Title`): "Real-Time Water Pollutant Monitoring System"
- **span.about-recognition-sub** (`about.recognition1Sub`): "Patent published, IN 361772001"
- **span.about-recognition-title** (`about.recognition2Title`): "Croctus, Handheld Toy"
- **span.about-recognition-sub** (`about.recognition2Sub`): "Design patent application filed"
- **span.about-recognition-title** (`about.recognition3Title`): "XP Pen D'kalp Design Challenge"
- **span.about-recognition-sub** (`about.recognition3Sub`): "National winner, 2021"
- **span.about-recognition-title** (`about.recognition4Title`): "Gravity Sketch Certified Professional & Designer"
- **span.about-recognition-sub** (`about.recognition4Sub`): "Licenses & certifications"
- **h2.about-recognition-label** (`about.skillsLabel`): "Tools & skills"
- **p.about-skills-list** (`about.skills`): "Rhino 3D, KeyShot, Blender, Adobe CC, Figma, Gravity Sketch, Procreate, Sketching, Prototyping, User Research"

#### About — reactions and message form

Background #FFFFFF · top 2236px · height 400px · `<section class="about-react-section">`

- **div.about-react-label**: "Seen the work? React, anonymously, unless you want to say who you are."
- **label**: "Don't fill this out if you're human:"
- **span**: "Loved this"
- **span**: "Solid work"
- **span**: "Needs improvement"
- **span**: "Not convinced"
- **button.about-react-submit**: "Send"

#### Footer

Background #FFFFFF · top 2636px · height 897px · `<footer class="site-footer">`

- **div.about-popit-label**: "fun"
- **div.about-popit-count**: "Visitors have popped 12,480 bubbles"
- **button.about-popit-btn**: "Reset"
- **button.about-popit-btn**: "Next"
- **button.about-popit-btn**: "More fun"
- **h2.footer-statement** (`about.footerStatement`): "Let's talk about mobility, design, or Umeå."
- **a.footer-link** (`about.email`): "yashyogesh.work@gmail.com"
- **a.footer-link**: "LinkedIn"
- **a.footer-link**: "Instagram"
- **a.footer-link**: "Behance"
- **footer text**: "Yash Yogesh © 2026"
- **footer text**: "Designed & built in Umeå"
- **footer email link**: "Privacy"

**Other things on About that are drawn by script (no image files):** the rotating greeting (words in order: Hej, Hello, Namaste, Nihao, Guten Tag, 안녕하세요, Ciao, こんにちは, Bonjour, Hola; changes every 2s, stays on "Hello" under Reduce Motion); the two eyes that follow the cursor; the pop-it toy (a grid of bubbles shaped as 12 vehicles: scooter, rickshaw, car, JCB, bus, train, pickup, tank, helicopter, ambulance, submarine, snowmobile; defined in `js/vehicle-shapes-data.js`); the little vehicle in the nav. The portrait is a normal `<img>`.


### Hive — `hive.html`

Browser title: "Hive · Yash Yogesh" · full page height at 1440×900: 9719px


#### Skip link (hidden until keyboard focus)

Background #FFFFFF · top -100px · height 47px · `<a class="skip-link">`

- **(skip link, visually hidden until focused)**: "Skip to content"

#### Navigation bar

Background #FFFFFF · top 0px · height 59px · `<nav class="site-nav" id="siteNav">`

- **nav: name** (`site.name`): "Yash Yogesh"
- **nav: link**: "About"

#### Hero

Background #F5F5F3 · top 0px · height 900px · `<section class="project-intro gradient-overlay-vignette" id="main">`

- **IMAGE** `images/hive/hero-cover-new.jpg` — 1920×1080 (1.778:1) — in zip: yes — HERO POSTER (still shown before/under the hero video): three pods outside a white building, children at the hedge — set by script
- **VIDEO** (autoplay, muted, loops) — poster: `images/hive/hero-cover-new.jpg` — 1920×1080 (1.778:1) — in zip: yes — HERO POSTER (still shown before/under the hero video): three pods outside a white building, children at the hedge — poster — sources (NOT in zip): `videos/hive-hero-720.mp4` ((max-width: 768px)); `videos/hive-hero-hq.mp4` ((min-width: 1800px)); `videos/hive-hero.mp4`
- **hero eyebrow** (`hive.eyebrow`): "Personal concept · 2040"
- **hero title (H1)** (`hive.title`): "Hive"
- **hero subtitle** (`hive.subtitle`): "What if the journey to school was the school?"
- **hero disclaimer line** (`hive.disclaimer`): "Personal concept project. Not affiliated with Hyundai."
- **hero scroll cue**: "Scroll"

#### Section 1 — The problem

Background #FFFFFF · top 900px · height 957px · `<section class="cs-section">`

- **section eyebrow**: "The problem"
- **section heading (H2)** (`hive.problemHeading`): "School is often far from home, costing a child's energy and a parent's work hours."
- **stat value** (`hive.stat1Value`): "7–14"
- **stat label** (`hive.stat1Label`): "Target age group"
- **stat value** (`hive.stat2Value`): "Low-density"
- **stat label** (`hive.stat2Label`): "Rural & countryside regions"
- **IMAGE** `images/hive/p2-problem-collage-full-v4.jpg` — 3518×1238 (2.842:1) — in zip: yes — COLLAGE: low-density regions illustration + three photos in two clusters, with baked-in labels — `<img>` 3518×1238 attr; shown at 1310×461 (1440 frame); alt: "Problem collage: rural roads and farmland showing low density regions, a father walking his son to catch the bus, a child looking out a bus window, and a parent seeing a child onto the school bus"
- **problem statement**: "How might we enable children aged 7 to 14 to access daily education independently in low-density regions, where long commute times to centralized schools result in travel-related fatigue?"

#### Section 2 — The system

Background #F5F5F3 · top 1857px · height 1183px · `<section class="cs-section cs-section-alt">`

- **section eyebrow**: "The system"
- **section heading (H2)** (`hive.systemHeading`): "The commute is guided learning. The destination is a shared classroom."
- **body text** (`hive.systemBody`): "Under parental oversight, a pod collects a child at home. During transit it runs calm, guided lessons instead of dead time. At a local community hub it docks with other pods arriving from nearby homes, forming a temporary group learning space."
- **IMAGE** `images/hive/board-journey-v4.jpg` — 3840×2081 (1.845:1) — in zip: yes — BOARD: user journey (Departure / Transit / Collective learning), watercolour illustration — `<img>` 3840×2081 attr; shown at 1310×710 (1440 frame); alt: "User journey: departure from home, transit with guided learning, and collective learning once pods dock at a community hub"
- **board statement (caption under the board)**: "Hive functions as a mobility system and a temporary community-based learning space."

#### Section 3 — Exterior

Background #FFFFFF · top 3040px · height 3508px · `<section class="cs-section">`

- **section eyebrow**: "Exterior"
- **section heading (H2)** (`hive.exteriorHeading`): "Shaped like a tetrapod. Stable alone, built to interlock."
- **IMAGE** `images/hive/board-exterior-ideation-v4.jpg` — 1896×1027 (1.846:1) — in zip: yes — BOARD: exterior ideation (rejected van concepts, tetrapod form inspiration, pods side by side). Master only 1800px wide; contains the typo "Concpets" — `<img>` 1896×1027 attr; shown at 1310×710 (1440 frame); alt: "Exterior ideation: rejected modular van concepts, tetrapod form inspiration, and pods connecting side by side"
- **IMAGE** `images/hive/board-exterior-final-v4.jpg` — 3840×2081 (1.845:1) — in zip: yes — BOARD: final exterior sketches with two reference photos and baked-in notes — `<img>` 3840×2081 attr; shown at 1310×710 (1440 frame); alt: "Final exterior: form evolution, grid based light for non verbal interaction, free movement between docked pods, and a door that retracts into the body"
- **IMAGE** `images/hive/board-cmf-package-v4.jpg` — 3840×2080 (1.846:1) — in zip: yes — BOARD (photo): CMF swatches + packaging drawings beside a render of the pod with two children (edge-to-edge) — `<img>` 3840×2080 attr; shown at 1310×710 (1440 frame); alt: "CMF materials: tactile, neutral, grounded, childsafe. Package drawing sized against an eleven year old, with two children posing at the front of the pod"
- **IMAGE** `images/hive/p7-home-departure-v4.jpg` — 1800×975 (1.846:1) — in zip: yes — RENDER (photo): pod at a house, child boarding; "Home departure" caption baked in (edge-to-edge). Master only 1800px wide — `<img>` 1800×975 attr; shown at 1278×692 (1440 frame); alt: "A child stepping into a Hive pod parked outside a stone cottage, home departure"

#### Section 4 — Interior

Background #F5F5F3 · top 6548px · height 2719px · `<section class="cs-section cs-section-alt">`

- **section eyebrow**: "Interior"
- **section heading (H2)** (`hive.interiorHeading`): "A space that feels like the child's own."
- **body text** (`hive.interiorBody`): "Soft, rounded surfaces and warm materials make the ride feel calm and safe. Touch panels, a responsive floor and projected lessons turn the trip into time to play and learn."
- **IMAGE** `images/hive/board-interior-v4.jpg` — 1970×1067 (1.846:1) — in zip: yes — BOARD: interior sketches (seats, storage, interactive companion). Master only 1800px wide — `<img>` 1970×1067 attr; shown at 1310×710 (1440 frame); alt: "Interior ideation: soft geometry, bench storage, seating studies, and an interactive companion"
- **IMAGE** `images/hive/board-sensory-v4.jpg` — 3840×2080 (1.846:1) — in zip: yes — BOARD: interactive sensory learning (illustration with photo inserts, blue gradient header) — `<img>` 3840×2080 attr; shown at 1310×710 (1440 frame); alt: "Interactive sensory learning: projected learning space, pressure responsive sensory panels, and a tactile responsive floor"
- **IMAGE** `images/hive/board-cmf-interior-v4.jpg` — 1800×975 (1.846:1) — in zip: yes — BOARD (photo): interior CMF flat-lay beside a child reading in the pod (edge-to-edge). Master only 1800px wide — `<img>` 1800×975 attr; shown at 1310×710 (1440 frame); alt: "Interior material study: calm, tactile, inhabitable, child friendly, and a child reading inside the pod"

#### Next project

Background #FFFFFF · top 9267px · height 350px · `<section class="cs-next">`

- **next-project label** (`hive.nextLabel`): "Next project"
- **next-project title (underlined on hover)** (`hive.nextTitle`): "TOAD"
- **next-project hint**: "Scroll or click"
- **back-to-home link**: "Back to home"

#### Footer

Background #FFFFFF · top 9617px · height 102px · `<footer class="site-footer">`

- **footer text**: "Yash Yogesh © 2026"
- **footer email link** (`about.email`): "yashyogesh.work@gmail.com"

#### Page-level control

Background #FFFFFF · top 840px · height 35px · `<button class="progress-ring">`


### TOAD — `toad.html`

Browser title: "TOAD · Yash Yogesh" · full page height at 1440×900: 10283px


#### Skip link (hidden until keyboard focus)

Background #FFFFFF · top -100px · height 47px · `<a class="skip-link">`

- **(skip link, visually hidden until focused)**: "Skip to content"

#### Navigation bar

Background #FFFFFF · top 0px · height 59px · `<nav class="site-nav" id="siteNav">`

- **nav: name** (`site.name`): "Yash Yogesh"
- **nav: link**: "About"

#### Hero

Background #F5F5F3 · top 0px · height 900px · `<section class="project-intro gradient-overlay-vignette" id="main">`

- **IMAGE** `images/toad/exterior-cover-new.jpg` — 1920×1080 (1.778:1) — in zip: yes — HERO POSTER (still shown before/under the hero video): farmer walking past TOAD loaded with carrots on a muddy field — set by script
- **VIDEO** (autoplay, muted, loops) — poster: `images/toad/exterior-cover-new.jpg` — 1920×1080 (1.778:1) — in zip: yes — HERO POSTER (still shown before/under the hero video): farmer walking past TOAD loaded with carrots on a muddy field — poster — sources (NOT in zip): `videos/toad-hero-720.mp4` ((max-width: 768px)); `videos/toad-hero-hq.mp4` ((min-width: 1800px)); `videos/toad-hero.mp4`
- **hero eyebrow** (`toad.eyebrow`): "Personal concept · 2030"
- **hero title (H1)** (`toad.title`): "TOAD"
- **hero subtitle** (`toad.subtitle`): "A farming companion for people who never learned to farm."
- **hero disclaimer line** (`toad.disclaimer`): "Personal concept project. Not affiliated with Toyota."
- **hero scroll cue**: "Scroll"

#### Section 1 — The problem

Background #FFFFFF · top 900px · height 304px · `<section class="cs-section">`

- **section eyebrow**: "The problem"
- **section heading (H2)** (`toad.problemHeading`): "Newly rural. Zero farming experience."
- **stat value** (`toad.stat1Value`): "Neo-rural"
- **stat label** (`toad.stat1Label`): "Target generation"
- **stat value** (`toad.stat2Value`): "Small-plot"
- **stat label** (`toad.stat2Label`): "Hobby & subsistence farming"

#### Section 2 — The user

Background #F5F5F3 · top 1204px · height 1064px · `<section class="cs-section cs-section-alt">`

- **section eyebrow**: "The user"
- **section heading (H2)** (`toad.personaHeading`): "Digital work by day, farms by choice."
- **body text** (`toad.personaBody`): "They moved for space, not to become farmers. TOAD is built for someone with no agricultural background who still wants real results from their land."
- **IMAGE** `images/toad/persona-v4.jpg` — 2800×1517 (1.846:1) — in zip: yes — BOARD: user persona, five labelled photos (Voluntarily rural / Small-scale farming / Calm, intentional life / Autonomy-driven / Hybrid work model) — set by script from `toad.personaImage`; CSS aspect-ratio 2800 / 1517; shown at 1312×711 (1440 frame)

#### Section 3 — The system

Background #FFFFFF · top 2268px · height 1064px · `<section class="cs-section">`

- **section eyebrow**: "The system"
- **section heading (H2)** (`toad.systemHeading`): "Learns your land. Does the heavy work."
- **body text** (`toad.systemBody`): "It studies the soil, the seasons, and the crops, then does the physical work itself, guiding its owner through decisions instead of expecting them to already know."
- **IMAGE** `images/toad/system-journey-v4.jpg` — 3239×1755 (1.846:1) — in zip: yes — ILLUSTRATION: system journey across a day (watercolour sky, sun arc, TOAD at four moments) — set by script from `toad.systemImage`; CSS aspect-ratio 3239 / 1755; shown at 1312×711 (1440 frame)

#### Section 4 — Form

Background #F5F5F3 · top 3333px · height 1065px · `<section class="cs-section cs-section-alt">`

- **section eyebrow**: "Form"
- **section heading (H2)** (`toad.formHeading`): "Shaped like a toad. Low and grounded."
- **body text** (`toad.formBody`): "A low, wide stance and a soft, rounded body, an animal-inspired form built to feel grounded and approachable, not industrial."
- **IMAGE** `images/toad/form-inspiration-v4.jpg` — 3683×1996 (1.845:1) — in zip: yes — BOARD: form inspiration (toad/frog studies, vehicle form sketches, short text block) — set by script from `toad.formImage`; CSS aspect-ratio 3683 / 1996; shown at 1312×711 (1440 frame)

#### Section 5 — Exterior

Background #FFFFFF · top 4397px · height 3543px · `<section class="cs-section">`

- **section eyebrow**: "Exterior"
- **section heading (H2)** (`toad.exteriorHeading`): "Built low, wide, and calm."
- **body text** (`toad.exteriorBody`): "Every surface reads as calm and close to the ground, built to move through a field without looking like it belongs on a construction site."
- **IMAGE** `images/toad/exterior-1-concept-v4.jpg` — 3840×2081 (1.845:1) — in zip: yes — BOARD: exterior concept sketches (compact modular farming companion) — set by script from `toad.exteriorImage1`; CSS aspect-ratio 3840 / 2081; shown at 1312×711 (1440 frame)
- **IMAGE** `images/toad/exterior-2-functional-v4.jpg` — 2880×1562 (1.844:1) — in zip: yes — BOARD: exterior functional sketches (access, unloading, transporting harvest) — set by script from `toad.exteriorImage2`; CSS aspect-ratio 2880 / 1562; shown at 1312×712 (1440 frame)
- **IMAGE** `images/toad/exterior-3-package-v4.jpg` — 3840×2081 (1.845:1) — in zip: yes — BOARD: package (side-view dimensions, modular arm sketches) — set by script from `toad.exteriorImage3`; CSS aspect-ratio 3840 / 2081; shown at 1312×711 (1440 frame)
- **IMAGE** `images/toad/exterior-4-cmf-v4.jpg` — 3840×2080 (1.846:1) — in zip: yes — BOARD (photo): CMF swatches beside a render of TOAD on a farm track (edge-to-edge) — set by script from `toad.exteriorImage4`; CSS aspect-ratio 3840 / 2080; shown at 1312×711 (1440 frame)

#### Section 6 — Interior

Background #F5F5F3 · top 7940px · height 1890px · `<section class="cs-section cs-section-alt">`

- **section eyebrow**: "Interior"
- **section heading (H2)** (`toad.interiorHeading`): "No cockpit. Just the field."
- **body text** (`toad.interiorBody`): "There's no cabin to sit in. TOAD is guided through a simple companion app and on-body signals, the interaction happens in the field itself, not behind a windshield."
- **IMAGE** `images/toad/interior-1-sketches-v4.jpg` — 3173×1719 (1.846:1) — in zip: yes — BOARD: interior sketches (open transparent cabin; low cognitive load) — set by script from `toad.interiorImage1`; CSS aspect-ratio 3173 / 1719; shown at 1312×711 (1440 frame)
- **IMAGE** `images/toad/interior-2-cmf-v4.jpg` — 2880×1560 (1.846:1) — in zip: yes — BOARD (photo): interior CMF swatches beside a cabin render (edge-to-edge) — set by script from `toad.interiorImage2`; CSS aspect-ratio 2880 / 1560; shown at 1312×711 (1440 frame)

#### Next project

Background #FFFFFF · top 9830px · height 350px · `<section class="cs-next">`

- **next-project label** (`toad.nextLabel`): "Next project"
- **next-project title (underlined on hover)** (`toad.nextTitle`): "Surface C1"
- **next-project hint**: "Scroll or click"
- **back-to-home link**: "Back to home"

#### Footer

Background #FFFFFF · top 10181px · height 102px · `<footer class="site-footer">`

- **footer text**: "Yash Yogesh © 2026"
- **footer email link** (`about.email`): "yashyogesh.work@gmail.com"

#### Page-level control

Background #FFFFFF · top 840px · height 35px · `<button class="progress-ring">`


### Surface C1 — `surface-c1.html`

Browser title: "Surface C1 · Yash Yogesh" · full page height at 1440×900: 8114px


#### Skip link (hidden until keyboard focus)

Background #FFFFFF · top -100px · height 47px · `<a class="skip-link">`

- **(skip link, visually hidden until focused)**: "Skip to content"

#### Navigation bar

Background #FFFFFF · top 0px · height 59px · `<nav class="site-nav" id="siteNav">`

- **nav: name** (`site.name`): "Yash Yogesh"
- **nav: link**: "About"

#### Hero

Background #F5F5F3 · top 0px · height 900px · `<section class="project-intro" id="main">`

- **IMAGE ×32** `images/c1/field/field-01.jpg` … `field-32.jpg` — 600×600 each (square) — in zip: yes — FLOATING HERO PHOTOS (AI-generated rider images) that drift up the C1 opening screen; each can be enlarged on click (the 1100px `-lg` versions are not in this zip). Keys `c1.heroImages[0..31].image`
- **hero eyebrow** (`c1.eyebrow`): "Surface Moto · Production"
- **hero title (H1)** (`c1.title`): "C1"
- **hero subtitle** (`c1.subtitle`): "An electric commuter, taken from first sketch to the street."
- **hero scroll cue**: "Scroll"

#### Section 1 — The role

Background #FFFFFF · top 900px · height 620px · `<section class="cs-section">`

- **section eyebrow**: "The role"
- **section heading (H2)** (`c1.roleHeading`): "A debut product, from scratch."
- **body text** (`c1.roleBody`): "As the industrial designer on the team, I worked closely with stakeholders throughout the process. The goal was to make everyday urban commuting in India easier, through functional ergonomics, solid engineering, and a design language approachable enough to encourage sustainable mobility."
- **stat value** (`c1.stat1Value`): "Concept → Road"
- **stat label** (`c1.stat1Label`): "Full development cycle"
- **stat value** (`c1.stat2Value`): "Production"
- **stat label** (`c1.stat2Label`): "Real-world constraints"
- **IMAGE** `images/c1/02-role-goal-v4.webp` — 1424×1300 (1.095:1) — in zip: yes — PRODUCT RENDER (Surface Moto): C1 bike in a display box with the Surface logo. Master only 1424px wide — set by script from `c1.roleImage`; CSS aspect-ratio 1424 / 1300; shown at 540×493 (1440 frame)

#### Section 2 — The process

Background #F5F5F3 · top 1520px · height 950px · `<section class="cs-section cs-section-alt">`

- **section eyebrow**: "The process"
- **section heading (H2)** (`c1.processHeading`): "Sketching the details."
- **body text** (`c1.processBody`): "Early sketches worked through the parts a rider handles every day: the grip and throttle, pedals, fenders, mounts, and a modular storage case."
- **IMAGE** `images/c1/03-process-sketches-v4.webp` — 3570×1623 (2.200:1) — in zip: yes — COMPOSITE: taped sketch sheets (handlebar, storage, fenders) on a grey card — set by script from `c1.processImage`; CSS aspect-ratio 3570 / 1623; shown at 1312×596 (1440 frame)

#### Section 3 — Design direction

Background #FFFFFF · top 2470px · height 781px · `<section class="cs-section">`

- **section eyebrow**: "Design direction"
- **section heading (H2)** (`c1.systemHeading`): "One direction, refined."
- **body text** (`c1.systemBody`): "The concept went through rounds of iteration and evaluation before settling into a balanced design, one that prioritized ergonomics, usability, and practical performance."
- **IMAGE** `images/c1/04-design-direction-v4.webp` — 3444×1121 (3.072:1) — in zip: yes — COMPOSITE: ten thumbnail side-profiles, a grey prototype bike and the final C1 render on a grey card — set by script from `c1.systemImage`; CSS aspect-ratio 3444 / 1121; shown at 1312×427 (1440 frame)

#### Section 4 — Fabrication

Background #F5F5F3 · top 3251px · height 900px · `<section class="cs-section cs-section-alt">`

- **section eyebrow**: "Fabrication"
- **section heading (H2)** (`c1.interiorHeading`): "From design to steel."
- **body text** (`c1.interiorBody`): "To translate the design into reality, I worked closely with manufacturers during frame fabrication, observing and taking part in cutting, drilling, and welding."
- **IMAGE** `images/c1/05-fabrication-v4.webp` — 3574×1489 (2.400:1) — in zip: yes — PHOTO TRIPTYCH: tubing / drilling / welding — set by script from `c1.interiorImage`; CSS aspect-ratio 3574 / 1489; shown at 1312×547 (1440 frame)

#### Section 5 — Prototyping

Background #FFFFFF · top 4151px · height 900px · `<section class="cs-section">`

- **section eyebrow**: "Prototyping"
- **section heading (H2)** (`c1.prototypeHeading`): "Testing every detail."
- **body text** (`c1.prototypeBody`): "Paint, materials, and seat ergonomics were refined through physical testing, including several 3D-printed seat prototypes to check comfort and riding posture."
- **IMAGE** `images/c1/06-prototyping-v4.webp` — 3577×1490 (2.401:1) — in zip: yes — PHOTO TRIPTYCH: prototype parts and seat — set by script from `c1.prototypeImage`; CSS aspect-ratio 3577 / 1490; shown at 1312×547 (1440 frame)

#### Section 6 — Assembly

Background #F5F5F3 · top 5051px · height 900px · `<section class="cs-section cs-section-alt">`

- **section eyebrow**: "Assembly"
- **section heading (H2)** (`c1.assemblyHeading`): "Redesigning on the floor."
- **body text** (`c1.assemblyBody`): "During hands-on assembly, component fitment issues came up that needed immediate adjustments and redesigns to keep everything compatible and built to standard."
- **IMAGE** `images/c1/07-assembly-v4.webp` — 3582×1492 (2.401:1) — in zip: yes — PHOTO SET (3 photos): hands-on assembly — set by script from `c1.assemblyImage`; CSS aspect-ratio 3582 / 1492; shown at 1312×546 (1440 frame)

#### Section 7 — Showcase

Background #FFFFFF · top 5951px · height 945px · `<section class="cs-section">`

- **section eyebrow**: "Showcase"
- **section heading (H2)** (`c1.showcaseHeading`): "Tested by real riders."
- **body text** (`c1.showcaseBody`): "The functional prototype was shown publicly and tested with real users, validating ergonomics and confirming it was ready for consumer trials and early deliveries."
- **IMAGE** `images/c1/08-showcase-v4.webp` — 3577×1490 (2.401:1) — in zip: yes — PHOTO TRIPTYCH: launch display, rider on the bike, bikes in a row — set by script from `c1.showcaseImage`; CSS aspect-ratio 3577 / 1490; shown at 1312×547 (1440 frame)
- **image credit line (right-aligned)** (`c1.photoCredit`): "Image sources: Surface Moto and Yash Yogesh."

#### Section 8

Background #F5F5F3 · top 6895px · height 767px · `<section class="cs-section cs-section-alt">`

- **IMAGE** `images/c1/hero/hero-03.jpg` — 2380×2160 (1.102:1) — in zip: yes — GALLERY PHOTO (AI-generated studio render), bottom of C1 page — `<img>` 0×0 attr; shown at 360×330 (1440 frame); alt: ""
- **IMAGE** `images/c1/hero/hero-07.jpg` — 1474×1018 (1.448:1) — in zip: yes — GALLERY PHOTO (AI-generated studio render), bottom of C1 page — `<img>` 0×0 attr; shown at 300×217 (1440 frame); alt: ""
- **IMAGE** `images/c1/hero/hero-05.jpg` — 2153×2220 (0.970:1) — in zip: yes — GALLERY PHOTO (AI-generated studio render), bottom of C1 page — `<img>` 0×0 attr; shown at 233×239 (1440 frame); alt: ""
- **IMAGE** `images/c1/hero/hero-08.jpg` — 1952×1500 (1.301:1) — in zip: yes — GALLERY PHOTO (AI-generated studio render), bottom of C1 page — `<img>` 0×0 attr; shown at 361×289 (1440 frame); alt: ""
- **IMAGE** `images/c1/hero/hero-01.jpg` — 1460×1000 (1.460:1) — in zip: yes — GALLERY PHOTO (AI-generated studio render), bottom of C1 page — `<img>` 0×0 attr; shown at 364×259 (1440 frame); alt: ""
- **IMAGE** `images/c1/hero/hero-02.jpg` — 1988×660 (3.012:1) — in zip: yes — GALLERY PHOTO (AI-generated studio render), bottom of C1 page — `<img>` 0×0 attr; shown at 401×164 (1440 frame); alt: ""
- **IMAGE** `images/c1/hero/hero-04.jpg` — 1460×1160 (1.259:1) — in zip: yes — GALLERY PHOTO (AI-generated studio render), bottom of C1 page — `<img>` 0×0 attr; shown at 288×236 (1440 frame); alt: ""
- **IMAGE** `images/c1/hero/hero-06.jpg` — 1826×1494 (1.222:1) — in zip: yes — GALLERY PHOTO (AI-generated studio render), bottom of C1 page — `<img>` 0×0 attr; shown at 308×256 (1440 frame); alt: ""

#### Next project

Background #FFFFFF · top 7662px · height 350px · `<section class="cs-next">`

- **next-project label** (`c1.nextLabel`): "Next project"
- **next-project title (underlined on hover)** (`c1.nextTitle`): "Sketches"
- **next-project hint**: "Scroll or click"
- **back-to-home link**: "Back to home"

#### Footer

Background #FFFFFF · top 8012px · height 102px · `<footer class="site-footer">`

- **footer text**: "Yash Yogesh © 2026"
- **footer email link** (`about.email`): "yashyogesh.work@gmail.com"

#### Page-level control

Background #FFFFFF · top 840px · height 35px · `<button class="progress-ring">`


**C1 gallery (bottom of the page):** eight AI-generated studio renders built by `js/c1-gallery.js`, scattered with rotation; each opens in the enlarged viewer. Files (full-size, in zip): `images/c1/hero/hero-01.jpg` (1460×1000), `images/c1/hero/hero-02.jpg` (1988×660), `images/c1/hero/hero-03.jpg` (2380×2160), `images/c1/hero/hero-04.jpg` (1460×1160), `images/c1/hero/hero-05.jpg` (2153×2220), `images/c1/hero/hero-06.jpg` (1826×1494), `images/c1/hero/hero-07.jpg` (1474×1018), `images/c1/hero/hero-08.jpg` (1952×1500). The matching `-720w` thumbnails are not in the zip.


### Sketches — `sketches.html`

Browser title: "Sketches · Yash Yogesh" · full page height at 1440×900: 900px


#### Skip link (hidden until keyboard focus)

Background #FFFFFF · top -100px · height 47px · `<a class="skip-link">`

- **(skip link, visually hidden until focused)**: "Skip to sketches"

#### Top frame (name + About link)

Background #FFFFFF · top 0px · height 93px · `<header class="wall-frame-top">`

- **name (top centre)** (`site.name`): "Yash Yogesh"
- **About link (top right)** (`site.navAbout`): "About"

#### Headline (sits among the cards)

Background #FFFFFF · top 135px · height 129px · `<div class="wall-headline-wrap">`

- **span** (`sketchwall.headlineLine1`): "A 5-year sketching challenge."
- **span.muted** (`sketchwall.headlineLine2`): "Imperfect. Ongoing."

#### Page-level control

Background #FFFFFF · top 775px · height 44px · `<button class="rescatter-btn" id="rescatterBtn">`

- **button.rescatter-btn**: "Rescatter"

#### Sketch wall field

Background #FFFFFF · top 0px · height 900px · `<main class="wall-field" id="wallField">`


#### Below the wall (link to Instagram)

Background #FFFFFF · top 841px · height 27px · `<div class="below">`

- **a**: "Take me to Instagram"

#### Enlarged-view overlay (opens when a photo or sketch is clicked)

Background #FFFFFF · top 0px · height 900px · `<div class="wall-expand-veil" id="wallExpandVeil">`


#### Page-level control

Background #FFFFFF · top 14px · height 47px · `<button class="wall-expand-close" id="wallExpandClose">`

- **button.wall-expand-close**: "Close ✕"

#### Sketch wall cards (added by script from `sketchwall.items`)

25 draggable cards scattered on the page; clicking one enlarges it. Each item has a full image, a small thumbnail used while scattered, and an aspect `ratio`. **No card has a title** (all `title` fields are empty). Hint text: "Move through the sketches".

| # | key | full image | pixels | ratio | thumbnail (px) |
|---|---|---|---|---|---|
| 1 | `sketchwall.items[0]` | `images/sketches/sketch-01.jpg` | 736×736 | 1 | `images/sketches/thumb/sketch-01.jpg` (480×480) |
| 2 | `sketchwall.items[1]` | `images/sketches/sketch-02.jpg` | 1100×1069 | 1.029 | `images/sketches/thumb/sketch-02.jpg` (480×467) |
| 3 | `sketchwall.items[2]` | `images/sketches/sketch-03.jpg` | 1100×779 | 1.4121 | `images/sketches/thumb/sketch-03.jpg` (480×340) |
| 4 | `sketchwall.items[3]` | `images/sketches/sketch-04.jpg` | 1100×1100 | 1 | `images/sketches/thumb/sketch-04.jpg` (480×480) |
| 5 | `sketchwall.items[4]` | `images/sketches/sketch-05.jpg` | 1100×1100 | 1 | `images/sketches/thumb/sketch-05.jpg` (480×480) |
| 6 | `sketchwall.items[5]` | `images/sketches/sketch-06.jpg` | 1100×1100 | 1 | `images/sketches/thumb/sketch-06.jpg` (480×480) |
| 7 | `sketchwall.items[6]` | `images/sketches/sketch-07.jpg` | 1100×1065 | 1.0329 | `images/sketches/thumb/sketch-07.jpg` (480×465) |
| 8 | `sketchwall.items[7]` | `images/sketches/sketch-08.jpg` | 1100×1100 | 1 | `images/sketches/thumb/sketch-08.jpg` (480×480) |
| 9 | `sketchwall.items[8]` | `images/sketches/sketch-09.jpg` | 890×890 | 1 | `images/sketches/thumb/sketch-09.jpg` (480×480) |
| 10 | `sketchwall.items[9]` | `images/sketches/sketch-10.jpg` | 1100×679 | 1.62 | `images/sketches/thumb/sketch-10.jpg` (480×296) |
| 11 | `sketchwall.items[10]` | `images/sketches/sketch-11.jpg` | 1100×765 | 1.4379 | `images/sketches/thumb/sketch-11.jpg` (480×334) |
| 12 | `sketchwall.items[11]` | `images/sketches/sketch-12.jpg` | 1100×1100 | 1 | `images/sketches/thumb/sketch-12.jpg` (480×480) |
| 13 | `sketchwall.items[12]` | `images/sketches/sketch-13.jpg` | 958×958 | 1 | `images/sketches/thumb/sketch-13.jpg` (480×480) |
| 14 | `sketchwall.items[13]` | `images/sketches/sketch-14.jpg` | 1100×769 | 1.4304 | `images/sketches/thumb/sketch-14.jpg` (480×335) |
| 15 | `sketchwall.items[14]` | `images/sketches/sketch-15.jpg` | 906×834 | 1.0863 | `images/sketches/thumb/sketch-15.jpg` (480×442) |
| 16 | `sketchwall.items[15]` | `images/sketches/sketch-16.jpg` | 509×509 | 1 | `images/sketches/thumb/sketch-16.jpg` (480×480) |
| 17 | `sketchwall.items[16]` | `images/sketches/sketch-17.jpg` | 1086×1100 | 0.9873 | `images/sketches/thumb/sketch-17.jpg` (474×480) |
| 18 | `sketchwall.items[17]` | `images/sketches/sketch-18.jpg` | 1100×1079 | 1.0195 | `images/sketches/thumb/sketch-18.jpg` (480×471) |
| 19 | `sketchwall.items[18]` | `images/sketches/sketch-19.jpg` | 1000×1004 | 0.996 | `images/sketches/thumb/sketch-19.jpg` (478×480) |
| 20 | `sketchwall.items[19]` | `images/sketches/sketch-20.jpg` | 1002×998 | 1.004 | `images/sketches/thumb/sketch-20.jpg` (480×478) |
| 21 | `sketchwall.items[20]` | `images/sketches/sketch-21.jpg` | 1100×763 | 1.4417 | `images/sketches/thumb/sketch-21.jpg` (480×333) |
| 22 | `sketchwall.items[21]` | `images/sketches/sketch-22.jpg` | 1100×765 | 1.4379 | `images/sketches/thumb/sketch-22.jpg` (480×334) |
| 23 | `sketchwall.items[22]` | `images/sketches/sketch-23.jpg` | 1100×1100 | 1 | `images/sketches/thumb/sketch-23.jpg` (480×480) |
| 24 | `sketchwall.items[23]` | `images/sketches/sketch-24.jpg` | 1100×754 | 1.4589 | `images/sketches/thumb/sketch-24.jpg` (480×329) |
| 25 | `sketchwall.items[24]` | `images/sketches/sketch-25.jpg` | 1100×1067 | 1.0309 | `images/sketches/thumb/sketch-25.jpg` (480×466) |

### Privacy — `privacy.html`

Browser title: "Privacy · Yash Yogesh" · full page height at 1440×900: 1392px


#### Skip link (hidden until keyboard focus)

Background #FFFFFF · top -100px · height 47px · `<a class="skip-link">`

- **(skip link, visually hidden until focused)**: "Skip to content"

#### Navigation bar

Background #FFFFFF · top 0px · height 60px · `<nav class="site-nav" id="siteNav">`

- **nav: name**: "Yash Yogesh"
- **nav: link**: "About"

#### Main content

Background #FFFFFF · top 0px · height 1392px · `<main class="privacy-wrap" id="main">`

- **h1**: "Privacy"
- **p**: "This is a personal portfolio site, not a business collecting data to sell or share. Here's plainly what happens on it."
- **h2**: "Analytics"
- **p**: "This site uses Google Analytics to see general traffic, things like which pages get visited and roughly where visitors come from. It doesn't collect names or exact identities, and this data is never sold or shared with anyone."
- **h2**: "The reaction feature and contact form"
- **p**: "The About page has a small feature for leaving an anonymous reaction, and an optional message field where you can share your name if you'd like. Whatever you type there goes directly to me through Netlify's form service and is used only to hear feedback, never shared or sold."
- **h2**: "The Umeå weather"
- **p**: "The About page shows the time and temperature in Umeå. To get the temperature, your browser asks Open-Meteo, a free weather service, for the current weather at Umeå's coordinates. That request goes straight from your browser to Open-Meteo, so they see your IP address the way any website you visit does. Nothing about you is sent to me through it."
- **h2**: "The pop-it counter"
- **p**: "The pop-it at the bottom of the About page keeps one shared running total of the bubbles popped by everyone who plays. When you pop bubbles, a number (how many) is sent to this site and added to that total. No name, account or other personal detail is attached to it."
- **h2**: "Cookies"
- **p**: "Google Analytics sets a small cookie to distinguish visits. No advertising or tracking cookies are used."
- **h2**: "Questions"
- **p**: "If you have a question about any of this, email yashyogesh.work@gmail.com ."

### 404 page — `404.html`

Browser title: "Page not found · Yash Yogesh" · full page height at 1440×900: 900px


#### Navigation bar

Background #FFFFFF · top 0px · height 60px · `<nav class="site-nav" id="siteNav">`

- **nav: name**: "Yash Yogesh"
- **nav: link**: "About"

#### Main content

Background #FFFFFF · top 0px · height 720px · `<main class="notfound-wrap">`

- **div.eyebrow**: "404"
- **h1**: "This page doesn't exist."
- **a**: "Back to home"
- **a**: "About"
- **a**: "Sketches"

---

## 3. Images applied by JavaScript — key → file → page and section

These images are not written in the HTML; a script sets them from `js/content.js` keys (`data-c-bg="key"` on the slide element), or builds them itself. Each slide also exists in smaller responsive copies chosen per screen (not in this zip).

| Page | Section | Content key | Full-size file (in zip) | Pixels | Frame ratio |
|---|---|---|---|---|---|
| index.html | Carousel stage (4 slides) | `home.projects[0].image` | `images/carousel/hive.jpg` | 1529×1029 | 1.486:1 |
| index.html | Carousel stage (4 slides) | `home.projects[1].image` | `images/carousel/toad.jpg` | 1527×1030 | 1.483:1 |
| index.html | Carousel stage (4 slides) | `home.projects[2].image` | `images/carousel/c1.jpg` | 1600×1075 | 1.488:1 |
| index.html | Carousel stage (4 slides) | `home.projects[3].image` | `images/carousel/sketches.jpg` | 1532×1027 | 1.492:1 |
| toad.html | Section 2 — The user | `toad.personaImage` | `images/toad/persona-v4.jpg` | 2800×1517 | 1.846:1 |
| toad.html | Section 3 — The system | `toad.systemImage` | `images/toad/system-journey-v4.jpg` | 3239×1755 | 1.846:1 |
| toad.html | Section 4 — Form | `toad.formImage` | `images/toad/form-inspiration-v4.jpg` | 3683×1996 | 1.845:1 |
| toad.html | Section 5 — Exterior | `toad.exteriorImage1` | `images/toad/exterior-1-concept-v4.jpg` | 3840×2081 | 1.845:1 |
| toad.html | Section 5 — Exterior | `toad.exteriorImage2` | `images/toad/exterior-2-functional-v4.jpg` | 2880×1562 | 1.844:1 |
| toad.html | Section 5 — Exterior | `toad.exteriorImage3` | `images/toad/exterior-3-package-v4.jpg` | 3840×2081 | 1.845:1 |
| toad.html | Section 5 — Exterior | `toad.exteriorImage4` | `images/toad/exterior-4-cmf-v4.jpg` | 3840×2080 | 1.846:1 |
| toad.html | Section 6 — Interior | `toad.interiorImage1` | `images/toad/interior-1-sketches-v4.jpg` | 3173×1719 | 1.846:1 |
| toad.html | Section 6 — Interior | `toad.interiorImage2` | `images/toad/interior-2-cmf-v4.jpg` | 2880×1560 | 1.846:1 |
| surface-c1.html | Hero | `c1.heroImages[0..31].image` | images/c1/field/field-01.jpg … field-32.jpg | see section 2 | — |
| surface-c1.html | Section 1 — The role | `c1.roleImage` | `images/c1/02-role-goal-v4.webp` | 1424×1300 | 1.095:1 |
| surface-c1.html | Section 2 — The process | `c1.processImage` | `images/c1/03-process-sketches-v4.webp` | 3570×1623 | 2.200:1 |
| surface-c1.html | Section 3 — Design direction | `c1.systemImage` | `images/c1/04-design-direction-v4.webp` | 3444×1121 | 3.072:1 |
| surface-c1.html | Section 4 — Fabrication | `c1.interiorImage` | `images/c1/05-fabrication-v4.webp` | 3574×1489 | 2.400:1 |
| surface-c1.html | Section 5 — Prototyping | `c1.prototypeImage` | `images/c1/06-prototyping-v4.webp` | 3577×1490 | 2.401:1 |
| surface-c1.html | Section 6 — Assembly | `c1.assemblyImage` | `images/c1/07-assembly-v4.webp` | 3582×1492 | 2.401:1 |
| surface-c1.html | Section 7 — Showcase | `c1.showcaseImage` | `images/c1/08-showcase-v4.webp` | 3577×1490 | 2.401:1 |
| sketches.html | Sketch wall cards | `sketchwall.items[0..24].image / .thumb` | images/sketches/sketch-01…25.jpg and images/sketches/thumb/sketch-01…25.jpg | see section 2 | — |

**Static `<img>` tags (Hive):** all nine Hive images are normal `<img>` elements with `srcset` (five widths each); they are listed in section 2 with their alt text.

**Hero video posters** are set in the HTML (`poster=` attribute), not by script.

**Other keys in `js/content.js`:** `site` (name "Yash Yogesh", nav labels, footer text "Yash Yogesh © 2026", tagline "Designed & built in Umeå"), `home` (hint + 4 projects: HIVE, TOAD, C1, SKETCHES with gradients `bg` as placeholders), `hive`, `toad`, `c1`, `sketchwall`, `about`. Every visible string on the portfolio pages comes from this one file (or from the HTML default it replaces), so it is also the best single source for copy.


---

## 4. Interaction notes for the designer (so the Figma file can describe behaviour)

- **Homepage:** one full-screen stage; four slides (Hive, TOAD, C1, Sketches) in a bowed strip, centre slide undimmed, side slides dimmed 7%. Scroll wheel, drag, swipe, arrow keys and the four labels move it; motion is a critically damped spring (no bounce). After three full laps it opens About. Clicking the centre slide opens the project.
- **Project pages:** full-bleed hero (video over a poster), then alternating white / #F5F5F3 sections. Each slide fades in, rises 48px (24px on phones) and scales from 94% to 100%, tied to scroll position. A small progress ring (bottom right) fills as you read and returns to the top on click. At the very bottom, resting about a second and then scrolling again opens the next project.
- **C1 hero:** 32 square photos drift upward across a #F5F5F3 screen with the title at lower left; the first two scroll gestures push the field, the third releases the page. Clicking a photo enlarges it from where it sits.
- **Sketches:** 25 cards scattered with physics (drag, throw, bounce off the edges); click enlarges a card with a soft backdrop behind it only.
- **About:** rotating greeting with eyes that track the cursor; facts with a live local-time/temperature line for Umeå (the time and temperature come from a free weather service); a pop-it toy at the bottom that keeps a shared bubble counter; reactions and a message form.
- **Reduced motion:** if the visitor has Reduce Motion on, the homepage glide and auto-advance, the hero videos and the greeting cycling switch off.

---

## 5. Other files in this zip

**C1 floating photos (all 32, 600×600 card versions):** `images/c1/field/field-01.jpg`, `images/c1/field/field-02.jpg`, `images/c1/field/field-03.jpg`, `images/c1/field/field-04.jpg`, `images/c1/field/field-05.jpg`, `images/c1/field/field-06.jpg`, `images/c1/field/field-07.jpg`, `images/c1/field/field-08.jpg`, `images/c1/field/field-09.jpg`, `images/c1/field/field-10.jpg`, `images/c1/field/field-11.jpg`, `images/c1/field/field-12.jpg`, `images/c1/field/field-13.jpg`, `images/c1/field/field-14.jpg`, `images/c1/field/field-15.jpg`, `images/c1/field/field-16.jpg`, `images/c1/field/field-17.jpg`, `images/c1/field/field-18.jpg`, `images/c1/field/field-19.jpg`, `images/c1/field/field-20.jpg`, `images/c1/field/field-21.jpg`, `images/c1/field/field-22.jpg`, `images/c1/field/field-23.jpg`, `images/c1/field/field-24.jpg`, `images/c1/field/field-25.jpg`, `images/c1/field/field-26.jpg`, `images/c1/field/field-27.jpg`, `images/c1/field/field-28.jpg`, `images/c1/field/field-29.jpg`, `images/c1/field/field-30.jpg`, `images/c1/field/field-31.jpg`, `images/c1/field/field-32.jpg`. Each is square; the enlarged view uses a 1100px `-lg` version that is not in this zip.

**Icons and site files (root):** `favicon.ico`, `favicon-16.png`, `favicon-32.png` (16×16, 32×32), `apple-touch-icon.png` (180×180), `site.webmanifest`, `robots.txt`, `sitemap.xml`, `_headers` (security and cache rules), `README.md`, `netlify/` (the small server functions behind the boards and the pop-it counter).

**Images used only in search-engine metadata (JSON-LD `image`), never shown on a page:** `images/hive/hero-pods.jpg` (1320×1080, Hive), `images/toad/persona-v4.jpg` (TOAD), `images/c1/02-role-goal-v4.webp` (C1). The 1200×630 social-share crops in `images/og/` are not in this zip.

**Present in the folders but not used by any page** (older leftovers; safe to ignore for the redesign): `images/hive/hero-pods-real-frame.jpg` (1920×1080 older Hive hero still), `images/toad/exterior-real-frame.jpg` (1920×1080 older TOAD hero still), `images/sketches/PUT-SKETCHES-HERE.txt` (placeholder note).


---

*End of inventory. Generated from the build files on 2026-10-05; see `MANIFEST-SHA256.txt` for the hash of every file.*
