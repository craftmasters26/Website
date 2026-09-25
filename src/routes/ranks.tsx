import { createFileRoute, redirect } from "@tanstack/react-router";

// Ranks became the List page. Old links keep working.
export const Route = createFileRoute("/ranks")({
  beforeLoad: () => {
    throw redirect({ to: "/list", search: { kind: "soul" } });
  },
});
