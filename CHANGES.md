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
