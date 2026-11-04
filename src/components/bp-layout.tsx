import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { discordMark } from "@/assets";
import { BLEACHDEX_URL } from "@/lib/site";
import { DISCORD_INVITE, SUPPORT_SERVER } from "@/lib/catalog";

export const BOUNDLESS_DISCORD = "https://discord.gg/unmtvJxR9h";

/** Fill these in when an account is live. Empty links are not rendered at all. */
export const SOCIAL_LINKS = {
  youtube: "",
  tiktok: "",
  instagram: "",
  discord: BOUNDLESS_DISCORD,
};

const ico = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function YouTubeIcon() {
  return (
    <svg {...ico}>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="m10 9 5 3-5 3z" fill="currentColor" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg {...ico}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

/** Only the social accounts that are live. Renders nothing for empty links (no dead buttons). */
export function Socials({ className = "btn btn-outline" }: { className?: string }) {
  const items = [
    { label: "YouTube", href: SOCIAL_LINKS.youtube, icon: <YouTubeIcon /> },
    { label: "TikTok", href: SOCIAL_LINKS.tiktok, icon: <TikTokIcon /> },
    { label: "Instagram", href: SOCIAL_LINKS.instagram, icon: <InstagramIcon /> },
    {
      label: "Discord",
      href: SOCIAL_LINKS.discord,
      icon: <img src={discordMark} alt="" width={18} height={18} className="size-[18px] rounded-[4px]" />,
    },
  ].filter((i) => i.href);
  return (
    <>
      {items.map((i) => (
        <a key={i.label} href={i.href} target="_blank" rel="noreferrer" className={className}>
          {i.icon}
          {i.label}
        </a>
      ))}
    </>
  );
}

export const COMPANY_PATHS = [
  "/",
  "/about",
  "/projects",
  "/contact-us",
  "/company-privacy",
  "/company-terms",
];

type NavItem =
  | { label: string; to: "/projects" | "/about" | "/contact-us" }
  | { label: string; href: string; external?: boolean };

const NAV: NavItem[] = [
  { to: "/projects", label: "Projects" },
  { href: BLEACHDEX_URL, label: "BleachDex" },
  { to: "/about", label: "About" },
  { href: BOUNDLESS_DISCORD, label: "Community", external: true },
  { to: "/contact-us", label: "Contact" },
];

/** Boundless mark: two linked loops (no edge, no limit) inside a rounded tile. Works from 16px up. */
export function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Boundless Production"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="bp-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b8cff" />
          <stop offset="1" stopColor="#0a3fa8" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#bp-mark-g)" />
      <path
        d="M24 24c-3.2-5.2-5.6-7-8.6-7a7 7 0 0 0 0 14c3 0 5.4-1.8 8.6-7Zm0 0c3.2 5.2 5.6 7 8.6 7a7 7 0 0 0 0-14c-3 0-5.4 1.8-8.6 7Z"
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="39.5" cy="9.5" r="2.6" fill="#f2a516" />
    </svg>
  );
}

function NavEntry({ item, onClick, mobile }: { item: NavItem; onClick?: () => void; mobile?: boolean }) {
  const cls = mobile
    ? "rounded-[var(--radius-blade)] px-3 py-3 text-bone-dim hover:bg-void-raised hover:text-bone"
    : "nav-link";
  if ("to" in item) {
    return (
      <Link
        to={item.to}
        activeOptions={{ exact: true }}
        className={cls}
        activeProps={{ className: cn(cls, !mobile && "nav-link-active", mobile && "bg-void-raised text-bone") }}
        onClick={onClick}
      >
        {item.label}
      </Link>
    );
  }
  return (
    <a
      href={item.href}
      className={cls}
      onClick={onClick}
      {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {item.label}
    </a>
  );
}

export function SkipLink() {
  return (
    <a href="#content" className="skip-link">
      Skip to main content
    </a>
  );
}

export function BpLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="site-bg">
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="site-header">
          <div className="wrap flex items-center justify-between gap-2 py-3">
            <Link to="/" className="brand flex shrink-0 items-center gap-3 no-underline" aria-label="Boundless Production home">
              <BrandMark />
              <span className="block font-serif text-[19px] font-bold leading-tight text-bone">
                Boundless<span className="hidden sm:inline"> Production</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
              {NAV.map((n) => (
                <NavEntry key={n.label} item={n} />
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-3">
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noreferrer"
                className="btn btn-fill !hidden !px-4 !py-2 sm:!inline-flex"
              >
                Add BleachDex
              </a>
              <ThemeToggle />
              <button
                ref={btnRef}
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-lg border border-line-bright text-bone lg:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="bp-mobile-nav"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <nav
            id="bp-mobile-nav"
            hidden={!open}
            className="border-t border-line px-5 py-4 lg:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-2">
              {NAV.map((n) => (
                <NavEntry key={n.label} item={n} mobile onClick={() => setOpen(false)} />
              ))}
              <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="btn btn-fill mt-2">
                Add BleachDex
              </a>
            </div>
          </nav>
        </header>

        <div id="content" tabIndex={-1} className="flex-1 outline-none">
          <main className="page-enter">{children}</main>
        </div>

        <footer className="border-t border-line py-11">
          <div className="wrap flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs text-bone-faint">
              © {new Date().getFullYear()} Boundless Production
            </span>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-bone-dim">
              <Link to="/projects" className="hover:text-azure-bright">Projects</Link>
              <a href={BLEACHDEX_URL} className="hover:text-azure-bright">BleachDex</a>
              <Link to="/about" className="hover:text-azure-bright">About</Link>
              <Link to="/contact-us" className="hover:text-azure-bright">Contact</Link>
              <a href={SUPPORT_SERVER} className="hover:text-azure-bright" target="_blank" rel="noreferrer">
                BleachDex support
              </a>
              <Link to="/company-privacy" className="hover:text-azure-bright">Privacy</Link>
              <Link to="/company-terms" className="hover:text-azure-bright">Terms</Link>
              <a href={BOUNDLESS_DISCORD} className="hover:text-azure-bright" target="_blank" rel="noreferrer">
                Discord
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function PageHead({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <section className="py-16 md:py-24">
      <div className="wrap">
        {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
        <h1 className="max-w-3xl font-serif text-[clamp(36px,8vw,64px)] leading-[1.02]">{title}</h1>
        {children ? <p className="lede mt-6">{children}</p> : null}
      </div>
    </section>
  );
}
