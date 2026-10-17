import { useMemo, useState } from "react";
import { SearchSelect } from "@/components/search-select";
import { adminRequest, type AdminCharacter, type AdminMeta, type AdminWeapon } from "@/lib/admin";
import { Field, Panel, Status, failureText, inputCls, useAction } from "./ui";

type GiveKind = "kan" | "character" | "weapon" | "drop";

export function GiveTab({
  characters,
  weapons,
  meta,
}: {
  characters: AdminCharacter[];
  weapons: AdminWeapon[];
  meta: AdminMeta | null;
}) {
  const [kind, setKind] = useState<GiveKind>("kan");
  const [userId, setUserId] = useState("");
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("1");
  const [reiatsu, setReiatsu] = useState("random");
  const { busy, msg, run } = useAction();

  const options = useMemo(() => {
    if (kind === "character")
      return characters.map((c) => ({ value: String(c.id), label: c.name, hint: `#${c.id}${c.enabled ? "" : " · disabled"}` }));
    if (kind === "weapon")
      return weapons.map((w) => ({ value: String(w.id), label: w.name, hint: `#${w.id}${w.enabled ? "" : " · disabled"}` }));
    if (kind === "drop") return (meta?.drops ?? []).map((d) => ({ value: d, label: d }));
    return [];
  }, [kind, characters, weapons, meta]);

  function give() {
    void run(async () => {
      const body: Record<string, unknown> = { kind, user_id: userId.trim(), amount };
      if (kind === "character") {
        body.id = target;
        body.reiatsu = reiatsu;
      } else if (kind === "weapon") body.id = target;
      else if (kind === "drop") body.name = target;
      const r = await adminRequest<{ message: string }>("/internal/admin/give", body);
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      return { ok: true, text: r.data.message };
    });
  }

  const needsTarget = kind !== "kan";
  const ready = /^\d{15,21}$/.test(userId.trim()) && Number(amount) >= 1 && (!needsTarget || target);

  return (
    <Panel
      title="Give"
      blurb="Mints KAN, a character, a weapon or a boss drop straight into a player's account — the same as /admin give. Nothing is taken from anyone."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="What to give">
          <select
            className={inputCls}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as GiveKind);
              setTarget("");
            }}
          >
            <option value="kan">KAN coins</option>
            <option value="character">A character</option>
            <option value="weapon">A weapon / zanpakuto</option>
            <option value="drop">A boss-drop item</option>
          </select>
        </Field>
        <Field label="Player's Discord id" hint="Discord → Settings → Advanced → Developer Mode, then right-click them → Copy User ID">
          <input
            className={inputCls}
            inputMode="numeric"
            value={userId}
            placeholder="e.g. 920697629787189338"
            onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        {needsTarget ? (
          <Field label={kind === "character" ? "Character" : kind === "weapon" ? "Weapon" : "Drop item"}>
            <SearchSelect
              options={options}
              value={target}
              onChange={setTarget}
              placeholder="Choose…"
              searchPlaceholder="Search…"
              loading={options.length === 0 && kind !== "drop"}
            />
          </Field>
        ) : null}
        <Field label={kind === "kan" ? "How many KAN" : "How many"}>
          <input className={inputCls} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
        </Field>
        {kind === "character" ? (
          <Field label="Reiatsu copy">
            <select className={inputCls} value={reiatsu} onChange={(e) => setReiatsu(e.target.value)}>
              <option value="random">Random (normal 10% odds)</option>
              <option value="reiatsu">Guaranteed Reiatsu copy</option>
              <option value="plain">Guaranteed plain copy</option>
            </select>
          </Field>
        ) : null}
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <button type="button" className="btn btn-fill px-6 py-2.5 text-sm" disabled={busy || !ready} onClick={give}>
            {busy ? "Giving…" : "Give"}
          </button>
          <Status msg={msg} />
        </div>
      </div>
    </Panel>
  );
}
