/**
 * GET /api/leaderboard?period=daily|weekly|monthly — the LIVE leaderboard.
 * Public. The browser polls this every ~15s; the page the visitor sees is at /leaderboard.
 *
 * It asks the bot (BOT_API_URL + BOT_API_SECRET, same as the Inventory page) and
 * caches the answer per period for a few seconds so a crowd of open tabs is ONE
 * request to the bot, not one each. If the bot hiccups it serves the last good
 * answer (flagged stale) instead of an error.
 *
 * Names: the bot can only name players it has cached, and sends "Player 1234"
 * for the rest. When DISCORD_BOT_TOKEN is set on Vercel, those placeholders are
 * swapped for the real Discord display name + avatar (looked up once, cached 6h).
 */
import { defineEventHandler, getQuery, setResponseHeader, setResponseStatus } from "h3";

const PERIODS = ["daily", "weekly", "monthly"] as const;
type Period = (typeof PERIODS)[number];

const CACHE_MS = 8_000;
const NAME_TTL_MS = 6 * 60 * 60 * 1000;
const NAME_MISS_TTL_MS = 10 * 60 * 1000;

type Payload = Record<string, any>;
const cache = new Map<Period, { at: number; payload: Payload }>();
const inflight = new Map<Period, Promise<Payload>>();

type Profile = { username: string; avatar_url: string };
const names = new Map<string, { at: number; profile: Profile | null }>();

const isPlaceholder = (name: unknown) =>
  typeof name !== "string" || !name.trim() || /^Player \d{1,6}$/i.test(name.trim());

async function lookupDiscord(id: string): Promise<Profile | null> {
  const hit = names.get(id);
  if (hit && Date.now() - hit.at < (hit.profile ? NAME_TTL_MS : NAME_MISS_TTL_MS)) return hit.profile;
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) return null;
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: { Authorization: `Bot ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (res.status === 429) return hit?.profile ?? null; // rate limited: retry next poll
    if (!res.ok) {
      names.set(id, { at: Date.now(), profile: null });
      return null;
    }
    const u = (await res.json()) as {
      id: string;
      username: string;
      global_name?: string | null;
      avatar?: string | null;
      discriminator?: string;
    };
    const profile: Profile = {
      username: u.global_name || u.username,
      avatar_url: u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`,
    };
    names.set(id, { at: Date.now(), profile });
    return profile;
  } catch {
    return hit?.profile ?? null;
  }
}

async function withRealNames(payload: Payload): Promise<Payload> {
  if (!Array.isArray(payload.entries)) return payload;
  const entries = await Promise.all(
    payload.entries.map(async (e: Payload) => {
      if (!isPlaceholder(e.username) || !e.discord_id) return e;
      const p = await lookupDiscord(String(e.discord_id));
      return p ? { ...e, username: p.username, avatar_url: e.avatar_url || p.avatar_url } : e;
    }),
  );
  return { ...payload, entries };
}

async function load(period: Period): Promise<Payload> {
  const base = process.env.BOT_API_URL?.trim();
  const secret = process.env.BOT_API_SECRET?.trim();
  if (!base || !secret) throw new Error("not-configured");
  const res = await fetch(`${base.replace(/\/+$/, "")}/internal/leaderboard/${period}?limit=25`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`bot-${res.status}`);
  const payload = (await res.json()) as Payload;
  return { ...(await withRealNames(payload)), period };
}

export default defineEventHandler(async (event) => {
  const q = String(getQuery(event).period ?? "daily").toLowerCase();
  const period: Period = (PERIODS as readonly string[]).includes(q) ? (q as Period) : "daily";

  setResponseHeader(event, "cache-control", "public, s-maxage=5, stale-while-revalidate=15");
  const hit = cache.get(period);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.payload;
  try {
    let p = inflight.get(period);
    if (!p) {
      p = load(period).finally(() => inflight.delete(period));
      inflight.set(period, p);
    }
    const payload = await p;
    cache.set(period, { at: Date.now(), payload });
    return payload;
  } catch (err) {
    if (hit) return { ...hit.payload, stale: true };
    setResponseStatus(event, 503);
    return { error: err instanceof Error ? err.message : "leaderboard unavailable", period };
  }
});
