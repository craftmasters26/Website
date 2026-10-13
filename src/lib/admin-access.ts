import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getAdminAccess, type AdminLevel } from "@/lib/admin";

export type AdminAccessState = { loading: boolean; level: AdminLevel | null };

/**
 * Is the signed-in visitor on the BOT's admin list? Only used to decide whether
 * to show the Admin link/page — every admin server function re-checks on the
 * server, so hiding the link is convenience, not security.
 */
export function useAdminAccess(): AdminAccessState {
  const { user, isPending } = useCurrentUserState();
  const signedIn = Boolean(user) && !user?.isDevFallback;
  const userId = user?.id ?? null;
  const [state, setState] = useState<AdminAccessState>({ loading: true, level: null });

  useEffect(() => {
    let cancelled = false;
    if (isPending) return;
    if (!signedIn) {
      setState({ loading: false, level: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    getAdminAccess()
      .then((r) => {
        if (!cancelled) setState({ loading: false, level: r.level });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, level: null });
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, signedIn, userId]);

  return state;
}
