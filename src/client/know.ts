// Галочки «знаю» на странице: все чекбоксы одного урока синхронны, счётчики в шапке, у модулей оглавления
// и на главной пересчитываются, верная итоговая проверка урока ставит отметку сама, прогресс — в файл и из файла.
import type { LessonKey, LessonMarks } from "../lib/content/types";
import { countKnown, isKnown, MarksFormatError } from "../lib/progress/marks";
import { $marks, exportFile, importFile, mark } from "../lib/state/marks";

function render(marks: LessonMarks): void {
  document.querySelectorAll<HTMLInputElement>("input[data-know]").forEach((box) => {
    box.checked = isKnown(marks, box.dataset.know ?? "");
  });
  // шапка и главная: «Знаю N из M уроков» по обязательным урокам курса
  document.querySelectorAll<HTMLElement>("[data-progress-lessons]").forEach((el) => {
    const keys = JSON.parse(el.dataset.progressLessons ?? "[]") as string[];
    const { known, total } = countKnown(marks, keys.map((key) => ({ key })));
    el.querySelectorAll("[data-known-total]").forEach((x) => (x.textContent = String(known)));
    const bar = el.querySelector<HTMLElement>("[data-known-bar]");
    if (bar) bar.style.width = `${Math.round((100 * known) / Math.max(1, total))}%`;
  });
  // модули оглавления: счётчик «k/m», когда отмечены все — зелёная галочка вместо него
  document.querySelectorAll<HTMLElement>(".toc__part").forEach((part) => {
    const keys = [...new Set([...part.querySelectorAll<HTMLInputElement>("input[data-know]:not([data-optional])")].map((b) => b.dataset.know ?? ""))];
    if (!keys.length) return;
    const k = keys.filter((key) => isKnown(marks, key)).length;
    part.querySelectorAll("[data-known-count]").forEach((x) => (x.textContent = String(k)));
    const all = k === keys.length;
    part.querySelector<HTMLElement>(".toc__part-head .count")?.toggleAttribute("hidden", all);
    part.querySelector("[data-module-done]")?.toggleAttribute("hidden", !all);
  });
}

document.addEventListener("change", (e) => {
  const box = e.target instanceof HTMLInputElement && e.target.matches("input[data-know]") ? e.target : null;
  if (box?.dataset.know) mark(box.dataset.know as LessonKey, box.checked, "learner");
});

// итоговая проверка урока решена верно — курс ставит галочку сам (снять её можно всегда)
document.addEventListener("exercise:final-correct", (e) => {
  const { lesson } = (e as CustomEvent<{ lesson: string }>).detail;
  if (!lesson || isKnown($marks.get(), lesson)) return;
  mark(lesson as LessonKey, true, "lesson-check");
  const feedback = (e.target as HTMLElement).querySelector("[data-feedback]");
  feedback?.insertAdjacentHTML("beforeend", " <span>Урок отмечен: «знаю».</span>");
});

// прогресс файлом: Safari стирает localStorage через 7 дней без визитов, файл — страховка и перенос на другое устройство
document.addEventListener("click", (e) => {
  if (!(e.target instanceof Element) || !e.target.closest("[data-marks-export]")) return;
  const url = URL.createObjectURL(new Blob([exportFile()], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `ml-courses-progress-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  URL.revokeObjectURL(url);
});

document.addEventListener("change", async (e) => {
  const input = e.target instanceof HTMLInputElement && e.target.matches("[data-marks-import]") ? e.target : null;
  const file = input?.files?.[0];
  if (!input || !file) return;
  const status = input.closest("[data-progress-file]")?.querySelector("[data-marks-status]");
  try {
    const n = importFile(await file.text());
    if (status) status.textContent = `Загружено отметок: ${n}.`;
  } catch (err) {
    if (status) status.textContent = `Не получилось: ${err instanceof MarksFormatError ? err.message : "файл не прочитан"}.`;
  } finally {
    input.value = "";
  }
});

$marks.subscribe(render);
