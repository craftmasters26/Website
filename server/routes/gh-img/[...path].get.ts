/**
 * GET /gh-img/<path> — serves character/weapon art that lives in the GitHub repo, fetched once and
 * cached on this server's disk (so visitors never depend on raw.githubusercontent.com being fast).
 * Works on its own; the nginx `location /gh-img/` block in deploy/nginx-boundless.conf is an
 * optional extra layer in front of it.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineEventHandler } from "h3";

const UPSTREAM = "https://raw.githubusercontent.com/craftmasters26/bleachdex/main/";
const CACHE_DIR = process.env.GH_IMG_CACHE_DIR || join(tmpdir(), "bd-gh-img");
const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};
const HEADERS = (type: string) => ({
  "content-type": type,
  "cache-control": "public, max-age=2592000, immutable",
  "x-content-type-options": "nosniff",
});

export default defineEventHandler(async (event) => {
  const pathname = event.url?.pathname ?? new URL(event.req.url, "http://localhost").pathname;
  const rel = pathname.replace(/^\/gh-img\//, "");
  let decoded = "";
  try {
    decoded = decodeURIComponent(rel);
  } catch {
    return new Response("Bad path", { status: 400 });
  }
  const ext = decoded.split(".").pop()?.toLowerCase() ?? "";
  if (!rel || decoded.includes("..") || decoded.includes("\\") || !TYPES[ext]) {
    return new Response("Not found", { status: 404 });
  }
  const type = TYPES[ext];
  const file = join(CACHE_DIR, createHash("sha1").update(decoded).digest("hex"));

  try {
    return new Response(await readFile(file), { headers: HEADERS(type) });
  } catch {
    /* not cached yet */
  }

  const res = await fetch(UPSTREAM + rel, { headers: { "user-agent": "boundless-site" } }).catch(() => null);
  if (!res || !res.ok) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=60" } });
  const buf = Buffer.from(await res.arrayBuffer());

  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, buf);
    await rename(tmp, file);
  } catch {
    /* caching is best-effort */
  }
  return new Response(buf, { headers: HEADERS(type) });
});
