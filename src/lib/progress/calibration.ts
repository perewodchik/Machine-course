// Калибровка уверенности (S4.01, идея B6): насколько отметка «угадываю / скорее да / уверен» перед ответом
// совпадает с долей верных ответов. Считаются только первые попытки задачи с отметкой уверенности: вторая
// попытка уже знает, что первая была неверна. Чистые функции над журналом — их проверяет calibration.test.ts.
import type { AttemptEvent } from "../exercises/types";

export type Level = 1 | 2 | 3;

/** Уровни отметки и ожидаемая доля верных: «уверен» — почти всегда прав, «угадываю» — как повезёт. */
export const LEVELS: readonly { level: Level; name: string; nominal: number }[] = [
  { level: 1, name: "угадываю", nominal: 0.4 },
  { level: 2, name: "скорее да", nominal: 0.7 },
  { level: 3, name: "уверен", nominal: 0.95 },
];

export interface LevelStat {
  level: Level;
  name: string;
  nominal: number;
  n: number;
  correct: number;
  /** Доля верных; null, если попыток нет. */
  rate: number | null;
}

export interface LessonGap {
  lesson: string;
  n: number;
  correct: number;
  rate: number;
}

type Rated = AttemptEvent & { confidence: Level };

/** Первые попытки с отметкой уверенности; повтор той же задачи (урок, задача, seed) не считается дважды. */
export function ratedFirstAttempts(events: readonly { type: string }[]): Rated[] {
  const seen = new Set<string>();
  const out: Rated[] = [];
  for (const e of events) {
    if (e.type !== "attempt") continue;
    const a = e as AttemptEvent;
    if (a.attempt !== 1 || a.confidence === undefined) continue;
    const key = `${a.lesson}|${a.item}|${a.seed}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a as Rated);
  }
  return out;
}

/** Таблица калибровки: по уровню — сколько ответов и какая доля верных. */
export function calibration(events: readonly { type: string }[]): LevelStat[] {
  const rated = ratedFirstAttempts(events);
  return LEVELS.map(({ level, name, nominal }) => {
    const mine = rated.filter((a) => a.confidence === level);
    const correct = mine.filter((a) => a.correct).length;
    return { level, name, nominal, n: mine.length, correct, rate: mine.length ? correct / mine.length : null };
  });
}

/**
 * Уроки, где уверенность завышена: ответов «уверен» не меньше minN, а верных среди них меньше threshold.
 * Худшие — первыми; при равной доле — где ответов больше.
 */
export function overconfident(events: readonly { type: string }[], minN = 2, threshold = 0.7): LessonGap[] {
  const by = new Map<string, { n: number; correct: number }>();
  for (const a of ratedFirstAttempts(events)) {
    if (a.confidence !== 3 || !a.lesson) continue;
    const s = by.get(a.lesson) ?? { n: 0, correct: 0 };
    s.n++;
    if (a.correct) s.correct++;
    by.set(a.lesson, s);
  }
  return [...by.entries()]
    .map(([lesson, s]) => ({ lesson, ...s, rate: s.correct / s.n }))
    .filter((g) => g.n >= minN && g.rate < threshold)
    .sort((x, y) => x.rate - y.rate || y.n - x.n);
}

/** Одна фраза-итог: «когда вы уверены, вы правы в 6 случаях из 10». */
export function verdict(stats: readonly LevelStat[]): string | null {
  const sure = stats.find((s) => s.level === 3);
  if (!sure || sure.n < 3 || sure.rate === null) return null;
  const pct = `${Math.round(sure.rate * 100)}\u00a0%`;
  if (sure.rate >= 0.85) return `Когда вы отвечаете «уверен», вы правы в ${pct} случаев — уверенность оправдана.`;
  return `Когда вы отвечаете «уверен», вы правы только в ${pct} случаев: уверенность завышена. Перед ответом стоит проверить себя ещё раз.`;
}
