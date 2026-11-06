import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** How far the visitor has got; steps before `current` show as done. */
export type OnboardingStep = 0 | 1 | 2 | 3 | 4;

const STEPS: { title: string; body: string }[] = [
  { title: "Sign in with Discord", body: "Use the same Discord account you play with." },
  { title: "Add or open the bot in a server", body: "Souls spawn in channels where BleachDex is set up." },
  { title: "Catch your first soul", body: "Use the catch button when a soul appears." },
  { title: "Open your collection", body: "Your souls, weapons and KAN show up here." },
  { title: "Climb the ranks", body: "Check the leaderboard and the rank guide." },
];

/** The five-step path from "just arrived" to "playing". Used on every empty or signed-out collection state. */
export function OnboardingChecklist({ current, className }: { current: OnboardingStep; className?: string }) {
  return (
    <section aria-labelledby="onboarding-title" className={cn("rounded-md border border-line bg-void-raised p-6", className)}>
      <h2 id="onboarding-title" className="font-serif text-[22px] leading-tight text-bone">
        Getting started
      </h2>
      <ol className="mt-5 space-y-4">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.title} className="flex items-start gap-3" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                  done && "border-ember-bright bg-ember-bright text-void",
                  active && "border-ember-bright text-bone",
                  !done && !active && "border-line-bright text-bone-faint",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                <span className="sr-only">{done ? "(done)" : active ? "(next)" : ""}</span>
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[14px] font-bold", done ? "text-bone-dim" : "text-bone")}>{step.title}</span>
                <span className="block text-[13px] leading-5 text-bone-dim">{step.body}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/bleachdex/commands" className="btn btn-outline px-5 py-2.5 text-sm">
          See the commands
        </Link>
        <Link to="/bleachdex/ranks" className="btn btn-outline px-5 py-2.5 text-sm">
          How ranks work
        </Link>
      </div>
    </section>
  );
}
