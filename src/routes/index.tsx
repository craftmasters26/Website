import { createFileRoute, Link } from "@tanstack/react-router";
import { BpLayout, MakeCards, ProjectCards } from "@/components/bp-layout";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Boundless Production — Games & Discord Bots" }] }),
  component: CompanyHome,
});

function CompanyHome() {
  return (
    <BpLayout>
      <section className="py-20 md:py-24">
        <div className="wrap">
          <h1 className="font-serif text-[52px] leading-[0.98] tracking-[-0.01em] md:text-[76px]">
            Boundless
            <br />
            <span className="accent-text">Production</span>
          </h1>
          <p className="mt-7 max-w-md text-[16.5px] leading-7 text-bone-dim">
            We make games and Discord bots.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/projects" className="btn btn-fill">
              Our projects
            </Link>
            <Link to="/about" className="btn btn-outline">
              About us
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-24">
        <div className="wrap">
          <div className="kicker">What we make</div>
          <h2 className="mb-10 font-serif text-[38px] leading-tight">Games and Discord bots.</h2>
          <MakeCards />
        </div>
      </section>

      <section className="border-t border-line py-24">
        <div className="wrap">
          <div className="kicker">Projects</div>
          <h2 className="mb-10 font-serif text-[38px] leading-tight">Our projects.</h2>
          <ProjectCards />
        </div>
      </section>
    </BpLayout>
  );
}
