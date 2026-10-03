import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth/middleware";

/**
 * Loads the signed-in player's real collection from the Discord bot.
 *
 * Login itself (`signInWithDiscord` in `@/lib/auth/client`) is now real,
 * direct Discord OAuth on THIS app — the browser never visits the bot at all.
 * The bot still owns the actual game data (KAN coins, catch history), so this
 * server function makes a server-to-server call to the bot's API using the
 * visitor's verified Discord id (from their session, via
 * `getDiscordAccountId`) plus a shared secret — not a per-user token, and not
 * anything the browser has to carry or that can strand the browser on the
 * bot's own domain if it's slow or briefly offline.
 *
 * Requires two SERVER-ONLY env vars (do not prefix with VITE_ — that would
 * ship the secret to the browser):
 *   BOT_API_URL     the bot's own base URL (its Flask app's public origin —
 *                    can still be an ngrok URL; that's fine now, since it's
 *                    only ever called from the server, never redirected to)
 *   BOT_API_SECRET  a shared secret only this site and the bot know, so the
 *                    bot can trust the discord_id this site sends it
 *
 * On the bot side, add an internal endpoint that trusts this secret, e.g.:
 *
 *   @app.route("/internal/player/<discord_id>")
 *   def internal_player(discord_id):
 *       if request.headers.get("Authorization") != f"Bearer {BOT_API_SECRET}":
 *           return "", 401
 *       player = get_player(discord_id)  # however you already look this up
 *       if not player:
 *           return "", 404
 *       return jsonify({
 *           "username": player.username,
 *           "avatar_url": player.avatar_url,
 *           "kan_coins": player.kan_coins,
 *           "owned_character_ids": player.owned_character_ids,
 *           "reiatsu_character_ids": player.reiatsu_character_ids,
 *           "owned_weapon_ids": player.owned_weapon_ids,
 *       })
 *
 * IMPORTANT: this file is NOT named `*.server.ts`, and that's on purpose.
 * `owned.ts` (client code) imports `getMyInventory` from here directly — that
 * only works because it's wrapped in `createServerFn(...).handler(...)`.
 * TanStack Start strips the handler body out of the client bundle and
 * replaces it with an RPC call automatically. Do NOT rename this file to
 * `inventory.server.ts` and do NOT move the handler body out of
 * `createServerFn` — either change reintroduces the "server-only module
 * imported by client code" build failure this file was written to avoid.
 */

type BotPlayerResponse = {
  username: string;
  avatar_url: string;
  kan_coins: number;
  owned_character_ids: number[];
  reiatsu_character_ids: number[];
  owned_weapon_ids: number[];
};

export type InventoryMe = {
  discordId: string;
  username: string;
  avatarUrl: string;
  kan: number;
  ownedCharacterIds: number[];
  reiatsuCharacterIds: number[];
  ownedWeaponIds: number[];
};

export type InventoryResult =
  | { status: "ok"; me: InventoryMe }
  /** Signed in, but not with Discord (shouldn't normally happen — login is
   * Discord-only — but covers an account linked another way). */
  | { status: "not-linked" }
  /** The bot has never seen this Discord id (never caught/claimed anything). */
  | { status: "no-record" }
  /** BOT_API_URL / BOT_API_SECRET aren't set on this deployment yet. */
  | { status: "not-configured" }
  /** Couldn't reach the bot (offline, tunnel down, network blip), or it answered
   * with something other than the player JSON. `detail` says which, so the
   * page can tell you what to fix instead of always blaming "offline". */
  | { status: "network-error"; detail?: BotErrorDetail };

export type BotErrorDetail =
  /** fetch() itself failed: wrong BOT_API_URL, tunnel down, bot process stopped. */
  | "unreachable"
  /** Bot answered 401: BOT_API_SECRET on Vercel != BOT_API_SECRET on the bot. */
  | "secret-mismatch"
  /** Bot answered 503: the bot has no BOT_API_SECRET set in ITS environment. */
  | "bot-secret-missing"
  /** Answered, but not JSON (e.g. an ngrok interstitial / wrong URL / HTML error page). */
  | "bad-response"
  /** Any other non-OK status. */
  | "bot-error";

export const getMyInventory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<InventoryResult> => {
    const { getDiscordAccountId } = await import("./auth/verify.server");
    const discordId = await getDiscordAccountId(context.bearerToken);
    if (!discordId) return { status: "not-linked" };

    const botApiUrl = process.env.BOT_API_URL?.trim();
    const botApiSecret = process.env.BOT_API_SECRET?.trim();
    if (!botApiUrl || !botApiSecret) return { status: "not-configured" };

    let res: Response;
    try {
      res = await fetch(`${botApiUrl.replace(/\/+$/, "")}/internal/player/${discordId}`, {
        headers: {
          Authorization: `Bearer ${botApiSecret}`,
          accept: "application/json",
          // ngrok's free tier can serve an HTML warning page instead of the bot's
          // response; this header makes it pass straight through.
          "ngrok-skip-browser-warning": "true",
        },
        // Don't let a dead tunnel hang the serverless function.
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      console.error("[inventory] bot unreachable:", err);
      return { status: "network-error", detail: "unreachable" };
    }
    if (res.status === 404) return { status: "no-record" };
    if (res.status === 401) {
      console.error("[inventory] bot returned 401 — BOT_API_SECRET mismatch");
      return { status: "network-error", detail: "secret-mismatch" };
    }
    if (res.status === 503) {
      console.error("[inventory] bot returned 503 — BOT_API_SECRET not set on the bot");
      return { status: "network-error", detail: "bot-secret-missing" };
    }
    if (!res.ok) {
      console.error("[inventory] bot returned", res.status);
      return { status: "network-error", detail: "bot-error" };
    }

    let data: BotPlayerResponse;
    try {
      data = (await res.json()) as BotPlayerResponse;
    } catch {
      console.error("[inventory] bot response was not JSON (wrong BOT_API_URL or tunnel page?)");
      return { status: "network-error", detail: "bad-response" };
    }
    // Prefer the name/avatar from the visitor's Discord login session; the bot
    // may only know a placeholder like "Player 6616" and no avatar.
    const { getSessionProfile } = await import("./auth/verify.server");
    const profile = await getSessionProfile(context.bearerToken);
    return {
      status: "ok",
      me: {
        discordId,
        username: profile.name || data.username,
        avatarUrl: profile.image || data.avatar_url,
        kan: data.kan_coins,
        ownedCharacterIds: data.owned_character_ids ?? [],
        reiatsuCharacterIds: data.reiatsu_character_ids ?? [],
        ownedWeaponIds: data.owned_weapon_ids ?? [],
      },
    };
  });
