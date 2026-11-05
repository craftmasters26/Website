import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, Hammer, Swords, Sparkles, Users, Repeat, MessagesSquare } from "lucide-react";
import { FramedShot, shot } from "@/components/screenshots";
import { BOUNDLESS_DISCORD } from "@/components/bp-layout";
import { DISCORD_INVITE, SOULS, CRAFT_SOULS, WEAPONS } from "@/lib/catalog";
import { useCatalogVersion } from "@/lib/catalog-version";
import { BLEACHDEX_URL } from "@/lib/site";

/** Real numbers from the bot's public leaderboard feed. Hidden when the bot is unreachable. */
function useWeeklyStats() {
  const [stats, setStats] = useState<{ catches: number; players: number } | null>(null);
  useEffect(() => {
    let off = false;
    fetch("/api/leaderboard?period=weekly")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!off && d && Number(d.total_catches) > 0) {
          setStats({ catches: Number(d.total_catches), players: Number(d.total_players) || 0 });
        }
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);
  return stats;
}

/** Layered collage of real Discord screenshots (see src/lib/screenshots.ts). */
function HeroShots() {
  const items = (["boss", "leaderboard", "spawn", "catch"] as const).map(shot);
  return (
    <div className="hero-shots">
      <span className="status-chip status-chip-live hero-shots-chip">BleachDex · live now</span>
      {items.map((it) => (
        <img
          key={it.key}
          className={`hero-shot hero-shot-${it.key}`}
          src={it.src}
          alt={it.alt}
          width={it.width}
          height={it.height}
          loading="eager"
          decoding="async"
        />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section className="py-14 md:py-24">
      <div className="wrap grid items-center gap-14 md:grid-cols-[1.05fr_.95fr]">
        <div className="hero-seq">
          <p className="eyebrow">Independent game studio</p>
          <h1 className="hero-title mt-4 font-serif">
            Games and Discord experiences <span className="accent-text">built for communities.</span>
          </h1>
          <p className="lede mt-7">
            Boundless Production creates collectible games and interactive Discord bots. Discover
            BleachDex, our live character-collection game for Discord.
          </p>
          <div className="hero-actions mt-9">
            <a href={BLEACHDEX_URL} className="btn btn-fill">
              Explore BleachDex
            </a>
            <Link to="/projects" className="btn btn-outline">
              View all projects
            </Link>
            <a href={BOUNDLESS_DISCORD} target="_blank" rel="noreferrer" className="btn btn-outline">
              Join our Discord
            </a>
          </div>
        </div>
        <HeroShots />
      </div>
    </section>
  );
}

export function TrustStrip() {
  const v = useCatalogVersion();
  const weekly = useWeeklyStats();
  const items = useMemo(
    () => [
      { n: SOULS.length.toLocaleString(), l: "pullable characters" },
      { n: CRAFT_SOULS.length.toLocaleString(), l: "craft-only characters" },
      { n: WEAPONS.length.toLocaleString(), l: "weapons" },
      weekly
        ? { n: weekly.catches.toLocaleString(), l: "souls caught this week" }
        : { n: "3", l: "free pulls every day" },
    ],
    [v, weekly],
  );
  return (
    <section className="pb-14">
      <div className="wrap">
        <div className="stat-strip">
          {items.map((i) => (
            <div key={i.l}>
              <b>{i.n}</b>
              <span>{i.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedBleachDex() {
  const v = useCatalogVersion();
  const stats = useMemo(
    () => [
      { n: SOULS.length + CRAFT_SOULS.length, l: "characters" },
      { n: WEAPONS.length, l: "weapons" },
      { n: CRAFT_SOULS.length, l: "craft-only" },
    ],
    [v],
  );
  return (
    <section className="pb-20 md:pb-28" aria-labelledby="featured-title">
      <div className="wrap">
        <div className="showcase grid items-center gap-10 p-7 md:grid-cols-[1.1fr_.9fr] md:p-12">
          <div>
            <p className="showcase-label">Featured project</p>
            <h2 id="featured-title" className="section-title mt-3 font-serif">
              Collect souls. Build your team. Battle together.
            </h2>
            <p className="mt-5 max-w-[56ch] text-[16.5px] leading-7">
              BleachDex is a Discord collection game where characters spawn in your server. Catch them,
              build a three-character team, fight hourly bosses, craft new characters, and compete on the
              leaderboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-8">
              {stats.map((s) => (
                <div className="showcase-stat" key={s.l}>
                  <b>{s.n.toLocaleString()}</b>
                  <span>{s.l}</span>
                </div>
              ))}
            </div>
            <div className="hero-actions mt-9">
              <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn btn-sun">
                Add to Discord
              </a>
              <a href={BLEACHDEX_URL} className="btn btn-ghost-night">
                Explore BleachDex
              </a>
              <a href={`${BLEACHDEX_URL}/list`} className="btn btn-ghost-night">
                Browse characters
              </a>
            </div>
          </div>
          <FramedShot item={shot("boss")} className="mx-auto w-full max-w-[560px]" />
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Sparkles, t: "Characters spawn", d: "A soul appears in your Discord server while people chat." },
  { icon: Crown, t: "Players catch them", d: "Be the first to press Catch Soul! and it joins your collection." },
  { icon: Users, t: "Teams are created", d: "Pick three characters and equip weapons to build your team." },
  { icon: Swords, t: "Bosses are fought", d: "Take on hourly bosses, then spend the drops crafting new characters." },
];

export function HowItWorks() {
  return (
    <section className="pb-20 md:pb-28" aria-labelledby="how-title">
      <div className="wrap">
        <p className="eyebrow">How it works</p>
        <h2 id="how-title" className="section-title mt-3 max-w-2xl font-serif">
          A simple loop that keeps a server coming back.
        </h2>
        <ol className="mt-10 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="step-card">
              <span className="step-num">Step {i + 1}</span>
              <div className="step-art" aria-hidden="true">
                <s.icon className="size-10" strokeWidth={1.6} />
              </div>
              <h3 className="font-serif text-[21px]">{s.t}</h3>
              <p className="text-[14.5px] leading-6 text-bone-dim">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhatWeMake() {
  return (
    <section className="pb-20 md:pb-28" aria-labelledby="make-title">
      <div className="wrap">
        <p className="eyebrow">What we make</p>
        <h2 id="make-title" className="section-title mt-3 max-w-2xl font-serif">
          We make games that become part of a community.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-line-bright bg-void-raised p-7">
            <Hammer className="size-7 text-azure-bright" aria-hidden="true" />
            <h3 className="mt-4 font-serif text-[26px]">Games</h3>
            <p className="mt-2 text-[15.5px] leading-7 text-bone-dim">
              Original worlds, characters, progression systems and multiplayer experiences.
            </p>
          </div>
          <div className="rounded-xl border border-line-bright bg-void-raised p-7">
            <MessagesSquare className="size-7 text-azure-bright" aria-hidden="true" />
            <h3 className="mt-4 font-serif text-[26px]">Discord experiences</h3>
            <p className="mt-2 text-[15.5px] leading-7 text-bone-dim">
              Community games that live where players already spend time together.
            </p>
          </div>
        </div>
        <ul className="mt-8 grid list-none gap-3 p-0 text-[15px] text-bone-dim sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Built around communities",
            "Designed for repeat play",
            "Collectible characters and progression",
            "Discord-native social experiences",
            "Regular content and events",
          ].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <Repeat className="size-4 shrink-0 text-sun-deep" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CommunityCta() {
  return (
    <section className="pb-20 md:pb-28" aria-labelledby="community">
      <div className="wrap rounded-2xl border border-line-bright bg-void-raised p-8 md:p-12">
        <h2 id="community" className="section-title font-serif">Follow what we are building.</h2>
        <p className="lede mt-4">
          Follow development, report issues, suggest features, and meet other players.
        </p>
        <div className="hero-actions mt-8">
          <a href={BOUNDLESS_DISCORD} target="_blank" rel="noreferrer" className="btn btn-fill">
            Join our Discord
          </a>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="pb-24">
      <div className="wrap text-center">
        <h2 className="section-title font-serif">Ready to start collecting?</h2>
        <div className="hero-actions mt-8 justify-center">
          <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn btn-fill">
            Add BleachDex to Discord
          </a>
          <a href={`${BLEACHDEX_URL}/list`} className="btn btn-outline">
            Browse the collection
          </a>
        </div>
      </div>
    </section>
  );
}
