/**
 * POST /api/contact — the Contact page form. Forwards the message to a private Discord
 * channel through an incoming webhook (set CONTACT_WEBHOOK_URL in the site's env file).
 * Includes a honeypot field and a small per-IP rate limit.
 */
import { defineEventHandler, getRequestIP, readBody, setResponseStatus } from "h3";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

export default defineEventHandler(async (event) => {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    setResponseStatus(event, 503);
    return { ok: false, error: "The contact form is not available right now. Please use Discord." };
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    setResponseStatus(event, 429);
    return { ok: false, error: "Too many messages. Please try again in a few minutes." };
  }

  const body = (await readBody(event).catch(() => ({}))) as Record<string, unknown>;
  if (clip(body.website, 50)) return { ok: true }; // honeypot: pretend success

  const name = clip(body.name, 80);
  const email = clip(body.email, 120);
  const topic = clip(body.topic, 40) || "General";
  const message = clip(body.message, 1500);
  if (!name || message.length < 10 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    setResponseStatus(event, 400);
    return { ok: false, error: "Please fill in your name, a valid email and a message (10+ characters)." };
  }

  recent.push(now);
  hits.set(ip, recent);

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "Website contact",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: `New message — ${topic}`,
          description: message,
          color: 0x0959d4,
          fields: [
            { name: "Name", value: name, inline: true },
            { name: "Email", value: email, inline: true },
          ],
        },
      ],
    }),
  }).catch(() => null);

  if (!res || !res.ok) {
    setResponseStatus(event, 502);
    return { ok: false, error: "Could not send your message. Please try Discord instead." };
  }
  return { ok: true };
});
