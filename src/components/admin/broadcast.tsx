import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { adminRequest } from "@/lib/admin";
import { Field, Panel, Status, failureText, inputCls, useAction } from "./ui";

/**
 * Global message tab: write an announcement, see exactly how it will look in
 * Discord, then send it to every server the bot is in (same as /admin globalmessage).
 * The embed shape mirrors cogs/broadcast.py build_embed().
 */

const TITLE_MAX = 256;
const MESSAGE_MAX = 4000;
const FOOTER_MAX = 200;
const DEFAULT_COLOR = "#5C8DFF";
const DEFAULT_FOOTER = "BleachDex announcement";

// ---------------------------------------------------------------- tiny Discord-markdown renderer

const INLINE =
  /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\*(.+?)\*|(?<![A-Za-z0-9])_(.+?)_(?![A-Za-z0-9])|`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/gs;

function inline(text: string, keyBase = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const key = `${keyBase}-${n++}`;
    if (m[1] !== undefined) out.push(<strong key={key}><em>{inline(m[1], key)}</em></strong>);
    else if (m[2] !== undefined) out.push(<strong key={key}>{inline(m[2], key)}</strong>);
    else if (m[3] !== undefined) out.push(<u key={key}>{inline(m[3], key)}</u>);
    else if (m[4] !== undefined) out.push(<s key={key}>{inline(m[4], key)}</s>);
    else if (m[5] !== undefined || m[6] !== undefined) out.push(<em key={key}>{inline((m[5] ?? m[6]) as string, key)}</em>);
    else if (m[7] !== undefined)
      out.push(
        <code key={key} style={{ background: "#1e1f22", borderRadius: 3, padding: "1px 4px", fontSize: "0.85em" }}>
          {m[7]}
        </code>,
      );
    else if (m[8] !== undefined)
      out.push(
        <span key={key} style={{ color: "#00a8fc" }}>
          {inline(m[8], key)}
        </span>,
      );
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function markdown(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
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
    if (heading) {
      const size = { 1: 20, 2: 17, 3: 15 }[heading[1].length as 1 | 2 | 3];
      blocks.push(
        <div key={k++} style={{ fontWeight: 700, fontSize: size, margin: "6px 0 2px" }}>
          {inline(heading[2], `h${k}`)}
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
    } else {
      blocks.push(
        <Fragment key={k++}>
          {inline(line, `p${k}`)}
          {i < lines.length - 1 ? <br /> : null}
        </Fragment>,
      );
    }
    i++;
  }
  return blocks;
}

// ---------------------------------------------------------------- the preview

function normalizeColor(c: string): string | null {
  const t = c.trim().replace(/^#/, "");
  if (!t) return DEFAULT_COLOR;
  return /^[0-9a-fA-F]{6}$/.test(t) ? `#${t}` : null;
}

function DiscordPreview({
  title,
  message,
  color,
  image,
  footer,
}: {
  title: string;
  message: string;
  color: string;
  image: string;
  footer: string;
}) {
  const accent = normalizeColor(color) ?? DEFAULT_COLOR;
  const imageOk = image.trim().toLowerCase().startsWith("https://");
  const empty = !title.trim() && !message.trim();
  return (
    <div
      style={{
        background: "#313338",
        color: "#dbdee1",
        borderRadius: 8,
        padding: 16,
        fontFamily: '"gg sans","Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#5865f2",
            flex: "none",
            display: "grid",
            placeItems: "center",
            color: "white",
            fontWeight: 700,
          }}
        >
          B
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>BleachDex</span>
            <span
              style={{
                background: "#5865f2",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 3,
                padding: "1px 5px",
              }}
            >
              APP
            </span>
            <span style={{ color: "#949ba4", fontSize: 12 }}>Today</span>
          </div>
          <div
            style={{
              background: "#2b2d31",
              borderLeft: `4px solid ${accent}`,
              borderRadius: 4,
              padding: "8px 16px 16px 12px",
              maxWidth: 520,
              fontSize: 14,
              lineHeight: 1.375,
              overflowWrap: "anywhere",
            }}
          >
            {empty ? (
              <div style={{ color: "#949ba4", paddingTop: 8 }}>Your message will appear here…</div>
            ) : null}
            {title.trim() ? (
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 16, marginTop: 8 }}>{inline(title, "t")}</div>
            ) : null}
            {message.trim() ? <div style={{ marginTop: 8 }}>{markdown(message)}</div> : null}
            {imageOk ? (
              <img
                src={image.trim()}
                alt=""
                style={{ marginTop: 16, maxWidth: "100%", borderRadius: 4, display: "block" }}
              />
            ) : null}
            <div style={{ marginTop: 8, fontSize: 12, color: "#b5bac1" }}>{footer.trim() || DEFAULT_FOOTER}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the tab

export function BroadcastTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [image, setImage] = useState("");
  const [footer, setFooter] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [targets, setTargets] = useState<{ servers: number; skipped: number } | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const send = useAction();

  const loadTargets = useCallback(async () => {
    setTargetError(null);
    try {
      const r = await adminRequest<{ servers: number; skipped: number }>("/internal/admin/broadcast/targets");
      if (r.status === "ok") setTargets(r.data);
      else setTargetError(failureText(r));
    } catch {
      setTargetError("The request failed.");
    }
  }, []);

  useEffect(() => {
    void loadTargets();
  }, [loadTargets]);

  const colorValue = normalizeColor(color);
  const imageBad = image.trim() !== "" && !image.trim().toLowerCase().startsWith("https://");
  const problem =
    !title.trim() && !message.trim()
      ? "Write a title or a message."
      : colorValue === null
        ? "Colour must be a 6-digit hex code like #5C8DFF."
        : imageBad
          ? "The image link must start with https://"
          : null;

  function doSend() {
    setConfirming(false);
    void send.run(async () => {
      const r = await adminRequest<{ sent: number; failed: number; skipped: number; failed_names: string[] }>(
        "/internal/admin/broadcast",
        {
          title: title.trim(),
          message: message.trim(),
          color: colorValue ?? DEFAULT_COLOR,
          image_url: image.trim(),
          footer: footer.trim(),
        },
      );
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      const d = r.data;
      void loadTargets();
      return {
        ok: true,
        text:
          `Sent to ${d.sent} servers` +
          (d.failed ? ` · ${d.failed} failed (${d.failed_names.join(", ")})` : "") +
          (d.skipped ? ` · ${d.skipped} skipped` : "") +
          ".",
      };
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Global message"
        blurb="Posts an announcement in every server the bot is in (their spawn channel, or the server's system channel). Pings are always off. Same as /admin globalmessage."
      >
        <div className="grid gap-4">
          <Field label={`Title (optional) — ${title.length}/${TITLE_MAX}`}>
            <input className={inputCls} value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field
            label={`Message — ${message.length}/${MESSAGE_MAX}`}
            hint="Discord markdown works: **bold**, *italic*, __underline__, ~~strike~~, `code`, > quote, # heading, [link](https://…)"
          >
            <textarea
              className={`${inputCls} min-h-[180px] resize-y`}
              value={message}
              maxLength={MESSAGE_MAX}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Colour">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick a colour"
                  className="h-10 w-12 cursor-pointer rounded-md border border-line-bright bg-void p-1"
                  value={colorValue ?? DEFAULT_COLOR}
                  onChange={(e) => setColor(e.target.value)}
                />
                <input className={inputCls} value={color} maxLength={7} onChange={(e) => setColor(e.target.value)} />
              </div>
            </Field>
            <Field label="Footer (optional)" hint={`Default: ${DEFAULT_FOOTER}`}>
              <input className={inputCls} value={footer} maxLength={FOOTER_MAX} onChange={(e) => setFooter(e.target.value)} />
            </Field>
          </div>
          <Field label="Image link (optional)" hint="Shown under the message. Must start with https://">
            <input className={inputCls} value={image} placeholder="https://…" onChange={(e) => setImage(e.target.value)} />
          </Field>

          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
            {confirming ? (
              <>
                <span className="font-mono text-[12px] text-bone-dim">
                  Post this in {targets?.servers ?? "all"} servers right now?
                </span>
                <button type="button" className="btn btn-fill px-6 py-2.5 text-sm" onClick={doSend}>
                  Yes, send it
                </button>
                <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-fill px-6 py-2.5 text-sm"
                disabled={send.busy || problem !== null || !targets || targets.servers === 0}
                onClick={() => setConfirming(true)}
              >
                {send.busy ? "Sending…" : `Send to ${targets ? targets.servers : "…"} servers`}
              </button>
            )}
            <Status msg={send.msg} />
          </div>
          {problem ? <span className="font-mono text-[12px] text-ember-bright">{problem}</span> : null}
          {targetError ? <span className="font-mono text-[12px] text-ember-bright">{targetError}</span> : null}
          {targets && targets.skipped > 0 ? (
            <span className="font-mono text-[11.5px] text-bone-faint">
              {targets.skipped} server(s) can't be reached (no channel the bot can post embeds in, or blacklisted).
            </span>
          ) : null}
        </div>
      </Panel>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Panel title="Preview" blurb="This is how it will look in Discord (desktop, dark theme).">
          <DiscordPreview title={title} message={message} color={color} image={image} footer={footer} />
        </Panel>
      </div>
    </div>
  );
}
