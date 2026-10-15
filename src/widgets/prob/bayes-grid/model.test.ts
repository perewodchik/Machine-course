// Эталонные числа урока III.3 (сверены в Python: code/tests/test_bayes.py).
import { describe as group, expect, it } from "vitest";
import { arrange, counts, DEFAULT, describe, evidence, pct, posterior, POPULATION } from "./model";

group("сетка из 1000 человек", () => {
  it("пример урока: 1 % больных, тест находит 90 % больных и срабатывает у 9 % здоровых", () => {
    expect(counts(DEFAULT)).toEqual({ tp: 9, fn: 1, fp: 89, tn: 901 });
    expect(evidence(DEFAULT)).toBeCloseTo(0.0981, 10);
    expect(posterior(DEFAULT)).toBeCloseTo(0.0917, 4);
    expect(pct(posterior(DEFAULT))).toBe("9.2\u00a0%");
  });

  it("второй независимый положительный тест: апостериорная становится априорной — около 50 %", () => {
    const second = { ...DEFAULT, prevalence: posterior(DEFAULT) };
    expect(posterior(second)).toBeCloseTo(0.5025, 4);
  });

  it("группы в сумме дают всю популяцию; порядок «по тесту» ставит положительных первыми", () => {
    for (const prevalence of [0, 0.001, 0.01, 0.2, 0.5]) {
      const c = counts({ ...DEFAULT, prevalence });
      expect(c.tp + c.fn + c.fp + c.tn).toBe(POPULATION);
    }
    const cells = arrange(counts(DEFAULT), "test");
    expect(cells).toHaveLength(POPULATION);
    expect(cells.slice(0, 98).every((g) => g === "tp" || g === "fp")).toBe(true);
    expect(arrange(counts(DEFAULT), "disease").slice(0, 10).every((g) => g === "tp" || g === "fn")).toBe(true);
  });

  it("крайние случаи: без больных апостериорная 0, без ложных срабатываний — 1", () => {
    expect(posterior({ ...DEFAULT, prevalence: 0 })).toBe(0);
    expect(posterior({ ...DEFAULT, falsePositive: 0 })).toBe(1);
  });

  it("описание для скринридера", () => {
    expect(describe(DEFAULT)).toBe("Из 1000 человек больны 10. Тест положителен у 9 больных и у 89 здоровых: из 98 положительных больны 9. P(болен | +) = 9.2\u00a0%.");
  });
});
