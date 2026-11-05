import { createFileRoute } from "@tanstack/react-router";
import { BpLayout } from "@/components/bp-layout";
import {
  CommunityCta,
  FeaturedBleachDex,
  FinalCta,
  Hero,
  HowItWorks,
  TrustStrip,
  WhatWeMake,
} from "@/components/home-sections";
import { ProjectsSummary } from "@/components/projects";
import { jsonLd, seo } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { BOUNDLESS_DISCORD } from "@/components/bp-layout";

export const Route = createFileRoute("/")({
  head: () => ({
    ...seo({
      title: "Boundless Production — Games & Discord experiences",
      description:
        "Boundless Production is an independent studio making collectible games and Discord bots. Home of BleachDex, a live character-collection game for Discord.",
      path: "/",
    }),
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            name: "Boundless Production",
            url: SITE_URL,
            sameAs: [BOUNDLESS_DISCORD],
          },
          { "@type": "WebSite", name: "Boundless Production", url: SITE_URL },
        ],
      }),
    ],
  }),
  component: CompanyHome,
});

function CompanyHome() {
  return (
    <BpLayout>
      <Hero />
      <TrustStrip />
      <FeaturedBleachDex />
      <HowItWorks />
      <WhatWeMake />
      <section className="pb-20 md:pb-28" aria-labelledby="projects-title">
        <div className="wrap">
          <p className="eyebrow">Projects</p>
          <h2 id="projects-title" className="section-title mt-3 mb-10 font-serif">
            One game live, more on the way.
          </h2>
          <ProjectsSummary />
        </div>
      </section>
      <CommunityCta />
      <FinalCta />
    </BpLayout>
  );
}
