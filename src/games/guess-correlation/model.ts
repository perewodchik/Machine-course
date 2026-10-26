// Игра «Угадай корреляцию» (урок III.9): по облаку точек выбрать его выборочную корреляцию из вариантов.
// Пять уровней по пять облаков: знак, сила, тонкие различия, ловушки (парабола, кольцо, выброс), малая выборка.
// Верный вариант — ближайший к выборочной корреляции облака; облака перегенерируются, пока до него не больше 0.08.
// Модель чистая: облака из rng(seed).
import { corr, linearCloud, parabolaCloud, ringCloud, type Pt } from "../../lib/math/correlation";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "sign" | "strength" | "fine" | "traps" | "small";
export type CloudKind = "linear" | "parabola" | "ring" | "outlier";

export interface Round {
  kind: CloudKind;
  points: Pt[];
  options: number[];
  answer: number;
  /** Выборочная корреляция облака. */
  r: number;
}

export interface Level {
  kind: LevelKind;
  rounds: Round[];
}

export interface State {
  level: Level;
  index: number;
  answers: boolean[];
  last: { chosen: number; correct: boolean } | null;
  hints: number;
}

export type Action = { type: "answer"; option: number } | { type: "next" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["sign", "strength", "fine", "traps", "small"];
export const LEVELS = LEVEL_KINDS.length;
export const ROUNDS = 5;
const TOL = 0.08;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  sign: "знак",
  strength: "сила связи",
  fine: "тонкие различия",
  traps: "ловушки",
  small: "малая выборка",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  sign: {
    question: "Что говорит знак корреляции?",
    answer: "Положительная корреляция — большие x чаще встречаются с большими y: облако вытянуто вправо вверх. Отрицательная — вправо вниз. Около нуля — линейного наклона нет.",
  },
  strength: {
    question: "Чем облако с ρ = 0.9 отличается от облака с ρ = 0.3?",
    answer: "Чем ближе |ρ| к 1, тем у́же облако вокруг прямой: при ρ = ±1 все точки лежат на ней. Наклон прямой тут ни при чём — корреляция не меняется при растяжении осей.",
  },
  fine: {
    question: "Почему 0.5 и 0.8 различить труднее, чем 0 и 0.3?",
    answer: "На глаз мы оцениваем ширину облака, а она равна √(1 − ρ²) от длины: при ρ = 0 и 0.3 почти одинакова (1 и 0.95), а при 0.5 и 0.8 — 0.87 и 0.6. Люди обычно занижают слабые корреляции.",
  },
  traps: {
    question: "Почему у параболы и кольца корреляция около нуля, хотя y зависит от x?",
    answer: "Корреляция измеряет только линейную связь. У параболы правая и левая ветви дают вклады (x − x̄)(y − ȳ) разных знаков, и они гасятся. Некоррелированность не означает независимость. А один далёкий выброс может создать или уничтожить корреляцию.",
  },
  small: {
    question: "Почему у 12 точек выборочная корреляция так скачет?",
    answer: "Выборочная корреляция — оценка, у неё есть разброс, и при малом n он большой: у 12 независимых точек |r| больше 0.3 примерно в трети выборок. Делать выводы о связи по десятку точек опасно.",
  },
};

const ALL = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9];

function linearRound(r: Rng, options: number[], n: number): Round {
  const answer = r.pick(options);
  for (;;) {
    const points = linearCloud(r, answer, n);
    const rr = corr(points);
    if (Math.abs(rr - answer) <= TOL) return { kind: "linear", points, options, answer, r: rr };
  }
}

function trapRound(r: Rng, kind: Exclude<CloudKind, "linear">): Round {
  for (;;) {
    let points: Pt[];
    if (kind === "parabola") points = parabolaCloud(r, 50);
    else if (kind === "ring") points = ringCloud(r, 50);
    else {
      // 30 независимых точек и один далёкий выброс по диагонали
      points = [...linearCloud(r, 0, 30), [5, r.pick([5, -5])] as const];
    }
    const rr = corr(points);
    const answer = ALL.reduce((best, o) => (Math.abs(o - rr) < Math.abs(best - rr) ? o : best), 0);
    if (Math.abs(rr - answer) > TOL || (kind === "outlier" ? answer === 0 : answer !== 0)) continue;
    const others = r.shuffle(ALL.filter((o) => o !== answer && Math.abs(o) !== Math.abs(answer))).slice(0, 2);
    const options = [answer, ...others, kind === "outlier" ? 0 : 0.9].filter((o, i, a) => a.indexOf(o) === i);
    while (options.length < 4) options.push(r.pick(ALL.filter((o) => !options.includes(o))));
    return { kind, points, options: options.sort((a, b) => a - b), answer, r: rr };
  }
}

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const rounds = Array.from({ length: ROUNDS }, (_, i): Round => {
    switch (kind) {
      case "sign":
        return linearRound(r, [-0.8, 0, 0.8], 60);
      case "strength":
        return linearRound(r, r.shuffle(ALL).slice(0, 4).sort((a, b) => a - b), 60);
      case "fine": {
        const s = r.pick([1, -1]);
        return linearRound(r, [0.2, 0.5, 0.8].map((o) => s * o).sort((a, b) => a - b), 80);
      }
      case "traps":
        return i < 3 ? trapRound(r, (["parabola", "ring", "outlier"] as const)[i]!) : linearRound(r, r.shuffle(ALL).slice(0, 4).sort((a, b) => a - b), 50);
      case "small":
        return linearRound(r, [-0.6, 0, 0.6], 12);
    }
  });
  return { kind, rounds: kind === "traps" ? r.shuffle(rounds) : rounds };
}

const done = (s: State) => s.answers.length === s.level.rounds.length && s.last === null;
const f = (v: number) => (v === 0 ? "0" : v.toFixed(1).replace("-", "−"));
export const optionText = f;

export const guessCorrelation: GameSpec<State, Action, Level> & { feedback(state: State): string; current(state: State): Round | undefined } = {
  id: "prob.guess-correlation",
  version: 1,
  concepts: ["prob.joint-distributions"],

  init: (level) => ({ level, index: 0, answers: [], last: null, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return guessCorrelation.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (done(state)) return state;
    const round = state.level.rounds[state.index]!;
    if (action.type === "answer") {
      if (state.last) return state;
      const correct = action.option === round.answer;
      return { ...state, answers: [...state.answers, correct], last: { chosen: action.option, correct } };
    }
    if (!state.last) return state;
    return { ...state, index: Math.min(state.index + 1, state.level.rounds.length - 1), last: null };
  },

  status: (state) => (done(state) ? "solved" : "playing"),
  score: (state) => (state.answers.length ? state.answers.filter(Boolean).length / state.level.rounds.length : 0),

  describe(state) {
    const round = guessCorrelation.current(state);
    if (!round) return `Уровень пройден: верно ${state.answers.filter(Boolean).length} из ${state.level.rounds.length}.`;
    return `Облако ${state.index + 1} из ${state.level.rounds.length}: ${round.points.length} точек. Варианты: ${round.options.map(f).join(", ")}.`;
  },

  hint(state) {
    const round = guessCorrelation.current(state);
    if (!round) return "Уровень пройден.";
    if (state.hints <= 1) return "Сначала знак: облако идёт вправо вверх или вправо вниз? Потом ширина: чем у́же облако вокруг прямой, тем ближе |ρ| к 1.";
    return round.kind === "linear" ? `Корреляция ${round.answer > 0 ? "положительная" : round.answer < 0 ? "отрицательная" : "около нуля"}.` : "Корреляция видит только линейную связь — и очень чувствительна к далёким точкам.";
  },

  generate: (rng, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, rng),
  current: (state) => (done(state) ? undefined : state.level.rounds[state.index]),

  feedback(state) {
    if (done(state)) return `Уровень пройден: верно с первого раза ${state.answers.filter(Boolean).length} из ${state.level.rounds.length}.`;
    const round = state.level.rounds[state.index]!;
    if (!state.last) return `Облако ${state.index + 1} из ${state.level.rounds.length}. Оцените выборочную корреляцию.`;
    const why =
      round.kind === "parabola" ? " Парабола: y зависит от x, но ветви гасят друг друга." : round.kind === "ring" ? " Кольцо: связь есть, линейной — нет." : round.kind === "outlier" ? " Всю корреляцию создаёт одна далёкая точка." : "";
    return `${state.last.correct ? "Верно" : `Неверно: ближе всего ${f(round.answer)}`}. Выборочная корреляция — ${round.r.toFixed(2).replace("-", "−")}.${why}`;
  },
};

/** Бот для тестов: выбрать верный вариант и перейти дальше. */
export function solve(state: State): Action[] {
  return state.level.rounds.flatMap((r) => [{ type: "answer", option: r.answer }, { type: "next" }] as Action[]);
}
