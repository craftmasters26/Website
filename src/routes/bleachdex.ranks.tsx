import { createFileRoute, redirect } from "@tanstack/react-router";

// Ranks became the List page. Old links keep working.
export const Route = createFileRoute("/bleachdex/ranks")({
  beforeLoad: () => {
    throw redirect({ to: "/bleachdex/list", search: { kind: "soul" } });
  },
});
