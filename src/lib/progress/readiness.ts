// Карта готовности к курсам ML (S5.02): какие уроки математики нужны курсу, какие ещё без галочки «знаю», как решены
// задачи итоговой проверки V.2 по фрагментам этого курса. Чистая логика: страница /ready/ и тесты.
import type { AttemptEvent } from "../exercises/types";
import type { LessonMarks } from "../content/types";
import { isKnown } from "./marks";

/**
 * Номера уроков из списка вида «I.9–I.11», «II.8–II.9★», «V.1»: диапазон — все уроки между концами в порядке курса.
 * ★ в записи — пометка, а не часть номера.
 */
export function expandNumbers(spec: readonly string[], order: readonly string[]): string[] {
  const out: string[] = [];
  for (const raw of spec) {
    const [a, b] = String(raw).replace(/★/g, "").split(/\s*[–-]\s*/) as [string, string | undefined];
    const i = order.indexOf(a);
    if (i < 0) throw new Error(`нет урока ${a}`);
    if (b === undefined) {
      out.push(a);
      continue;
    }
    const j = order.indexOf(b);
    if (j < i) throw new Error(`диапазон ${raw}: нет урока ${b} после ${a}`);
    out.push(...order.slice(i, j + 1));
  }
  return [...new Set(out)];
}

/** Уроки без галочки «знаю» — их стоит освежить до курса. */
export const toRefresh = (marks: LessonMarks, keys: readonly string[]) => keys.filter((k) => !isKnown(marks, k));

/**
 * Задачи V.2 по фрагментам курса: засчитывается первая попытка каждой задачи (как в калибровке, S4.01) —
 * после неверного ответа вторая попытка уже знает, что первая была ошибкой.
 */
export function fragmentScore(events: readonly { type: string }[], lesson: string, fragments: readonly string[]) {
  const first = new Map<string, boolean>();
  for (const e of events) {
    if (e.type !== "attempt") continue;
    const a = e as AttemptEvent;
    if (a.lesson !== lesson || first.has(a.item)) continue;
    if (fragments.some((f) => a.item.startsWith(`${f}:`))) first.set(a.item, a.correct);
  }
  return { answered: first.size, correct: [...first.values()].filter(Boolean).length };
}

/** «1 урок», «3 урока», «5 уроков». */
export const lessonsWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "урок" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "урока" : "уроков");

/** Итог по курсу: «Освежить 3 урока из 31.» или «Готов: отмечены все нужные уроки — 31.» */
export const verdictText = (left: number, total: number) => (left ? `Освежить ${left} ${lessonsWord(left)} из ${total}.` : `Готов: отмечены все нужные уроки — ${total}.`);

/** «верно 2 из 21 задачи», «из 5 задач»: после «из» — родительный падеж. */
export const v2Text = (correct: number, answered: number) =>
  answered ? `Урок V.2: с первой попытки верно ${correct} из ${answered} ${answered % 10 === 1 && answered % 100 !== 11 ? "задачи" : "задач"} по этому курсу.` : "Задачи урока V.2 по этому курсу ещё не решены.";
