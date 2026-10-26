// Игра «Переобучи, если сможешь: облако» (урок 2.2 «Основ ML»): по n и σ игрок предсказывает степень полинома с
// наименьшей ожидаемой ошибкой на свежих данных, потом видит облако из 100 моделей. Ожидаемая ошибка степени k —
// σ² + смещение² + разброс по 100 выборкам (истина sin 2.5x + 0.3x на [−1, 1]). Очки — ошибка лучшей степени,
// делённая на ошибку выбранной; уровень пройден при очках от 0.85. Модель чистая: выборки из rng(seed).
import { gauss } from "../../lib/math/correlation";
import { polyEval, polyFitMoments as polyFit } from "../../lib/math/poly";
import { rng } from "../../lib/math/rng";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "rich" | "medium" | "noisy" | "tiny";

export interface Level {
  kind: LevelKind;
  n: number;
  sigma: number;
  seed: number;
}

export interface State {
  level: Level;
  k: number;
  submitted: boolean;
  misses: number[];
  hints: number;
}

export type Action = { type: "set"; k: number } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["rich", "medium", "noisy", "tiny"];
export const LEVELS = LEVEL_KINDS.length;
export const MAX_DEGREE = 10;
export const B = 100;
const PASS = 0.85;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  rich: "много данных, мало шума",
  medium: "средняя выборка",
  noisy: "сильный шум",
  tiny: "десять точек и шум",
};

const SETUP: Record<LevelKind, { n: number[]; sigma: number[] }> = {
  rich: { n: [200, 150], sigma: [0.1, 0.15] },
  medium: { n: [30, 40], sigma: [0.3, 0.25] },
  noisy: { n: [25, 30], sigma: [0.8, 1] },
  tiny: { n: [10, 8], sigma: [0.8, 1] },
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  rich: {
    question: "Почему здесь выигрывает высокая степень?",
    answer: "Данных много, шума мало: разброс σ²d/n мал даже у гибкой модели, а смещение низкой степени — нет. Смещение тут дороже разброса.",
  },
  medium: {
    question: "Где баланс смещения и разброса?",
    answer: "Степень 3–4 уже ловит изгиб синуса (смещение почти ноль), а каждая следующая добавляет разброс около σ²/n на вес и ничего не даёт.",
  },
  noisy: {
    question: "Почему при сильном шуме лучшая степень ниже?",
    answer: "Разброс растёт как σ²: при σ около 1 каждый лишний вес стоит дорого, и выгоднее смириться со смещением простой модели.",
  },
  tiny: {
    question: "Почему на десяти точках прямая или константа лучше кривой?",
    answer: "При n = 10 и сильном шуме облако даже кубических моделей огромно. Смещение прямой меньше, чем разброс любой гибкой модели: малые данные лечат простотой.",
  },
};

const hStar = (x: number) => Math.sin(2.5 * x) + 0.3 * x;
const GRID = Array.from({ length: 41 }, (_, i) => -1 + i / 20);

function cloudModels(l: Level, k: number): number[][] {
  // своё зерно уровня: выборки одинаковы для всех степеней
  const r = rng(l.seed);
  return Array.from({ length: B }, () => {
    const pts = Array.from({ length: l.n }, () => {
      const x = -1 + 2 * r.next();
      return [x, hStar(x) + l.sigma * gauss(r)] as const;
    });
    return polyFit(pts, k);
  });
}

const cache = new Map<string, number[]>();
/** Ожидаемая ошибка по степеням 0…MAX_DEGREE: σ² + смещение² + разброс. */
export function expectedErrors(l: Level): number[] {
  const key = `${l.n}/${l.sigma}/${l.seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = Array.from({ length: MAX_DEGREE + 1 }, (_, k) => {
    const models = cloudModels(l, k);
    let bias2 = 0;
    let variance = 0;
    for (const x of GRID) {
      const v = models.map((m) => polyEval(m, x));
      const mean = v.reduce((a, b) => a + b, 0) / B;
      bias2 += (mean - hStar(x)) ** 2;
      variance += v.reduce((a, p) => a + (p - mean) ** 2, 0) / B;
    }
    return l.sigma ** 2 + (bias2 + variance) / GRID.length;
  });
  cache.set(key, out);
  return out;
}

export const bestDegree = (l: Level) => {
  const e = expectedErrors(l);
  return e.indexOf(Math.min(...e));
};

export function models(l: Level, k: number) {
  return cloudModels(l, k);
}

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const i = r.next() < 0.5 ? 0 : 1;
  return { kind, n: SETUP[kind].n[i]!, sigma: SETUP[kind].sigma[i]!, seed: Math.floor(r.next() * 1e9) };
}

const ratio = (l: Level, k: number) => {
  const e = expectedErrors(l);
  return Math.min(...e) / e[k]!;
};

export const overfitCloud: GameSpec<State, Action, Level> & { feedback(state: State): string } = {
  id: "ml.overfit-cloud",
  version: 1,
  concepts: ["ml.bias-variance"],

  init: (level) => ({ level, k: 1, submitted: false, misses: [], hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return overfitCloud.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.submitted) return state;
    if (action.type === "set") return { ...state, k: Math.max(0, Math.min(MAX_DEGREE, Math.round(action.k))) };
    return ratio(state.level, state.k) >= PASS ? { ...state, submitted: true } : { ...state, misses: [...state.misses, state.k] };
  },

  status: (s) => (s.submitted ? "solved" : "playing"),

  /** Ошибка лучшей степени / ошибка выбранной, минус 0.1 за каждую непринятую сдачу. */
  score: (s) => (s.submitted ? Math.max(0, ratio(s.level, s.k) - 0.1 * s.misses.length) : 0),

  describe: (s) => `n = ${s.level.n} точек, шум σ = ${s.level.sigma}. Выбрана степень ${s.k}.`,

  hint(s) {
    if (s.hints <= 1) return "Разброс растёт примерно как σ² · (число весов) / n. Сравните его со смещением прямой — изгиб синуса на [−1, 1] заметный.";
    return `При n = ${s.level.n} и σ = ${s.level.sigma} каждый лишний вес добавляет к ошибке около ${(s.level.sigma ** 2 / s.level.n).toFixed(3)}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const e = expectedErrors(s.level);
    const b = bestDegree(s.level);
    const f = (v: number) => v.toFixed(3);
    if (s.submitted) return `Принято: степень ${s.k}, ожидаемая ошибка ${f(e[s.k]!)}; лучшая — степень ${b} (${f(e[b]!)}).`;
    const miss = s.misses.at(-1);
    if (miss === s.k) return `Степень ${miss} не принята: её ожидаемая ошибка ${f(e[miss]!)} заметно больше лучшей. Подумайте, что здесь дороже — смещение или разброс.`;
    return "Выберите степень полинома, у которой ожидаемая ошибка на свежих данных будет наименьшей, и сдайте её.";
  },
};

/** Бот для тестов: лучшая степень. */
export function solve(state: State): Action[] {
  return [{ type: "set", k: bestDegree(state.level) }, { type: "submit" }];
}
