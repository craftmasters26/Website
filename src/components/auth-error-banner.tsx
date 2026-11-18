import { useEffect, useState } from "react";

const MESSAGES: Record<string, string> = {
  state_mismatch: "Login expired or was started on a different address. Please try again.",
  invalid_code: "Discord rejected the login code. Please try again.",
  email_not_found: "Discord did not share an e-mail address. Please try again.",
  account_not_linked: "This Discord account could not be linked. Please contact support.",
  unable_to_create_user: "We could not create your account. Please try again shortly.",
  unable_to_create_session: "We could not start your session. Please try again shortly.",
  access_denied: "Login was cancelled on Discord.",
};

/** Shows why a Discord login bounced back (the `?error=` Better Auth appends), then cleans the URL. */
export function AuthErrorBanner() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("error");
    if (!code) return;
    setMsg(MESSAGES[code] ?? `Login failed (${code}). Please try again.`);
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  if (!msg) return null;
  return (
    <div role="alert" className="mx-auto mt-3 flex max-w-3xl items-center justify-between gap-3 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-bone">
      <span>{msg}</span>
      <button type="button" onClick={() => setMsg(null)} className="underline">Dismiss</button>
    </div>
  );
}
