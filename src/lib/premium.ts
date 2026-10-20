import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth/middleware";

/**
 * The signed-in visitor's verified Discord id. The checkout page hands it to Whop
 * as payment metadata so the bot knows who bought, and `/redeem rewards` needs no
 * code. The id comes from the server-side session, never from the browser.
 */
export const getMyDiscordId = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ discordId: string | null }> => {
    try {
      const { getDiscordAccountId } = await import("./auth/verify.server");
      return { discordId: await getDiscordAccountId(context.bearerToken) };
    } catch {
      return { discordId: null };
    }
  });
