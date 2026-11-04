/**
 * GET /api/login/discord?next=/bleachdex/owned
 *
 * Starts Discord login with a plain browser navigation instead of a client-side
 * fetch. The old button called Better Auth from JavaScript and, if anything went
 * wrong (missing Discord keys, database down, bad origin), it only wrote to the
 * console — so the button looked dead. Here the browser is redirected straight to
 * Discord on success, and shows a readable message on failure.
 *
 * Discord still returns to /api/auth/callback/discord (unchanged), and Better Auth
 * then sends the visitor on to `next`.
 */
import { defineEventHandler, getQuery } from "h3";
import { auth, discordConfigured } from "@/lib/auth/server";

const DEFAULT_NEXT = "/bleachdex/owned";

/** Only allow same-site paths — never an open redirect. */
function safeNext(raw: unknown): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return DEFAULT_NEXT;
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return DEFAULT_NEXT;
  return v;
}

function page(status: number, title: string, detail: string): Response {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Login problem</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1220;color:#e6efff;font:15px/1.6 system-ui,sans-serif;padding:24px}
main{max-width:560px}h1{font-size:22px;margin:0 0 12px}code{background:#16233d;padding:2px 6px;border-radius:4px}a{color:#7cc4ff}</style></head>
<body><main><h1>${esc(title)}</h1><p>${esc(detail)}</p><p><a href="/bleachdex">Back to BleachDex</a></p></main></body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export default defineEventHandler(async (event) => {
  const next = safeNext(getQuery(event).next);

  if (!discordConfigured) {
    return page(
      500,
      "Discord login isn't configured",
      "The server has no DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET. Add both to /root/web_data/.env and restart the site (pm2 restart Bleachdex-Web --update-env).",
    );
  }

  try {
    const res = await auth.api.signInSocial({
      body: { provider: "discord", callbackURL: next, errorCallbackURL: next },
      headers: event.req.headers,
      asResponse: true,
    });

    const body = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;
    if (!res.ok || !body?.url) {
      return page(
        502,
        "Couldn't start Discord login",
        `Auth server answered ${res.status}${body?.message ? `: ${body.message}` : ""}. Check pm2 logs Bleachdex-Web for the [Better Auth] error line (usually MONGODB_URI, BETTER_AUTH_URL, or the Discord redirect URI).`,
      );
    }

    // Shows in `pm2 logs Bleachdex-Web`: this exact value must be listed under Redirects in the Discord developer portal.
    try {
      console.log("[login/discord] redirect_uri =", new URL(body.url).searchParams.get("redirect_uri"));
    } catch {
      /* logging only */
    }

    // Forward Better Auth's OAuth state cookie so the callback can verify it.
    const headers = new Headers({ location: body.url, "cache-control": "no-store" });
    for (const cookie of res.headers.getSetCookie()) headers.append("set-cookie", cookie);
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error("[login/discord] failed:", err);
    return page(
      500,
      "Couldn't start Discord login",
      `${err instanceof Error ? err.message : "Unknown error"}. Check pm2 logs Bleachdex-Web for details.`,
    );
  }
});
