import { useCallback, useEffect, useState } from "react";
import { adminRequest, type BlacklistEntry } from "@/lib/admin";
import { Field, Panel, Status, failureText, inputCls, useAction } from "./ui";

function until(e: BlacklistEntry): string {
  return e.expires_at ? `until ${new Date(e.expires_at * 1000).toLocaleString()}` : "permanent";
}

export function BlacklistTab() {
  const [entries, setEntries] = useState<BlacklistEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<"user" | "guild">("user");
  const [target, setTarget] = useState("");
  const [duration, setDuration] = useState("7d");
  const [reason, setReason] = useState("");
  const add = useAction();
  const lift = useAction();

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminRequest<{ entries: BlacklistEntry[] }>("/internal/admin/blacklist");
      if (r.status === "ok") setEntries(r.data.entries);
      else setError(failureText(r));
    } catch {
      setError("The request failed.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function submit() {
    void add.run(async () => {
      const r = await adminRequest<{ ok: boolean }>("/internal/admin/blacklist", {
        kind,
        target: target.trim(),
        duration: duration.trim(),
        reason: reason.trim(),
      });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setTarget("");
      setReason("");
      void load();
      return { ok: true, text: "Blacklisted." };
    });
  }

  function remove(e: BlacklistEntry) {
    void lift.run(async () => {
      const r = await adminRequest<{ removed: boolean }>("/internal/admin/blacklist/remove", {
        kind: e.kind,
        target: e.target_id,
      });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      void load();
      return { ok: true, text: `Lifted the ban on ${e.label}.` };
    });
  }

  return (
    <div className="grid gap-6">
      <Panel
        title="Blacklist"
        blurb="Bans a player or a whole server from the bot (every command, button and spawn) — the same as /admin blacklist. Bans with a time limit end by themselves."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ban a">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as "user" | "guild")}>
              <option value="user">User</option>
              <option value="guild">Server</option>
            </select>
          </Field>
          <Field label={kind === "user" ? "User id" : "Server id"}>
            <input
              className={inputCls}
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="For how long" hint="30m, 12h, 7d, 2w, 1d12h … or permanent">
            <input className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </Field>
          <Field label="Reason (shown to them, optional)">
            <input className={inputCls} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center gap-4 md:col-span-2">
            <button
              type="button"
              className="btn btn-fill px-6 py-2.5 text-sm"
              disabled={add.busy || !/^\d{15,21}$/.test(target) || !duration.trim()}
              onClick={submit}
            >
              {add.busy ? "Banning…" : "Blacklist"}
            </button>
            <Status msg={add.msg} />
          </div>
        </div>
      </Panel>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-[20px] text-bone">Active bans</h3>
          <div className="flex items-center gap-3">
            <Status msg={lift.msg} />
            <button type="button" className="btn btn-outline px-4 py-2 text-[12.5px]" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </div>
        {error ? (
          <p className="py-8 text-center text-[14px] text-bone-dim">{error}</p>
        ) : !entries ? (
          <p className="py-8 text-center font-mono text-[13px] text-bone-faint">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="rounded-md border border-line py-8 text-center font-mono text-[13px] text-bone-faint">
            Nobody is blacklisted.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-line">
            {entries.map((e) => (
              <div key={`${e.kind}:${e.target_id}`} className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1 basis-48">
                  <div className="truncate text-[14.5px] font-bold text-bone">
                    {e.label}{" "}
                    <span className="font-mono text-[10.5px] font-normal uppercase text-bone-faint">{e.kind}</span>
                  </div>
                  <div className="font-mono text-[11.5px] text-bone-faint">
                    ID {e.target_id} · {until(e)}
                    {e.reason ? ` · ${e.reason}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline px-3.5 py-2 text-[12.5px]"
                  disabled={lift.busy}
                  onClick={() => remove(e)}
                >
                  Lift ban
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
