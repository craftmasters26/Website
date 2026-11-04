import { createFileRoute } from "@tanstack/react-router";
import { BpLayout, PageHead } from "@/components/bp-layout";
import { FILTERS, ProjectsBrowser, type ProjectFilter } from "@/components/projects";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/projects")({
  validateSearch: (s: Record<string, unknown>): { filter?: ProjectFilter } => {
    const f = FILTERS.find((x) => x.id === s.filter);
    return f ? { filter: f.id } : {};
  },
  head: () =>
    seo({
      title: "Projects — Boundless Production",
      description:
        "Everything Boundless Production is making: BleachDex, our live Discord collection game, and the games and bots currently in development.",
      path: "/projects",
    }),
  component: Projects,
});

function Projects() {
  const { filter } = Route.useSearch();
  return (
    <BpLayout>
      <PageHead title="Our projects." eyebrow="Games and Discord bots">
        What is live today and what we are building next.
      </PageHead>
      <section className="pb-24">
        <div className="wrap">
          <ProjectsBrowser initial={filter ?? "all"} />
        </div>
      </section>
    </BpLayout>
  );
}
