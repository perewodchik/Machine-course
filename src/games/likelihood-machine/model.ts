// Игра «Машина правдоподобия» (урок IV.3): по выборке найти θ с наибольшим логарифмом правдоподобия ℓ(θ).
// Кривая ℓ скрыта; игрок делает замеры — до шести — и видит ℓ в выбранных точках, потом сдаёт θ. Сдача
// принимается, если ℓ(θ) не ниже максимума более чем на 0.5 (граница приближённого 68 % интервала правдоподобия).
// Пять семейств: Бернулли, Пуассон, нормальное с известной σ, показательное, нормальное с известным μ.
// Модель чистая: выборки из rng(seed).
import { gauss } from "../../lib/math/correlation";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "bernoulli" | "poisson" | "normal-mean" | "exponential" | "normal-sd";

export interface Level {
  kind: LevelKind;
  data: number[];
  range: readonly [number, number];
  step: number;
}

export interface State {
  level: Level;
  theta: number;
  probes: { theta: number; ell: number }[];
  submitted: number | null;
  misses: number[];
  hints: number;
}

export type Action = { type: "set"; theta: number } | { type: "probe" } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["bernoulli", "poisson", "normal-mean", "exponential", "normal-sd"];
export const LEVELS = LEVEL_KINDS.length;
export const BUDGET = 6;
/** Допуск по логарифму правдоподобия. */
export const DROP = 0.5;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  bernoulli: "монета",
  poisson: "звонки за минуту",
  "normal-mean": "среднее нормального",
  exponential: "время ожидания",
  "normal-sd": "разброс нормального",
};

export const PARAM: Record<LevelKind, string> = { bernoulli: "φ", poisson: "λ", "normal-mean": "μ", exponential: "λ", "normal-sd": "σ" };

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  bernoulli: {
    question: "Где максимум ℓ(φ) у монеты?",
    answer: "ℓ(φ) = k log φ + (n − k) log(1 − φ); производная k/φ − (n − k)/(1 − φ) равна нулю при φ̂ = k/n — доля орлов. Замеры не нужны, если посчитать долю.",
  },
  poisson: {
    question: "Чему равна оценка максимального правдоподобия λ у Пуассона?",
    answer: "ℓ(λ) = Σ xᵢ log λ − nλ + const, производная Σ xᵢ/λ − n обращается в ноль при λ̂ = x̄ — среднем числе звонков.",
  },
  "normal-mean": {
    question: "Почему MLE среднего нормального — это x̄?",
    answer: "При известной σ ℓ(μ) = −Σ(xᵢ − μ)²/(2σ²) + const — парабола, и её максимум — минимум суммы квадратов: x̄ (урок IV.1). Так МНК получается из максимума правдоподобия с нормальным шумом.",
  },
  exponential: {
    question: "Почему у показательного λ̂ = 1/x̄?",
    answer: "ℓ(λ) = n log λ − λ Σ xᵢ, производная n/λ − Σ xᵢ = 0 при λ̂ = n/Σ xᵢ = 1/x̄. Кривая несимметрична: справа от максимума падает медленнее, чем слева.",
  },
  "normal-sd": {
    question: "Какой σ̂ даёт максимум правдоподобия?",
    answer: "При известном μ ℓ(σ) = −n log σ − Σ(xᵢ − μ)²/(2σ²); максимум при σ̂² = (1/n) Σ(xᵢ − μ)² — делим на n, а не на n − 1 (урок IV.2).",
  },
};

const lgammaInt = (k: number) => {
  let s = 0;
  for (let i = 2; i <= k; i++) s += Math.log(i);
  return s;
};

/** Логарифм правдоподобия выборки при параметре θ. */
export function ell(level: Level, theta: number): number {
  const x = level.data;
  const n = x.length;
  const sum = x.reduce((a, b) => a + b, 0);
  switch (level.kind) {
    case "bernoulli":
      return sum * Math.log(theta) + (n - sum) * Math.log(1 - theta);
    case "poisson":
      return sum * Math.log(theta) - n * theta - x.reduce((a, k) => a + lgammaInt(k), 0);
    case "normal-mean":
      return -x.reduce((a, v) => a + (v - theta) ** 2, 0) / 2 - (n / 2) * Math.log(2 * Math.PI);
    case "exponential":
      return n * Math.log(theta) - theta * sum;
    case "normal-sd":
      return -n * Math.log(theta) - x.reduce((a, v) => a + v * v, 0) / (2 * theta * theta) - (n / 2) * Math.log(2 * Math.PI);
  }
}

/** Оценка максимального правдоподобия по формуле. */
export function mle(level: Level): number {
  const x = level.data;
  const n = x.length;
  const mean = x.reduce((a, b) => a + b, 0) / n;
  switch (level.kind) {
    case "bernoulli":
    case "poisson":
    case "normal-mean":
      return mean;
    case "exponential":
      return 1 / mean;
    case "normal-sd":
      return Math.sqrt(x.reduce((a, v) => a + v * v, 0) / n);
  }
}

function draw(kind: LevelKind, r: Rng): Omit<Level, "kind"> {
  switch (kind) {
    case "bernoulli": {
      const phi = r.pick([0.2, 0.3, 0.65, 0.8]);
      return { data: Array.from({ length: 30 }, () => (r.next() < phi ? 1 : 0)), range: [0.01, 0.99], step: 0.01 };
    }
    case "poisson": {
      const lam = r.pick([1.5, 2.5, 4]);
      const pois = () => {
        let k = 0;
        let p = Math.exp(-lam);
        let s = p;
        const u = r.next();
        while (u > s) {
          k++;
          p *= lam / k;
          s += p;
        }
        return k;
      };
      return { data: Array.from({ length: 20 }, pois), range: [0.1, 8], step: 0.05 };
    }
    case "normal-mean": {
      const mu = r.pick([-2.3, -1.1, 0.7, 1.8, 3.2]);
      return { data: Array.from({ length: 15 }, () => Math.round((mu + gauss(r)) * 10) / 10), range: [-5, 5], step: 0.05 };
    }
    case "exponential": {
      const lam = r.pick([0.5, 1.2, 2]);
      return { data: Array.from({ length: 15 }, () => Math.round((-Math.log(1 - r.next()) / lam) * 100) / 100 + 0.01), range: [0.05, 5], step: 0.05 };
    }
    case "normal-sd": {
      const s = r.pick([0.6, 1.5, 2.5]);
      return { data: Array.from({ length: 20 }, () => Math.round(s * gauss(r) * 10) / 10), range: [0.2, 5], step: 0.05 };
    }
  }
}

export function makeLevel(kind: LevelKind, r: Rng): Level {
  for (;;) {
    const lv = { kind, ...draw(kind, r) };
    const m = mle(lv);
    // MLE внутри диапазона бегунка и не на краю: иначе «максимум» — граница, а не вершина кривой
    if (m > lv.range[0] + 5 * lv.step && m < lv.range[1] - 5 * lv.step) return lv;
  }
}

const snap = (l: Level, t: number) => {
  const v = Math.round((t - l.range[0]) / l.step) * l.step + l.range[0];
  return Math.min(l.range[1], Math.max(l.range[0], Math.round(v * 1e6) / 1e6));
};
const accepted = (l: Level, t: number) => ell(l, t) >= ell(l, mle(l)) - DROP;
const f2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2).replace("-", "−");

export const likelihoodMachine: GameSpec<State, Action, Level> & { feedback(state: State): string; canProbe(state: State): boolean } = {
  id: "stat.likelihood-machine",
  version: 1,
  concepts: ["stat.mle"],

  init: (level) => ({ level, theta: snap(level, (level.range[0] + level.range[1]) / 2), probes: [], submitted: null, misses: [], hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return likelihoodMachine.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.submitted !== null) return state;
    switch (action.type) {
      case "set":
        return { ...state, theta: snap(state.level, action.theta) };
      case "probe":
        return likelihoodMachine.canProbe(state) ? { ...state, probes: [...state.probes, { theta: state.theta, ell: ell(state.level, state.theta) }] } : state;
      case "submit":
        return accepted(state.level, state.theta) ? { ...state, submitted: state.theta } : { ...state, misses: [...state.misses, state.theta] };
    }
  },

  canProbe: (s) => s.submitted === null && s.probes.length < BUDGET,
  status: (s) => (s.submitted !== null ? "solved" : "playing"),
  /** Чем меньше замеров и промахов, тем выше: 1 − 0.1 · (замеры + 2 · промахи), не ниже 0.1. */
  score: (s) => (s.submitted === null ? 0 : Math.max(0.1, 1 - 0.1 * (s.probes.length + 2 * s.misses.length))),

  describe(s) {
    const p = PARAM[s.level.kind];
    return `Выборка из ${s.level.data.length} наблюдений. ${p} = ${f2(s.theta)}. Замеров ${s.probes.length} из ${BUDGET}${s.probes.length ? `; последний: ℓ(${f2(s.probes[s.probes.length - 1]!.theta)}) = ${f2(s.probes[s.probes.length - 1]!.ell)}` : ""}.`;
  },

  hint(s) {
    if (s.hints <= 1) return "ℓ(θ) — сумма логарифмов вероятностей наблюдений. Где производная ℓ равна нулю? Её можно найти по данным, не делая замеров.";
    const k = s.level.kind;
    return k === "exponential" ? "Для показательного λ̂ = 1/x̄." : k === "normal-sd" ? "Для σ при известном μ = 0: σ̂ = √(Σ xᵢ²/n)." : `Для этого семейства ${PARAM[k]}̂ = x̄ — выборочное среднее.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const p = PARAM[s.level.kind];
    if (s.submitted !== null) return `Сдано ${p} = ${f2(s.submitted)}: ℓ = ${f2(ell(s.level, s.submitted))}, максимум ${f2(ell(s.level, mle(s.level)))} при ${p}̂ = ${f2(mle(s.level))}. Принято!`;
    const miss = s.misses[s.misses.length - 1];
    if (miss === s.theta) return `${p} = ${f2(miss)} не принято: ℓ ниже максимума больше чем на ${DROP}. Посмотрите, в какую сторону ℓ растёт между замерами.`;
    const last = s.probes[s.probes.length - 1];
    if (!last) return `Выберите ${p} и сделайте замер ℓ — их ${BUDGET}. Или найдите максимум по данным и сразу сдайте.`;
    return `ℓ(${f2(last.theta)}) = ${f2(last.ell)}. Осталось замеров: ${BUDGET - s.probes.length}.`;
  },
};

/** Бот для тестов: выставить MLE и сдать без замеров. */
export function solve(state: State): Action[] {
  return [{ type: "set", theta: mle(state.level) }, { type: "submit" }];
}
