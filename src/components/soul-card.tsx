import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { Soul, Zanpakuto, Tier } from "@/lib/catalog";
import { FACTION_LABEL, TIER_LABEL } from "@/lib/catalog";
import { cn } from "@/lib/utils";

function onTilt(card: HTMLElement, event: React.MouseEvent) {
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
}

function ArtFallback({ name }: { name: string }) {
  return (
    <div className="flex size-full items-center justify-center bg-void-raised-2 font-serif text-4xl text-line-bright">
      {name.slice(0, 1)}
    </div>
  );
}

export function SoulCard({ soul }: { soul: Soul }) {
  const ref = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={ref}
      to="/roster/$id"
      params={{ id: String(soul.id) }}
      className={cn(
        "soul-card block no-underline",
        soul.tier === "mythic" && "soul-card-mythic",
      )}
      onMouseMove={(e) => ref.current && onTilt(ref.current, e)}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-line">
        <div className={cn("absolute inset-x-0 top-0 z-10 h-[3px]", `tier-${soul.tier}`)} />
        <img
          src={soul.imagePath}
          alt={soul.name}
          loading="lazy"
          className="size-full object-cover object-top"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement
              ?.querySelector("[data-fallback]")
              ?.removeAttribute("hidden");
          }}
        />
        <div data-fallback hidden className="absolute inset-0">
          <ArtFallback name={soul.name} />
        </div>
      </div>
      <div className="px-3 py-3">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.05em] text-bone-faint">
          {FACTION_LABEL[soul.faction]}
        </div>
        <div className="mt-1 text-sm font-bold leading-snug text-bone">{soul.name}</div>
        <div className="mt-2.5 flex justify-between font-mono text-[11px]">
          <span className="font-bold text-gold">{TIER_LABEL[soul.tier]}</span>
          <span className="text-bone-faint">{soul.hp} HP</span>
        </div>
      </div>
    </Link>
  );
}

export function WeaponCard({ weapon }: { weapon: Zanpakuto }) {
  const ref = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={ref}
      to="/weapons/$id"
      params={{ id: String(weapon.id) }}
      className={cn(
        "soul-card block no-underline",
        weapon.tier === "mythic" && "soul-card-mythic",
      )}
      onMouseMove={(e) => ref.current && onTilt(ref.current, e)}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-line">
        <div className={cn("absolute inset-x-0 top-0 z-10 h-[3px]", `tier-${weapon.tier}`)} />
        <img
          src={weapon.imagePath}
          alt={weapon.name}
          loading="lazy"
          className="size-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div className="px-3 py-3">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.05em] text-bone-faint">
          Zanpakutō
        </div>
        <div className="mt-1 text-sm font-bold leading-snug text-bone">{weapon.name}</div>
        <div className="mt-2.5 flex justify-between font-mono text-[11px]">
          <span className="font-bold text-gold">{TIER_LABEL[weapon.tier as Tier]}</span>
          <span className="text-bone-faint">+{weapon.attackBonus} ATK</span>
        </div>
      </div>
    </Link>
  );
}
