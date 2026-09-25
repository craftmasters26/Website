/**
 * The bot's own public host — the same Flask app (server.py / web/dashboard.py)
 * the bot already runs, reachable via BOT_PUBLIC_URL on the bot's side (ngrok
 * or your real domain). It has a REAL Discord OAuth login (`/login`,
 * `/callback`) and a JSON API (`/api/me`) with a player's actual KAN coins
 * and collection — unlike the old browser-only "Registry", this is not fake
 * per-device data, it's the player's real account.
 *
 * Login no longer strands the player on the bot's own /dashboard page: the
 * bot's /callback redirects back here (to whatever `next` path was passed
 * to /login, e.g. "/owned") with a one-time `?token=` in the URL. The
 * "Owned" page reads that token, stores it, and calls /api/me with it —
 * see src/lib/owned.ts.
 *
 * Set VITE_BOT_DASHBOARD_URL in the site's Vercel project settings to the
 * same public URL the bot uses for BOT_PUBLIC_URL (e.g.
 * https://your-subdomain.ngrok-free.app or your real domain), and set
 * BLEACHDEX_SITE_URL on the bot's side to this site's own URL. Until
 * VITE_BOT_DASHBOARD_URL is set, this falls back to a placeholder so the
 * button still renders.
 */
const RAW_BASE = import.meta.env.VITE_BOT_DASHBOARD_URL ?? "";
export const BOT_DASHBOARD_URL = (RAW_BASE || "https://bleachdex-bot.example.com").replace(
  /\/+$/,
  "",
);

export const BOT_LOGIN_URL = `${BOT_DASHBOARD_URL}/login`;

/** Login URL that sends the player back to `next` (a same-site path, e.g.
 * "/owned") once Discord auth finishes, instead of the bot's own page. */
export function botLoginUrl(next: string): string {
  return `${BOT_LOGIN_URL}?next=${encodeURIComponent(next)}`;
}
