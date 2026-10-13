import type { ReactNode } from "react";

export const LEGAL_UPDATED = "October 11, 2026";
export const SUPPORT_URL = "https://discord.gg/RNp5d5TGPD";

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap max-w-3xl">
        <div className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-ember-bright">
          {eyebrow}
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-bone md:text-5xl">{title}</h1>
        <p className="mt-3 font-mono text-xs text-bone-faint">Last updated {LEGAL_UPDATED}</p>
        <div className="mt-10 space-y-9">{children}</div>
      </div>
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="text-lg font-semibold text-bone">{heading}</h2>
      <div className="mt-3 space-y-3 text-[14.5px] leading-7 text-bone-dim">{children}</div>
    </section>
  );
}
