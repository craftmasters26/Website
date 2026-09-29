const APP_NAME = "BleachDex";

const PAGE_TITLES: Record<string, string> = {
  "/": APP_NAME,
  "/list": `List · ${APP_NAME}`,
  "/commands": `Commands · ${APP_NAME}`,
  "/premium": `Premium · ${APP_NAME}`,
};

export { APP_NAME };

export function titleForPath(pathname: string, entityName?: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];

  if (path.startsWith("/roster/") && entityName) {
    return `${entityName} · ${APP_NAME}`;
  }
  if (path.startsWith("/roster/")) return `Soul · ${APP_NAME}`;
  if (path.startsWith("/weapons/") && entityName) {
    return `${entityName} · ${APP_NAME}`;
  }
  if (path.startsWith("/weapons/")) return `Zanpakutō · ${APP_NAME}`;

  return APP_NAME;
}
