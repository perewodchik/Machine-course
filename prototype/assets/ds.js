/* Витрина: образцы цветов читают значения токенов текущей темы и считают контраст к --paper */
function hexToLum(hex) {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const ratio = (a, b) => { const [x, y] = [hexToLum(a), hexToLum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const DECOR = new Set(["paper", "paper-2", "surface", "grid", "rule", "pen-wash", "margin-line", "highlighter"]);

function renderSwatches() {
  const css = getComputedStyle(document.documentElement);
  const paper = css.getPropertyValue("--paper").trim();
  document.querySelectorAll("[data-tokens]").forEach((box) => {
    box.innerHTML = box.dataset.tokens.split(" ").map((name) => {
      const hex = css.getPropertyValue(`--${name}`).trim();
      const note = DECOR.has(name) ? "фон или линия" : `${ratio(hex, paper).toFixed(1)}:1`;
      return `<div class="swatch"><div class="swatch__chip" style="background:var(--${name})"></div><b>${name}</b><code>${hex}</code> ${note}</div>`;
    }).join("");
  });
}
document.addEventListener("DOMContentLoaded", renderSwatches);
document.addEventListener("click", (e) => { if (e.target.closest("[data-theme-toggle]")) setTimeout(renderSwatches, 0); });
