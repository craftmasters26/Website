import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { EyeOff, Pencil, Plus, Rocket, Undo2 } from "lucide-react";
import { CatalogImage } from "@/components/catalog-image";
import {
  adminRequest,
  type AdminCharacter,
  type AdminGuild,
  type AdminLevel,
  type AdminMeta,
  type AdminWeapon,
} from "@/lib/admin";
import { cn } from "@/lib/utils";
import { SpawnForm } from "./spawns";
import {
  emptyImage,
  Field,
  hasImage,
  ImageInput,
  readBase64,
  imageBody,
  inputCls,
  Status,
  tooBig,
  useAction,
  failureText,
  type ImageValue,
} from "./ui";

type Kind = "character" | "weapon";
type Item = AdminCharacter | AdminWeapon;
const PAGE = 40;

const isChar = (kind: Kind, _i: Item): _i is AdminCharacter => kind === "character";

export function CatalogTab({
  kind,
  level,
  rows,
  setRows,
  guilds,
  meta,
  error,
}: {
  kind: Kind;
  level: AdminLevel;
  rows: Item[] | null;
  setRows: Dispatch<SetStateAction<Item[] | null>>;
  guilds: AdminGuild[];
  meta: AdminMeta | null;
  error: string | null;
}) {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<{ id: number; mode: "edit" | "spawn" } | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noun = kind === "character" ? "character" : "weapon";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter((c) => !q || c.name.toLowerCase().includes(q) || String(c.id) === q);
  }, [rows, search]);

  if (error && !rows) return <p className="py-16 text-center text-[14.5px] text-bone-dim">{error}</p>;
  if (!rows)
    return <p className="py-16 text-center font-mono text-[13px] text-bone-faint">Loading {noun}s…</p>;

  const full = level === "full";

  async function setEnabled(item: Item, enabled: boolean) {
    if (!enabled && !window.confirm(`Remove ${item.name}? It stops appearing in packs and spawns (anyone who owns it keeps it). You can restore it later.`))
      return;
    const r = await adminRequest<{ enabled: boolean }>(`/internal/admin/${kind}/${item.id}/enabled`, { enabled });
    if (r.status === "ok") {
      setRows((all) => (all ?? []).map((x) => (x.id === item.id ? { ...x, enabled } : x)));
      setNotice(`${item.name} ${enabled ? "restored" : "removed"}.`);
    } else {
      setNotice(failureText(r));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search by name or id…"
          className="w-full max-w-sm rounded-md border border-line-bright bg-void-raised px-4 py-2.5 text-[14px] text-bone outline-none focus:border-azure-bright"
        />
        {full ? (
          <button
            type="button"
            className="btn btn-fill inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px]"
            onClick={() => setAdding((v) => !v)}
          >
            <Plus className="size-4" aria-hidden="true" /> Add {noun}
          </button>
        ) : null}
        {notice ? <span className="font-mono text-[12px] text-bone-dim">{notice}</span> : null}
      </div>

      {adding && full ? (
        <AddPanel
          kind={kind}
          meta={meta}
          onAdded={(item) => {
            setRows((all) => [item, ...(all ?? [])]);
            setNotice(`Added ${item.name}.`);
            setAdding(false);
          }}
        />
      ) : null}

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
                <div className="min-w-0 flex-1 basis-40">
                  <div className={cn("truncate text-[14.5px] font-bold", c.enabled ? "text-bone" : "text-bone-faint")}>
                    {c.name}
                    {!c.enabled ? (
                      <span className="ml-2 font-mono text-[10.5px] font-normal text-bone-faint">disabled</span>
                    ) : null}
                  </div>
                  <div className="font-mono text-[11.5px] text-bone-faint">
                    #{c.id} · {c.tier}
                    {isChar(kind, c)
                      ? ` · HP ${c.hp} · ATK ${c.attack}`
                      : ` · +${(c as AdminWeapon).boost_percent}% ${(c as AdminWeapon).boost_type}`}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {full ? (
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
                  {full ? (
                    <button
                      type="button"
                      className="btn btn-outline inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px]"
                      onClick={() => void setEnabled(c, !c.enabled)}
                    >
                      {c.enabled ? (
                        <>
                          <EyeOff className="size-3.5" aria-hidden="true" /> Remove
                        </>
                      ) : (
                        <>
                          <Undo2 className="size-3.5" aria-hidden="true" /> Restore
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
              {isOpen && open?.mode === "edit" ? (
                <EditPanel
                  kind={kind}
                  item={c}
                  onSaved={(next) => setRows((all) => (all ?? []).map((x) => (x.id === next.id ? next : x)))}
                />
              ) : null}
              {isOpen && open?.mode === "spawn" ? (
                <div className="border-t border-line bg-void-raised px-4 py-5">
                  <SpawnForm target={{ kind, id: c.id, label: c.name }} guilds={guilds} />
                </div>
              ) : null}
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

// ── Edit ────────────────────────────────────────────────────────────────────────

function EditPanel({ kind, item, onSaved }: { kind: Kind; item: Item; onSaved: (next: Item) => void }) {
  const c = kind === "character" ? (item as AdminCharacter) : null;
  const w = kind === "weapon" ? (item as AdminWeapon) : null;
  const [name, setName] = useState(item.name);
  const [hp, setHp] = useState(String(c?.hp ?? ""));
  const [attack, setAttack] = useState(String(c?.attack ?? ""));
  const [boostType, setBoostType] = useState<"damage" | "hp">(w?.boost_type ?? "damage");
  const [boostPercent, setBoostPercent] = useState(String(w?.boost_percent ?? ""));
  const [abName, setAbName] = useState(item.ability_name);
  const [abDesc, setAbDesc] = useState(item.ability_description);
  const [art, setArt] = useState<ImageValue>(emptyImage);
  const [cardArt, setCardArt] = useState<ImageValue>(emptyImage);
  const [template, setTemplate] = useState<File | null>(null);
  const { busy, msg, setMsg, run } = useAction();

  function save() {
    void run(async () => {
      if (tooBig(art) || tooBig(cardArt) || (template && template.size > 3 * 1024 * 1024))
        return { ok: false, text: "A file is over 3 MB. Use a smaller file or paste an image link instead." };
      const body: Record<string, unknown> = {};
      if (name.trim() !== item.name) body.name = name.trim();
      if (abName !== item.ability_name) body.ability_name = abName;
      if (abDesc !== item.ability_description) body.ability_description = abDesc;
      if (c) {
        if (hp !== String(c.hp)) body.hp = hp;
        if (attack !== String(c.attack)) body.attack = attack;
      }
      if (w) {
        if (boostType !== w.boost_type) body.boost_type = boostType;
        if (boostPercent !== String(w.boost_percent)) body.boost_percent = boostPercent;
      }
      Object.assign(body, await imageBody(art, "image_url", "image_base64"));
      Object.assign(body, await imageBody(cardArt, "card_image_url", "card_image_base64"));
      if (template) {
        body.template_base64 = await readBase64(template);
      }
      if (Object.keys(body).length === 0) return { ok: false, text: "Nothing changed." };
      const r = await adminRequest<{ character?: AdminCharacter; weapon?: AdminWeapon; resynced: number }>(
        `/internal/admin/${kind}/${item.id}`,
        body,
      );
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      const next = (r.data.character ?? r.data.weapon) as Item;
      onSaved(next);
      setArt(emptyImage);
      setCardArt(emptyImage);
      setTemplate(null);
      return {
        ok: true,
        text: `Saved.${r.data.resynced ? ` Updated ${r.data.resynced} owned copies too.` : ""} The bot uses it immediately; the public site list refreshes on its next sync.`,
      };
    });
  }

  const dirty =
    name.trim() !== item.name ||
    abName !== item.ability_name ||
    abDesc !== item.ability_description ||
    (c ? hp !== String(c.hp) || attack !== String(c.attack) : false) ||
    (w ? boostType !== w.boost_type || boostPercent !== String(w.boost_percent) : false) ||
    hasImage(art) ||
    hasImage(cardArt) ||
    Boolean(template);

  return (
    <div className="grid gap-4 border-t border-line bg-void-raised px-4 py-5 md:grid-cols-2">
      <Field label="Name">
        <input className={inputCls} value={name} maxLength={64} onChange={(e) => setName(e.target.value)} />
      </Field>
      {c ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="HP">
            <input className={inputCls} inputMode="numeric" value={hp} onChange={(e) => setHp(e.target.value)} />
          </Field>
          <Field label="Attack">
            <input className={inputCls} inputMode="numeric" value={attack} onChange={(e) => setAttack(e.target.value)} />
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boosts">
            <select className={inputCls} value={boostType} onChange={(e) => setBoostType(e.target.value as "damage" | "hp")}>
              <option value="damage">Damage</option>
              <option value="hp">HP</option>
            </select>
          </Field>
          <Field label="Boost %">
            <input className={inputCls} inputMode="numeric" value={boostPercent} onChange={(e) => setBoostPercent(e.target.value)} />
          </Field>
        </div>
      )}
      <Field label="Ability name">
        <input className={inputCls} value={abName} maxLength={64} onChange={(e) => setAbName(e.target.value)} />
      </Field>
      <Field label="Ability description">
        <input className={inputCls} value={abDesc} maxLength={400} onChange={(e) => setAbDesc(e.target.value)} />
      </Field>
      <ImageInput label="New spawn image" value={art} onChange={setArt} optional={false} />
      <ImageInput label="New card artwork (card only)" value={cardArt} onChange={setCardArt} />
      <Field label="Card background just for this one (PNG / JPG / WEBP, max 3 MB)" className="md:col-span-2">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="block w-full text-[13px] text-bone-dim file:mr-3 file:rounded-md file:border file:border-line-bright file:bg-void file:px-3 file:py-2 file:text-bone"
          onChange={(e) => setTemplate(e.target.files?.[0] ?? null)}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button type="button" className="btn btn-fill px-6 py-2.5 text-sm" disabled={busy || !dirty} onClick={save}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <Status msg={msg} />
        {msg ? (
          <button type="button" className="font-mono text-[11px] text-bone-faint underline" onClick={() => setMsg(null)}>
            dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Add ─────────────────────────────────────────────────────────────────────────

function AddPanel({ kind, meta, onAdded }: { kind: Kind; meta: AdminMeta | null; onAdded: (item: Item) => void }) {
  const tiers = (kind === "character" ? meta?.character_tiers : meta?.weapon_tiers) ?? ["common"];
  const [name, setName] = useState("");
  const [tier, setTier] = useState("common");
  const [hp, setHp] = useState("1");
  const [attack, setAttack] = useState("1");
  const [boostType, setBoostType] = useState<"damage" | "hp">("damage");
  const [boostPercent, setBoostPercent] = useState("0");
  const [abName, setAbName] = useState("");
  const [abDesc, setAbDesc] = useState("");
  const [art, setArt] = useState<ImageValue>(emptyImage);
  const { busy, msg, run } = useAction();

  function add() {
    void run(async () => {
      if (!name.trim()) return { ok: false, text: "Give it a name." };
      if (!hasImage(art)) return { ok: false, text: "Add an image link or upload an image." };
      if (tooBig(art)) return { ok: false, text: "That file is over 3 MB. Use a smaller file or paste an image link." };
      const body: Record<string, unknown> = {
        name: name.trim(),
        tier,
        ability_name: abName,
        ability_description: abDesc,
        ...(kind === "character" ? { hp, attack } : { boost_type: boostType, boost_percent: boostPercent }),
        ...(await imageBody(art, "image_url", "image_base64")),
      };
      const r = await adminRequest<{ character?: AdminCharacter; weapon?: AdminWeapon }>(`/internal/admin/${kind}`, body);
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      onAdded((r.data.character ?? r.data.weapon) as Item);
      return { ok: true, text: "Added." };
    });
  }

  return (
    <div className="mb-6 grid gap-4 rounded-md border border-line bg-void-raised p-5 md:grid-cols-2">
      <h3 className="font-serif text-[20px] text-bone md:col-span-2">Add a new {kind}</h3>
      <Field label="Name">
        <input className={inputCls} value={name} maxLength={64} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Tier">
        <select className={inputCls} value={tier} onChange={(e) => setTier(e.target.value)}>
          {tiers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      {kind === "character" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="HP">
            <input className={inputCls} inputMode="numeric" value={hp} onChange={(e) => setHp(e.target.value)} />
          </Field>
          <Field label="Attack">
            <input className={inputCls} inputMode="numeric" value={attack} onChange={(e) => setAttack(e.target.value)} />
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boosts">
            <select className={inputCls} value={boostType} onChange={(e) => setBoostType(e.target.value as "damage" | "hp")}>
              <option value="damage">Damage</option>
              <option value="hp">HP</option>
            </select>
          </Field>
          <Field label="Boost %">
            <input className={inputCls} inputMode="numeric" value={boostPercent} onChange={(e) => setBoostPercent(e.target.value)} />
          </Field>
        </div>
      )}
      <Field label="Ability name (optional)">
        <input className={inputCls} value={abName} maxLength={64} onChange={(e) => setAbName(e.target.value)} />
      </Field>
      <Field label="Ability description (optional)">
        <input className={inputCls} value={abDesc} maxLength={400} onChange={(e) => setAbDesc(e.target.value)} />
      </Field>
      <div className="md:col-span-2">
        <ImageInput label="Image" value={art} onChange={setArt} optional={false} />
      </div>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button type="button" className="btn btn-fill px-6 py-2.5 text-sm" disabled={busy} onClick={add}>
          {busy ? "Adding…" : `Add ${kind}`}
        </button>
        <Status msg={msg} />
      </div>
    </div>
  );
}
