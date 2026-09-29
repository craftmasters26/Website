import { useEffect } from "react";
import { applyCatalog, type RawCharacter, type RawWeapon } from "@/lib/catalog";
import { bumpCatalogVersion } from "@/lib/catalog-version";

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour — matches the bot's own Mongo sync cadence

type CatalogResponse = {
  characters: RawCharacter[];
  weapons: RawWeapon[];
};

/**
 * Fetches `/api/catalog` (a Nitro route — see `server/routes/api/catalog.get.ts`)
 * which reads the bot's live MongoDB (kept current by `sync/mongo_sync.py`,
 * running inside the bot process every hour) and returns the same shape as
 * the bundled `src/data/characters.json` / `weapons.json`.
 *
 * Silently does nothing on failure or if the response looks wrong — the
 * site always has the bundled JSON as a working fallback, so a flaky fetch
 * should never break the page, only skip that hour's refresh.
 */
export async function refreshCatalogFromApi(): Promise<void> {
  try {
    const res = await fetch("/api/catalog", { headers: { accept: "application/json" } });
    if (!res.ok) return;
    const data = (await res.json()) as Partial<CatalogResponse>;
    if (!Array.isArray(data.characters) || !Array.isArray(data.weapons)) return;
    applyCatalog(data.characters, data.weapons);
    bumpCatalogVersion();
  } catch {
    // Offline, the bot's Mongo sync bridge isn't configured, or the network
    // hiccuped — next hour's timer will just try again.
  }
}

/**
 * Mount once, near the root. Refreshes on load (so a long-open tab
 * eventually catches up) and every hour after that.
 */
export function useCatalogAutoSync(): void {
  useEffect(() => {
    void refreshCatalogFromApi();
    const id = window.setInterval(() => {
      void refreshCatalogFromApi();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
}
