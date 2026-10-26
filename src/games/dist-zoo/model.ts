// Игра «Зоопарк распределений» (урок III.6): по сюжету или по форме функции вероятности узнать семейство —
// Бернулли, биномиальное, геометрическое, Пуассона, категориальное, мультиномиальное. Пять уровней по пять
// карточек; очки — доля верных с первого раза. Модель чистая: карточки из rng(seed).
import { pmf, type FamilyId as BaseFamily } from "../../lib/math/distributions";
import type { GameSpec, Rng } from "../_engine/types";

export type Family = BaseFamily | "multinomial";
export type LevelKind = "three" | "poisson" | "classes" | "shapes" | "mixed";

export type Card =
  | { kind: "story"; family: Family; text: string }
  | { kind: "shape"; family: Exclude<Family, "categorical" | "multinomial">; params: { phi?: number; n?: number; lambda?: number }; values: string };

export interface Level {
  kind: LevelKind;
  families: Family[];
  cards: Card[];
}

export interface State {
  level: Level;
  index: number;
  answers: boolean[];
  last: { chosen: Family; correct: boolean } | null;
  hints: number;
}

export type Action = { type: "answer"; family: Family } | { type: "next" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["three", "poisson", "classes", "shapes", "mixed"];
export const LEVELS = LEVEL_KINDS.length;
export const CARDS = 5;

export const FAMILY_NAMES: Record<Family, string> = {
  bernoulli: "Бернулли",
  binomial: "биномиальное",
  geometric: "геометрическое",
  poisson: "Пуассона",
  categorical: "категориальное",
  multinomial: "мультиномиальное",
};

export const LEVEL_NAMES: Record<LevelKind, string> = {
  three: "успехи и неудачи",
  poisson: "редкие события",
  classes: "много классов",
  shapes: "по форме",
  mixed: "решите сами",
};

/** Чем семейство узнаётся: подсказка и разбор. */
export const SIGNS: Record<Family, string> = {
  bernoulli: "одно испытание, исход 0 или 1",
  binomial: "число успехов в фиксированном числе n независимых испытаний: значения 0, …, n",
  geometric: "номер первого успеха: значения 1, 2, 3, …, вероятности убывают",
  poisson: "число редких независимых событий за интервал: значения 0, 1, 2, … без верхней границы, E = Var = λ",
  categorical: "одно испытание, исход — один из K классов",
  multinomial: "n испытаний с K классами: вектор счётчиков по классам",
};

const STORIES: Record<Family, readonly string[]> = {
  bernoulli: ["Купит ли посетитель сайта товар: 1 — купил, 0 — нет.", "Окажется ли одно письмо спамом.", "Выпадет ли орёл при одном броске монеты."],
  binomial: ["Сколько из 20 писем окажутся спамом, если каждое — спам с вероятностью 0.1.", "Число орлов в 10 бросках монеты.", "Сколько из 50 пациентов выздоровеют, если лекарство помогает каждому с вероятностью 0.7."],
  geometric: ["Сколько бросков кубика понадобится до первой шестёрки, считая её саму.", "С какой попытки студент сдаст экзамен, если каждый раз сдаёт с вероятностью 0.4.", "Каким по счёту окажется первый звонок, после которого клиент купит подписку."],
  poisson: ["Сколько звонков поступит в колл-центр за минуту.", "Сколько опечаток окажется на странице книги.", "Сколько метеоритов упадёт на поле площадью в гектар за год."],
  categorical: ["Какой гранью упадёт кубик.", "Какая цифра от 0 до 9 нарисована на одной картинке.", "Какое слово из словаря окажется следующим в тексте."],
  multinomial: ["Сколько раз выпала каждая грань в 60 бросках кубика.", "Сколько раз каждое слово словаря встретилось в письме из 100 слов.", "Сколько голосов получил каждый из пяти кандидатов от 1000 избирателей."],
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  three: {
    question: "Чем биномиальное отличается от геометрического?",
    answer: "Биномиальное считает успехи в заранее заданном числе испытаний n — значения от 0 до n. Геометрическое считает, сколько испытаний понадобится до первого успеха, — число испытаний случайно, значения 1, 2, 3, … без верхней границы.",
  },
  poisson: {
    question: "Когда число событий описывает Пуассон, а не биномиальное?",
    answer: "Когда испытаний очень много, а успех в каждом редок: биномиальное с большим n и малым φ почти не отличается от Пуассона с λ = nφ. У Пуассона нет верхней границы, а матожидание и дисперсия равны λ.",
  },
  classes: {
    question: "Как связаны Бернулли, категориальное, биномиальное и мультиномиальное?",
    answer: "Категориальное — Бернулли с K классами вместо двух; мультиномиальное — биномиальное с K классами: счётчики классов в n испытаниях. В CS229 мультиномиальная модель описывает слова письма в наивном Байесе.",
  },
  shapes: {
    question: "Как узнать семейство по форме функции вероятности?",
    answer: "Только 0 и 1 — Бернулли. Значения с единицы и убывание — геометрическое. Значения с нуля, горб и известная граница n — биномиальное; без границы — Пуассона.",
  },
  mixed: {
    question: "Какой вопрос задать себе, чтобы узнать семейство?",
    answer: "Что считаем: исход одного испытания, число успехов в n испытаниях, номер первого успеха, число событий за интервал или счётчики по классам? Ответ сразу называет семейство.",
  },
};

const PLAN: Record<LevelKind, Family[]> = {
  three: ["bernoulli", "binomial", "geometric"],
  poisson: ["bernoulli", "binomial", "geometric", "poisson"],
  classes: ["bernoulli", "binomial", "categorical", "multinomial", "poisson"],
  shapes: ["bernoulli", "binomial", "geometric", "poisson"],
  mixed: ["bernoulli", "binomial", "geometric", "poisson", "categorical", "multinomial"],
};

function shapeCard(r: Rng, family: Exclude<Family, "categorical" | "multinomial">): Card {
  switch (family) {
    case "bernoulli":
      return { kind: "shape", family, params: { phi: r.pick([0.2, 0.3, 0.7]) }, values: "0 и 1" };
    case "binomial": {
      const n = r.pick([6, 8, 10]);
      return { kind: "shape", family, params: { n, phi: r.pick([0.3, 0.5, 0.6]) }, values: `0, 1, …, ${n} — больше ${n} не бывает` };
    }
    case "geometric":
      return { kind: "shape", family, params: { phi: r.pick([0.3, 0.4, 0.5]) }, values: "1, 2, 3, … без верхней границы" };
    case "poisson":
      return { kind: "shape", family, params: { lambda: r.pick([2, 3, 4]) }, values: "0, 1, 2, … без верхней границы" };
  }
}

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const families = PLAN[kind];
  // пять карточек: все семейства уровня хотя бы раз, остальное — случайно
  const picks = r.shuffle([...families, ...Array.from({ length: Math.max(0, CARDS - families.length) }, () => r.pick(families))]).slice(0, CARDS);
  const cards = picks.map((f): Card => {
    const shape = kind === "shapes" || (kind === "mixed" && f !== "categorical" && f !== "multinomial" && r.next() < 0.4);
    if (shape && f !== "categorical" && f !== "multinomial") return shapeCard(r, f);
    return { kind: "story", family: f, text: r.pick(STORIES[f]) };
  });
  return { kind, families, cards };
}

/** Функция вероятности карточки «по форме» для рисунка. */
export function cardPmf(card: Card, k: number): number {
  return card.kind === "shape" ? pmf(card.family, card.params, k) : 0;
}

const done = (s: State) => s.answers.length === s.level.cards.length && s.last === null;

export const distZoo: GameSpec<State, Action, Level> & { feedback(state: State): string; current(state: State): Card | undefined } = {
  id: "prob.dist-zoo",
  version: 1,
  concepts: ["prob.discrete-distributions"],

  init: (level) => ({ level, index: 0, answers: [], last: null, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return distZoo.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (done(state)) return state;
    const card = state.level.cards[state.index]!;
    if (action.type === "answer") {
      if (state.last) return state;
      const correct = action.family === card.family;
      return { ...state, answers: [...state.answers, correct], last: { chosen: action.family, correct } };
    }
    if (!state.last) return state;
    return { ...state, index: Math.min(state.index + 1, state.level.cards.length - 1), last: null };
  },

  status: (state) => (done(state) ? "solved" : "playing"),
  score: (state) => (state.answers.length ? state.answers.filter(Boolean).length / state.level.cards.length : 0),

  describe(state) {
    const card = distZoo.current(state);
    if (!card) return `Уровень пройден: верно ${state.answers.filter(Boolean).length} из ${state.level.cards.length}.`;
    const what = card.kind === "story" ? card.text : `Функция вероятности на рисунке; значения: ${card.values}.`;
    return `Карточка ${state.index + 1} из ${state.level.cards.length}. ${what} Какое это распределение?`;
  },

  hint(state) {
    const card = distZoo.current(state);
    if (!card) return "Уровень пройден.";
    if (state.hints <= 1) return "Спросите себя: что считаем — исход одного испытания, успехи в n испытаниях, номер первого успеха, события за интервал или счётчики классов?";
    return `Это ${FAMILY_NAMES[card.family]}: ${SIGNS[card.family]}.`;
  },

  generate: (rng, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, rng),
  current: (state) => (done(state) ? undefined : state.level.cards[state.index]),

  feedback(state) {
    if (done(state)) return `Уровень пройден: верно с первого раза ${state.answers.filter(Boolean).length} из ${state.level.cards.length}.`;
    const card = state.level.cards[state.index]!;
    if (!state.last) return `Карточка ${state.index + 1} из ${state.level.cards.length}. ${card.kind === "story" ? "Прочитайте сюжет." : "Посмотрите на форму и на значения."}`;
    return `${state.last.correct ? "Верно" : `Неверно: это ${FAMILY_NAMES[card.family]}`}. Признак — ${SIGNS[card.family]}.`;
  },
};

/** Бот для тестов: ответить семейством карточки и перейти дальше. */
export function solve(state: State): Action[] {
  return state.level.cards.flatMap((c) => [{ type: "answer", family: c.family }, { type: "next" }] as Action[]);
}
