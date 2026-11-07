/**
 * POST /api/client-error — receives uncaught browser errors (see src/lib/error-reporter.ts) and
 * posts them to a Discord channel. Uses ERROR_WEBHOOK_URL, or CONTACT_WEBHOOK_URL if that is unset.
 * Rate-limited per IP; always answers 204 so it never affects the page.
 */
import { defineEventHandler, getRequestIP, readBody, setResponseStatus } from "h3";

const hits = new Map<string, number[]>();
const recent = new Map<string, number>(); // message -> last sent time (global de-dupe)
const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** Plain-English meaning of the minified React errors that show up most, so the Discord post is readable. */
const REACT_ERRORS: Record<string, string> = {
  "418": "Hydration mismatch: the text React built in the browser differed from the server's HTML.",
  "423": "Hydration mismatch: React had to throw away the server HTML and re-render in the browser.",
  "425": "Hydration mismatch: a text node differed between server and browser.",
  "310": "A React hook ran a different number of times between renders.",
};
const reactHint = (message: string) => {
  const m = /Minified React error #(\d+)/.exec(message);
  return m ? (REACT_ERRORS[m[1]] ?? null) : null;
};

export default defineEventHandler(async (event) => {
  setResponseStatus(event, 204);
  const webhook = process.env.ERROR_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) return null;

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  const now = Date.now();
  const mine = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (mine.length >= 20) return null;
  mine.push(now);
  hits.set(ip, mine);

  const body = (await readBody(event).catch(() => ({}))) as Record<string, unknown>;
  const message = clip(body.message, 300);
  if (!message) return null;
  if (now - (recent.get(message) ?? 0) < 30 * 60 * 1000) return null; // same error: at most once per 30 min
  recent.set(message, now);

  await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "Website errors",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: "Browser error",
          description: (reactHint(message) ? "**" + reactHint(message) + "**\n" : "") + "```\n" + message.replace(/```/g, "'''") + "\n" + clip(body.stack, 900).replace(/```/g, "'''") + "\n```",
          color: 0xb42318,
          fields: [
            { name: "Page", value: clip(body.url, 200) || "?", inline: true },
            { name: "Browser", value: clip(body.ua, 160) || "?", inline: false },
          ],
        },
      ],
    }),
  }).catch(() => null);
  return null;
});
