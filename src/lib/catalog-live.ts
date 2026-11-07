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

/** Resolves once the page has finished loading and the browser is idle, i.e. React has hydrated. */
function afterHydration(run: () => void): () => void {
  let cancelled = false;
  let timer: number | undefined;
  const go = () => {
    if (cancelled) return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    if (idle) idle(() => !cancelled && run(), { timeout: 4000 });
    else timer = window.setTimeout(() => !cancelled && run(), 2000);
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", go);
    if (timer) window.clearTimeout(timer);
  };
}

/**
 * Mount once, near the root. Refreshes shortly after the page has hydrated (so a long-open tab
 * eventually catches up) and every hour after that.
 *
 * The first refresh MUST wait for hydration: applyCatalog() changes the data the components read, and
 * if that happens while React is still hydrating, the browser's first render no longer matches the
 * server's HTML -> React error #418 ("Hydration failed ... text didn't match").
 */
export function useCatalogAutoSync(): void {
  useEffect(() => {
    const stop = afterHydration(() => void refreshCatalogFromApi());
    const id = window.setInterval(() => {
      void refreshCatalogFromApi();
    }, REFRESH_INTERVAL_MS);
    return () => {
      stop();
      window.clearInterval(id);
    };
  }, []);
}
