/**
 * Pure text helpers behind the Message tab's formatting toolbar. They take the text and the
 * current selection and return the new text and selection, so they are easy to test and
 * have no DOM in them. Discord markdown only: **bold**, *italic*, __underline__, ~~strike~~,
 * ||spoiler||, `code`, ```code block```, > quote, # heading, - list, 1. list, -# small text.
 */

export type Edit = { value: string; start: number; end: number };

/** Wraps the selection in `left`/`right`, or removes them if they are already there. */
export function toggleWrap(
  value: string,
  start: number,
  end: number,
  left: string,
  right: string = left,
  placeholder = "text",
): Edit {
  const sel = value.slice(start, end);
  const single = left.length === 1 && left === right;

  // Markers just outside the selection (e.g. the caret is inside **|**, or the word is selected).
  const outsideL = start >= left.length && value.slice(start - left.length, start) === left;
  const outsideR = value.slice(end, end + right.length) === right;
  // For a lone * or _, "**bold**" must not count as italic markers around "bold".
  const doubledOutside = single && (value[start - 2] === left || value[end + right.length] === right);
  if (outsideL && outsideR && !doubledOutside) {
    const next = value.slice(0, start - left.length) + sel + value.slice(end + right.length);
    return { value: next, start: start - left.length, end: end - left.length };
  }

  // Markers inside the selection (the whole "**bold**" is selected).
  const doubledInside = single && (sel[1] === left || sel[sel.length - 2] === right);
  if (sel.length >= left.length + right.length && sel.startsWith(left) && sel.endsWith(right) && !doubledInside) {
    const inner = sel.slice(left.length, sel.length - right.length);
    return { value: value.slice(0, start) + inner + value.slice(end), start, end: start + inner.length };
  }

  const body = sel || placeholder;
  const next = value.slice(0, start) + left + body + right + value.slice(end);
  return { value: next, start: start + left.length, end: start + left.length + body.length };
}

export type LineKind = "quote" | "ul" | "ol" | "h1" | "h2" | "h3" | "sub";

const OWN: Record<LineKind, RegExp> = {
  quote: /^> /,
  ul: /^[-*] /,
  ol: /^\d+\. /,
  h1: /^# /,
  h2: /^## /,
  h3: /^### /,
  sub: /^-# /,
};
const ANY_HEADING = /^#{1,3} /;
const PREFIX: Record<LineKind, string> = { quote: "> ", ul: "- ", ol: "", h1: "# ", h2: "## ", h3: "### ", sub: "-# " };

/** Adds (or removes, when every line already has it) a line prefix on each selected line. */
export function toggleLinePrefix(value: string, start: number, end: number, kind: LineKind): Edit {
  const collapsed = start === end;
  let lastChar = end;
  if (end > start && value[end - 1] === "\n") lastChar = end - 1;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nl = value.indexOf("\n", lastChar);
  const lineEnd = nl === -1 ? value.length : nl;
  const lines = value.slice(lineStart, lineEnd).split("\n");

  const own = OWN[kind];
  const heading = kind === "h1" || kind === "h2" || kind === "h3";
  const filled = lines.filter((l) => l.trim() !== "");
  const allHave = filled.length > 0 && filled.every((l) => own.test(l));

  const out = lines.map((line, i) => {
    if (allHave) return line.replace(own, "");
    if (line.trim() === "" && lines.length > 1) return line;
    let base = line;
    if (heading) base = base.replace(ANY_HEADING, "");
    else base = base.replace(own, "");
    const prefix = kind === "ol" ? `${i + 1}. ` : PREFIX[kind];
    return prefix + base;
  });

  const text = out.join("\n");
  const next = value.slice(0, lineStart) + text + value.slice(lineEnd);
  const newEnd = lineStart + text.length;
  return collapsed ? { value: next, start: newEnd, end: newEnd } : { value: next, start: lineStart, end: newEnd };
}

/** [text](url). A selected URL becomes the target; otherwise the selection becomes the text. */
export function makeLink(value: string, start: number, end: number): Edit {
  const sel = value.slice(start, end);
  if (/^https?:\/\/\S+$/.test(sel)) {
    const text = "link text";
    const md = `[${text}](${sel})`;
    return { value: value.slice(0, start) + md + value.slice(end), start: start + 1, end: start + 1 + text.length };
  }
  const text = sel || "link text";
  const url = "https://";
  const md = `[${text}](${url})`;
  const urlStart = start + text.length + 3;
  return { value: value.slice(0, start) + md + value.slice(end), start: urlStart, end: urlStart + url.length };
}

/** Puts `text` at the caret (replacing any selection). */
export function insertText(value: string, start: number, end: number, text: string): Edit {
  const caret = start + text.length;
  return { value: value.slice(0, start) + text + value.slice(end), start: caret, end: caret };
}

/** The smallest range that differs between two strings; used to edit a textarea without losing undo. */
export function diffRange(a: string, b: string): { from: number; to: number; insert: string } {
  let p = 0;
  const max = Math.min(a.length, b.length);
  while (p < max && a[p] === b[p]) p++;
  let q = 0;
  while (q < max - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++;
  return { from: p, to: a.length - q, insert: b.slice(p, b.length - q) };
}
