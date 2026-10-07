import { getStore } from "@netlify/blobs";

// Live-editable list of general "worth passing on" resources — a piece of
// software, a portfolio-critique community, a tutorial, an article.
// Distinct from sources.js ("Where else to look" for jobs specifically):
// this is anything useful that isn't itself a job listing. Same
// open-access model: no login, goes live immediately, attribution is an
// optional typed name.
//
// Storage: one Netlify Blobs store ("resources"), one key ("all") holding
// the full JSON array:
//   [{ id, name, url, note, addedBy, addedAt }, ...]
//
// GET  /api/resources                                  -> [...]
// POST /api/resources  { name, url, note, addedBy }     -> creates one, returns it
// DELETE /api/resources  { id }                          -> removes one

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function badRequest(msg) {
  return json({ error: msg }, 400);
}

// Only web addresses. `new URL()` on its own also accepts javascript:, data:
// and other schemes, and these links are rendered as clickable on the site,
// so a "javascript:" entry would have run when someone clicked it.
function cleanLink(raw) {
  if (!raw) return "";
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  return raw;
}

async function handle(req) {
  const store = getStore("resources");

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
    if (cleanLink(url) === null) return badRequest("url must be a web address starting with http:// or https://");

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
}

// A storage failure used to escape as an unformatted platform 500 that the
// page silently turned into an empty list. It now returns the same {error}
// JSON shape the other failures use.
export default async (req) => {
  try {
    return await handle(req);
  } catch (err) {
    return json({ error: "something went wrong on the server, please try again" }, 500);
  }
};

export const config = { path: "/api/resources" };
