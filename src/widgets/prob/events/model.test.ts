// «События как области»: 36 исходов, включения-исключения и дополнение для всех пар заготовок.
import { describe, expect, it } from "vitest";
import { combine, conditional, count, EVENT_IDS, EVENTS, independent, OMEGA, prob } from "./model";

describe("события двух кубиков", () => {
  it("36 различных исходов; известные числа: сумма ≥ 8 — 15, дубль — 6", () => {
    expect(new Set(OMEGA.map(([a, b]) => `${a}${b}`)).size).toBe(36);
    expect(count(EVENTS.sum8.has)).toBe(15);
    expect(count(EVENTS.double.has)).toBe(6);
    expect(count(EVENTS.sumLe4.has)).toBe(6);
    expect(count(EVENTS.max5.has)).toBe(20);
  });

  it("для всех пар: P(A ∪ B) = P(A) + P(B) − P(A ∩ B), P(не A) = 1 − P(A)", () => {
    for (const i of EVENT_IDS)
      for (const j of EVENT_IDS) {
        const [a, b] = [EVENTS[i], EVENTS[j]];
        expect(prob(combine("union", a, b))).toBeCloseTo(prob(a.has) + prob(b.has) - prob(combine("intersection", a, b)), 12);
        expect(prob(combine("complementA", a, b))).toBeCloseTo(1 - prob(a.has), 12);
      }
  });

  it("несовместные «сумма ≥ 8» и «сумма ≤ 4»: пересечение пусто, вероятности складываются", () => {
    expect(count(combine("intersection", EVENTS.sum8, EVENTS.sumLe4))).toBe(0);
    expect(count(combine("union", EVENTS.sum8, EVENTS.sumLe4))).toBe(21);
  });
});

describe("условная вероятность и независимость (урок III.2)", () => {
  it("P(A | B) = |A ∩ B| / |B|; «первый чётный» и «на втором 6» независимы, «сумма ≥ 8» и «первый чётный» — нет", () => {
    expect(conditional(EVENTS.sum8, EVENTS.evenFirst)).toBeCloseTo(9 / 18, 12);
    expect(conditional(EVENTS.evenFirst, EVENTS.sum8)).toBeCloseTo(9 / 15, 12);
    expect(independent(EVENTS.evenFirst, EVENTS.six2)).toBe(true);
    expect(conditional(EVENTS.evenFirst, EVENTS.six2)).toBeCloseTo(prob(EVENTS.evenFirst.has), 12);
    expect(independent(EVENTS.sum8, EVENTS.evenFirst)).toBe(false);
  });

  it("несовместные события с ненулевыми вероятностями зависимы", () => {
    expect(count(combine("intersection", EVENTS.sum8, EVENTS.sumLe4))).toBe(0);
    expect(independent(EVENTS.sum8, EVENTS.sumLe4)).toBe(false);
  });
});
