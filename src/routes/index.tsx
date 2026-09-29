import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CatalogImage } from "@/components/catalog-image";
import { brandIcon } from "@/assets";
import { CRAFT_SOULS, DISCORD_INVITE, SOULS, TIER_LABEL, WEAPONS, getSoul } from "@/lib/catalog";
import { useCatalogVersion } from "@/lib/catalog-version";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "BleachDex" }] }),
  component: Home,
});

const PACK_ART_NAMES = ["Coyote Starrk", "Ichigo Kurosaki", "Yhwach"];

const HOW_IT_PLAYS = [
  {
    tag: "Catch",
    title: "Souls spawn in chat",
    body: 'Every spawn has two buttons. "Catch Soul!" claims it and "What is this?" gives a hint to anyone stuck.',
  },
  {
    tag: "Collect",
    title: "/collection completion, /collection inventory",
    body: "Completion shows the percentage you own. Inventory lists what you have, split into souls, weapons and drops.",
  },
  {
    tag: "Reiatsu",
    title: "One copy in ten is awakened",
    body: "A Reiatsu copy fights with +20% damage and +10% HP and has its own card. It can come from a pack, a catch or a craft.",
  },
  {
    tag: "Battle",
    title: "/team add, /battle start",
    body: "Own three characters, set a team, equip weapons with /equip, then challenge another player. The rounds play out in one live message.",
  },
  {
    tag: "Boss",
    title: "A new boss every hour",
    body: "It spawns in the same channel as regular souls. Challenge it for a private ten-round fight with your active team.",
  },
  {
    tag: "Craft",
    title: "/craft",
    body: `Spend boss drops, weapons and lower forms on characters no pack can give you. There are ${CRAFT_SOULS.length} of them, all on the List page.`,
  },
];

function Home() {
  const catalogVersion = useCatalogVersion();
  const featured = useMemo(() => getSoul(1) ?? SOULS[0], [catalogVersion]);
  const packArt = useMemo(
    () =>
      PACK_ART_NAMES.map((name) => SOULS.find((soul) => soul.name === name)).filter(
        (soul) => soul !== undefined,
      ),
    [catalogVersion],
  );

  return (
    <main className="page-enter">
      <section className="py-20 md:py-24">
        <div className="wrap grid items-center gap-14 md:grid-cols-[1.15fr_.85fr]">
          <div>
            <img src={brandIcon} alt="BleachDex" className="h-9 w-auto rounded-md" />
            <h1 className="mt-5 font-serif text-[52px] leading-[0.98] tracking-[-0.01em] md:text-[76px]">
              Bleach
              <br />
              <span className="accent-text">Dex</span>
            </h1>
            <p className="mt-7 max-w-md text-[16.5px] leading-7 text-bone-dim">
              Souls spawn in your server and you press a button to keep them. Build a
              three-character team, fight the hourly boss, and spend its drops on /craft.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href={DISCORD_INVITE} className="btn btn-fill">
                Add to Discord
              </a>
              <Link to="/list" className="btn btn-outline">
                Browse the list
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12.5px] text-bone-faint">
              <span>
                <b className="text-bone">{SOULS.length}</b> pullable souls
              </span>
              <span>
                <b className="text-bone">{CRAFT_SOULS.length}</b> craft-only
              </span>
              <span>
                <b className="text-bone">{WEAPONS.length}</b> zanpakutō
              </span>
              <span>
                <b className="text-bone">300</b> KAN a day
              </span>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-[340px] md:ml-auto">
            <div className="rotate-[2deg] overflow-hidden rounded-[10px_28px_10px_28px] border border-line-bright bg-void-raised">
              <CatalogImage
                src={featured.imagePath}
                name={featured.name}
                className="aspect-[3/4] w-full object-cover object-top"
              />
            </div>
            <figcaption className="mt-4 font-mono text-[12px] text-bone-faint">
              {featured.name} · {TIER_LABEL[featured.tier]} · {featured.hp} HP · {featured.attack}{" "}
              ATK
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-t border-line py-24">
        <div className="wrap">
          <div className="kicker">Packs</div>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
            <h2 className="max-w-xl font-serif text-[38px] leading-tight">
              3 daily pulls, 1 weekly pull.
            </h2>
            <p className="max-w-xs text-[14.5px] leading-6 text-bone-dim">
              The daily pack can land any tier. The weekly pack is Epic or better.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-7">
            <div className="pack-cards flex">
              {packArt.map((soul) => (
                <div key={soul.id} className="pack-card">
                  <CatalogImage
                    src={soul.imagePath}
                    name={soul.name}
                    className="size-full object-cover object-top"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={DISCORD_INVITE} className="btn btn-fill">
                Pull one in Discord
              </a>
              <Link to="/list" className="btn btn-outline">
                Browse the list
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-24">
        <div className="wrap">
          <div className="kicker">How it plays</div>
          <div className="grid gap-x-14 md:grid-cols-2 mt-11">
            {HOW_IT_PLAYS.map((item, i) => (
              <div
                key={item.tag}
                className="border-t border-line py-7 first:border-t-0 md:[&:nth-child(2)]:border-t-0"
              >
                <div
                  className={
                    i % 2 === 0
                      ? "mb-2 font-mono text-[11.5px] tracking-[0.06em] text-azure-bright"
                      : "mb-2 font-mono text-[11.5px] tracking-[0.06em] text-ember-bright"
                  }
                >
                  {item.tag}
                </div>
                <h3 className="mb-2 font-serif text-[21px]">{item.title}</h3>
                <p className="max-w-md text-sm leading-6 text-bone-dim">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line py-24">
        <div className="wrap flex flex-wrap items-end justify-between gap-8">
          <div>
            <div className="kicker">Look first</div>
            <h2 className="font-serif text-[38px] leading-tight">
              Check the numbers, then invite it.
            </h2>
            <p className="mt-3 max-w-md text-bone-dim">
              The List has all {SOULS.length + CRAFT_SOULS.length + WEAPONS.length} entries with
              stats and crafting recipes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/list" className="btn btn-azure">
              Open the list
            </Link>
            <a href={DISCORD_INVITE} className="btn btn-outline">
              Add to Discord
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
