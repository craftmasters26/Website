import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CatchButton } from "@/components/catch-button";
import { FACTION_LABEL, TIER_LABEL, getWeapon } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/weapons/$id")({
  loader: ({ params }) => {
    const weapon = getWeapon(params.id);
    if (!weapon) throw notFound();
    return weapon;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.name} · BleachDex` : "Zanpakutō · BleachDex",
      },
    ],
  }),
  component: WeaponDetail,
});

function WeaponDetail() {
  const weapon = Route.useLoaderData();

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap grid items-start gap-12 md:grid-cols-[minmax(0,380px)_1fr]">
        <div
          className={cn(
            "overflow-hidden rounded-[10px_28px_10px_28px] border border-line bg-void-raised",
            weapon.tier === "mythic" && "soul-card-mythic",
          )}
        >
          <img
            src={weapon.imagePath}
            alt={weapon.name}
            className="aspect-[3/4] w-full object-cover"
          />
        </div>
        <div>
          <Link
            to="/list"
            search={{ kind: "weapon" }}
            className="font-mono text-sm text-azure-bright no-underline hover:underline"
          >
            ← Back to the list
          </Link>
          <div className="kicker mt-6">{FACTION_LABEL[weapon.faction]}</div>
          <h1 className="font-serif text-4xl md:text-5xl">{weapon.name}</h1>
          <p className="mt-3 font-mono text-sm text-gold">{TIER_LABEL[weapon.tier]}</p>

          <div className="panel mt-8 p-5">
            <div className="font-serif text-[28px] tabular-nums text-gold">
              +{weapon.attackBonus}
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-bone-faint">
              Attack bonus
            </div>
          </div>

          <div className="panel mt-6 p-6">
            <h2 className="font-serif text-lg">{weapon.abilityName}</h2>
            <p className="mt-2 text-sm leading-6 text-bone-dim">{weapon.abilityDescription}</p>
          </div>

          <CatchButton kind="weapon" id={weapon.id} />
        </div>
      </div>
    </main>
  );
}
