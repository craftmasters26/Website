import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bleachdex/weapons/")({
  beforeLoad: () => {
    throw redirect({ to: "/bleachdex/list", search: { kind: "weapon" } });
  },
});
