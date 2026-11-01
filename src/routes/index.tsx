import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { ABOUT_TEXT, BpLayout, Socials } from "@/components/bp-layout";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Boundless Production — Games & Discord Bots" }] }),
  component: CompanyHome,
});

function CompanyHome() {
  return (
    <BpLayout>
      <section className="py-20 md:py-28">
        <div className="wrap hero-seq">
          <h1 className="font-serif text-[52px] leading-[0.98] tracking-[-0.01em] md:text-[76px]">
            Boundless
            <br />
            <span className="accent-text">Production</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[17px] leading-8 text-bone-dim">{ABOUT_TEXT}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/projects" className="btn btn-fill">
              <LayoutGrid className="size-[18px]" aria-hidden="true" />
              Our projects
            </Link>
            <Socials />
          </div>
        </div>
      </section>
    </BpLayout>
  );
}
