// Входная диагностика (урок 0.2): какую задачу спросить следующей и что получилось. Чистая логика, общая для
// страницы (src/client/diagnostic.ts) и тестов. Банк задач — content/diagnostic.yaml.
//
// Задачи спрашиваются по порядку банка. Задача пропускается, если неверно решена задача урока, на который она
// опирается (requires): ответ всё равно был бы неверным. Пропуск не тянет за собой следующие задачи — после
// пропущенной задачи можно решить другую, опирающуюся на неё. Диагностика кончается, когда задачи кончились
// или следующая не помещается в бюджет времени.

/** right — решено верно с первой попытки, wrong — неверно или «Не знаю», skipped — не спрашивали. */
export type Outcome = "right" | "wrong" | "skipped";

export interface PlanItem {
  lesson: string;
  minutes: number;
  requires: readonly string[];
}

export interface Advance {
  /** Индекс следующей задачи; null — диагностика окончена. */
  next: number | null;
  /** Уроки, задачи которых пропущены по дороге к следующей. */
  skipped: string[];
}

/** Минуты уже заданных задач. */
export function spent(items: readonly PlanItem[], outcomes: ReadonlyMap<string, Outcome>): number {
  return items.reduce((s, it) => {
    const o = outcomes.get(it.lesson);
    return o === "right" || o === "wrong" ? s + it.minutes : s;
  }, 0);
}

export function advance(items: readonly PlanItem[], outcomes: ReadonlyMap<string, Outcome>, budget: number): Advance {
  const skipped: string[] = [];
  const done = new Map(outcomes);
  const time = spent(items, outcomes);
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    if (done.has(it.lesson)) continue;
    if (it.requires.some((r) => done.get(r) === "wrong")) {
      done.set(it.lesson, "skipped");
      skipped.push(it.lesson);
      continue;
    }
    if (time + it.minutes > budget + 1e-9) return { next: null, skipped };
    return { next: i, skipped };
  }
  return { next: null, skipped };
}

/** Примерно сколько минут осталось: задачи без ответа, кроме тех, что уже точно будут пропущены. */
export function minutesLeft(items: readonly PlanItem[], outcomes: ReadonlyMap<string, Outcome>, budget: number): number {
  const left = items.filter((it) => !outcomes.has(it.lesson) && !it.requires.some((r) => outcomes.get(r) === "wrong")).reduce((s, it) => s + it.minutes, 0);
  return Math.max(0, Math.min(left, budget - spent(items, outcomes)));
}

export interface Summary {
  /** Уроки с верно решёнными задачами: им ставится «знаю». */
  known: string[];
  /** Остальные уроки банка по порядку — маршрут ученика. */
  route: string[];
  asked: number;
}

export function summarize(items: readonly PlanItem[], outcomes: ReadonlyMap<string, Outcome>): Summary {
  const known = items.filter((it) => outcomes.get(it.lesson) === "right").map((it) => it.lesson);
  return {
    known,
    route: items.filter((it) => outcomes.get(it.lesson) !== "right").map((it) => it.lesson),
    asked: items.filter((it) => outcomes.get(it.lesson) === "right" || outcomes.get(it.lesson) === "wrong").length,
  };
}
