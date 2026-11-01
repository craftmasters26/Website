/**
 * Single source of truth for the site's public address.
 *
 * Set VITE_SITE_URL (e.g. https://boundless.run.place) in the .env used when
 * you run `npm run build` on the VPS. Switching to your real domain later =
 * change that one value, rebuild.
 */
const raw = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
export const SITE_URL = (raw || "https://boundless.run.place").replace(/\/+$/, "");
export const SITE_HOST = new URL(SITE_URL).host;

/**
 * Each product gets its own subdomain: Product.boundless.run.place.
 * Change VITE_BLEACHDEX_URL if the address ever moves.
 */
const rawBleachdex = (import.meta.env.VITE_BLEACHDEX_URL as string | undefined)?.trim();
export const BLEACHDEX_URL = (rawBleachdex || "https://bleachdex.boundless.run.place").replace(/\/+$/, "");
export const BLEACHDEX_HOST = new URL(BLEACHDEX_URL).host;
