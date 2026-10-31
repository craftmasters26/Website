import { createFileRoute } from "@tanstack/react-router";
import { BpLayout, PageHead } from "@/components/bp-layout";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Boundless Production" }] }),
  component: About,
});

function About() {
  return (
    <BpLayout>
      <PageHead kicker="About" title="Boundless Production">
        Boundless Production is an independent studio. We design and build games and Discord bots,
        from the first idea to the live release, and keep them running after launch.
      </PageHead>
    </BpLayout>
  );
}
