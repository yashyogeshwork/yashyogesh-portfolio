import { getStore } from "@netlify/blobs";

// Live-editable list of studios the researched 218-company list missed.
// Separate from companies-data.js (the static, researched corpus shipped
// with the page): this store only holds what people add live. The two are
// merged client-side, with these always tagged "added by the community" so
// they're never confused with the researched entries. Same open-access
// model as the rest of this page: no login, goes live immediately.
//
// Storage: one Netlify Blobs store ("community-studios"), one key ("all")
// holding the full JSON array:
//   [{ id, name, location, type, note, addedBy, addedAt }, ...]
//
// GET  /api/studios                                            -> [...]
// POST /api/studios  { name, location, type, note, addedBy }    -> creates one, returns it
// DELETE /api/studios  { id }                                     -> removes one

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
  const store = getStore("community-studios");

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
    const location = (body.location || "").trim();
    const type = (body.type || "").trim();
    const note = (body.note || "").trim();
    const addedBy = (body.addedBy || "").trim();

    if (!name) return badRequest("name is required");
    if (name.length > 120) return badRequest("name is too long");
    if (location.length > 120) return badRequest("location is too long");
    if (type.length > 80) return badRequest("type is too long");
    if (note.length > 400) return badRequest("note is too long");
    if (addedBy.length > 80) return badRequest("name is too long");

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      location,
      type,
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

export const config = { path: "/api/studios" };
