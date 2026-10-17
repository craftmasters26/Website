import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth/middleware";

/**
 * Admin panel server functions. The site never decides who is an admin: every
 * call re-checks the visitor's verified Discord id against the BOT's own
 * ADMIN_USER_IDS (full panel) / LIMITED_ADMIN_USER_IDS (spawn only) via
 * `requireAdmin`. Not *.server.ts on purpose — see rewards.ts.
 */

export type AdminLevel = "full" | "limited";

export type AdminGuild = {
  id: string;
  name: string;
  icon_url: string;
  member_count: number;
  owner_id: string;
  joined_at: number;
};
export type AdminChannel = { id: string; name: string; category: string };
export type AdminCharacter = {
  id: number;
  name: string;
  image_path: string;
  tier: string;
  enabled: boolean;
  hp: number;
  attack: number;
  ability_name: string;
  ability_description: string;
  emoji: string;
  card_image_path: string;
  has_template: boolean;
  craftable_only: boolean;
};
export type AdminWeapon = {
  id: number;
  name: string;
  image_path: string;
  tier: string;
  enabled: boolean;
  boost_type: "damage" | "hp";
  boost_percent: number;
  ability_name: string;
  ability_description: string;
  emoji: string;
  card_image_path: string;
  has_template: boolean;
};
export type AdminMeta = {
  drops: string[];
  bosses: { id: number; name: string; category: string; enabled: boolean }[];
  achievements: { key: string; name: string }[];
  boss_factions: { label: string; value: string }[];
  card_factions: { label: string; value: string }[];
  character_tiers: string[];
  weapon_tiers: string[];
};
export type BlacklistEntry = {
  kind: "user" | "guild";
  target_id: string;
  label: string;
  expires_at: number | null;
  reason: string;
  created_at: number;
  created_by: string;
};

type Fail = { status: "forbidden" | "bot-offline" | "error"; message?: string };

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ level: AdminLevel | null }> => {
    try {
      const { getDiscordAccountId } = await import("./auth/verify.server");
      const { getAdminLevel } = await import("./bot-api.server");
      const id = await getDiscordAccountId(context.bearerToken);
      return { level: id ? await getAdminLevel(id) : null };
    } catch {
      return { level: null };
    }
  });

async function adminCall<T>(
  bearerToken: string | undefined,
  need: "full" | "limited",
  path: string,
  body?: unknown,
): Promise<{ status: "ok"; data: T } | Fail> {
  const { requireAdmin, botCall } = await import("./bot-api.server");
  let who: { discordId: string };
  try {
    who = await requireAdmin(bearerToken, need);
  } catch {
    return { status: "forbidden" };
  }
  const r = await botCall<T>(path, {
    method: body === undefined ? "GET" : "POST",
    body,
    acting: who.discordId,
    timeoutMs: 90_000, // a spawn downloads art + posts to Discord
  });
  if (r.ok) return { status: "ok", data: r.data };
  if (r.status === 403) return { status: "forbidden" };
  if (r.detail === "unreachable" || r.detail === "not-configured") return { status: "bot-offline" };
  return { status: "error", message: r.error ?? r.detail };
}

export const adminListGuilds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    adminCall<{ count: number; total_members: number; guilds: AdminGuild[] }>(
      context.bearerToken,
      "limited",
      "/internal/admin/guilds",
    ),
  );

export const adminGuildInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { guildId: string }) => data)
  .handler(async ({ context, data }) =>
    adminCall<{ url: string }>(
      context.bearerToken,
      "full",
      `/internal/admin/guilds/${encodeURIComponent(String(data.guildId).replace(/\D/g, ""))}/invite`,
    ),
  );

export const adminListChannels = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { guildId: string }) => data)
  .handler(async ({ context, data }) =>
    adminCall<{ channels: AdminChannel[] }>(
      context.bearerToken,
      "limited",
      `/internal/admin/guilds/${encodeURIComponent(String(data.guildId).replace(/\D/g, ""))}/channels`,
    ),
  );

export const adminListCharacters = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    adminCall<{ characters: AdminCharacter[] }>(
      context.bearerToken,
      "limited",
      "/internal/admin/characters",
    ),
  );

export const adminEditCharacter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    (data: { id: number; name?: string; imageUrl?: string; imageBase64?: string }) => data,
  )
  .handler(async ({ context, data }) =>
    adminCall<{ ok: boolean; id: number; name: string; image_path: string }>(
      context.bearerToken,
      "full",
      `/internal/admin/character/${Number(data.id) | 0}`,
      {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.imageUrl ? { image_url: data.imageUrl } : {}),
        ...(data.imageBase64 ? { image_base64: data.imageBase64 } : {}),
      },
    ),
  );

export const adminSpawn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    (data: { guildId: string; channelId: string; characterId: number; amount: number }) => data,
  )
  .handler(async ({ context, data }) =>
    adminCall<{ ok: boolean; spawned: number; failed: number; name: string }>(
      context.bearerToken,
      "limited",
      "/internal/admin/spawn",
      {
        guild_id: String(data.guildId).replace(/\D/g, ""),
        channel_id: String(data.channelId).replace(/\D/g, ""),
        character_id: Number(data.characterId) | 0,
        amount: Math.max(1, Math.min(10, Number(data.amount) | 0 || 1)),
      },
    ),
  );

/**
 * One door for every other admin action. The path is allow-listed (it can only ever
 * reach the bot's /internal/admin/* routes) and the bot re-checks the visitor's
 * Discord id against ADMIN_USER_IDS on every call — see `adminCall` above.
 */
const ADMIN_PATH =
  /^\/internal\/admin\/(?:meta|weapons|characters|spawn|give|bossbattle|blacklist(?:\/remove)?|emoji|craftable|achievement-icon|template|character|weapon|seed\/[a-z]+|(?:character|weapon)\/\d+(?:\/enabled)?)$/;

export const adminApi = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { path: string; body?: Record<string, unknown> }) => {
    if (!ADMIN_PATH.test(data.path)) throw new Error("Bad admin path");
    return data;
  })
  .handler(async ({ context, data }) =>
    adminCall<unknown>(context.bearerToken, "limited", data.path, data.body),
  );

export type AdminResult<T> = { status: "ok"; data: T } | Fail;

/** GET when `body` is omitted, POST otherwise. */
export async function adminRequest<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<AdminResult<T>> {
  return (await adminApi({ data: { path, body } })) as AdminResult<T>;
}
