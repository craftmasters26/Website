import { SCREENSHOTS } from "@/lib/screenshots";

/** Renders nothing until src/lib/screenshots.ts has entries. */
export function Screenshots() {
  if (SCREENSHOTS.length === 0) return null;
  return (
    <section className="pb-20 md:pb-28" aria-labelledby="shots-title">
      <div className="wrap">
        <p className="eyebrow">In Discord</p>
        <h2 id="shots-title" className="section-title mt-3 mb-10 font-serif">
          See BleachDex in action.
        </h2>
        <div className="shot-grid">
          {SCREENSHOTS.map((s) => (
            <figure className="shot" key={s.src} style={s.width / s.height > 3 ? { gridColumn: "1 / -1" } : undefined}>
              <img src={s.src} alt={s.alt} width={s.width ?? 800} height={s.height ?? 500} loading="lazy" decoding="async" />
              <figcaption>{s.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
