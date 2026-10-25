// Калибровка: считаются первые попытки с отметкой, повтор задачи — один раз; уроки с завышенной уверенностью.
import { describe, expect, it } from "vitest";
import type { AttemptEvent } from "../exercises/types";
import { calibration, overconfident, ratedFirstAttempts, verdict } from "./calibration";

let t = 0;
const a = (lesson: string, correct: boolean, confidence?: 1 | 2 | 3, attempt = 1, seed = t++): AttemptEvent => ({
  type: "attempt",
  lesson,
  item: "x",
  seed,
  attempt,
  correct,
  hints: 0,
  ms: 1000,
  confidence,
  at: "2026-10-25T00:00:00Z",
});

describe("калибровка уверенности", () => {
  it("берёт только первые попытки с отметкой и не считает повтор задачи дважды", () => {
    const events = [a("L", true, 3, 1, 1), a("L", false, 3, 1, 1), a("L", true, 3, 2, 2), a("L", false, undefined, 1, 3), { type: "mark" }];
    expect(ratedFirstAttempts(events)).toHaveLength(1);
  });

  it("доля верных по уровням; пустой уровень — null", () => {
    const events = [a("A", true, 3), a("A", true, 3), a("A", false, 3), a("B", false, 1), a("B", true, 1)];
    const [g, m, s] = calibration(events);
    expect(g).toMatchObject({ level: 1, n: 2, correct: 1, rate: 0.5 });
    expect(m).toMatchObject({ level: 2, n: 0, rate: null });
    expect(s!.rate).toBeCloseTo(2 / 3, 12);
  });

  it("завышенная уверенность: урок с ≥ 2 ответами «уверен» и долей верных ниже 70%, худшие первыми", () => {
    const events = [
      ...[false, false, true].map((c) => a("bad", c, 3)),
      ...[true, false].map((c) => a("half", c, 3)),
      ...[true, true, true].map((c) => a("good", c, 3)),
      a("once", false, 3),
      ...[false, false].map((c) => a("guess", c, 1)),
    ];
    expect(overconfident(events).map((g) => g.lesson)).toEqual(["bad", "half"]);
  });

  it("итоговая фраза — только при трёх и более ответах «уверен»", () => {
    expect(verdict(calibration([a("A", true, 3), a("A", true, 3)]))).toBeNull();
    expect(verdict(calibration([a("A", true, 3), a("A", false, 3), a("A", false, 3)]))).toContain("только в 33\u00a0%");
    expect(verdict(calibration([a("A", true, 3), a("A", true, 3), a("A", true, 3)]))).toContain("оправдана");
  });
});
