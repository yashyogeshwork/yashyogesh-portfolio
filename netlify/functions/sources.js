import { getStore } from "@netlify/blobs";

// Live-editable list of "other places to look for jobs" — job boards, design
// forums, an Instagram account someone finds, whatever. Separate from the
// per-company job postings in jobs.js: this is a flat, site-wide list, not
// tied to any one company. Same open-access model: no login, goes live
// immediately, attribution is an optional typed name.
//
// Storage: one Netlify Blobs store ("job-sources"), one key ("all") holding
// the full JSON array of live-added sources:
//   [{ id, name, url, note, addedBy, addedAt }, ...]
// The page's built-in seed list (known boards from the research corpus) is
// shipped in companies-data.js, not stored here — this store only holds
// what people add live, and the two are merged client-side for display.
//
// GET  /api/sources                                  -> [...]
// POST /api/sources  { name, url, note, addedBy }     -> creates one, returns it
// DELETE /api/sources  { id }                          -> removes one

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function badRequest(msg) {
  return json({ error: msg }, 400);
}

export default async (req) => {
  const store = getStore("job-sources");

  if (req.method === "GET") {
    const list = (await store.get("all", { type: "json" })) || [];
    return json(list);
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return badRequest("invalid JSON body");
    }
    const name = (body.name || "").trim();
    const url = (body.url || "").trim();
    const note = (body.note || "").trim();
    const addedBy = (body.addedBy || "").trim();

    if (!name) return badRequest("name is required");
    if (!url) return badRequest("url is required");
    if (name.length > 120) return badRequest("name is too long");
    if (url.length > 500) return badRequest("url is too long");
    if (note.length > 300) return badRequest("note is too long");
    if (addedBy.length > 80) return badRequest("name is too long");
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      return badRequest("that doesn't look like a valid URL");
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      url,
      note,
      addedBy: addedBy || "",
      addedAt: new Date().toISOString(),
    };

    const existing = (await store.get("all", { type: "json" })) || [];
    existing.unshift(entry);
    await store.setJSON("all", existing);

    return json(entry, 201);
  }

  if (req.method === "DELETE") {
    let body;
    try {
      body = await req.json();
    } catch {
      return badRequest("invalid JSON body");
    }
    const id = (body.id || "").trim();
    if (!id) return badRequest("id is required");

    const existing = (await store.get("all", { type: "json" })) || [];
    const next = existing.filter((s) => s.id !== id);
    await store.setJSON("all", next);
    return json({ ok: true, removed: existing.length !== next.length });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/sources" };
