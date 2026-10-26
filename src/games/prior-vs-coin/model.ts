// Игра «Приор против монеты» (урок IV.6): двенадцать монет из одной партии, по каждой видно n бросков. Игрок выбирает
// априорное Beta(α, β) и предсказывает вероятность орла апостериорным средним (k + α)/(n + α + β); MLE-бот
// предсказывает k/n (обрезанное до [0.01, 0.99], иначе потеря бесконечна). Обе стратегии оцениваются средней
// кросс-энтропией (log loss) на 30 следующих бросках каждой монеты. Уровень пройден, если потеря игрока не больше,
// чем у бота (с допуском на ничью TIE). Модель чистая: монеты и броски из rng(seed).
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "fair" | "biased" | "tiny" | "uniform" | "plenty";

export interface Coin {
  phi: number;
  seen: number[];
  future: number[];
}

export interface Level {
  kind: LevelKind;
  coins: Coin[];
}

export interface Play {
  alpha: number;
  beta: number;
  player: number;
  bot: number;
}

export interface State {
  level: Level;
  alpha: number;
  beta: number;
  plays: Play[];
  solved: boolean;
  hints: number;
}

export type Action = { type: "set"; alpha?: number; beta?: number } | { type: "play" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["fair", "biased", "tiny", "uniform", "plenty"];
export const LEVELS = LEVEL_KINDS.length;
export const COINS = 12;
export const FUTURE = 30;
export const PRIOR = { min: 0.5, max: 20, step: 0.5 };
const CLIP = 0.01;
/** Ничья засчитывается: при большом n обе стратегии сходятся, и разница — шум будущих бросков. */
export const TIE = 0.005;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  fair: "почти честные монеты",
  biased: "кривые монеты",
  tiny: "по два броска",
  uniform: "монеты какие угодно",
  plenty: "много бросков",
};

/** Что известно о партии монет: подсказка игроку о выборе априорного. */
export const POPULATION: Record<LevelKind, string> = {
  fair: "Монеты с одного станка: почти честные, орёл выпадает в 40–60 % бросков. Видно по 3 броска.",
  biased: "Монеты из сувенирной лавки: у большинства орёл выпадает в 70–90 % бросков. Видно по 4 броска.",
  tiny: "Монеты почти честные, но видно всего по 2 броска.",
  uniform: "О монетах ничего не известно: вероятность орла может быть любой. Видно по 3 броска.",
  plenty: "Монеты почти честные, видно по 40 бросков.",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  fair: {
    question: "Почему MLE-бот проигрывает на трёх бросках?",
    answer: "При трёх бросках часто выпадает 3 из 3 или 0 из 3, и бот уверенно предсказывает «всегда орёл». Будущая решка штрафует его на −log 0.01 ≈ 4.6. Априорное Beta(α, α) с большим α — это 2α воображаемых бросков честной монеты: оно тянет оценку к 0.5.",
  },
  biased: {
    question: "Что делать, если монеты в среднем кривые?",
    answer: "Брать несимметричное априорное: Beta(α, β) со средним α/(α + β) около 0.8. Симметричное тянуло бы оценки к 0.5 — туда, где монет нет.",
  },
  tiny: {
    question: "Почему при двух бросках приор решает почти всё?",
    answer: "Апостериорное среднее (k + α)/(n + α + β) — смесь доли k/n с весом n и априорного среднего с весом α + β. При n = 2 вес данных мал, и хороший приор важнее данных.",
  },
  uniform: {
    question: "Что даёт Beta(1, 1), когда о монетах ничего не известно?",
    answer: "Beta(1, 1) — равномерное априорное. Апостериорное среднее (k + 1)/(n + 2) — сглаживание Лапласа: по одному воображаемому орлу и решке. Оно уже не даёт нулевых вероятностей и поэтому обыгрывает MLE.",
  },
  plenty: {
    question: "Почему при 40 бросках приор почти не важен?",
    answer: "Вес данных n = 40 много больше веса приора α + β, и апостериорное среднее почти совпадает с MLE. Байесовская и частотная оценки сходятся с ростом выборки.",
  },
};

const PLAN: Record<LevelKind, { pop: [number, number]; n: number }> = {
  fair: { pop: [25, 25], n: 3 },
  biased: { pop: [16, 4], n: 4 },
  tiny: { pop: [25, 25], n: 2 },
  uniform: { pop: [1, 1], n: 3 },
  plenty: { pop: [25, 25], n: 40 },
};

/** Beta(a, b) через два гамма-распределения (a, b — до 25; Марсалья — Цан). */
function betaDraw(r: Rng, a: number, b: number): number {
  const gamma = (k: number): number => {
    if (k < 1) return gamma(k + 1) * r.next() ** (1 / k);
    const d = k - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      const u1 = 1 - r.next();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * r.next());
      const v = (1 + c * z) ** 3;
      if (v > 0 && Math.log(1 - r.next()) < z * z / 2 + d - d * v + d * Math.log(v)) return d * v;
    }
  };
  const x = gamma(a);
  return x / (x + gamma(b));
}

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const { pop, n } = PLAN[kind];
  // уровень всегда проходим: если по случайности будущих бросков даже приор, совпадающий с партией, проигрывает
  // боту (бывает в 2–3 % партий уровней «какие угодно» и «много бросков»), монеты разыгрываются заново
  for (;;) {
    const coins = Array.from({ length: COINS }, () => {
      const phi = betaDraw(r, pop[0], pop[1]);
      const toss = () => (r.next() < phi ? 1 : 0);
      return { phi, seen: Array.from({ length: n }, toss), future: Array.from({ length: FUTURE }, toss) };
    });
    const level = { kind, coins };
    const { player, bot } = evaluate(level, Math.min(pop[0], PRIOR.max), Math.min(pop[1], PRIOR.max));
    if (player <= bot + TIE) return level;
  }
}

export const heads = (c: Coin) => c.seen.reduce((a, b) => a + b, 0);
export const posteriorMean = (c: Coin, alpha: number, beta: number) => (heads(c) + alpha) / (c.seen.length + alpha + beta);
export const mlePredict = (c: Coin) => Math.min(1 - CLIP, Math.max(CLIP, heads(c) / c.seen.length));

/** Средняя кросс-энтропия прогноза p на будущих бросках монеты. */
export const logLoss = (c: Coin, p: number) => -c.future.reduce((a, y) => a + (y ? Math.log(p) : Math.log(1 - p)), 0) / c.future.length;

export function evaluate(level: Level, alpha: number, beta: number): { player: number; bot: number } {
  const player = level.coins.reduce((a, c) => a + logLoss(c, posteriorMean(c, alpha, beta)), 0) / level.coins.length;
  const bot = level.coins.reduce((a, c) => a + logLoss(c, mlePredict(c)), 0) / level.coins.length;
  return { player, bot };
}

const snap = (v: number) => Math.min(PRIOR.max, Math.max(PRIOR.min, Math.round(v / PRIOR.step) * PRIOR.step));
const f3 = (x: number) => (Math.round(x * 1000) / 1000).toFixed(3);

export const priorVsCoin: GameSpec<State, Action, Level> & { feedback(state: State): string } = {
  id: "stat.prior-vs-coin",
  version: 1,
  concepts: ["stat.bayes-map"],

  init: (level) => ({ level, alpha: 1, beta: 1, plays: [], solved: false, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return priorVsCoin.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.solved) return state;
    if (action.type === "set") return { ...state, alpha: action.alpha === undefined ? state.alpha : snap(action.alpha), beta: action.beta === undefined ? state.beta : snap(action.beta) };
    const { player, bot } = evaluate(state.level, state.alpha, state.beta);
    return { ...state, plays: [...state.plays, { alpha: state.alpha, beta: state.beta, player, bot }], solved: player <= bot + TIE };
  },

  status: (s) => (s.solved ? "solved" : "playing"),
  /** Во сколько раз потеря бота больше потери игрока (последняя партия), с вычетом за лишние партии. */
  score: (s) => {
    const p = s.plays[s.plays.length - 1];
    return s.solved && p ? Math.min(1, (p.bot - p.player) / p.bot + 0.5) / Math.max(1, s.plays.length / 2) : 0;
  },

  describe(s) {
    const p = s.plays[s.plays.length - 1];
    return `${POPULATION[s.level.kind]} Априорное Beta(${s.alpha}, ${s.beta}).${p ? ` Последняя партия: потеря игрока ${f3(p.player)}, бота ${f3(p.bot)}.` : ""}`;
  },

  hint(s) {
    if (s.hints <= 1) return "α и β — воображаемые орлы и решки до бросков. Их среднее α/(α + β) — ваша догадка о типичной монете, сумма α + β — насколько вы в ней уверены.";
    const [a, b] = PLAN[s.level.kind].pop;
    return `Партия монет устроена примерно как Beta(${a}, ${b}): попробуйте приор с тем же средним ${f3(a / (a + b))}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const p = s.plays[s.plays.length - 1];
    if (!p) return "Выберите α и β и сыграйте партию: двенадцать монет, по 30 будущих бросков каждой.";
    if (s.solved) return `Beta(${p.alpha}, ${p.beta}): ваша потеря ${f3(p.player)} против ${f3(p.bot)} у MLE-бота. ${p.player < p.bot ? "Победа!" : "Ничья — при таком числе бросков приор почти не нужен."}`;
    return `Beta(${p.alpha}, ${p.beta}): ваша потеря ${f3(p.player)}, у бота ${f3(p.bot)} — бот пока лучше. Подумайте, где обычно лежат монеты этой партии и насколько вы в этом уверены.`;
  },
};

/** Бот для тестов: приор, совпадающий с распределением партии (до 20). */
export function solve(state: State): Action[] {
  const [a, b] = PLAN[state.level.kind].pop;
  return [{ type: "set", alpha: Math.min(a, 20), beta: Math.min(b, 20) }, { type: "play" }];
}
