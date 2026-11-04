import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT = "ca-pub-4630325130876570";
const SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;

/** Loads the AdSense script once, only when an ad slot is actually on screen. */
function loadAdScript() {
  if (document.querySelector(`script[src^="https://pagead2.googlesyndication.com"]`)) return;
  const s = document.createElement("script");
  s.src = SRC;
  s.async = true;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

export default function AdBanner() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    loadAdScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    // min-height reserves the slot so the page does not jump when the ad loads.
    <div style={{ minHeight: 100 }} aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot="9681241363"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
