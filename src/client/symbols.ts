// Подсветка символов: наведение на символ в формуле или фокус на кнопке легенды подсвечивает все его вхождения.
// Делегирование событий на document: формулы и легенды могут появляться позже (острова, раскрытие вывода).
import { $activeSym } from "../lib/state/highlight";

const nameOf = (target: EventTarget | null): string | null => {
  if (!(target instanceof Element)) return null;
  const host = target.closest<HTMLElement>("[data-sym], [data-sym-key]");
  return host?.dataset.sym ?? host?.dataset.symKey ?? null;
};

document.addEventListener("pointerover", (e) => {
  const name = nameOf(e.target);
  if (name) $activeSym.set(name);
});
document.addEventListener("pointerout", (e) => {
  const from = nameOf(e.target);
  if (from && from !== nameOf(e.relatedTarget)) $activeSym.set(null);
});
document.addEventListener("focusin", (e) => {
  const name = nameOf(e.target);
  if (name) $activeSym.set(name);
});
document.addEventListener("focusout", (e) => {
  if (nameOf(e.target) && !nameOf(e.relatedTarget)) $activeSym.set(null);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $activeSym.set(null);
});

let lit: Element[] = [];
$activeSym.subscribe((name) => {
  lit.forEach((el) => el.classList.remove("is-lit"));
  lit = name
    ? [...document.querySelectorAll(`[data-sym="${CSS.escape(name)}"] .sym, [data-sym-key="${CSS.escape(name)}"]`)]
    : [];
  lit.forEach((el) => el.classList.add("is-lit"));
});
