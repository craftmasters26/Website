import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin";
import { failureText, Panel, Status, useAction, inputCls } from "./ui";

/**
 * Maintenance tab - big one-off clean-ups that run INSIDE the bot, so no database access is needed.
 *   1. Roster purge: paste a list, preview what it would remove, tick/untick, confirm.
 *   2. Reverse crafts: give back what every crafted character / forged weapon was made from.
 *   3. Craft / Forge on-off switches.
 */

// The roster list sent with the request. Edit it in the box - nothing is stored on the site.
const DEFAULT_LIST: string[] = ["Soul King (Prime)", "Yhwach (True Soul King / God Form)", "Yhwach (Soul King Absorbed)", "Yhwach (The Almighty Awakened)", "Yhwach (The Almighty Version)", "Yhwach", "Ichigo Kurosaki (Horn of Salvation / True Bankai)", "Ichigo (Dangai / Mugetsu)", "Ichigo Kurosaki (True Bankai / Tenjiro Training Arc)", "Ichigo (True Shikai / Dual Blades)", "Sosuke Aizen (Final Fusion)", "Sosuke Aizen (TYBW: The Agony Version)", "Sosuke Aizen (Monster)", "Sosuke Aizen (Butterfly)", "Sosuke Aizen (Chrysalis)", "Sosuke Aizen (First Fusion)", "Sosuke Aizen (Post-Reveal)", "Sosuke Aizen (SAFWY Version)", "Sosuke Aizen", "Genryusai Shigekuni Yamamoto (TYBW - West/North Version)", "Genryusai Shigekuni Yamamoto (TYBW - East/South Version)", "Yamamoto (Bankai)", "Genryusai Shigekuni Yamamoto (SAFWY Version)", "Genryusai Shigekuni Yamamoto", "Jugram Haschwalth (Almighty)", "Jugram Haschwalth", "Uryu (Schrift A)", "Uryu (Vollständig)", "Uryu (Letzt Stil)", "Lille Barro (Jilliel)", "Lille Barro", "Gerard (Aschetonig)", "Gerard Valkyrie", "Pernida (Vollständig)", "Pernida Parnkgjas", "Askin (Hasshein)", "Askin Nakk Le Vaar", "Kenpachi (Bankai)", "Kenpachi Zaraki (SAFWY Version)", "Kenpachi Zaraki", "Soya Azashiro", "Kisuke (Bankai)", "Kuruyashiki Kenpachi", "Kisuke Urahara (SAFWY Version)", "Shunsui (Bankai)", "Kisuke Urahara", "Coyote Starrk (Hogyoku Merged)", "Shunsui Kyoraku (SAFWY Version)", "Toshiro (Bankai) [Adult Form]", "Shunsui Kyoraku", "Toshiro Hitsugaya (SAFWY Version)", "Toshiro Hitsugaya", "Byakuya (Bankai)", "Baraggan (Hogyoku Merged)", "Byakuya Kuchiki (SAFWY Version)", "Byakuya Kuchiki", "Tier Harribel (Hogyoku Merged)", "Coyote Starrk (CFYOW Version)", "Retsu Unohana (Bankai)", "Coyote Starrk (Los Lobos)", "Ulquiorra (Hogyoku Merged)", "Retsu Unohana (SAFWY Version)", "Coyote Starrk", "Ichigo (Vasto Lorde / Full Hollow)", "Retsu Unohana", "Ichigo (Fullbring)", "Yoruichi Shihoin (SAFWY Version)", "Hollow Ichigo", "Tenjiro Kirinji", "Ichigo (Hollow Mask / Visored)", "Kirio Hikifune", "Grimmjow (Hogyoku Merged)", "Ichigo (Bankai)", "Oetsu Nimaiya", "Ichigo (Shikai)", "Senjumaru Shutara", "Tier Halibel (CFYOW Version)", "Ichigo (Substitute Shinigami)", "Ichibei Hyosube", "Tier Harribel (Tiburon)", "Ichigo Kurosaki", "Shinji (Bankai)", "Tier Harribel", "Ichigo Kurosaki (Dream Team Version)", "Shinji (Hollow Mask)", "Shinji Hirako (SAFWY Version)", "Ulquiorra Cifer (CFYOW Alternate Form)", "Shinji", "Ulquiorra (Resurreccion: Murcielago)", "Ulquiorra Cifer (Beyond Resurrección)", "Ulquiorra Cifer", "Grimmjow Jaegerjaquez (CFYOW Version)", "Grimmjow (Pantera)", "Barragan Louisenbairn (CFYOW Version)", "Kitkat King (Grimmjow Alternate/Special Form)", "Baraggan (Arrogante)", "grimmjow", "Baraggan Louisenbairn", "Renji (Soo Zabimaru)", "Renji (Bankai)", "Renji", "Rukia (Hakka no Togame)", "Rukia (Bankai)", "Nelliel (Gamuza)", "Rukia Kuchiki", "Nelliel Tu Odelschwanck (CFYOW Version)", "Nelliel Tu Odelschwanck (Adult)", "Nelliel Tu Odelschwanck", "Nnoitra (Hogyoku Merged)", "Nnoitra Gilga (CFYOW Version)", "Nnoitra (Santa Teresa)", "Nnoitra Gilga", "Yammy (Hogyoku Merged)", "Yammy Llargo (Beyond Resurrección)", "Yammy Llargo (CFYOW Version)", "Yammy (Ira)", "Yammy Llargo", "Szayelaporro (Hogyoku Merged)", "Szayelaporro Granz (CFYOW Version)", "Szayelaporro (Fornicaras)", "Mayuri (Bankai)", "Szayelaporro Granz", "Mayuri Kurotsuchi (SAFWY Version)", "Zommari (Hogyoku Merged)", "Mayuri Kurotsuchi", "Zommari Rureaux (Beyond Resurrección)", "Jushiro Ukitake (SAFWY Version)", "Zommari Rureaux (CFYOW Version)", "Ukitake (Bankai)", "Zommari (Brujeria)", "Aaroniero (Hogyoku Merged)", "Aaroniero Arruruerie (CFYOW Version)", "Aaroniero Arruruerie (Beyond Resurrección)", "Kaname Tosen (SAFWY Version)", "Aaroniero (Glotoneria)", "Tosen (Bankai)", "Aaroniero Arruruerie", "Kaname Tosen", "Luppi Antenor (CFYOW Version)", "Luppi Antenor", "Bazz-B (Vollständig)", "Bazz-B", "Bambietta (Zofiel)", "Bambietta Basterbine", "Äs Nödt (Tatarforas)", "As Nödt", "Quilge Opie (Biskiel)", "Quilge Opie (Vollständig)", "Quilge Opie", "Mask De Masculine (Vollständig)", "Mask De Masculine", "Candice (Barbarriel)", "Candice Catnipp", "Liltotto (Vollständig)", "Liltotto Lamperd", "Giselle (Azhalbiora)", "Giselle Gewelle", "Meninas (Vollständig)", "Meninas McAllon", "Gin (Bankai)", "Robert Accutrone (Grimaniel)", "Gin Ichimaru (SAFWY Version)", "Robert Accutrone", "Gin Dictator", "Gin Ichimaru", "Orihime Inoue", "Sajin Komamura (SAFWY Version)", "Komamura (Bankai)", "Sajin Komamura", "Kensei (Bankai)", "Kensei (Hollow Mask)", "Kensei Muguruma", "Rose (Bankai)", "Rose (Hollow Mask)", "Isshin Kurosaki", "Rose Otoribashi", "Love (Hollow Mask)", "Love Aikawa", "Lisa (Hollow Mask)", "Lisa Yadomaru", "Soi Fon (Bankai)", "Hiyori (Hollow Mask)", "Soi Fon", "Hiyori Sarugaki", "Hisagi (Kazeshini)", "Mashiro (Hollow Mask)", "Shuhei Hisagi", "Mashiro Kuna", "Izuru (Wabisuke)", "Hachi (Hollow Mask)", "Izuru Kira", "Hachigen Ushoda", "Nemu (Poison Body)", "Ginjo (Armor Form / Bankai)", "Nemu Kurotsuchi", "Ginjo (Fullbring: Cross of Scaffold)", "Nanao (Kido)", "Kugo Ginjo", "Nanao Ise", "Shukuro Tsukishima", "Ikkaku (Bankai)", "Ikkaku Madarame", "Yachiru (Sanpo Kenju)", "Rangiku (Haineko)", "Rangiku Matsumoto", "Momo (Tobiume)", "Momo Hinamori", "Isane (Itegumo)", "Isane Kotetsu", "Iba (Zanpakuto)", "Ryuken Ishida", "Ninny Spangcole", "Noel Niihashi", "Bruno Bangnyfe", "Macy Baljure", "Ikomikidomoe", "Aura Michibane", "Roka Paramia", "Ciel / Arturo Plateado", "Ashido Kano", "Baishin", "Shusuke Amagai", "Kageroza Inaba", "Oko Yushima / Ouko Yushima", "Kokuto", "Dark Rukia", "Ganryu", "Shuren", "Senna", "Sojiro Kusaka", "Ayon", "Dalk", "NaNaNa Najahkoop", "BG9", "Cang Du", "Asguiaro Ebern", "Luders Friegen", "Shaz Domino", "Driscoll Berci", "Berenice Gabrielli", "Nianzol Weizol", "Choe Neng Poww", "Abirama Redder", "Findorr Calius", "Charlotte Chuhlhourne", "Gantenbainne Mosqueda", "Dordoni Alessandro Del Socaccio", "Cirucci Sanderwicci", "Kon", "Edrad Liones", "emilou apacci", "Francesca Mila Rose", "Cyan Sun-Sun", "Shawlong Koufang", "Di Roy Rinker", "Karin Kurosaki", "Demoura Zodd", "Yuzu Kurosaki", "Aisslinger Werrarr", "Don Kanonji", "Aldegor", "Keigo Asano", "Algora Lallau", "Mizuiro Kojima", "Ggio Vega", "Tatsuki Arisawa", "Rudbornn Chelute", "Dondochakka Birtanne", "Pesche Guatiche", "Kukkapuro", "Chojiro Sasakibe", "Genshiro Okikiba", "Marechiyo Omaeda", "Sentaro Kotsubaki", "Kiyone Kotetsu", "Hanataro Yamada", "Akon", "Rin Tsubokura", "Hidetomo Kajomaru", "Ryunosuke Yuki", "Shintaro", "Hachigo Nemuri", "Chika Shihoin", "Furofushi Saito", "Batsu'unsai Katori", "Chigiri Shijima", "Lilynette Gingerbuck", "Danjiro Obana", "Furuoki Otogawa", "Nobutsuna Shigyo", "Saizo Sakahone", "Masaki Kurosaki", "Entetsu Kumoi", "Sojun Kuchiki", "Ginrei Kuchiki", "Kaien Shiba", "Miyako Shiba", "Ganju Shiba", "Kukaku Shiba", "Ichika Abarai", "Kazui Kurosaki", "Michiru Ogawa", "Chizuru Honsho", "Jinta Hanakari", "Ururu Tsumugiya", "Tessai Tsukabishi", "Ikumi Unagiya", "Balgo Parks", "Riruka Dokugamine", "Moe Shishigawara", "Giriko Kutsuzawa", "Jackie Tristan", "Yukio Hans Vorarlberna", "Atsushi / Mabashi", "Yoshi / Koga", "Go Koga", "Jin Kariya", "Ran'Tao", "Nozomi Kujo", "Ryusei Kenzaki", "Kenryu", "Rurichiyo Kasumioji", "Seigen Suzunami", "Matsuri Kudo", "Fujimaru Kudo", "Ashisogi Jizo", "Hozukimaru", "Gonryomaru", "Haineko", "Kazeshini", "Muramasa", "Soqyo no Kotawari", "Suzumebachi", "Yuri'iro Kujaku", "Tenken / Wabisuke / Tobiume", "Ririn", "Kurudo", "Noba", "Raku", "Mr. Pork", "Bonnie", "Bawabawa", "Hooleer", "Metastacia", "Numb Chandelier", "Fishbone D", "Shrieker", "Grand Fisher", "Demi-Hollow", "Runuganga", "Ho", "Ban", "Bau", "Genga", "Garogai", "Taikun", "Oobuta", "Picaro", "Mimihagi", "Cuerno", "Gegetsuburi", "Aoga", "Gitano Shigeo", "Jai", "James", "Johann Seydlitz", "Kenpachi Kiganjo", "Kenpachi Pirate", "Kuzuryu", "Lumina and Verona", "Makizo Aramaki", "Makoto Kibune", "Medazeppi", "Menis", "Menoly Mallia", "Mue", "Narunosuke", "Nikita Deslock", "Nirgge Parduoc", "Ohana", "Oko Yushima", "Okyo", "Oscar Joaquin de la Rosa", "Ouko Yushima", "Riyan", "Ryuzaburo", "Shizuku", "Tatsufusa Enjoji"];

type Candidate = {
  id: number;
  name: string;
  tier: string;
  enabled: boolean;
  group: "normal" | "craftable" | "event";
  copies: number;
  owners: number;
  default_checked: boolean;
  matched_by: string;
};
type RosterPreview = {
  mode: "keep" | "delete";
  list_count: number;
  matched_entries: number;
  kept_in_bot: number;
  candidates: Candidate[];
  not_in_bot: string[];
  total_copies: number;
  aborted: string;
};
type Count = { name: string; count: number };
type CraftReport = {
  players: number;
  crafted_total: number;
  forged_total: number;
  crafted_characters: Count[];
  forged_weapons: Count[];
  refund_drops: Count[];
  refund_weapons: Count[];
  refund_characters: Count[];
  unresolved: Count[];
  applied: boolean;
};
type Features = Record<string, { label: string; enabled: boolean }>;

export function MaintenanceTab() {
  return (
    <div className="grid gap-6">
      <FeaturesPanel />
      <ReversePanel />
      <RosterPanel />
    </div>
  );
}

// ── craft / forge switches ───────────────────────────────────────────────────────

function FeaturesPanel() {
  const [features, setFeatures] = useState<Features | null>(null);
  const { busy, msg, run } = useAction();

  useEffect(() => {
    void adminRequest<{ features: Features }>("/internal/admin/features", {}).then((r) => {
      if (r.status === "ok") setFeatures(r.data.features);
    });
  }, []);

  function toggle(name: string, enabled: boolean) {
    void run(async () => {
      const r = await adminRequest<{ features: Features }>("/internal/admin/features", { name, enabled });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setFeatures(r.data.features);
      return { ok: true, text: `${r.data.features[name]?.label} is now ${enabled ? "ON" : "OFF"}.` };
    });
  }

  return (
    <Panel title="Craft & Forge" blurb="Switch the two commands on or off. Both are OFF by default.">
      {!features ? (
        <p className="font-mono text-[12px] text-bone-faint">Loading…</p>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          {Object.entries(features).map(([name, f]) => (
            <button
              key={name}
              type="button"
              disabled={busy}
              onClick={() => toggle(name, !f.enabled)}
              className={`btn ${f.enabled ? "btn-fill" : "btn-outline"} px-5 py-2.5 text-[13px]`}
            >
              {f.label}: {f.enabled ? "ON (click to turn off)" : "OFF (click to turn on)"}
            </button>
          ))}
          <Status msg={msg} />
        </div>
      )}
    </Panel>
  );
}

// ── reverse crafts ───────────────────────────────────────────────────────────────

function CountList({ title, rows }: { title: string; rows: Count[] }) {
  if (!rows.length) return null;
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">{title}</p>
      <ul className="max-h-56 overflow-auto rounded-md border border-line bg-void p-3 text-[13px] text-bone-dim">
        {rows.map((r) => (
          <li key={r.name}>
            {r.count} × {r.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReversePanel() {
  const [report, setReport] = useState<CraftReport | null>(null);
  const { busy, msg, run } = useAction();

  function preview() {
    void run(async () => {
      const r = await adminRequest<CraftReport>("/internal/admin/crafts/preview", {});
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setReport(r.data);
      return { ok: true, text: r.data.crafted_total + r.data.forged_total === 0 ? "Nobody holds anything crafted." : "Preview only - nothing has been changed yet." };
    });
  }

  function apply() {
    if (!report || !window.confirm(`Reverse every craft for ${report.players} players?\n\nThe bot copies its database first. This cannot be undone from the site.`)) return;
    void run(async () => {
      const r = await adminRequest<CraftReport>("/internal/admin/crafts/reverse", {});
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setReport(r.data);
      return { ok: true, text: `Done. ${r.data.crafted_total} crafted characters and ${r.data.forged_total} forged weapons were taken back and everything was handed back.` };
    });
  }

  return (
    <Panel
      title="Reverse all crafts"
      blurb="Takes every crafted character back and gives players what it was made of - all the way down (a crafted ingredient is itself taken apart). Only weapons that can ONLY come from /forge (the True weapons) are reversed; the bot never recorded who forged ordinary weapons."
    >
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-azure px-5 py-2.5 text-[13px]" disabled={busy} onClick={preview}>
          {busy ? "Working…" : "1. Preview"}
        </button>
        <button
          type="button"
          className="btn btn-fill px-5 py-2.5 text-[13px]"
          disabled={busy || !report || report.applied || report.crafted_total + report.forged_total === 0}
          onClick={apply}
        >
          2. Reverse everything
        </button>
        <Status msg={msg} />
      </div>
      {report ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <p className="text-[13.5px] text-bone-dim md:col-span-2">
            {report.applied ? "Result: " : "Would affect: "}
            <b className="text-bone">{report.players}</b> players · <b className="text-bone">{report.crafted_total}</b> crafted characters ·{" "}
            <b className="text-bone">{report.forged_total}</b> forged weapons
          </p>
          <CountList title="Crafted characters taken back" rows={report.crafted_characters} />
          <CountList title="Forged weapons taken back" rows={report.forged_weapons} />
          <CountList title="Characters handed back" rows={report.refund_characters} />
          <CountList title="Weapons handed back" rows={report.refund_weapons} />
          <CountList title="Boss drops handed back" rows={report.refund_drops} />
          <CountList title="Could not be handed back (item missing from the bot)" rows={report.unresolved} />
        </div>
      ) : null}
    </Panel>
  );
}

// ── roster purge ─────────────────────────────────────────────────────────────────

function RosterPanel() {
  const [text, setText] = useState(DEFAULT_LIST.join("\n"));
  const [mode, setMode] = useState<"keep" | "delete">("keep");
  const [preview, setPreview] = useState<RosterPreview | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [done, setDone] = useState<string | null>(null);
  const { busy, msg, run } = useAction();

  function doPreview() {
    setDone(null);
    void run(async () => {
      const r = await adminRequest<RosterPreview | { error: string }>("/internal/admin/roster/preview", { names: text, mode });
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      const d = r.data as RosterPreview & { error?: string };
      if (d.error) return { ok: false, text: d.error };
      setPreview(d);
      setChecked(new Set(d.candidates.filter((c) => c.default_checked).map((c) => c.id)));
      return d.aborted ? { ok: false, text: d.aborted } : { ok: true, text: "Preview only - nothing has been changed yet." };
    });
  }

  function apply() {
    if (!preview) return;
    const ids = preview.candidates.filter((c) => checked.has(c.id));
    const copies = ids.reduce((n, c) => n + c.copies, 0);
    if (!window.confirm(`Remove ${ids.length} characters from the bot AND take ${copies} copies out of player inventories?\n\nThe bot copies its database first. Taken copies are parked on a hidden account.`)) return;
    void run(async () => {
      const r = await adminRequest<{ removed: { name: string }[]; copies_moved: number; skipped: { name?: string; reason: string }[] }>(
        "/internal/admin/roster/purge",
        { ids: ids.map((c) => c.id) },
      );
      if (r.status !== "ok") return { ok: false, text: failureText(r) };
      setDone(`Removed ${r.data.removed.length} characters and took ${r.data.copies_moved} copies from players.${r.data.skipped.length ? ` Skipped ${r.data.skipped.length}.` : ""}`);
      setPreview(null);
      return { ok: true, text: "Done." };
    });
  }

  const toggle = (id: number) =>
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const groups: { key: Candidate["group"]; title: string; hint: string }[] = [
    { key: "normal", title: "Normal characters", hint: "ticked by default" },
    { key: "craftable", title: "Craftable characters", hint: "NOT ticked - removing them takes them away from every player; reverse crafts first" },
    { key: "event", title: "Event (Halloween) characters", hint: "NOT ticked - tick them if you want them gone from inventories too" },
  ];

  return (
    <Panel
      title="Remove characters from the bot AND from player inventories"
      blurb="Paste a character list (one name per line). 'Keep only these' removes every normal character that is NOT on the list; 'Remove these' removes the ones that ARE. You always see a preview first and can untick anything."
    >
      <div className="grid gap-4">
        <textarea className={`${inputCls} h-48 font-mono text-[12px]`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        <div className="flex flex-wrap items-center gap-5 text-[13.5px] text-bone-dim">
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "keep"} onChange={() => setMode("keep")} /> Keep only these
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "delete"} onChange={() => setMode("delete")} /> Remove these
          </label>
          <button type="button" className="btn btn-azure px-5 py-2.5 text-[13px]" disabled={busy} onClick={doPreview}>
            {busy ? "Working…" : "1. Preview"}
          </button>
          <Status msg={msg} />
        </div>
        {done ? <p className="text-[14px] text-azure-bright">{done}</p> : null}

        {preview && !preview.aborted ? (
          <>
            <p className="text-[13.5px] text-bone-dim">
              {preview.matched_entries} of {preview.list_count} list names exist in the bot ({preview.kept_in_bot} characters
              {preview.mode === "keep" ? " stay" : " match"}). {preview.candidates.length} candidates, {preview.total_copies} copies held by players.
            </p>
            {groups.map((g) => {
              const rows = preview.candidates.filter((c) => c.group === g.key);
              if (!rows.length) return null;
              return (
                <div key={g.key}>
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">
                    {g.title} ({rows.length}) - {g.hint}
                  </p>
                  <div className="max-h-72 overflow-auto rounded-md border border-line bg-void p-3">
                    {rows.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 py-0.5 text-[13px] text-bone-dim">
                        <input type="checkbox" checked={checked.has(c.id)} onChange={() => toggle(c.id)} />
                        <span className="text-bone">{c.name}</span>
                        <span className="font-mono text-[11px] text-bone-faint">
                          {c.copies} copies · {c.owners} players{c.enabled ? "" : " · already off"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            {preview.not_in_bot.length ? (
              <details className="text-[13px] text-bone-dim">
                <summary className="cursor-pointer">{preview.not_in_bot.length} list names that are not in the bot (nothing to do for them)</summary>
                <p className="mt-2 leading-relaxed">{preview.not_in_bot.join(" · ")}</p>
              </details>
            ) : null}
            <div>
              <button type="button" className="btn btn-fill px-6 py-2.5 text-sm" disabled={busy || checked.size === 0} onClick={apply}>
                2. Remove {checked.size} ticked characters
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Panel>
  );
}
