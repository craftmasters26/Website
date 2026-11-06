import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { COMMAND_GROUPS } from "@/lib/commands";

export const Route = createFileRoute("/bleachdex/commands")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_URL}/bleachdex/commands` }],
    meta: [
      { title: "BleachDex Commands: every slash command explained" },
      {
        name: "description",
        content:
          "All BleachDex slash commands in one searchable list: packs, collection, team battles, boss fights, crafting and more.",
      },
    ],
  }),
  component: CommandsPage,
});

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function CommandsPage() {
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COMMAND_GROUPS;
    return COMMAND_GROUPS.map((g) => ({
      ...g,
      commands: g.commands.filter(
        ([name, desc]) => `${name} ${desc}`.toLowerCase().includes(needle) || g.title.toLowerCase().includes(needle),
      ),
    })).filter((g) => g.commands.length > 0);
  }, [q]);

  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <h1 className="mb-3 font-serif text-[38px] leading-tight">Every command.</h1>
        <p className="mb-8 max-w-xl text-[14.5px] leading-[1.65] text-bone-dim">
          Type these in any server where BleachDex is installed. Search by what you want to do, like “daily” or “battle”.
        </p>
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <label className="search-box">
            <Search className="size-4 text-bone-faint" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search commands…"
              aria-label="Search commands"
            />
          </label>
          <nav aria-label="Command categories" className="flex flex-wrap gap-2">
            {COMMAND_GROUPS.map((g) => (
              <a key={g.title} href={`#${slug(g.title)}`} className="chip no-underline">
                {g.title}
              </a>
            ))}
          </nav>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {groups.reduce((n, g) => n + g.commands.length, 0)} commands shown
        </p>
        {groups.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-mono text-[13px] text-bone-faint">No command matches “{q}”.</p>
            <button type="button" className="btn btn-outline mt-5 px-5 py-3 text-sm" onClick={() => setQ("")}>
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {groups.map((group) => (
              <section key={group.title} id={slug(group.title)} className="scroll-mt-24">
                <h2 className="mb-3.5 font-mono text-[11.5px] font-normal uppercase tracking-[0.08em] text-ember-bright">
                  {group.title}
                </h2>
                {group.commands.map(([name, desc]) => (
                  <div key={name} className="border-t border-line py-3 first:border-t-0">
                    <div className="font-mono text-[13.5px] font-semibold text-bone">{name}</div>
                    <div className="mt-1 text-[13px] leading-5 text-bone-dim">{desc}</div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
