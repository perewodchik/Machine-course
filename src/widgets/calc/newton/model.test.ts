// «Касательные Ньютона»: производные заготовок согласованы, корни верны, сходимость квадратичная; arctg из
// далёкой точки расходится.
import { describe, expect, it } from "vitest";
import { digits, FN_IDS, FNS, newtonPath } from "./model";

describe("заготовки", () => {
  it.each(FN_IDS)("%s: g′ совпадает с конечными разностями, g(корень) = 0", (id) => {
    const fn = FNS[id];
    const h = 1e-6;
    for (const t of [-0.7, 0.3, 1.1, 2.5]) expect(fn.dg(t)).toBeCloseTo((fn.g(t + h) - fn.g(t - h)) / (2 * h), 5);
    expect(Math.abs(fn.g(fn.root))).toBeLessThan(1e-9);
  });

  it("корень кубического уравнения — как у Ньютона в 1669 году: 2.0945514815", () => {
    expect(FNS.cubic.root).toBeCloseTo(2.0945514815, 9);
  });
});

describe("итерации", () => {
  it("квадратичная сходимость: число верных знаков примерно удваивается", () => {
    const path = newtonPath(FNS.cubic, 3.5, 6);
    const d = path.map((t) => digits(FNS.cubic, t));
    expect(d.at(-1)).toBeGreaterThanOrEqual(14);
    // на последних шагах ошибка падает как квадрат: |e₄| ≤ C |e₃|²
    const e = path.map((t) => Math.abs(t - FNS.cubic.root));
    expect(e[4]!).toBeLessThan(10 * e[3]! ** 2);
  });

  it("логистическая потеря: из θ₀ = 0 сходится за 5 шагов, из θ₀ = 3 — расходится (кривизна там почти нулевая)", () => {
    const path = newtonPath(FNS.logistic, 0, 5);
    expect(Math.abs(path.at(-1)! - FNS.logistic.root)).toBeLessThan(1e-8);
    expect(FNS.logistic.root).toBeCloseTo(0.7274, 4);
    expect(Math.abs(newtonPath(FNS.logistic, 3, 3).at(-1)!)).toBeGreaterThan(100);
  });

  it("arctg: из 1.2 сходится, из 1.5 расходится — нужен контроль шага", () => {
    expect(Math.abs(newtonPath(FNS.arctan, 1.2, 8).at(-1)!)).toBeLessThan(1e-6);
    const far = newtonPath(FNS.arctan, 1.5, 8);
    expect(Math.abs(far.at(-1)!)).toBeGreaterThan(Math.abs(far[0]!));
  });
});
