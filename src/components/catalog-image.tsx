import { useState } from "react";
import { cn } from "@/lib/utils";

const GH_RAW = "https://raw.githubusercontent.com/craftmasters26/bleachdex/main/";

/**
 * Card-style catalog artwork. Falls back to a plain initial-letter tile instead of the
 * browser's broken-image icon when the art fails to load. Images are lazy by default;
 * pass `priority` for the one above-the-fold hero image. Give the parent an aspect ratio
 * (or pass width/height) so the page does not jump while images load.
 */
export function CatalogImage({
  src,
  name,
  className,
  priority,
  width,
  height,
}: {
  src: string;
  name: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const [direct, setDirect] = useState(false);
  // Second chance: if our /gh-img/ route fails, try GitHub directly before giving up.
  const shown = direct && src.startsWith("/gh-img/") ? GH_RAW + src.slice(8) : src;

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-void-raised font-serif text-4xl text-line-bright",
          className,
        )}
        role="img"
        aria-label={name}
      >
        {name.slice(0, 1)}
      </div>
    );
  }

  return (
    <img
      src={shown}
      alt={name}
      width={width ?? 300}
      height={height ?? 400}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={className}
      onError={() => (src.startsWith("/gh-img/") && !direct ? setDirect(true) : setFailed(true))}
    />
  );
}
