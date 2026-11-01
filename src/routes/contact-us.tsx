import { createFileRoute, Link } from "@tanstack/react-router";
import { BOUNDLESS_DISCORD, BpLayout, PageHead } from "@/components/bp-layout";

export const Route = createFileRoute("/contact-us")({
  head: () => ({ meta: [{ title: "Contact — Boundless Production" }] }),
  component: ContactUs,
});

function ContactUs() {
  return (
    <BpLayout>
      <PageHead title="Get in touch." />
      <section className="pb-24">
        <div className="wrap flex flex-wrap gap-4">
          <a href={BOUNDLESS_DISCORD} target="_blank" rel="noreferrer" className="btn btn-fill">
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
