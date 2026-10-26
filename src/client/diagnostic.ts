// Входная диагностика (Diagnostic.astro, урок 0.2): показывает задачи по одной, решает по src/lib/diagnostic/plan.ts,
// какую задать следующей, ставит «знаю» за верный ответ с первой попытки и хранит ход в localStorage.
import { advance, minutesLeft, summarize, type Outcome, type PlanItem } from "../lib/diagnostic/plan";
import type { LessonKey } from "../lib/content/types";
import { mark } from "../lib/state/marks";
import type { ExerciseResultDetail } from "./exercise";


interface Saved {
  outcomes: Record<string, Outcome>;
  finished: boolean;
}

function load(KEY: string): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Saved>;
      if (v && typeof v.outcomes === "object" && v.outcomes) return { outcomes: v.outcomes, finished: !!v.finished };
    }
  } catch {
    // хранилище недоступно или испорчено — диагностика начинается заново
  }
  return { outcomes: {}, finished: false };
}

function save(KEY: string, state: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // без хранилища диагностика работает до перезагрузки страницы
  }
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

function init(root: HTMLElement): void {
  const plan = JSON.parse(root.querySelector("[data-diag-plan]")!.textContent ?? "[]") as PlanItem[];
  const budget = Number(root.dataset.budget);
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const intro = q("[data-diag-intro]");
  const start = q<HTMLButtonElement>("[data-diag-start]");
  const progress = q("[data-diag-progress]");
  const result = q("[data-diag-result]");
  const items = new Map([...root.querySelectorAll<HTMLElement>("[data-diag-item]")].map((el) => [el.dataset.diagItem!, el]));
  const key = root.dataset.storage ?? "mlf:diagnostic:v1";
  let state = load(key);
  let current: string | null = null;

  const outcomes = () => new Map(Object.entries(state.outcomes));
  const set = (lesson: string, o: Outcome) => {
    state.outcomes[lesson] = o;
    save(key, state);
  };

  const showProgress = () => {
    const done = outcomes();
    const asked = summarize(plan, done).asked;
    const left = Math.ceil(minutesLeft(plan, done, budget));
    q("[data-diag-count]").textContent = `Задача ${asked + 1}`;
    q("[data-diag-left]").textContent = left > 0 ? ` · осталось не больше ${left} ${plural(left, "минуты", "минут", "минут")}` : "";
    q<HTMLProgressElement>("[data-diag-meter]").value = done.size;
  };

  const finish = () => {
    state.finished = true;
    save(key, state);
    current = null;
    items.forEach((el) => (el.hidden = true));
    progress.hidden = true;
    const s = summarize(plan, outcomes());
    q("[data-diag-summary]").textContent =
      s.asked === 0
        ? "Ни одной задачи не решено — начните с первых уроков модуля 0."
        : `Верно решено ${s.known.length} из ${s.asked} ${plural(s.asked, "задачи", "задач", "задач")}. ` +
          (s.known.length ? `Курс отметил «знаю» у ${s.known.length} ${plural(s.known.length, "урока", "уроков", "уроков")}.` : "Отметок «знаю» нет: курс начнётся с первых уроков.");
    root.querySelectorAll<HTMLElement>("[data-diag-known]").forEach((li) => (li.hidden = !s.known.includes(li.dataset.diagKnown!)));
    root.querySelectorAll<HTMLElement>("[data-diag-route]").forEach((li) => (li.hidden = !s.route.includes(li.dataset.diagRoute!)));
    q("[data-diag-known-block]").hidden = s.known.length === 0;
    q("[data-diag-route-block]").hidden = s.route.length === 0;
    result.hidden = false;
  };

  const next = () => {
    const step = advance(plan, outcomes(), budget);
    step.skipped.forEach((l) => set(l, "skipped"));
    if (step.next === null) {
      finish();
      result.focus();
      return;
    }
    current = plan[step.next]!.lesson;
    items.forEach((el, lesson) => (el.hidden = lesson !== current));
    const el = items.get(current)!;
    el.querySelector<HTMLElement>("[data-diag-next]")!.hidden = true;
    el.querySelector<HTMLElement>("[data-diag-unknown]")!.hidden = false;
    showProgress();
    el.focus();
  };

  const begin = () => {
    intro.hidden = true;
    result.hidden = true;
    progress.hidden = false;
    next();
  };

  // ответ на задачу: засчитывается первая попытка; следующие — для себя, на итог не влияют
  root.addEventListener("exercise:result", (e) => {
    const { lesson, correct, attempt, hints } = (e as CustomEvent<ExerciseResultDetail>).detail;
    if (lesson !== current || state.outcomes[lesson]) return;
    const right = correct && attempt === 1 && hints === 0;
    set(lesson, right ? "right" : "wrong");
    // ключи уроков банка проверены валидатором (content/diagnostic.yaml)
    if (right) mark(lesson as LessonKey, true, "diagnostic");
    const el = items.get(lesson)!;
    el.querySelector<HTMLElement>("[data-diag-unknown]")!.hidden = true;
    el.querySelector<HTMLElement>("[data-diag-next]")!.hidden = false;
  });

  root.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest("button");
    if (!t || !root.contains(t)) return;
    if (t.matches("[data-diag-start]")) begin();
    else if (t.matches("[data-diag-next]")) next();
    else if (t.matches("[data-diag-unknown]") && current) {
      set(current, "wrong");
      next();
    } else if (t.matches("[data-diag-restart]")) {
      // отметки «знаю» остаются: снять их можно в оглавлении
      state = { outcomes: {}, finished: false };
      save(key, state);
      location.reload();
    }
  });

  if (state.finished) {
    q("[data-diag-resume]").hidden = false;
    start.hidden = true;
    finish();
  } else if (Object.keys(state.outcomes).length > 0) {
    start.textContent = "Продолжить диагностику";
  }
}

document.querySelectorAll<HTMLElement>("[data-diagnostic]").forEach(init);
