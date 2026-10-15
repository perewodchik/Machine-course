// Виджет «Сетка из 1000 человек» (урок III.3): медицинский тест на популяции из 1000 человек.
// Доля больных (базовая частота), чувствительность и доля ложных срабатываний задают четыре группы:
// больные с положительным тестом (TP), больные с отрицательным (FN), здоровые с положительным (FP) и остальные (TN).
// Апостериорная вероятность P(болен | +) — доля больных среди положительных. Чистая логика без DOM.

export const POPULATION = 1000;

export interface Params {
  /** Базовая частота P(болен). */
  prevalence: number;
  /** Чувствительность P(+ | болен). */
  sensitivity: number;
  /** Доля ложных срабатываний P(+ | здоров). */
  falsePositive: number;
}

export const DEFAULT: Params = { prevalence: 0.01, sensitivity: 0.9, falsePositive: 0.09 };

export type Group = "tp" | "fn" | "fp" | "tn";
export type Counts = Record<Group, number>;

/** Люди по группам: целые числа, в сумме ровно POPULATION. */
export function counts(p: Params, n = POPULATION): Counts {
  const sick = Math.round(n * p.prevalence);
  const tp = Math.round(sick * p.sensitivity);
  const fp = Math.round((n - sick) * p.falsePositive);
  return { tp, fn: sick - tp, fp, tn: n - sick - fp };
}

/** Формула полной вероятности: P(+) = P(+ | болен) P(болен) + P(+ | здоров) P(здоров). */
export const evidence = (p: Params) => p.sensitivity * p.prevalence + p.falsePositive * (1 - p.prevalence);

/** Формула Байеса: P(болен | +) = P(+ | болен) P(болен) / P(+). */
export const posterior = (p: Params) => (evidence(p) === 0 ? 0 : (p.sensitivity * p.prevalence) / evidence(p));

/** Порядок людей на сетке: по болезни (видна базовая частота) или по тесту (видны положительные). */
export type Order = "disease" | "test";

export function arrange(c: Counts, order: Order): Group[] {
  const groups: Group[] = order === "disease" ? ["tp", "fn", "fp", "tn"] : ["tp", "fp", "fn", "tn"];
  return groups.flatMap((g) => Array<Group>(c[g]).fill(g));
}

/** Доля в процентах для текста: 9.2 %, 0.5 %, 50 %. */
export function pct(v: number): string {
  const x = v * 100;
  const s = x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x.toFixed(2);
  return `${s.replace(/\.0+$/, "")}\u00a0%`;
}

/** Текст рисунка для скринридера; concealed — без ответа P(болен | +), пока ученик его не открыл. */
export function describe(p: Params, concealed = false): string {
  const c = counts(p);
  const pos = c.tp + c.fp;
  const head = `Из ${POPULATION} человек больны ${c.tp + c.fn}. Тест положителен у ${c.tp} больных и у ${c.fp} здоровых`;
  return concealed ? `${head}.` : `${head}: из ${pos} положительных больны ${c.tp}. P(болен | +) = ${pct(posterior(p))}.`;
}
