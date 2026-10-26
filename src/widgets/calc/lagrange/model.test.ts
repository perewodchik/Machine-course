// «Касание линии уровня и ограничения»: в точках касания ∇f ∥ ∇h, на окружности это собственные векторы Σ
// и λ множителя равно собственному значению; на прямой — минимум из лагранжиана.
import { describe, expect, it } from "vitest";
import { angleBetween, CASES, eigs, gradF, lambda, touching, value } from "./model";

describe("PCA: uᵀΣu на единичной окружности", () => {
  const c = CASES.pca;
  it("градиент f совпадает с конечными разностями", () => {
    const u = c.at(37);
    const h = 1e-6;
    const g = gradF(c, u);
    expect(g[0]).toBeCloseTo((value(c, [u[0] + h, u[1]]) - value(c, [u[0] - h, u[1]])) / (2 * h), 5);
    expect(g[1]).toBeCloseTo((value(c, [u[0], u[1] + h]) - value(c, [u[0], u[1] - h])) / (2 * h), 5);
  });

  it("касания — собственные векторы Σ, λ множителя — собственное значение, максимум uᵀΣu = λ₁", () => {
    const [l1, l2] = eigs(c.form);
    const [top, other] = c.touches as [number, number];
    for (const [p, l] of [[top, l1], [other, l2]] as const) {
      const u = c.at(p);
      expect(angleBetween(gradF(c, u), c.gradH(u))).toBeLessThan(1e-5); // acos около 1 теряет точность: градусы до 10⁻⁶
      // ∇f = 2Σu, ∇h = 2u: λ из ∇f = λ∇h совпадает с собственным значением и со значением uᵀΣu
      expect(lambda(gradF(c, u), c.gradH(u))).toBeCloseTo(l, 9);
      expect(value(c, u)).toBeCloseTo(l, 9);
    }
    const best = Math.max(...Array.from({ length: 1801 }, (_, i) => value(c, c.at(i / 10))));
    expect(best).toBeCloseTo(l1, 4);
    expect(touching(c, Math.round(top))).toBe(true);
    expect(touching(c, top + 20)).toBe(false);
  });
});

describe("прямая x₁ + x₂ = 1", () => {
  it("касание в (2/3, 1/3) — минимум f на прямой, λ = 2/3", () => {
    const c = CASES.line;
    const t = c.touches[0]!;
    expect(angleBetween(gradF(c, c.at(t)), c.gradH(c.at(t)))).toBeLessThan(1e-5); // acos около 1 теряет точность: градусы до 10⁻⁶
    expect(lambda(gradF(c, c.at(t)), c.gradH(c.at(t)))).toBeCloseTo(2 / 3, 12);
    const vals = Array.from({ length: 301 }, (_, i) => value(c, c.at(-1 + i / 100)));
    expect(Math.min(...vals)).toBeCloseTo(value(c, c.at(t)), 4);
  });
});
