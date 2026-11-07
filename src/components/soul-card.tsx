import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { Soul, Zanpakuto, Tier } from "@/lib/catalog";
import { FACTION_LABEL, TIER_LABEL, weaponBoostLabel } from "@/lib/catalog";
import { imgSrcSet, imgVariant, SIZES } from "@/lib/img";
import { cn } from "@/lib/utils";

/** 3D tilt only for a real mouse. Touch screens and reduced-motion users get a calm card. */
function canTilt(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function onTilt(card: HTMLElement, event: React.MouseEvent) {
  if (!canTilt()) return;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
}

function ArtFallback({ name }: { name: string }) {
  return (
    <div className="flex size-full items-center justify-center bg-void-raised-2 font-serif text-4xl text-line-bright">
      {name.slice(0, 1)}
    </div>
  );
}

function useTilt() {
  const ref = useRef<HTMLAnchorElement>(null);
  return {
    ref,
    onMouseMove: (e: React.MouseEvent) => ref.current && onTilt(ref.current, e),
    onMouseLeave: () => {
      if (ref.current) ref.current.style.transform = "";
    },
  };
}

/** Shared card body: tier-framed art + name + tier/stat line. */
function CardBody({
  tier,
  name,
  imagePath,
  objectPosition,
  kicker,
  stat,
}: {
  tier: Tier;
  name: string;
  imagePath: string;
  objectPosition: "top" | "center";
  kicker: string;
  stat: string;
}) {
  return (
    <>
      <div className="relative aspect-[3/4] overflow-hidden bg-line">
        <div className={cn("absolute inset-x-0 top-0 z-10 h-[3px]", `tier-${tier}`)} />
        <img
          src={imgVariant(imagePath, 480)}
          srcSet={imgSrcSet(imagePath)}
          sizes={SIZES.card}
          width={300}
          height={400}
          alt={name}
          loading="lazy"
          decoding="async"
          className={cn("size-full object-cover", objectPosition === "top" ? "object-top" : "object-center")}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement?.querySelector("[data-fallback]")?.removeAttribute("hidden");
          }}
        />
        <div data-fallback hidden className="absolute inset-0">
          <ArtFallback name={name} />
        </div>
        <span className="card-shine" aria-hidden="true" />
      </div>
      <div className="px-3 py-3">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.05em] text-bone-faint">{kicker}</div>
        <div className="mt-1 text-sm font-bold leading-snug text-bone">{name}</div>
        <div className="mt-2.5 flex justify-between font-mono text-[11px]">
          <span className="font-bold text-gold">
            <span className="tier-dot" aria-hidden="true" />
            {TIER_LABEL[tier]}
          </span>
          <span className="text-bone-faint">{stat}</span>
        </div>
      </div>
    </>
  );
}

export function SoulCard({ soul }: { soul: Soul }) {
  const tilt = useTilt();
  return (
    <Link
      to="/bleachdex/roster/$id"
      params={{ id: String(soul.id) }}
      data-tier={soul.tier}
      className={cn("soul-card block no-underline", `soul-card-${soul.tier}`)}
      {...tilt}
    >
      <CardBody
        tier={soul.tier}
        name={soul.name}
        imagePath={soul.imagePath}
        objectPosition="top"
        kicker={FACTION_LABEL[soul.faction]}
        stat={`${soul.hp} HP`}
      />
    </Link>
  );
}

export function WeaponCard({ weapon }: { weapon: Zanpakuto }) {
  const tilt = useTilt();
  const tier = weapon.tier as Tier;
  return (
    <Link
      to="/bleachdex/weapons/$id"
      params={{ id: String(weapon.id) }}
      data-tier={tier}
      className={cn("soul-card block no-underline", `soul-card-${tier}`)}
      {...tilt}
    >
      <CardBody
        tier={tier}
        name={weapon.name}
        imagePath={weapon.imagePath}
        objectPosition="center"
        kicker="Weapon"
        stat={weaponBoostLabel(weapon)}
      />
    </Link>
  );
}
