import { useCallback, useEffect, useRef, useState } from "react";
import { adminRequest, type AdminGuild } from "@/lib/admin";
import { Field, Panel, Status, failureText, inputCls, useAction } from "./ui";
import { FormatToolbar, formatShortcut, inline, markdown } from "./rich-text";

/**
 * Global message tab: write an announcement, see exactly how it will look in Discord, then
 * send it to every server the bot is in (same as /admin globalmessage), or only to the
 * servers / players you pick.
 *
 * Two shapes, both built by cogs/broadcast.py:
 *   - "embed": the coloured card (title, text, author, thumbnail, fields, image, footer, time)
 *   - "plain": an ordinary Discord message
 */

const TITLE_MAX = 256;
const MESSAGE_MAX = 4000;
const PLAIN_MAX = 1880; // the bot keeps room for the DM opt-out line (2000 - 120)
const FOOTER_MAX = 200;
const AUTHOR_MAX = 256;
const FIELD_NAME_MAX = 256;
const FIELD_VALUE_MAX = 1024;
const MAX_FIELDS = 6;
const EMBED_TOTAL_MAX = 6000;
const DEFAULT_COLOR = "#5C8DFF";
const DEFAULT_FOOTER = "BleachDex announcement";
const DM_FOOTER_NOTE = "Don't want these DMs? Use /announcements off";
const DRAFT_KEY = "bleachdex-admin-message-draft";

type Mode = "embed" | "plain";
type Audience = "servers" | "users" | "both" | "specific";
type EmbedField = { id: number; name: string; value: string; inline: boolean };
type ResolvedUser = { id: string; found: boolean; name: string; is_bot: boolean; is_player: boolean; opted_out: boolean };
const MAX_SPECIFIC_USERS = 500;
type Counts = { servers: number; skipped: number; users: number; opted_out: number };
type JobStatus = {
  running?: boolean;
  audience?: Audience;
  started_at?: number | null;
  error?: string | null;
  servers_total?: number;
  servers_sent?: number;
  servers_failed?: number;
  servers_skipped?: number;
  users_total?: number;
  users_sent?: number;
  users_closed?: number;
  users_failed?: number;
  users_left_out?: number;
  servers_requested?: number;
  users_requested?: number;
  skipped_names?: string[];
  user_problems?: string[];
};

const TEMPLATES: { label: string; title: string; message: string; color: string }[] = [
  {
    label: "Update / patch notes",
    title: "📣 BleachDex update",
    message: "## What's new\n- **New:** \n- **Improved:** \n- **Fixed:** \n\n-# Thanks for playing!",
    color: "#5C8DFF",
  },
  {
    label: "Event",
    title: "🎉 A new event has started!",
    message: "Something special is happening in BleachDex.\n\n> **Starts:** \n> **Ends:** \n\nGood luck, and have fun!",
    color: "#FF8F4D",
  },
  {
    label: "Maintenance",
    title: "🛠️ Scheduled maintenance",
    message: "The bot will be offline for a short while.\n\n> **When:** \n> **How long:** about \n\nNothing will be lost — see you soon!",
    color: "#F2C94C",
  },
];

// ---------------------------------------------------------------- the preview

function normalizeColor(c: string): string | null {
  const t = c.trim().replace(/^#/, "");
  if (!t) return DEFAULT_COLOR;
  return /^[0-9a-fA-F]{6}$/.test(t) ? `#${t}` : null;
}

type PreviewProps = {
  mode: Mode;
  title: string;
  message: string;
  color: string;
  image: string;
  thumbnail: string;
  author: string;
  timestamp: boolean;
  fields: EmbedField[];
  footer: string;
  dm: boolean;
};

const isHttps = (v: string) => v.trim().toLowerCase().startsWith("https://");

function DiscordPreview(p: PreviewProps) {
  const accent = normalizeColor(p.color) ?? DEFAULT_COLOR;
  const plain = p.mode === "plain";
  const imageOk = isHttps(p.image);
  const thumbOk = isHttps(p.thumbnail);
  const shownFields = p.fields.filter((f) => f.name.trim() && f.value.trim());
  const empty = plain ? !p.message.trim() : !p.title.trim() && !p.message.trim() && shownFields.length === 0;
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const footerText = (p.footer.trim() || DEFAULT_FOOTER) + (p.dm ? ` · ${DM_FOOTER_NOTE}` : "");

  const emptyNote = <div style={{ color: "#949ba4", paddingTop: 4 }}>Your message will appear here…</div>;

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

          {plain ? (
            <div style={{ fontSize: 14, lineHeight: 1.375, overflowWrap: "anywhere", maxWidth: 560 }}>
              {empty ? emptyNote : markdown(p.message)}
              {p.dm && !empty ? <div style={{ fontSize: 12, color: "#949ba4" }}>{DM_FOOTER_NOTE}</div> : null}
            </div>
          ) : (
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
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {empty ? emptyNote : null}
                  {p.author.trim() ? (
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginTop: 8 }}>{p.author.trim()}</div>
                  ) : null}
                  {p.title.trim() ? (
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 16, marginTop: 8 }}>{inline(p.title, "t")}</div>
                  ) : null}
                  {p.message.trim() ? <div style={{ marginTop: 8 }}>{markdown(p.message)}</div> : null}
                </div>
                {thumbOk ? (
                  <img
                    src={p.thumbnail.trim()}
                    alt=""
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4, flex: "none", marginTop: 8 }}
                  />
                ) : null}
              </div>
              {shownFields.length ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 8 }}>
                  {shownFields.map((f) => (
                    <div key={f.id} style={{ gridColumn: f.inline ? "span 1" : "1 / -1", minWidth: 0 }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                      <div style={{ fontSize: 14 }}>{markdown(f.value)}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {imageOk ? (
                <img
                  src={p.image.trim()}
                  alt=""
                  style={{ marginTop: 16, maxWidth: "100%", borderRadius: 4, display: "block" }}
                />
              ) : null}
              <div style={{ marginTop: 8, fontSize: 12, color: "#b5bac1" }}>
                {footerText}
                {p.timestamp ? ` • Today at ${now}` : ""}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the tab

type Draft = {
  mode: Mode;
  title: string;
  message: string;
  color: string;
  image: string;
  footer: string;
  thumbnail: string;
  author: string;
  timestamp: boolean;
  fields: { name: string; value: string; inline: boolean }[];
};

function readDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    if (typeof d !== "object" || d === null) return null;
    return {
      mode: d.mode === "plain" ? "plain" : "embed",
      title: String(d.title ?? ""),
      message: String(d.message ?? ""),
      color: String(d.color ?? DEFAULT_COLOR),
      image: String(d.image ?? ""),
      footer: String(d.footer ?? ""),
      thumbnail: String(d.thumbnail ?? ""),
      author: String(d.author ?? ""),
      timestamp: Boolean(d.timestamp),
      fields: Array.isArray(d.fields)
        ? d.fields.slice(0, MAX_FIELDS).map((f) => ({
            name: String(f?.name ?? ""),
            value: String(f?.value ?? ""),
            inline: Boolean(f?.inline),
          }))
        : [],
    };
  } catch {
    return null;
  }
}

export function BroadcastTab({ guilds }: { guilds: AdminGuild[] | null }) {
  const [mode, setMode] = useState<Mode>("embed");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [image, setImage] = useState("");
  const [footer, setFooter] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [author, setAuthor] = useState("");
  const [timestamp, setTimestamp] = useState(false);
  const [fields, setFields] = useState<EmbedField[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const fieldId = useRef(1);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  const [audience, setAudience] = useState<Audience>("servers");
  const [confirming, setConfirming] = useState(false);
  const [pickedGuilds, setPickedGuilds] = useState<string[]>([]);
  const [guildFilter, setGuildFilter] = useState("");
  const [userInput, setUserInput] = useState("");
  const [resolved, setResolved] = useState<ResolvedUser[] | null>(null);
  const lookup = useAction();
  const [targets, setTargets] = useState<Counts | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const send = useAction();
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const embed = mode === "embed";
  const messageMax = embed ? MESSAGE_MAX : PLAIN_MAX;

  // ---- draft: restore once, then save while typing (so a refresh doesn't lose a long announcement)
  useEffect(() => {
    const d = readDraft();
    if (d) {
      setMode(d.mode);
      setTitle(d.title);
      setMessage(d.message);
      setColor(d.color);
      setImage(d.image);
      setFooter(d.footer);
      setThumbnail(d.thumbnail);
      setAuthor(d.author);
      setTimestamp(d.timestamp);
      setFields(d.fields.map((f) => ({ ...f, id: fieldId.current++ })));
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const t = setTimeout(() => {
      try {
        const draft: Draft = {
          mode,
          title,
          message,
          color,
          image,
          footer,
          thumbnail,
          author,
          timestamp,
          fields: fields.map(({ name, value, inline }) => ({ name, value, inline })),
        };
        const empty = !title && !message && !image && !footer && !thumbnail && !author && fields.length === 0;
        if (empty) window.localStorage.removeItem(DRAFT_KEY);
        else window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage is blocked or full — the draft just isn't kept */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [draftReady, mode, title, message, color, image, footer, thumbnail, author, timestamp, fields]);

  function clearForm() {
    setTitle("");
    setMessage("");
    setColor(DEFAULT_COLOR);
    setImage("");
    setFooter("");
    setThumbnail("");
    setAuthor("");
    setTimestamp(false);
    setFields([]);
    setConfirming(false);
  }

  function loadTemplate(i: number) {
    const t = TEMPLATES[i];
    if (!t) return;
    if (message.trim() && !window.confirm("Replace what you've written with this template?")) return;
    setMode("embed");
    setTitle(t.title);
    setMessage(t.message);
    setColor(t.color);
  }

  function addField() {
    setFields((cur) => (cur.length >= MAX_FIELDS ? cur : [...cur, { id: fieldId.current++, name: "", value: "", inline: false }]));
  }
  function patchField(id: number, patch: Partial<EmbedField>) {
    setFields((cur) => cur.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  const loadTargets = useCallback(async () => {
    setTargetError(null);
    try {
      const r = await adminRequest<Counts>("/internal/admin/broadcast/targets");
      if (r.status === "ok") setTargets(r.data);
      else setTargetError(failureText(r));
    } catch {
      setTargetError("The request failed.");
    }
  }, []);

  const loadJob = useCallback(async () => {
    try {
      const r = await adminRequest<JobStatus>("/internal/admin/broadcast/status");
      if (r.status === "ok") {
        setJob(r.data);
        if (!r.data.running && poll.current) {
          clearInterval(poll.current);
          poll.current = null;
          void loadTargets();
        }
        return r.data;
      }
    } catch {
      /* keep the last known progress */
    }
    return null;
  }, [loadTargets]);

  useEffect(() => {
    void loadTargets();
    void loadJob().then((j) => {
      if (j?.running && !poll.current) poll.current = setInterval(() => void loadJob(), 2500);
    });
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
  }, [loadTargets, loadJob]);

  const userIds = Array.from(new Set(userInput.match(/\d{15,21}/g) ?? []));
  const specific = audience === "specific";

  function toggleGuild(id: string) {
    setPickedGuilds((cur) => (cur.includes(id) ? cur.filter((g) => g !== id) : [...cur, id]));
  }

  function lookUpPlayers() {
    void lookup.run(async () => {
      const r = await adminRequest<{ users: ResolvedUser[] }>("/internal/admin/broadcast/resolve", {
        user_ids: userIds.slice(0, 50),
      });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setResolved(r.data.users);
      return {
        ok: true,
        text: userIds.length > 50 ? "Looked up the first 50 ids." : `Looked up ${r.data.users.length} id(s).`,
      };
    });
  }

  const colorValue = normalizeColor(color);
  const imageBad = embed && image.trim() !== "" && !isHttps(image);
  const thumbBad = embed && thumbnail.trim() !== "" && !isHttps(thumbnail);
  const usedFields = fields.filter((f) => f.name.trim() || f.value.trim());
  const halfField = usedFields.some((f) => !f.name.trim() || !f.value.trim());
  const embedTotal =
    title.trim().length +
    message.trim().length +
    (footer.trim() || DEFAULT_FOOTER).length +
    DM_FOOTER_NOTE.length +
    3 +
    author.trim().length +
    usedFields.reduce((n, f) => n + f.name.trim().length + f.value.trim().length, 0);
  const specificReach = pickedGuilds.length + userIds.length;
  const reach = specific
    ? specificReach
    : !targets
      ? null
      : audience === "servers"
        ? targets.servers
        : audience === "users"
          ? targets.users
          : targets.servers + targets.users;
  const specificText = [
    pickedGuilds.length ? `${pickedGuilds.length} server${pickedGuilds.length === 1 ? "" : "s"}` : "",
    userIds.length ? `${userIds.length} player${userIds.length === 1 ? "" : "s"} (DM)` : "",
  ]
    .filter(Boolean)
    .join(" + ");
  const audienceText = specific
    ? specificText || "nobody yet"
    : !targets
      ? "…"
      : audience === "servers"
        ? `${targets.servers} servers`
        : audience === "users"
          ? `${targets.users} players (DM)`
          : `${targets.servers} servers + ${targets.users} players`;

  const problem = embed
    ? !title.trim() && !message.trim() && usedFields.length === 0
      ? "Write a title, a message or add a field."
      : message.trim().length > MESSAGE_MAX
        ? `The message can be at most ${MESSAGE_MAX} characters.`
        : halfField
          ? "Every field needs both a name and a value."
          : embedTotal > EMBED_TOTAL_MAX
            ? `All the text in one embed can be at most ${EMBED_TOTAL_MAX} characters (now ${embedTotal}).`
            : colorValue === null
              ? "Colour must be a 6-digit hex code like #5C8DFF."
              : imageBad
                ? "The image link must start with https://"
                : thumbBad
                  ? "The thumbnail link must start with https://"
                  : null
    : !message.trim()
      ? "Write a message."
      : message.trim().length > PLAIN_MAX
        ? `A plain message can be at most ${PLAIN_MAX} characters.`
        : null;
  const sendProblem =
    problem ??
    (specific && specificReach === 0
      ? "Pick at least one server or paste at least one player ID."
      : specific && userIds.length > MAX_SPECIFIC_USERS
        ? `At most ${MAX_SPECIFIC_USERS} players at a time.`
        : null);
  const sending = Boolean(job?.running);

  function doSend() {
    setConfirming(false);
    void send.run(async () => {
      const body: Record<string, unknown> = embed
        ? {
            mode: "embed",
            title: title.trim(),
            message: message.trim(),
            color: colorValue ?? DEFAULT_COLOR,
            image_url: image.trim(),
            footer: footer.trim(),
            thumbnail_url: thumbnail.trim(),
            author: author.trim(),
            timestamp,
            fields: usedFields.map((f) => ({ name: f.name.trim(), value: f.value.trim(), inline: f.inline })),
            audience,
          }
        : { mode: "plain", message: message.trim(), audience };
      if (specific) {
        body.guild_ids = pickedGuilds;
        body.user_ids = userIds;
      }
      const r = await adminRequest<{ started: boolean }>("/internal/admin/broadcast", body);
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      await loadJob();
      if (!poll.current) poll.current = setInterval(() => void loadJob(), 2500);
      return { ok: true, text: "Started — progress is shown below." };
    });
  }

  function progressLines(j: JobStatus): string[] {
    const lines: string[] = [];
    const showServers =
      j.audience === "servers" || j.audience === "both" || (j.audience === "specific" && (j.servers_requested ?? 0) > 0);
    const showUsers =
      j.audience === "users" || j.audience === "both" || (j.audience === "specific" && (j.users_requested ?? 0) > 0);
    if (showServers)
      lines.push(
        `Servers: ${j.servers_sent ?? 0}/${j.servers_total ?? 0} sent` +
          (j.servers_failed ? ` · ${j.servers_failed} failed` : "") +
          (j.servers_skipped ? ` · ${j.servers_skipped} skipped` : ""),
      );
    if (showUsers) {
      const done = (j.users_sent ?? 0) + (j.users_closed ?? 0) + (j.users_failed ?? 0);
      lines.push(
        `Players (DMs): ${done}/${j.users_total ?? 0} processed · ${j.users_sent ?? 0} delivered` +
          (j.users_closed ? ` · ${j.users_closed} have DMs closed` : "") +
          (j.users_failed ? ` · ${j.users_failed} failed` : "") +
          (j.users_left_out ? ` · ${j.users_left_out} left out (opted out / blacklisted)` : ""),
      );
    }
    if (j.skipped_names?.length)
      lines.push(`Couldn't reach: ${j.skipped_names.join(", ")} (no channel the bot can post embeds in, or blacklisted)`);
    if (j.user_problems?.length) lines.push(...j.user_problems.map((p) => `Player ${p}`));
    if (j.error) lines.push(j.error);
    return lines;
  }

  const segCls = (on: boolean) =>
    `rounded-md border px-4 py-2 font-mono text-[12.5px] transition-colors ${
      on ? "border-azure-bright bg-void text-bone" : "border-line-bright text-bone-dim hover:text-bone"
    }`;
  const over = message.length > messageMax;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Global message"
        blurb="Sends an announcement to every server the bot is in (their spawn channel, or the system channel) and/or as a DM to every player who has used the bot. Pings are always off. Same as /admin globalmessage."
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={segCls(embed)} onClick={() => setMode("embed")}>
              Embed (coloured card)
            </button>
            <button type="button" className={segCls(!embed)} onClick={() => setMode("plain")}>
              Plain message
            </button>
            <select
              className={`${inputCls} ml-auto !w-auto`}
              value=""
              aria-label="Load a template"
              onChange={(e) => {
                if (e.target.value !== "") loadTemplate(Number(e.target.value));
              }}
            >
              <option value="">Load a template…</option>
              {TEMPLATES.map((t, i) => (
                <option key={t.label} value={i}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {embed ? (
            <Field label={`Title (optional) — ${title.length}/${TITLE_MAX}`}>
              <input className={inputCls} value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          ) : null}

          <Field
            label={`Message — ${message.length}/${messageMax}`}
            hint={
              embed
                ? "Select text, then use the buttons (or Ctrl+B / I / U / K). Everything is saved as Discord markdown."
                : "A normal Discord message, no card. Select text, then use the buttons (or Ctrl+B / I / U / K). A pasted image link is previewed by Discord itself."
            }
          >
            <FormatToolbar getEl={() => textRef.current} />
            <textarea
              ref={textRef}
              className={`${inputCls} min-h-[200px] resize-y ${over ? "!border-ember-bright" : ""}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={formatShortcut}
            />
          </Field>

          {embed ? (
            <>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Author line (optional)" hint="Small bold line above the title.">
                  <input className={inputCls} value={author} maxLength={AUTHOR_MAX} onChange={(e) => setAuthor(e.target.value)} />
                </Field>
                <Field label="Thumbnail link (optional)" hint="Small picture top-right. Must start with https://">
                  <input
                    className={inputCls}
                    value={thumbnail}
                    placeholder="https://…"
                    onChange={(e) => setThumbnail(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Image link (optional)" hint="Big picture under the message. Must start with https://">
                <input className={inputCls} value={image} placeholder="https://…" onChange={(e) => setImage(e.target.value)} />
              </Field>

              <div className="grid gap-3 rounded-md border border-line bg-void p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">
                    Fields — {fields.length}/{MAX_FIELDS}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline px-4 py-1.5 text-[12.5px]"
                    disabled={fields.length >= MAX_FIELDS}
                    onClick={addField}
                  >
                    + Add field
                  </button>
                </div>
                {fields.length === 0 ? (
                  <span className="font-mono text-[11.5px] text-bone-faint">
                    Optional name / value blocks under the message — good for dates, rewards or a list of changes.
                  </span>
                ) : null}
                {fields.map((f, i) => (
                  <div key={f.id} className="grid gap-2 rounded-md border border-line bg-void-raised p-3">
                    <input
                      className={inputCls}
                      value={f.name}
                      maxLength={FIELD_NAME_MAX}
                      placeholder={`Field ${i + 1} name`}
                      onChange={(e) => patchField(f.id, { name: e.target.value })}
                    />
                    <textarea
                      className={`${inputCls} min-h-[64px] resize-y`}
                      value={f.value}
                      maxLength={FIELD_VALUE_MAX}
                      placeholder="Value (markdown works)"
                      onChange={(e) => patchField(f.id, { value: e.target.value })}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-bone-dim">
                        <input type="checkbox" checked={f.inline} onChange={(e) => patchField(f.id, { inline: e.target.checked })} />
                        Show side by side with the next field
                      </label>
                      <button
                        type="button"
                        className="font-mono text-[11.5px] text-bone-dim underline"
                        onClick={() => setFields((cur) => cur.filter((x) => x.id !== f.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-bone-dim">
                <input type="checkbox" checked={timestamp} onChange={(e) => setTimestamp(e.target.checked)} />
                Show the time it was sent next to the footer
              </label>
              <span className={`font-mono text-[11.5px] ${embedTotal > EMBED_TOTAL_MAX ? "text-ember-bright" : "text-bone-faint"}`}>
                All text in the embed: {embedTotal}/{EMBED_TOTAL_MAX} (Discord's limit)
              </span>
            </>
          ) : null}

          <Field
            label="Send to"
            hint="Players = everyone who has used the bot (DMs go out about 1 per second, so big lists take a while). People who ran /announcements off or are blacklisted are skipped."
          >
            <select className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
              <option value="servers">Servers{targets ? ` (${targets.servers})` : ""}</option>
              <option value="users">Players — DM{targets ? ` (${targets.users})` : ""}</option>
              <option value="both">Servers + players</option>
              <option value="specific">Specific server(s) / player(s)</option>
            </select>
          </Field>
          {specific ? (
            <div className="grid gap-4 rounded-md border border-line bg-void p-4">
              <Field
                label={`Servers — ${pickedGuilds.length} selected`}
                hint="Goes to each server's spawn channel (or its system channel), same as a normal global message."
              >
                <input
                  className={inputCls}
                  value={guildFilter}
                  placeholder="Search servers…"
                  onChange={(e) => setGuildFilter(e.target.value)}
                />
                <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-line">
                  {!guilds ? (
                    <div className="px-3 py-2 font-mono text-[12px] text-bone-faint">Loading servers…</div>
                  ) : (
                    guilds
                      .filter((g) => g.name.toLowerCase().includes(guildFilter.trim().toLowerCase()) || g.id.includes(guildFilter.trim()))
                      .map((g) => (
                        <label
                          key={g.id}
                          className="flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2 text-[13px] last:border-b-0 hover:bg-void-raised"
                        >
                          <input
                            type="checkbox"
                            checked={pickedGuilds.includes(g.id)}
                            onChange={() => toggleGuild(g.id)}
                          />
                          <span className="min-w-0 flex-1 truncate text-bone">{g.name}</span>
                          <span className="font-mono text-[11px] text-bone-faint">{g.member_count.toLocaleString()} members</span>
                        </label>
                      ))
                  )}
                </div>
                {pickedGuilds.length ? (
                  <button
                    type="button"
                    className="mt-2 font-mono text-[11.5px] text-bone-dim underline"
                    onClick={() => setPickedGuilds([])}
                  >
                    Clear selection
                  </button>
                ) : null}
              </Field>
              <Field
                label={`Players — ${userIds.length} Discord id${userIds.length === 1 ? "" : "s"}`}
                hint="Paste one or more Discord user IDs (spaces, commas or new lines between them). Sent as a DM; this is a direct staff message, so /announcements off is not applied."
              >
                <textarea
                  className={`${inputCls} min-h-[84px] resize-y font-mono text-[13px]`}
                  value={userInput}
                  placeholder="e.g. 920697629787189338"
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    setResolved(null);
                  }}
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline px-4 py-2 text-[13px]"
                    disabled={lookup.busy || userIds.length === 0}
                    onClick={lookUpPlayers}
                  >
                    {lookup.busy ? "Looking up…" : "Look up names"}
                  </button>
                  <Status msg={lookup.msg} />
                </div>
                {resolved ? (
                  <div className="mt-2 grid gap-1 font-mono text-[12px]">
                    {resolved.map((u) => (
                      <div key={u.id} className={u.found && !u.is_bot ? "text-bone-dim" : "text-ember-bright"}>
                        {u.found ? u.name : "No Discord account"} · {u.id}
                        {u.is_bot ? " · is a bot (can't be messaged)" : ""}
                        {u.found && !u.is_bot && !u.is_player ? " · hasn't used the bot yet" : ""}
                        {u.opted_out ? " · opted out of announcements (will still get this DM)" : ""}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Field>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
            {confirming ? (
              <>
                <span className="font-mono text-[12px] text-bone-dim">Send this to {audienceText} right now?</span>
                <button type="button" className="btn btn-fill px-6 py-2.5 text-sm" onClick={doSend}>
                  Yes, send it
                </button>
                <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-fill px-6 py-2.5 text-sm"
                  disabled={send.busy || sending || sendProblem !== null || !reach}
                  onClick={() => setConfirming(true)}
                >
                  {send.busy ? "Starting…" : sending ? "Sending…" : `Send to ${audienceText}`}
                </button>
                <button
                  type="button"
                  className="font-mono text-[12px] text-bone-dim underline"
                  onClick={() => {
                    if (!message.trim() && !title.trim() && fields.length === 0) return clearForm();
                    if (window.confirm("Clear everything you've written?")) clearForm();
                  }}
                >
                  Clear form
                </button>
              </>
            )}
            <Status msg={send.msg} />
          </div>
          {sendProblem ? <span className="font-mono text-[12px] text-ember-bright">{sendProblem}</span> : null}
          {targetError ? <span className="font-mono text-[12px] text-ember-bright">{targetError}</span> : null}
          {job?.started_at ? (
            <div className="rounded-md border border-line bg-void px-3.5 py-3 font-mono text-[12px] leading-relaxed text-bone-dim">
              <div className="mb-1 text-bone">{job.running ? "Sending…" : "Last message finished"}</div>
              {progressLines(job).map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          ) : null}
          {targets && targets.skipped > 0 ? (
            <span className="font-mono text-[11.5px] text-bone-faint">
              {targets.skipped} server(s) can't be reached (no channel the bot can post embeds in, or blacklisted).
            </span>
          ) : null}
        </div>
      </Panel>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Panel title="Preview" blurb="This is how it will look in Discord (desktop, dark theme). Spoilers can be clicked to reveal.">
          <DiscordPreview
            mode={mode}
            title={title}
            message={message}
            color={color}
            image={image}
            thumbnail={thumbnail}
            author={author}
            timestamp={timestamp}
            fields={fields}
            footer={footer}
            dm={audience === "users" || audience === "both"}
          />
        </Panel>
      </div>
    </div>
  );
}
