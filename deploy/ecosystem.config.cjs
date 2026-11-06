// PM2 definition for the website (Nitro node-server build).
// One-time migration to atomic releases: run `bash deploy/deploy-web.sh` once; it creates the symlink.
// Secrets/config are loaded from /root/web_data/.env via Node's --env-file.
module.exports = {
  apps: [
    {
      name: "Bleachdex-Web",
      script: ".output/server/index.mjs",
      // Runs from the atomic-release symlink maintained by deploy/deploy-web.sh
      cwd: "/var/www/bleachdex-web-current",
      interpreter: "node",
      node_args: "--env-file=/root/web_data/.env",
      autorestart: true,
      // Give in-flight requests a moment to finish before pm2 force-kills on restart.
      kill_timeout: 8000,
      time: true,
      max_restarts: 20,
      restart_delay: 3000,
      max_memory_restart: "600M",
      // BETTER_AUTH_URL / VITE_SITE_URL are set here on purpose: Node's --env-file never overrides a
      // variable that is already in the environment, so a stale value left in pm2's saved state or
      // the shell (e.g. an old domain) would silently win over /root/web_data/.env and break the
      // Discord login redirect_uri.
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "3000",
        BETTER_AUTH_URL: "https://boundlessproductions.org",
        VITE_SITE_URL: "https://boundlessproductions.org",
      },
    },
  ],
};
