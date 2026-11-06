/**
 * GET /api/ready — readiness diagnostics (database + bot API), kept separate from the
 * public liveness probe. Requires `Authorization: Bearer <BOT_API_SECRET>`; anyone else
 * gets a plain 404 so the endpoint's existence is not advertised.
 *
 * deploy/deploy-web.sh calls this after a build; it is also handy for your own checks:
 *   curl -H "Authorization: Bearer $BOT_API_SECRET" http://127.0.0.1:3000/api/ready
 */
import { defineEventHandler, getHeader, setResponseHeader, setResponseStatus } from "h3";
import { timingSafeEqual } from "node:crypto";
import { MongoClient } from "mongodb";

type Check = { ok: boolean; ms?: number; detail?: string };

function authorised(header: string | undefined): boolean {
  const secret = process.env.BOT_API_SECRET?.trim();
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function timed(fn: () => Promise<void>): Promise<Check> {
  const t0 = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, detail: err instanceof Error ? err.message : "failed" };
  }
}

async function checkMongo(): Promise<Check> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) return { ok: false, detail: "MONGODB_URI not set" };
  return timed(async () => {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
    try {
      await client.connect();
      await client.db().command({ ping: 1 });
    } finally {
      await client.close().catch(() => {});
    }
  });
}

async function checkBot(): Promise<Check> {
  const base = process.env.BOT_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return { ok: false, detail: "BOT_API_URL not set" };
  return timed(async () => {
    const res = await fetch(`${base}/api/stats`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`bot answered ${res.status}`);
  });
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  if (!authorised(getHeader(event, "authorization"))) {
    setResponseStatus(event, 404);
    return "Not Found";
  }
  const [database, bot] = await Promise.all([checkMongo(), checkBot()]);
  const ready = database.ok && bot.ok;
  setResponseStatus(event, ready ? 200 : 503);
  return { status: ready ? "ready" : "degraded", database, bot };
});
