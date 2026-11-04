/**
 * Single source of truth for the site's public address.
 *
 * Set VITE_SITE_URL (e.g. https://boundlessproductions.org) in the .env used when
 * you run `npm run build` on the VPS. Switching to your real domain later =
 * change that one value, rebuild.
 */
const raw = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
export const SITE_URL = (raw || "https://boundlessproductions.org").replace(/\/+$/, "");
export const SITE_HOST = new URL(SITE_URL).host;

/**
 * Each product lives under a path on the main domain: boundlessproductions.org/Product.
 * Change VITE_BLEACHDEX_URL if the address ever moves.
 */
const rawBleachdex = (import.meta.env.VITE_BLEACHDEX_URL as string | undefined)?.trim();
export const BLEACHDEX_URL = (rawBleachdex || "https://boundlessproductions.org/bleachdex").replace(/\/+$/, "");
export const BLEACHDEX_HOST = new URL(BLEACHDEX_URL).host;

/** Public studio contact address. Optional: set VITE_CONTACT_EMAIL and it appears on the Contact page. */
export const CONTACT_EMAIL = ((import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? "").trim();
