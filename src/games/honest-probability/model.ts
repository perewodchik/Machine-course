// Игра «Честная вероятность» (урок 1.4 «Основ ML»): объекты на прямой с метками 0 и 1, модель p(x) = g(k(x − b)).
// Сначала игрок отмечает, где, по его мнению, лежит лучшая граница, потом подбирает границу b и крутизну k и сдаёт.
// Очки — логарифмическое правило: средний log p(y | x) против максимума ℓ(θ̂)/n; уровень пройден, если отставание
// не больше 0.02 (на разделимых данных максимума нет — нужно ℓ/n ≥ −0.05). Модель чистая: данные из rng(seed).
import { gauss } from "../../lib/math/correlation";
import { meanLoglik, newtonPath } from "../../lib/math/logistic";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "overlap" | "outlier" | "imbalanced" | "separable";

export interface Level {
  kind: LevelKind;
  x: number[];
  y: number[];
}

export interface State {
  level: Level;
  guess: number | null;
  b: number;
  k: number;
  submitted: boolean;
  misses: number;
  hints: number;
}

export type Action = { type: "guess"; b: number } | { type: "set"; b?: number; k?: number } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["overlap", "outlier", "imbalanced", "separable"];
export const LEVELS = LEVEL_KINDS.length;
export const B_STEP = 0.05;
export const K_STEP = 0.1;
export const K_MAX = 30;
const TOL = 0.02;
const SEPARABLE_GOAL = -0.05;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  overlap: "классы перекрываются",
  outlier: "выброс у границы",
  imbalanced: "редкий класс",
  separable: "разделимые данные",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  overlap: {
    question: "Почему лучшая крутизна не бесконечная?",
    answer: "Там, где классы перекрываются, уверенная модель за каждую чужую точку платит −log p — почти бесконечные потери. Максимум ℓ — компромисс: вероятности у границы около 0.5, вдали — ближе к 0 и 1.",
  },
  outlier: {
    question: "Что сделал выброс с лучшей моделью?",
    answer: "Точка далеко на «чужой» стороне при крутой сигмоиде даёт огромные потери −log p. Максимум правдоподобия смягчает крутизну и сдвигает границу, чтобы выброс не стоил так дорого. Логистические потери чувствительны к уверенным ошибкам.",
  },
  imbalanced: {
    question: "Куда ушла граница при редком классе?",
    answer: "К редкому классу: при равной близости объект скорее из частого класса, и честная вероятность это учитывает. Свободный член θ₀ сдвигается на логарифм отношения шансов классов.",
  },
  separable: {
    question: "Почему здесь нет лучшей крутизны и что изменит штраф λ‖θ‖²?",
    answer: "Граница без ошибок есть, и чем круче сигмоида, тем ближе все p(y | x) к единице: ℓ растёт к нулю, но не достигает его, максимума нет, и ‖θ‖ → ∞. Штраф λ‖θ‖² делает бесконечную крутизну невыгодной: у ℓ − λ‖θ‖² максимум есть и он конечен (модуль 2).",
  },
};

function sample(r: Rng, n: number, mu: number, sd: number, label: number, x: number[], y: number[]) {
  for (let i = 0; i < n; i++) {
    x.push(Math.round((mu + sd * gauss(r)) * 100) / 100);
    y.push(label);
  }
}

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const x: number[] = [];
  const y: number[] = [];
  const shift = r.pick([-0.5, 0, 0.5]);
  if (kind === "overlap" || kind === "outlier") {
    sample(r, 30, shift - 1, 1, 0, x, y);
    sample(r, 30, shift + 1, 1, 1, x, y);
    if (kind === "outlier") {
      x.push(shift + 3.6);
      y.push(0);
    }
  } else if (kind === "imbalanced") {
    sample(r, 50, shift - 0.8, 1, 0, x, y);
    sample(r, 10, shift + 0.8, 1, 1, x, y);
  } else {
    // разделимые: класс 0 левее −0.3, класс 1 правее 0.3 (около shift)
    for (let i = 0; i < 25; i++) {
      x.push(Math.round((shift - 0.3 - 2.5 * r.next()) * 100) / 100);
      y.push(0);
      x.push(Math.round((shift + 0.3 + 2.5 * r.next()) * 100) / 100);
      y.push(1);
    }
  }
  return { kind, x: x.map((v) => Math.max(-3.95, Math.min(3.95, v))), y };
}

const design = (l: Level) => l.x.map((v) => [1, v]);
/** Средний log p(y | x) при границе b и крутизне k: θ = (−kb, k). */
export const meanLogp = (l: Level, b: number, k: number) => meanLoglik([-k * b, k], design(l), l.y);

/** Максимум ℓ/n; у разделимых — супремум 0. */
export function best(l: Level): { b: number; k: number; ell: number } {
  if (l.kind === "separable") return { b: NaN, k: Infinity, ell: 0 };
  const t = newtonPath(design(l), l.y, [0, 0]).points.at(-1)!;
  return { b: -t[0]! / t[1]!, k: t[1]!, ell: meanLoglik(t, design(l), l.y) };
}

const goal = (l: Level) => (l.kind === "separable" ? SEPARABLE_GOAL : best(l).ell - TOL);
const snap = (v: number, step: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Math.round(v / step) * step * 1000) / 1000));
const f2 = (v: number) => String(Math.round(v * 100) / 100).replace("-", "−");
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toFixed(3).replace("-", "−");

export const honest: GameSpec<State, Action, Level> & { feedback(state: State): string } = {
  id: "ml.honest-probability",
  version: 1,
  concepts: ["ml.logistic-regression", "stat.mle"],

  init: (level) => ({ level, guess: null, b: 0, k: 1, submitted: false, misses: 0, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return honest.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.submitted) return state;
    switch (action.type) {
      case "guess":
        return state.guess === null ? { ...state, guess: snap(action.b, B_STEP, -4, 4), b: snap(action.b, B_STEP, -4, 4) } : state;
      case "set":
        if (state.guess === null) return state;
        return { ...state, b: action.b === undefined ? state.b : snap(action.b, B_STEP, -4, 4), k: action.k === undefined ? state.k : snap(action.k, K_STEP, K_STEP, K_MAX) };
      case "submit":
        if (state.guess === null) return state;
        return meanLogp(state.level, state.b, state.k) >= goal(state.level) ? { ...state, submitted: true } : { ...state, misses: state.misses + 1 };
    }
  },

  status: (s) => (s.submitted ? "solved" : "playing"),

  /** Отношение правдоподобий на объект exp(ℓ/n − max ℓ/n) ∈ (0, 1], минус 0.1 за каждую непринятую сдачу. */
  score: (s) => (s.submitted ? Math.max(0, Math.min(1, Math.exp(meanLogp(s.level, s.b, s.k) - best(s.level).ell)) - 0.1 * s.misses) : 0),

  describe(s) {
    const n1 = s.level.y.filter((v) => v === 1).length;
    if (s.guess === null) return `${s.level.x.length} объектов, класс 1 — ${n1}. Отметьте, где, по-вашему, лучшая граница.`;
    return `Граница b = ${f2(s.b)}, крутизна k = ${f2(s.k)}: средний log p = ${f3(meanLogp(s.level, s.b, s.k))}.`;
  },

  hint(s) {
    if (s.hints <= 1) return "Сначала поставьте границу там, где классы примерно поровну, потом крутизну: слишком крутая сигмоида дорого платит за каждую точку на чужой стороне.";
    if (s.level.kind === "separable") return "Ошибок нет ни при какой крутизне: двигайте крутизну вправо до конца.";
    const b = best(s.level);
    return `Лучшая граница около ${f2(b.b)}, крутизна около ${f2(b.k)}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const mine = meanLogp(s.level, s.b, s.k);
    const b = best(s.level);
    const sep = s.level.kind === "separable";
    if (s.guess === null) return "Отметьте догадку: где, по-вашему, проходит лучшая граница?";
    const guessText = sep ? "" : ` Ваша догадка — ${f2(s.guess)}, лучшая граница — ${f2(b.b)}.`;
    if (s.submitted) return `Принято: средний log p = ${f3(mine)}, ${sep ? "чем круче, тем ближе к нулю" : `максимум ${f3(b.ell)}`}.${guessText}`;
    const head = `Средний log p = ${f3(mine)}; ${sep ? `нужно не меньше ${f3(SEPARABLE_GOAL)}` : `максимум ${f3(b.ell)}, нужно отстать не больше чем на ${TOL}`}.`;
    return s.misses > 0 ? `${head} Последняя сдача не принята.` : head;
  },
};

/** Бот для тестов: догадка — лучшая граница, ручки — к максимуму (на разделимых — крутизна до упора). */
export function solve(state: State): Action[] {
  const b = best(state.level);
  if (state.level.kind === "separable") {
    const xs = state.level.x;
    const mid = (Math.max(...xs.filter((_, i) => state.level.y[i] === 0)) + Math.min(...xs.filter((_, i) => state.level.y[i] === 1))) / 2;
    return [{ type: "guess", b: mid }, { type: "set", k: K_MAX }, { type: "submit" }];
  }
  return [{ type: "guess", b: b.b }, { type: "set", b: b.b, k: Math.min(K_MAX, b.k) }, { type: "submit" }];
}
