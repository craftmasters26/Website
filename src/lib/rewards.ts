import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth/middleware";

/**
 * "Watch an ad, get extra /pack daily".
 *
 * Flow: getAdStatus -> startAd (signed token) -> the ad plays in the browser ->
 * claimAd (token + minimum watch time checked here) -> the bot raises today's
 * /pack daily bucket by 1 (max 2 a day, enforced by the bot, one-time nonce).
 *
 * This file is NOT *.server.ts on purpose (client code imports the server
 * functions); handler bodies only run on the server.
 */

export type AdStatus = {
  ads_watched_today: number;
  max_ads_per_day: number;
  ads_remaining: number;
  daily_pack_limit: number;
  daily_packs_used: number;
  daily_packs_left: number;
  resets_in_seconds: number;
};

export type AdStatusResult =
  | { status: "ok"; info: AdStatus; minWatchSeconds: number }
  | { status: "not-linked" | "not-configured" | "error" };

const minWatchSeconds = () => Math.max(3, Number(process.env.AD_MIN_WATCH_SECONDS) || 8);

export const getAdStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdStatusResult> => {
    const { getDiscordAccountId } = await import("./auth/verify.server");
    const { botCall } = await import("./bot-api.server");
    const discordId = await getDiscordAccountId(context.bearerToken);
    if (!discordId) return { status: "not-linked" };
    const r = await botCall<AdStatus>(`/internal/player/${discordId}/ad-status`);
    if (r.ok) return { status: "ok", info: r.data, minWatchSeconds: minWatchSeconds() };
    return { status: r.detail === "not-configured" ? "not-configured" : "error" };
  });

export type StartAdResult =
  | { status: "ok"; token: string; minWatchSeconds: number }
  | { status: "limit-reached" | "not-linked" | "not-configured" | "error" };

export const startAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StartAdResult> => {
    const { getDiscordAccountId } = await import("./auth/verify.server");
    const { botCall, signAdToken } = await import("./bot-api.server");
    const discordId = await getDiscordAccountId(context.bearerToken);
    if (!discordId) return { status: "not-linked" };
    const r = await botCall<AdStatus>(`/internal/player/${discordId}/ad-status`);
    if (!r.ok) return { status: r.detail === "not-configured" ? "not-configured" : "error" };
    if (r.data.ads_remaining <= 0) return { status: "limit-reached" };
    return { status: "ok", token: signAdToken(discordId), minWatchSeconds: minWatchSeconds() };
  });

export type ClaimAdResult =
  | { status: "ok"; info: AdStatus }
  | { status: "too-fast" | "expired" | "invalid" | "limit-reached" | "already-used" | "error" };

export const claimAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ context, data }): Promise<ClaimAdResult> => {
    const { getDiscordAccountId } = await import("./auth/verify.server");
    const { botCall, readAdToken } = await import("./bot-api.server");
    const discordId = await getDiscordAccountId(context.bearerToken);
    if (!discordId || typeof data?.token !== "string") return { status: "invalid" };

    const parsed = readAdToken(data.token, discordId);
    if (!parsed.ok) return { status: "invalid" };
    if (parsed.ageMs < minWatchSeconds() * 1000) return { status: "too-fast" };
    if (parsed.ageMs > 15 * 60 * 1000) return { status: "expired" };

    const r = await botCall<AdStatus & { granted: boolean; reason: string | null }>(
      `/internal/player/${discordId}/ad-reward`,
      { method: "POST", body: { nonce: parsed.jti } },
    );
    if (r.ok) return { status: "ok", info: r.data };
    const reason = (r.data as { reason?: string } | undefined)?.reason;
    if (r.status === 409 && reason === "limit") return { status: "limit-reached" };
    if (r.status === 409 && reason === "replay") return { status: "already-used" };
    return { status: "error" };
  });
