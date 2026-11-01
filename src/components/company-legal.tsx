import type { ReactNode } from "react";
import { BpLayout, BOUNDLESS_DISCORD } from "@/components/bp-layout";

export { LegalSection } from "@/components/legal-page";

export const COMPANY_LEGAL_UPDATED = "November 1, 2026";
export const companyLink = "text-azure-bright underline underline-offset-2 hover:text-bone";
export { BOUNDLESS_DISCORD };

/** Page shell for the Boundless Production (company website) legal pages. */
export function CompanyLegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <BpLayout>
      <section className="py-16 md:py-20">
        <div className="wrap max-w-3xl">
          <h1 className="font-serif text-4xl font-bold text-bone md:text-5xl">{title}</h1>
          <p className="mt-3 font-mono text-xs text-bone-faint">Last updated {COMPANY_LEGAL_UPDATED}</p>
          <div className="mt-10 space-y-9">{children}</div>
        </div>
      </section>
    </BpLayout>
  );
}
