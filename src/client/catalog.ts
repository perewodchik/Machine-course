// Каталог курсов на главной (S7.01): полоски «знаю» на карте, кнопка «Продолжить» у курса (первый обязательный урок
// без галочки, у которого уже есть текст) и подсветка маршрута. Счётчики «Знаю N из M» обновляет src/client/know.ts.
import { isKnown } from "../lib/progress/marks";
import { $marks } from "../lib/state/marks";

interface Item {
  key: string;
  number: string;
  href: string;
  written: boolean;
}

function render(): void {
  const marks = $marks.get();
  document.querySelectorAll<SVGGElement>("[data-node]").forEach((node) => {
    const keys = JSON.parse(node.dataset.lessons ?? "[]") as string[];
    const known = keys.filter((k) => isKnown(marks, k)).length;
    const bar = node.querySelector<SVGRectElement>("[data-bar]");
    if (bar) bar.setAttribute("width", String(keys.length ? (Number(bar.dataset.full) * known) / keys.length : 0));
    node.classList.toggle("is-started", known > 0);
  });
  document.querySelectorAll<HTMLElement>("[data-course-row]").forEach((row) => {
    const items = JSON.parse(row.dataset.lessons ?? "[]") as Item[];
    const btn = row.querySelector<HTMLAnchorElement>("[data-continue]");
    if (!btn) return;
    const started = items.some((l) => isKnown(marks, l.key));
    const next = items.find((l) => l.written && !isKnown(marks, l.key));
    if (next) {
      btn.href = next.href;
      btn.textContent = `${started ? "Продолжить" : "Начать"}: ${next.number}`;
      btn.classList.add("btn--primary");
    } else {
      btn.textContent = items.length && items.every((l) => isKnown(marks, l.key)) ? "Курс пройден" : "Программа курса";
      btn.classList.remove("btn--primary");
    }
  });
}

function route(id: string): void {
  const map = document.querySelector("[data-map]");
  const on = id === "all" ? null : new Set([...document.querySelectorAll<HTMLElement>("[data-course-row]")].filter((r) => (r.dataset.routes ?? "").split(" ").includes(id)).map((r) => r.dataset.courseRow));
  map?.classList.toggle("has-route", !!on);
  document.querySelectorAll<SVGGElement>("[data-node]").forEach((n) => n.classList.toggle("on-route", !!on?.has(n.dataset.node)));
  document.querySelectorAll<SVGPathElement>("[data-edge]").forEach((e) => {
    const [a, b] = (e.dataset.edge ?? "").split(" ");
    e.classList.toggle("on-route", !!on?.has(a) && !!on?.has(b));
  });
  document.querySelectorAll<HTMLElement>("[data-course-row]").forEach((r) => r.classList.toggle("is-off-route", !!on && !on.has(r.dataset.courseRow)));
}

document.addEventListener("change", (e) => {
  if (e.target instanceof HTMLInputElement && e.target.name === "route") route(e.target.value);
});
$marks.subscribe(render);
