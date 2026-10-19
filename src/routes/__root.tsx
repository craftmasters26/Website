import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { DocumentTitle } from "@/components/document-title";
import { NotFound } from "@/components/not-found";
import AdBanner from "@/components/AdBanner";
import { APP_NAME } from "@/lib/titles";
import { useCatalogAutoSync } from "@/lib/catalog-live";
import appCss from "../styles.css?url";

const OG_DESCRIPTION =
  "Souls spawn in your Discord server. Catch them, open packs, craft rare characters and climb the leaderboard.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#070a13" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "BleachDex" },
      { property: "og:title", content: "BleachDex" },
      { property: "og:description", content: OG_DESCRIPTION },
      { property: "og:url", content: "https://bleachdex.vercel.app" },
      { property: "og:image", content: "https://bleachdex.vercel.app/brand/bot-avatar.png" },
      { property: "og:image:width", content: "256" },
      { property: "og:image:height", content: "256" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "BleachDex" },
      { name: "twitter:description", content: OG_DESCRIPTION },
      { name: "twitter:image", content: "https://bleachdex.vercel.app/brand/bot-avatar.png" },
      {
        name: "description",
        content:
          "BleachDex is a Discord bot where souls spawn in chat. Browse every soul, weapon and craft-only character, and log in with Discord to see your own collection.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "128x128", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4630325130876570",
        async: true,
        crossOrigin: "anonymous",
      },
    ],
  }),
  notFoundComponent: NotFound,
  component: RootDocument,
});

function RootDocument() {
  useCatalogAutoSync();
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <div className="site-bg">
            <DocumentTitle />
            <div className="relative z-10 flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1">
                <Outlet />
              </div>
              <div className="mx-auto w-full max-w-6xl px-4 py-6">
                <AdBanner />
              </div>
              <SiteFooter />
            </div>
          </div>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
