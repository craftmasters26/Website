/**
 * Responsive image helpers. Catalog art is served through our /gh-img/ route, which can resize it
 * and convert it to WebP (see server/routes/gh-img). Other URLs (dev server, external) are left alone.
 */
export const IMG_WIDTHS = [240, 360, 480, 720] as const;

export function isOptimisable(src: string): boolean {
  return src.startsWith("/gh-img/");
}

export function imgVariant(src: string, width: number): string {
  return isOptimisable(src) ? `${src}${src.includes("?") ? "&" : "?"}w=${width}` : src;
}

/** `srcset` string for catalog art, or undefined when the source can't be resized. */
export function imgSrcSet(src: string): string | undefined {
  if (!isOptimisable(src)) return undefined;
  return IMG_WIDTHS.map((w) => `${imgVariant(src, w)} ${w}w`).join(", ");
}

/** Sensible `sizes` for the layouts the site uses. */
export const SIZES = {
  /** Grid cards on the List page: 2 columns on phones up to ~6 on desktop. */
  card: "(min-width: 1024px) 190px, (min-width: 640px) 25vw, 46vw",
  /** Large hero / detail image. */
  hero: "(min-width: 768px) 340px, 80vw",
  /** Small thumbnails. */
  thumb: "120px",
} as const;
