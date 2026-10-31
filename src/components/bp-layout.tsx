import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { botAvatar } from "@/assets";
import { SUPPORT_SERVER } from "@/lib/catalog";

/** Paths that use the Boundless Production header/footer instead of BleachDex's. */
export const COMPANY_PATHS = ["/", "/about", "/what-we-make", "/projects", "/contact-us"];

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/what-we-make", label: "What we make" },
  { to: "/projects", label: "Projects" },
  { to: "/contact-us", label: "Contact" },
] as const;

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span className="font-serif text-[22px] font-bold text-bone">B</span>
    </div>
  );
}

export function BpLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="site-bg">
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="site-header">
          <div className="wrap flex items-center justify-between gap-2 py-3">
            <Link to="/" className="brand flex shrink-0 items-center gap-3 no-underline">
              <BrandMark />
              <span className="block font-serif text-[19px] font-bold leading-tight text-bone">
                Boundless Production
              </span>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: true }}
                  className="nav-link"
                  activeProps={{ className: "nav-link nav-link-active" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-3">
              <Link to="/bleachdex" className="btn btn-azure !gap-1.5 !px-3.5 !py-2 !text-[13px]">
                BleachDex
              </Link>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center border border-line-bright text-bone lg:hidden"
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
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    className="rounded-[var(--radius-blade)] px-3 py-3 text-bone-dim hover:bg-void-raised hover:text-bone"
                    onClick={() => setOpen(false)}
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </nav>
          ) : null}
        </header>

        <div className="flex-1">
          <main className="page-enter">{children}</main>
        </div>

        <footer className="border-t border-line py-11">
          <div className="wrap flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs text-bone-faint">© Boundless Production</span>
            <div className="flex flex-wrap gap-5 text-[13px] text-bone-dim">
              <Link to="/about" className="hover:text-azure-bright">About</Link>
              <Link to="/what-we-make" className="hover:text-azure-bright">What we make</Link>
              <Link to="/projects" className="hover:text-azure-bright">Projects</Link>
              <Link to="/contact-us" className="hover:text-azure-bright">Contact</Link>
              <Link to="/privacy" className="hover:text-azure-bright">Privacy</Link>
              <Link to="/terms" className="hover:text-azure-bright">Terms</Link>
              <a href={SUPPORT_SERVER} className="hover:text-azure-bright" target="_blank" rel="noreferrer">
                Discord
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <section className="py-20 md:py-24">
      <div className="wrap">
        <div className="kicker">{kicker}</div>
        <h1 className="max-w-3xl font-serif text-[44px] leading-[1.02] md:text-[64px]">{title}</h1>
        {children ? <p className="mt-6 max-w-xl text-[16.5px] leading-7 text-bone-dim">{children}</p> : null}
      </div>
    </section>
  );
}

const cardBase =
  "relative flex flex-col rounded-[10px_28px_10px_28px] border border-line-bright bg-void-raised p-7";

function Chip({ children, live }: { children: ReactNode; live?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 font-mono text-[11.5px]",
        live ? "border-azure-bright text-azure-bright" : "border-line-bright text-bone-dim",
      )}
    >
      {live ? <span className="size-1.5 rounded-full bg-azure-bright" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** BleachDex (live, links to its site) + Boundless and Scattered Stars (coming soon). */
export function ProjectCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Link
        to="/bleachdex"
        className={cn(cardBase, "no-underline transition hover:-translate-y-1 hover:border-azure-bright")}
      >
        <img src={botAvatar} alt="" className="mb-6 size-20 rounded-[var(--radius-blade)] border border-line-bright object-cover" />
        <Chip live>Live</Chip>
        <p className="mt-5 font-mono text-[12px] text-bone-faint">Discord bot</p>
        <h3 className="mt-1 font-serif text-[30px]">BleachDex</h3>
        <p className="mt-3 text-[15px] leading-6 text-bone-dim">
          Souls spawn in your server and you press a button to keep them.
        </p>
        <span className="mt-6 font-mono text-[13px] text-azure-bright">Open the website →</span>
      </Link>

      <div className={cardBase} aria-label="Boundless — coming soon">
        <div className="mb-6 flex size-20 items-center justify-center rounded-[var(--radius-blade)] border border-line-bright bg-void-raised-2 font-serif text-3xl text-bone">
          B
        </div>
        <Chip>Coming soon</Chip>
        <p className="mt-5 font-mono text-[12px] text-bone-faint">Discord bot</p>
        <h3 className="mt-1 font-serif text-[30px]">Boundless</h3>
        <p className="mt-3 text-[15px] leading-6 text-bone-dim">Our next bot. Coming soon.</p>
      </div>

      <div className={cardBase} aria-label="Scattered Stars — coming soon">
        <div className="mb-6 flex size-20 items-center justify-center rounded-[var(--radius-blade)] border border-line-bright bg-void-raised-2 text-3xl text-bone">
          ✦
        </div>
        <Chip>Coming soon</Chip>
        <p className="mt-5 font-mono text-[12px] text-bone-faint">Game</p>
        <h3 className="mt-1 font-serif text-[30px]">Scattered Stars</h3>
        <p className="mt-3 text-[15px] leading-6 text-bone-dim">Our upcoming game. Coming soon.</p>
      </div>
    </div>
  );
}

export function MakeCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className={cardBase}>
        <h3 className="font-serif text-[30px]">Games</h3>
        <p className="mt-3 text-[15px] leading-6 text-bone-dim">
          Original games with their own worlds, rules and characters.
        </p>
      </div>
      <div className={cardBase}>
        <h3 className="font-serif text-[30px]">Discord bots</h3>
        <p className="mt-3 text-[15px] leading-6 text-bone-dim">
          Bots that give servers something to do together, with a website to go with them.
        </p>
      </div>
    </div>
  );
}
