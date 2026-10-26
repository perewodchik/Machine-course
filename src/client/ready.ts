// Карта готовности (/ready/, S5.02): у каждого курса ML — итог по галочкам «знаю» нужных уроков и по задачам урока V.2
// с фрагментами этого курса. Отметки и журнал меняются на этой же странице — итог пересчитывается сразу.
import { fragmentScore, toRefresh, v2Text, verdictText } from "../lib/progress/readiness";
import { $journal } from "../lib/state/journal";
import { $marks } from "../lib/state/marks";

function render(): void {
  const marks = $marks.get();
  const events = $journal.get();
  document.querySelectorAll<HTMLElement>("[data-ready]").forEach((sec) => {
    const keys = JSON.parse(sec.dataset.keys ?? "[]") as string[];
    const left = toRefresh(marks, keys);
    const verdict = sec.querySelector<HTMLElement>("[data-ready-verdict]");
    if (verdict) {
      verdict.textContent = verdictText(left.length, keys.length);
      verdict.classList.toggle("is-ready", !left.length);
    }
    sec.querySelectorAll<HTMLElement>("[data-key]").forEach((li) => li.classList.toggle("is-left", left.includes(li.dataset.key ?? "")));
    const v2 = sec.querySelector<HTMLElement>("[data-ready-v2]");
    if (v2) {
      const s = fragmentScore(events, sec.dataset.lesson ?? "", JSON.parse(sec.dataset.fragments ?? "[]") as string[]);
      v2.textContent = v2Text(s.correct, s.answered);
    }
  });
}

$marks.subscribe(render);
$journal.subscribe(render);
