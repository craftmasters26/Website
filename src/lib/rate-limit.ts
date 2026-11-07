/**
 * Tiny fixed-window rate limiter (per key, in memory). Used to keep scrapers and runaway scripts
 * from hammering the public read-only APIs. The limits are far above anything a real visitor
 * produces, so normal use is never affected.
 */
export type RateLimiter = {
  /** Returns 0 when the request is allowed, otherwise the seconds until the window resets. */
  hit: (key: string, now?: number) => number;
  size: () => number;
};

export function createRateLimiter(limit: number, windowMs: number, maxKeys = 5000): RateLimiter {
  const buckets = new Map<string, { start: number; count: number }>();
  return {
    hit(key, now = Date.now()) {
      let b = buckets.get(key);
      if (!b || now - b.start >= windowMs) {
        if (buckets.size >= maxKeys) {
          // Drop expired entries first; if it is still full, start over rather than grow without bound.
          for (const [k, v] of buckets) if (now - v.start >= windowMs) buckets.delete(k);
          if (buckets.size >= maxKeys) buckets.clear();
        }
        b = { start: now, count: 0 };
        buckets.set(key, b);
      }
      b.count += 1;
      return b.count > limit ? Math.max(1, Math.ceil((b.start + windowMs - now) / 1000)) : 0;
    },
    size: () => buckets.size,
  };
}
