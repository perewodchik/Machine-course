// Виджет «События как области» (урок III.1): пространство исходов — 36 пар очков двух кубиков. События —
// подмножества; вероятность при равновозможных исходах — доля клеток. В уроке III.2 — условие «A | B» и независимость. Модель без DOM: заготовки событий, операции
// и проверка формулы включений-исключений.
export type Outcome = readonly [number, number];
export type EventId = "sum8" | "evenFirst" | "double" | "six2" | "sumLe4" | "max5";
export type Op = "union" | "intersection" | "complementA" | "given";

export interface EventDef {
  id: EventId;
  /** Подпись в тексте и на кнопке. */
  name: string;
  has: (o: Outcome) => boolean;
}

export const OMEGA: readonly Outcome[] = Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6) + 1, (i % 6) + 1] as const);

export const EVENTS: Record<EventId, EventDef> = {
  sum8: { id: "sum8", name: "сумма ≥ 8", has: ([a, b]) => a + b >= 8 },
  evenFirst: { id: "evenFirst", name: "первый чётный", has: ([a]) => a % 2 === 0 },
  double: { id: "double", name: "дубль", has: ([a, b]) => a === b },
  six2: { id: "six2", name: "на втором 6", has: ([, b]) => b === 6 },
  sumLe4: { id: "sumLe4", name: "сумма ≤ 4", has: ([a, b]) => a + b <= 4 },
  max5: { id: "max5", name: "максимум ≥ 5", has: ([a, b]) => Math.max(a, b) >= 5 },
};

export const EVENT_IDS = Object.keys(EVENTS) as EventId[];

export const OP_NAMES: Record<Op, string> = { union: "A ∪ B", intersection: "A ∩ B", complementA: "не A", given: "A | B" };

/** Число исходов в событии. */
export const count = (has: (o: Outcome) => boolean) => OMEGA.filter(has).length;

/** Вероятность при равновозможных исходах: |E| / |Ω|. */
export const prob = (has: (o: Outcome) => boolean) => count(has) / OMEGA.length;

/** Событие-результат операции над A и B. */
export function combine(op: Op, a: EventDef, b: EventDef): (o: Outcome) => boolean {
  switch (op) {
    case "union":
      return (o) => a.has(o) || b.has(o);
    case "intersection":
      return (o) => a.has(o) && b.has(o);
    case "complementA":
      return (o) => !a.has(o);
    case "given":
      // урок III.2: в мире «произошло B» остаются исходы B, событие A в нём — A ∩ B
      return (o) => a.has(o) && b.has(o);
  }
}

/** P(A | B) = |A ∩ B| / |B|: условие сужает мир до исходов B (урок III.2). */
export const conditional = (a: EventDef, b: EventDef) => count((o) => a.has(o) && b.has(o)) / count(b.has);

/** Независимость: P(A ∩ B) = P(A) P(B), в числах клеток — 36 |A ∩ B| = |A| |B|. */
export const independent = (a: EventDef, b: EventDef) => 36 * count((o) => a.has(o) && b.has(o)) === count(a.has) * count(b.has);
