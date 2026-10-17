import { useEffect, useMemo, useState } from "react";
import { Rocket } from "lucide-react";
import { SearchSelect } from "@/components/search-select";
import {
  adminListChannels,
  adminRequest,
  type AdminChannel,
  type AdminGuild,
  type AdminMeta,
} from "@/lib/admin";
import { Field, Panel, Status, failureText, inputCls, useAction } from "./ui";

export type SpawnTarget =
  | { kind: "character"; id: number; label: string }
  | { kind: "weapon"; id: number; label: string }
  | { kind: "random"; label: string; factions: { label: string; value: string }[] }
  | { kind: "boss"; label: string; bosses: AdminMeta["bosses"]; factions: { label: string; value: string }[] };

/** Server + channel pickers (both searchable) shared by every spawn form. */
export function useChannelPicker(guilds: AdminGuild[]) {
  const [guildId, setGuildId] = useState("");
  const [channels, setChannels] = useState<AdminChannel[] | null>(null);
  const [channelId, setChannelId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setChannels(null);
    setChannelId("");
    setError(null);
    if (!guildId) return;
    let cancelled = false;
    adminListChannels({ data: { guildId } })
      .then((r) => {
        if (cancelled) return;
        if (r.status === "ok") setChannels(r.data.channels);
        else setError(failureText(r));
      })
      .catch(() => !cancelled && setError("Couldn't load channels."));
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const guildOptions = useMemo(
    () => guilds.map((g) => ({ value: g.id, label: g.name, hint: `${g.member_count.toLocaleString()} members` })),
    [guilds],
  );
  const channelOptions = useMemo(
    () => (channels ?? []).map((c) => ({ value: c.id, label: `#${c.name}`, hint: c.category || undefined })),
    [channels],
  );
  return { guildId, setGuildId, channelId, setChannelId, channels, error, guildOptions, channelOptions };
}

export function SpawnForm({ target, guilds }: { target: SpawnTarget; guilds: AdminGuild[] }) {
  const picker = useChannelPicker(guilds);
  const [amount, setAmount] = useState(1);
  const [faction, setFaction] = useState("");
  const [boss, setBoss] = useState("");
  const { busy, msg, setMsg, run } = useAction();
  const maxAmount = target.kind === "boss" ? 20 : 10;

  const bossOptions = useMemo(
    () =>
      target.kind === "boss"
        ? target.bosses
            .filter((b) => b.enabled)
            .map((b) => ({ value: b.name, label: b.name, hint: b.category }))
        : [],
    [target],
  );

  function submit() {
    void run(async () => {
      const base = { guild_id: picker.guildId, channel_id: picker.channelId, amount };
      let path = "/internal/admin/spawn";
      let body: Record<string, unknown>;
      if (target.kind === "character") body = { ...base, character_id: target.id };
      else if (target.kind === "weapon") body = { ...base, weapon_id: target.id };
      else if (target.kind === "random") body = { ...base, random: true, ...(faction ? { faction } : {}) };
      else {
        path = "/internal/admin/bossbattle";
        body = { ...base, ...(boss ? { boss } : faction ? { faction } : {}) };
      }
      const r = await adminRequest<{ spawned: number; failed: number; name: string }>(path, body);
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      return {
        ok: r.data.spawned > 0,
        text: `Spawned ${r.data.name} ×${r.data.spawned}${r.data.failed ? ` (${r.data.failed} failed)` : ""}.`,
      };
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr_110px]">
      <Field label="Server">
        <SearchSelect
          options={picker.guildOptions}
          value={picker.guildId}
          onChange={(v) => {
            picker.setGuildId(v);
            setMsg(null);
          }}
          placeholder="Choose a server…"
          searchPlaceholder="Search servers…"
        />
      </Field>
      <Field label="Channel">
        <SearchSelect
          options={picker.channelOptions}
          value={picker.channelId}
          onChange={picker.setChannelId}
          placeholder="Choose a channel…"
          searchPlaceholder="Search channels…"
          disabled={!picker.guildId || !picker.channels}
          loading={Boolean(picker.guildId) && !picker.channels && !picker.error}
          emptyText="The bot can't post in any channel here."
        />
      </Field>
      <Field label="Amount">
        <input
          type="number"
          min={1}
          max={maxAmount}
          className={inputCls}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Math.min(maxAmount, Number(e.target.value) || 1)))}
        />
      </Field>
      {target.kind === "boss" ? (
        <Field label="Boss (leave empty for a random boss)" className="md:col-span-2">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <SearchSelect
                options={bossOptions}
                value={boss}
                onChange={setBoss}
                placeholder="Random boss"
                searchPlaceholder="Search bosses…"
              />
            </div>
            {boss ? (
              <button type="button" className="btn btn-outline px-3 text-[12px]" onClick={() => setBoss("")}>
                Clear
              </button>
            ) : null}
          </div>
        </Field>
      ) : null}
      {target.kind === "random" || (target.kind === "boss" && !boss) ? (
        <Field label="Only from faction (optional)" className={target.kind === "boss" ? "" : "md:col-span-2"}>
          <select className={inputCls} value={faction} onChange={(e) => setFaction(e.target.value)}>
            <option value="">Any faction</option>
            {target.factions.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <div className="flex flex-wrap items-center gap-4 md:col-span-3">
        <button
          type="button"
          className="btn btn-azure inline-flex items-center gap-1.5 px-6 py-2.5 text-sm"
          disabled={busy || !picker.guildId || !picker.channelId}
          onClick={submit}
        >
          <Rocket className="size-4" aria-hidden="true" />
          {busy ? "Spawning…" : `Spawn ${target.label}`}
        </button>
        <Status msg={msg ?? (picker.error ? { ok: false, text: picker.error } : null)} />
      </div>
    </div>
  );
}

export function SpawnsTab({ guilds, meta }: { guilds: AdminGuild[]; meta: AdminMeta | null }) {
  return (
    <div className="grid gap-6">
      <Panel
        title="Random spawn"
        blurb="Posts a catchable soul in the channel you pick — the same as /admin spawn with no name. Pick a faction to only spawn that group."
      >
        <SpawnForm
          guilds={guilds}
          target={{ kind: "random", label: "random soul", factions: meta?.card_factions ?? [] }}
        />
      </Panel>
      <Panel
        title="Boss battle"
        blurb="Posts a boss fight in the channel you pick — the same as /admin bossbattle."
      >
        <SpawnForm
          guilds={guilds}
          target={{ kind: "boss", label: "boss", bosses: meta?.bosses ?? [], factions: meta?.boss_factions ?? [] }}
        />
      </Panel>
      <p className="font-mono text-[12px] text-bone-faint">
        To spawn one specific character or weapon, press Spawn on its row in the Characters or Weapons tab.
      </p>
    </div>
  );
}
