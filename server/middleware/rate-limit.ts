/**
 * Per-IP limit on the public, read-only JSON APIs (catalog, leaderboard, stats). 120 requests a
 * minute is far beyond a real visitor and still stops scrapers and runaway scripts. Auth, health and
 * the contact form are not touched here (the contact form is limited in nginx).
 * The client IP comes from the X-Real-IP header nginx sets; without it nothing is limited, so a
 * misconfigured proxy can never lock everyone out.
 */
import { createRateLimiter } from "../../src/lib/rate-limit";

const LIMITED = /^\/api\/(catalog|leaderboard|stats)\/?$/;
const limiter = createRateLimiter(120, 60_000);

export default function rateLimit(
  event: { url: URL; req: { method: string; headers: Headers } },
  next: () => unknown | Promise<unknown>,
): unknown | Promise<unknown> {
  if (event.req.method !== "GET" || !LIMITED.test(event.url.pathname)) return next();
  const ip = event.req.headers.get("x-real-ip") ?? event.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return next();
  const wait = limiter.hit(ip);
  if (wait === 0) return next();
  return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
    status: 429,
    headers: { "content-type": "application/json", "retry-after": String(wait), "cache-control": "no-store" },
  });
}
