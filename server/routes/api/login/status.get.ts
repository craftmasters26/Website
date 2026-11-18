/**
 * GET /api/login/status — login self-check. Open it in the browser after trying to log in.
 * Shows config sanity and whether this browser sent a session cookie / has a valid session.
 * Never prints secrets, cookie values or user details.
 */
import { defineEventHandler, setResponseHeader } from "h3";
import { auth, discordConfigured, SESSION_TOKEN_COOKIE } from "@/lib/auth/server";
import { checkDiscordCredentials, recentLoginFailures } from "@/lib/auth/login-diagnostics.server";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const h = event.req.headers;
  const cookie = h.get("cookie") ?? "";
  const session = await auth.api.getSession({ headers: h }).catch(() => null);
  const base = (process.env.BETTER_AUTH_URL || "").trim();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  let baseHost = "";
  try {
    baseHost = new URL(base).host;
  } catch {
    /* unset */
  }
  const credentials = await checkDiscordCredentials();
  const redirectUri = base ? `${base.replace(/\/+$/, "")}/api/auth/callback/discord` : "(BETTER_AUTH_URL not set)";
  return {
    discordConfigured,
    // Must be listed EXACTLY (same characters, no trailing slash) under Redirects in the Discord Developer Portal.
    redirectUriToRegister: redirectUri,
    discordCredentials: credentials,
    recentLoginFailures: recentLoginFailures(),
    betterAuthUrl: base || "(not set)",
    requestHost: host,
    hostMatchesBetterAuthUrl: !baseHost || baseHost === host,
    forwardedProto: h.get("x-forwarded-proto") ?? "(none)",
    secretSet: Boolean(process.env.BETTER_AUTH_SECRET?.trim()),
    mongoSet: Boolean(process.env.MONGODB_URI?.trim()),
    sessionCookieSent: cookie.includes(`${SESSION_TOKEN_COOKIE}=`),
    signedIn: Boolean(session?.user),
  };
});
