import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { jsonLd, seo } from "@/lib/seo";
import { CRAFT_SOULS, SOULS, TIERS, TIER_LABEL, WEAPONS, type Tier } from "@/lib/catalog";
import { useCatalogVersion } from "@/lib/catalog-version";
import { FirstMinutes } from "@/components/first-minutes";

const TITLE = "BleachDex guide: tiers, bosses, crafting and weapons";
const DESCRIPTION =
  "How BleachDex works: what each rarity tier means, how the hourly boss and /craft fit together, and how weapons boost your team. Numbers come straight from the live catalog.";

export const Route = createFileRoute("/bleachdex/guide")({
  head: () => ({
    ...seo({ title: TITLE, description: DESCRIPTION, path: "/bleachdex/guide" }),
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: TITLE,
        description: DESCRIPTION,
        about: "BleachDex Discord bot",
      }),
    ],
  }),
  component: GuidePage,
});

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

function GuidePage() {
  const version = useCatalogVersion();
  const rows = useMemo(
    () =>
      TIERS.map((tier) => {
        const souls = SOULS.filter((s) => s.tier === tier);
        const craft = CRAFT_SOULS.filter((s) => s.tier === tier);
        const weapons = WEAPONS.filter((w) => w.tier === tier);
        return {
          tier,
          souls: souls.length,
          craft: craft.length,
          weapons: weapons.length,
          hp: avg([...souls, ...craft].map((s) => s.hp)),
          attack: avg([...souls, ...craft].map((s) => s.attack)),
        };
      }),
    [version],
  );
  const boosts = useMemo(() => {
    const range = (type: "damage" | "hp") => {
      const v = WEAPONS.filter((w) => w.boostType === type && w.boostPercent > 0).map((w) => w.boostPercent);
      return v.length ? { min: Math.min(...v), max: Math.max(...v), n: v.length } : null;
    };
    return { damage: range("damage"), hp: range("hp") };
  }, [version]);
  const sampleRecipe = useMemo(
    () => [...CRAFT_SOULS].sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier))[0],
    [version],
  );

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap max-w-4xl">
        <p className="eyebrow">Guide</p>
        <h1 className="mt-2 font-serif text-[40px] leading-tight md:text-[48px]">How BleachDex works</h1>
        <p className="lede mt-4 max-w-2xl">
          The short version: catch souls, build a team, beat the hourly boss, and spend its drops on rare
          characters. The numbers below are read from the same catalog the List page uses, so they stay
          current when the roster changes.
        </p>
        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2 font-mono text-[12.5px]">
          {[
            ["#tiers", "Tiers"],
            ["#bosses", "Bosses"],
            ["#crafting", "Crafting"],
            ["#weapons", "Weapons"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="chip no-underline">
              {label}
            </a>
          ))}
        </nav>

        <section id="tiers" className="mt-14 scroll-mt-24" aria-labelledby="tiers-title">
          <h2 id="tiers-title" className="font-serif text-[28px] leading-tight">
            Rarity tiers
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-bone-dim">
            Every character and weapon belongs to one of six tiers. Higher tiers are rarer and, on average,
            hit harder and last longer. Averages include craft-only characters.
          </p>
          <div className="mt-6 overflow-x-auto rounded-md border border-line bg-void-raised">
            <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px]">
              <caption className="sr-only">Catalog size and average stats for each rarity tier</caption>
              <thead>
                <tr className="border-b border-line font-mono text-[11.5px] uppercase tracking-[0.06em] text-bone-faint">
                  {["Tier", "Pullable", "Craft-only", "Weapons", "Avg HP", "Avg ATK"].map((h) => (
                    <th key={h} scope="col" className="p-3 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.tier} data-tier={r.tier}>
                    <th scope="row" className="p-3 font-bold text-bone">
                      <span className="tier-dot" aria-hidden="true" />
                      {TIER_LABEL[r.tier as Tier]}
                    </th>
                    <td className="p-3 text-bone-dim">{r.souls}</td>
                    <td className="p-3 text-bone-dim">{r.craft}</td>
                    <td className="p-3 text-bone-dim">{r.weapons}</td>
                    <td className="p-3 text-bone-dim">{r.hp || "—"}</td>
                    <td className="p-3 text-bone-dim">{r.attack || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] text-bone-faint">
            Want to see them all?{" "}
            <Link to="/bleachdex/list" className="underline underline-offset-4 hover:text-bone">
              Open the List
            </Link>
            .
          </p>
        </section>

        <section id="bosses" className="mt-14 scroll-mt-24" aria-labelledby="bosses-title">
          <h2 id="bosses-title" className="font-serif text-[28px] leading-tight">
            The hourly boss
          </h2>
          <ul className="mt-4 max-w-2xl list-disc space-y-2 pl-5 text-[15px] leading-7 text-bone-dim">
            <li>Once an hour, on the hour (GMT+8), a boss appears in your server's spawn channel. There is no separate boss channel to set up.</li>
            <li>Anyone can press Challenge. The fight is private: just you, up to 10 rounds, using your saved /team.</li>
            <li>Beat a boss and you earn its drops. Drops are the main ingredient for crafting.</li>
          </ul>
        </section>

        <section id="crafting" className="mt-14 scroll-mt-24" aria-labelledby="crafting-title">
          <h2 id="crafting-title" className="font-serif text-[28px] leading-tight">
            Crafting
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-bone-dim">
            Run /craft, pick a category, then pick a character. Every ingredient (boss drops, weapon cards,
            character cards or earlier forms) is checked and spent together. {CRAFT_SOULS.length} characters
            can only be made this way; they never appear in packs or spawns.
          </p>
          {sampleRecipe ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-bone-dim">
              Example:{" "}
              <Link
                to="/bleachdex/roster/$id"
                params={{ id: String(sampleRecipe.id) }}
                className="font-bold text-bone underline underline-offset-4"
              >
                {sampleRecipe.name}
              </Link>{" "}
              needs {sampleRecipe.recipe.map((i) => `${i.qty}× ${i.name}`).join(", ")}.
            </p>
          ) : null}
        </section>

        <section id="weapons" className="mt-14 scroll-mt-24" aria-labelledby="weapons-title">
          <h2 id="weapons-title" className="font-serif text-[28px] leading-tight">
            Weapons
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-bone-dim">
            Equip a weapon on a character when you set up your /team. Each weapon boosts one stat by a
            percentage:
            {boosts.damage ? ` damage weapons give +${boosts.damage.min}% to +${boosts.damage.max}%` : ""}
            {boosts.damage && boosts.hp ? "," : ""}
            {boosts.hp ? ` HP weapons give +${boosts.hp.min}% to +${boosts.hp.max}%` : ""}
            {boosts.damage || boosts.hp ? "." : ""} There are {WEAPONS.length} weapons in total.
          </p>
          <Link to="/bleachdex/list" search={{ kind: "weapon" }} className="btn btn-outline mt-5">
            Browse weapons
          </Link>
        </section>
      </div>
      <FirstMinutes where="guide" />
    </main>
  );
}
