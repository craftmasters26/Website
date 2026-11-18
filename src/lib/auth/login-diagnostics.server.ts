/**
 * Login diagnostics (server-only).
 *
 * Better Auth turns EVERY failed Discord token exchange into the same vague `?error=invalid_code`.
 * The real reason (wrong client secret, redirect URI mismatch, code already used, ...) only reaches
 * its logger. This module keeps the last few of those reasons (name + HTTP status only, never
 * secrets) so /api/login/status can show them, and can test the Discord credentials directly.
 */
type Level = "debug" | "info" | "warn" | "error";

export type LoginFailure = { at: string; step: string; status?: number; error?: string };

const recent: LoginFailure[] = [];

function pick(arg: unknown): { status?: number; error?: string } {
  if (!arg || typeof arg !== "object") return {};
  const a = arg as Record<string, unknown>;
  const status = typeof a.status === "number" ? a.status : undefined;
  const raw = a.error ?? a.message ?? a.statusText;
  const error = typeof raw === "string" ? raw.slice(0, 80) : undefined;
  return { status, error };
}

/** Plug into betterAuth({ logger }). Still prints to the console like the default logger did. */
export function authLog(level: Level, message: string, ...args: unknown[]): void {
  const printer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  printer(`[Better Auth] ${message}`, ...args);
  if (level !== "error" && level !== "warn") return;
  const step = /validate authorization code/i.test(message)
    ? "token_exchange"
    : /user info/i.test(message)
      ? "user_info"
      : /state/i.test(message)
        ? "state"
        : null;
  if (!step) return;
  recent.unshift({ at: new Date().toISOString(), step, ...pick(args[0]) });
  if (recent.length > 5) recent.length = 5;
}

export function recentLoginFailures(): LoginFailure[] {
  return [...recent];
}

export type CredentialCheck = { result: "ok" | "wrong_secret_or_id" | "unreachable" | "not_configured"; detail: string };

let cached: { at: number; value: CredentialCheck } | null = null;

/**
 * Asks Discord to accept DISCORD_CLIENT_ID + DISCORD_CLIENT_SECRET (client_credentials grant, scope
 * `identify`). Accepted => the id/secret pair is correct, so a failing login is a redirect-URI or
 * reused-code problem instead. Cached for a minute so the public status page cannot hammer Discord.
 */
export async function checkDiscordCredentials(): Promise<CredentialCheck> {
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  const id = process.env.DISCORD_CLIENT_ID?.trim();
  const secret = process.env.DISCORD_CLIENT_SECRET?.trim();
  let value: CredentialCheck;
  if (!id || !secret) {
    value = { result: "not_configured", detail: "DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is empty." };
  } else {
    try {
      const res = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        },
        body: new URLSearchParams({ grant_type: "client_credentials", scope: "identify" }),
        signal: AbortSignal.timeout(6000),
      });
      value =
        res.ok
          ? { result: "ok", detail: "Discord accepts the client id and secret." }
          : res.status === 401 || res.status === 400
            ? {
                result: "wrong_secret_or_id",
                detail: `Discord answered ${res.status}: the client id/secret pair is wrong. Reset the secret in the Developer Portal (OAuth2) and paste the NEW one into DISCORD_CLIENT_SECRET.`,
              }
            : { result: "unreachable", detail: `Discord answered ${res.status}.` };
    } catch (err) {
      value = { result: "unreachable", detail: err instanceof Error ? err.message : "request failed" };
    }
  }
  cached = { at: Date.now(), value };
  return value;
}
