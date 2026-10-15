// Поведение упражнений (Exercise.astro): проверка ответа, подсказки лесенкой, «Ещё задача», уверенность,
// журнал попыток. Тексты уже отрисованы сервером; здесь — только показать нужное и посчитать.
import { checkMatrix, checkNumeric, checkOrder } from "../lib/exercises/check";
import { formatNumber } from "../lib/exercises/parse";
import { logEvent } from "../lib/state/journal";

type Answer =
  | { kind: "numeric"; answer: number; tol?: number; rel?: number }
  | { kind: "matrix"; answer: number[][]; tol?: number }
  | { kind: "choice" | "predict"; correct: boolean[] }
  | { kind: "order"; order: number[] };

export interface ExerciseResultDetail {
  /** Экземпляр упражнения на странице: одна задача может встречаться дважды. */
  uid: string;
  item: string;
  lesson: string;
  correct: boolean;
}

function init(root: HTMLElement): void {
  const variants = [...root.querySelectorAll<HTMLElement>("[data-variant]")];
  const feedback = root.querySelector<HTMLElement>("[data-feedback]")!;
  const checkBtn = root.querySelector<HTMLButtonElement>("[data-check]");
  const hintBtn = root.querySelector<HTMLButtonElement>("[data-hint-next]")!;
  const another = root.querySelector<HTMLButtonElement>("[data-another]");
  const { item = "", lesson = "", version, uid = "" } = root.dataset;
  let index = 0;
  let attempt = 0;
  let hints = 0;
  let started = performance.now();

  const variant = () => variants[index]!;
  const answer = () => JSON.parse(variant().querySelector("[data-answer]")!.textContent ?? "{}") as Answer;
  const confidence = () => {
    const v = root.querySelector<HTMLInputElement>(".confidence input:checked")?.value;
    return v ? (Number(v) as 1 | 2 | 3) : undefined;
  };
  const html = (sel: string) => variant().querySelector(sel)?.innerHTML ?? "";

  const say = (ok: boolean | null, head: string, body = "") => {
    feedback.className = `feedback${ok === null ? "" : ok ? " feedback--right" : " feedback--wrong"}`;
    feedback.innerHTML = `<b>${head}</b>${body ? ` <span>${body}</span>` : ""}`;
  };

  const record = (correct: boolean) => {
    attempt++;
    logEvent({
      type: "attempt",
      lesson,
      item,
      seed: Number(variant().dataset.seed),
      attempt,
      correct,
      hints,
      ms: Math.round(performance.now() - started),
      confidence: confidence(),
      generatorVersion: version ? Number(version) : undefined,
      at: new Date().toISOString(),
    });
    root.dispatchEvent(new CustomEvent<ExerciseResultDetail>("exercise:result", { bubbles: true, detail: { uid, item, lesson, correct } }));
    if (correct && root.hasAttribute("data-final")) {
      // после того как отзыв уже показан: слушатель (прогресс) может дописать в него «Урок отмечен»
      queueMicrotask(() => root.dispatchEvent(new CustomEvent("exercise:final-correct", { bubbles: true, detail: { lesson } })));
    }
  };

  const updateHintButton = () => {
    const total = variant().querySelectorAll("[data-hint]").length;
    hintBtn.hidden = total === 0;
    hintBtn.disabled = hints >= total;
    hintBtn.textContent = hints >= total ? "Подсказок больше нет" : `Подсказка ${hints + 1} из ${total}`;
  };

  const check = () => {
    const a = answer();
    const v = variant();
    if (a.kind === "numeric") {
      const input = v.querySelector<HTMLInputElement>("[data-input]")!;
      const r = checkNumeric(input.value, a.answer, a.tol, a.rel);
      if (r.value === null) {
        input.classList.remove("is-right", "is-wrong");
        say(null, "Введите число:", "например, 0.5 или −2; запятая тоже подойдёт.");
        input.focus();
        return;
      }
      input.classList.toggle("is-right", r.correct);
      input.classList.toggle("is-wrong", !r.correct);
      input.setAttribute("aria-invalid", String(!r.correct));
      record(r.correct);
      say(r.correct, r.correct ? "Верно." : "Пока нет.", `Ваш ответ: ${formatNumber(r.value)}. ${r.correct ? html("[data-right]") : html("[data-wrong]")}`);
    } else if (a.kind === "matrix") {
      const inputs = [...v.querySelectorAll<HTMLInputElement>("[data-cell]")];
      const raw = a.answer.map((row, i) => row.map((_, j) => inputs.find((x) => x.dataset.cell === `${i},${j}`)?.value ?? ""));
      const r = checkMatrix(raw, a.answer, a.tol);
      if (!r.complete) {
        say(null, "Заполните все клетки", "числами: точка и запятая подходят.");
        return;
      }
      for (const input of inputs) {
        const [i, j] = input.dataset.cell!.split(",").map(Number) as [number, number];
        const ok = r.cells[i]![j]!;
        input.classList.toggle("is-right", ok === true);
        input.classList.toggle("is-wrong", ok === false);
        input.setAttribute("aria-invalid", String(ok === false));
      }
      record(r.correct);
      const wrongCount = r.cells.flat().filter((c) => c === false).length;
      say(r.correct, r.correct ? "Верно." : `Неверных клеток: ${wrongCount}.`, r.correct ? html("[data-right]") : html("[data-wrong]"));
    } else if (a.kind === "order") {
      const items = [...v.querySelectorAll<HTMLElement>(".order > li")];
      const r = checkOrder(items.map((li) => Number(li.dataset.step)));
      items.forEach((li, i) => {
        li.classList.toggle("is-right", r.positions[i]!);
        li.classList.toggle("is-wrong", !r.positions[i]);
      });
      record(r.correct);
      const ok = r.positions.filter(Boolean).length;
      say(r.correct, r.correct ? "Верно." : `На своих местах ${ok} из ${items.length}.`, r.correct ? html("[data-right]") : html("[data-wrong]"));
    }
  };

  // выбор и прогноз: ответ — нажатие на вариант
  root.addEventListener("click", (e) => {
    const option = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("[data-option]") : null;
    if (!option || !variant().contains(option)) return;
    const a = answer();
    if (a.kind !== "choice" && a.kind !== "predict") return;
    const i = Number(option.dataset.option);
    const ok = a.correct[i] ?? false;
    const v = variant();
    v.querySelectorAll<HTMLButtonElement>("[data-option]").forEach((b) => b.setAttribute("aria-pressed", String(b === option)));
    option.classList.toggle("is-right", ok);
    option.classList.toggle("is-wrong", !ok);
    v.querySelectorAll<HTMLElement>("[data-why]").forEach((w) => (w.hidden = true));
    record(ok);
    const why = v.querySelector<HTMLElement>(`[data-why="${i}"]`)?.innerHTML ?? "";
    if (a.kind === "predict") {
      v.querySelector<HTMLElement>("[data-reveal]")!.hidden = false;
      say(ok, ok ? "Прогноз сбылся." : "Прогноз не сбылся.", why);
    } else {
      say(ok, ok ? "Верно." : "Пока нет.", why);
    }
  });

  // порядок шагов: «Выше» и «Ниже» переставляют пункт, фокус остаётся на нажатой кнопке
  root.addEventListener("click", (e) => {
    const btn = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("[data-move]") : null;
    if (!btn) return;
    const li = btn.closest("li")!;
    const up = btn.dataset.move === "up";
    const sibling = up ? li.previousElementSibling : li.nextElementSibling;
    if (!sibling) return;
    if (up) sibling.before(li);
    else sibling.after(li);
    li.parentElement?.querySelectorAll("li").forEach((x) => x.classList.remove("is-right", "is-wrong"));
    btn.focus();
  });

  checkBtn?.addEventListener("click", check);
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.matches("[data-input], [data-cell]")) {
      e.preventDefault();
      check();
    }
  });

  hintBtn.addEventListener("click", () => {
    const list = [...variant().querySelectorAll<HTMLElement>("[data-hint]")];
    const next = list[hints];
    if (!next) return;
    next.hidden = false;
    hints++;
    updateHintButton();
  });

  another?.addEventListener("click", () => {
    variant().hidden = true;
    index = (index + 1) % variants.length;
    const v = variant();
    v.hidden = false;
    // новая задача — с чистого листа
    v.querySelectorAll<HTMLInputElement>("input").forEach((x) => {
      x.value = "";
      x.classList.remove("is-right", "is-wrong");
      x.removeAttribute("aria-invalid");
    });
    v.querySelectorAll("[data-hint]").forEach((h) => ((h as HTMLElement).hidden = true));
    v.querySelectorAll("[data-option]").forEach((b) => {
      b.classList.remove("is-right", "is-wrong");
      b.setAttribute("aria-pressed", "false");
    });
    v.querySelectorAll<HTMLElement>("[data-why], [data-reveal]").forEach((w) => (w.hidden = true));
    attempt = 0;
    hints = 0;
    started = performance.now();
    feedback.className = "feedback";
    feedback.textContent = "";
    updateHintButton();
    v.focus();
  });

  updateHintButton();
}

document.querySelectorAll<HTMLElement>("[data-exercise]").forEach(init);

// Итоговая проверка модуля: сводка по последнему ответу на каждую задачу
document.querySelectorAll<HTMLElement>("[data-exercise-set]").forEach((set) => {
  const results = new Map<string, { lesson: string; correct: boolean }>();
  const summary = set.querySelector<HTMLElement>("[data-summary]")!;
  const total = Number(summary.dataset.total);
  set.addEventListener("exercise:result", (e) => {
    const { uid, lesson, correct } = (e as CustomEvent<ExerciseResultDetail>).detail;
    results.set(uid, { lesson, correct });
    const right = [...results.values()].filter((r) => r.correct);
    summary.textContent = `Решено верно: ${right.length} из ${total}.`;
    set.querySelectorAll<HTMLElement>("[data-set-lesson]").forEach((li) => {
      const n = right.filter((r) => r.lesson === li.dataset.setLesson).length;
      li.querySelector("[data-count]")!.textContent = String(n);
    });
  });
});
