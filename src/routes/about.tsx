import { createFileRoute, redirect } from "@tanstack/react-router";

// The About page was folded into the home page.
export const Route = createFileRoute("/about")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
