// Прокручиваемые блоки (широкая формула или код на узком экране) доступны с клавиатуры: tabindex=0,
// только пока содержимое действительно шире блока — иначе лишняя остановка Tab.
const SELECTOR = ".katex-display, pre, .scroll-x";

function mark(): void {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    // без допуска: axe считает прокручиваемым и блок, вылезающий на 1 px из-за округления
    if (el.scrollWidth > el.clientWidth) {
      el.tabIndex = 0;
      if (!el.hasAttribute("aria-label") && el.matches(".katex-display")) el.setAttribute("aria-label", "Формула, прокрутка по горизонтали");
    } else if (el.tabIndex === 0) {
      el.removeAttribute("tabindex");
      if (el.getAttribute("aria-label") === "Формула, прокрутка по горизонтали") el.removeAttribute("aria-label");
    }
  });
}

mark();
// шрифты KaTeX грузятся, когда формула впервые отрисована, и меняют её ширину
void document.fonts?.ready.then(mark);
document.fonts?.addEventListener("loadingdone", mark);
new ResizeObserver(mark).observe(document.documentElement);
