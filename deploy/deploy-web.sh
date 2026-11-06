#!/bin/bash
# Atomic website deploy with smoke test and automatic rollback.
#
#   source checkout : /var/www/Bleachdex-Web                 (git pull + build happen here)
#   releases        : /var/www/bleachdex-web-releases/<UTC timestamp>/.output
#   live symlink    : /var/www/bleachdex-web-current          (pm2 runs from here)
#
# Flow: build -> copy .output into a new release -> smoke-test it on a spare port ->
# switch the symlink -> restart pm2 -> health-check -> roll back automatically if unhealthy.
# The previous KEEP releases are retained so you can also roll back by hand:
#   ./deploy/deploy-web.sh rollback
set -euo pipefail

APP_DIR=/var/www/Bleachdex-Web
RELEASES=/var/www/bleachdex-web-releases
CURRENT=/var/www/bleachdex-web-current
ENV_FILE=/root/web_data/.env
LIVE_PORT=3000
SMOKE_PORT=3100
KEEP=5

wait_healthy() { # $1 = port, $2 = seconds
  local i
  for ((i = 0; i < $2; i++)); do
    if curl -fsS "http://127.0.0.1:$1/api/health" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  return 1
}

switch_to() { # $1 = release dir
  ln -sfn "$1" "$CURRENT.tmp"
  mv -Tf "$CURRENT.tmp" "$CURRENT"   # atomic symlink swap
  # First run after migrating to atomic releases: pm2 remembers the OLD cwd, so recreate once.
  if pm2 describe Bleachdex-Web >/dev/null 2>&1 && ! pm2 describe Bleachdex-Web | grep -q "$CURRENT"; then
    pm2 delete Bleachdex-Web >/dev/null
  fi
  pm2 startOrRestart "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
  pm2 save >/dev/null
}

rollback_to_previous() {
  local live prev
  live=$(readlink -f "$CURRENT" || true)
  prev=$(ls -1dt "$RELEASES"/*/ 2>/dev/null | sed 's:/$::' | grep -vx "$live" | head -n1 || true)
  if [ -z "$prev" ]; then echo "No previous release to roll back to."; return 1; fi
  echo "Rolling back to $prev"
  switch_to "$prev"
  wait_healthy "$LIVE_PORT" 30 && echo "Rollback healthy." || echo "WARNING: rollback is not healthy either - check: pm2 logs Bleachdex-Web"
}

if [ "${1:-}" = "rollback" ]; then rollback_to_previous; exit $?; fi

mkdir -p "$RELEASES"
cd "$APP_DIR"
git fetch --all
git reset --hard origin/main
REV=$(git rev-parse --short HEAD)

# Build-time + runtime config (VITE_SITE_URL etc.) from the permanent .env
set -a; . "$ENV_FILE"; set +a

npm ci --no-audit --no-fund
npm run build            # vite build, then database migrations - before any traffic switches

RELEASE="$RELEASES/$(date -u +%Y%m%dT%H%M%SZ)-$REV"
mkdir -p "$RELEASE"
cp -a .output "$RELEASE/.output"

echo "Smoke-testing $RELEASE on port $SMOKE_PORT ..."
( cd "$RELEASE" && NODE_ENV=production HOST=127.0.0.1 PORT=$SMOKE_PORT node --env-file="$ENV_FILE" .output/server/index.mjs >"$RELEASE/smoke.log" 2>&1 ) &
SMOKE_PID=$!
trap 'kill $SMOKE_PID 2>/dev/null || true' EXIT
if ! wait_healthy "$SMOKE_PORT" 30 || ! curl -fsS -o /dev/null "http://127.0.0.1:$SMOKE_PORT/"; then
  echo "Smoke test FAILED - live site untouched. Log: $RELEASE/smoke.log"
  tail -n 30 "$RELEASE/smoke.log" || true
  exit 1
fi
kill $SMOKE_PID 2>/dev/null || true; wait $SMOKE_PID 2>/dev/null || true; trap - EXIT

switch_to "$RELEASE"
if wait_healthy "$LIVE_PORT" 30; then
  echo "Website deployed: $REV  ($RELEASE)"
else
  echo "New release unhealthy after switch - rolling back."
  rollback_to_previous
  exit 1
fi

# Keep only the newest $KEEP releases.
ls -1dt "$RELEASES"/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
