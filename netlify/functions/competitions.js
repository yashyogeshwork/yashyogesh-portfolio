import { getStore } from "@netlify/blobs";

// Live-editable list of open design competitions/briefs (BYD, SAIC, Geely,
// GAC and similar keep running these). Same open-access model as the rest
// of this page: no login, goes live immediately, attribution is an
// optional typed name.
//
// Storage: one Netlify Blobs store ("competitions"), one key ("all")
// holding the full JSON array:
//   [{ id, host, name, deadline, link, addedBy, addedAt }, ...]
// deadline is an ISO date string (yyyy-mm-dd) or empty. link is optional.
//
// GET  /api/competitions                                          -> [...]
// POST /api/competitions  { host, name, deadline, link, addedBy }  -> creates one, returns it (link optional)
// DELETE /api/competitions  { id }                                  -> removes one

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
  const store = getStore("competitions");

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
    const host = (body.host || "").trim();
    const name = (body.name || "").trim();
    const deadline = (body.deadline || "").trim();
    const link = (body.link || "").trim();
    const addedBy = (body.addedBy || "").trim();

    if (!host) return badRequest("host is required");
    if (!name) return badRequest("name is required");
    if (host.length > 120) return badRequest("host is too long");
    if (name.length > 160) return badRequest("name is too long");
    if (link.length > 500) return badRequest("link is too long");
    if (addedBy.length > 80) return badRequest("name is too long");
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return badRequest("deadline must be yyyy-mm-dd");
    if (link) {
      try {
        // eslint-disable-next-line no-new
        new URL(link);
      } catch {
        return badRequest("that doesn't look like a valid URL");
      }
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      host,
      name,
      deadline: deadline || "",
      link,
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

export const config = { path: "/api/competitions" };
