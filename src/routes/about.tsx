import { createFileRoute, Link } from "@tanstack/react-router";
import { BOUNDLESS_DISCORD, BpLayout, PageHead } from "@/components/bp-layout";
import { seo } from "@/lib/seo";
import { BLEACHDEX_URL } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () =>
    seo({
      title: "About — Boundless Production",
      description:
        "Boundless Production is an independent studio building collectible games and Discord bots around communities and repeat play.",
      path: "/about",
    }),
  component: About,
});

const PRINCIPLES = [
  ["Built around communities", "Every project starts from how a group of people will actually play it together."],
  ["Made for repeat play", "Daily rewards, progression and events give players a reason to come back."],
  ["Discord-native", "Our games live where players already talk, so there is nothing extra to install."],
  ["Updated in the open", "New content and fixes ship regularly, and the community helps decide what comes next."],
];

function About() {
  return (
    <BpLayout>
      <PageHead title="An independent studio for community games." eyebrow="About">
        Boundless Production designs and builds collectible games and interactive Discord bots. Our
        first live project is BleachDex, and more games and bots are in development.
      </PageHead>
      <section className="pb-20">
        <div className="wrap grid gap-5 md:grid-cols-2">
          {PRINCIPLES.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line-bright bg-void-raised p-7">
              <h2 className="font-serif text-[24px]">{t}</h2>
              <p className="mt-2 text-[15.5px] leading-7 text-bone-dim">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="pb-24">
        <div className="wrap hero-actions">
          <a href={BLEACHDEX_URL} className="btn btn-fill">Explore BleachDex</a>
          <Link to="/projects" className="btn btn-outline">View all projects</Link>
          <a href={BOUNDLESS_DISCORD} target="_blank" rel="noreferrer" className="btn btn-outline">
            Join our Discord
          </a>
        </div>
      </section>
    </BpLayout>
  );
}
