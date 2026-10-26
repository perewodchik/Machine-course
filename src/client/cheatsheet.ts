// Шпаргалка (/cheatsheet/<id>/, S5.04): по умолчанию видны только уроки с галочкой «знаю»; кнопка печатает страницу.
import { isKnown } from "../lib/progress/marks";
import { $marks } from "../lib/state/marks";

function render(): void {
  const only = document.querySelector<HTMLInputElement>("[data-sheet-known]")?.checked ?? true;
  const marks = $marks.get();
  let shown = 0;
  document.querySelectorAll<HTMLElement>("[data-sheet-lesson]").forEach((sec) => {
    const show = !only || isKnown(marks, sec.dataset.sheetLesson ?? "");
    sec.hidden = !show;
    if (show) shown++;
  });
  document.querySelector<HTMLElement>("[data-sheet-empty]")?.toggleAttribute("hidden", shown > 0);
}

document.addEventListener("change", (e) => {
  if (e.target instanceof Element && e.target.matches("[data-sheet-known]")) render();
});
document.addEventListener("click", (e) => {
  if (e.target instanceof Element && e.target.closest("[data-sheet-print]")) window.print();
});
$marks.subscribe(render);
