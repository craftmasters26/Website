import { createFileRoute } from "@tanstack/react-router";
import { BpLayout, PageHead, ProjectCards } from "@/components/bp-layout";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — Boundless Production" }] }),
  component: Projects,
});

function Projects() {
  return (
    <BpLayout>
      <PageHead kicker="Projects" title="Our projects.">
        Click BleachDex to open its website. The others are coming soon.
      </PageHead>
      <section className="pb-24">
        <div className="wrap">
          <ProjectCards />
        </div>
      </section>
    </BpLayout>
  );
}
