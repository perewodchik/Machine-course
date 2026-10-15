// Упражнения: описание задачи (что видит ученик и как проверить ответ). Тексты — с $…$ для формул:
// их отрисовывает сервер (KaTeX в браузер не попадает), клиент получает только данные для проверки.
// Типы — docs/conventions/pedagogy.md, «Упражнения».
import type { SymbolShape } from "../symbolic/equivalent";

interface Base {
  /** Условие: текст с $…$. */
  prompt: string;
  /** Лесенка подсказок: идея → план → часть решения → решение. */
  hints?: string[];
  /** Пояснение после верного ответа. */
  right?: string;
  /** Пояснение после неверного ответа (у выбора — у каждого варианта своё). */
  wrong?: string;
}

/** Типичная ошибка в ответе: неверное выражение (TeX) и объяснение с $…$. */
export interface MutationHint {
  tex: string;
  why: string;
}

export interface NumericSpec extends Base {
  kind: "numeric";
  /** Подпись поля: «$\theta_1 =$». */
  label: string;
  answer: number;
  /** Допуск: абсолютный (по умолчанию 0.005) и относительный. */
  tol?: number;
  rel?: number;
}

export interface ChoiceOption {
  text: string;
  correct?: boolean;
  /** Почему вариант верен или в чём ошибка: неверный вариант — типичная ошибка. */
  why: string;
}

export interface ChoiceSpec extends Base {
  kind: "choice";
  options: ChoiceOption[];
}

export interface MatrixSpec extends Base {
  kind: "matrix";
  /** Подпись слева от сетки: «$AB =$». */
  label: string;
  answer: number[][];
  tol?: number;
}

export interface OrderSpec extends Base {
  kind: "order";
  /** Шаги в верном порядке; ученику показываются перемешанными (seed). */
  steps: string[];
}

export interface PredictSpec extends Base {
  kind: "predict";
  /** Вопрос-предсказание и варианты; после выбора открывается ответ. */
  options: ChoiceOption[];
  /** Что на самом деле: показывается после предсказания. */
  reveal: string;
}

export interface FormulaSpec extends Base {
  kind: "formula";
  /** Подпись поля: «$\nabla_\theta J =$». */
  label: string;
  /** Эталон в TeX; ответ ученика сравнивается с ним численно на случайных матрицах (src/lib/symbolic). */
  answer: string;
  /** Символы ответа: имя в MathJSON («theta», «X»), форма («n», «d», числа), положительность. */
  symbols: SymbolShape[];
  /** Типичные ошибки (S3.05): ответ, равный одной из них, получает её объяснение. */
  mutations?: MutationHint[];
}

export interface StepsSpec extends Base {
  kind: "steps";
  /** Первая строка вывода (TeX), дана ученику. */
  start: string;
  /** Подпись перед первой строкой: «$J(\theta) =$». */
  label?: string;
  /** Цель — последняя строка: выражение или решение «\theta = …» (src/lib/symbolic/derivation.ts). */
  goal: string;
  symbols: SymbolShape[];
  /** Сколько полей для строк (видны сначала три). */
  lines?: number;
  /** Типичные ошибки в строках вывода: неверная строка, равная одной из них, получает её объяснение. */
  mutations?: MutationHint[];
}

export type ExerciseSpec = NumericSpec | ChoiceSpec | MatrixSpec | OrderSpec | PredictSpec | FormulaSpec | StepsSpec;

/** Генератор параметрической задачи: одна и та же задача при одном seed. */
export interface Generator {
  id: string;
  /** Версия генератора — в журнал: после правки генератора старые записи не смешиваются с новыми. */
  version: number;
  title: string;
  make(seed: number): ExerciseSpec;
}

/** Запись журнала попыток (docs/implementation/context/progress-learning.md). */
export interface AttemptEvent {
  type: "attempt";
  lesson: string;
  item: string;
  seed: number;
  attempt: number;
  correct: boolean;
  hints: number;
  ms: number;
  confidence?: 1 | 2 | 3;
  generatorVersion?: number;
  at: string;
}

/** Смена галочки «знаю» в журнале. */
export interface MarkEvent {
  type: "mark";
  lesson: string;
  known: boolean;
  by: "learner" | "lesson-check" | "diagnostic";
  at: string;
}

/** Шаг вывода открыт впервые (src/client/derivation.ts): по этим событиям видно, где ученики бросают вывод. */
export interface StepEvent {
  type: "step";
  lesson: string;
  formula: string;
  /** Номер открытого шага, с нуля. */
  step: number;
  /** Включён ли режим «Сначала предсказать шаг». */
  predict: boolean;
  at: string;
}

/** Микроопрос в конце урока (LessonSurvey). */
export interface SurveyEvent {
  type: "survey";
  lesson: string;
  /** Насколько понятно: 1 — совсем непонятно, 5 — всё понятно. */
  clarity: 1 | 2 | 3 | 4 | 5;
  /** Раздел урока, где споткнулись; пусто — нигде. */
  stuck?: string;
  comment?: string;
  at: string;
}

