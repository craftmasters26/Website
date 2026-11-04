import { SITE_URL } from "@/lib/site";

/** Per-route title, unique description and canonical URL. `path` is the route path, e.g. "/projects". */
export function seo({
  title,
  description,
  path,
  noindex,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}) {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "");
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}${clean || "/"}` }],
  };
}

export function jsonLd(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}
