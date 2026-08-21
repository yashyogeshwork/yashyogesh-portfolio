import { getStore } from "@netlify/blobs";

export default async (req) => {
  const secret = process.env.TRACK_SECRET;

  if (req.method === "POST") {
    const { lat, lon, secret: bodySecret } = await req.json();
    if (bodySecret !== secret) return new Response("unauthorized", { status: 401 });
    const store = getStore("location");
    await store.setJSON("latest", { lat, lon, time: new Date().toISOString() });
    return new Response("ok");
  }

  const url = new URL(req.url);
  if (url.searchParams.get("key") !== secret) {
    return new Response("not found", { status: 404 });
  }

  const store = getStore("location");
  const data = await store.get("latest", { type: "json" });
  if (!data) return new Response("no location yet");
  return new Response(
    `Last seen: ${data.time}\nhttps://maps.google.com/?q=${data.lat},${data.lon}`
  );
};

export const config = { path: "/track" };