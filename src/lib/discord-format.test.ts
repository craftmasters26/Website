import { test } from "node:test";
import assert from "node:assert/strict";
import { diffRange, insertText, makeLink, toggleLinePrefix, toggleWrap } from "./discord-format.ts";

test("wraps a selection and selects the inside", () => {
  const r = toggleWrap("hello world", 6, 11, "**");
  assert.equal(r.value, "hello **world**");
  assert.equal(r.value.slice(r.start, r.end), "world");
});

test("removes markers that sit around the selection", () => {
  const r = toggleWrap("hello **world**", 8, 13, "**");
  assert.equal(r.value, "hello world");
  assert.equal(r.value.slice(r.start, r.end), "world");
});

test("removes markers that are inside the selection", () => {
  const r = toggleWrap("hello **world**", 6, 15, "**");
  assert.equal(r.value, "hello world");
});

test("empty selection inserts a placeholder", () => {
  const r = toggleWrap("", 0, 0, "~~", "~~", "text");
  assert.equal(r.value, "~~text~~");
  assert.equal(r.value.slice(r.start, r.end), "text");
});

test("italic on bold text makes bold-italic, not plain italic", () => {
  const r = toggleWrap("**bold**", 2, 6, "*");
  assert.equal(r.value, "***bold***");
});

test("italic toggles off a lone *", () => {
  assert.equal(toggleWrap("*it*", 1, 3, "*").value, "it");
  assert.equal(toggleWrap("*it*", 0, 4, "*").value, "it");
});

test("spoiler and code block", () => {
  assert.equal(toggleWrap("secret", 0, 6, "||").value, "||secret||");
  assert.equal(toggleWrap("x = 1", 0, 5, "```\n", "\n```").value, "```\nx = 1\n```");
});

test("quote / heading / lists on several lines", () => {
  const v = "one\ntwo\nthree";
  assert.equal(toggleLinePrefix(v, 0, v.length, "quote").value, "> one\n> two\n> three");
  assert.equal(toggleLinePrefix("> one\n> two", 0, 11, "quote").value, "one\ntwo");
  assert.equal(toggleLinePrefix(v, 0, v.length, "ul").value, "- one\n- two\n- three");
  assert.equal(toggleLinePrefix(v, 0, v.length, "ol").value, "1. one\n2. two\n3. three");
  assert.equal(toggleLinePrefix(v, 4, 4, "h2").value, "one\n## two\nthree");
});

test("changing heading level replaces the old one; same level removes it", () => {
  assert.equal(toggleLinePrefix("# Title", 0, 7, "h2").value, "## Title");
  assert.equal(toggleLinePrefix("## Title", 0, 8, "h2").value, "Title");
});

test("a caret on a line stays a caret after the prefix is added", () => {
  const r = toggleLinePrefix("hello", 2, 2, "quote");
  assert.equal(r.value, "> hello");
  assert.equal(r.start, r.end);
});

test("small text and blank lines", () => {
  assert.equal(toggleLinePrefix("a\n\nb", 0, 4, "sub").value, "-# a\n\n-# b");
});

test("links", () => {
  const a = makeLink("click here", 0, 10);
  assert.equal(a.value, "[click here](https://)");
  assert.equal(a.value.slice(a.start, a.end), "https://");
  const b = makeLink("https://x.io/a", 0, 14);
  assert.equal(b.value, "[link text](https://x.io/a)");
  assert.equal(b.value.slice(b.start, b.end), "link text");
});

test("insertText and diffRange", () => {
  assert.equal(insertText("ab", 1, 1, "X").value, "aXb");
  for (const [a, b] of [
    ["hello world", "hello **world**"],
    ["abc", "abc"],
    ["", "x"],
    ["> one\n> two", "one\ntwo"],
  ] as const) {
    const d = diffRange(a, b);
    assert.equal(a.slice(0, d.from) + d.insert + a.slice(d.to), b);
  }
  assert.deepEqual(diffRange("abc", "abc"), { from: 3, to: 3, insert: "" });
});
