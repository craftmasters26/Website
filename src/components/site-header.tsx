import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signInWithDiscord, signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { botAvatar, discordMark } from "@/assets";

const BASE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/list", label: "List" },
  { to: "/commands", label: "Commands" },
  { to: "/premium", label: "Premium" },
] as const;

const INVENTORY_LINK = { to: "/owned", label: "Inventory" } as const;

function useNavLinks() {
  const user = useCurrentUser();
  const signedIn = Boolean(user) && !user?.isDevFallback;
  // Inventory slots in after "List" — 4 links signed out, 5 once logged in.
  return signedIn
    ? [BASE_LINKS[0], BASE_LINKS[1], INVENTORY_LINK, BASE_LINKS[2], BASE_LINKS[3]]
    : BASE_LINKS;
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <img src={botAvatar} alt="BleachDex logo" className="size-full rounded-[inherit] object-cover" />
    </div>
  );
}

/**
 * Real, direct Discord sign-in — Better Auth's native `discord` provider
 * (see `src/lib/auth/server.ts`), not the bot's own server. Clicking this
 * never leaves bleachdex.vercel.app for anything other than Discord's own
 * consent screen, and Discord redirects straight back here.
 */
function DiscordLoginButton({ className }: { className: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className={className}
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
      <img src={discordMark} alt="" className="size-3.5" />
      {pending ? "…" : "Login"}
    </button>
  );
}

/** Signed-in state: avatar, name, and a log-out control — replaces the login button. */
function AccountMenu({ className }: { className?: string }) {
  const user = useCurrentUser();
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {user?.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt=""
          className="size-8 shrink-0 rounded-full border border-line-bright object-cover"
        />
      ) : null}
      <span className="max-w-[9rem] truncate font-mono text-[12.5px] text-bone-dim">
        {user?.displayName ?? "Signed in"}
      </span>
      <button
        type="button"
        className="font-mono text-[11px] text-bone-faint underline-offset-4 hover:text-bone hover:underline"
        onClick={() => signOut("/")}
      >
        Log out
      </button>
    </div>
  );
}

function AuthArea({ className }: { className: string }) {
  const user = useCurrentUser();
  const signedIn = Boolean(user) && !user?.isDevFallback;
  return signedIn ? <AccountMenu className={className} /> : <DiscordLoginButton className={className} />;
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const links = useNavLinks();

  return (
    <header className="site-header">
      <div className="wrap flex items-center justify-between gap-3 py-3">
        <Link to="/" className="brand flex min-w-0 items-center gap-3 no-underline">
          <BrandMark />
          <span className="leading-tight">
            <span className="block font-serif text-[19px] font-bold text-bone">BleachDex</span>
            <span className="block font-mono text-[10px] tracking-[0.08em] text-bone-faint">
              SOUL REGISTRY
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {links.map((link) => {
            const active =
              link.to === "/"
                ? pathname === "/"
                : pathname === link.to || pathname.startsWith(`${link.to}/`);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn("nav-link", active && "nav-link-active")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <AuthArea className="btn btn-azure !gap-1.5 !px-3.5 !py-2 !text-[13px]" />
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius-blade)] border border-line-bright text-bone lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-line px-5 py-4 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-[var(--radius-blade)] px-3 py-3 text-bone-dim hover:bg-void-raised hover:text-bone"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <AuthArea className="btn btn-azure mt-2 justify-center !gap-1.5 !px-3.5 !py-2 !text-[13px]" />
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-11">
      <div className="wrap flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-xs text-bone-faint">
          BleachDex
        </span>
        <div className="flex flex-wrap gap-5 text-[13px] text-bone-dim">
          <Link to="/list" className="hover:text-azure-bright">
            List
          </Link>
          <Link to="/owned" className="hover:text-azure-bright">
            Inventory
          </Link>
          <Link to="/commands" className="hover:text-azure-bright">
            Commands
          </Link>
          <Link to="/premium" className="hover:text-azure-bright">
            Premium
          </Link>
          <a
            href="https://discord.gg/RNp5d5TGPD"
            className="hover:text-azure-bright"
            target="_blank"
            rel="noreferrer"
          >
            Support server
          </a>
        </div>
      </div>
    </footer>
  );
}
