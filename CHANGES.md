# Changes - review-driven improvement pass (Nov 2026)

Merged from the two external reviews (Figma Make and Grok). Details of what to run are in `docs/OPERATIONS.md`.

**Security and dependencies**
* `better-auth` 1.6 -> 1.7.17 (clears the critical advisory); remaining runtime advisories fixed with `npm audit fix`. Only dev-tool (ESLint chain) advisories remain.
* Adjusted the Discord broker sign-in to the 1.7 API (`signIn.social`).
* Migrated deprecated `.inputValidator()` server-function calls to `.validator()`.
* User-facing error messages no longer reveal environment variable names or internal URLs.

**Reliability**
* `/api/health` (public liveness) and `/api/ready` (secret-protected database + bot diagnostics).
* Startup configuration report (missing settings per feature, never values).
* Atomic deploy script with smoke test, symlink switch, automatic rollback, manual `rollback`, 5 releases kept.
* GitHub Actions CI; flat ESLint config (lint script previously had no config); Playwright smoke suite; HTTP smoke checks; bundle report.

**Catalog and collection**
* Catalog filters (type, tier, sort, search, owned/missing) live in the URL; forgiving name search ("ichgo" finds Ichigo); remembered sort; owned badge; "Clear filters" on empty results.
* My Collection: onboarding checklist, progress bar with link to missing cards, loading skeleton, safe error states with next steps, `noindex`.

**Conversion and trust**
* Premium: "What happens after you pay", FAQ (timing, cancellation, refunds, missing perks) with FAQPage structured data, richer meta.
* Home: live player/cards-caught numbers (only shown when real), sticky mobile "Add to Discord" bar.
* Commands: search, category jump links, real headings.

**SEO and accessibility**
* Unique titles/descriptions, canonical + breadcrumb structured data on roster and weapon pages.
* Contrast: accent text and button gradients raised to WCAG AA; live-region result counts; labelled search fields.
* Catalog API sends explicit cache headers; `/api/stats` cached 5 minutes.

# What changed

## 1. Real Discord OAuth (no bot server, no ngrok, in the login path)

Login now uses Better Auth's built-in Discord provider, direct with Discord.
Clicking "Login with Discord" never leaves `bleachdex.vercel.app` except for
Discord's own consent screen, and Discord sends the browser straight back to
`bleachdex.vercel.app/api/auth/callback/discord`.

**Files:**
- `src/lib/auth/server.ts` — added `socialProviders.discord`
- `src/lib/auth/client.ts` — added `signInWithDiscord()`
- `src/lib/auth/middleware.ts`, `src/lib/auth/verify.server.ts` — added a way
  to read the signed-in visitor's real Discord id from their session
- `src/components/site-header.tsx`, `src/components/catch-button.tsx`,
  `src/routes/owned.tsx` — swapped the old `<a href={botLoginUrl(...)}>` links
  for this
- `src/lib/bot.ts` — removed (nothing calls it anymore)

**Setup required (you'll need to do this — I don't have your accounts):**
1. Go to https://discord.com/developers/applications → your app (or a new
   one) → OAuth2.
2. Add a redirect: `https://bleachdex.vercel.app/api/auth/callback/discord`
   (and, if you still use the live-preview/dev flow, whatever preview host
   Better Auth resolves to there).
3. Copy the Client ID and Client Secret.
4. In Vercel → your project → Settings → Environment Variables, add:
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `BETTER_AUTH_URL` = `https://bleachdex.vercel.app` (if not already set)
5. Redeploy. `VITE_BOT_DASHBOARD_URL` (the old ngrok var) is no longer used
   for login and can be removed once you've also done step 2 below.

## 2. Inventory data (KAN coins, collection) — still comes from the bot, but server-to-server now

The bot is still the source of truth for what a player actually owns, so the
site still has to ask it. The difference: it's no longer the *browser* that
talks to the bot (which is what broke visibly when the tunnel died) — it's a
server function on Vercel, calling the bot with a shared secret plus the
visitor's real Discord id from their session.

**New file:** `src/lib/inventory.server.ts` — calls
`GET {BOT_API_URL}/internal/player/{discord_id}` with
`Authorization: Bearer {BOT_API_SECRET}`.

**You need to add a matching endpoint on the bot.** Example (Flask):

```python
@app.route("/internal/player/<discord_id>")
def internal_player(discord_id):
    if request.headers.get("Authorization") != f"Bearer {BOT_API_SECRET}":
        return "", 401
    player = get_player(discord_id)  # however you already look this up
    if not player:
        return "", 404
    return jsonify({
        "username": player.username,
        "avatar_url": player.avatar_url,
        "kan_coins": player.kan_coins,
        "owned_character_ids": player.owned_character_ids,
        "reiatsu_character_ids": player.reiatsu_character_ids,
        "owned_weapon_ids": player.owned_weapon_ids,
    })
```

**Setup required:**
1. Add the endpoint above (or equivalent) to the bot, plus a `BOT_API_SECRET`
   env var on the bot's side — make up a long random string.
2. In Vercel, add:
   - `BOT_API_URL` = the bot's reachable base URL (can still be an ngrok URL —
     it's fine now, since only your server calls it, never the browser)
   - `BOT_API_SECRET` = the same random string
3. Rewrote `src/lib/owned.ts` and `src/routes/owned.tsx` to use this instead
   of the old token-in-URL bridge.

If `BOT_API_URL`/`BOT_API_SECRET` aren't set yet, or the bot is unreachable,
signed-in visitors now see "Couldn't reach the bot to load your collection" —
login itself still works either way.

## 3. Nav: Inventory link appears after login (4 → 5)

`src/components/site-header.tsx` — nav is Home / List / Commands / Premium
signed out; Home / List / **Inventory** / Commands / Premium once signed in.
Signed-in state also swaps the login button for the visitor's avatar, name,
and a "Log out" control.

## 4. Broken images — site-side fix only

I added `src/components/catalog-image.tsx`: character/weapon art now falls
back to a plain initial-letter tile instead of a broken-image icon if the art
fails to load (used on the homepage hero/pack cards, and the roster/weapon
detail pages — the list and owned/inventory pages already had this).

**I could not find the specific broken image from your screenshot
(`alt="BleachDex bot logo"`) anywhere in this codebase** — it doesn't exist in
any `.tsx` file here, and the nav in your screenshot (4 links, no Inventory)
doesn't match this code either (which already had 5). That strongly suggests
what's *currently live* on `bleachdex.vercel.app` is a different/older build
than this archive. If images are still broken after you deploy this, or if
you meant images not loading **inside Discord itself** (bot embeds), I'll
need the bot's source or the currently-live frontend's source to fix that
specifically — this archive doesn't contain either.

## 5. Round 2 (login on bleachdex.vercel.app, logos, smaller button)
- Login now stores users/sessions in MongoDB (the same MONGODB_URI the catalog uses) via Better Auth's MongoDB adapter; collections are created automatically. No Postgres needed.
- src/lib/auth/server.ts: base URL now falls back to https://bleachdex.vercel.app on Vercel.
- Logos are imported from src/assets (bundled with hashed URLs) instead of /public paths, with real alt text.
- Login button is compact ("Login", smaller padding/icon).
- src/lib/error-component.tsx added (router.tsx imported it but it was missing from the repo).

## 6. Ad-block gate false positive
- ad-block-gate.tsx showed "Your ad blocker is on" to real visitors with no
  blocker at all — it treated any ONE of its three signals (hidden bait,
  failed fetch, missing window.adsbygoogle) as proof of blocking, but each
  one alone can trip from antivirus web-protection, ISP-level ad-domain
  filtering, or just a slow connection. Now requires 2 of the 3 to agree.
  Initial check delay bumped 2000ms → 3500ms for slower connections.

## 7. Favicon → Halloween ghost
- The tab icon (browser tab / "address bar" icon) came from public/favicon.svg
  — a small orange sparkle on a dark square, set via `<link rel="icon"
  type="image/svg+xml" href="/favicon.svg">` in src/routes/__root.tsx.
- Replaced it with the uploaded Halloween ghost artwork: cropped to a square,
  exported as public/favicon-32.png and public/favicon.png (128px), and the
  head links now point to those instead of the SVG (which was removed).
- Also updated public/__grok/icon-180.png (the "Add to Home Screen" icon on
  iOS) to the same crop, so the PWA icon matches the browser tab.

## 8. Inventory page stuck on "Loading your collection…" forever
- src/lib/owned.ts: `await getMyInventory()` had no try/catch. Any thrown
  error (a network drop, the bot being unreachable, a slow/failed session
  check) left `state` stuck at "loading" with no way out — matches the
  screenshot exactly. Now wrapped in try/catch and raced against a 15s
  timeout, so a hang surfaces the existing "Couldn't reach the bot" retry
  screen instead of spinning forever.
- src/lib/auth/server.ts: MongoClient now sets serverSelectionTimeoutMS:
  8000 (was the driver default of 30000). If Atlas is unreachable this
  fails fast instead of hanging for up to 30s on a login/logout click.
  NOTE: this does not explain a *consistent* ~5s delay on successful
  login/logout — that's most likely Atlas connection setup happening on
  every request because Vercel spun up a fresh serverless instance (see
  reply for the two things worth checking on the Atlas side).

## 9. The real cause of the permanent "Loading your collection…" (and the Chrome crash)
- src/lib/auth/use-current-user.ts rebuilt the `user` object inline on every
  render. Better Auth's `useSession()` hands back a new `data` object on
  every background refetch even when the session hasn't changed, so `user`
  was a brand-new object reference constantly — and `useOwnedMe`'s effect
  depends on `user`. Net effect: every refetch looked like "the user
  changed" to that effect, which cancelled the in-flight inventory request
  and started a new one, forever — never completing, continuously hammering
  the network, which is almost certainly what was crashing the tab. My
  earlier try/catch/timeout fix couldn't help because no single attempt
  ever ran long enough to hit either the error path or the timeout.
- Fixed by memoizing `user` on its primitive fields (id/name/email/image),
  so the reference only changes when the session actually changes. This was
  the real bug — not Mongo latency, though the earlier connection-timeout
  hardening is still worth keeping.

## 10. Favicon redone — was unrecognizable at tab size
- The previous favicon (§7) was the full illustration squeezed into a
  square: ghost silhouettes, candy pumpkin, hand and all. At 16–32px that
  much detail just turns to mush.
- Re-cropped tight on the hood/face only, which is the part that actually
  reads at icon size, and added a light unsharp mask on the 32px export
  specifically (straight downscaling was blurring the eye holes/mouth away).
  128px and the 180px apple-touch-icon use the same crop without sharpening
  — they're big enough not to need it.

## 11. Removed the "Pulled straight from your Discord..." subtitle
- src/routes/owned.tsx — that line only showed in the signed-out/empty
  state next to the page title. Removed as asked.

## 12. "Couldn't reach the bot" even though the bot is online
- Root cause is configuration, not code: the bot's `/internal/player/<id>` endpoint returns 503 when the bot has no `BOT_API_SECRET` in its environment (its `env.txt` didn't list one), and the site treated every non-OK answer as "offline".
- src/lib/inventory.ts: sends `ngrok-skip-browser-warning`, 10s timeout, and returns a `detail` (unreachable / secret-mismatch / bot-secret-missing / bad-response / bot-error). src/lib/owned.ts + src/routes/owned.tsx show a one-line hint under the error so the next failure says what to fix.
- No bot code was changed.

## 13. Watch an ad → +2 daily packs, live daily leaderboard, admin panel
- **Extra packs:** `src/components/watch-ad-card.tsx` (shown on /owned), `src/lib/rewards.ts` (start/claim server functions), `src/lib/rewarded-ad.ts` (Google Ad Manager rewarded ads; `VITE_REWARDED_AD_TEST=true` for a 10s test timer). Each completed ad = +1 `/pack daily` today, max 2/day, enforced by the bot (one-time nonce + daily cap).
- **Leaderboard:** `/leaderboard` page + `server/routes/api/leaderboard.get.ts` (polls every 15s, 8s server cache). Nav link has a live dot; home page has a "Live leaderboard" button.
- **Admin:** `/admin` (`src/routes/admin.tsx`, `src/lib/admin.ts`, `src/lib/admin-access.ts`). Visible only to Discord ids on the BOT's `ADMIN_USER_IDS` (full) / `LIMITED_ADMIN_USER_IDS` (spawn only); the site asks the bot on every call.
- Shared bot caller + signed tokens: `src/lib/bot-api.server.ts`.
- New env vars (Vercel): `VITE_GAM_REWARDED_AD_UNIT` (or `VITE_REWARDED_AD_TEST=true` while testing), optional `AD_MIN_WATCH_SECONDS` (default 8), optional `AD_REWARD_SECRET` (falls back to BETTER_AUTH_SECRET / BOT_API_SECRET).

## Boundless Production company site + blue/white theme
- Company pages: `/`, `/about`, `/what-we-make`, `/projects`, `/contact-us` (`src/routes/`). Shared header/footer/cards: `src/components/bp-layout.tsx`.
- The whole site (company pages and BleachDex) now uses one blue + white palette. The colours are the `--color-ember*` / `--color-gold` tokens at the top of `src/styles.css`; rarity colours are shades of blue/white (`.tier-*`).
- The old BleachDex home moved to `/bleachdex`. Boundless and Scattered Stars show "Coming soon".

## Website improvement pass (from the website review document)

**Homepage and navigation**
- New homepage: outcome-led hero, real stat strip (character/weapon counts from the catalog, weekly catches from the bot when reachable), featured BleachDex showcase, 4-step "How it works", What we make, projects, community and final CTAs. (`src/components/home-sections.tsx`)
- Header: Projects, BleachDex, About, Community, Contact + an "Add BleachDex" button; short "Boundless" wordmark on phones; new SVG logo mark and favicon; skip-to-content link; `aria-expanded`/`aria-controls` and Esc-to-close on both mobile menus.
- Social buttons without a live account are no longer rendered (fill `SOCIAL_LINKS` in `bp-layout.tsx` when they exist).
- `/what-we-make`, `/games`, `/bots` now 301 to `/projects`; `/projects` has filters (All, Live, In development, Games, Discord bots) and `?filter=` links. `/about` is a real page again. "Coming soon" became "In development".
- Contact page: support / community / partnership routes plus a working form (`/api/contact` posts to a Discord webhook; set `CONTACT_WEBHOOK_URL`). Optional `VITE_CONTACT_EMAIL`.

**Visual system**
- Navy headings, slate body text, new warm gold accent for the main CTA on dark sections; muted text now passes WCAG AA. Buttons are sentence case, 44px minimum height. Background animation removed (static).

**SEO / sharing / performance**
- Share cards are 1200x630 (`/og.jpg`) with `summary_large_image` for BleachDex too; per-page title/description overrides in `src/lib/og/site.json` ("pages"); canonical links; Organization/WebSite and SoftwareApplication JSON-LD; `/robots.txt` and `/sitemap.xml` (includes every character and weapon page).
- AdSense script now loads only where an ad slot renders (not on company pages, admin, checkout, premium, owned, legal or contact); the `google-adsense-account` meta tag stays site-wide for verification. Ad slot reserves its height.
- Fewer font weights, lazy/async images with dimensions, nginx security headers, long cache for `/assets/`, and rate limiting on the contact form.

## Second pass: remaining items
- Dark mode: header toggle (Moon/Sun), remembers the choice, first visit follows the OS; set before first paint (no flash). Tokens in `styles.css` under `:root[data-theme="dark"]`.
- Image art served through nginx `/gh-img/` with a 30-day disk cache instead of hitting GitHub raw on every view (`cdnImage()` in `catalog.ts`, production only).
- Browser error alerts to a Discord webhook (`/api/client-error`, `ERROR_WEBHOOK_URL`), de-duplicated and rate-limited.
- Optional Umami analytics, loaded only when `VITE_UMAMI_SRC` and `VITE_UMAMI_ID` are set.
- Screenshots section (`src/lib/screenshots.ts`, files in `public/screens/`): hidden until there are entries.

## Third pass
- Real Discord screenshots (spawn, boss, leaderboard with other players' names blurred, catch) in `public/screens/`, listed in `src/lib/screenshots.ts`; shown on the homepage and the BleachDex page.
- Boundless and Scattered Stars cards use the real copy (redacted text is announced as "[redacted]" to screen readers); placeholder glyph tile replaced by an icon header.
- Login: `BETTER_AUTH_URL` falls back to `VITE_SITE_URL`, and `/api/login/discord` logs the exact `redirect_uri` it sends to Discord (`pm2 logs Bleachdex-Web`).

## Fourth pass
- Homepage hero now shows a layered collage of the real Discord screenshots (cropped to their content, rounded, soft shadows) instead of the character-card fan. The BleachDex page has a tabbed viewer ("See BleachDex in action"). The mock spawn preview was replaced by real screenshots.
- Character and weapon art: new `/gh-img/` route in the Node app fetches from GitHub once and caches to disk, so images work without any nginx change. A global fallback retries GitHub directly if that ever fails. The nginx `/gh-img/` block is now optional.
- Dark theme is the default (a visitor's saved choice still wins).

## Fifth pass
- Real Discord screenshots now live in the four "How it works" step cards (spawn, catch, boss fight, leaderboard) instead of the hero. The step copy matches the pictures: spawn, catch, fight bosses, climb the leaderboard.
- Hero is back to three real characters (art loads through `/gh-img/`); the featured BleachDex section shows a grid of six more real characters with their rarity. The /bleachdex page keeps the tabbed screenshot gallery and uses the icon version of the steps.
