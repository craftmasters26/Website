import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { DocumentTitle } from "@/components/document-title";
import { NotFound } from "@/components/not-found";
import { COMPANY_PATHS, SkipLink } from "@/components/bp-layout";
import AdBanner from "@/components/AdBanner";
import { useCatalogAutoSync } from "@/lib/catalog-live";
import { installErrorReporter } from "@/lib/error-reporter";
import { installImageFallback } from "@/lib/img-fallback";
import { installClickTracking } from "@/lib/track";
import appCss from "../styles.css?url";
import { SITE_URL } from "@/lib/site";

const OG_DESCRIPTION =
  "Boundless Production is an independent studio making games and Discord bots. Home of BleachDex, with Boundless and Scattered Stars in development.";

// Runs before first paint so there is no flash of the wrong theme.
const THEME_INIT = `try{var t=localStorage.getItem("bp-theme");if(t!=="light"&&t!=="dark"){t="dark"}document.documentElement.dataset.theme=t}catch(e){}`;

// Optional privacy-friendly analytics (Umami). Nothing loads unless both build-time vars are set.
const UMAMI_SRC = (import.meta.env.VITE_UMAMI_SRC as string | undefined)?.trim();
const UMAMI_ID = (import.meta.env.VITE_UMAMI_ID as string | undefined)?.trim();

/** Ads never appear on account, payment, legal or admin pages. */
const NO_AD = /^\/bleachdex\/(admin|checkout|premium|owned|privacy|terms|contact)(\/|$)/;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Boundless Production — Games & Discord Bots" },
      { name: "theme-color", content: "#0a1226" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Boundless Production" },
      { property: "og:title", content: "Boundless Production" },
      { property: "og:description", content: OG_DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}/og.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "google-adsense-account", content: "ca-pub-4630325130876570" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Boundless Production" },
      { name: "twitter:description", content: OG_DESCRIPTION },
      { name: "twitter:image", content: `${SITE_URL}/og.jpg` },
      {
        name: "description",
        content:
          "Boundless Production is an independent studio making games and Discord bots — including BleachDex, where souls spawn in your server.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "128x128", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  scripts: () => [
    { children: THEME_INIT },
    ...(UMAMI_SRC && UMAMI_ID ? [{ src: UMAMI_SRC, defer: true, "data-website-id": UMAMI_ID }] : []),
  ],
  notFoundComponent: NotFound,
  component: RootDocument,
});

function RootDocument() {
  useCatalogAutoSync();
  useEffect(() => {
    installImageFallback();
    installErrorReporter();
    installClickTracking();
  }, []);
  // The company pages (/, /about, /projects, /contact-us) have its own header/footer and no ad slot;
  // every other route keeps the BleachDex chrome.
  const isCompanyHome = useRouterState({
    select: (s) => COMPANY_PATHS.includes(s.location.pathname.replace(/\/+$/, "") || "/"),
  });
  const showAd = useRouterState({ select: (s) => !NO_AD.test(s.location.pathname) });
  return (
    <html lang="en" data-theme="dark" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <SkipLink />
        <PreviewHostBridge />
        <AuthProvider>
          <DocumentTitle />
          {isCompanyHome ? (
            <Outlet />
          ) : (
            <div className="site-bg">
              <div className="relative z-10 flex min-h-screen flex-col">
                <SiteHeader />
                <div id="content" tabIndex={-1} className="flex-1 outline-none">
                  <Outlet />
                </div>
                {showAd ? (
                  <div className="mx-auto w-full max-w-6xl px-4 py-6">
                    <AdBanner />
                  </div>
                ) : null}
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
