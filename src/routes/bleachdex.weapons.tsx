import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bleachdex/weapons")({
  component: () => <Outlet />,
});
