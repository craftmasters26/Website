/**
 * GET /api/leaderboard — the LIVE daily leaderboard (most catches since 00:00 UTC).
 * Public. The browser polls this every ~15s; the page the visitor sees is at /leaderboard.
 *
 * It asks the bot (BOT_API_URL + BOT_API_SECRET, same as the Inventory page) and
 * caches the answer for a few seconds so a crowd of open tabs is ONE request to
 * the bot, not one each. If the bot hiccups it serves the last good answer
 * (flagged stale) instead of an error.
 */
import { defineEventHandler, setResponseHeader, setResponseStatus } from "h3";

const CACHE_MS = 8_000;

type Payload = Record<string, unknown>;
let cache: { at: number; payload: Payload } | null = null;
let inflight: Promise<Payload> | null = null;

async function load(): Promise<Payload> {
  const base = process.env.BOT_API_URL?.trim();
  const secret = process.env.BOT_API_SECRET?.trim();
  if (!base || !secret) throw new Error("not-configured");
  const res = await fetch(`${base.replace(/\/+$/, "")}/internal/leaderboard/daily?limit=25`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`bot-${res.status}`);
  return (await res.json()) as Payload;
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "cache-control", "public, s-maxage=5, stale-while-revalidate=15");
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.payload;
  try {
    inflight ??= load().finally(() => {
      inflight = null;
    });
    const payload = await inflight;
    cache = { at: Date.now(), payload };
    return payload;
  } catch (err) {
    if (cache) return { ...cache.payload, stale: true };
    setResponseStatus(event, 503);
    return { error: err instanceof Error ? err.message : "leaderboard unavailable" };
  }
});
