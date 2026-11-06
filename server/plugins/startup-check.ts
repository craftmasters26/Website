/**
 * Startup configuration report. Runs once when the production server boots and logs
 * WHICH settings are missing for each feature, never their values. Optional integrations
 * stay optional; this only makes "why is X not working" obvious in `pm2 logs`.
 */
type Group = { feature: string; required: boolean; keys: string[]; note: string };

const GROUPS: Group[] = [
  {
    feature: "Core identity & login",
    required: true,
    keys: ["BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"],
    note: "Discord login and sessions will not work",
  },
  {
    feature: "Persistent database",
    required: true,
    keys: ["MONGODB_URI"],
    note: "Sessions fall back to a temporary in-process database and are lost on restart",
  },
  {
    feature: "BleachDex player data",
    required: true,
    keys: ["BOT_API_URL", "BOT_API_SECRET"],
    note: "My Collection, premium status and ad rewards cannot reach the bot",
  },
  {
    feature: "Contact form & error alerts",
    required: false,
    keys: ["CONTACT_WEBHOOK_URL"],
    note: "The contact form will tell visitors to use Discord instead",
  },
  {
    feature: "Leaderboard real Discord names",
    required: false,
    keys: ["DISCORD_BOT_TOKEN"],
    note: "Leaderboard shows the bot's cached names only",
  },
];

function isSet(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

export default function startupCheck() {
  if (process.env.NODE_ENV !== "production") return;
  const lines: string[] = [];
  for (const g of GROUPS) {
    const missing = g.keys.filter((k) => !isSet(k));
    if (missing.length === 0) continue;
    lines.push(`${g.required ? "MISSING" : "optional"} · ${g.feature}: ${missing.join(", ")} — ${g.note}`);
  }
  const weak = (process.env.BETTER_AUTH_SECRET?.trim().length ?? 0) > 0 && (process.env.BETTER_AUTH_SECRET?.trim().length ?? 0) < 32;
  if (weak) lines.push("WEAK · BETTER_AUTH_SECRET is shorter than 32 characters (use: openssl rand -base64 32)");
  if (lines.length === 0) {
    console.info("[startup-check] all production settings present");
    return;
  }
  console.warn(`[startup-check] configuration report (values are never logged):\n  ${lines.join("\n  ")}`);
}
