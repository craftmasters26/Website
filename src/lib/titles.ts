const APP_NAME = "BleachDex";

const PAGE_TITLES: Record<string, string> = {
  "/": "Boundless Production — Games & Discord Bots",
  "/bleachdex": APP_NAME,
  "/about": "About — Boundless Production",
  "/what-we-make": "What we make — Boundless Production",
  "/projects": "Projects — Boundless Production",
  "/contact-us": "Contact — Boundless Production",
  "/bleachdex/list": `List · ${APP_NAME}`,
  "/bleachdex/commands": `Commands · ${APP_NAME}`,
  "/bleachdex/premium": `Premium · ${APP_NAME}`,
  "/bleachdex/privacy": `Privacy Policy · ${APP_NAME}`,
  "/bleachdex/terms": `Terms of Service · ${APP_NAME}`,
  "/bleachdex/contact": `Contact · ${APP_NAME}`,
};

export { APP_NAME };

export function titleForPath(pathname: string, entityName?: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];

  if (path.startsWith("/bleachdex/roster/") && entityName) {
    return `${entityName} · ${APP_NAME}`;
  }
  if (path.startsWith("/bleachdex/roster/")) return `Soul · ${APP_NAME}`;
  if (path.startsWith("/bleachdex/weapons/") && entityName) {
    return `${entityName} · ${APP_NAME}`;
  }
  if (path.startsWith("/bleachdex/weapons/")) return `Weapon · ${APP_NAME}`;

  return APP_NAME;
}
