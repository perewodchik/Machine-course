// Игра «Цена ошибки» (курс «Основы ML», урок 2.1): у модели честные вероятности p, у ошибок — цена: ложная тревога c_fp
// и пропуск c_fn. Игрок выбирает порог t и сдаёт его; уровень пройден, если цена ошибок не больше чем на 4 % выше
// минимума на этих данных (и не больше чем на 1 в абсолютных единицах при малых ценах). Непринятая сдача не закрывает
// уровень. Модель чистая: данные из rng(seed). Байесовский порог c_fp / (c_fp + c_fn) почти оптимален.
import { confusion, totalCost } from "../../lib/math/classification";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "credit" | "spam" | "equal" | "screening" | "free";

export interface Level {
  kind: LevelKind;
  scores: number[];
  y: number[];
  cFp: number;
  cFn: number;
}

export interface State {
  level: Level;
  t: number;
  submitted: number | null;
  misses: number[];
  hints: number;
}

export type Action = { type: "set"; t: number } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["credit", "spam", "equal", "screening", "free"];
export const LEVELS = LEVEL_KINDS.length;
export const T_STEP = 0.005;
const TOL = 1.04;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  credit: "кредиты",
  spam: "спам-фильтр",
  equal: "равная цена",
  screening: "скрининг",
  free: "решите сами",
};

/** Что считаем положительным и сколько стоит каждая ошибка — для подписи уровня. */
export const STORY: Record<Exclude<LevelKind, "free">, { pos: string; fp: string; fn: string; cFp: number; cFn: number; n: number; skew: number }> = {
  credit: { pos: "дефолт", fp: "лишний отказ", fn: "пропущенный дефолт", cFp: 1, cFn: 5, n: 240, skew: 1.8 },
  spam: { pos: "спам", fp: "нужное письмо в спаме", fn: "спам во входящих", cFp: 10, cFn: 1, n: 240, skew: 1.2 },
  equal: { pos: "класс 1", fp: "ложная тревога", fn: "пропуск", cFp: 1, cFn: 1, n: 240, skew: 1 },
  screening: { pos: "болезнь", fp: "лишнее обследование", fn: "пропущенная болезнь", cFp: 1, cFn: 20, n: 300, skew: 4 },
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  credit: {
    question: "Почему порог 0.5 здесь дорогой?",
    answer: "Пропущенный дефолт стоит впятеро дороже лишнего отказа. Отказывать выгодно, когда p · 5 > (1 − p) · 1, то есть при p > 1/6 ≈ 0.17. Порог 0.5 пропускает много дефолтов ради того, чтобы не обидеть надёжных заёмщиков.",
  },
  spam: {
    question: "Почему порог спам-фильтра высокий?",
    answer: "Потерянное нужное письмо стоит вдесятеро дороже спама во входящих. В спам отправляем только при p > 10/11 ≈ 0.91: фильтр должен быть почти уверен.",
  },
  equal: {
    question: "Когда порог 0.5 правильный?",
    answer: "Когда обе ошибки стоят одинаково и вероятности честные: отмечаем, если p > 1 − p. Тогда минимум цены — это максимум доли верных ответов.",
  },
  screening: {
    question: "Почему при редкой болезни порог такой низкий?",
    answer: "Пропуск в двадцать раз дороже лишнего обследования: обследуем уже при p > 1/21 ≈ 0.05. Доля верных ответов при этом может упасть — она не учитывает, какая ошибка дороже.",
  },
  free: {
    question: "Как выбрать порог без перебора?",
    answer: "Если вероятности модели честные, отмечать выгодно при p · c_fn > (1 − p) · c_fp, то есть при p > c_fp / (c_fp + c_fn). Перебор на данных даёт почти тот же порог.",
  },
};

/** Честные вероятности: сначала p, потом y ~ Bernoulli(p). skew > 1 — положительных меньше. */
export function makeLevel(kind: LevelKind, r: Rng): Level {
  const k = kind === "free" ? r.pick(["credit", "spam", "equal", "screening"] as const) : kind;
  const s = STORY[k];
  const scores = Array.from({ length: s.n }, () => Math.round(r.next() ** s.skew * 1000) / 1000);
  const y = scores.map((p) => (r.next() < p ? 1 : 0));
  return { kind, scores, y, cFp: s.cFp, cFn: s.cFn };
}

export const costAt = (l: Level, t: number) => totalCost(l.scores, l.y, t, l.cFp, l.cFn);
/** Лучший порог среди тех, что можно выставить бегунком (сетка с шагом T_STEP); при равной цене — меньший. */
export function best(l: Level): { t: number; cost: number } {
  let b = { t: 0, cost: Infinity };
  for (let k = 0; k <= Math.round(1 / T_STEP); k++) {
    const t = Math.round(k * T_STEP * 1000) / 1000;
    const cost = costAt(l, t);
    if (cost < b.cost) b = { t, cost };
  }
  return b;
}
const target = (l: Level) => Math.max(best(l).cost * TOL, best(l).cost + 1);
const clampT = (t: number) => Math.min(1, Math.max(0, Math.round(Math.round(t / T_STEP) * T_STEP * 1000) / 1000));
const f2 = (x: number) => (Math.round(x * 1000) / 1000).toFixed(3);

export const errorCost: GameSpec<State, Action, Level> & { feedback(state: State): string } = {
  id: "ml.error-cost",
  version: 1,
  concepts: ["ml.loss"],

  init: (level) => ({ level, t: 0.5, submitted: null, misses: [], hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return errorCost.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.submitted !== null) return state;
    if (action.type === "set") return { ...state, t: clampT(action.t) };
    return costAt(state.level, state.t) <= target(state.level) ? { ...state, submitted: state.t } : { ...state, misses: [...state.misses, state.t] };
  },

  status: (s) => (s.submitted !== null ? "solved" : "playing"),

  /** Доля минимальной цены: best / cost ∈ (0, 1], минус 0.1 за каждую непринятую сдачу. */
  score: (s) => (s.submitted === null ? 0 : Math.max(0, Math.min(1, best(s.level).cost / Math.max(1, costAt(s.level, s.submitted))) - 0.1 * s.misses.length)),

  describe(s) {
    const c = confusion(s.level.scores, s.level.y, s.t);
    return `Порог t = ${f2(s.t)}: ложных тревог ${c.fp}, пропусков ${c.fn}, цена ошибок ${costAt(s.level, s.t)}.`;
  },

  hint(s) {
    const { cFp, cFn } = s.level;
    if (s.hints <= 1) return `Сравните, во что обходится каждое решение для объекта с вероятностью p: отметить — потерять в среднем (1 − p) · ${cFp}, не отметить — p · ${cFn}.`;
    return `Отмечать выгодно, когда p · ${cFn} > (1 − p) · ${cFp}, то есть при p > ${cFp}/(${cFp} + ${cFn}) ≈ ${f2(cFp / (cFp + cFn))}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const b = best(s.level);
    if (s.submitted !== null) return `Порог ${f2(s.submitted)}: цена ${costAt(s.level, s.submitted)}. Минимум на этих данных — ${b.cost} при t = ${f2(b.t)}; теория даёт t = ${f2(s.level.cFp / (s.level.cFp + s.level.cFn))}. Принято!`;
    const miss = s.misses[s.misses.length - 1];
    if (miss === s.t) return `Порог ${f2(miss)} не принят: цена ${costAt(s.level, miss)}, а можно добиться ${b.cost}. Подвиньте порог.`;
    return `Цена ошибок при t = ${f2(s.t)}: ${costAt(s.level, s.t)}. Подберите порог и сдайте его.`;
  },
};

/** Бот для тестов: лучший порог на сетке бегунка и сдача. */
export function solve(state: State): Action[] {
  return [{ type: "set", t: best(state.level).t }, { type: "submit" }];
}
