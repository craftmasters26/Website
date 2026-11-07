/**
 * GET /api/stats — public, aggregate, non-identifying totals for the home page
 * (registered players, cards caught). Proxied from the bot and cached for 5 minutes so
 * traffic spikes on the site never turn into load on the bot.
 */
import { defineEventHandler, setResponseHeader, setResponseStatus } from "h3";

type Stats = { players: number; cardsCaught: number; servers?: number; activePlayers24h?: number };
const TTL_MS = 5 * 60_000;
let cache: { at: number; value: Stats } | null = null;

export default defineEventHandler(async (event) => {
  if (cache && Date.now() - cache.at < TTL_MS) {
    setResponseHeader(event, "cache-control", "public, max-age=300, stale-while-revalidate=900");
    return cache.value;
  }
  const base = process.env.BOT_API_URL?.trim().replace(/\/+$/, "");
  try {
    if (!base) throw new Error("not configured");
    const res = await fetch(`${base}/api/stats`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`bot ${res.status}`);
    const j = (await res.json()) as {
      registered_players?: unknown;
      total_cards_caught?: unknown;
      servers?: unknown;
      active_players_24h?: unknown;
    };
    const players = Number(j.registered_players);
    const cardsCaught = Number(j.total_cards_caught);
    if (!Number.isFinite(players) || !Number.isFinite(cardsCaught)) throw new Error("bad shape");
    // Newer bots also report servers + 24h-active players; older bots simply omit them.
    const optional = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);
    cache = {
      at: Date.now(),
      value: {
        players,
        cardsCaught,
        servers: optional(j.servers),
        activePlayers24h: optional(j.active_players_24h),
      },
    };
    setResponseHeader(event, "cache-control", "public, max-age=300, stale-while-revalidate=900");
    return cache.value;
  } catch {
    if (cache) return cache.value; // serve slightly stale rather than nothing
    setResponseHeader(event, "cache-control", "no-store");
    setResponseStatus(event, 503);
    return { error: "stats unavailable" };
  }
});
