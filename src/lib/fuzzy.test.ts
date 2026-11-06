import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesName } from "./fuzzy.ts";

test("empty query matches everything", () => assert.ok(matchesName("Ichigo Kurosaki", "  ")));
test("partial words in any order", () => assert.ok(matchesName("Ichigo Kurosaki", "kuro ichi")));
test("missing letters still match", () => assert.ok(matchesName("Ichigo Kurosaki", "ichgo")));
test("ignores accents and punctuation", () => assert.ok(matchesName("Ulquiorra Cifer", "ulquiorra-cifer")));
test("short queries do not subsequence-match", () => assert.equal(matchesName("Ichigo Kurosaki", "ik"), false));
test("non-matches fail", () => assert.equal(matchesName("Ichigo Kurosaki", "aizen"), false));
