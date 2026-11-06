import { useEffect, useMemo, useRef, useState } from "react";
import { FramedShot, Screenshots, shot } from "@/components/screenshots";
import { HowItWorks } from "@/components/home-sections";
import { jsonLd, seo } from "@/lib/seo";
import { SITE_URL, BLEACHDEX_URL } from "@/lib/site";
import { SUPPORT_SERVER } from "@/lib/catalog";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CatalogImage } from "@/components/catalog-image";
import { brandIcon } from "@/assets";
import { CRAFT_SOULS, DISCORD_INVITE, SOULS, TIER_LABEL, WEAPONS, getSoul } from "@/lib/catalog";
import { useCatalogVersion } from "@/lib/catalog-version";
import { useLiveStats } from "@/lib/use-live-stats";

export const Route = createFileRoute("/bleachdex/")({
  head: () => ({
    ...seo({
      title: "BleachDex — Collect souls in Discord",
      description:
        "Souls spawn in your Discord server. Catch them, build a three-character team, fight bosses, craft rare characters and climb the leaderboard.",
      path: "/bleachdex",
    }),
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "BleachDex",
        applicationCategory: "GameApplication",
        operatingSystem: "Discord",
        url: `${SITE_URL}${BLEACHDEX_URL.replace(SITE_URL, "")}`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }),
    ],
  }),
  component: Home,
});

const PACK_ART_NAMES = ["Coyote Starrk", "Ichigo Kurosaki", "Yhwach"];

/** Mobile-only bar that appears once the hero CTA has scrolled away, so "Add to Discord" is always one tap away. */
function StickyInvite({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = targetRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef]);
  return (
    <div
      aria-hidden={!show}
      className={
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-void/95 px-4 pt-3 backdrop-blur transition-transform duration-300 md:hidden " +
        (show ? "translate-y-0" : "translate-y-full")
      }
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <a href={DISCORD_INVITE} tabIndex={show ? 0 : -1} className="btn btn-fill w-full justify-center">
        Add to Discord
      </a>
    </div>
  );
}

function Home() {
  const heroCta = useRef<HTMLDivElement>(null);
  const catalogVersion = useCatalogVersion();
  const live = useLiveStats();
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
          <div className="hero-seq">
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
            <div ref={heroCta} className="mt-8 flex flex-wrap gap-4">
              <a href={DISCORD_INVITE} className="btn btn-fill">
                Add to Discord
              </a>
              <Link to="/bleachdex/list" className="btn btn-outline">
                Browse the list
              </Link>
              <Link to="/bleachdex/leaderboard" className="btn btn-outline">
                <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-azure-bright" aria-hidden="true" />
                Live leaderboard
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
              {live && live.players > 0 ? (
                <span>
                  <b className="text-bone">{live.players.toLocaleString()}</b> players ·{" "}
                  <b className="text-bone">{live.cardsCaught.toLocaleString()}</b> cards caught
                </span>
              ) : null}
            </div>
          </div>

          <figure className="mx-auto w-full max-w-[340px] md:ml-auto">
            <div className="hero-float rotate-[2deg] overflow-hidden rounded-[10px] border border-line-bright bg-void-raised">
              <CatalogImage
                src={featured.imagePath}
                name={featured.name}
                priority
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
          <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
            <h2 className="max-w-xl font-serif text-[38px] leading-tight">
              3 daily pulls, 1 weekly pull — plus 2 more for watching ads.
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
              <Link to="/bleachdex/list" className="btn btn-outline">
                Browse the list
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-24">
        <div className="wrap flex flex-wrap items-end justify-between gap-8">
          <div>
            <h2 className="font-serif text-[38px] leading-tight">
              Check the numbers, then invite it.
            </h2>
            <p className="mt-3 max-w-md text-bone-dim">
              The List has all {SOULS.length + CRAFT_SOULS.length + WEAPONS.length} entries with
              stats and crafting recipes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/bleachdex/list" className="btn btn-azure">
              Open the list
            </Link>
            <a href={DISCORD_INVITE} className="btn btn-outline">
              Add to Discord
            </a>
          </div>
        </div>
      </section>

      <Screenshots />

      <HowItWorks shots={false} />

      <section className="pb-24" aria-labelledby="install-title">
        <div className="wrap grid items-center gap-10 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <h2 id="install-title" className="font-serif text-[32px] leading-tight">
              Adding BleachDex to your server
            </h2>
            <p className="lede mt-4">
              Discord shows you exactly which permissions BleachDex asks for before you approve, and
              you can change its role or remove it at any time from Server Settings. Questions first?
              The support server is open.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn btn-fill">
                Add to Discord
              </a>
              <a href={SUPPORT_SERVER} target="_blank" rel="noreferrer" className="btn btn-outline">
                Join the support server
              </a>
            </div>
          </div>
          <FramedShot item={shot("leaderboard")} className="mx-auto w-full max-w-[360px]" />
        </div>
      </section>
      <StickyInvite targetRef={heroCta} />
    </main>
  );
}
