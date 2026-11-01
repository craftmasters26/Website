import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { DocumentTitle } from "@/components/document-title";
import { NotFound } from "@/components/not-found";
import { COMPANY_PATHS } from "@/components/bp-layout";
import AdBanner from "@/components/AdBanner";
import { useCatalogAutoSync } from "@/lib/catalog-live";
import appCss from "../styles.css?url";
import { SITE_URL } from "@/lib/site";

const OG_DESCRIPTION =
  "Boundless Production is an independent studio making games and Discord bots. Home of BleachDex, with Boundless and Scattered Stars coming soon.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Boundless Production — Games & Discord Bots" },
      { name: "theme-color", content: "#d9eeff" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Boundless Production" },
      { property: "og:title", content: "Boundless Production" },
      { property: "og:description", content: OG_DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}/brand/bot-avatar.png` },
      { property: "og:image:width", content: "256" },
      { property: "og:image:height", content: "256" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Boundless Production" },
      { name: "twitter:description", content: OG_DESCRIPTION },
      { name: "twitter:image", content: `${SITE_URL}/brand/bot-avatar.png` },
      {
        name: "description",
        content:
          "Boundless Production is an independent studio making games and Discord bots — including BleachDex, where souls spawn in your server.",
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
  // The company pages (/, /about, /what-we-make, /projects, /contact-us) have its own header/footer and no ad slot;
  // every other route keeps the BleachDex chrome.
  const isCompanyHome = useRouterState({
    select: (s) => COMPANY_PATHS.includes(s.location.pathname.replace(/\/+$/, "") || "/"),
  });
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <DocumentTitle />
          {isCompanyHome ? (
            <Outlet />
          ) : (
            <div className="site-bg">
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
          )}
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
