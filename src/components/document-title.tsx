import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { getSoul, getWeapon } from "@/lib/catalog";
import { titleForPath } from "@/lib/titles";

export function DocumentTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const soulMatch = pathname.match(/^\/roster\/(\d+)/);
    const weaponMatch = pathname.match(/^\/weapons\/(\d+)/);
    const entity = soulMatch
      ? getSoul(soulMatch[1])?.name
      : weaponMatch
        ? getWeapon(weaponMatch[1])?.name
        : undefined;
    document.title = titleForPath(pathname, entity);
  }, [pathname]);

  return null;
}
