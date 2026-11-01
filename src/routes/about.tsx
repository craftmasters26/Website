import { createFileRoute } from "@tanstack/react-router";
import { ABOUT_TEXT, BpLayout, PageHead } from "@/components/bp-layout";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Boundless Production" }] }),
  component: About,
});

function About() {
  return (
    <BpLayout>
      <PageHead kicker="About" title="Boundless Production">
        {ABOUT_TEXT}
      </PageHead>
    </BpLayout>
  );
}
