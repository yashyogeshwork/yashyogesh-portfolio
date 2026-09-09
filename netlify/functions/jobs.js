import { getStore } from "@netlify/blobs";

// Live, open job-postings board tied to company entries on the companies page.
// No auth, no review queue, no accounts, by explicit design decision:
// anyone with the page link can add a posting under a company, attributed by
// the name they type in the form. Postings go live immediately.
//
// Storage shape: one Netlify Blobs store ("company-jobs"), one key per
// company id, value = JSON array of postings for that company:
//   [{ id, role, link, postedBy, postedAt }, ...]
//
// GET  /api/jobs                     -> { companies: { [companyId]: [...] } }  (everything, for the page's initial load)
// GET  /api/jobs?companyId=eu-1      -> [...]  (postings for just that company)
// POST /api/jobs  { companyId, role, link, postedBy }  -> creates a posting, returns it
// DELETE /api/jobs  { companyId, id }  -> removes a single posting (lets someone undo their own mistaken entry)

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
  const store = getStore("company-jobs");
  const url = new URL(req.url);

  if (req.method === "GET") {
    const companyId = url.searchParams.get("companyId");
    if (companyId) {
      const postings = (await store.get(companyId, { type: "json" })) || [];
      return json(postings);
    }
    // No companyId: return everything, keyed by company id, for the page's
    // initial load so it doesn't have to make 218 separate requests.
    const { blobs } = await store.list();
    const companies = {};
    await Promise.all(
      blobs.map(async (b) => {
        const postings = await store.get(b.key, { type: "json" });
        if (postings && postings.length) companies[b.key] = postings;
      })
    );
    return json({ companies });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return badRequest("invalid JSON body");
    }
    const companyId = (body.companyId || "").trim();
    const role = (body.role || "").trim();
    const link = (body.link || "").trim();
    const postedBy = (body.postedBy || "").trim();

    if (!companyId) return badRequest("companyId is required");
    if (!role) return badRequest("role is required");
    if (!postedBy) return badRequest("your name is required");
    if (role.length > 200) return badRequest("role is too long");
    if (link.length > 500) return badRequest("link is too long");
    if (postedBy.length > 80) return badRequest("name is too long");

    const posting = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      link,
      postedBy,
      postedAt: new Date().toISOString(),
    };

    const existing = (await store.get(companyId, { type: "json" })) || [];
    existing.unshift(posting);
    await store.setJSON(companyId, existing);

    return json(posting, 201);
  }

  if (req.method === "DELETE") {
    let body;
    try {
      body = await req.json();
    } catch {
      return badRequest("invalid JSON body");
    }
    const companyId = (body.companyId || "").trim();
    const id = (body.id || "").trim();
    if (!companyId || !id) return badRequest("companyId and id are required");

    const existing = (await store.get(companyId, { type: "json" })) || [];
    const next = existing.filter((p) => p.id !== id);
    await store.setJSON(companyId, next);
    return json({ ok: true, removed: existing.length !== next.length });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/jobs" };
