import { createFileRoute, Link } from "@tanstack/react-router";
import { BpLayout, PageHead } from "@/components/bp-layout";
import { SUPPORT_SERVER } from "@/lib/catalog";

export const Route = createFileRoute("/contact-us")({
  head: () => ({ meta: [{ title: "Contact — Boundless Production" }] }),
  component: ContactUs,
});

function ContactUs() {
  return (
    <BpLayout>
      <PageHead kicker="Contact" title="Get in touch." />
      <section className="pb-24">
        <div className="wrap flex flex-wrap gap-4">
          <a href={SUPPORT_SERVER} target="_blank" rel="noreferrer" className="btn btn-fill">
            Join our Discord
          </a>
          <Link to="/contact" className="btn btn-outline">
            BleachDex support
          </Link>
        </div>
      </section>
    </BpLayout>
  );
}
