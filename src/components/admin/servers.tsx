import { useMemo, useState } from "react";
import { adminGuildInvite, type AdminGuild } from "@/lib/admin";
import { failureText, inputCls, type Failure } from "./ui";

function InviteButton({ guildId }: { guildId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function get() {
    setState("loading");
    setNote("");
    try {
      const r = await adminGuildInvite({ data: { guildId } });
      if (r.status === "ok") {
        setUrl(r.data.url);
        setState("idle");
      } else {
        setNote(failureText(r as Failure));
        setState("error");
      }
    } catch {
      setNote("The request failed.");
      setState("error");
    }
  }

  if (url)
    return (
      <div className="flex items-center gap-2 font-mono text-[11.5px]">
        <a href={url} target="_blank" rel="noreferrer" className="text-bone underline">
          {url.replace("https://", "")}
        </a>
        <button
          type="button"
          className="btn btn-outline px-2 py-1 text-[11px]"
          onClick={() => void navigator.clipboard?.writeText(url)}
        >
          Copy
        </button>
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn btn-outline px-3 py-1.5 text-[11.5px]"
        disabled={state === "loading"}
        onClick={() => void get()}
      >
        {state === "loading" ? "…" : "Get invite"}
      </button>
      {note ? <span className="font-mono text-[11px] text-bone-faint">{note}</span> : null}
    </div>
  );
}

export function ServersTab({
  guilds,
  totalMembers,
  error,
  onReload,
  canInvite,
}: {
  guilds: AdminGuild[] | null;
  totalMembers: number;
  error: string | null;
  onReload: () => void;
  canInvite: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (guilds ?? []).filter((g) => !q || g.name.toLowerCase().includes(q) || g.id.includes(q));
  }, [guilds, search]);

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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 font-mono text-[12.5px] text-bone-dim">
        <span>
          In <b className="text-bone">{guilds.length}</b> servers ·{" "}
          <b className="text-bone">{totalMembers.toLocaleString()}</b> members in total
        </span>
        <button type="button" className="btn btn-outline px-4 py-2 text-[12.5px]" onClick={onReload}>
          Refresh
        </button>
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search servers by name or id…"
        className={`${inputCls} mb-5 max-w-sm`}
      />
      <div className="overflow-hidden rounded-md border border-line">
        {filtered.map((g) => (
          <div key={g.id} className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
            {g.icon_url ? (
              <img src={g.icon_url} alt="" className="size-10 shrink-0 rounded-full border border-line" />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-void-raised font-serif text-bone-dim">
                {g.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 basis-40">
              <div className="truncate text-[14.5px] font-bold text-bone">{g.name}</div>
              <div className="font-mono text-[11.5px] text-bone-faint">
                ID {g.id}
                {g.joined_at ? ` · added ${new Date(g.joined_at * 1000).toLocaleDateString()}` : ""}
              </div>
            </div>
            {canInvite ? <InviteButton guildId={g.id} /> : null}
            <div className="text-right font-mono text-[12.5px] text-bone-dim">
              {g.member_count.toLocaleString()} members
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="py-12 text-center font-mono text-[13px] text-bone-faint">No match.</p>
        ) : null}
      </div>
    </>
  );
}
