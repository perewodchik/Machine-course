// «Облако моделей»: степень уменьшает смещение и раздувает разброс; рост n сжимает разброс, почти не трогая смещение;
// σ поднимает пол; минимум ожидаемой ошибки — в середине.
import { describe, expect, it } from "vitest";
import { polyFit, polyFitMoments } from "../../../lib/math/poly";
import { cloud, errorByDegree } from "./model";

describe("облако моделей", () => {
  it("быстрый МНК через моменты совпадает с polyFit", () => {
    const pts = Array.from({ length: 30 }, (_, i) => [-1 + i / 15, Math.sin(i)] as const);
    for (const d of [1, 4, 8]) polyFitMoments(pts, d).forEach((v, j) => expect(v).toBeCloseTo(polyFit(pts, d)[j]!, 6));
  });

  it("степень 1 → 5: смещение падает, разброс растёт", () => {
    const a = cloud(1, 30, 0.3);
    const b = cloud(5, 30, 0.3);
    expect(b.bias2).toBeLessThan(a.bias2 / 10);
    expect(b.variance).toBeGreaterThan(a.variance);
  });

  it("n ×4: разброс в ~4 раза меньше, смещение почти то же", () => {
    const a = cloud(3, 30, 0.3);
    const b = cloud(3, 120, 0.3);
    expect(a.variance / b.variance).toBeGreaterThan(2.5);
    expect(Math.abs(a.bias2 - b.bias2)).toBeLessThan(0.002);
  });

  it("ошибка по степени — U: минимум в середине, пол — σ²", () => {
    const e = errorByDegree(30, 0.3);
    const best = e.reduce((a, b) => (b.total < a.total ? b : a));
    expect(best.k).toBeGreaterThanOrEqual(2);
    expect(best.k).toBeLessThanOrEqual(6);
    for (const r of e) expect(r.total).toBeGreaterThan(0.09);
    expect(e[0]!.total).toBeGreaterThan(best.total);
    expect(e[12]!.total).toBeGreaterThan(best.total);
  });
});
