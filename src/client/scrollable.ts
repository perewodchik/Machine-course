// Прокручиваемые блоки (широкая формула или код на узком экране) доступны с клавиатуры: tabindex=0,
// только пока содержимое действительно шире блока — иначе лишняя остановка Tab.
// У формулы — role="group" с подписью: aria-label без роли на div запрещён.
const SELECTOR = ".katex-display, pre, .scroll-x, .step__math, .table-wrap";
const LABEL = "Формула, прокрутка по горизонтали";
const TABLE_LABEL = "Таблица, прокрутка по горизонтали";

function mark(): void {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    const isMath = el.matches(".katex-display, .step__math");
    const label = el.matches(".table-wrap") ? TABLE_LABEL : isMath ? LABEL : null;
    // без допуска: axe считает прокручиваемым и блок, вылезающий на 1 px из-за округления
    if (el.scrollWidth > el.clientWidth) {
      el.tabIndex = 0;
      if (label && !el.hasAttribute("aria-label")) {
        el.setAttribute("role", "group");
        el.setAttribute("aria-label", label);
      }
    } else if (el.tabIndex === 0) {
      el.removeAttribute("tabindex");
      if (el.getAttribute("aria-label") === LABEL || el.getAttribute("aria-label") === TABLE_LABEL) {
        el.removeAttribute("aria-label");
        el.removeAttribute("role");
      }
    }
  });
}

mark();
// шрифты KaTeX грузятся, когда формула впервые отрисована, и меняют её ширину
void document.fonts?.ready.then(mark);
document.fonts?.addEventListener("loadingdone", mark);
new ResizeObserver(mark).observe(document.documentElement);
