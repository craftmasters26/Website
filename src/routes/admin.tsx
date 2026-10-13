import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Rocket, Server, Users } from "lucide-react";
import { NotFound } from "@/components/not-found";
import { CatalogImage } from "@/components/catalog-image";
import { useAdminAccess } from "@/lib/admin-access";
import {
  adminEditCharacter,
  adminListChannels,
  adminListCharacters,
  adminListGuilds,
  adminSpawn,
  type AdminCharacter,
  type AdminChannel,
  type AdminGuild,
  type AdminLevel,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin · BleachDex" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

type Tab = "servers" | "characters";
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // keeps the request under Vercel's ~4.5 MB body limit once base64'd
const PAGE = 40;

type Failure = { status: "forbidden" | "bot-offline" | "error"; message?: string };
function failureText(f: Failure): string {
  if (f.status === "forbidden") return "You're not allowed to do that.";
  if (f.status === "bot-offline") return "The bot can't be reached right now.";
  return f.message ? `The bot said: ${f.message}` : "Something went wrong.";
}

function AdminPage() {
  const access = useAdminAccess();
  const [tab, setTab] = useState<Tab>("servers");
  const [guilds, setGuilds] = useState<AdminGuild[] | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [guildError, setGuildError] = useState<string | null>(null);

  const loadGuilds = useCallback(async () => {
    setGuildError(null);
    try {
      const r = await adminListGuilds();
      if (r.status === "ok") {
        setGuilds(r.data.guilds);
        setTotalMembers(r.data.total_members);
      } else {
        setGuildError(failureText(r));
      }
    } catch {
      setGuildError("The request failed.");
    }
  }, []);

  useEffect(() => {
    if (access.level) void loadGuilds();
  }, [access.level, loadGuilds]);

  if (access.loading) {
    return (
      <main className="page-enter py-24 text-center font-mono text-[13px] text-bone-faint">
        Checking access…
      </main>
    );
  }
  // Looks like any other missing page to everyone who isn't on the bot's admin list.
  if (!access.level) return <NotFound />;

  const level: AdminLevel = access.level;

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <div className="kicker">Admin</div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-[38px] leading-tight">Control panel.</h1>
          <span className="rounded-full border border-line-bright px-3 py-1 font-mono text-[11.5px] text-bone-dim">
            {level === "full" ? "Full admin" : "Limited admin · spawn only"}
          </span>
        </div>

        <div className="mb-8 flex gap-2 border-b border-line">
          {(
            [
              ["servers", "Servers", Server],
              ["characters", "Characters & spawn", Users],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[13.5px] font-semibold",
                tab === value
                  ? "border-azure-bright text-bone"
                  : "border-transparent text-bone-faint hover:text-bone",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {tab === "servers" ? (
          <ServersTab
            guilds={guilds}
            totalMembers={totalMembers}
            error={guildError}
            onReload={() => void loadGuilds()}
          />
        ) : (
          <CharactersTab level={level} guilds={guilds ?? []} />
        )}
      </div>
    </main>
  );
}

// ── Servers ─────────────────────────────────────────────────────────────────────

function ServersTab({
  guilds,
  totalMembers,
  error,
  onReload,
}: {
  guilds: AdminGuild[] | null;
  totalMembers: number;
  error: string | null;
  onReload: () => void;
}) {
  if (error)
    return (
      <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-[14.5px] text-bone-dim">{error}</p>
        <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" onClick={onReload}>
          Try again
        </button>
      </div>
    );
  if (!guilds)
    return <p className="py-16 text-center font-mono text-[13px] text-bone-faint">Loading servers…</p>;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[12.5px] text-bone-dim">
        <span>
          In <b className="text-bone">{guilds.length}</b> servers ·{" "}
          <b className="text-bone">{totalMembers.toLocaleString()}</b> members in total
        </span>
        <button type="button" className="btn btn-outline px-4 py-2 text-[12.5px]" onClick={onReload}>
          Refresh
        </button>
      </div>
      <div className="overflow-hidden rounded-md border border-line">
        {guilds.map((g) => (
          <div
            key={g.id}
            className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0"
          >
            {g.icon_url ? (
              <img src={g.icon_url} alt="" className="size-10 shrink-0 rounded-full border border-line" />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-void-raised font-serif text-bone-dim">
                {g.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-bold text-bone">{g.name}</div>
              <div className="font-mono text-[11.5px] text-bone-faint">
                ID {g.id}
                {g.joined_at ? ` · added ${new Date(g.joined_at * 1000).toLocaleDateString()}` : ""}
              </div>
            </div>
            <div className="text-right font-mono text-[12.5px] text-bone-dim">
              {g.member_count.toLocaleString()} members
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Characters (edit + spawn) ───────────────────────────────────────────────────

function CharactersTab({ level, guilds }: { level: AdminLevel; guilds: AdminGuild[] }) {
  const [rows, setRows] = useState<AdminCharacter[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<{ id: number; mode: "edit" | "spawn" } | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminListCharacters()
      .then((r) => {
        if (cancelled) return;
        if (r.status === "ok") setRows(r.data.characters);
        else setError(failureText(r));
      })
      .catch(() => !cancelled && setError("The request failed."));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter((c) => !q || c.name.toLowerCase().includes(q) || String(c.id) === q);
  }, [rows, search]);

  if (error) return <p className="py-16 text-center text-[14.5px] text-bone-dim">{error}</p>;
  if (!rows)
    return <p className="py-16 text-center font-mono text-[13px] text-bone-faint">Loading characters…</p>;

  return (
    <>
      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setLimit(PAGE);
        }}
        placeholder="Search by name or id…"
        className="mb-5 w-full max-w-sm rounded-md border border-line-bright bg-void-raised px-4 py-2.5 text-[14px] text-bone outline-none focus:border-azure-bright"
      />
      <div className="overflow-hidden rounded-md border border-line">
        {filtered.slice(0, limit).map((c) => {
          const isOpen = open?.id === c.id;
          return (
            <div key={c.id} className="border-b border-line last:border-b-0">
              <div className="flex flex-wrap items-center gap-4 px-4 py-3">
                <CatalogImage
                  src={c.image_path}
                  name={c.name}
                  className="size-12 shrink-0 rounded-md border border-line object-cover object-top"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold text-bone">
                    {c.name}
                    {!c.enabled ? (
                      <span className="ml-2 font-mono text-[10.5px] font-normal text-bone-faint">
                        disabled
                      </span>
                    ) : null}
                  </div>
                  <div className="font-mono text-[11.5px] text-bone-faint">
                    #{c.id} · {c.tier}
                  </div>
                </div>
                <div className="flex gap-2">
                  {level === "full" ? (
                    <button
                      type="button"
                      className="btn btn-outline inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px]"
                      onClick={() => setOpen(isOpen && open?.mode === "edit" ? null : { id: c.id, mode: "edit" })}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" /> Edit
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-azure inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px]"
                    onClick={() => setOpen(isOpen && open?.mode === "spawn" ? null : { id: c.id, mode: "spawn" })}
                  >
                    <Rocket className="size-3.5" aria-hidden="true" /> Spawn
                  </button>
                </div>
              </div>
              {isOpen && open?.mode === "edit" ? (
                <EditPanel
                  character={c}
                  onSaved={(next) => {
                    setRows((all) => (all ?? []).map((x) => (x.id === next.id ? { ...x, ...next } : x)));
                  }}
                />
              ) : null}
              {isOpen && open?.mode === "spawn" ? <SpawnPanel character={c} guilds={guilds} /> : null}
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <p className="py-12 text-center font-mono text-[13px] text-bone-faint">No match.</p>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 font-mono text-[12.5px] text-bone-faint">
        <span>
          {Math.min(limit, filtered.length)} of {filtered.length} shown
        </span>
        {limit < filtered.length ? (
          <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" onClick={() => setLimit((n) => n + PAGE)}>
            Show more
          </button>
        ) : null}
      </div>
    </>
  );
}

const inputCls =
  "w-full rounded-md border border-line-bright bg-void px-3.5 py-2.5 text-[14px] text-bone outline-none focus:border-azure-bright";

function EditPanel({
  character,
  onSaved,
}: {
  character: AdminCharacter;
  onSaved: (next: Pick<AdminCharacter, "id" | "name" | "image_path">) => void;
}) {
  const [name, setName] = useState(character.name);
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const nameChanged = name.trim() !== character.name;
  const hasImage = Boolean(imageUrl.trim() || file);

  function readBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(f);
    });
  }

  async function save() {
    setMsg(null);
    if (file && file.size > MAX_UPLOAD_BYTES) {
      setMsg({ ok: false, text: "That file is over 3 MB. Use a smaller file or paste an image link instead." });
      return;
    }
    setBusy(true);
    try {
      const r = await adminEditCharacter({
        data: {
          id: character.id,
          ...(nameChanged ? { name: name.trim() } : {}),
          ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
          ...(!imageUrl.trim() && file ? { imageBase64: await readBase64(file) } : {}),
        },
      });
      if (r.status === "ok") {
        onSaved({ id: r.data.id, name: r.data.name, image_path: r.data.image_path });
        setMsg({
          ok: true,
          text: "Saved. The bot uses it immediately; the public site list refreshes on its next sync.",
        });
        setImageUrl("");
        setFile(null);
      } else {
        setMsg({ ok: false, text: failureText(r) });
      }
    } catch {
      setMsg({ ok: false, text: "The request failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 border-t border-line bg-void-raised px-4 py-5 md:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">
          Name
        </span>
        <input className={inputCls} value={name} maxLength={64} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid gap-3">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">
            New image link (recommended)
          </span>
          <input
            className={inputCls}
            value={imageUrl}
            placeholder="https://raw.githubusercontent.com/…/Name.png"
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">
            …or upload a file (PNG / JPG / WEBP, max 3 MB)
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="block w-full text-[13px] text-bone-dim file:mr-3 file:rounded-md file:border file:border-line-bright file:bg-void file:px-3 file:py-2 file:text-bone"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={Boolean(imageUrl.trim())}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button
          type="button"
          className="btn btn-fill px-6 py-2.5 text-sm"
          disabled={busy || (!nameChanged && !hasImage)}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        {msg ? (
          <span className={cn("font-mono text-[12px]", msg.ok ? "text-azure-bright" : "text-ember-bright")} role="status">
            {msg.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SpawnPanel({ character, guilds }: { character: AdminCharacter; guilds: AdminGuild[] }) {
  const [guildId, setGuildId] = useState("");
  const [channels, setChannels] = useState<AdminChannel[] | null>(null);
  const [channelId, setChannelId] = useState("");
  const [amount, setAmount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setChannels(null);
    setChannelId("");
    if (!guildId) return;
    let cancelled = false;
    adminListChannels({ data: { guildId } })
      .then((r) => {
        if (cancelled) return;
        if (r.status === "ok") setChannels(r.data.channels);
        else setMsg({ ok: false, text: failureText(r) });
      })
      .catch(() => !cancelled && setMsg({ ok: false, text: "Couldn't load channels." }));
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  async function spawn() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await adminSpawn({ data: { guildId, channelId, characterId: character.id, amount } });
      if (r.status === "ok") {
        setMsg({
          ok: r.data.spawned > 0,
          text: `Spawned ${character.name} ×${r.data.spawned}${r.data.failed ? ` (${r.data.failed} failed)` : ""}.`,
        });
      } else {
        setMsg({ ok: false, text: failureText(r) });
      }
    } catch {
      setMsg({ ok: false, text: "The request failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 border-t border-line bg-void-raised px-4 py-5 md:grid-cols-[1fr_1fr_110px]">
      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">Server</span>
        <select className={inputCls} value={guildId} onChange={(e) => setGuildId(e.target.value)}>
          <option value="">Choose a server…</option>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.member_count.toLocaleString()})
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">Channel</span>
        <select
          className={inputCls}
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          disabled={!guildId || !channels}
        >
          <option value="">{guildId && !channels ? "Loading…" : "Choose a channel…"}</option>
          {(channels ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
              {c.category ? ` · ${c.category}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">Amount</span>
        <input
          type="number"
          min={1}
          max={10}
          className={inputCls}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
        />
      </label>
      <div className="flex flex-wrap items-center gap-4 md:col-span-3">
        <button
          type="button"
          className="btn btn-azure px-6 py-2.5 text-sm"
          disabled={busy || !guildId || !channelId}
          onClick={() => void spawn()}
        >
          {busy ? "Spawning…" : `Spawn ${character.name}`}
        </button>
        {msg ? (
          <span className={cn("font-mono text-[12px]", msg.ok ? "text-azure-bright" : "text-ember-bright")} role="status">
            {msg.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}
