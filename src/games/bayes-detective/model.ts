// Игра «Байес-детектив» (урок III.3): улики приходят по одной, после каждой ученик называет вероятность гипотезы.
// Очки — логарифмическое правило против байесовского ответа: потеря — расхождение Кульбака — Лейблера KL(p ‖ q)
// в битах, очки шага — 100 · 2^(−KL). Честный байесовский ответ — единственный способ набрать максимум.
// Улики условно независимы при каждой гипотезе: шансы умножаются на отношение правдоподобия каждой улики.
import type { GameSpec, Rng } from "../_engine/types";

export interface Evidence {
  text: string;
  /** P(улика | гипотеза верна) */
  pH: number;
  /** P(улика | гипотеза неверна) */
  pNotH: number;
}

export type Kind = "first" | "base-rate" | "two" | "against" | "mixed";

export interface Level {
  kind: Kind;
  hypothesis: string;
  prior: number;
  evidence: Evidence[];
}

export interface State {
  level: Level;
  /** Ответы ученика — вероятности после каждой улики. */
  answers: number[];
  /** Положение бегунка, проценты 0–100. */
  draft: number;
  hints: number;
}

export type Action = { type: "set"; value: number } | { type: "answer" } | { type: "reset" } | { type: "hint" };

interface Story {
  hypothesis: string;
  priors: number[];
  for: Evidence[];
  against: Evidence[];
  weak: Evidence[];
}

const STORIES: Story[] = [
  {
    hypothesis: "пациент болен",
    priors: [0.01, 0.02, 0.05, 0.1],
    for: [
      { text: "Тест положителен", pH: 0.9, pNotH: 0.1 },
      { text: "У пациента температура", pH: 0.8, pNotH: 0.2 },
    ],
    against: [{ text: "Повторный тест отрицателен", pH: 0.1, pNotH: 0.9 }],
    weak: [{ text: "Пациент жалуется на усталость", pH: 0.6, pNotH: 0.4 }],
  },
  {
    hypothesis: "письмо — спам",
    priors: [0.2, 0.3, 0.5],
    for: [
      { text: "В теме письма слово «выигрыш»", pH: 0.6, pNotH: 0.1 },
      { text: "Отправителя нет в адресной книге", pH: 0.9, pNotH: 0.3 },
    ],
    against: [{ text: "Письмо обращается к вам по имени", pH: 0.1, pNotH: 0.5 }],
    weak: [{ text: "В письме есть ссылка", pH: 0.8, pNotH: 0.6 }],
  },
  {
    hypothesis: "виновен садовник",
    priors: [0.1, 0.2, 0.5],
    for: [
      { text: "Следы у окна совпали с его обувью", pH: 0.8, pNotH: 0.1 },
      { text: "На его перчатках нашли землю с клумбы у дома", pH: 0.9, pNotH: 0.3 },
    ],
    against: [{ text: "Соседка видела его в тот вечер в другом конце города", pH: 0.2, pNotH: 0.8 }],
    weak: [{ text: "На допросе он нервничал", pH: 0.6, pNotH: 0.4 }],
  },
];

export const LEVELS = 5;

export const KIND_NAMES: Record<Kind, string> = {
  first: "одна улика",
  "base-rate": "редкая гипотеза",
  two: "две улики",
  against: "улика против",
  mixed: "три улики",
};

export const DEBRIEF: Record<Kind, { question: string; answer: string }> = {
  first: {
    question: "Во сколько раз улика изменила шансы гипотезы?",
    answer: "В P(улика | H) / P(улика | не H) раз — это отношение правдоподобия. Апостериорные шансы = априорные шансы × отношение правдоподобия.",
  },
  "base-rate": {
    question: "Улика сильная, а вероятность осталась невысокой. Почему?",
    answer: "Априорные шансы были малы: умножение в несколько раз оставляет их малыми. Это и есть ошибка игнорирования базовой частоты.",
  },
  two: {
    question: "Важен ли порядок, в котором пришли улики?",
    answer: "Нет: при условной независимости шансы умножаются на отношения правдоподобия обеих улик, а умножение коммутативно.",
  },
  against: {
    question: "Как улика против сдвинула оценку?",
    answer: "Её отношение правдоподобия меньше 1: шансы делятся, вероятность падает. Апостериорная после первой улики стала априорной для второй.",
  },
  mixed: {
    question: "Какая улика сдвинула оценку сильнее всего?",
    answer: "Та, у которой отношение правдоподобия дальше всего от 1. Слабая улика (отношение около 1) почти ничего не меняет.",
  },
};

/** Вероятность гипотезы после первых k улик (k = 0 — априорная). */
export function posterior(level: Level, k: number): number {
  let odds = level.prior / (1 - level.prior);
  for (const e of level.evidence.slice(0, k)) odds *= e.pH / e.pNotH;
  return odds / (1 + odds);
}

const clamp = (q: number) => Math.min(0.995, Math.max(0.005, q));

/** Потеря в битах: KL(p ‖ q) — сколько теряет ответ q, если верна вероятность p. */
export function lossBits(p: number, q: number): number {
  const c = clamp(q);
  return p * Math.log2(p / c) + (1 - p) * Math.log2((1 - p) / (1 - c));
}

/** Очки шага: 100 за байесовский ответ, меньше — за любой другой. */
export const points = (p: number, q: number) => Math.round(100 * 2 ** -lossBits(p, q));

export const pct = (v: number) => `${Math.round(v * 100)}\u00a0%`;
const num = (v: number) => String(Math.round(v * 1000) / 1000);

function generateLevel(rng: Rng, difficulty: number): Level {
  const d = Math.max(1, Math.floor(difficulty));
  const kind: Kind = (["first", "base-rate", "two", "against", "mixed"] as const)[Math.min(d, 5) - 1]!;
  // редкая гипотеза — только медицинская история; первая улика — история с ровными шансами
  const story = kind === "base-rate" ? STORIES[0]! : kind === "first" ? rng.pick(STORIES.slice(1)) : rng.pick(STORIES);
  const prior = kind === "first" ? 0.5 : kind === "base-rate" ? rng.pick(story.priors.slice(0, 2)) : rng.pick(story.priors);
  const pro = rng.shuffle(story.for);
  const evidence: Evidence[] =
    kind === "first" || kind === "base-rate"
      ? [pro[0]!]
      : kind === "two"
        ? pro
        : kind === "against"
          ? [pro[0]!, story.against[0]!]
          : rng.shuffle([pro[0]!, story.weak[0]!, d > 5 ? pro[1]! : story.against[0]!]);
  return { kind, hypothesis: story.hypothesis, prior, evidence };
}

export const detective: GameSpec<State, Action, Level> & { feedback(state: State): string; totalPoints(state: State): number } = {
  id: "prob.bayes-detective",
  version: 1,
  concepts: ["prob.bayes", "prob.total-probability"],

  init: (level) => ({ level, answers: [], draft: Math.round(level.prior * 100), hints: 0 }),

  step(state, action) {
    const done = state.answers.length >= state.level.evidence.length;
    if (action.type === "reset") return detective.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return done ? state : { ...state, hints: state.hints + 1 };
    if (done) return state;
    if (action.type === "set") return { ...state, draft: Math.max(0, Math.min(100, Math.round(action.value))) };
    // ответ принят; бегунок ставим на байесовскую вероятность — с неё начинается следующая улика
    const answers = [...state.answers, state.draft / 100];
    return { ...state, answers, draft: Math.round(posterior(state.level, answers.length) * 100) };
  },

  status: (state) => (state.answers.length >= state.level.evidence.length ? "solved" : "playing"),

  /** Средние очки за улики, 0–1: 1 — все ответы байесовские. */
  score: (state) => (state.answers.length === 0 ? 0 : detective.totalPoints(state) / (100 * state.answers.length)),

  totalPoints: (state) => state.answers.reduce((s, q, k) => s + points(posterior(state.level, k + 1), q), 0),

  describe(state) {
    const { level, answers } = state;
    const shown = level.evidence.slice(0, Math.min(level.evidence.length, answers.length + 1));
    const parts = shown.map((e, k) => {
      const head = `Улика ${k + 1}: ${e.text}; P(улика | ${level.hypothesis}) = ${num(e.pH)}, P(улика | нет) = ${num(e.pNotH)}`;
      return answers[k] === undefined ? head : `${head}; ваш ответ ${pct(answers[k]!)}, по Байесу ${pct(posterior(level, k + 1))}`;
    });
    const now = answers.length < level.evidence.length ? ` Ваша оценка сейчас: ${state.draft}\u00a0%.` : "";
    return `Гипотеза: ${level.hypothesis}. Априорная вероятность ${pct(level.prior)}. ${parts.join(". ")}.${now}`;
  },

  hint(state) {
    const { level, answers } = state;
    const k = answers.length;
    const e = level.evidence[k];
    if (!e) return "";
    const before = posterior(level, k);
    const odds = before / (1 - before);
    const ratio = e.pH / e.pNotH;
    if (state.hints <= 1) return `Переведите вероятность в шансы: до этой улики шансы гипотезы ${num(odds)} к 1.`;
    if (state.hints === 2) return `Улика умножает шансы на P(улика | гипотеза) / P(улика | нет) = ${num(e.pH)} / ${num(e.pNotH)} = ${num(ratio)}. Новые шансы — ${num(odds * ratio)} к 1.`;
    return `Вероятность = шансы / (1 + шансы) = ${pct(posterior(level, k + 1))}.`;
  },

  generate: generateLevel,

  feedback(state) {
    const { level, answers } = state;
    if (answers.length === 0) return "Прочитайте улику и оцените вероятность гипотезы с её учётом.";
    const k = answers.length;
    const p = posterior(level, k);
    const last = `Улика ${k}: по Байесу ${pct(p)}, ваш ответ ${pct(answers[k - 1]!)} — ${points(p, answers[k - 1]!)} очков из 100.`;
    if (k < level.evidence.length) return `${last} В деле новая улика — ${k + 1}-я.`;
    return `${last} Дело закрыто: ${detective.totalPoints(state)} очков из ${100 * k}.`;
  },
};

/** Байесовский игрок для тестов: на каждой улике называет точную апостериорную вероятность (в процентах). */
export function bayesPlayer(state: State): Action[] {
  return state.level.evidence.flatMap((_, k) => [{ type: "set", value: posterior(state.level, k + 1) * 100 } as Action, { type: "answer" } as Action]);
}
