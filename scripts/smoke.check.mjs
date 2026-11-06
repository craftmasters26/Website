// HTTP-level smoke test against the production build. Run: npx vite build && npm run test:smoke
import { spawn } from "node:child_process";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const PORT = 3211;
const base = `http://127.0.0.1:${PORT}`;
let server;

before(async () => {
  server = spawn("node", [".output/server/index.mjs"], {
    env: { ...process.env, NODE_ENV: "production", HOST: "127.0.0.1", PORT: String(PORT) },
    stdio: "ignore",
  });
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not become healthy");
});
after(() => server?.kill());

test("health is public and minimal", async () => {
  const j = await (await fetch(`${base}/api/health`)).json();
  assert.equal(j.status, "ok");
  assert.deepEqual(Object.keys(j).sort(), ["status", "uptimeSeconds"]);
});
test("ready is hidden without secret", async () => {
  assert.equal((await fetch(`${base}/api/ready`)).status, 404);
});
test("robots and sitemap", async () => {
  assert.match(await (await fetch(`${base}/robots.txt`)).text(), /Sitemap:/);
  assert.match(await (await fetch(`${base}/sitemap.xml`)).text(), /bleachdex\/roster\//);
});
test("legacy redirects", async () => {
  for (const p of ["/list", "/premium", "/leaderboard", "/owned"]) {
    const r = await fetch(`${base}${p}`, { redirect: "manual" });
    assert.equal(r.status, 301);
    assert.match(r.headers.get("location"), /\/bleachdex\//);
  }
});
test("pages render and unknown route is 404", async () => {
  for (const p of ["/", "/bleachdex", "/bleachdex/list", "/bleachdex/premium", "/bleachdex/commands"]) {
    assert.equal((await fetch(`${base}${p}`)).status, 200, p);
  }
  assert.equal((await fetch(`${base}/nope-nope`)).status, 404);
});
