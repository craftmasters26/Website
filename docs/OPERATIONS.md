# Operations guide

## Environment variables by feature
Set in `/root/web_data/.env` (loaded by pm2 via `--env-file`). On boot the server logs which groups are missing (`pm2 logs Bleachdex-Web | grep startup-check`); values are never logged.

| Feature | Variables | If missing |
|---|---|---|
| Identity & login (required) | `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` (32+ chars), `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | Discord login and sessions fail |
| Persistent sessions (required) | `MONGODB_URI` | Sessions live in memory and vanish on restart |
| Player data (required) | `BOT_API_URL`, `BOT_API_SECRET` | My Collection, premium status, ad rewards, home stats unavailable |
| Contact + error alerts | `CONTACT_WEBHOOK_URL` | Contact form tells visitors to use Discord |
| Leaderboard real names | `DISCORD_BOT_TOKEN` | Falls back to the bot's cached names |
| Site URL | `VITE_SITE_URL` (build time) | Canonicals/sitemap use the default |

## Deploying and rolling back
```bash
bash /var/www/Bleachdex-Web/deploy/deploy-web.sh            # build, smoke-test, switch, health-check
bash /var/www/Bleachdex-Web/deploy/deploy-web.sh rollback   # back to the previous release
```
The script builds first, copies `.output` into `/var/www/bleachdex-web-releases/<time>-<commit>/`, starts it on port 3100 and checks `/api/health`, only then switches the `bleachdex-web-current` symlink and restarts pm2. If the live site is unhealthy after the switch it rolls back automatically. The newest 5 releases are kept. The first run after upgrading recreates the pm2 process once (new working directory).

## Health and monitoring
* `GET /api/health` - public liveness (`{"status":"ok"}`), nothing sensitive. Point an **external** monitor at it (UptimeRobot / Better Stack free tier, 1-minute interval, alert to Discord or email).
* `GET /api/ready` - database and bot diagnostics, requires `Authorization: Bearer $BOT_API_SECRET`, otherwise 404:
  `curl -H "Authorization: Bearer $BOT_API_SECRET" http://127.0.0.1:3000/api/ready`

## Backups (do this, it is the biggest remaining risk)
* Bot database: `sqlite3 /root/bot_data/bleachdex.sqlite3 ".backup '/root/backups/bleachdex-$(date +%F).sqlite3'"` from a daily cron, keep 14 days, copy one weekly to off-server storage.
* Website sessions live in MongoDB (use Atlas backups). `/root/web_data/.env` and `/root/bot_data/.env` should be copied to a password manager.
* Restore test: once a month, restore the latest backup to a scratch path and open it.

## Tests and CI
* `npm run typecheck`, `npm run lint`, `npm test` (unit), `npx vite build`.
* `npm run test:smoke` - HTTP checks against the built server (health, robots, sitemap, redirects, 404).
* `npm run test:e2e` - Playwright browser journeys against the built server (`npx playwright install chromium` once).
* `npm run analyze` - bundle size report with budgets.
* GitHub Actions (`.github/workflows/ci.yml`) runs all of the above plus a dependency audit on every push and pull request.

## Image optimisation (/gh-img)

Card art is fetched from GitHub once, cached under `GH_IMG_CACHE_DIR` (default: the OS temp dir), and, when the
browser accepts WebP, resized (`?w=240|360|480|720|960`) and converted by `sharp`. If `sharp` is unavailable the
original file is served, so nothing breaks. nginx must proxy `/gh-img/` to the Node app (see
`deploy/nginx-boundless.conf`); the first visit to each image costs one conversion, later visits are cached.
Public APIs `/api/catalog|leaderboard|stats` are limited to 120 requests/minute per IP (`server/middleware/rate-limit.ts`).
