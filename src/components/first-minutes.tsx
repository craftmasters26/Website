import { DISCORD_INVITE } from "@/lib/catalog";

const STEPS = [
  {
    title: "Add the bot",
    body: "Pick your server, review the permissions Discord lists, and approve. It takes about a minute.",
  },
  {
    title: "Choose the spawn channel",
    body: "A server admin runs /set spawn in the channel where souls should appear. Chat there and souls start dropping.",
  },
  {
    title: "Catch your first soul",
    body: "When a soul appears, press its button. Each spawn stays catchable for 5 minutes.",
  },
  {
    title: "Claim packs, build a team",
    body: "Run /pack daily for your free pulls, then /team to line up your fighters for the hourly boss.",
  },
] as const;

/** "What happens after I add it?" — answers the question that stops people from clicking Add. */
export function FirstMinutes({ where }: { where: string }) {
  return (
    <section className="border-t border-line py-24" aria-labelledby="first-minutes-title">
      <div className="wrap">
        <h2 id="first-minutes-title" className="max-w-xl font-serif text-[34px] leading-tight md:text-[38px]">
          Your first five minutes
        </h2>
        <p className="lede mt-3 max-w-xl">Nothing to configure beyond one command. Here is what actually happens.</p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="panel relative p-5">
              <span className="font-mono text-[12px] text-ember-bright">0{i + 1}</span>
              <h3 className="mt-2 text-[17px] font-bold text-bone">{step.title}</h3>
              <p className="mt-2 text-[14.5px] leading-6 text-bone-dim">{step.body}</p>
            </li>
          ))}
        </ol>
        <a
          href={DISCORD_INVITE}
          data-umami-event="add-to-discord"
          data-umami-event-where={where}
          className="btn btn-fill mt-9"
        >
          Add to Discord
        </a>
      </div>
    </section>
  );
}
