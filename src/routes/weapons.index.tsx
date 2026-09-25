import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/weapons/")({
  beforeLoad: () => {
    throw redirect({ to: "/list", search: { kind: "weapon" } });
  },
});
