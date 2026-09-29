import { createFileRoute, redirect } from "@tanstack/react-router";

// Roster and Zanpakutō now live together on the List page.
export const Route = createFileRoute("/roster/")({
  beforeLoad: () => {
    throw redirect({ to: "/list", search: { kind: "soul" } });
  },
});
