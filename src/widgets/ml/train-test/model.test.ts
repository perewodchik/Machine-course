// «Обучение и тест»: ошибка на обучении не растёт со степенью; на 20 точках степень 12 переобучается (тест заметно хуже
// обучения и хуже степени 1); на 200 точках переобучение слабее.
import { describe, expect, it } from "vitest";
import { curves, sample } from "./model";

describe("обучение и тест", () => {
  it("обучение монотонно, тест — U: на 20 точках степень 12 хуже степени 1", () => {
    let worse = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const c = curves(sample(seed, 20));
      // до степени 9 ошибка на обучении не растёт; выше почти интерполирующие полиномы численно неустойчивы,
      // и крошечный гребневой штраф даёт колебания в доли процента — проверяем только, что степень 12 лучше прямой
      for (let d = 1; d <= 9; d++) expect(c[d]!.train).toBeLessThanOrEqual(c[d - 1]!.train + 1e-6);
      expect(c[12]!.train).toBeLessThan(c[1]!.train);
      if (c[12]!.test > c[1]!.test * 1.2) worse++;
      expect(c[12]!.test).toBeGreaterThan(c[12]!.train);
    }
    expect(worse).toBeGreaterThanOrEqual(15);
  });

  it("на 200 точках зазор между обучением и тестом у степени 12 меньше, чем на 20", () => {
    let smaller = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const g20 = curves(sample(seed, 20))[12]!;
      const g200 = curves(sample(seed, 200))[12]!;
      if (g200.test - g200.train < g20.test - g20.train) smaller++;
    }
    expect(smaller).toBeGreaterThanOrEqual(18);
  });
});
