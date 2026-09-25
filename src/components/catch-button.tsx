import { useEffect, useState } from "react";
import { useCollection } from "@/lib/collection";
import { signInWithDiscord } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function CatchButton({
  kind,
  id,
}: {
  kind: "soul" | "weapon";
  id: number;
}) {
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const hasSoul = useCollection((s) => s.hasSoul);
  const hasWeapon = useCollection((s) => s.hasWeapon);
  const catchSoul = useCollection((s) => s.catchSoul);
  const catchWeapon = useCollection((s) => s.catchWeapon);
  const releaseSoul = useCollection((s) => s.releaseSoul);
  const user = useCurrentUser();
  const signedIn = Boolean(user) && !user?.isDevFallback;

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="mt-8 h-12" />;
  }

  const owned = kind === "soul" ? hasSoul(id) : hasWeapon(id);

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {kind === "soul" && owned ? (
        <button type="button" className="btn btn-outline" onClick={() => releaseSoul(id)}>
          Release from registry
        </button>
      ) : owned ? (
        <p className="font-mono text-sm text-azure-bright">Registered in your armory.</p>
      ) : (
        <button
          type="button"
          className="btn btn-fill"
          onClick={() => {
            if (kind === "soul") catchSoul(id);
            else catchWeapon(id);
          }}
        >
          {kind === "soul" ? "Catch soul" : "Claim blade"}
        </button>
      )}
      {signedIn ? null : (
        <button
          type="button"
          className="btn btn-outline"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              await signInWithDiscord("/owned");
            } catch (err) {
              console.error(err);
              setPending(false);
            }
          }}
        >
          {pending ? "Redirecting…" : "Login with Discord"}
        </button>
      )}
    </div>
  );
}
