// Игра «Найди утечку» (урок 2.5 «Основ ML»): уровень — описание задачи, признаки с моментом, когда каждый становится
// известен, шаги конвейера и схема разбиения, а валидация подозрительно хороша. Игрок указывает источник утечки — или
// говорит, что утечки нет. Неверный выбор объясняется и стоит очков; уровень пройден верным выбором. Порядок вариантов
// перемешивается из rng(seed).
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "duration" | "target-encoding" | "random-split" | "duplicates" | "no-leak";

export interface Candidate {
  id: string;
  /** Что это: признак, шаг конвейера или разбиение. */
  kind: "признак" | "шаг конвейера" | "разбиение" | "вывод";
  text: string;
  /** Когда значение известно (для признаков). */
  known?: string;
  /** Разбор после выбора. */
  why: string;
}

export interface Level {
  kind: LevelKind;
  story: string;
  validation: string;
  candidates: Candidate[];
  answer: string;
}

export interface State {
  level: Level;
  picked: string[];
  hints: number;
}

export type Action = { type: "pick"; id: string } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["duration", "target-encoding", "random-split", "duplicates", "no-leak"];
export const LEVELS = LEVEL_KINDS.length;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  duration: "звонки банка",
  "target-encoding": "кодирование района",
  "random-split": "продажи по дням",
  duplicates: "повторные объявления",
  "no-leak": "честная модель",
};

const NONE: Candidate = { id: "none", kind: "вывод", text: "Утечки нет — качество честное", why: "" };

const BANK: Level = {
  kind: "duration",
  story: "Банк решает, кому звонить с предложением вклада. Модель предсказывает отклик клиента; решение звонить принимается до звонка.",
  validation: "ROC-AUC на валидации — 0.93, хотя без одного из признаков было 0.79.",
  candidates: [
    { id: "age", kind: "признак", text: "возраст клиента", known: "из анкеты, до звонка", why: "Возраст известен заранее и законно помогает: убрав его, вы потеряете честное качество." },
    { id: "prev", kind: "признак", text: "число прошлых контактов", known: "из истории, до звонка", why: "История контактов известна до звонка — это честный признак." },
    { id: "duration", kind: "признак", text: "длительность разговора", known: "после звонка", why: "Длительность известна только после звонка, а решение звонить принимают до него. Длинный разговор почти всегда — согласие: модель подсматривает ответ. Без признака валидация падает до честной оценки." },
    { id: "split", kind: "разбиение", text: "стратифицированные 5 фолдов", why: "Стратификация по отклику только выравнивает долю классов в фолдах — утечки она не создаёт." },
    { ...NONE, why: "Рост AUC от одного признака с 0.79 до 0.93 — повод проверить, когда этот признак становится известен." },
  ],
  answer: "duration",
};

const ENCODING: Level = {
  kind: "target-encoding",
  story: "Цена квартиры по признакам; район закодирован средней ценой квартир этого района.",
  validation: "RMSE на кросс-валидации заметно ниже, чем на отложенных новых объявлениях следующего месяца.",
  candidates: [
    { id: "area", kind: "признак", text: "площадь", known: "в объявлении", why: "Площадь известна из объявления — честный признак." },
    { id: "encode", kind: "шаг конвейера", text: "средняя цена района — по всей выборке, до разбиения", why: "Средняя цена района посчитана вместе с ценами валидационных квартир: каждая квартира частично видит свой ответ. Кодирование считают внутри фолда, по обучающей части, — как масштабирование в уроке 2.4." },
    { id: "scale", kind: "шаг конвейера", text: "стандартизация внутри `Pipeline`", why: "Стандартизация внутри конвейера пересчитывается на каждом фолде — так и надо." },
    { id: "split", kind: "разбиение", text: "5 фолдов с перемешиванием", why: "Для независимых объявлений перемешанные фолды подходят; проблема не в них." },
    { ...NONE, why: "Разрыв между кросс-валидацией и новыми данными — классический признак утечки через предобработку." },
  ],
  answer: "encode",
};

const SALES: Level = {
  kind: "random-split",
  story: "Прогноз числа продаж квартир на завтра по данным за прошлые дни: календарь, погода, продажи за вчера.",
  validation: "На случайном разбиении дней ошибка в полтора раза ниже, чем в первый месяц работы модели.",
  candidates: [
    { id: "weekday", kind: "признак", text: "день недели", known: "заранее", why: "Календарь известен заранее — честный признак." },
    { id: "yesterday", kind: "признак", text: "продажи за вчера", known: "к утру прогноза", why: "Вчерашние продажи известны к моменту прогноза — честный признак." },
    { id: "split", kind: "разбиение", text: "случайные 20 % дней — в валидацию", why: "Случайное разбиение кладёт в обучение дни после валидационных: модель учится на будущем и узнаёт сезонные всплески заранее. Для временных данных валидация — только на днях после обучения." },
    { id: "scale", kind: "шаг конвейера", text: "стандартизация внутри `Pipeline`", why: "Стандартизация внутри конвейера честна; дело в разбиении." },
    { ...NONE, why: "Работа хуже валидации в полтора раза — модель видела будущее, которого в работе не будет." },
  ],
  answer: "split",
};

const DUPLICATES: Level = {
  kind: "duplicates",
  story: "Цена квартиры по объявлениям. Одну и ту же квартиру часто выставляют несколько раз с небольшими правками.",
  validation: "Градиентный бустинг почти без ошибок на валидации, но на объявлениях новых домов ошибается как линейная модель.",
  candidates: [
    { id: "floor", kind: "признак", text: "этаж", known: "в объявлении", why: "Этаж — честный признак объявления." },
    { id: "split", kind: "разбиение", text: "случайное разбиение объявлений", why: "Копии одной квартиры попали и в обучение, и в валидацию: модель запоминает цену квартиры, а не учится оценивать. Разбивают по квартирам или домам — все копии в одном фолде." },
    { id: "metro", kind: "признак", text: "время до метро", known: "в объявлении", why: "Время до метро известно из объявления — честный признак." },
    { id: "model", kind: "шаг конвейера", text: "слишком гибкая модель", why: "Гибкость усиливает запоминание, но причина — в копиях по обе стороны разбиения: на честном разбиении эта же модель не была бы «почти без ошибок»." },
    { ...NONE, why: "Почти нулевая ошибка на валидации при провале на новых домах — почти всегда утечка, а не гениальная модель." },
  ],
  answer: "split",
};

const HONEST: Level = {
  kind: "no-leak",
  story: "Отклик на звонок по возрасту, истории контактов и часу звонка; все признаки известны до звонка, кодирование и масштаб — внутри `Pipeline`, фолды стратифицированы.",
  validation: "ROC-AUC на валидации 0.79, на отложенном тесте 0.78.",
  candidates: [
    { id: "hour", kind: "признак", text: "час звонка", known: "до звонка", why: "Час звонка выбирают заранее — признак честный, и убирать его — терять качество." },
    { id: "pipeline", kind: "шаг конвейера", text: "масштабирование внутри `Pipeline`", why: "Внутри конвейера масштаб считается по обучающей части каждого фолда — утечки нет." },
    { id: "split", kind: "разбиение", text: "стратифицированные фолды", why: "Стратификация только выравнивает доли классов — утечки нет." },
    { ...NONE, why: "Верно: все признаки известны до решения, предобработка внутри фолда, а валидация и тест согласуются. Лучший ход — ничего не убирать." },
  ],
  answer: "none",
};

const LEVEL_DATA: Record<LevelKind, Level> = { duration: BANK, "target-encoding": ENCODING, "random-split": SALES, duplicates: DUPLICATES, "no-leak": HONEST };

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const l = LEVEL_DATA[kind];
  // «Утечки нет» всегда последним вариантом, остальные — в случайном порядке
  const none = l.candidates.find((c) => c.id === "none")!;
  return { ...l, candidates: [...r.shuffle(l.candidates.filter((c) => c.id !== "none")), none] };
}

export const findLeak: GameSpec<State, Action, Level> & { feedback(state: State): string; solved(state: State): boolean } = {
  id: "ml.find-leak",
  version: 1,
  concepts: ["ml.ml-practice"],

  init: (level) => ({ level, picked: [], hints: 0 }),

  solved: (s) => s.picked.includes(s.level.answer),

  step(state, action) {
    if (action.type === "reset") return findLeak.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (findLeak.solved(state) || state.picked.includes(action.id)) return state;
    if (!state.level.candidates.some((c) => c.id === action.id)) return state;
    return { ...state, picked: [...state.picked, action.id] };
  },

  status: (s) => (findLeak.solved(s) ? "solved" : "playing"),

  /** 1 за верный выбор с первого раза, минус 0.25 за каждый неверный. */
  score: (s) => (findLeak.solved(s) ? Math.max(0, 1 - 0.25 * (s.picked.length - 1)) : 0),

  describe: (s) => `${s.level.story} ${s.level.validation} Вариантов: ${s.level.candidates.length}, выбрано: ${s.picked.length}.`,

  hint(s) {
    if (s.hints <= 1) return "Для каждого признака спросите: известен ли он в момент, когда модель принимает решение? Для разбиения — не видит ли обучение валидационных объектов или будущего?";
    return s.level.answer === "none" ? "Проверьте, согласуются ли валидация и тест: если да, искать нечего." : `Источник — ${s.level.candidates.find((c) => c.id === s.level.answer)!.kind}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const last = s.picked.at(-1);
    if (!last) return "Выберите, откуда утекает ответ, — или скажите, что утечки нет.";
    const c = s.level.candidates.find((x) => x.id === last)!;
    return findLeak.solved(s) ? `Верно. ${c.why}` : `Не здесь. ${c.why}`;
  },
};

/** Бот для тестов: сразу верный вариант. */
export const solve = (s: State): Action[] => [{ type: "pick", id: s.level.answer }];

/** Вопрос разбора уровня и ответ — разбор верного варианта. */
export const DEBRIEF_LINE = (l: Level) => ({
  question: l.answer === "none" ? "Почему здесь не нужно ничего убирать?" : "Как увидеть такую утечку до запуска модели?",
  answer: l.candidates.find((c) => c.id === l.answer)!.why,
});
