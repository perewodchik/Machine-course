// «Как растягивается площадь»: det J полярной замены равен r, точная площадь клетки отличается от r Δr Δφ
// на ½Δr²Δφ — относительная ошибка исчезает при Δ → 0.
import { describe, expect, it } from "vitest";
import { cellImage, exactArea, jacobian, linearArea, polar } from "./model";

describe("полярные координаты", () => {
  it("якобиан — конечные разности отображения, det J = r", () => {
    const [r, phi, h] = [1.3, 0.7, 1e-6];
    const { J, det } = jacobian(r, phi);
    const dr = polar(r + h, phi).map((v, i) => (v - polar(r - h, phi)[i]!) / (2 * h));
    const dp = polar(r, phi + h).map((v, i) => (v - polar(r, phi - h)[i]!) / (2 * h));
    expect(J[0][0]).toBeCloseTo(dr[0]!, 6);
    expect(J[1][0]).toBeCloseTo(dr[1]!, 6);
    expect(J[0][1]).toBeCloseTo(dp[0]!, 6);
    expect(J[1][1]).toBeCloseTo(dp[1]!, 6);
    expect(det).toBeCloseTo(r, 12);
  });

  it("точная площадь = r Δr Δφ + ½ Δr² Δφ; отношение → 1", () => {
    for (const d of [0.5, 0.1, 0.01]) {
      const [r, dr, dphi] = [1.2, d, d];
      expect(exactArea(r, dr, dphi) - linearArea(r, dr, dphi)).toBeCloseTo(0.5 * dr * dr * dphi, 12);
    }
    expect(exactArea(1.2, 0.01, 0.01) / linearArea(1.2, 0.01, 0.01)).toBeCloseTo(1, 2);
  });

  it("площадь контура образа (формула шнурка) совпадает с точной", () => {
    const pts = cellImage(1, 0.4, 0.3, 0.5, 400);
    let s = 0;
    for (let i = 0; i < pts.length - 1; i++) s += pts[i]![0] * pts[i + 1]![1] - pts[i + 1]![0] * pts[i]![1];
    expect(Math.abs(s) / 2).toBeCloseTo(exactArea(1, 0.4, 0.5), 4);
  });
});
