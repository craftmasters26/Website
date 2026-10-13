import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Server-only helpers for talking to the bot (BOT_API_URL + BOT_API_SECRET) and
 * for the signed one-time tokens used by the "watch an ad" reward.
 * `.server.ts` = never bundled into the browser.
 */

export type BotDetail =
  | "not-configured"
  | "unreachable"
  | "secret-mismatch"
  | "bot-secret-missing"
  | "bad-response"
  | "bot-error";

export type BotResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; detail: BotDetail; error?: string; data?: unknown };

type CallOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  /** Discord id of the signed-in visitor, for the bot's admin checks. */
  acting?: string;
  timeoutMs?: number;
};

export async function botCall<T>(path: string, opts: CallOptions = {}): Promise<BotResult<T>> {
  const base = process.env.BOT_API_URL?.trim();
  const secret = process.env.BOT_API_SECRET?.trim();
  if (!base || !secret) return { ok: false, status: 0, detail: "not-configured" };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secret}`,
    accept: "application/json",
    // ngrok's free tier can answer with an HTML warning page; this skips it.
    "ngrok-skip-browser-warning": "true",
  };
  if (opts.acting) headers["X-Acting-Discord-Id"] = opts.acting;
  if (opts.body !== undefined) headers["content-type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
    });
  } catch (err) {
    console.error(`[bot] ${path} unreachable:`, err);
    return { ok: false, status: 0, detail: "unreachable" };
  }

  if (res.status === 401) return { ok: false, status: 401, detail: "secret-mismatch" };
  if (res.status === 503) {
    const maybe = (await res.json().catch(() => null)) as { error?: string } | null;
    return {
      ok: false,
      status: 503,
      detail: maybe?.error === "not configured" ? "bot-secret-missing" : "bot-error",
      error: maybe?.error,
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, status: res.status, detail: "bad-response" };
  }
  if (!res.ok) {
    const error = (data as { error?: string } | null)?.error;
    return { ok: false, status: res.status, detail: "bot-error", error, data };
  }
  return { ok: true, status: res.status, data: data as T };
}

// ── Admin check (the bot's ADMIN_USER_IDS is the only source of truth) ──────────

export type AdminLevel = "full" | "limited";
const adminCache = new Map<string, { at: number; level: AdminLevel | null }>();
const ADMIN_CACHE_MS = 30_000;

export async function getAdminLevel(discordId: string): Promise<AdminLevel | null> {
  const hit = adminCache.get(discordId);
  if (hit && Date.now() - hit.at < ADMIN_CACHE_MS) return hit.level;
  const r = await botCall<{ is_admin: boolean; level: AdminLevel | null }>(
    `/internal/admin/check/${encodeURIComponent(discordId)}`,
    { timeoutMs: 6_000 },
  );
  // Fail closed: if the bot can't be reached, nobody is an admin.
  const level = r.ok && r.data.is_admin ? r.data.level : null;
  if (r.ok) adminCache.set(discordId, { at: Date.now(), level });
  return level;
}

/** Resolves the caller's Discord id and checks the bot's admin list, or throws. */
export async function requireAdmin(
  bearerToken: string | undefined,
  need: "full" | "limited",
): Promise<{ discordId: string; level: AdminLevel }> {
  const { getDiscordAccountId } = await import("./auth/verify.server");
  const discordId = await getDiscordAccountId(bearerToken);
  const level = discordId ? await getAdminLevel(discordId) : null;
  if (!discordId || !level || (need === "full" && level !== "full")) {
    throw new Error("Forbidden");
  }
  return { discordId, level };
}

// ── Signed one-time tokens for the ad reward ───────────────────────────────────

function adSecret(): string {
  return (
    process.env.AD_REWARD_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    process.env.BOT_API_SECRET?.trim() ||
    ""
  );
}

function sign(payload: string): string {
  return createHmac("sha256", adSecret()).update(payload).digest("base64url");
}

export function signAdToken(discordId: string): string {
  const jti = randomBytes(24).toString("hex"); // 48 chars; the bot treats it as the one-time nonce
  const payload = `${discordId}.${Date.now()}.${jti}`;
  return `${payload}.${sign(payload)}`;
}

export function readAdToken(
  token: string,
  discordId: string,
): { ok: true; jti: string; ageMs: number } | { ok: false } {
  if (!adSecret()) return { ok: false };
  const parts = token.split(".");
  if (parts.length !== 4) return { ok: false };
  const [id, issued, jti, sig] = parts;
  const expected = sign(`${id}.${issued}.${jti}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  if (id !== discordId) return { ok: false };
  const ageMs = Date.now() - Number(issued);
  if (!Number.isFinite(ageMs) || ageMs < 0) return { ok: false };
  return { ok: true, jti, ageMs };
}
