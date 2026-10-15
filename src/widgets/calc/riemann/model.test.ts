// «Сумма прямоугольников»: эталоны интегралов (из Python: math.erf), сходимость сумм и порядок ошибки.
import { describe, expect, it } from "vitest";
import { FNS, rects, riemann, simpson } from "./model";

describe("эталоны", () => {
  it("точные значения интегралов совпадают с Python", () => {
    expect(FNS.square.exact).toBeCloseTo(2.6666666666666665, 12);
    expect(FNS.exp.exact).toBeCloseTo(0.950212931632136, 12);
    // √(2π) · erf(4/√2): почти весь интеграл по прямой, √(2π) ≈ 2.50663
    expect(FNS.gauss.exact).toBeCloseTo(2.506469498570457, 9);
    expect(simpson((x) => x * x, 0, 2)).toBeCloseTo(8 / 3, 12);
  });
});

describe("суммы прямоугольников", () => {
  it("у возрастающей x² левая сумма меньше интеграла, правая — больше", () => {
    expect(riemann(FNS.square, 10, "left")).toBeLessThan(FNS.square.exact);
    expect(riemann(FNS.square, 10, "right")).toBeGreaterThan(FNS.square.exact);
    expect(rects(FNS.square, 4, "mid").map((r) => r.h)).toEqual([0.0625, 0.5625, 1.5625, 3.0625]);
  });

  it("ошибка левой суммы — порядка 1/n, средней — 1/n²", () => {
    for (const fn of Object.values(FNS)) {
      const err = (n: number, rule: "left" | "mid") => Math.abs(riemann(fn, n, rule) - fn.exact);
      if (fn.id !== "gauss") expect(err(10, "left") / err(100, "left")).toBeCloseTo(10, 0);
      expect(err(10, "mid") / err(100, "mid")).toBeGreaterThan(50); // ≈ 100 в пределе
    }
  });

  it("при 64 средних прямоугольниках ошибка меньше 0.001", () => {
    for (const fn of Object.values(FNS)) expect(Math.abs(riemann(fn, 64, "mid") - fn.exact)).toBeLessThan(1e-3);
  });
});
