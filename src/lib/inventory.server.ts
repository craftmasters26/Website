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
  /** Couldn't reach the bot (offline, tunnel down, network blip). */
  | { status: "network-error" };

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
        headers: { Authorization: `Bearer ${botApiSecret}`, accept: "application/json" },
      });
    } catch {
      return { status: "network-error" };
    }
    if (res.status === 404) return { status: "no-record" };
    if (!res.ok) return { status: "network-error" };

    const data = (await res.json()) as BotPlayerResponse;
    return {
      status: "ok",
      me: {
        discordId,
        username: data.username,
        avatarUrl: data.avatar_url,
        kan: data.kan_coins,
        ownedCharacterIds: data.owned_character_ids ?? [],
        reiatsuCharacterIds: data.reiatsu_character_ids ?? [],
        ownedWeaponIds: data.owned_weapon_ids ?? [],
      },
    };
  });
