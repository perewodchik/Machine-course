// Двумерное нормальное: плотность интегрируется в 1, выборка воспроизводит Σ, оси эллипса — собственные
// векторы, KL ≥ 0 и равно нулю на совпадающих гауссианах.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { det2, eig2, fit2, kl2, mahalanobis2, pdf2, sample2, sigmaOf } from "./gauss2";
import { rng } from "./rng";

describe("двумерное нормальное", () => {
  it("плотность интегрируется в 1 (сетка 0.05 на квадрате ±8σ)", () => {
    const S = sigmaOf(1.5, 0.8, 0.6);
    let s = 0;
    for (let x = -12; x <= 12; x += 0.05) for (let y = -7; y <= 7; y += 0.05) s += pdf2([x, y], [0.5, -0.3], S) * 0.0025;
    expect(s).toBeCloseTo(1, 3);
  });

  it("выборка из 20 000 точек воспроизводит μ и Σ", () => {
    const S = sigmaOf(2, 0.5, -0.7);
    const { mu, S: F } = fit2(sample2(rng(4), [1, -2], S, 20_000));
    expect(mu[0]).toBeCloseTo(1, 1);
    expect(mu[1]).toBeCloseTo(-2, 1);
    for (let i = 0; i < 3; i++) expect(Math.abs(F[i]! - S[i]!)).toBeLessThan(0.06);
  });

  it("почти диагональная Σ (ρ ≈ 1e−12, σ₁ < σ₂): собственный вектор точный", () => {
    const S = sigmaOf(0.52, 1.96, 1e-12);
    const { l1, u } = eig2(S);
    expect(S[0] * u[0] + S[1] * u[1]).toBeCloseTo(l1 * u[0], 9);
    expect(S[1] * u[0] + S[2] * u[1]).toBeCloseTo(l1 * u[1], 9);
  });

  it("собственный вектор: Σu = λ₁u; λ₁λ₂ = det Σ; вдоль u расстояние Махаланобиса 1 на √λ₁", () => {
    fc.assert(
      fc.property(fc.double({ min: 0.3, max: 3, noNaN: true }), fc.double({ min: 0.3, max: 3, noNaN: true }), fc.double({ min: -0.95, max: 0.95, noNaN: true }), (s1, s2, rho) => {
        const S = sigmaOf(s1, s2, rho);
        const { l1, l2, u } = eig2(S);
        expect(S[0] * u[0] + S[1] * u[1]).toBeCloseTo(l1 * u[0], 9);
        expect(S[1] * u[0] + S[2] * u[1]).toBeCloseTo(l1 * u[1], 9);
        expect(l1 * l2).toBeCloseTo(det2(S), 9);
        const k = Math.sqrt(l1);
        expect(mahalanobis2([k * u[0], k * u[1]], [0, 0], S)).toBeCloseTo(1, 9);
      }),
    );
  });

  it("KL ≥ 0, KL(p ‖ p) = 0", () => {
    const S0 = sigmaOf(1, 2, 0.3);
    expect(kl2([0, 0], S0, [0, 0], S0)).toBeCloseTo(0, 12);
    fc.assert(
      fc.property(fc.double({ min: 0.3, max: 3, noNaN: true }), fc.double({ min: -0.9, max: 0.9, noNaN: true }), fc.double({ min: -2, max: 2, noNaN: true }), (s, rho, m) => {
        expect(kl2([0, 0], S0, [m, 0], sigmaOf(s, 1, rho))).toBeGreaterThanOrEqual(-1e-12);
      }),
    );
  });
});
