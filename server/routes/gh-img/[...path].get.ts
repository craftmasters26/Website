/**
 * GET /gh-img/<path>[?w=480] — serves character/weapon art that lives in the GitHub repo, fetched
 * once and cached on this server's disk (so visitors never depend on raw.githubusercontent.com).
 *
 * Image optimisation (optional, automatic): when the browser accepts WebP and the `sharp` package
 * is installed, the art is resized to the requested width (?w=, one of ALLOWED_WIDTHS) and served as
 * WebP. A 1.4 MB PNG card becomes roughly 35 KB. If sharp is missing, the image is too odd to
 * convert, or anything else goes wrong, the original file is served unchanged — it can never be
 * worse than before. Responses send `Vary: Accept` so caches keep both formats apart.
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
  avif: "image/avif",
  gif: "image/gif",
};
const CONVERTIBLE = new Set(["png", "jpg", "jpeg"]);
/** Widths the site asks for (see src/lib/img.ts). Anything else is ignored, so the cache can't be flooded. */
const ALLOWED_WIDTHS = new Set([240, 360, 480, 720, 960]);

const HEADERS = (type: string) => ({
  "content-type": type,
  "cache-control": "public, max-age=2592000, immutable",
  "x-content-type-options": "nosniff",
  vary: "Accept",
});

type Sharp = typeof import("sharp");
let sharpPromise: Promise<Sharp | null> | null = null;
function loadSharp(): Promise<Sharp | null> {
  sharpPromise ??= import("sharp")
    .then((m) => {
      const s = ((m as { default?: Sharp }).default ?? (m as unknown as Sharp)) as Sharp;
      s.concurrency(1); // small VPS: one conversion at a time, never starve the site
      return s;
    })
    .catch(() => null);
  return sharpPromise;
}

/** Optional local mirror of the art (see scripts/download-art.mjs). Checked before GitHub. */
const ART_DIR = process.env.ART_DIR || "";
const EXTS = ["png", "jpg", "jpeg", "webp", "avif"];
const SIBLINGS = [
  ["Character cards", "Character Images", "new soul images/New Character Images"],
  ["Weapon cards", "Weapons images"],
  ["Craftable Cards", "Craftable Images"],
];

/** Same file, other extensions / sibling art folders — the repo and the data often disagree. */
function candidates(decoded: string): string[] {
  const out = [decoded];
  const m = decoded.match(/^(.*)\.([^./]+)$/);
  const stem = m ? m[1] : decoded;
  const ext = m ? m[2].toLowerCase() : "";
  const dirs = [stem.slice(0, Math.max(0, stem.lastIndexOf("/")))];
  const file = stem.slice(stem.lastIndexOf("/") + 1);
  for (const group of SIBLINGS) if (group.includes(dirs[0])) dirs.push(...group.filter((g) => g !== dirs[0]));
  for (const d of dirs) for (const e of [ext, ...EXTS]) {
    const c = `${d}/${file}.${e}`;
    if (e && !out.includes(c)) out.push(c);
  }
  return out;
}

async function fetchUpstream(rel: string): Promise<Response | null> {
  for (let i = 0; i < 2; i++) {
    const res = await fetch(UPSTREAM + rel, {
      headers: { "user-agent": "boundless-site" },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);
    if (res?.ok) return res;
    if (res && res.status === 404) return null;
  }
  return null;
}

const sha = (s: string) => createHash("sha1").update(s).digest("hex");

async function readIfExists(file: string): Promise<Buffer | null> {
  try {
    return await readFile(file);
  } catch {
    return null;
  }
}

async function writeAtomic(file: string, buf: Buffer) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, buf);
    await rename(tmp, file);
  } catch {
    /* caching is best-effort */
  }
}

/** Several visitors asking for the same variant at once share one conversion. */
const inflight = new Map<string, Promise<Buffer | null>>();

async function makeWebp(original: Buffer, width: number, file: string): Promise<Buffer | null> {
  const cached = await readIfExists(file);
  if (cached) return cached;
  let job = inflight.get(file);
  if (!job) {
    job = (async () => {
      const sharp = await loadSharp();
      if (!sharp) return null;
      try {
        let img = sharp(original, { failOn: "none" }).rotate();
        if (width) img = img.resize({ width, withoutEnlargement: true });
        const out = await img.webp({ quality: 82, effort: 4 }).toBuffer();
        await writeAtomic(file, out);
        return out;
      } catch {
        return null;
      }
    })().finally(() => inflight.delete(file));
    inflight.set(file, job);
  }
  return job;
}

export default defineEventHandler(async (event) => {
  const url = event.url ?? new URL(event.req.url, "http://localhost");
  const rel = url.pathname.replace(/^\/gh-img\//, "");
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

  const wParam = Number(url.searchParams.get("w"));
  const width = ALLOWED_WIDTHS.has(wParam) ? wParam : 0;
  const wantsWebp = CONVERTIBLE.has(ext) && /image\/webp/i.test(event.req.headers.get("accept") ?? "");

  // 1) Original bytes: from disk, else from GitHub (then cached).
  const originalFile = join(CACHE_DIR, sha(decoded));
  let original = await readIfExists(originalFile);
  let actualType = type;
  if (!original) {
    for (const cand of candidates(decoded)) {
      if (ART_DIR) {
        const local = await readIfExists(join(ART_DIR, cand));
        if (local) {
          original = local;
          actualType = TYPES[cand.split(".").pop()!.toLowerCase()] ?? type;
          break;
        }
      }
      const res = await fetchUpstream(cand.split("/").map(encodeURIComponent).join("/"));
      if (res) {
        original = Buffer.from(await res.arrayBuffer());
        actualType = TYPES[cand.split(".").pop()!.toLowerCase()] ?? type;
        break;
      }
    }
    if (!original) {
      return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=60" } });
    }
    await writeAtomic(originalFile, original);
    await writeAtomic(`${originalFile}.type`, Buffer.from(actualType));
  } else {
    const t = await readIfExists(`${originalFile}.type`);
    if (t) actualType = t.toString();
  }
  const sourceIsConvertible = actualType === "image/png" || actualType === "image/jpeg";

  // 2) Optimised variant when the browser can take it.
  if (wantsWebp && sourceIsConvertible) {
    const webp = await makeWebp(original, width, join(CACHE_DIR, `${sha(`${decoded}|${width}`)}.webp`));
    if (webp) return new Response(new Uint8Array(webp), { headers: HEADERS("image/webp") });
  }

  return new Response(new Uint8Array(original), { headers: HEADERS(actualType) });
});
