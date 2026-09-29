import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Card-style catalog artwork (roster/weapon detail, homepage hero, pack
 * previews). Falls back to a plain initial-letter tile instead of the
 * browser's broken-image icon when the art fails to load — the character and
 * weapon images live on GitHub raw (`craftmasters26/bleachdex`), so a
 * transient GitHub hiccup or a renamed/moved file shouldn't leave a broken
 * icon on the page.
 */
export function CatalogImage({
  src,
  name,
  className,
}: {
  src: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

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

  return <img src={src} alt={name} className={className} onError={() => setFailed(true)} />;
}
