import { useEffect, useState } from "react";
import { BOT_DASHBOARD_URL } from "@/lib/bot";

/**
 * Bridges the bot's Discord login to this site's own "Owned" page.
 *
 * Flow: the site sends the player to `botLoginUrl("/owned")` (see
 * src/lib/bot.ts). The bot does real Discord OAuth, then redirects back
 * here with `?token=...` in the URL instead of showing its own /dashboard
 * page. We grab that token, remember it, and use it to call the bot's
 * `/api/me` for the player's real KAN balance and collection.
 */

const TOKEN_KEY = "bleachdex-bot-token";

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private browsing / storage disabled — token just won't persist */
  }
}

function removeStoredToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Pulls `?token=` off the current URL (if the bot's /callback just sent
 * one) and scrubs it from the address bar so it isn't left in history. */
function consumeTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (!token) return null;
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  writeStoredToken(token);
  return token;
}

type MeResponse = {
  discord_id: string;
  username: string;
  avatar_url: string;
  kan_coins: number;
  owned_character_ids: number[];
  reiatsu_character_ids: number[];
  owned_weapon_ids: number[];
};

export type OwnedMe = {
  discordId: string;
  username: string;
  avatarUrl: string;
  kan: number;
  ownedCharacterIds: number[];
  reiatsuCharacterIds: number[];
  ownedWeaponIds: number[];
};

type FetchMeResult =
  | { kind: "ok"; me: OwnedMe }
  /** Token missing/expired — the bot answered, just said no. */
  | { kind: "unauthorized" }
  /** Couldn't reach the bot at all (tunnel down, network blip, etc). */
  | { kind: "network-error" };

async function fetchMe(token: string): Promise<FetchMeResult> {
  let res: Response;
  try {
    res = await fetch(`${BOT_DASHBOARD_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    });
  } catch {
    return { kind: "network-error" };
  }
  if (res.status === 401) return { kind: "unauthorized" };
  if (!res.ok) return { kind: "network-error" };
  const data = (await res.json()) as MeResponse;
  return {
    kind: "ok",
    me: {
      discordId: data.discord_id,
      username: data.username,
      avatarUrl: data.avatar_url,
      kan: data.kan_coins,
      ownedCharacterIds: data.owned_character_ids ?? [],
      reiatsuCharacterIds: data.reiatsu_character_ids ?? [],
      ownedWeaponIds: data.owned_weapon_ids ?? [],
    },
  };
}

export type OwnedState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; me: OwnedMe }
  | { status: "error" };

/** Loads the signed-in player's collection for the /owned page: picks up a
 * fresh token from the URL if one just arrived, otherwise reuses whatever
 * was stored from last time, then calls /api/me. */
export function useOwnedMe(): [OwnedState, () => void] {
  const [state, setState] = useState<OwnedState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      const token = consumeTokenFromUrl() ?? readStoredToken();
      if (!token) {
        if (!cancelled) setState({ status: "signed-out" });
        return;
      }
      const result = await fetchMe(token);
      if (cancelled) return;
      if (result.kind === "unauthorized") {
        removeStoredToken();
        setState({ status: "signed-out" });
        return;
      }
      if (result.kind === "network-error") {
        setState({ status: "error" });
        return;
      }
      setState({ status: "signed-in", me: result.me });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return [state, () => setReloadKey((n) => n + 1)];
}

export function signOutOwned(): void {
  const token = readStoredToken();
  removeStoredToken();
  if (token) {
    void fetch(`${BOT_DASHBOARD_URL}/api/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      /* best-effort — local token is already cleared either way */
    });
  }
  window.location.href = "/owned";
}
