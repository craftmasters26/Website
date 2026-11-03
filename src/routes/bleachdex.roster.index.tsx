import { createFileRoute, redirect } from "@tanstack/react-router";

// Roster and Zanpakutō now live together on the List page.
export const Route = createFileRoute("/bleachdex/roster/")({
  beforeLoad: () => {
    throw redirect({ to: "/bleachdex/list", search: { kind: "soul" } });
  },
});
