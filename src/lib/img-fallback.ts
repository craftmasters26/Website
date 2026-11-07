/**
 * If any image served from our /gh-img/ route fails to load, retry it once straight from GitHub
 * before the page's own error handling (letter placeholder) kicks in. Covers every <img> on the site.
 */
const GH_RAW = "https://raw.githubusercontent.com/craftmasters26/bleachdex/main/";
let installed = false;

export function installImageFallback() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.ghRetry) return;
      const at = img.src.indexOf("/gh-img/");
      if (at === -1) return;
      img.dataset.ghRetry = "1";
      img.removeAttribute("srcset"); // otherwise the browser keeps preferring the failed candidates
      img.removeAttribute("sizes");
      img.src = GH_RAW + img.src.slice(at + 8);
      e.stopImmediatePropagation(); // skip the component's failure handler for this first miss
    },
    true,
  );
}
