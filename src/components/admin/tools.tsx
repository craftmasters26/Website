import { useMemo, useState } from "react";
import { SearchSelect } from "@/components/search-select";
import { adminRequest, type AdminCharacter, type AdminMeta, type AdminWeapon } from "@/lib/admin";
import {
  emptyImage,
  Field,
  hasImage,
  ImageInput,
  imageBody,
  inputCls,
  Panel,
  readBase64,
  Status,
  tooBig,
  useAction,
  failureText,
  MAX_UPLOAD_BYTES,
  type ImageValue,
} from "./ui";

const SEEDS: { task: string; label: string; blurb: string }[] = [
  { task: "roster", label: "Seed roster", blurb: "Adds/updates every character and weapon from the built-in roster." },
  { task: "bosses", label: "Seed bosses", blurb: "Adds/updates the boss battle bosses." },
  { task: "halloween", label: "Seed Halloween", blurb: "Halloween bosses + characters." },
  { task: "craftables", label: "Seed craftables", blurb: "The craftable characters and their recipes." },
  { task: "forge", label: "Seed forge", blurb: "The forge recipes." },
  { task: "emojis", label: "Seed emojis", blurb: "Matches uploaded Developer Portal emoji to characters/weapons." },
  { task: "resync", label: "Resync owned copies", blurb: "Pushes edited stats down to copies players already own." },
];

function SeedButton({ task, label, blurb }: { task: string; label: string; blurb: string }) {
  const { busy, msg, run } = useAction();
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-void-raised p-4">
      <div className="text-[14.5px] font-bold text-bone">{label}</div>
      <p className="text-[12.5px] text-bone-dim">{blurb}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          className="btn btn-outline px-4 py-2 text-[12.5px]"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const r = await adminRequest<{ message: string }>(`/internal/admin/seed/${task}`, {});
              return r.status === "ok" ? { ok: true, text: r.data.message } : { ok: false, text: failureText(r) };
            })
          }
        >
          {busy ? "Running…" : "Run"}
        </button>
      </div>
      <Status msg={msg} />
    </div>
  );
}

function TemplatePanel({ meta }: { meta: AdminMeta | null }) {
  const [scope, setScope] = useState("global");
  const [file, setFile] = useState<File | null>(null);
  const { busy, msg, run } = useAction();
  return (
    <Panel
      title="Card templates"
      blurb="The background every card is drawn on. 'Everything' is the fallback; a faction template covers that faction's characters and weapons that have no template of their own."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Applies to">
          <select className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="global">Everything (global template)</option>
            {(meta?.card_factions ?? []).map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Template image (PNG / JPG / WEBP, max 3 MB)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-[13px] text-bone-dim file:mr-3 file:rounded-md file:border file:border-line-bright file:bg-void file:px-3 file:py-2 file:text-bone"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <button
            type="button"
            className="btn btn-fill px-6 py-2.5 text-sm"
            disabled={busy || !file}
            onClick={() =>
              void run(async () => {
                if (!file) return { ok: false, text: "Pick a file." };
                if (file.size > MAX_UPLOAD_BYTES) return { ok: false, text: "That file is over 3 MB." };
                const r = await adminRequest<{ message: string }>("/internal/admin/template", {
                  scope,
                  template_base64: await readBase64(file),
                });
                return r.status === "ok" ? { ok: true, text: r.data.message } : { ok: false, text: failureText(r) };
              })
            }
          >
            {busy ? "Uploading…" : "Upload template"}
          </button>
          <Status msg={msg} />
        </div>
      </div>
    </Panel>
  );
}

function EmojiPanel({ characters, weapons }: { characters: AdminCharacter[]; weapons: AdminWeapon[] }) {
  const [mode, setMode] = useState<"item" | "custom">("item");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [emojiId, setEmojiId] = useState("");
  const { busy, msg, run } = useAction();
  const options = useMemo(
    () => [
      ...characters.map((c) => ({ value: c.name, label: c.name, hint: "character" })),
      ...weapons.map((w) => ({ value: w.name, label: w.name, hint: "weapon" })),
    ],
    [characters, weapons],
  );
  return (
    <Panel
      title="Emoji"
      blurb="Sets the emoji shown next to a character / weapon, or a custom one like 'kan' or 'boss_drop:soul_shard'. Use the emoji's numeric ID (Developer Portal, or Copy Emoji ID)."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Set emoji for">
          <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as "item" | "custom")}>
            <option value="item">A character or weapon</option>
            <option value="custom">A custom key</option>
          </select>
        </Field>
        {mode === "item" ? (
          <Field label="Character / weapon">
            <SearchSelect options={options} value={name} onChange={setName} placeholder="Choose…" searchPlaceholder="Search…" />
          </Field>
        ) : (
          <Field label="Key">
            <input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} placeholder="kan" />
          </Field>
        )}
        <Field label="Emoji ID">
          <input className={inputCls} inputMode="numeric" value={emojiId} onChange={(e) => setEmojiId(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <button
            type="button"
            className="btn btn-fill px-6 py-2.5 text-sm"
            disabled={busy || !emojiId || (mode === "item" ? !name : !key.trim())}
            onClick={() =>
              void run(async () => {
                const r = await adminRequest<{ message: string }>("/internal/admin/emoji", {
                  emoji_id: emojiId,
                  ...(mode === "item" ? { name } : { key: key.trim() }),
                });
                return r.status === "ok" ? { ok: true, text: r.data.message } : { ok: false, text: failureText(r) };
              })
            }
          >
            {busy ? "Saving…" : "Save emoji"}
          </button>
          <Status msg={msg} />
        </div>
      </div>
    </Panel>
  );
}

function CraftablePanel({ meta }: { meta: AdminMeta | null }) {
  const [name, setName] = useState("");
  const [hp, setHp] = useState("");
  const [damage, setDamage] = useState("");
  const [drop, setDrop] = useState("");
  const [qty, setQty] = useState("1");
  const [art, setArt] = useState<ImageValue>(emptyImage);
  const { busy, msg, run } = useAction();
  const options = (meta?.drops ?? []).map((d) => ({ value: d, label: d }));
  return (
    <Panel
      title="New craftable character"
      blurb="A character players can only get by crafting (never from packs or spawns) — the same as /admin craftable add."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <input className={inputCls} value={name} maxLength={64} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="HP">
            <input className={inputCls} inputMode="numeric" value={hp} onChange={(e) => setHp(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Damage">
            <input className={inputCls} inputMode="numeric" value={damage} onChange={(e) => setDamage(e.target.value.replace(/\D/g, ""))} />
          </Field>
        </div>
        <Field label="Boss drop it costs">
          <SearchSelect options={options} value={drop} onChange={setDrop} placeholder="Choose a drop…" searchPlaceholder="Search drops…" />
        </Field>
        <Field label="How many of that drop">
          <input className={inputCls} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <div className="md:col-span-2">
          <ImageInput label="Artwork" value={art} onChange={setArt} optional={false} />
        </div>
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <button
            type="button"
            className="btn btn-fill px-6 py-2.5 text-sm"
            disabled={busy || !name.trim() || !hp || !damage || !drop || !qty || !hasImage(art)}
            onClick={() =>
              void run(async () => {
                if (tooBig(art)) return { ok: false, text: "That file is over 3 MB." };
                const r = await adminRequest<{ message: string }>("/internal/admin/craftable", {
                  name: name.trim(),
                  hp,
                  damage,
                  required_drop_name: drop,
                  required_drop_qty: qty,
                  ...(await imageBody(art, "image_url", "image_base64")),
                });
                if (r.status !== "ok") return { ok: false, text: failureText(r) };
                setName("");
                setArt(emptyImage);
                return { ok: true, text: r.data.message };
              })
            }
          >
            {busy ? "Creating…" : "Create craftable"}
          </button>
          <Status msg={msg} />
        </div>
      </div>
    </Panel>
  );
}

function AchievementIconPanel({ meta }: { meta: AdminMeta | null }) {
  const [key, setKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { busy, msg, run } = useAction();
  const options = (meta?.achievements ?? []).map((a) => ({ value: a.key, label: a.name, hint: a.key }));
  return (
    <Panel title="Achievement icon" blurb="The thumbnail shown next to an achievement in /achievements.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Achievement">
          <SearchSelect options={options} value={key} onChange={setKey} placeholder="Choose…" searchPlaceholder="Search achievements…" />
        </Field>
        <Field label="Icon image (PNG / JPG / WEBP, max 3 MB)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="block w-full text-[13px] text-bone-dim file:mr-3 file:rounded-md file:border file:border-line-bright file:bg-void file:px-3 file:py-2 file:text-bone"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <button
            type="button"
            className="btn btn-fill px-6 py-2.5 text-sm"
            disabled={busy || !key || !file}
            onClick={() =>
              void run(async () => {
                if (!file) return { ok: false, text: "Pick a file." };
                if (file.size > MAX_UPLOAD_BYTES) return { ok: false, text: "That file is over 3 MB." };
                const r = await adminRequest<{ message: string }>("/internal/admin/achievement-icon", {
                  key,
                  image_base64: await readBase64(file),
                });
                return r.status === "ok" ? { ok: true, text: r.data.message } : { ok: false, text: failureText(r) };
              })
            }
          >
            {busy ? "Saving…" : "Save icon"}
          </button>
          <Status msg={msg} />
        </div>
      </div>
    </Panel>
  );
}

export function ToolsTab({
  characters,
  weapons,
  meta,
}: {
  characters: AdminCharacter[];
  weapons: AdminWeapon[];
  meta: AdminMeta | null;
}) {
  return (
    <div className="grid gap-6">
      <section>
        <h3 className="font-serif text-[20px] text-bone">Seed & sync</h3>
        <p className="mt-1 mb-4 text-[13px] text-bone-dim">
          The same buttons as /admin seed … and /admin resync. All of them are safe to re-run.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEEDS.map((s) => (
            <SeedButton key={s.task} {...s} />
          ))}
        </div>
      </section>
      <TemplatePanel meta={meta} />
      <EmojiPanel characters={characters} weapons={weapons} />
      <CraftablePanel meta={meta} />
      <AchievementIconPanel meta={meta} />
    </div>
  );
}
