// Lists every catalog image that GitHub cannot serve. Run: node scripts/check-images.mjs
// Add --mirror /var/www/bleachdex-art to also download them (then set ART_DIR=/var/www/bleachdex-art in .env).
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
const mirror = process.argv.includes("--mirror") ? process.argv[process.argv.indexOf("--mirror") + 1] : null;
const urls = new Set();
for (const f of ["characters", "weapons"])
  for (const r of JSON.parse(readFileSync(new URL(`../src/data/${f}.json`, import.meta.url), "utf8")))
    for (const u of [r.image_path, r.card_image_path]) if (u) urls.add(u);
let bad = 0;
for (const u of urls) {
  const res = await fetch(u).catch(() => null);
  if (!res?.ok) { bad++; console.log("MISSING", res?.status ?? "network", decodeURIComponent(u.split("/main/")[1])); continue; }
  if (mirror) {
    const rel = decodeURIComponent(u.split("/main/")[1]);
    mkdirSync(dirname(join(mirror, rel)), { recursive: true });
    writeFileSync(join(mirror, rel), Buffer.from(await res.arrayBuffer()));
  }
}
console.log(`${urls.size} images checked, ${bad} missing`);
