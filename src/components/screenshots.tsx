import { useRef, useState, type KeyboardEvent } from "react";
import { SCREENSHOTS, shot, type Screenshot } from "@/lib/screenshots";

/** A real screenshot in a soft frame. */
export function FramedShot({ item, className = "" }: { item: Screenshot; className?: string }) {
  return (
    <figure className={`framed-shot ${className}`}>
      <img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async" />
    </figure>
  );
}

export { shot };

/** Tabbed viewer: pick a feature on the left, see the real Discord screenshot on the right. */
export function Screenshots() {
  const [i, setI] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (SCREENSHOTS.length === 0) return null;
  const active = SCREENSHOTS[i];

  function onKey(e: KeyboardEvent) {
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const n = (i + next + SCREENSHOTS.length) % SCREENSHOTS.length;
    setI(n);
    tabs.current[n]?.focus();
  }

  return (
    <section className="pb-20 md:pb-28" aria-labelledby="shots-title">
      <div className="wrap">
        <p className="eyebrow">In Discord</p>
        <h2 id="shots-title" className="section-title mt-3 mb-10 font-serif">
          See BleachDex in action.
        </h2>
        <div className="shot-viewer">
          <div className="shot-tabs" role="tablist" aria-label="BleachDex features" onKeyDown={onKey}>
            {SCREENSHOTS.map((s, n) => (
              <button
                key={s.key}
                ref={(el) => {
                  tabs.current[n] = el;
                }}
                role="tab"
                id={`shot-tab-${s.key}`}
                aria-selected={n === i}
                aria-controls="shot-panel"
                tabIndex={n === i ? 0 : -1}
                className="shot-tab"
                onClick={() => setI(n)}
              >
                <span className="shot-tab-title">{s.title}</span>
                <span className="shot-tab-text">{s.caption}</span>
              </button>
            ))}
          </div>
          <div className="shot-stage" id="shot-panel" role="tabpanel" aria-labelledby={`shot-tab-${active.key}`}>
            <div className="shot-chrome" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>BleachDex in Discord</span>
            </div>
            <div className="shot-canvas">
              {SCREENSHOTS.map((s, n) => (
                <img
                  key={s.key}
                  src={s.src}
                  alt={s.alt}
                  width={s.width}
                  height={s.height}
                  hidden={n !== i}
                  loading={n === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
