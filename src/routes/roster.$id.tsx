import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SoulCard } from "@/components/soul-card";
import { CatalogImage } from "@/components/catalog-image";
import {
  ALL_SOULS,
  FACTION_LABEL,
  TIER_LABEL,
  WEAPONS,
  getSoul,
  similarSouls,
  type Ingredient,
} from "@/lib/catalog";
import { reiatsuAttack, reiatsuHp } from "@/lib/reiatsu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roster/$id")({
  loader: ({ params }) => {
    const soul = getSoul(params.id);
    if (!soul) throw notFound();
    return soul;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.name} · BleachDex` : "Soul · BleachDex" }],
  }),
  component: SoulDetail,
});

const INGREDIENT_KIND: Record<Ingredient["kind"], string> = {
  drop: "Boss drop",
  weapon: "Zanpakutō",
  character: "Character",
};

/** An ingredient links to its own page when the roster has it by name. */
function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  const label = (
    <>
      <span className="font-bold text-bone">{ingredient.name}</span>
      <span className="font-mono text-[12px] text-bone-faint">
        {INGREDIENT_KIND[ingredient.kind]} · x{ingredient.qty}
      </span>
    </>
  );
  const className =
    "flex items-baseline justify-between gap-4 border-t border-line py-2.5 first:border-t-0 no-underline";
  if (ingredient.kind === "character") {
    const soul = ALL_SOULS.find((s) => s.name === ingredient.name);
    if (soul) {
      return (
        <Link to="/roster/$id" params={{ id: String(soul.id) }} className={className}>
          {label}
        </Link>
      );
    }
  }
  if (ingredient.kind === "weapon") {
    const weapon = WEAPONS.find((w) => w.name === ingredient.name);
    if (weapon) {
      return (
        <Link to="/weapons/$id" params={{ id: String(weapon.id) }} className={className}>
          {label}
        </Link>
      );
    }
  }
  return <div className={className}>{label}</div>;
}

function SoulDetail() {
  const soul = Route.useLoaderData();
  const related = similarSouls(soul);

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap grid items-start gap-12 md:grid-cols-[minmax(0,380px)_1fr]">
        <SoulArt
          soulId={soul.id}
          imagePath={soul.imagePath}
          name={soul.name}
          mythic={soul.tier === "mythic"}
        />
        <div>
          <Link
            to="/list"
            search={{ kind: soul.craftOnly ? "craft" : "soul" }}
            className="font-mono text-sm text-azure-bright no-underline hover:underline"
          >
            ← Back to the list
          </Link>
          <div className="kicker mt-6">
            {soul.craftOnly ? `Craft only · ${soul.craftCategory}` : FACTION_LABEL[soul.faction]}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl">{soul.name}</h1>
          <p className="mt-3 font-mono text-sm text-gold">{TIER_LABEL[soul.tier]}</p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: "HP", value: soul.hp },
              { label: "ATK", value: soul.attack },
              { label: "Pressure", value: soul.pressure },
            ].map((stat) => (
              <div key={stat.label} className="panel p-5">
                <div className="font-serif text-[28px] tabular-nums text-gold">{stat.value}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-bone-faint">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {soul.abilityName || soul.abilityDescription ? (
            <div className="panel mt-6 p-6">
              <h2 className="font-serif text-lg">{soul.abilityName}</h2>
              {soul.abilityDescription ? (
                <p className="mt-2 text-sm leading-6 text-bone-dim">{soul.abilityDescription}</p>
              ) : null}
            </div>
          ) : null}

          <div className="panel mt-6 p-6">
            <h2 className="font-serif text-lg">Reiatsu copy</h2>
            <p className="mt-2 text-sm leading-6 text-bone-dim">
              One copy in ten is awakened. In battle this one has{" "}
              <b className="text-bone">{reiatsuHp(soul.hp)} HP</b> and{" "}
              <b className="text-bone">{reiatsuAttack(soul.attack)} ATK</b> (+10% HP, +20% damage).
            </p>
          </div>

          {soul.craftOnly ? (
            <div className="panel mt-6 p-6">
              <h2 className="font-serif text-lg">How to craft it</h2>
              <p className="mb-3 mt-2 text-sm leading-6 text-bone-dim">
                No pack or spawn gives this one. Run /craft in Discord with everything below.
              </p>
              <div>
                {soul.recipe.map((ingredient) => (
                  <IngredientRow
                    key={`${ingredient.kind}-${ingredient.name}`}
                    ingredient={ingredient}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <div className="wrap mt-16">
          <h2 className="mb-6 font-serif text-2xl">Similar characters</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((other) => (
              <SoulCard key={other.id} soul={other} />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SoulArt({
  soulId,
  imagePath,
  name,
  mythic,
}: {
  soulId: number;
  imagePath: string;
  name: string;
  mythic: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[10px_28px_10px_28px] border border-line bg-void-raised",
        mythic && "soul-card-mythic",
      )}
      data-soul-art={soulId}
    >
      <CatalogImage
        src={imagePath}
        name={name}
        className="aspect-[3/4] w-full object-cover object-top"
      />
    </div>
  );
}
