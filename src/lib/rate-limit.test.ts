import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "./rate-limit.ts";

test("allows up to the limit, then asks the caller to wait", () => {
  const rl = createRateLimiter(3, 60_000);
  assert.equal(rl.hit("a", 0), 0);
  assert.equal(rl.hit("a", 1), 0);
  assert.equal(rl.hit("a", 2), 0);
  assert.ok(rl.hit("a", 3) > 0);
});

test("keys are independent and the window resets", () => {
  const rl = createRateLimiter(1, 1000);
  assert.equal(rl.hit("a", 0), 0);
  assert.ok(rl.hit("a", 10) > 0);
  assert.equal(rl.hit("b", 10), 0);
  assert.equal(rl.hit("a", 1500), 0);
});

test("memory stays bounded", () => {
  const rl = createRateLimiter(5, 60_000, 10);
  for (let i = 0; i < 100; i++) rl.hit(`ip${i}`, i);
  assert.ok(rl.size() <= 10);
});
