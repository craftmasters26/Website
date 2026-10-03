import { createFileRoute } from "@tanstack/react-router";
import { COMMAND_GROUPS } from "@/lib/commands";

export const Route = createFileRoute("/commands")({
  head: () => ({
    meta: [{ title: "Commands · BleachDex" }],
  }),
  component: CommandsPage,
});

function CommandsPage() {
  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {COMMAND_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-[0.08em] text-ember-bright">
                {group.title}
              </div>
              {group.commands.map(([name, desc]) => (
                <div key={name} className="border-t border-line py-3 first:border-t-0">
                  <div className="font-mono text-[13.5px] font-semibold text-bone">{name}</div>
                  <div className="mt-1 text-[13px] leading-5 text-bone-dim">{desc}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
