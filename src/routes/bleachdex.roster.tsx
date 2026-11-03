import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bleachdex/roster")({
  component: () => <Outlet />,
});
