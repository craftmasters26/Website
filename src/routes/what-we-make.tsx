import { createFileRoute } from "@tanstack/react-router";
import { BpLayout, MakeCards, PageHead } from "@/components/bp-layout";

export const Route = createFileRoute("/what-we-make")({
  head: () => ({ meta: [{ title: "What we make — Boundless Production" }] }),
  component: WhatWeMake,
});

function WhatWeMake() {
  return (
    <BpLayout>
      <PageHead title="Games and Discord bots." />
      <section className="pb-24">
        <div className="wrap">
          <MakeCards />
        </div>
      </section>
    </BpLayout>
  );
}
