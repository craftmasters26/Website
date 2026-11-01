import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { botAvatar, discordMark } from "@/assets";
<<<<<<< HEAD
import { BLEACHDEX_URL } from "@/lib/site";
=======
>>>>>>> 1b6b405a67324b36d9de831190e529232c97c2c5

/** Paths that use the Boundless Production header/footer instead of BleachDex's. */
export const BOUNDLESS_DISCORD = "https://discord.gg/unmtvJxR9h";

/** Fill in the empty links when the accounts are ready; buttons with no link show as "coming soon". */
export const SOCIAL_LINKS = {
  youtube: "",
  tiktok: "",
  instagram: "",
  discord: BOUNDLESS_DISCORD,
};

export const ABOUT_TEXT =
  "We\u2019re Boundless Production: we strive to be boundless in the things we do such as the production and releasing of games, and discord bots, but being boundless demands of us having no limits, and as such we will strive to be limitless not only in how we do things, but in the things we do for that is what it means to be Boundless Production.";

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

/** YouTube, TikTok, Instagram and Discord buttons (render inside a flex row). */
export function Socials() {
  const items = [
    { label: "YouTube", href: SOCIAL_LINKS.youtube, icon: <YouTubeIcon /> },
    { label: "TikTok", href: SOCIAL_LINKS.tiktok, icon: <TikTokIcon /> },
    { label: "Instagram", href: SOCIAL_LINKS.instagram, icon: <InstagramIcon /> },
    {
      label: "Discord",
      href: SOCIAL_LINKS.discord,
      icon: <img src={discordMark} alt="" className="size-[18px] rounded-[4px]" />,
    },
  ];
  return (
    <>
      {items.map((i) => (
        <a
          key={i.label}
          href={i.href || undefined}
          target={i.href ? "_blank" : undefined}
          rel="noreferrer"
          aria-disabled={i.href ? undefined : true}
          title={i.href ? undefined : "Link coming soon"}
          className={cn("btn btn-outline", !i.href && "cursor-default opacity-60")}
        >
          {i.icon}
          {i.label}
        </a>
      ))}
    </>
  );
}

<<<<<<< HEAD
export const COMPANY_PATHS = [
  "/",
  "/what-we-make",
  "/games",
  "/bots",
  "/projects",
  "/contact-us",
  "/company-privacy",
  "/company-terms",
];
=======
export const COMPANY_PATHS = ["/", "/about", "/what-we-make", "/projects", "/contact-us"];
>>>>>>> 1b6b405a67324b36d9de831190e529232c97c2c5

const NAV = [
  { to: "/", label: "Home" },
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
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-lg border border-line-bright text-bone lg:hidden"
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
              <Link to="/what-we-make" className="hover:text-azure-bright">What we make</Link>
              <Link to="/projects" className="hover:text-azure-bright">Projects</Link>
              <Link to="/contact-us" className="hover:text-azure-bright">Contact</Link>
<<<<<<< HEAD
              <Link to="/company-privacy" className="hover:text-azure-bright">Privacy</Link>
              <Link to="/company-terms" className="hover:text-azure-bright">Terms</Link>
=======
              <Link to="/privacy" className="hover:text-azure-bright">Privacy</Link>
              <Link to="/terms" className="hover:text-azure-bright">Terms</Link>
>>>>>>> 1b6b405a67324b36d9de831190e529232c97c2c5
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

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="py-20 md:py-24">
      <div className="wrap">
        <h1 className="max-w-3xl font-serif text-[44px] leading-[1.02] md:text-[64px]">{title}</h1>
        {children ? <p className="mt-6 max-w-xl text-[16.5px] leading-7 text-bone-dim">{children}</p> : null}
      </div>
    </section>
  );
}

const cardBase =
  "relative flex flex-col rounded-[10px] border border-line-bright bg-void-raised p-7";

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

function BleachDexCard() {
  return (
    <a
      href={BLEACHDEX_URL}
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
    </a>
  );
}

function BoundlessBotCard() {
  return (
    <div className={cardBase} aria-label="Boundless — coming soon">
      <div className="mb-6 flex size-20 items-center justify-center rounded-[var(--radius-blade)] border border-line-bright bg-void-raised-2 font-serif text-3xl text-bone">
        B
      </div>
      <Chip>Coming soon</Chip>
      <p className="mt-5 font-mono text-[12px] text-bone-faint">Discord bot</p>
      <h3 className="mt-1 font-serif text-[30px]">Boundless</h3>
      <p className="mt-3 text-[15px] leading-6 text-bone-dim">Our next bot. Coming soon.</p>
    </div>
  );
}

function ScatteredStarsCard() {
  return (
    <div className={cardBase} aria-label="Scattered Stars — coming soon">
      <div className="mb-6 flex size-20 items-center justify-center rounded-[var(--radius-blade)] border border-line-bright bg-void-raised-2 text-3xl text-bone">
        ✦
      </div>
      <Chip>Coming soon</Chip>
      <p className="mt-5 font-mono text-[12px] text-bone-faint">Game</p>
      <h3 className="mt-1 font-serif text-[30px]">Scattered Stars</h3>
      <p className="mt-3 text-[15px] leading-6 text-bone-dim">Our upcoming game. Coming soon.</p>
    </div>
  );
}

/** Every project: BleachDex (live) + Boundless and Scattered Stars (coming soon). */
export function ProjectCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <BleachDexCard />
      <BoundlessBotCard />
      <ScatteredStarsCard />
    </div>
  );
}

/** All of our Discord bots. */
export function BotCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <BleachDexCard />
      <BoundlessBotCard />
    </div>
  );
}

/** All of our games. */
export function GameCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <ScatteredStarsCard />
    </div>
  );
}

const linkCard = cn(cardBase, "no-underline transition hover:-translate-y-1 hover:border-azure-bright");

export function MakeCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Link to="/games" className={linkCard}>
        <h3 className="font-serif text-[30px]">Games</h3>
        <p className="mt-3 text-[15px] leading-6 text-bone-dim">
          Original games with their own worlds, rules and characters.
        </p>
        <span className="mt-6 font-mono text-[13px] text-azure-bright">See our games</span>
      </Link>
      <Link to="/bots" className={linkCard}>
        <h3 className="font-serif text-[30px]">Discord bots</h3>
        <p className="mt-3 text-[15px] leading-6 text-bone-dim">
          Bots that give servers something to do together, with a website to go with them.
        </p>
        <span className="mt-6 font-mono text-[13px] text-azure-bright">See our bots</span>
      </Link>
    </div>
  );
}
