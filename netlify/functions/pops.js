import { getStore } from "@netlify/blobs";

// Shared pop-it counter for the About page: one running total of bubbles
// popped by every visitor. Pops are sent in small batches from the page,
// not one request per pop.
//
// GET  /api/pops              -> { total }
// POST /api/pops { count }    -> adds count (1..500 per request), returns { total }
//
// Concurrent visitors can occasionally overwrite each other's increment by
// a few pops; for a playful counter that is an acceptable trade-off against
// adding a database.

const KEY = "total";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export default async (req) => {
  const store = getStore("popit");

  if (req.method === "GET") {
    const total = Number(await store.get(KEY)) || 0;
    return json({ total });
  }

  if (req.method === "POST") {
    let body = {};
    try { body = await req.json(); } catch (e) { return json({ error: "bad json" }, 400); }
    const count = Math.floor(Number(body.count));
    if (!Number.isFinite(count) || count < 1 || count > 500) return json({ error: "count must be 1-500" }, 400);
    const total = (Number(await store.get(KEY)) || 0) + count;
    await store.set(KEY, String(total));
    return json({ total });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/pops" };
