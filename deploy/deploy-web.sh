#!/bin/bash
# Website deploy: pull latest code, build, restart.
set -e
cd /var/www/Bleachdex-Web

git fetch --all
git reset --hard origin/main

# Load build-time + runtime config (VITE_SITE_URL etc.) from the permanent .env
set -a
. /root/web_data/.env
set +a

npm ci --no-audit --no-fund
npm run build

pm2 startOrRestart deploy/ecosystem.config.cjs --update-env
pm2 save
echo "Website deployed: $(git rev-parse --short HEAD)"
