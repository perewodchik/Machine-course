// «Спуск по линиям уровня»: θ* — минимум J; пакетный спуск сходится при α < 2/λ_max и расходится выше; после
// стандартизации порог шага растёт, а κ падает; SGD с постоянным шагом остаётся в облаке, с убывающим — ближе к минимуму.
import { describe, expect, it } from "vitest";
import { loss, makeData, problem, run, type Vec2 } from "./model";

const d = makeData();
const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("спуск по линиям уровня", () => {
  it("θ* — минимум: соседние точки хуже", () => {
    for (const st of [false, true]) {
      const p = problem(d, st);
      for (const [a, b] of [[1e-3, 0], [0, 1e-4], [-1e-3, 1e-4]] as const) expect(loss(p, [p.thetaStar[0] + a, p.thetaStar[1] + b])).toBeGreaterThan(p.jStar);
    }
  });

  it("порог 2/λ_max: 0.95 от порога сходится, 1.05 — расходится", () => {
    for (const st of [false, true]) {
      const p = problem(d, st);
      const base = { mode: "batch" as const, batch: 1, decay: false, start: [0, 0] as Vec2 };
      const ok = run(p, { ...base, alpha: (0.95 * 2) / p.lamMax, epochs: st ? 400 : 4000 }).at(-1)!;
      const bad = run(p, { ...base, alpha: (1.05 * 2) / p.lamMax, epochs: 400 }).at(-1)!;
      expect(loss(p, ok)).toBeLessThan(p.jStar * 1.05 + 0.05);
      expect(!Number.isFinite(loss(p, bad)) || loss(p, bad) > 1e3).toBe(true);
    }
  });

  it("стандартизация: порог шага растёт, обусловленность падает до порядка единицы", () => {
    const raw = problem(d, false);
    const std = problem(d, true);
    expect(2 / std.lamMax).toBeGreaterThan(100 * (2 / raw.lamMax));
    expect(std.lamMax / std.lamMin).toBeLessThan(1.01);
    expect(raw.lamMax / raw.lamMin).toBeGreaterThan(1000);
  });

  it("SGD: с постоянным шагом — облако, с убывающим — ближе к минимуму", () => {
    const p = problem(d, true);
    const base = { alpha: 0.3, mode: "sgd" as const, batch: 1, epochs: 30, start: [0, 0] as Vec2 };
    const tail = (path: Vec2[]) => path.slice(-60).reduce((a, q) => a + dist(q, p.thetaStar), 0) / 60;
    expect(tail(run(p, { ...base, decay: true }))).toBeLessThan(tail(run(p, { ...base, decay: false })));
    expect(tail(run(p, { ...base, decay: false }))).toBeGreaterThan(0.05);
  });

  it("числа урока 1.2: без стандартизации порог ≈ 0.0004 и κ > 36 тысяч, путь застревает; после — порог 2, минимум за шаг", () => {
    const raw = problem(d, false);
    expect(2 / raw.lamMax).toBeCloseTo(0.00041, 5);
    expect(raw.lamMax / raw.lamMin).toBeGreaterThan(36_000);
    const stuck = run(raw, { alpha: (0.95 * 2) / raw.lamMax, mode: "batch", batch: 1, epochs: 100, decay: false, start: [0, 0] }).at(-1)!;
    expect(loss(raw, stuck) / raw.jStar).toBeGreaterThan(1.35);
    expect(loss(raw, stuck) / raw.jStar).toBeLessThan(1.45);
    expect(dist(stuck, raw.thetaStar)).toBeGreaterThan(1);
    const std = problem(d, true);
    expect(2 / std.lamMax).toBeCloseTo(2, 6);
    const one = run(std, { alpha: 1, mode: "batch", batch: 1, epochs: 1, decay: false, start: [0, 0] });
    expect(one).toHaveLength(2);
    expect(dist(one[1]!, std.thetaStar)).toBeLessThan(1e-6);
  });
});
