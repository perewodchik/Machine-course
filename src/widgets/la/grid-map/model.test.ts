import { describe as group, expect, it } from "vitest";
import { apply, column, compose, describe, det, gridImage, IDENTITY, orientation, PRESETS, unitSquare, type Mat2 } from "./model";

const R: Mat2 = [[0, -1], [1, 0]]; // поворот на 90°
const S: Mat2 = [[2, 0], [0, 1]]; // растяжение по x

group("деформация сетки", () => {
  it("столбцы — образы базисных векторов", () => {
    const A: Mat2 = [[1, 2], [3, 4]];
    expect(apply(A, [1, 0])).toEqual(column(A, 0));
    expect(apply(A, [0, 1])).toEqual(column(A, 1));
    expect(apply(A, [2, -1])).toEqual([0, 2]); // 2·(1, 3) − (2, 4)
  });

  it("композиция: compose(A, B) действует как «сначала B, потом A»; порядок важен", () => {
    const v = [1.5, -2] as const;
    expect(apply(compose(S, R), v)).toEqual(apply(S, apply(R, v)));
    expect(compose(S, R)).toEqual([[0, -2], [1, 0]]);
    expect(compose(R, S)).toEqual([[0, -1], [2, 0]]);
  });

  it("сетка: 2(2n + 1) отрезков, оси отмечены; единичная матрица оставляет сетку на месте", () => {
    const g = gridImage(IDENTITY, 3);
    expect(g).toHaveLength(14);
    expect(g.filter((s) => s.axis)).toHaveLength(2);
    expect(g[0]).toEqual({ from: [-3, -3], to: [-3, 3], axis: false });
  });

  it("площадь образа единичного квадрата — |det A|; знак — ориентация", () => {
    const area = (p: readonly (readonly [number, number])[]) =>
      Math.abs(p.reduce((s, [x, y], i) => s + x * p[(i + 1) % p.length]![1] - p[(i + 1) % p.length]![0] * y, 0)) / 2;
    for (const { matrix } of PRESETS) expect(area(unitSquare(matrix))).toBeCloseTo(Math.abs(det(matrix)));
    expect(PRESETS.map((p) => orientation(p.matrix))).toEqual(["kept", "kept", "kept", "kept", "flipped", "collapsed"]);
  });

  it("описание для скринридера", () => {
    expect(describe([[1, 0], [0, -1]])).toBe(
      "A: первая строка 1, 0; вторая строка 0, −1. e₁ переходит в (1, 0), e₂ — в (0, −1); площадь умножается на 1, ориентация меняется: плоскость отражена.",
    );
    expect(describe([[1, 2], [0.5, 1]])).toMatch(/det A = 0: плоскость сплющена/);
  });
});
