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
