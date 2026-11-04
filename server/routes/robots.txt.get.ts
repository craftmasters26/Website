import { defineEventHandler, setResponseHeader } from "h3";

const SITE = "https://boundlessproductions.org";

export default defineEventHandler((event) => {
  setResponseHeader(event, "content-type", "text/plain; charset=utf-8");
  setResponseHeader(event, "cache-control", "public, max-age=3600");
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /bleachdex/admin",
    "Disallow: /bleachdex/checkout",
    "Disallow: /bleachdex/owned",
    "",
    `Sitemap: ${SITE}/sitemap.xml`,
    "",
  ].join("\n");
});
