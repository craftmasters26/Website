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
                <b className="text-bone">{WEAPONS.length}</b> weapons
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
