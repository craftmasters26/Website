import { createFileRoute } from "@tanstack/react-router";
import { BpLayout, GameCards, PageHead } from "@/components/bp-layout";

export const Route = createFileRoute("/games")({
  head: () => ({ meta: [{ title: "Games — Boundless Production" }] }),
  component: Games,
});

function Games() {
  return (
    <BpLayout>
      <PageHead title="Our games.">All of our games are listed here.</PageHead>
      <section className="pb-24">
        <div className="wrap">
          <GameCards />
        </div>
      </section>
    </BpLayout>
  );
}
