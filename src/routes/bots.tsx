import { createFileRoute } from "@tanstack/react-router";
import { BotCards, BpLayout, PageHead } from "@/components/bp-layout";

export const Route = createFileRoute("/bots")({
  head: () => ({ meta: [{ title: "Discord bots — Boundless Production" }] }),
  component: Bots,
});

function Bots() {
  return (
    <BpLayout>
      <PageHead title="Our Discord bots.">Click BleachDex to open its website.</PageHead>
      <section className="pb-24">
        <div className="wrap">
          <BotCards />
        </div>
      </section>
    </BpLayout>
  );
}
