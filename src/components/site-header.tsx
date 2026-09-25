import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { botLoginUrl } from "@/lib/bot";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/list", label: "List" },
  { to: "/owned", label: "Owned" },
  { to: "/commands", label: "Commands" },
  { to: "/premium", label: "Premium" },
] as const;

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <img src="/brand/bot-avatar.png" alt="" className="size-full rounded-[inherit] object-cover" />
    </div>
  );
}

function DiscordLoginButton({ className }: { className: string }) {
  return (
    <a href={botLoginUrl("/owned")} className={className}>
      <img src="/brand/discord-mark.png" alt="" className="size-4" />
      Login with Discord
    </a>
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="wrap flex items-center justify-between py-4">
        <Link to="/" className="brand flex items-center gap-3 no-underline">
          <BrandMark />
          <span className="leading-tight">
            <span className="block font-serif text-[19px] font-bold text-bone">BleachDex</span>
            <span className="block font-mono text-[10px] tracking-[0.08em] text-bone-faint">
              SOUL REGISTRY
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {LINKS.map((link) => {
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
          <DiscordLoginButton className="btn btn-azure px-5 py-3 text-sm" />
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
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-[var(--radius-blade)] px-3 py-3 text-bone-dim hover:bg-void-raised hover:text-bone"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <DiscordLoginButton className="btn btn-azure mt-2 justify-center px-5 py-3 text-sm" />
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
          BleachDex · unofficial fan project · not affiliated with Shueisha/Studio Pierrot
        </span>
        <div className="flex flex-wrap gap-5 text-[13px] text-bone-dim">
          <Link to="/list" className="hover:text-azure-bright">
            List
          </Link>
          <Link to="/owned" className="hover:text-azure-bright">
            Owned
          </Link>
          <Link to="/commands" className="hover:text-azure-bright">
            Commands
          </Link>
          <Link to="/premium" className="hover:text-azure-bright">
            Premium
          </Link>
          <a href={botLoginUrl("/owned")} className="hover:text-azure-bright">
            Login with Discord
          </a>
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
