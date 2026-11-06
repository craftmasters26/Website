// Bundle size report for the production build. Run: npx vite build && npm run analyze
// Prints the biggest client chunks (raw + gzip) and warns when budgets are exceeded.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const DIR = ".output/public/assets";
const MAIN_BUDGET_KB = 250; // gzip, entry chunk
const ROUTE_BUDGET_KB = 80; // gzip, any single route chunk except admin

let files;
try {
  files = readdirSync(DIR).filter((f) => f.endsWith(".js"));
} catch {
  console.error(`No build found at ${DIR}. Run: npx vite build`);
  process.exit(1);
}
const rows = files
  .map((f) => {
    const buf = readFileSync(join(DIR, f));
    return { f, raw: statSync(join(DIR, f)).size, gz: gzipSync(buf).length };
  })
  .sort((a, b) => b.gz - a.gz);

const kb = (n) => (n / 1024).toFixed(1).padStart(8);
console.log("gzip KB   raw KB  chunk");
for (const r of rows.slice(0, 15)) console.log(`${kb(r.gz)} ${kb(r.raw)}  ${r.f}`);
const total = rows.reduce((n, r) => n + r.gz, 0);
console.log(`\n${rows.length} JS chunks, ${(total / 1024).toFixed(0)} KB gzip in total`);

let warn = 0;
for (const r of rows) {
  const isEntry = /^index-/.test(r.f);
  const isAdmin = /admin/.test(r.f);
  const budget = isEntry ? MAIN_BUDGET_KB : isAdmin ? Infinity : ROUTE_BUDGET_KB;
  if (r.gz / 1024 > budget) {
    warn++;
    console.warn(`WARN ${r.f}: ${(r.gz / 1024).toFixed(0)} KB gzip exceeds ${budget} KB budget`);
  }
}
if (process.env.BUNDLE_STRICT && warn) process.exit(1);
