import { defineEventHandler, setResponseHeader } from "h3";
import characters from "../../src/data/characters.json";
import weapons from "../../src/data/weapons.json";

const SITE = "https://boundlessproductions.org";

const PAGES = [
  "/",
  "/projects",
  "/about",
  "/contact-us",
  "/bleachdex",
  "/bleachdex/list",
  "/bleachdex/roster",
  "/bleachdex/weapons",
  "/bleachdex/leaderboard",
  "/bleachdex/commands",
  "/bleachdex/guide",
  "/bleachdex/updates",
  "/bleachdex/ranks",
  "/bleachdex/premium",
  "/bleachdex/contact",
  "/company-privacy",
  "/company-terms",
  "/bleachdex/privacy",
  "/bleachdex/terms",
];

export default defineEventHandler((event) => {
  const urls = [
    ...PAGES,
    ...(characters as { id: number }[]).map((c) => `/bleachdex/roster/${c.id}`),
    ...(weapons as { id: number }[]).map((w) => `/bleachdex/weapons/${w.id}`),
  ];
  setResponseHeader(event, "content-type", "application/xml; charset=utf-8");
  setResponseHeader(event, "cache-control", "public, max-age=3600");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`
  );
});
