import { createFileRoute, redirect } from "@tanstack/react-router";

// Folded into the Projects page (one fuller page instead of several thin ones).
export const Route = createFileRoute("/games")({
  beforeLoad: () => {
    throw redirect({ to: "/projects", search: { filter: "games" }, statusCode: 301 });
  },
});
