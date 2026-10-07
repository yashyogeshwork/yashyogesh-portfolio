# yashyogesh.com — Owner's Manual

Your portfolio is a static site (HTML + CSS + JS) hosted on Netlify and deployed
automatically from GitHub. **Anything committed to GitHub goes live in about a
minute.** The pages themselves need no server. A few small pieces do run live,
as Netlify Functions that keep their data in Netlify Blobs: the job, competition,
resource and studio boards on `uid.html` / `companies.html`, and the shared
pop-it counter on the About page. See "The live pieces" below.

---

## The one file you edit: `js/content.js`

Every piece of text on the site — headlines, case-study copy, about page,
contact info — and the full sketch list live in this ONE file. You never need
to touch HTML to change words.

Two ways to edit it:

**Way 1 — the Site Editor (easiest):**
1. Open `admin.html` on your live site (yashyogesh.com/admin.html) or locally.
2. Edit any text, manage sketches, then press **Download updated content.js**.
3. On GitHub: open the `js` folder → **Add file → Upload files** → upload the
   downloaded `content.js` (it replaces the old one) → **Commit**.
4. Netlify republishes automatically. Done.

**Way 2 — edit directly on GitHub:**
Open `js/content.js` on GitHub, click the pencil icon, edit the text between
the quotes, commit. Same result.

> The Site Editor also has **"Preview changes locally"** — this shows your
> edits on YOUR device only, before publishing. The live site never changes
> until you upload the new content.js.

---

## Sketches — adding, replacing, removing

Sketch images live in the `images/sketches/` folder. The wall shows whatever
is listed in the `sketchwall.items` section of `content.js`.

**Replace a sketch (most common — takes 30 seconds):**
1. On GitHub: open `images/sketches/` → **Add file → Upload files**.
2. Upload a new image with the **same filename** as the one you're replacing
   (e.g. a new `sketch-07.jpg` replaces the old `sketch-07.jpg`).
3. Commit. That's it — nothing else to change, it's live.

**Add a new sketch:**
1. Upload the image file to `images/sketches/` (any filename, JPG/PNG).
2. Open `admin.html` → Sketch Wall section → **+ Add sketch** → type the
   filename → download and upload the new `content.js`.
   (Or edit `content.js` directly and add a line:
   `{ image: 'my-new-sketch.jpg', title: 'Whatever' },`)

**Remove a sketch:** delete its row in admin.html (✕ button), or delete its
line in `content.js`. You can also delete the image file, but just removing
the line is enough to take it off the wall.

**Image tips:** roughly square crops look best on the wall. Keep files under
~500KB each (export at ~1200px on the long side) so the page stays fast.

---

## Changing layout / structure

Text lives in `content.js`, but LAYOUT lives in the HTML and CSS files:

- `index.html` — homepage (carousel)
- `hive.html`, `toad.html`, `surface-c1.html` — case studies (same template)
- `sketches.html` — the sketch wall
- `about.html`, `contact.html`
- `css/variables.css` — **the design system**: colors, fonts, spacing, easing.
  Changing a value here changes it everywhere.
- `css/` — one stylesheet per page area
- `js/` — behavior (carousel engine, sketch wall engine, page transitions)

To rearrange sections on a case-study page: the sections in the HTML are
self-contained `<section>` blocks — you can reorder, duplicate, or delete
whole blocks safely. Duplicated blocks will show the same text (they read the
same content keys) unless you point their `data-c` attributes at new keys you
add in `content.js`.

---

## The live pieces (Netlify Functions)

These are the only parts that aren't plain files. They live in
`netlify/functions/` and store their data in Netlify Blobs.

| Address            | What it does                                            |
|--------------------|---------------------------------------------------------|
| `/api/jobs`        | job postings under each employer                        |
| `/api/competitions`| open design competitions                                |
| `/api/resources`   | shared links and sources                                |
| `/api/studios`     | studios people add to the list                          |
| `/api/pops`        | the shared total of bubbles popped on the About page    |

Things to know:
- **There is no login on the boards.** Anyone with the link can add an entry,
  and anyone can delete one. That was a deliberate choice for the batchmates'
  page, but it means the data can be changed by anyone.
- Links are only accepted if they start with `http://` or `https://`, and the
  pages only turn http(s) links into clickable links.
- **Nothing here is backed up automatically.** If the data matters, export it
  from the Netlify dashboard (Blobs) now and then.
- Test any change to these functions on a Netlify **deploy preview** first,
  not on the live site.

## Private pages are not actually private

`playbook.html`, `uid.html`, `companies.html` and `admin.html` are ordinary
public pages. They are hidden from search engines (a "noindex" tag and
robots.txt) but anyone who knows or guesses the address can open them, and
`companies-data.js` carries the full data. Treat anything in them as public
until they are moved behind a login or out of this repository.

## Images: names, sizes and shapes

- Every project slide has two files: the full image, and a smaller `-800w`
  copy that phones download. When you replace a slide, replace **both**.
  (The C1 gallery uses `-720w` copies in the same way.)
- Slides use `-v3` in their file names. If you ever replace an image with one
  of a **different shape**, also update the `aspect-ratio` on that slide in the
  HTML (and save it under a new name, such as `-v4`, so browsers fetch the new
  file straight away instead of showing the old one inside the new layout).
- Images, CSS and JS are not cached for long, so same-name replacements
  normally show up on the next visit.

---

## How deployment works

GitHub repo → Netlify (auto-deploy on every commit) → yashyogesh.com

To update ANYTHING: change files in the GitHub repo (upload or edit in the
browser), commit, wait ~1 minute. If a deploy fails, the Netlify dashboard
shows why (usually a malformed content.js — check for a missing quote or
comma).

**Safety net:** GitHub keeps every previous version of every file. If
anything ever breaks, open the file's History on GitHub and restore an older
version.

---

## Quick reference

| I want to…                       | Do this                                          |
|----------------------------------|--------------------------------------------------|
| Change any text                  | admin.html → download content.js → upload to GitHub |
| Replace a sketch                 | Upload same-name file to images/sketches/        |
| Add a sketch                     | Upload file + add row in admin.html              |
| Change colors/fonts/spacing      | Edit css/variables.css                           |
| Rearrange page sections          | Reorder `<section>` blocks in the page's HTML    |
| Replace a project slide          | Upload the new full image and its -800w copy     |
| Undo a mistake                   | GitHub → file → History → restore                |
