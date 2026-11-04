import { createFileRoute, redirect } from "@tanstack/react-router";

// Folded into the home page and the Projects page.
export const Route = createFileRoute("/what-we-make")({
  beforeLoad: () => {
    throw redirect({ to: "/projects", statusCode: 301 });
  },
});
