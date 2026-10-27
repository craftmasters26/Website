import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  diffRange,
  insertText,
  makeLink,
  toggleLinePrefix,
  toggleWrap,
  type Edit,
  type LineKind,
} from "@/lib/discord-format";

/**
 * Formatting toolbar for a plain <textarea> + a small Discord-markdown renderer for the live
 * preview. The toolbar edits the text through the browser's own editing command, so Ctrl+Z
 * still undoes a bold / quote / link like any other typing.
 */

// ---------------------------------------------------------------- editing the textarea

export function applyEdit(el: HTMLTextAreaElement, edit: Edit) {
  const { from, to, insert } = diffRange(el.value, edit.value);
  el.focus();
  el.setSelectionRange(from, to);
  let ok = false;
  try {
    if (insert === "" && from === to) ok = true;
    else if (insert === "") ok = document.execCommand("delete");
    else ok = document.execCommand("insertText", false, insert);
  } catch {
    ok = false;
  }
  if (!ok || el.value !== edit.value) {
    // Fallback (no undo): set the value the way React expects and tell it.
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(el, edit.value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  el.setSelectionRange(edit.start, edit.end);
}

type Action = (value: string, start: number, end: number) => Edit;

const wrap =
  (l: string, r = l, ph = "text"): Action =>
  (v, s, e) =>
    toggleWrap(v, s, e, l, r, ph);
const lines =
  (kind: LineKind): Action =>
  (v, s, e) =>
    toggleLinePrefix(v, s, e, kind);

const ACTIONS = {
  bold: wrap("**", "**", "bold text"),
  italic: wrap("*", "*", "italic text"),
  underline: wrap("__", "__", "underlined text"),
  strike: wrap("~~", "~~", "struck text"),
  spoiler: wrap("||", "||", "spoiler"),
  code: wrap("`", "`", "code"),
  codeblock: wrap("```\n", "\n```", "code"),
  quote: lines("quote"),
  h1: lines("h1"),
  h2: lines("h2"),
  h3: lines("h3"),
  ul: lines("ul"),
  ol: lines("ol"),
  sub: lines("sub"),
  link: makeLink,
} satisfies Record<string, Action>;

type ActionName = keyof typeof ACTIONS;

function run(el: HTMLTextAreaElement | null, name: ActionName) {
  if (!el) return;
  applyEdit(el, ACTIONS[name](el.value, el.selectionStart, el.selectionEnd));
}

/** Ctrl/⌘ + B, I, U, K and Ctrl/⌘ + Shift + X, like in Discord itself. */
export function formatShortcut(e: KeyboardEvent<HTMLTextAreaElement>) {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  const name: ActionName | null = e.shiftKey
    ? k === "x"
      ? "strike"
      : null
    : k === "b"
      ? "bold"
      : k === "i"
        ? "italic"
        : k === "u"
          ? "underline"
          : k === "k"
            ? "link"
            : null;
  if (!name) return;
  e.preventDefault();
  run(e.currentTarget, name);
}

const EMOJI = [
  "🔥", "⚔️", "🗡️", "💀", "👹", "👑", "✨", "🎉", "🎁", "📣", "⚠️", "✅",
  "❌", "⭐", "💎", "🃏", "🌸", "🌙", "⚡", "❤️", "💙", "👀", "🎮", "🔔",
];

type Btn = { name: ActionName; label: ReactNode; title: string };
const GROUPS: Btn[][] = [
  [
    { name: "bold", label: <b>B</b>, title: "Bold (Ctrl+B)" },
    { name: "italic", label: <i>I</i>, title: "Italic (Ctrl+I)" },
    { name: "underline", label: <u>U</u>, title: "Underline (Ctrl+U)" },
    { name: "strike", label: <s>S</s>, title: "Strikethrough (Ctrl+Shift+X)" },
    { name: "spoiler", label: "||", title: "Spoiler" },
  ],
  [
    { name: "h1", label: "H1", title: "Big heading" },
    { name: "h2", label: "H2", title: "Medium heading" },
    { name: "h3", label: "H3", title: "Small heading" },
    { name: "sub", label: "-#", title: "Small grey text" },
  ],
  [
    { name: "quote", label: "❝", title: "Quote" },
    { name: "ul", label: "•", title: "Bulleted list" },
    { name: "ol", label: "1.", title: "Numbered list" },
  ],
  [
    { name: "code", label: "</>", title: "Inline code" },
    { name: "codeblock", label: "{ }", title: "Code block" },
    { name: "link", label: "🔗", title: "Link (Ctrl+K) — select text first, or a URL" },
  ],
];

const btnCls =
  "inline-flex h-8 min-w-8 items-center justify-center rounded border border-line-bright bg-void px-2 font-mono text-[12.5px] text-bone-dim transition-colors hover:border-azure-bright hover:text-bone";

export function FormatToolbar({ getEl }: { getEl: () => HTMLTextAreaElement | null }) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!emojiOpen) return;
    const close = (ev: MouseEvent) => {
      if (box.current && !box.current.contains(ev.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [emojiOpen]);

  function addEmoji(ch: string) {
    const el = getEl();
    if (el) applyEdit(el, insertText(el.value, el.selectionStart, el.selectionEnd, ch));
    setEmojiOpen(false);
  }

  return (
    <div ref={box} className="relative mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {GROUPS.map((g, i) => (
        <div key={i} className="flex items-center gap-1">
          {g.map((b) => (
            <button
              key={b.name}
              type="button"
              title={b.title}
              aria-label={b.title}
              className={btnCls}
              // mouse-down would move focus out of the textarea and lose the selection
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(getEl(), b.name)}
            >
              {b.label}
            </button>
          ))}
        </div>
      ))}
      <button
        type="button"
        title="Emoji"
        aria-label="Insert an emoji"
        className={btnCls}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setEmojiOpen((o) => !o)}
      >
        🙂
      </button>
      {emojiOpen ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-[272px] rounded-md border border-line-bright bg-void-raised p-2 shadow-lg">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI.map((ch) => (
              <button
                key={ch}
                type="button"
                className="h-8 rounded text-[18px] hover:bg-void"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addEmoji(ch)}
              >
                {ch}
              </button>
            ))}
          </div>
          <div className="mt-2 font-mono text-[10.5px] leading-snug text-bone-faint">
            Server emoji: paste its code, like &lt;:name:123456789012345678&gt; (in Discord type \:name: to get it).
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- tiny Discord-markdown renderer

const INLINE =
  /\*\*\*(?<bi>.+?)\*\*\*|\*\*(?<b>.+?)\*\*|__(?<u>.+?)__|~~(?<s>.+?)~~|\|\|(?<sp>.+?)\|\||\*(?<i1>.+?)\*|(?<![A-Za-z0-9])_(?<i2>.+?)_(?![A-Za-z0-9])|`(?<c>[^`\n]+)`|\[(?<lt>[^\]\n]+)\]\((?<lu>https?:\/\/[^)\s]+)\)|<(?<ea>a?):(?<en>\w+):(?<ei>\d{15,21})>|(?<url>https?:\/\/[^\s<>)]+)/gs;

function Spoiler({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <span
      role="button"
      tabIndex={0}
      title={shown ? "Hide" : "Click to reveal"}
      onClick={() => setShown((s) => !s)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setShown((s) => !s)}
      style={{
        background: shown ? "rgba(255,255,255,0.1)" : "#1e1f22",
        color: shown ? "inherit" : "transparent",
        borderRadius: 3,
        padding: "0 2px",
        cursor: "pointer",
      }}
    >
      {children}
    </span>
  );
}

export function inline(text: string, keyBase = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    const g = m.groups ?? {};
    if (idx > last) out.push(text.slice(last, idx));
    const key = `${keyBase}-${n++}`;
    if (g.bi !== undefined)
      out.push(
        <strong key={key}>
          <em>{inline(g.bi, key)}</em>
        </strong>,
      );
    else if (g.b !== undefined) out.push(<strong key={key}>{inline(g.b, key)}</strong>);
    else if (g.u !== undefined) out.push(<u key={key}>{inline(g.u, key)}</u>);
    else if (g.s !== undefined) out.push(<s key={key}>{inline(g.s, key)}</s>);
    else if (g.sp !== undefined) out.push(<Spoiler key={key}>{inline(g.sp, key)}</Spoiler>);
    else if (g.i1 !== undefined || g.i2 !== undefined) out.push(<em key={key}>{inline((g.i1 ?? g.i2) as string, key)}</em>);
    else if (g.c !== undefined)
      out.push(
        <code key={key} style={{ background: "#1e1f22", borderRadius: 3, padding: "1px 4px", fontSize: "0.85em" }}>
          {g.c}
        </code>,
      );
    else if (g.lt !== undefined)
      out.push(
        <span key={key} style={{ color: "#00a8fc" }}>
          {inline(g.lt, key)}
        </span>,
      );
    else if (g.ei !== undefined)
      out.push(
        <img
          key={key}
          alt={`:${g.en}:`}
          title={`:${g.en}:`}
          src={`https://cdn.discordapp.com/emojis/${g.ei}.${g.ea ? "gif" : "png"}?size=48`}
          style={{ display: "inline-block", height: 22, width: 22, verticalAlign: "-5px" }}
        />,
      );
    else if (g.url !== undefined)
      out.push(
        <span key={key} style={{ color: "#00a8fc" }}>
          {g.url}
        </span>,
      );
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function markdown(text: string): ReactNode {
  const rows = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < rows.length) {
    const line = rows[i];
    if (line.startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < rows.length && !rows[i].startsWith("```")) body.push(rows[i++]);
      i++;
      blocks.push(
        <pre
          key={k++}
          style={{
            background: "#1e1f22",
            border: "1px solid #3f4147",
            borderRadius: 4,
            padding: 8,
            margin: "4px 0",
            fontSize: 13,
            whiteSpace: "pre-wrap",
          }}
        >
          {body.join("\n")}
        </pre>,
      );
      continue;
    }
    const heading = /^(#{1,3}) (.+)$/.exec(line);
    const sub = /^-# (.+)$/.exec(line);
    const numbered = /^(\d+)\. (.+)$/.exec(line);
    if (heading) {
      const size = { 1: 20, 2: 17, 3: 15 }[heading[1].length as 1 | 2 | 3];
      blocks.push(
        <div key={k++} style={{ fontWeight: 700, fontSize: size, margin: "6px 0 2px" }}>
          {inline(heading[2], `h${k}`)}
        </div>,
      );
    } else if (sub) {
      blocks.push(
        <div key={k++} style={{ fontSize: 12, color: "#949ba4" }}>
          {inline(sub[1], `s${k}`)}
        </div>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <div key={k++} style={{ borderLeft: "4px solid #4e5058", paddingLeft: 10, margin: "2px 0" }}>
          {inline(line.slice(2), `q${k}`)}
        </div>,
      );
    } else if (/^[-*] /.test(line)) {
      blocks.push(
        <div key={k++} style={{ paddingLeft: 8 }}>
          • {inline(line.slice(2), `l${k}`)}
        </div>,
      );
    } else if (numbered) {
      blocks.push(
        <div key={k++} style={{ paddingLeft: 8 }}>
          {numbered[1]}. {inline(numbered[2], `n${k}`)}
        </div>,
      );
    } else {
      blocks.push(
        <Fragment key={k++}>
          {inline(line, `p${k}`)}
          {i < rows.length - 1 ? <br /> : null}
        </Fragment>,
      );
    }
    i++;
  }
  return blocks;
}
