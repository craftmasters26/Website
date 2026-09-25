import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { getMyInventory, type InventoryMe } from "@/lib/inventory.server";

/**
 * Loads the signed-in player's collection for the /owned page.
 *
 * Login itself is real, direct Discord OAuth on this app (see
 * `signInWithDiscord` in `@/lib/auth/client`) — no bot redirect, no ngrok.
 * Once a session exists, this calls the `getMyInventory` server function,
 * which does the actual bot lookup server-to-server (see
 * `@/lib/inventory.server` for that side of it).
 */

export type OwnedMe = InventoryMe;

export type OwnedState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; me: OwnedMe }
  /** Signed in, but the bot has no record for this Discord id yet. */
  | { status: "no-record" }
  /** Couldn't reach the bot, or BOT_API_URL/BOT_API_SECRET aren't set. */
  | { status: "error" };

export function useOwnedMe(): [OwnedState, () => void] {
  const { user, isPending: userPending } = useCurrentUserState();
  const [state, setState] = useState<OwnedState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (userPending) return; // session still resolving — don't flash signed-out
      if (!user || user.isDevFallback) {
        if (!cancelled) setState({ status: "signed-out" });
        return;
      }
      setState({ status: "loading" });
      const result = await getMyInventory();
      if (cancelled) return;
      if (result.status === "ok") {
        setState({ status: "signed-in", me: result.me });
      } else if (result.status === "no-record") {
        setState({ status: "no-record" });
      } else {
        // "not-linked" | "not-configured" | "network-error" all land here —
        // the ErrorView copy already covers "couldn't reach the bot".
        setState({ status: "error" });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, user, userPending]);

  return [state, () => setReloadKey((n) => n + 1)];
}

export function signOutOwned(): void {
  void signOut("/owned");
}
