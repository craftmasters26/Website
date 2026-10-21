import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchSelect } from "@/components/search-select";
import {
  adminListChannels,
  adminListRoles,
  adminRequest,
  type AdminChannel,
  type AdminGuild,
  type AdminRole,
} from "@/lib/admin";
import { Field, Panel, Status, failureText, inputCls, useAction } from "./ui";

/**
 * Premium tab: everything /admin premium does in Discord, from the website.
 * setup · schedule · status · giveaway · grant · revoke · link · event · test
 * (bot side: cogs/premium.py + the /internal/admin/premium/* routes in web/site_api.py)
 */

type Named = { id: string; name: string };
type Member = {
  discord_id: string;
  name: string;
  tier: string;
  tier_label: string;
  sub_key: string;
  manual: boolean;
  started_at: number;
};
type PremiumStatus = {
  guild_id: string;
  guild_name: string;
  settings: {
    shareholder_role_id: Named;
    enjoyer_role_id: Named;
    boss_channel_id: Named;
    boss_alert_role_id: Named;
    party_channel_id: Named;
  };
  boss_weekday: number;
  party_weekday: number;
  weekdays: string[];
  tiers: { value: string; label: string }[];
  open_events: string[];
  webhook_secret_set: boolean;
  shareholders_total: number;
  party_cards: number;
  members: Member[];
};
type GiveawayResult = {
  average: number;
  tiers: { tier: string; label: string; divisor: number; bonus: number; total: number; members: Named[] }[];
};
type ActionResult = { message?: string };

const SNOWFLAKE = /^\d{15,21}$/;

export function PremiumTab({ guilds }: { guilds: AdminGuild[] | null }) {
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminRequest<PremiumStatus>("/internal/admin/premium/status");
      if (r.status === "ok") setStatus(r.data);
      else setError(failureText(r));
    } catch {
      setError("The request failed.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!status) {
    return (
      <div className="font-mono text-[13px] text-bone-faint">
        {error ? <span className="text-ember-bright">{error}</span> : "Loading Premium…"}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-6 lg:self-start">
        <StatusPanel status={status} onReload={load} error={error} />
        <MembersPanel status={status} onChanged={load} />
      </div>
      <div className="grid gap-6 lg:self-start">
        <SetupPanel status={status} guilds={guilds} onSaved={load} />
        <SchedulePanel status={status} onSaved={load} />
        <MemberToolsPanel status={status} onChanged={load} />
        <EventsPanel status={status} onChanged={load} />
        <GiveawayPanel />
        <TestPanel />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- status

function StatusPanel({
  status,
  onReload,
  error,
}: {
  status: PremiumStatus;
  onReload: () => Promise<void>;
  error: string | null;
}) {
  const s = status.settings;
  const row = (label: string, v: Named) => (
    <div className="flex justify-between gap-4">
      <span className="text-bone-faint">{label}</span>
      <span className={v.id && !v.name ? "text-ember-bright" : "text-bone"}>
        {v.name || (v.id ? `${v.id} (not found in this server)` : "—")}
      </span>
    </div>
  );
  const shareholders = status.members.filter((m) => m.tier === status.tiers[0]?.value).length;
  return (
    <Panel title="Status" blurb="Same as /admin premium status.">
      <div className="grid gap-1.5 font-mono text-[12.5px]">
        <div className="flex justify-between gap-4">
          <span className="text-bone-faint">Server</span>
          <span className="text-bone">{status.guild_name || "— (run Setup)"}</span>
        </div>
        {row("Shareholder role", s.shareholder_role_id)}
        {row("Enjoyer role", s.enjoyer_role_id)}
        {row("Boss channel", s.boss_channel_id)}
        {row("Boss alert role", s.boss_alert_role_id)}
        {row("Party channel", s.party_channel_id)}
        <div className="flex justify-between gap-4">
          <span className="text-bone-faint">Boss day · Party day</span>
          <span className="text-bone">
            {status.weekdays[status.boss_weekday]} · {status.weekdays[status.party_weekday]}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-bone-faint">Active members (linked)</span>
          <span className="text-bone">
            {status.members.length} ({shareholders} Shareholders, {status.members.length - shareholders} Enjoyers)
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-bone-faint">Shareholders counted for parties</span>
          <span className="text-bone">
            {status.shareholders_total} → {status.party_cards} cards / party day
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-bone-faint">Open event cards</span>
          <span className="text-bone">{status.open_events.join(", ") || "none"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-bone-faint">Whop webhook secret</span>
          <span className={status.webhook_secret_set ? "text-bone" : "text-ember-bright"}>
            {status.webhook_secret_set ? "set" : "NOT SET — set WHOP_WEBHOOK_SECRET on the bot"}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button type="button" className="btn btn-outline px-4 py-2 text-[13px]" onClick={() => void onReload()}>
          Refresh
        </button>
        {error ? <span className="font-mono text-[12px] text-ember-bright">{error}</span> : null}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- members list

function MembersPanel({ status, onChanged }: { status: PremiumStatus; onChanged: () => Promise<void> }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const { busy, msg, run } = useAction();

  function revoke(id: string) {
    setConfirm(null);
    void run(async () => {
      const r = await adminRequest<ActionResult>("/internal/admin/premium/revoke", { user_id: id });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      await onChanged();
      return { ok: true, text: r.data.message ?? "Done." };
    });
  }

  return (
    <Panel title="Members" blurb="Active memberships linked to a Discord account.">
      {status.members.length === 0 ? (
        <div className="font-mono text-[12.5px] text-bone-faint">Nobody has claimed a membership yet.</div>
      ) : (
        <div className="grid max-h-[420px] gap-1 overflow-y-auto">
          {status.members.map((m) => (
            <div
              key={m.sub_key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-void px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-[13.5px] text-bone">{m.name}</div>
                <div className="font-mono text-[11px] text-bone-faint">
                  {m.tier_label} · {m.manual ? "manual" : "Whop"} · since {new Date(m.started_at * 1000).toLocaleDateString()} · {m.discord_id}
                </div>
              </div>
              {confirm === m.sub_key ? (
                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-fill px-3 py-1.5 text-[12px]" disabled={busy} onClick={() => revoke(m.discord_id)}>
                    Yes, end it
                  </button>
                  <button type="button" className="btn btn-outline px-3 py-1.5 text-[12px]" onClick={() => setConfirm(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-outline px-3 py-1.5 text-[12px]" onClick={() => setConfirm(m.sub_key)}>
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-3">
        <Status msg={msg} />
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- setup

function SetupPanel({
  status,
  guilds,
  onSaved,
}: {
  status: PremiumStatus;
  guilds: AdminGuild[] | null;
  onSaved: () => Promise<void>;
}) {
  const [guildId, setGuildId] = useState(status.guild_id);
  const [roles, setRoles] = useState<AdminRole[] | null>(null);
  const [channels, setChannels] = useState<AdminChannel[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pick, setPick] = useState({
    shareholder_role_id: "",
    enjoyer_role_id: "",
    boss_alert_role_id: "",
    boss_channel_id: "",
    party_channel_id: "",
  });
  const { busy, msg, run } = useAction();

  useEffect(() => {
    if (!guildId) return;
    let alive = true;
    setRoles(null);
    setChannels(null);
    setLoadError(null);
    void (async () => {
      try {
        const [r, c] = await Promise.all([adminListRoles({ data: { guildId } }), adminListChannels({ data: { guildId } })]);
        if (!alive) return;
        if (r.status === "ok") setRoles(r.data.roles);
        else setLoadError(failureText(r));
        if (c.status === "ok") setChannels(c.data.channels);
        else setLoadError(failureText(c));
      } catch {
        if (alive) setLoadError("The request failed.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [guildId]);

  const guildOptions = useMemo(
    () => (guilds ?? []).map((g) => ({ value: g.id, label: g.name, hint: `${g.member_count.toLocaleString()} members` })),
    [guilds],
  );
  const roleOptions = useMemo(() => (roles ?? []).map((r) => ({ value: r.id, label: r.name, hint: r.id })), [roles]);
  const channelOptions = useMemo(
    () => (channels ?? []).map((c) => ({ value: c.id, label: `#${c.name}`, hint: c.category || undefined })),
    [channels],
  );

  const sameGuild = guildId === status.guild_id;
  const current = (v: Named) => (sameGuild && v.name ? `Current: ${v.name}` : "Not changed unless you pick one");
  const s = status.settings;
  const set = (key: keyof typeof pick) => (v: string) => setPick((p) => ({ ...p, [key]: v }));

  function save() {
    void run(async () => {
      const r = await adminRequest<ActionResult>("/internal/admin/premium/setup", { guild_id: guildId, ...pick });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setPick({ shareholder_role_id: "", enjoyer_role_id: "", boss_alert_role_id: "", boss_channel_id: "", party_channel_id: "" });
      await onSaved();
      return { ok: true, text: r.data.message ?? "Saved." };
    });
  }

  const ready = SNOWFLAKE.test(guildId);
  return (
    <Panel title="Setup" blurb="Same as /admin premium setup. Pick the server, then only the roles and channels you want to change.">
      <div className="grid gap-4">
        <Field label="Server" hint="The server where the member roles and the exclusive channels live.">
          <SearchSelect
            options={guildOptions}
            value={guildId}
            onChange={(v) => {
              setGuildId(v);
              setPick({ shareholder_role_id: "", enjoyer_role_id: "", boss_alert_role_id: "", boss_channel_id: "", party_channel_id: "" });
            }}
            placeholder="Choose a server…"
            searchPlaceholder="Search servers…"
            loading={guilds === null}
          />
        </Field>
        {loadError ? <span className="font-mono text-[12px] text-ember-bright">{loadError}</span> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shareholder role" hint={current(s.shareholder_role_id)}>
            <SearchSelect options={roleOptions} value={pick.shareholder_role_id} onChange={set("shareholder_role_id")} placeholder="Keep current" loading={ready && roles === null} disabled={!ready} />
          </Field>
          <Field label="Enjoyer role" hint={current(s.enjoyer_role_id)}>
            <SearchSelect options={roleOptions} value={pick.enjoyer_role_id} onChange={set("enjoyer_role_id")} placeholder="Keep current" loading={ready && roles === null} disabled={!ready} />
          </Field>
          <Field label="Boss channel" hint={current(s.boss_channel_id)}>
            <SearchSelect options={channelOptions} value={pick.boss_channel_id} onChange={set("boss_channel_id")} placeholder="Keep current" loading={ready && channels === null} disabled={!ready} />
          </Field>
          <Field label="Boss alert role (pinged)" hint={current(s.boss_alert_role_id)}>
            <SearchSelect options={roleOptions} value={pick.boss_alert_role_id} onChange={set("boss_alert_role_id")} placeholder="Keep current" loading={ready && roles === null} disabled={!ready} />
          </Field>
          <Field label="Party / shareholder channel" hint={current(s.party_channel_id)} className="sm:col-span-2">
            <SearchSelect options={channelOptions} value={pick.party_channel_id} onChange={set("party_channel_id")} placeholder="Keep current" loading={ready && channels === null} disabled={!ready} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-fill px-6 py-2.5 text-sm" disabled={busy || !ready} onClick={save}>
            {busy ? "Saving…" : "Save setup"}
          </button>
          <Status msg={msg} />
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- schedule

function SchedulePanel({ status, onSaved }: { status: PremiumStatus; onSaved: () => Promise<void> }) {
  const [boss, setBoss] = useState(String(status.boss_weekday));
  const [party, setParty] = useState(String(status.party_weekday));
  const { busy, msg, run } = useAction();

  useEffect(() => {
    setBoss(String(status.boss_weekday));
    setParty(String(status.party_weekday));
  }, [status.boss_weekday, status.party_weekday]);

  function save() {
    void run(async () => {
      const r = await adminRequest<ActionResult>("/internal/admin/premium/schedule", {
        boss_day: Number(boss),
        party_day: Number(party),
      });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      await onSaved();
      return { ok: true, text: r.data.message ?? "Saved." };
    });
  }

  return (
    <Panel title="Schedule" blurb="Same as /admin premium schedule. Days are GMT+8, like the hourly bosses.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Boss day (a boss every 15 min)">
          <select className={inputCls} value={boss} onChange={(e) => setBoss(e.target.value)}>
            {status.weekdays.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Spawn party day">
          <select className={inputCls} value={party} onChange={(e) => setParty(e.target.value)}>
            {status.weekdays.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="button" className="btn btn-fill px-6 py-2.5 text-sm" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save schedule"}
          </button>
          <Status msg={msg} />
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- grant / revoke / link

function MemberToolsPanel({ status, onChanged }: { status: PremiumStatus; onChanged: () => Promise<void> }) {
  const [userId, setUserId] = useState("");
  const [tier, setTier] = useState(status.tiers[0]?.value ?? "");
  const [subKey, setSubKey] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const grant = useAction();
  const revoke = useAction();
  const link = useAction();
  const idOk = SNOWFLAKE.test(userId.trim());

  function call(a: ReturnType<typeof useAction>, path: string, body: Record<string, unknown>) {
    void a.run(async () => {
      const r = await adminRequest<ActionResult>(path, body);
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      await onChanged();
      return { ok: true, text: r.data.message ?? "Done." };
    });
  }

  return (
    <Panel
      title="Grant · revoke · link"
      blurb="Same as /admin premium grant, revoke and link. Roles are updated in Discord straight away."
    >
      <div className="grid gap-4">
        <Field label="Member's Discord id" hint="Discord → Settings → Advanced → Developer Mode, then right-click them → Copy User ID">
          <input
            className={inputCls}
            inputMode="numeric"
            value={userId}
            placeholder="e.g. 920697629787189338"
            onChange={(e) => {
              setUserId(e.target.value.replace(/\D/g, ""));
              setConfirmRevoke(false);
            }}
          />
        </Field>

        <div className="grid gap-3 border-t border-line pt-4">
          <Field label="Grant a membership (no Whop payment)">
            <select className={inputCls} value={tier} onChange={(e) => setTier(e.target.value)}>
              {status.tiers.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="btn btn-fill px-5 py-2.5 text-sm"
              disabled={grant.busy || !idOk || !tier}
              onClick={() => call(grant, "/internal/admin/premium/grant", { user_id: userId.trim(), tier })}
            >
              {grant.busy ? "Granting…" : "Grant"}
            </button>
            <Status msg={grant.msg} />
          </div>
        </div>

        <div className="grid gap-3 border-t border-line pt-4">
          <Field label="Link a Whop purchase to this member" hint="Whop membership id (mem_…), payment id (pay_…) or the checkout email.">
            <input className={inputCls} value={subKey} placeholder="mem_… / pay_… / email" onChange={(e) => setSubKey(e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="btn btn-outline px-5 py-2.5 text-sm"
              disabled={link.busy || !idOk || !subKey.trim()}
              onClick={() => call(link, "/internal/admin/premium/link", { user_id: userId.trim(), sub_key: subKey.trim() })}
            >
              {link.busy ? "Linking…" : "Link purchase"}
            </button>
            <Status msg={link.msg} />
          </div>
        </div>

        <div className="grid gap-3 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-4">
            {confirmRevoke ? (
              <>
                <span className="font-mono text-[12px] text-bone-dim">End every active membership of this account?</span>
                <button
                  type="button"
                  className="btn btn-fill px-5 py-2.5 text-sm"
                  disabled={revoke.busy}
                  onClick={() => {
                    setConfirmRevoke(false);
                    call(revoke, "/internal/admin/premium/revoke", { user_id: userId.trim() });
                  }}
                >
                  Yes, revoke
                </button>
                <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" onClick={() => setConfirmRevoke(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" disabled={revoke.busy || !idOk} onClick={() => setConfirmRevoke(true)}>
                {revoke.busy ? "Revoking…" : "Revoke membership"}
              </button>
            )}
            <Status msg={revoke.msg} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- event cards

function EventsPanel({ status, onChanged }: { status: PremiumStatus; onChanged: () => Promise<void> }) {
  const [event, setEvent] = useState("");
  const { busy, msg, run } = useAction();

  function set(name: string, open: boolean) {
    void run(async () => {
      const r = await adminRequest<ActionResult>("/internal/admin/premium/event", { event: name, open });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setEvent("");
      await onChanged();
      return { ok: true, text: r.data.message ?? "Saved." };
    });
  }

  return (
    <Panel
      title="Event cards"
      blurb="Same as /admin premium event. Event cards can't be picked with /redeem card unless their event is open here."
    >
      <div className="grid gap-4">
        <Field label="Event name (as on the cards)">
          <input className={inputCls} value={event} placeholder="e.g. halloween" maxLength={40} onChange={(e) => setEvent(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-fill px-5 py-2.5 text-sm" disabled={busy || !event.trim()} onClick={() => set(event, true)}>
            Open event
          </button>
          <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" disabled={busy || !event.trim()} onClick={() => set(event, false)}>
            Close event
          </button>
          <Status msg={msg} />
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
          <span className="text-bone-faint">Open now:</span>
          {status.open_events.length === 0 ? <span className="text-bone-dim">none</span> : null}
          {status.open_events.map((name) => (
            <button
              key={name}
              type="button"
              title="Click to close this event"
              className="rounded-full border border-line-bright px-3 py-1 text-bone-dim hover:text-bone"
              disabled={busy}
              onClick={() => set(name, false)}
            >
              {name} ✕
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- giveaway calculator

function GiveawayPanel() {
  const [average, setAverage] = useState("100");
  const [result, setResult] = useState<GiveawayResult | null>(null);
  const { busy, msg, run } = useAction();
  const valid = average.trim() !== "" && Number.isFinite(Number(average)) && Number(average) >= 0;

  function calculate() {
    void run(async () => {
      const r = await adminRequest<GiveawayResult>("/internal/admin/premium/giveaway", { average: Number(average) });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setResult(r.data);
      return null;
    });
  }

  return (
    <Panel title="Giveaway entries" blurb="Same as /admin premium giveaway: extra entries = average entries ÷ the tier's divisor.">
      <div className="grid gap-4">
        <Field label="Average entries for the period">
          <input className={inputCls} inputMode="decimal" value={average} onChange={(e) => setAverage(e.target.value.replace(/[^\d.]/g, ""))} />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-fill px-5 py-2.5 text-sm" disabled={busy || !valid} onClick={calculate}>
            {busy ? "Working…" : "Calculate"}
          </button>
          <Status msg={msg} />
        </div>
        {result ? (
          <div className="grid gap-3 font-mono text-[12.5px] text-bone-dim">
            {result.tiers.map((t) => (
              <div key={t.tier} className="rounded-md border border-line bg-void px-3.5 py-3">
                <div className="text-bone">
                  {t.label}: +{t.bonus} extra (+1 free = {t.total} total) · ÷ {t.divisor}
                </div>
                <div className="mt-1 text-bone-faint">
                  {t.members.length ? t.members.map((m) => m.name).join(", ") : "nobody yet"}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- test

function TestPanel() {
  const boss = useAction();
  const party = useAction();

  function go(a: ReturnType<typeof useAction>, what: "boss" | "party") {
    void a.run(async () => {
      const r = await adminRequest<ActionResult>("/internal/admin/premium/test", { what });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      return { ok: true, text: r.data.message ?? "Done." };
    });
  }

  return (
    <Panel title="Test" blurb="Same as /admin premium test. Runs one premium boss or one spawn party right now, in the channels from Setup.">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" disabled={boss.busy} onClick={() => go(boss, "boss")}>
            {boss.busy ? "Posting…" : "Post a boss now"}
          </button>
          <Status msg={boss.msg} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-outline px-5 py-2.5 text-sm" disabled={party.busy} onClick={() => go(party, "party")}>
            {party.busy ? "Starting…" : "Start a spawn party (1 of 4)"}
          </button>
          <Status msg={party.msg} />
        </div>
      </div>
    </Panel>
  );
}
