import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signInWithDiscord, signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useAdminAccess } from "@/lib/admin-access";
import { botAvatar, discordMark } from "@/assets";

type NavLink = {
  to: "/" | "/list" | "/owned" | "/leaderboard" | "/commands" | "/premium" | "/admin";
  label: string;
  /** Shows a small pulsing "live" dot. */
  live?: boolean;
};

function useNavLinks(): NavLink[] {
  const user = useCurrentUser();
  const signedIn = Boolean(user) && !user?.isDevFallback;
  const admin = useAdminAccess();
  const links: NavLink[] = [
    { to: "/", label: "Home" },
    { to: "/list", label: "List" },
  ];
  // Inventory slots in after "List" once logged in.
  if (signedIn) links.push({ to: "/owned", label: "Inventory" });
  links.push(
    { to: "/leaderboard", label: "Leaderboard", live: true },
    { to: "/commands", label: "Commands" },
    { to: "/premium", label: "Premium" },
  );
  // Only people on the bot's admin list ever see this link.
  if (admin.level) links.push({ to: "/admin", label: "Admin" });
  return links;
}

function LiveDot() {
  return (
    <span
      className="ml-1.5 inline-block size-1.5 animate-pulse rounded-full bg-emerald-400 align-middle"
      aria-hidden="true"
    />
  );
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

/**
 * The phone header only has room for the logo + a small round control, so signed-in
 * visitors get just their avatar here (name + Log out live in the menu) and signed-out
 * visitors get an icon-only Discord login. From `sm` up the full controls show.
 */
function HeaderAuth() {
  const user = useCurrentUser();
  const signedIn = Boolean(user) && !user?.isDevFallback;
  const [pending, setPending] = useState(false);

  async function login() {
    setPending(true);
    try {
      await signInWithDiscord("/owned");
    } catch (err) {
      console.error(err);
      setPending(false);
    }
  }

  return (
    <>
      <div className="hidden sm:block">
        <AuthArea className="btn btn-azure !gap-1.5 !px-3.5 !py-2 !text-[13px]" />
      </div>
      <div className="sm:hidden">
        {signedIn ? (
          user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user.displayName ?? "Signed in"}
              className="size-9 shrink-0 rounded-full border border-line-bright object-cover"
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full border border-line-bright bg-void-raised font-serif text-sm text-bone">
              {(user?.displayName ?? "?").slice(0, 1).toUpperCase()}
            </span>
          )
        ) : (
          <button
            type="button"
            aria-label="Log in with Discord"
            disabled={pending}
            onClick={() => void login()}
            className="btn btn-azure !size-9 !justify-center !p-0"
          >
            <img src={discordMark} alt="" className="size-4" />
          </button>
        )}
      </div>
    </>
  );
}

function AuthArea({ className, loginClassName }: { className: string; loginClassName?: string }) {
  const user = useCurrentUser();
  const signedIn = Boolean(user) && !user?.isDevFallback;
  return signedIn ? (
    <AccountMenu className={className} />
  ) : (
    <DiscordLoginButton className={loginClassName ?? className} />
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const links = useNavLinks();

  return (
    <header className="site-header">
      <div className="wrap flex items-center justify-between gap-2 py-3">
        <Link to="/" className="brand flex shrink-0 items-center gap-3 no-underline">
          <BrandMark />
          <span className="leading-tight">
            <span className="block font-serif text-[19px] font-bold text-bone">BleachDex</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
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
                {link.live ? <LiveDot /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <HeaderAuth />
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
                {link.live ? <LiveDot /> : null}
              </Link>
            ))}
            <AuthArea
              className="mt-2 justify-between rounded-[var(--radius-blade)] border border-line px-3 py-3 [&_button]:text-[12px] [&_span]:max-w-none [&_span]:flex-1 [&_span]:text-[13.5px]"
              loginClassName="btn btn-azure mt-2 justify-center !gap-1.5 !px-3.5 !py-2 !text-[13px]"
            />
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
          BleachDex · not affiliated with Shueisha/Studio Pierrot
        </span>
        <div className="flex flex-wrap gap-5 text-[13px] text-bone-dim">
          <Link to="/list" className="hover:text-azure-bright">
            List
          </Link>
          <Link to="/owned" className="hover:text-azure-bright">
            Inventory
          </Link>
          <Link to="/leaderboard" className="hover:text-azure-bright">
            Leaderboard
          </Link>
          <Link to="/commands" className="hover:text-azure-bright">
            Commands
          </Link>
          <Link to="/premium" className="hover:text-azure-bright">
            Premium
          </Link>
          <Link to="/privacy" className="hover:text-azure-bright">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-azure-bright">
            Terms
          </Link>
          <Link to="/contact" className="hover:text-azure-bright">
            Contact
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
