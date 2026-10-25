// PM2 definition for the website (Nitro node-server build).
// Secrets/config are loaded from /root/web_data/.env via Node's --env-file.
module.exports = {
  apps: [
    {
      name: "Bleachdex-Web",
      script: ".output/server/index.mjs",
      cwd: "/var/www/Bleachdex-Web",
      interpreter: "node",
      node_args: "--env-file=/root/web_data/.env",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      max_memory_restart: "600M",
      env: { NODE_ENV: "production", HOST: "127.0.0.1", PORT: "3000" },
    },
  ],
};
